import fs from 'fs';
let code = fs.readFileSync('src/pages/student/DoAssignment.tsx', 'utf8');

const answerBlockOld = `               <div className="flex gap-3">
                 <a 
                   href={test.answerFileUrl} 
                   download={test.answerFileName || "dap_an"}
                   className="px-4 py-2 bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 font-bold rounded-lg transition-colors"
                 >
                   Tải xuống
                 </a>
                 {test.answerFileUrl.startsWith('data:') && (
                   <button 
                     onClick={() => {
                       fetch(test.answerFileUrl).then(res => res.blob()).then(blob => window.open(URL.createObjectURL(blob), '_blank'));
                     }}
                     className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors"
                   >
                     Mở tab mới
                   </button>
                 )}
               </div>`;

const testBlockOld = `               <div className="flex gap-3">
                 <a 
                   href={test.fileUrl} 
                   download={test.fileName || "tai_lieu"}
                   className="px-4 py-2 bg-white border border-orange-200 text-orange-700 hover:bg-orange-50 font-bold rounded-lg transition-colors"
                 >
                   Tải xuống
                 </a>
                 {test.fileUrl.startsWith('data:') && (
                   <button 
                     onClick={() => {
                       fetch(test.fileUrl).then(res => res.blob()).then(blob => window.open(URL.createObjectURL(blob), '_blank'));
                     }}
                     className="px-4 py-2 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors"
                   >
                     Mở tab mới
                   </button>
                 )}
               </div>`;

code = code.replace(answerBlockOld, `               <div className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                  Chỉ xem
               </div>`);

code = code.replace(testBlockOld, `               <div className="text-sm font-medium text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                  Chỉ xem
               </div>`);

// Update image blocks to generic inline document viewers
const imgAnswerOld = `          {submitted && test.answerFileUrl && test.answerFileUrl.startsWith('data:image/') && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 text-center overflow-auto">
              <h4 className="font-bold text-gray-700 mb-4 text-left">Hình ảnh đáp án gốc:</h4>
              <img src={test.answerFileUrl} alt="Đáp án gốc" className="max-w-full h-auto mx-auto rounded-lg border border-gray-100" />
            </div>
          )}`;

const imgTestOld = `          {test.fileUrl && test.fileUrl.startsWith('data:image/') && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 text-center overflow-auto">
              <h4 className="font-bold text-gray-700 mb-4 text-left">Hình ảnh tài liệu gốc (Xem hình vẽ/đồ thị ở đây):</h4>
              <img src={test.fileUrl} alt="Bản gốc" className="max-w-full h-auto mx-auto rounded-lg border border-gray-100" />
            </div>
          )}`;

const inlineAnswerNew = `          {submitted && test.answerFileUrl && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 text-center overflow-auto" onContextMenu={(e) => e.preventDefault()}>
              <h4 className="font-bold text-gray-700 mb-4 text-left">Nội dung đáp án gốc:</h4>
              {test.answerFileUrl.startsWith('data:image/') ? (
                <img src={test.answerFileUrl} alt="Đáp án gốc" className="max-w-full h-auto mx-auto rounded-lg border border-gray-100 select-none pointer-events-none" />
              ) : (
                <iframe src={test.answerFileUrl + '#toolbar=0'} className="w-full h-[600px] rounded-lg border border-gray-200" title="Đáp án" />
              )}
            </div>
          )}`;

const inlineTestNew = `          {test.fileUrl && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 text-center overflow-auto" onContextMenu={(e) => e.preventDefault()}>
              <h4 className="font-bold text-gray-700 mb-4 text-left">Nội dung tài liệu gốc:</h4>
              {test.fileUrl.startsWith('data:image/') ? (
                <img src={test.fileUrl} alt="Bản gốc" className="max-w-full h-auto mx-auto rounded-lg border border-gray-100 select-none pointer-events-none" />
              ) : (
                <iframe src={test.fileUrl + '#toolbar=0'} className="w-full h-[600px] rounded-lg border border-gray-200" title="Tài liệu" />
              )}
            </div>
          )}`;

code = code.replace(imgAnswerOld, inlineAnswerNew);
code = code.replace(imgTestOld, inlineTestNew);

fs.writeFileSync('src/pages/student/DoAssignment.tsx', code);
console.log("Updated viewer settings.");
