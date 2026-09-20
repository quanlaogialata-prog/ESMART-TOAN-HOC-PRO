import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, where, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Check, Edit, X, Search, Sparkles, RefreshCw, Filter, Award, Trash2 } from 'lucide-react';
import MathText from '../../components/MathText';
import { gradeQuestion } from '../../utils/gradeEngine';
import CancelAssignmentModal from '../../components/teacher/CancelAssignmentModal';

export default function ManageSubmissions() {
  const { user, role } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any>({});
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reassignSubId, setReassignSubId] = useState<string | null>(null);
  const [sysMsg, setSysMsg] = useState('');
  const [sysError, setSysError] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [editData, setEditData] = useState<any[]>([]);
  const [filterAssignmentId, setFilterAssignmentId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRegrading, setIsRegrading] = useState<boolean>(false);
  const [assignmentToCancel, setAssignmentToCancel] = useState<any | null>(null);
  const [isCancellingAssignment, setIsCancellingAssignment] = useState<boolean>(false);

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
      setStudents(allStudents);

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

      const studentIdMap = {};
      allStudents.forEach(s => studentIdMap[s.id] = s);

      subSnap.forEach(d => {
        const subData = d.data();
        const asm = asmMap[subData.assignmentId];
        
        // Skip submission if student no longer exists
        if (!studentIdMap[subData.studentId]) {
          return;
        }

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

  const getQuestionsForSubmission = async (sub: any, testCache: Record<string, any>) => {
    const asm = assignments[sub.assignmentId];
    if (!asm || !asm.testId) return [];
    
    let test = testCache[asm.testId];
    if (!test) {
      const tSnap = await getDoc(doc(db, 'tests', asm.testId));
      if (!tSnap.exists()) return [];
      test = tSnap.data();
      testCache[asm.testId] = test;
    }

    let parsedQuestions: any[] = [];
    if (sub.variantCode) {
      const variantsList = asm.variants || test.variants || [];
      const matchedVariant = variantsList.find((v: any) => v.code === sub.variantCode);
      if (matchedVariant && Array.isArray(matchedVariant.questions) && matchedVariant.questions.length > 0) {
        parsedQuestions = matchedVariant.questions;
      }
    }

    if (parsedQuestions.length === 0) {
      if (Array.isArray(test.questions) && test.questions.length > 0) {
        parsedQuestions = test.questions;
      } else if (test.questionsData) {
        try {
          const parsed = JSON.parse(test.questionsData);
          if (Array.isArray(parsed)) parsedQuestions = parsed;
          else if (parsed && Array.isArray(parsed.questions)) parsedQuestions = parsed.questions;
        } catch (e) {}
      }
    }

    return parsedQuestions.map((q: any, i: number) => ({
      ...q,
      id: q.id || `q${i}`,
      type: (q.type || 'mcq').toString().toLowerCase().trim()
    }));
  };

  const regradeFilteredSubmissions = async () => {
    const targetSubs = filteredSubmissions.filter(s => !s.isOverdueFlag);
    if (targetSubs.length === 0) {
      setSysMsg('Không có bài nộp nào để chấm lại.');
      setTimeout(() => setSysMsg(''), 3000);
      return;
    }

    setIsRegrading(true);
    setSysMsg(`Đang tiến hành chấm lại tự động ${targetSubs.length} bài nộp theo đáp án chuẩn...`);
    try {
      const testCache: Record<string, any> = {};
      let updatedCount = 0;

      for (const sub of targetSubs) {
        const questionsList = await getQuestionsForSubmission(sub, testCache);
        if (!questionsList || questionsList.length === 0) continue;

        let newTotal = 0;
        let newMcq = 0;
        let newEssay = 0;
        const updatedFeedback = [...(sub.feedback || [])];

        questionsList.forEach((q: any, idx: number) => {
          const oldFb = updatedFeedback[idx] || {};
          const stAns = oldFb.studentAnswer ?? sub.answers?.[q.id] ?? sub.answers?.[`q${idx}`] ?? sub.answers?.[idx] ?? '';

          if (q.type !== 'essay') {
            const fresh = gradeQuestion(q, stAns);
            updatedFeedback[idx] = {
              ...oldFb,
              questionId: q.id,
              question: q.question || '',
              type: q.type,
              studentAnswer: stAns,
              score: fresh.score,
              maxScore: fresh.maxScore,
              feedback: fresh.feedback,
              correctAnswer: fresh.correctAnswerDisplay || q.correctAnswer || '',
              explanation: q.explanation || oldFb.explanation || ''
            };
            newMcq += fresh.score;
            newTotal += fresh.score;
          } else {
            const eScore = Number(oldFb.score || 0);
            newEssay += eScore;
            newTotal += eScore;
          }
        });

        await updateDoc(doc(db, 'submissions', sub.id), {
          score: Math.round(newTotal * 100) / 100,
          mcqScore: Math.round(newMcq * 100) / 100,
          essayScore: Math.round(newEssay * 100) / 100,
          feedback: updatedFeedback
        });
        updatedCount++;
      }

      setSysMsg(`Hoàn tất! Đã chấm lại chính xác ${updatedCount} bài làm theo đáp án.`);
      setTimeout(() => setSysMsg(''), 4000);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setSysError('Lỗi khi chấm lại: ' + (err?.message || err));
      setTimeout(() => setSysError(''), 4000);
    } finally {
      setIsRegrading(false);
    }
  };

  const handleCancelAssignment = async (assignmentId: string) => {
    if (!assignmentId) return;
    setIsCancellingAssignment(true);
    setSysMsg('Đang hủy giao bài...');
    try {
      const qSub = query(collection(db, 'submissions'), where('assignmentId', '==', assignmentId));
      const subSnap = await getDocs(qSub);
      const deletePromises = subSnap.docs.map(sDoc => deleteDoc(doc(db, 'submissions', sDoc.id)));
      deletePromises.push(deleteDoc(doc(db, 'assignments', assignmentId)));
      await Promise.all(deletePromises);

      const clsName = assignmentToCancel?.className || '';
      setSysMsg(`Đã hủy giao bài cho lớp ${clsName} thành công!`);
      setTimeout(() => setSysMsg(''), 4000);
      setFilterAssignmentId('all');
      setAssignmentToCancel(null);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setSysError('Lỗi khi hủy giao bài: ' + (err?.message || 'Không thể xóa dữ liệu'));
      setTimeout(() => setSysError(''), 4000);
    } finally {
      setIsCancellingAssignment(false);
    }
  };

  const regradeCurrentModalSubmission = async () => {
    if (!selectedSubmission) return;
    try {
      const testCache: Record<string, any> = {};
      const questionsList = await getQuestionsForSubmission(selectedSubmission, testCache);
      if (!questionsList || questionsList.length === 0) {
        setSysError('Không tìm thấy danh sách câu hỏi của đề này để tự động tính điểm.');
        setTimeout(() => setSysError(''), 3000);
        return;
      }

      const newEditData = [...editData];
      questionsList.forEach((q: any, idx: number) => {
        const curItem = newEditData[idx] || {};
        const stAns = curItem.studentAnswer ?? selectedSubmission.answers?.[q.id] ?? selectedSubmission.answers?.[`q${idx}`] ?? selectedSubmission.answers?.[idx] ?? '';

        if (q.type !== 'essay') {
          const evaluated = gradeQuestion(q, stAns);
          newEditData[idx] = {
            ...curItem,
            questionId: q.id,
            question: q.question || curItem.question || '',
            type: q.type,
            studentAnswer: stAns,
            score: evaluated.score,
            maxScore: evaluated.maxScore,
            feedback: evaluated.feedback,
            correctAnswer: evaluated.correctAnswerDisplay || q.correctAnswer || curItem.correctAnswer || '',
            explanation: q.explanation || curItem.explanation || ''
          };
        }
      });

      setEditData(newEditData);
      setSysMsg('Đã tự động tính lại điểm theo đáp án chuẩn! Vui lòng nhấn "Lưu điểm" để cập nhật.');
      setTimeout(() => setSysMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      setSysError('Lỗi tính điểm: ' + (err?.message || err));
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

  const filteredSubmissions = submissions.filter(sub => {
    if (filterAssignmentId !== 'all' && sub.assignmentId !== filterAssignmentId) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const studentEmail = (sub.studentEmail || '').toLowerCase();
      const asmTitle = (assignments[sub.assignmentId]?.testTitle || '').toLowerCase();
      const vCode = (sub.variantCode || '').toLowerCase();
      return studentEmail.includes(q) || asmTitle.includes(q) || vCode.includes(q);
    }
    return true;
  });

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

      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Quản lý & Chấm điểm bài làm</h2>
          <p className="text-sm text-gray-500 mt-1">
            Theo dõi, kiểm tra chi tiết và chấm điểm chính xác theo định dạng Bộ GD&ĐT
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={regradeFilteredSubmissions}
            disabled={isRegrading || filteredSubmissions.filter(s => !s.isOverdueFlag).length === 0}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            title="Tự động so khớp lại toàn bộ đáp án của học sinh với đáp án gốc của đề thi"
          >
            {isRegrading ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            ⚡ Chấm lại tự động theo đáp án chuẩn
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-center gap-4">
        <div className="w-full md:w-auto flex items-center gap-2">
          <Filter size={18} className="text-gray-400 shrink-0" />
          <select
            value={filterAssignmentId}
            onChange={(e) => setFilterAssignmentId(e.target.value)}
            className="w-full md:w-64 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Tất cả bài tập & bài kiểm tra</option>
            {Object.entries(assignments).map(([id, a]: any) => (
              <option key={id} value={id}>
                {a.testTitle || 'Bài kiểm tra'} ({a.className || 'Chung'})
              </option>
            ))}
          </select>
          {filterAssignmentId !== 'all' && assignments[filterAssignmentId] && (
            <button
              type="button"
              onClick={() => setAssignmentToCancel({ id: filterAssignmentId, ...assignments[filterAssignmentId] })}
              className="px-3 py-2 text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer shadow-2xs"
              title="Hủy giao đợt bài tập này cho học sinh"
            >
              <Trash2 size={14} />
              <span>Hủy giao bài</span>
            </button>
          )}
        </div>

        <div className="w-full md:flex-1 relative">
          <Search size={18} className="text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo email học sinh, bài kiểm tra, mã đề..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="text-xs text-gray-500 font-semibold px-2 shrink-0">
          Hiển thị {filteredSubmissions.length} bài làm
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full relative">
        <div className="overflow-x-auto w-full" style={{ WebkitOverflowScrolling: "touch" }}>
        <table className="w-full min-w-[800px] text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm">
              <th className="p-4 font-semibold">Học sinh</th>
              <th className="p-4 font-semibold">Bài kiểm tra</th>
              <th className="p-4 font-semibold">Thời gian nộp</th>
              <th className="p-4 font-semibold">Điểm số</th>
              <th className="p-4 font-semibold text-center sticky right-0 bg-gray-100 z-10 shadow-[-12px_0_15px_-5px_rgba(0,0,0,0.05)] border-l border-gray-200">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubmissions.map(sub => {
              const asm = assignments[sub.assignmentId];
              const date = sub.isOverdueFlag ? 'Chưa nộp' : new Date(sub.submittedAt).toLocaleString('vi-VN');
              return (
                <tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50 group">
                  <td className="p-4">
                    <div className="font-medium text-gray-800">{sub.studentEmail}</div>
                    {sub.variantCode && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-full">
                        Mã đề: {sub.variantCode}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-gray-600 font-medium">{asm?.testTitle || 'Bài kiểm tra không xác định'}</td>
                  <td className="p-4 text-gray-600 text-sm">{date}</td>
                  <td className="p-4">
                    {sub.isOverdueFlag ? (
                      <span className="text-gray-400 font-medium text-sm">-- / --</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 font-bold rounded-lg text-sm border border-blue-100">
                          {Number(sub.score || 0).toFixed(2)} / {sub.maxScore}
                        </span>
                        {sub.mcqScore !== undefined && (
                          <span className="text-xs text-gray-400">
                            (TN: {Number(sub.mcqScore || 0).toFixed(2)})
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-center sticky right-0 bg-white z-10 shadow-[-12px_0_15px_-5px_rgba(0,0,0,0.05)] border-l border-gray-100 group-hover:bg-gray-50">
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
            {filteredSubmissions.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500 font-medium">Không tìm thấy bài nộp nào phù hợp.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b shrink-0 bg-gray-50/50 rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span>Chấm bài: {selectedSubmission.studentEmail}</span>
                  {selectedSubmission.variantCode && (
                    <span className="text-xs px-2.5 py-0.5 bg-indigo-100 text-indigo-800 font-bold rounded-full">
                      Mã đề: {selectedSubmission.variantCode}
                    </span>
                  )}
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  {assignments[selectedSubmission.assignmentId]?.testTitle} - Nộp lúc: {new Date(selectedSubmission.submittedAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={regradeCurrentModalSubmission}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  title="Tính lại điểm cho bài này theo đáp án chuẩn của đề thi"
                >
                  <Sparkles size={14} /> Tính lại theo đáp án chuẩn
                </button>
                <button onClick={() => setSelectedSubmission(null)} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-gray-50">
              {editData.map((item: any, idx: number) => (
                <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <div className="mb-4">
                    <div className="font-bold text-gray-800 mb-2 flex items-start justify-between gap-3">
                      <div>
                        Câu {idx + 1}: <span className="font-normal text-gray-700"><MathText content={item.question || ''} /></span>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded shrink-0">
                        {item.type ? item.type.toUpperCase() : 'CÂU HỎI'}
                      </span>
                    </div>
                    
                    <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 mt-2 space-y-2">
                      <div>
                        <span className="font-bold text-xs uppercase tracking-wider text-gray-500 block mb-1">Bài làm của học sinh:</span>
                        <div className="text-gray-900 font-medium break-words bg-white p-2.5 rounded border border-gray-200 text-sm">
                          {item.studentAnswer ? <MathText content={item.studentAnswer} /> : '(Không có nội dung chữ)'}
                        </div>
                      </div>

                      {item.correctAnswer && (
                        <div>
                          <span className="font-bold text-xs uppercase tracking-wider text-emerald-700 block mb-1">Đáp án đúng / Hướng dẫn chấm:</span>
                          <div className="text-emerald-900 bg-emerald-50/60 p-2.5 rounded border border-emerald-200 text-sm font-semibold">
                            <MathText content={item.correctAnswer} />
                          </div>
                        </div>
                      )}

                      {item.hasFile && (
                        <div className="text-blue-600 text-xs italic font-medium">
                          * Học sinh có đính kèm tệp/ảnh làm bài.
                        </div>
                      )}
                      {item.fileDataUrl && (
                        <div className="mt-3">
                          <img src={item.fileDataUrl} alt="Bài làm" className="max-w-full h-auto rounded-lg border border-gray-200" style={{ maxHeight: '400px' }} />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start pt-2 border-t border-gray-100">
                    <div className="md:col-span-1">
                      <label className="block text-xs font-bold text-gray-700 mb-1">Điểm số (Tối đa: {item.maxScore} đ)</label>
                      <input 
                        type="number"
                        min="0"
                        max={item.maxScore}
                        step="0.05"
                        value={item.score}
                        onChange={(e) => handleUpdateGrade(idx, 'score', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-700 text-sm"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs font-bold text-gray-700 mb-1">Nhận xét / Lời giải</label>
                      <textarea 
                        rows={2}
                        value={item.feedback}
                        onChange={(e) => handleUpdateGrade(idx, 'feedback', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y text-xs sm:text-sm"
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
                  className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Check size={18} /> Lưu điểm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Assignment Modal */}
      {assignmentToCancel && (
        <CancelAssignmentModal
          isOpen={Boolean(assignmentToCancel)}
          onClose={() => setAssignmentToCancel(null)}
          assignment={assignmentToCancel}
          submissionCount={submissions.filter(s => s.assignmentId === assignmentToCancel.id).length}
          studentCount={students.filter(s => s.className === assignmentToCancel.className).length}
          onConfirmCancel={handleCancelAssignment}
          isProcessing={isCancellingAssignment}
        />
      )}
    </div>
  );
}
