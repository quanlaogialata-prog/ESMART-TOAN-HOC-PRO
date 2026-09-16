const fs = require('fs');

// Fix ManageTests.tsx
let manageContent = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');
manageContent = manageContent.replace(
  /<iframe src=\{previewTest\.fileUrl\} className="w-full flex-1 rounded-lg border border-gray-100" title="PDF gốc"><\/iframe>/g,
  `<div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-600 mb-4 text-center">Trình duyệt hạn chế hiển thị PDF trực tiếp. Vui lòng mở trong tab mới để xem hình vẽ/đồ thị chi tiết.</p>
                    <button 
                      onClick={() => handleOpenPreview(previewTest.fileUrl)}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                    >
                      Mở file PDF (Tab mới)
                    </button>
                  </div>`
);
fs.writeFileSync('src/pages/teacher/ManageTests.tsx', manageContent);

// Fix DoAssignment.tsx
let doContent = fs.readFileSync('src/pages/student/DoAssignment.tsx', 'utf8');
doContent = doContent.replace(
  /<iframe src=\{test\.fileUrl\} className="w-full flex-1 rounded-lg border border-gray-100" title="PDF gốc"><\/iframe>/g,
  `<div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-600 mb-4 text-center">Trình duyệt hạn chế hiển thị PDF trực tiếp. Vui lòng mở trong thẻ mới để xem tài liệu gốc.</p>
                <button 
                  onClick={() => {
                    fetch(test.fileUrl).then(res => res.blob()).then(blob => window.open(URL.createObjectURL(blob), '_blank'));
                  }}
                  className="px-6 py-2 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Mở PDF (Thẻ mới)
                </button>
              </div>`
);
fs.writeFileSync('src/pages/student/DoAssignment.tsx', doContent);

console.log('done');
