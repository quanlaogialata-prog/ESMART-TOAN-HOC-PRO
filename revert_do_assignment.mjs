import fs from 'fs';
let code = fs.readFileSync('src/pages/student/DoAssignment.tsx', 'utf8');

// 1. Restore the main element and max-w container
const newMainStart = `<main className={\`flex-1 flex flex-col lg:flex-row overflow-hidden bg-gray-100\`}>
        {test.fileUrl && (
          <div className="w-full lg:w-1/2 h-1/2 lg:h-full flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200 bg-white shadow-sm z-10">
            <div className="p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-gray-700 flex items-center gap-2"><FileText size={18} className="text-orange-500" /> Đề bài đính kèm</h3>
              {test.fileUrl.startsWith('data:') && (
                <button 
                  onClick={() => fetch(test.fileUrl).then(res => res.blob()).then(blob => window.open(URL.createObjectURL(blob), '_blank'))} 
                  className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Mở to
                </button>
              )}
            </div>
            <div className="flex-1 overflow-auto bg-gray-200/50 p-2 lg:p-4">
              {test.fileUrl.startsWith('data:image/') ? (
                 <img src={test.fileUrl} alt="Đề bài" className="max-w-full h-auto mx-auto rounded-lg shadow-sm bg-white" />
              ) : (
                 <iframe src={test.fileUrl} className="w-full h-full border-0 bg-white rounded-lg shadow-sm min-h-[500px]" title="Tài liệu đính kèm" />
              )}
            </div>
          </div>
        )}
        
        <div className={\`w-full h-1/2 lg:h-full overflow-y-auto p-4 lg:p-6 \${test.fileUrl ? 'lg:w-1/2' : ''}\`}>
          <div className="max-w-4xl mx-auto space-y-6">`;

const oldMainStart = `<main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">`;

code = code.replace(newMainStart, oldMainStart);

// 2. Add back the inline file display block above the questions list
const inlineFileRender = `
          {test.fileUrl && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-200 flex items-center justify-between mb-6">
               <div className="flex items-center gap-4 text-orange-800">
                  <FileText size={32} />
                  <div>
                    <h4 className="font-bold text-lg">Tài liệu đề thi đính kèm</h4>
                    <p className="text-sm opacity-80">{test.fileName || "tai_lieu_dinh_kem"}</p>
                  </div>
               </div>
               <div className="flex gap-3">
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
               </div>
            </div>
          )}
          
          {test.fileUrl && test.fileUrl.startsWith('data:image/') && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 text-center overflow-auto">
              <h4 className="font-bold text-gray-700 mb-4 text-left">Hình ảnh tài liệu gốc (Xem hình vẽ/đồ thị ở đây):</h4>
              <img src={test.fileUrl} alt="Bản gốc" className="max-w-full h-auto mx-auto rounded-lg border border-gray-100" />
            </div>
          )}
`;

// Insert the inlineFileRender right before {questions.map((q, index) => (
code = code.replace('{questions.map((q, index) => (', inlineFileRender + '          {questions.map((q, index) => (');

// 3. Remove the extra closing div added to main
code = code.replace('        </div>\n        </div>\n      </main>', '        </div>\n      </main>');

// 4. Revert the h-screen to min-h-screen
code = code.replace('<div className="h-screen bg-gray-50 flex flex-col overflow-hidden">', '<div className="min-h-screen bg-gray-50 flex flex-col">');

fs.writeFileSync('src/pages/student/DoAssignment.tsx', code);
console.log("Reverted to original layout");
