import fs from 'fs';
let code = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');

const exportFunc = `
  const exportGradebookForAssignment = (assignmentId: string, className: string, testTitle: string) => {
    const classStudents = studentsList.filter(s => s.className === className);
    if (classStudents.length === 0) {
      alert('Lớp này chưa có học sinh!');
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,\\uFEFF";
    csvContent += "Họ và tên,Lớp,Điểm,Ngày nộp,Trạng thái\\n";

    classStudents.forEach(stu => {
      const sub = submissionsList.find(s => s.studentId === stu.id && s.assignmentId === assignmentId);
      const score = sub && typeof sub.score === 'number' ? sub.score : 'Chưa làm';
      const date = sub ? new Date(sub.submittedAt).toLocaleDateString('vi-VN') : '';
      const status = sub ? (sub.score !== undefined ? 'Đã chấm' : 'Chờ chấm') : 'Chưa nộp';
      
      csvContent += \`"\${stu.displayName}","\${stu.className || ''}","\${score}","\${date}","\${status}"\\n\`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", \`Diem_\${className}_\${testTitle.replace(/[^a-zA-Z0-9]/g, '_')}.csv\`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderTestAssignments = (testId: string) => {
    const tAssigns = assignmentsList.filter(a => a.testId === testId);
    if (tAssigns.length === 0) return null;
    
    return (
      <div className="mt-4 pt-4 border-t border-gray-100 text-sm">
        <h4 className="font-semibold text-gray-700 mb-2">Lịch sử giao bài:</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {tAssigns.map(a => {
            const classStudentsCount = studentsList.filter(s => s.className === a.className).length;
            const submittedCount = submissionsList.filter(s => s.assignmentId === a.id).length;
            return (
              <div key={a.id} className="flex flex-col gap-1 bg-gray-50 p-2 rounded-lg border border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-blue-700">Lớp {a.className}</span>
                  <span className="text-xs font-medium text-gray-600 bg-white px-2 py-0.5 rounded-full border">Đã nộp: {submittedCount}/{classStudentsCount}</span>
                </div>
                <div className="text-xs text-gray-500">
                  <span className="block">Giao lúc: {new Date(a.assignedDate).toLocaleString('vi-VN')}</span>
                  <span className="block text-red-600">Hạn: {new Date(a.dueDate).toLocaleString('vi-VN')}</span>
                </div>
                <button 
                  onClick={() => exportGradebookForAssignment(a.id, a.className, a.testTitle)}
                  className="mt-1 w-full text-xs font-semibold bg-green-100 text-green-700 py-1.5 rounded hover:bg-green-200 transition-colors"
                >
                  Xuất bảng điểm lớp {a.className}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
`;

code = code.replace(
  "const handleCreateTest = async (e: React.FormEvent) => {",
  exportFunc + "\n  const handleCreateTest = async (e: React.FormEvent) => {"
);

// Inject into the two map blocks
code = code.replace(
  "</div>\n                    )}\n                  </div>\n                ))}",
  "</div>\n                    )}\n                    {renderTestAssignments(t.id)}\n                  </div>\n                ))}"
);

code = code.replace(
  "</div>\n                    )}\n                  </div>\n                ))}",
  "</div>\n                    )}\n                    {renderTestAssignments(t.id)}\n                  </div>\n                ))}"
);

fs.writeFileSync('src/pages/teacher/ManageTests.tsx', code);
console.log("Patched ManageTests.tsx");
