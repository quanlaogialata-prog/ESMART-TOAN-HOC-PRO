import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Download, FileText, Calendar, Filter, Users } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// Need this to support UTF-8 in PDF if possible, but jsPDF base font doesn't support Vietnamese well.
// We might need to use standard English ASCII mapping or base64 font.
// Since we don't have a font file, we'll try standard text, or strip diacritics.

export default function Gradebook() {
  const { user, role } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  
  const [students, setStudents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  
  const [timeFilter, setTimeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  
  const [teacherName, setTeacherName] = useState('');
  
  const [showTestPdfModal, setShowTestPdfModal] = useState(false);
  const [exportTestId, setExportTestId] = useState('');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      let assignedClassIds: string[] = [];
      let tName = user.displayName || 'Giáo viên';
      if (role === 'teacher') {
        const uDoc = await getDoc(doc(db, 'users', user.uid));
        if (uDoc.exists()) {
          assignedClassIds = uDoc.data().permissions?.assignedClasses || [];
          tName = uDoc.data().displayName || tName;
        }
      } else if (role === 'admin') {
        const uDoc = await getDoc(doc(db, 'users', user.uid));
        if (uDoc.exists()) tName = uDoc.data().displayName || tName;
      }
      setTeacherName(tName);

      const clsSnap = await getDocs(collection(db, 'classes'));
      let clsData = clsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      
      if (role === 'teacher') {
        clsData = clsData.filter(c => assignedClassIds.includes(c.id));
      }
      setClasses(clsData);
      
      if (clsData.length > 0) {
        setSelectedClassId(clsData[0].id);
      }
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClassId) {
      loadClassData(selectedClassId);
    }
  }, [selectedClassId]);

  const loadClassData = async (classId: string) => {
    try {
      const selectedCls = classes.find(c => c.id === classId);
      if (!selectedCls) return;

      const stuSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student'), where('className', '==', selectedCls.name)));
      const stuData = stuSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setStudents(stuData);

      const asmSnap = await getDocs(query(collection(db, 'assignments'), where('classId', '==', classId)));
      const asmData = asmSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setAssignments(asmData);

      const subSnap = await getDocs(collection(db, 'submissions'));
      const subData = subSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      
      const classAssignmentIds = asmData.map(a => a.id);
      const classSubData = subData.filter(s => classAssignmentIds.includes(s.assignmentId));
      
      setSubmissions(classSubData);
    } catch (error) {
      console.error(error);
    }
  };
  
  const removeVietnameseTones = (str: string) => {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a"); 
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e"); 
    str = str.replace(/ì|í|ị|ỉ|ĩ/g,"i"); 
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o"); 
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u"); 
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y"); 
    str = str.replace(/đ/g,"d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    return str;
  }

  const getFilteredAssignments = () => {
    const now = new Date();
    return assignments.filter(a => {
      if (!a.createdAt) return false;
      const d = new Date(a.createdAt);
      if (timeFilter === 'week') {
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        return now.getTime() - d.getTime() < oneWeek;
      }
      if (timeFilter === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (timeFilter === 'semester') {
        const month = now.getMonth() + 1;
        const sem1 = [8, 9, 10, 11, 12, 1];
        const sem2 = [2, 3, 4, 5, 6, 7];
        const dMonth = d.getMonth() + 1;
        if (sem1.includes(month) && sem1.includes(dMonth)) return true;
        if (sem2.includes(month) && sem2.includes(dMonth)) return true;
        return false;
      }
      return true;
    });
  };

  const filteredAssignments = getFilteredAssignments();
  
  const getStudentStats = (studentId: string) => {
    const studentSubs = submissions.filter(s => s.studentId === studentId && filteredAssignments.some(a => a.id === s.assignmentId));
    if (studentSubs.length === 0) return { avg: '-', count: 0, subs: [] };
    
    let total = 0;
    studentSubs.forEach(s => {
      total += Number(s.score) || 0;
    });
    
    return {
      avg: (total / studentSubs.length).toFixed(1),
      count: studentSubs.length,
      subs: studentSubs
    };
  };

  const handleDownloadTestPdf = () => {
    const asm = assignments.find(a => a.id === exportTestId);
    const cls = classes.find(c => c.id === selectedClassId);
    if (!asm || !cls) return;

    const doc = new jsPDF();
    const title = removeVietnameseTones(`Ket qua bai kiem tra: ${asm.testTitle || 'Khong ten'}`);
    const teacher = removeVietnameseTones(`Giao vien giao bai: ${teacherName}`);
    const classNameStr = removeVietnameseTones(`Lop: ${cls.name}`);

    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(12);
    doc.text(teacher, 14, 30);
    doc.text(classNameStr, 14, 38);

    const tableData = students.map((s, idx) => {
      const sub = submissions.find(x => x.assignmentId === asm.id && x.studentId === s.id);
      const score = sub ? sub.score : 'Chua lam';
      return [
        idx + 1,
        removeVietnameseTones(s.displayName || 'Khong ten'),
        removeVietnameseTones(s.email || ''),
        score
      ];
    });

    autoTable(doc, {
      startY: 45,
      head: [['STT', removeVietnameseTones('Ho ten'), 'Email', removeVietnameseTones('Diem')]],
      body: tableData,
    });

    doc.save(`Ket_qua_bai_kiem_tra_${removeVietnameseTones(asm.testTitle || 'Kiem_tra')}.pdf`);
    setShowTestPdfModal(false);
  };

  const handleDownloadPeriodPdf = () => {
    const cls = classes.find(c => c.id === selectedClassId);
    if (!cls) return;

    const doc = new jsPDF();
    let timeText = 'Tat ca';
    if (timeFilter === 'week') timeText = 'Tuan nay';
    if (timeFilter === 'month') timeText = 'Thang nay';
    if (timeFilter === 'semester') timeText = 'Hoc ky nay';

    const title = removeVietnameseTones(`Tong hop ket qua hoc tap`);
    const timeStr = removeVietnameseTones(`Thoi gian: ${timeText}`);
    const classNameStr = removeVietnameseTones(`Lop: ${cls.name}`);
    const teacher = removeVietnameseTones(`Giao vien: ${teacherName}`);

    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(12);
    doc.text(timeStr, 14, 30);
    doc.text(classNameStr, 14, 38);
    doc.text(teacher, 14, 46);

    const tableData = students.map((s, idx) => {
      const stats = getStudentStats(s.id);
      return [
        idx + 1,
        removeVietnameseTones(s.displayName || 'Khong ten'),
        stats.count,
        stats.avg
      ];
    });

    autoTable(doc, {
      startY: 55,
      head: [['STT', removeVietnameseTones('Ho ten'), removeVietnameseTones('So bai da lam'), removeVietnameseTones('Diem trung binh')]],
      body: tableData,
    });

    doc.save(`Tong_hop_ket_qua_${timeText}_Lop_${removeVietnameseTones(cls.name)}.pdf`);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>;
  }

  if (classes.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-gray-200">
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có lớp học nào</h3>
        <p className="text-gray-500">Bạn chưa được phân công lớp học nào hoặc chưa có lớp học trong hệ thống.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="text-blue-600" />
            Sổ Theo Dõi Học Tập
          </h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý và thống kê điểm học sinh</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Lớp:</label>
            <select 
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Thời gian:</label>
            <select 
              value={timeFilter}
              onChange={e => setTimeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="week">Tuần này</option>
              <option value="month">Tháng này</option>
              <option value="semester">Học kỳ này</option>
              <option value="all">Tất cả</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setShowTestPdfModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors"
        >
          <Download size={18} />
          Tải xuống bảng điểm bài kiểm tra
        </button>
        <button
          onClick={handleDownloadPeriodPdf}
          className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg font-medium hover:bg-green-100 transition-colors"
        >
          <Download size={18} />
          Tải xuống kết quả {timeFilter === 'week' ? 'tuần' : timeFilter === 'month' ? 'tháng' : timeFilter === 'semester' ? 'học kỳ' : 'tất cả'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm">
              <th className="px-6 py-4 font-medium">Họ và Tên</th>
              <th className="px-6 py-4 font-medium text-center">Số bài làm</th>
              <th className="px-6 py-4 font-medium text-center">Điểm TB</th>
              <th className="px-6 py-4 font-medium">Lịch sử làm bài ({filteredAssignments.length} bài)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  Không có học sinh nào trong lớp này
                </td>
              </tr>
            )}
            {students.map(student => {
              const stats = getStudentStats(student.id);
              return (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800">{student.displayName || student.email}</td>
                  <td className="px-6 py-4 text-center">{stats.count}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-bold ${stats.avg === '-' ? 'text-gray-400' : Number(stats.avg) >= 8 ? 'text-green-600' : Number(stats.avg) >= 5 ? 'text-orange-500' : 'text-red-500'}`}>
                      {stats.avg}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {stats.subs.slice(0, 3).map((sub: any) => {
                        const a = assignments.find(x => x.id === sub.assignmentId);
                        return (
                          <div key={sub.id} className="text-xs text-gray-600 truncate max-w-[200px]" title={a?.testTitle}>
                            • {a?.testTitle || 'Bài kiểm tra'}: <strong className="text-gray-800">{sub.score}đ</strong>
                          </div>
                        );
                      })}
                      {stats.subs.length > 3 && <div className="text-xs text-gray-400 italic">...và {stats.subs.length - 3} bài khác</div>}
                      {stats.subs.length === 0 && <span className="text-gray-400 italic text-xs">Chưa làm bài nào</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showTestPdfModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Download size={20} className="text-blue-600"/> Tải xuống bảng điểm bài kiểm tra
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Chỉ hiển thị các bài kiểm tra được giao trong thời gian: <strong>{timeFilter === 'week' ? 'Tuần này' : timeFilter === 'month' ? 'Tháng này' : timeFilter === 'semester' ? 'Học kỳ này' : 'Tất cả'}</strong>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chọn bài kiểm tra</label>
                <select 
                  value={exportTestId}
                  onChange={e => setExportTestId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">-- Chọn bài kiểm tra --</option>
                  {filteredAssignments.map(a => (
                    <option key={a.id} value={a.id}>{a.testTitle || 'Không tên'}</option>
                  ))}
                  {filteredAssignments.length === 0 && (
                    <option value="" disabled>Không có bài nào trong khoảng thời gian này</option>
                  )}
                </select>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button 
                  onClick={() => setShowTestPdfModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Đóng
                </button>
                <button 
                  onClick={handleDownloadTestPdf}
                  disabled={!exportTestId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  Tải file PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
