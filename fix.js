const fs = require('fs');
let content = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');
const search = `<Eye size={16} /> Xem
                        </button>
                        {t.type === 'essay' && (`;
const replace = `<Eye size={16} /> Xem
                        </button>
                        {t.questionsData && getParsedQuestions(t.questionsData).length > 0 && (
                           <button 
                             onClick={() => openEditQuestions(t)}
                             className="flex-1 text-center text-sm font-medium text-purple-600 hover:text-purple-700 bg-purple-50 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                             title="Sửa câu hỏi & đính kèm ảnh"
                           >
                             <Pencil size={16} /> Sửa câu hỏi
                           </button>
                        )}
                        {t.type === 'essay' && (`;
content = content.replaceAll(search, replace);
fs.writeFileSync('src/pages/teacher/ManageTests.tsx', content);
console.log('done');
