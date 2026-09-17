import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Download, FileText, Calendar, Filter, Users } from 'lucide-react';
import html2pdf from 'html2pdf.js';
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

  
  
  
  const handleDownloadTestPdf = () => {
    const asm = assignments.find(a => a.id === exportTestId);
    const cls = classes.find(c => c.id === selectedClassId);
    if (!asm || !cls) return;

    const container = document.createElement('div');
    container.style.padding = '20px';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.color = '#333';
    
    let html = `
      <h2 style="text-align: center; margin-bottom: 20px; font-size: 24px; color: #1f2937;">BẢNG ĐIỂM BÀI KIỂM TRA</h2>
      <div style="margin-bottom: 20px; font-size: 14px;">
        <p><b>Tên bài kiểm tra:</b> ${asm.testTitle || 'Không tên'}</p>
        <p><b>Lớp:</b> ${cls.name}</p>
        <p><b>Giáo viên:</b> ${teacherName}</p>
        <p><b>Giao lúc:</b> ${new Date(asm.assignedDate).toLocaleString('vi-VN')}</p>
        <p><b>Hạn nộp:</b> ${asm.dueDate ? new Date(asm.dueDate).toLocaleString('vi-VN') : 'Không có'}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #e5e7eb; padding: 8px;">STT</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Họ và Tên</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px;">Bắt đầu làm</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px;">Nộp bài</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px;">Thời gian</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px;">Trắc nghiệm</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px;">Tự luận</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px;">Tổng điểm</th>
          </tr>
        </thead>
        <tbody>
    `;

    students.forEach((stu, idx) => {
      const sub = submissions.find(s => s.studentId === stu.id && s.assignmentId === asm.id);
      
      let startTimeStr = 'Chưa làm';
      let submitTimeStr = 'Chưa nộp';
      let durationStr = '-';
      let scoreStr = 'Chưa nộp';
      let mcqStr = '-';
      let essayStr = '-';

      if (sub && sub.submittedAt) {
        submitTimeStr = new Date(sub.submittedAt).toLocaleString('vi-VN');
        
        if (sub.timeSpent) {
           const durationMins = Math.floor(sub.timeSpent / 60);
           const durationSecs = sub.timeSpent % 60;
           durationStr = `${durationMins}p ${durationSecs}s`;
           const startTime = new Date(new Date(sub.submittedAt).getTime() - sub.timeSpent * 1000);
           startTimeStr = startTime.toLocaleString('vi-VN');
        } else {
           startTimeStr = new Date(sub.submittedAt).toLocaleString('vi-VN');
        }

        if (typeof sub.score === 'number') {
          scoreStr = sub.score.toString();
        } else {
          scoreStr = 'Chờ chấm';
        }

        if (sub.mcqMax > 0) {
           mcqStr = `${Number(sub.mcqScore || 0).toFixed(1)}/${sub.mcqMax}`;
        }
        if (sub.essayMax > 0) {
           essayStr = `${Number(sub.essayScore || 0).toFixed(1)}/${sub.essayMax}`;
        }
      }
      
      html += `
        <tr>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${idx + 1}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${stu.displayName || 'Không tên'}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${startTimeStr}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${submitTimeStr}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${durationStr}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${mcqStr}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${essayStr}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center; font-weight: bold; color: #2563eb;">${scoreStr}</td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;
    
    container.innerHTML = html;
    
    const opt = {
      margin:       0.4,
      filename:     `Bang_diem_${cls.name}_${Date.now()}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'landscape' }
    };
    
    html2pdf().set(opt).from(container).save();
    
    setShowTestPdfModal(false);
  };




  
  
  
  const handleDownloadPeriodPdf = () => {
    const cls = classes.find(c => c.id === selectedClassId);
    if (!cls) return;

    let timeText = 'Tất cả';
    if (timeFilter === 'week') timeText = 'Tuần này';
    if (timeFilter === 'month') timeText = 'Tháng này';
    if (timeFilter === 'semester') timeText = 'Học kỳ này';

    const container = document.createElement('div');
    container.style.padding = '20px';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.color = '#333';
    
    let html = `
      <h2 style="text-align: center; margin-bottom: 20px; font-size: 24px; color: #1f2937;">TỔNG HỢP KẾT QUẢ HỌC TẬP</h2>
      <div style="margin-bottom: 20px; font-size: 14px;">
        <p><b>Thời gian:</b> ${timeText}</p>
        <p><b>Lớp:</b> ${cls.name}</p>
        <p><b>Giáo viên:</b> ${teacherName}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #e5e7eb; padding: 8px;">STT</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Họ và Tên</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px;">Số bài đã làm</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px;">Điểm trung bình</th>
          </tr>
        </thead>
        <tbody>
    `;

    students.forEach((s, idx) => {
      const stats = getStudentStats(s.id);
      html += `
        <tr>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${idx + 1}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${s.displayName || 'Không tên'}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${stats.count}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center; font-weight: bold; color: #2563eb;">${stats.avg}</td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;
    
    container.innerHTML = html;
    
    const opt = {
      margin:       0.5,
      filename:     `Tong_hop_ket_qua_${cls.name}_${Date.now()}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(container).save();
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

      <div className="bg-orange-50 text-orange-700 text-xs p-3 rounded-lg border border-orange-100 mb-4 sm:hidden">Lưu ý: Nếu không tải được PDF trên điện thoại, vui lòng mở ứng dụng trong Tab mới.</div>\n      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <button
          onClick={() => setShowTestPdfModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors w-full"
        >
          <Download size={18} />
          Tải xuống bảng điểm bài kiểm tra
        </button>
        <button
          onClick={handleDownloadPeriodPdf}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg font-medium hover:bg-green-100 transition-colors w-full"
        >
          <Download size={18} />
          Tải kết quả (Excel)
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
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
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
