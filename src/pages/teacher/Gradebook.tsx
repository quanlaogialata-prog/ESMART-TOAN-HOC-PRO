import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Download, FileText, Calendar, Filter, Users, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import ExportStudentAccountsModal from '../../components/ExportStudentAccountsModal';
import { 
  exportGradebookPdf, 
  exportGradebookExcel, 
  exportPeriodSummaryPdf, 
  exportPeriodSummaryExcel 
} from '../../utils/gradebookExport';

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
  const [showExportAccountsModal, setShowExportAccountsModal] = useState(false);

  // Trạng thái xuất file
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgressText, setExportProgressText] = useState('');
  const [exportError, setExportError] = useState('');
  const [exportSuccess, setExportSuccess] = useState('');

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
      const studentIdMap = {};
      stuData.forEach(s => studentIdMap[s.id] = true);

      const classSubData = subData.filter(s => 
        classAssignmentIds.includes(s.assignmentId) && 
        studentIdMap[s.studentId]
      );
      
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

  
  
  
  const handleDownloadTestPdf = async () => {
    const asm = assignments.find(a => a.id === exportTestId);
    const cls = classes.find(c => c.id === selectedClassId);
    if (!asm || !cls) return;

    setIsExporting(true);
    setExportProgressText('Đang khởi tạo PDF bài kiểm tra...');
    setExportError('');
    try {
      await exportGradebookPdf(
        students,
        submissions,
        asm,
        teacherName || user?.displayName || user?.email || 'Giáo viên',
        (msg) => setExportProgressText(msg)
      );
      setExportSuccess('Xuất bảng điểm PDF thành công!');
      setTimeout(() => setExportSuccess(''), 4000);
      setShowTestPdfModal(false);
    } catch (err: any) {
      console.error('PDF export error:', err);
      setExportError('Lỗi xuất PDF: ' + (err?.message || 'Không thể tạo file'));
    } finally {
      setIsExporting(false);
      setExportProgressText('');
    }
  };

  const handleDownloadTestExcel = () => {
    const asm = assignments.find(a => a.id === exportTestId);
    const cls = classes.find(c => c.id === selectedClassId);
    if (!asm || !cls) return;

    try {
      exportGradebookExcel(
        students,
        submissions,
        asm,
        teacherName || user?.displayName || user?.email || 'Giáo viên'
      );
      setExportSuccess('Xuất bảng điểm Excel thành công!');
      setTimeout(() => setExportSuccess(''), 4000);
      setShowTestPdfModal(false);
    } catch (err: any) {
      console.error('Excel export error:', err);
      setExportError('Lỗi xuất Excel: ' + (err?.message || 'Không thể tạo file'));
    }
  };

  const handleDownloadPeriodPdf = async () => {
    const cls = classes.find(c => c.id === selectedClassId);
    if (!cls) return;

    let timeText = 'Tất cả';
    if (timeFilter === 'week') timeText = 'Tuần này';
    if (timeFilter === 'month') timeText = 'Tháng này';
    if (timeFilter === 'semester') timeText = 'Học kỳ này';

    setIsExporting(true);
    setExportProgressText('Đang khởi tạo PDF tổng hợp...');
    setExportError('');
    try {
      await exportPeriodSummaryPdf(
        students,
        getStudentStats,
        cls.name,
        timeText,
        teacherName || user?.displayName || user?.email || 'Giáo viên',
        (msg) => setExportProgressText(msg)
      );
      setExportSuccess('Xuất PDF tổng hợp thành công!');
      setTimeout(() => setExportSuccess(''), 4000);
    } catch (err: any) {
      console.error('PDF export error:', err);
      setExportError('Lỗi xuất PDF: ' + (err?.message || 'Không thể tạo file'));
    } finally {
      setIsExporting(false);
      setExportProgressText('');
    }
  };

  const handleDownloadPeriodExcel = () => {
    const cls = classes.find(c => c.id === selectedClassId);
    if (!cls) return;

    let timeText = 'Tất cả';
    if (timeFilter === 'week') timeText = 'Tuần này';
    if (timeFilter === 'month') timeText = 'Tháng này';
    if (timeFilter === 'semester') timeText = 'Học kỳ này';

    try {
      exportPeriodSummaryExcel(
        students,
        getStudentStats,
        cls.name,
        timeText,
        teacherName || user?.displayName || user?.email || 'Giáo viên'
      );
      setExportSuccess('Xuất Excel tổng hợp thành công!');
      setTimeout(() => setExportSuccess(''), 4000);
    } catch (err: any) {
      console.error('Excel export error:', err);
      setExportError('Lỗi xuất Excel: ' + (err?.message || 'Không thể tạo file'));
    }
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

      {exportProgressText && (
        <div className="mb-4 p-3.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl flex items-center gap-2.5 text-sm shadow-sm">
          <Loader2 size={18} className="animate-spin text-blue-600 flex-shrink-0" />
          <span className="font-medium">{exportProgressText}</span>
        </div>
      )}
      {exportSuccess && (
        <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2.5 text-sm shadow-sm">
          <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
          <span className="font-medium">{exportSuccess}</span>
        </div>
      )}
      {exportError && (
        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2.5 text-sm shadow-sm">
          <AlertCircle size={18} className="text-rose-600 flex-shrink-0" />
          <span className="font-medium">{exportError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <button
          onClick={() => setShowTestPdfModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors w-full shadow-sm text-sm cursor-pointer"
        >
          <FileText size={17} />
          Bảng điểm bài kiểm tra
        </button>
        <button
          disabled={isExporting}
          onClick={handleDownloadPeriodPdf}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-medium hover:bg-indigo-100 transition-colors w-full border border-indigo-200 text-sm disabled:opacity-50 cursor-pointer"
          title="Xuất PDF Tổng hợp kết quả học tập (chuẩn A4 chống cắt dòng)"
        >
          <Download size={17} />
          Tổng hợp PDF (A4)
        </button>
        <button
          onClick={handleDownloadPeriodExcel}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl font-medium hover:bg-emerald-100 transition-colors w-full border border-emerald-200 text-sm cursor-pointer"
          title="Xuất bảng Excel Tổng hợp kết quả học tập"
        >
          <FileSpreadsheet size={17} />
          Tổng hợp Excel (.xlsx)
        </button>
        <button
          onClick={() => setShowExportAccountsModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors w-full border border-gray-200 text-sm cursor-pointer"
        >
          <Users size={17} />
          DS tài khoản học sinh
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full relative">
        <div className="overflow-x-auto w-full" style={{ WebkitOverflowScrolling: "touch" }}>
        <table className="w-full min-w-[800px] text-left border-collapse whitespace-nowrap">
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
      </div>

      {showTestPdfModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-gray-800">
              <Download size={20} className="text-blue-600"/> Xuất bảng điểm bài kiểm tra
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Lọc theo thời gian: <strong>{timeFilter === 'week' ? 'Tuần này' : timeFilter === 'month' ? 'Tháng này' : timeFilter === 'semester' ? 'Học kỳ này' : 'Tất cả'}</strong>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Chọn bài kiểm tra</label>
                <select 
                  value={exportTestId}
                  onChange={e => setExportTestId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
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

              {exportProgressText && (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  <span>{exportProgressText}</span>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button 
                  onClick={handleDownloadTestPdf}
                  disabled={!exportTestId || isExporting}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm shadow-sm cursor-pointer"
                  title="Xuất file PDF chuẩn A4 (tự động ngắt trang, lặp tiêu đề cột, chống cắt ngang hàng chữ)"
                >
                  <FileText size={16} />
                  <span>{isExporting ? 'Đang tạo PDF...' : 'Tải file PDF (A4)'}</span>
                </button>

                <button 
                  onClick={handleDownloadTestExcel}
                  disabled={!exportTestId || isExporting}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm shadow-sm cursor-pointer"
                  title="Xuất file Excel (.xlsx) đầy đủ cột điểm và thống kê"
                >
                  <FileSpreadsheet size={16} />
                  <span>Tải Excel (.xlsx)</span>
                </button>
              </div>

              <div className="flex justify-end pt-1">
                <button 
                  onClick={() => setShowTestPdfModal(false)}
                  disabled={isExporting}
                  className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl font-medium text-sm transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Export Student Accounts Modal */}
      {showExportAccountsModal && (
        <ExportStudentAccountsModal
          isOpen={showExportAccountsModal}
          onClose={() => setShowExportAccountsModal(false)}
          students={students}
          classes={classes}
          initialSelectedClass={classes.find(c => c.id === selectedClassId)?.name || 'all'}
        />
      )}
    </div>
  );
}
