import fs from 'fs';
let code = fs.readFileSync('src/pages/teacher/Gradebook.tsx', 'utf8');

if (!code.includes('import html2canvas')) {
  code = code.replace("import jsPDF from 'jspdf';", "import jsPDF from 'jspdf';\nimport html2canvas from 'html2canvas';");
}

const minDateCode = `  const getFilteredDate = () => {`;
const filteredAssignmentsCode = `
  const getFilteredAssignments = () => {
    const minDate = getFilteredDate();
    const filteredIds = new Set<string>();
    if (selectedClass) {
      const stuIds = students.filter(s => s.className === selectedClass).map(s => s.id);
      submissions.forEach(sub => {
        if (stuIds.includes(sub.studentId)) {
          // Check assignment created date or submission date
          const assignData = assignments[sub.assignmentId];
          if (assignData) {
            const assignDate = new Date(assignData.createdAt || sub.submittedAt);
            if (assignDate >= minDate) {
              filteredIds.add(sub.assignmentId);
            }
          }
        }
      });
    }
    return Array.from(filteredIds);
  };
  const filteredAssignmentIds = getFilteredAssignments();
`;

if (!code.includes('getFilteredAssignments')) {
  code = code.replace(minDateCode, filteredAssignmentsCode + '\n' + minDateCode);
}

const printFn = `
  const handleExportZaloPdf = async () => {
    if (!zaloAssignmentId) {
      alert('Vui lòng chọn bài kiểm tra!');
      return;
    }
    
    const classStudents = students.filter(s => s.className === selectedClass);
    const assignmentTitle = assignments[zaloAssignmentId]?.title || 'Bai_Kiem_Tra';
    const teacherName = user?.displayName || 'Giáo viên';

    // Tạo HTML table ẩn
    const div = document.createElement('div');
    div.style.padding = '40px';
    div.style.background = 'white';
    div.style.width = '800px';
    div.style.color = 'black';
    div.style.fontFamily = 'Arial, sans-serif';
    
    div.innerHTML = \`
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="font-size: 24px; margin-bottom: 5px;">KẾT QUẢ BÀI KIỂM TRA</h2>
        <p style="font-size: 16px; margin: 0;">Lớp: <strong>\${selectedClass}</strong></p>
        <p style="font-size: 16px; margin: 5px 0;">Bài: <strong>\${assignmentTitle}</strong></p>
        <p style="font-size: 14px; margin: 0; color: #555;">Giáo viên giao bài: \${teacherName}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background: #f3f4f6;">
            <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">STT</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Họ và tên</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Điểm</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          \${classStudents.map((stu, idx) => {
            const sub = submissions.find(s => s.studentId === stu.id && s.assignmentId === zaloAssignmentId);
            const score = sub && typeof sub.score === 'number' ? sub.score : 'Chưa làm';
            const status = sub ? (sub.score !== undefined ? 'Đã chấm' : 'Chờ chấm') : 'Chưa nộp';
            return \`
              <tr>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">\${idx + 1}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">\${stu.displayName}</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center; font-weight: bold; color: \${typeof score === 'number' && score >= 8 ? '#16a34a' : typeof score === 'number' && score >= 5 ? '#f97316' : typeof score === 'number' ? '#ef4444' : '#6b7280'};">\${score}</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">\${status}</td>
              </tr>
            \`;
          }).join('')}
        </tbody>
      </table>
    \`;
    
    document.body.appendChild(div);
    
    try {
      const canvas = await html2canvas(div, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(\`Ket_Qua_\${selectedClass}_\${assignmentTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf\`);
      
      setShowZaloPdfModal(false);
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra khi tạo PDF');
    } finally {
      document.body.removeChild(div);
    }
  };
`;

if (!code.includes('handleExportZaloPdf')) {
  const insertIndex = code.indexOf('const handleExportCSV');
  code = code.slice(0, insertIndex) + printFn + '\n  ' + code.slice(insertIndex);
}

// Add the modal HTML
const modalHtml = `
      {showZaloPdfModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-blue-700">
                <Send size={24} /> Gửi kết quả lên Zalo
              </h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Chọn bài kiểm tra trong <strong>{timeFilter === 'week' ? 'tuần này' : timeFilter === 'month' ? 'tháng này' : timeFilter === 'semester' ? 'học kỳ này' : 'năm nay'}</strong> để xuất PDF gửi phụ huynh. File PDF sẽ có tên bài và tên giáo viên.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chọn bài kiểm tra</label>
                <select 
                  value={zaloAssignmentId}
                  onChange={e => setZaloAssignmentId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">-- Chọn bài kiểm tra --</option>
                  {filteredAssignmentIds.map(id => (
                    <option key={id} value={id}>{assignments[id]?.title || 'Bài kiểm tra không tên'}</option>
                  ))}
                  {filteredAssignmentIds.length === 0 && (
                    <option value="" disabled>Không có bài nào trong khoảng thời gian này</option>
                  )}
                </select>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button 
                  onClick={() => setShowZaloPdfModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Đóng
                </button>
                <button 
                  onClick={handleExportZaloPdf}
                  disabled={!zaloAssignmentId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Download size={16} /> Xuất file PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
`;

if (!code.includes('showZaloPdfModal &&')) {
  const insertIndex = code.lastIndexOf('</div>');
  code = code.slice(0, insertIndex) + modalHtml + '\n    ' + code.slice(insertIndex);
}

fs.writeFileSync('src/pages/teacher/Gradebook.tsx', code);
console.log('Added Zalo Modal logic');
