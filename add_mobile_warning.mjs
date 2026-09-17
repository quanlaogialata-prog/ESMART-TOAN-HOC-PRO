import fs from 'fs';

// Gradebook
let gradebook = fs.readFileSync('src/pages/teacher/Gradebook.tsx', 'utf8');
gradebook = gradebook.replace(
  'Tải xuống bảng điểm bài kiểm tra416-            </h2>',
  'Tải xuống bảng điểm bài kiểm tra</h2>\\n            <p className="text-xs text-orange-600 mb-2 bg-orange-50 p-2 rounded border border-orange-100">Lưu ý: Trên một số điện thoại, bạn cần mở ứng dụng trong Tab mới (biểu tượng mũi tên ở góc trên) để có thể tải file PDF.</p>'
);
// replace again if it didn't match
gradebook = gradebook.replace(
  'className="text-xl font-bold mb-4 flex items-center gap-2">\\n              <Download size={20} className="text-blue-600"/> Tải xuống bảng điểm bài kiểm tra\\n            </h2>',
  'className="text-xl font-bold mb-4 flex items-center gap-2">\\n              <Download size={20} className="text-blue-600"/> Tải xuống bảng điểm bài kiểm tra\\n            </h2>\\n            <p className="text-xs text-orange-600 mb-2 bg-orange-50 p-2 rounded border border-orange-100">Lưu ý: Trên một số điện thoại, bạn cần mở ứng dụng trong Tab mới (biểu tượng mũi tên ở góc trên) để có thể tải file PDF.</p>'
);

// We should also add it to the main page above the buttons if possible.
gradebook = gradebook.replace(
  '<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">',
  '<div className="bg-orange-50 text-orange-700 text-xs p-3 rounded-lg border border-orange-100 mb-4 sm:hidden">Lưu ý: Nếu không tải được PDF trên điện thoại, vui lòng mở ứng dụng trong Tab mới.</div>\\n      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">'
);
fs.writeFileSync('src/pages/teacher/Gradebook.tsx', gradebook);

// ManageTests
let manageTests = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');
manageTests = manageTests.replace(
  '<h2 className="text-2xl font-bold text-gray-800">Lịch sử giao bài</h2>',
  '<h2 className="text-2xl font-bold text-gray-800">Lịch sử giao bài</h2>\\n        <div className="bg-orange-50 text-orange-700 text-xs p-3 rounded-lg border border-orange-100 sm:hidden">Lưu ý: Nếu không tải được bảng điểm PDF, vui lòng mở ứng dụng trong Tab mới.</div>'
);
fs.writeFileSync('src/pages/teacher/ManageTests.tsx', manageTests);

console.log("Added warnings");
