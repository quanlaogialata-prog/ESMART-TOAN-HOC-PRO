import fs from 'fs';
let code = fs.readFileSync('src/pages/teacher/Gradebook.tsx', 'utf8');

// 1. Add states
const stateTarget = "const [exportAssignmentId, setExportAssignmentId] = useState('');";
const stateReplace = `const [exportAssignmentId, setExportAssignmentId] = useState('');
  const [showZaloPdfModal, setShowZaloPdfModal] = useState(false);
  const [zaloAssignmentId, setZaloAssignmentId] = useState('');`;

if (code.includes(stateTarget) && !code.includes('showZaloPdfModal')) {
  code = code.replace(stateTarget, stateReplace);
}

// 2. Add button next to Xuất bảng điểm
const btnTarget = `{selectedClass && (
            <button 
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-green-700 transition-colors"
            >
              <FileSpreadsheet size={18} /> Xuất bảng điểm
            </button>
          )}`;

const btnReplace = `{selectedClass && (
            <>
              <button 
                onClick={() => setShowExportModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-green-700 transition-colors"
              >
                <FileSpreadsheet size={18} /> Xuất bảng điểm
              </button>
              <button 
                onClick={() => setShowZaloPdfModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <Send size={18} /> Gửi kết quả kiểm tra
              </button>
            </>
          )}`;

if (code.includes(btnTarget)) {
  code = code.replace(btnTarget, btnReplace);
}

fs.writeFileSync('src/pages/teacher/Gradebook.tsx', code);
console.log('Added states and button');
