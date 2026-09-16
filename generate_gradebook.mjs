import fs from 'fs';

const content = `import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { LineChart, BookOpen, Send, Calendar, Download } from 'lucide-react';

export default function Gradebook() {
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any>({});
  
  const [selectedGrade, setSelectedGrade] = useState('9');
  const [selectedClass, setSelectedClass] = useState('');
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'semester'>('week');
  
  const [sysMsg, setSysMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const clsSnap = await getDocs(collection(db, 'classes'));
      const clsData = clsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setClasses(clsData);

      const stuSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
      const stuData = stuSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setStudents(stuData);

      const asmSnap = await getDocs(collection(db, 'assignments'));
      const asmMap: any = {};
      asmSnap.docs.forEach(d => asmMap[d.id] = d.data());
      setAssignments(asmMap);

      const subSnap = await getDocs(collection(db, 'submissions'));
      const subData = subSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSubmissions(subData);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredDate = () => {
    const now = new Date();
    if (timeFilter === 'week') {
      return new Date(now.setDate(now.getDate() - 7));
    } else if (timeFilter === 'month') {
      return new Date(now.setMonth(now.getMonth() - 1));
    } else {
      // Semester: roughly 4 months
      return new Date(now.setMonth(now.getMonth() - 4));
    }
  };

  const filteredStudents = students.filter(s => 
    s.grade === selectedGrade && 
    (selectedClass ? s.className === selectedClass : true)
  );

  const getStudentStats = (studentId: string) => {
    const minDate = getFilteredDate();
    const studentSubs = submissions.filter(s => {
      if (s.studentId !== studentId) return false;
      const subDate = new Date(s.submittedAt);
      return subDate >= minDate;
    }).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    let totalScore = 0;
    let validCount = 0;
    studentSubs.forEach(s => {
      if (typeof s.score === 'number') {
        totalScore += s.score;
        validCount++;
      }
    });

    return {
      subs: studentSubs,
      avg: validCount > 0 ? (totalScore / validCount).toFixed(1) : '-',
      count: validCount
    };
  };

  const handleSendZaloAPI = async (student: any, stats: any) => {
    const parentPhone = student.parentPhone;
    if (!parentPhone) {
      alert('Học sinh này chưa có số điện thoại phụ huynh!');
      return;
    }

    const message = \`Kính gửi Phụ huynh em \${student.displayName},\\nKết quả học tập (\${timeFilter === 'week' ? 'Tuần này' : timeFilter === 'month' ? 'Tháng này' : 'Học kỳ'}):\\n- Điểm trung bình: \${stats.avg}\\n- Số bài đã làm: \${stats.count}\\nChi tiết các bài gần nhất:\\n\${stats.subs.slice(0, 3).map((s: any) => \`- \${assignments[s.assignmentId]?.title || 'Bài tập'}: \${s.score} điểm\`).join('\\n')}\\nCảm ơn quý phụ huynh đã đồng hành cùng trung tâm!\`;

    try {
      setSysMsg('Đang gửi thông báo Zalo qua API...');
      const res = await fetch('/api/send-zalo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: parentPhone, message })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi gửi tin nhắn');
      
      setSysMsg('Đã gửi thông báo thành công!');
      setTimeout(() => setSysMsg(''), 3000);
    } catch (e: any) {
      alert(e.message + "\\n\\nLưu ý: Bạn cần cấu hình ZALO_ACCESS_TOKEN và ZALO_OA_ID trong file .env để API hoạt động thực tế.");
      setSysMsg('');
    }
  };

  const openZaloApp = (student: any, stats: any) => {
    const parentPhone = student.parentPhone || '';
    const message = \`Kính gửi Phụ huynh em \${student.displayName},\\nKết quả học tập (\${timeFilter === 'week' ? 'Tuần này' : timeFilter === 'month' ? 'Tháng này' : 'Học kỳ'}):\\n- Điểm trung bình: \${stats.avg}\\n- Số bài đã làm: \${stats.count}\\nChi tiết các bài gần nhất:\\n\${stats.subs.slice(0, 3).map((s: any) => \`- \${assignments[s.assignmentId]?.title || 'Bài tập'}: \${s.score} điểm\`).join('\\n')}\`;
    const url = \`https://zalo.me/\${parentPhone}?text=\${encodeURIComponent(message)}\`;
    window.open(url, '_blank');
  };

  if (loading) return <div className="p-8 text-center">Đang tải dữ liệu...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <LineChart className="text-blue-600" />
            Sổ theo dõi kết quả & Thống kê
          </h2>
          <p className="text-gray-500 text-sm mt-1">Theo dõi điểm trung bình và thông báo cho phụ huynh qua Zalo</p>
        </div>
        
        <div className="flex gap-3 flex-wrap">
          <select 
            value={selectedGrade}
            onChange={e => { setSelectedGrade(e.target.value); setSelectedClass(''); }}
            className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500"
          >
            <option value="6">Khối 6</option>
            <option value="7">Khối 7</option>
            <option value="8">Khối 8</option>
            <option value="9">Khối 9</option>
          </select>
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500"
          >
            <option value="">-- Tất cả lớp --</option>
            {classes.filter(c => c.grade === selectedGrade).map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
          <select
            value={timeFilter}
            onChange={e => setTimeFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500 bg-blue-50 text-blue-700 font-medium"
          >
            <option value="week">Theo Tuần</option>
            <option value="month">Theo Tháng</option>
            <option value="semester">Theo Học Kỳ</option>
          </select>
        </div>
      </div>

      {sysMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-center font-medium">
          {sysMsg}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 border-b">
            <tr>
              <th className="px-6 py-4 font-medium">Học sinh</th>
              <th className="px-6 py-4 font-medium">Lớp</th>
              <th className="px-6 py-4 font-medium text-center">SĐT Phụ huynh</th>
              <th className="px-6 py-4 font-medium text-center">Điểm TB ({timeFilter === 'week' ? 'Tuần' : timeFilter === 'month' ? 'Tháng' : 'Học kỳ'})</th>
              <th className="px-6 py-4 font-medium">Lịch sử bài làm ({timeFilter === 'week' ? 'Tuần' : timeFilter === 'month' ? 'Tháng' : 'Học kỳ'})</th>
              <th className="px-6 py-4 font-medium text-right">Gửi thông báo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Không tìm thấy học sinh nào trong lớp này
                </td>
              </tr>
            )}
            {filteredStudents.map(student => {
              const stats = getStudentStats(student.id);
              return (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800">{student.displayName}</td>
                  <td className="px-6 py-4 text-gray-600">{student.className || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    {student.parentPhone ? (
                      <span className="font-mono text-sm">{student.parentPhone}</span>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Chưa cập nhật</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={\`font-bold \${stats.avg === '-' ? 'text-gray-400' : Number(stats.avg) >= 8 ? 'text-green-600' : Number(stats.avg) >= 5 ? 'text-orange-500' : 'text-red-500'}\`}>
                      {stats.avg}
                    </span>
                    {stats.count > 0 && <div className="text-xs text-gray-400 mt-1">({stats.count} bài)</div>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {stats.subs.slice(0, 3).map((sub: any) => (
                        <div key={sub.id} className="text-xs text-gray-600 truncate max-w-[200px]" title={assignments[sub.assignmentId]?.title}>
                          • {assignments[sub.assignmentId]?.title || 'Bài tập'}: <strong className="text-gray-800">{sub.score}đ</strong>
                          <span className="text-gray-400 text-[10px] ml-1">
                            ({new Date(sub.submittedAt).toLocaleDateString('vi-VN')})
                          </span>
                        </div>
                      ))}
                      {stats.subs.length > 3 && <div className="text-xs text-gray-400 italic">...và {stats.subs.length - 3} bài khác</div>}
                      {stats.subs.length === 0 && <span className="text-gray-400 italic text-xs">Chưa có bài nào</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => handleSendZaloAPI(student, stats)}
                      title="Gửi qua Zalo OA API (Cần config .env)"
                      className="inline-flex items-center gap-1 bg-[#0068ff] hover:bg-[#0054cc] text-white px-3 py-1.5 rounded text-xs font-medium transition-colors mb-1"
                    >
                      <Send size={14} /> Gửi OA
                    </button>
                    <button 
                      onClick={() => openZaloApp(student, stats)}
                      title="Mở ứng dụng Zalo để chat"
                      className="inline-flex items-center gap-1 border border-[#0068ff] text-[#0068ff] hover:bg-blue-50 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                    >
                      Mở app Zalo
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/pages/teacher/Gradebook.tsx', content);
console.log("Rewrote Gradebook.tsx");
