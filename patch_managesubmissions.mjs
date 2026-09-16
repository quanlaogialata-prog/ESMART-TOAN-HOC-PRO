import fs from 'fs';

let content = fs.readFileSync('src/pages/teacher/ManageSubmissions.tsx', 'utf8');

const importRegex = /import \{ collection, getDocs, query, orderBy, doc, updateDoc, getDoc \} from 'firebase\/firestore';/;
const replaceImport = `import { collection, getDocs, query, orderBy, doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';`;
content = content.replace(importRegex, replaceImport);

const funcRegex = /const openSubmission = \(sub: any\) => \{/;
const replaceFunc = `const handleReassign = async (subId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn giao lại bài này cho học sinh? Bài làm hiện tại của học sinh sẽ bị xóa.')) {
      try {
        await deleteDoc(doc(db, 'submissions', subId));
        alert('Đã giao lại bài thành công! Học sinh có thể làm lại bài này.');
        fetchData();
      } catch (e) {
        console.error(e);
        alert('Có lỗi xảy ra khi xóa bài.');
      }
    }
  };

  const openSubmission = (sub: any) => {`;
content = content.replace(funcRegex, replaceFunc);

const uiRegex = /<button\s*onClick=\{\(\) => openSubmission\(sub\)\}\s*className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2"\s*>\s*<Edit size=\{16\} \/> Chấm bài\s*<\/button>/;
const replaceUI = `<button 
                      onClick={() => openSubmission(sub)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2"
                    >
                      <Edit size={16} /> Chấm bài
                    </button>
                    <button 
                      onClick={() => handleReassign(sub.id)}
                      title="Giao lại bài"
                      className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2 ml-2"
                    >
                      <X size={16} /> Giao lại
                    </button>`;
content = content.replace(uiRegex, replaceUI);

fs.writeFileSync('src/pages/teacher/ManageSubmissions.tsx', content);
console.log("Patched ManageSubmissions.tsx");
