const fs = require('fs');
let content = fs.readFileSync('src/pages/teacher/Curriculum.tsx', 'utf-8');

// 1. Add states for system messages, prompt modal, and delete confirm
content = content.replace(
  "const [selectedLesson, setSelectedLesson] = useState<any>(null);",
  "const [selectedLesson, setSelectedLesson] = useState<any>(null);\n  const [sysMsg, setSysMsg] = useState('');\n  const [sysError, setSysError] = useState('');\n  const [lessonToDelete, setLessonToDelete] = useState<string|null>(null);\n  const [showTopicModal, setShowTopicModal] = useState(false);\n  const [newTopicName, setNewTopicName] = useState('');\n  const [newTopicSpecial, setNewTopicSpecial] = useState(false);"
);

// 2. Fix deleteLesson
content = content.replace(
  /const deleteLesson = async \(lessonId: string\) => \{[\s\S]*?\}\s*\};/,
  `const deleteLesson = async (lessonId: string) => {
    if (lessonToDelete !== lessonId) {
      setLessonToDelete(lessonId);
      setTimeout(() => setLessonToDelete(null), 3000);
      return;
    }
    try {
      await deleteDoc(doc(db, 'lessons', lessonId));
      setLessons(prev => prev.filter(l => l.id !== lessonId));
      setLessonToDelete(null);
    } catch (err: any) {
      setSysError("Lỗi: " + err.message);
      setTimeout(() => setSysError(''), 3000);
    }
  };`
);

// 3. Fix delete lesson button
content = content.replace(
  /<button\s*onClick=\{\(\) => deleteLesson\(l\.id\)\}\s*className="text-red-500 hover:bg-red-50 p-1\.5 rounded-md transition-colors"\s*title="Xóa bài học"\s*>\s*<Trash2 size=\{18\} \/>\s*<\/button>/g,
  `<button onClick={() => deleteLesson(l.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors" title="Xóa bài học">
    {lessonToDelete === l.id ? <span className="text-xs font-bold text-red-600">Xóa?</span> : <Trash2 size={18} />}
  </button>`
);

// 4. Fix createTopic
content = content.replace(
  /const createTopic = async \(\) => \{[\s\S]*?\}\s*\};/,
  `const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    try {
      await addDoc(collection(db, 'topics'), {
        name: newTopicName,
        grade,
        isSpecial: grade === 9 && newTopicSpecial,
        createdAt: new Date().toISOString()
      });
      setShowTopicModal(false);
      setNewTopicName('');
      setNewTopicSpecial(false);
      loadTopics();
      setSysMsg('Thêm chủ đề thành công!');
      setTimeout(() => setSysMsg(''), 3000);
    } catch(err: any) {
      setSysError("Lỗi: " + err.message);
      setTimeout(() => setSysError(''), 3000);
    }
  };
  const createTopic = () => setShowTopicModal(true);`
);

// 5. Replace alerts
content = content.replace(/alert\("Lỗi tải chủ đề: " \+ e\.message\);/g, "setSysError('Lỗi tải chủ đề: ' + e.message); setTimeout(()=>setSysError(''),3000);");
content = content.replace(/alert\("Lỗi tải bài học: " \+ e\.message\);/g, "setSysError('Lỗi tải bài học: ' + e.message); setTimeout(()=>setSysError(''),3000);");

// 6. Add sysMsg/sysError display
content = content.replace(
  /<div className="max-w-6xl mx-auto flex gap-6 h-\[calc\(100vh-120px\)\]">/,
  `{sysMsg && <div className="max-w-6xl mx-auto mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">{sysMsg}</div>}
   {sysError && <div className="max-w-6xl mx-auto mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{sysError}</div>}
   <div className="max-w-6xl mx-auto flex gap-6 h-[calc(100vh-120px)]">`
);

// 7. Add Topic Modal at the end of the component
content = content.replace(
  /<\/div>\s*<\/div>\s*\);\s*\}/,
  `  {showTopicModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Thêm Chủ Đề Mới (Lớp {grade})</h2>
            </div>
            <form onSubmit={handleCreateTopic} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên chủ đề/chuyên đề</label>
                <input 
                  type="text" 
                  required
                  value={newTopicName}
                  onChange={e => setNewTopicName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="VD: Chương 1: Đại số"
                />
              </div>
              {grade === 9 && (
                <div className="flex items-center gap-2 mt-2">
                  <input 
                    type="checkbox" 
                    id="isSpecial"
                    checked={newTopicSpecial}
                    onChange={e => setNewTopicSpecial(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="isSpecial" className="text-sm text-gray-700">Đây là chuyên đề ôn thi vào 10</label>
                </div>
              )}
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowTopicModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Thêm mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}`
);

fs.writeFileSync('src/pages/teacher/Curriculum.tsx', content);
