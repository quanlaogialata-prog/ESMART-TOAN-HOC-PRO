import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, where, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Check, Edit, X, Search } from 'lucide-react';
import MathText from '../../components/MathText';

export default function ManageSubmissions() {
  const { user, role } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [reassignSubId, setReassignSubId] = useState<string | null>(null);
  const [sysMsg, setSysMsg] = useState('');
  const [sysError, setSysError] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [editData, setEditData] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let assignedClassIds: string[] = [];
      if (user) {
        const uDoc = await getDoc(doc(db, 'users', user.uid));
        if (uDoc.exists()) {
          assignedClassIds = uDoc.data().permissions?.assignedClasses || [];
        }
      }

      // Fetch all student users
      const usersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
      const allStudents: any[] = [];
      usersSnap.forEach(d => allStudents.push({ id: d.id, ...d.data() }));

      const asmSnap = await getDocs(collection(db, 'assignments'));
      const asmMap: any = {};
      asmSnap.forEach(d => {
        asmMap[d.id] = d.data();
      });
      setAssignments(asmMap);

      const subQ = query(collection(db, 'submissions'), orderBy('submittedAt', 'desc'));
      const subSnap = await getDocs(subQ);
      const subs: any[] = [];
      const subsMap: any = {};

      subSnap.forEach(d => {
        const subData = d.data();
        const asm = asmMap[subData.assignmentId];
        
        // Filter out if teacher is not admin and assignment belongs to a class they don't manage
        if (role !== 'admin' && asm && asm.classId) {
          if (!assignedClassIds.includes(asm.classId)) {
             return; // Skip this submission
          }
        }
        
        subsMap[`${subData.assignmentId}_${subData.studentId}`] = true;
        subs.push({ id: d.id, ...subData });
      });

      // Find missing submissions for overdue assignments
      Object.keys(asmMap).forEach(asmId => {
        const asm = asmMap[asmId];
        if (role !== 'admin' && asm.classId && !assignedClassIds.includes(asm.classId)) return;
        
        const targetStudents = allStudents.filter(s => s.className === asm.className && Number(s.grade) === Number(asm.grade));
        
        targetStudents.forEach(student => {
          if (!subsMap[`${asmId}_${student.id}`]) {
            const dueDateToUse = asm.extensions && asm.extensions[student.id] ? asm.extensions[student.id] : asm.dueDate;
            if (new Date() > new Date(dueDateToUse)) {
              subs.push({
                id: `overdue-${asmId}-${student.id}`,
                isOverdueFlag: true,
                assignmentId: asmId,
                studentEmail: student.email,
                studentId: student.id,
                score: 0,
                maxScore: asm.testDuration ? 10 : 10,
                submittedAt: null
              });
            }
          }
        });
      });

      setSubmissions(subs);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const confirmReassign = async () => {
    if (!reassignSubId) return;
    try {
      let isDummy = reassignSubId.startsWith('overdue-');
      let asmId = '';
      let sId = '';
      
      if (isDummy) {
        const parts = reassignSubId.split('-');
        asmId = parts[1];
        sId = parts[2];
      } else {
        const subSnap = await getDoc(doc(db, 'submissions', reassignSubId));
        if (subSnap.exists()) {
          asmId = subSnap.data().assignmentId;
          sId = subSnap.data().studentId;
        }
        await deleteDoc(doc(db, 'submissions', reassignSubId));
      }

      if (asmId && sId) {
        const asmRef = doc(db, 'assignments', asmId);
        const aSnap = await getDoc(asmRef);
        if (aSnap.exists()) {
           const aData = aSnap.data();
           const currentDueDate = aData.extensions && aData.extensions[sId] ? aData.extensions[sId] : aData.dueDate;
           if (new Date() > new Date(currentDueDate)) {
              const ext = aData.extensions || {};
              const nextDay = new Date();
              nextDay.setDate(nextDay.getDate() + 1); // extend by 24h
              ext[sId] = nextDay.toISOString();
              await updateDoc(asmRef, { extensions: ext });
           }
        }
      }

      setSysMsg('Đã giao lại bài thành công! Học sinh được gia hạn thêm 1 ngày để làm lại.');
      setTimeout(() => setSysMsg(''), 3000);
      setReassignSubId(null);
      fetchData();
    } catch (e) {
      console.error(e);
      setSysError('Có lỗi xảy ra khi xóa bài.');
      setTimeout(() => setSysError(''), 3000);
    }
  };

  const openSubmission = (sub: any) => {
    setSelectedSubmission(sub);
    setEditData(JSON.parse(JSON.stringify(sub.feedback || [])));
  };

  const handleUpdateGrade = (index: number, field: string, value: any) => {
    const newData = [...editData];
    newData[index][field] = value;
    setEditData(newData);
  };

  const saveGrades = async () => {
    if (!selectedSubmission) return;
    try {
      let newTotal = 0;
      editData.forEach(item => {
        newTotal += Number(item.score) || 0;
      });
      
      await updateDoc(doc(db, 'submissions', selectedSubmission.id), {
        feedback: editData,
        score: newTotal
      });
      setSysMsg('Đã cập nhật điểm thành công!'); setTimeout(() => setSysMsg(''), 3000);
      setSelectedSubmission(null);
      fetchData();
    } catch (e) {
      console.error(e);
      setSysError('Có lỗi xảy ra khi lưu.'); setTimeout(() => setSysError(''), 3000);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>;

  return (
    <div className="space-y-6">
      {sysMsg && <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg">{sysMsg}</div>}
      {sysError && <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">{sysError}</div>}
      
      {reassignSubId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Giao lại bài tập</h3>
            <p className="text-gray-600 text-sm mb-6">Bạn có chắc chắn muốn giao lại bài này cho học sinh? <b>Bài làm hiện tại của học sinh sẽ bị xóa.</b></p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setReassignSubId(null)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={confirmReassign}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Chắc chắn xóa & Giao lại
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý & Chấm điểm bài làm</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm">
              <th className="p-4 font-semibold">Học sinh</th>
              <th className="p-4 font-semibold">Bài kiểm tra</th>
              <th className="p-4 font-semibold">Thời gian nộp</th>
              <th className="p-4 font-semibold">Điểm số</th>
              <th className="p-4 font-semibold text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map(sub => {
              const asm = assignments[sub.assignmentId];
              const date = sub.isOverdueFlag ? 'Chưa nộp' : new Date(sub.submittedAt).toLocaleString('vi-VN');
              return (
                <tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-medium text-gray-800">{sub.studentEmail}</div>
                  </td>
                  <td className="p-4 text-gray-600">{asm?.testTitle || 'Bài kiểm tra không xác định'}</td>
                  <td className="p-4 text-gray-600 text-sm">{date}</td>
                  <td className="p-4">
                    {sub.isOverdueFlag ? (
                      <span className="text-gray-400 font-medium text-sm">-- / --</span>
                    ) : (
                      <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 font-bold rounded-lg text-sm">
                        {Number(sub.score || 0).toFixed(2)} / {sub.maxScore}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {sub.isOverdueFlag ? (
                        <div className="inline-flex px-3 py-1 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm font-medium items-center">
                           Quá hạn
                        </div>
                    ) : (
                        <button 
                          onClick={() => openSubmission(sub)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2"
                        >
                          <Edit size={16} /> Chấm bài
                        </button>
                    )}
                    <button 
                      onClick={() => setReassignSubId(sub.id)}
                      title="Giao lại bài"
                      className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2 ml-2"
                    >
                      <X size={16} /> Giao lại
                    </button>
                  </td>
                </tr>
              );
            })}
            {submissions.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">Chưa có bài nộp nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b shrink-0">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Chấm bài: {selectedSubmission.studentEmail}</h3>
                <p className="text-gray-500 text-sm mt-1">{assignments[selectedSubmission.assignmentId]?.testTitle} - Nộp lúc: {new Date(selectedSubmission.submittedAt).toLocaleString('vi-VN')}</p>
              </div>
              <button onClick={() => setSelectedSubmission(null)} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-gray-50">
              {editData.map((item: any, idx: number) => (
                <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <div className="mb-4">
                    <div className="font-semibold text-gray-800 mb-2">Câu hỏi: <span className="font-normal text-gray-700"><MathText content={item.question || ''} /></span></div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mt-2">
                      <span className="font-medium text-gray-700 block mb-1">Bài làm của học sinh:</span>
                      <div className="text-gray-800 break-words">
                        {item.studentAnswer ? <MathText content={item.studentAnswer} /> : '(Không có nội dung chữ)'}
                      </div>
                      {item.hasFile && (
                        <div className="mt-2 text-blue-600 text-sm italic">
                          * Học sinh có đính kèm tệp/ảnh.
                        </div>
                      )}
                      {item.fileDataUrl && (
                        <div className="mt-3">
                          <img src={item.fileDataUrl} alt="Bài làm" className="max-w-full h-auto rounded-lg border border-gray-200" style={{ maxHeight: '400px' }} />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                    <div className="md:col-span-1">
                      <label className="block text-sm font-bold text-gray-700 mb-1">Điểm ({item.maxScore} đ)</label>
                      <input 
                        type="number"
                        min="0"
                        max={item.maxScore}
                        step="0.1"
                        value={item.score}
                        onChange={(e) => handleUpdateGrade(idx, 'score', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-sm font-bold text-gray-700 mb-1">Nhận xét</label>
                      <textarea 
                        rows={3}
                        value={item.feedback}
                        onChange={(e) => handleUpdateGrade(idx, 'feedback', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t shrink-0 flex justify-between items-center bg-white rounded-b-2xl">
              <div className="font-bold text-lg text-gray-800">
                Tổng điểm mới: <span className="text-blue-600">{editData.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0).toFixed(2)}</span> / {selectedSubmission.maxScore}
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setSelectedSubmission(null)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={saveGrades}
                  className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Check size={18} /> Lưu điểm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
