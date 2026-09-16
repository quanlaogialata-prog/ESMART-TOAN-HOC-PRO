import fs from 'fs';
let code = fs.readFileSync('src/pages/student/DoAssignment.tsx', 'utf8');

const oldMain = `<main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">`;

const newMain = `<main className={\`flex-1 flex flex-col lg:flex-row overflow-hidden bg-gray-100\`}>
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

code = code.replace(oldMain, newMain);

// Also change min-h-screen to h-screen
code = code.replace(
  '<div className="min-h-screen bg-gray-50 flex flex-col">',
  '<div className="h-screen bg-gray-50 flex flex-col overflow-hidden">'
);

fs.writeFileSync('src/pages/student/DoAssignment.tsx', code);
