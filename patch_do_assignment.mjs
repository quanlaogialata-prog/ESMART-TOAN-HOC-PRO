import fs from 'fs';

let content = fs.readFileSync('src/pages/student/DoAssignment.tsx', 'utf8');

const injection = `
          {submitted && test.answerFileUrl && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-200 flex items-center justify-between mb-6 mt-4">
               <div className="flex items-center gap-4 text-purple-800">
                  <FileText size={32} />
                  <div>
                    <h4 className="font-bold text-lg">Tài liệu ĐÁP ÁN (Biểu điểm/Lời giải)</h4>
                    <p className="text-sm opacity-80">{test.answerFileName || "dap_an_dinh_kem"}</p>
                  </div>
               </div>
               <div className="flex gap-3">
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
               </div>
            </div>
          )}
          
          {submitted && test.answerFileUrl && test.answerFileUrl.startsWith('data:image/') && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 text-center overflow-auto">
              <h4 className="font-bold text-gray-700 mb-4 text-left">Hình ảnh đáp án gốc:</h4>
              <img src={test.answerFileUrl} alt="Đáp án gốc" className="max-w-full h-auto mx-auto rounded-lg border border-gray-100" />
            </div>
          )}
`;

content = content.replace(/\{test\.fileUrl && \(/, injection + '\n          {test.fileUrl && (');

fs.writeFileSync('src/pages/student/DoAssignment.tsx', content);
console.log("DoAssignment patched");
