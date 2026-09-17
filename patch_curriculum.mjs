import fs from 'fs';

let content = fs.readFileSync('src/pages/teacher/Curriculum.tsx', 'utf8');

// Add imports
const imports = `import { Database, Trash2 } from 'lucide-react';
import { topicsData, lessonsData, testsData } from '../../data/seedData';
import { chapter1Data } from '../../data/chapter1';`;

content = content.replace("import { Book, Plus, Video, FileText, X, ExternalLink, PlayCircle, Download, UploadCloud, Trash2 } from 'lucide-react';", 
  "import { Book, Plus, Video, FileText, X, ExternalLink, PlayCircle, Download, UploadCloud, Trash2, Database } from 'lucide-react';\nimport { topicsData, lessonsData, testsData } from '../../data/seedData';\nimport { chapter1Data } from '../../data/chapter1';");

// Add states
const states = `  const [showDeleteDataModal, setShowDeleteDataModal] = useState(false);
  const [deleteDataGrade, setDeleteDataGrade] = useState('9');
  const [isDeletingData, setIsDeletingData] = useState(false);`;

content = content.replace("  const [lessonForm, setLessonForm] = useState({ title: '', knowledge: '', videoUrl: '' });", 
  "  const [lessonForm, setLessonForm] = useState({ title: '', knowledge: '', videoUrl: '' });\n" + states);

// Add functions
const functions = `
  const seedSystemData = async () => {
    try {
      for (const t of topicsData) {
        await setDoc(doc(db, 'topics', t.id), t);
      }
      for (const l of lessonsData) {
        await setDoc(doc(db, 'lessons', l.id), l);
      }
      for (const ts of testsData) {
        await setDoc(doc(db, 'tests', ts.id), ts);
      }
      setSysMsg('Đã tạo dữ liệu bài học từ hệ thống thành công!'); setTimeout(() => setSysMsg(''), 3000);
      loadTopics();
    } catch(e: any) {
      setSysError('Lỗi: ' + e.message); setTimeout(() => setSysError(''), 3000);
    }
  };

  const importCustomLessonData = async () => {
    try {
      const topicRef = await addDoc(collection(db, 'topics'), {
        ...chapter1Data.topic,
        createdAt: new Date().toISOString()
      });
      for (const lesson of chapter1Data.lessons) {
        await addDoc(collection(db, 'lessons'), {
          topicId: topicRef.id,
          title: lesson.title,
          knowledge: lesson.knowledge,
          videoUrl: ''
        });
      }
      for (const test of chapter1Data.tests) {
        await addDoc(collection(db, 'tests'), {
          topicId: topicRef.id,
          grade: 9,
          ...test,
          createdAt: new Date().toISOString()
        });
      }
      setSysMsg('Đã nhập dữ liệu thành công!'); setTimeout(() => setSysMsg(''), 3000);
      loadTopics();
    } catch (e: any) {
      setSysError('Lỗi nhập dữ liệu: ' + e.message); setTimeout(() => setSysError(''), 3000);
    }
  };

  const handleDeleteDataByGrade = async () => {
    setIsDeletingData(true);
    setSysMsg(''); setSysError('');
    try {
      const isAll = deleteDataGrade === 'all';
      let topicsSnap;
      if (isAll) {
        topicsSnap = await getDocs(collection(db, 'topics'));
      } else {
        topicsSnap = await getDocs(query(collection(db, 'topics'), where('grade', '==', Number(deleteDataGrade))));
      }
      
      let deletedCount = 0;
      let totalLessons = 0;
      for (const t of topicsSnap.docs) {
        const topicId = t.id;
        await deleteDoc(doc(db, 'topics', topicId));
        deletedCount++;
        const lessonsSnap = await getDocs(query(collection(db, 'lessons'), where('topicId', '==', topicId)));
        for (const l of lessonsSnap.docs) {
          await deleteDoc(doc(db, 'lessons', l.id));
          totalLessons++;
        }
        const testsSnap = await getDocs(query(collection(db, 'tests'), where('topicId', '==', topicId)));
        for (const ts of testsSnap.docs) {
          await deleteDoc(doc(db, 'tests', ts.id));
        }
      }
      if (isAll) {
        const allLessons = await getDocs(collection(db, 'lessons'));
        for (const l of allLessons.docs) await deleteDoc(doc(db, 'lessons', l.id));
        const allTests = await getDocs(collection(db, 'tests'));
        for (const ts of allTests.docs) await deleteDoc(doc(db, 'tests', ts.id));
      }
      setSysMsg(\`Thành công! Đã xóa \${deletedCount} chủ đề và \${totalLessons} bài học.\`);
      setTimeout(() => setShowDeleteDataModal(false), 2000);
      loadTopics();
    } catch (err: any) {
      console.error("Delete Error:", err);
      setSysError("Lỗi khi xóa: " + err.message);
    } finally {
      setIsDeletingData(false);
    }
  };
`;

content = content.replace("  const loadTopics = async () => {", functions + "\n  const loadTopics = async () => {");

// Add Topbar Buttons
const topbar = `   <div className="max-w-6xl mx-auto flex justify-between items-center mb-4">
      <h2 className="text-xl font-bold text-gray-800">Quản lý Chương trình học</h2>
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setShowDeleteDataModal(true)}
          className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-red-100 transition-colors"
        >
          <Trash2 size={16} /> Xóa dữ liệu
        </button>
        <div className="relative group">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-green-700">
            <Database size={16} /> Tạo dữ liệu
          </button>
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <button onClick={seedSystemData} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 border-b border-gray-50 transition-colors">
              Từ hệ thống
            </button>
            <label className="block w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 cursor-pointer transition-colors">
              <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => {
                if(e.target.files && e.target.files.length > 0) {
                  importCustomLessonData();
                  e.target.value = '';
                }
              }} />
              Nhập file mẫu
            </label>
          </div>
        </div>
      </div>
   </div>
   <div className="max-w-6xl mx-auto flex gap-6 h-[calc(100vh-160px)]">`;

content = content.replace(`<div className="max-w-6xl mx-auto flex gap-6 h-[calc(100vh-120px)]">`, topbar);

// Add modal UI to the bottom
const modalUI = `
      {/* Delete Data Modal */}
      {showDeleteDataModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-red-50">
              <h2 className="text-lg font-bold text-red-800">Xóa dữ liệu bài học theo khối</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Chọn khối lớp mà bạn muốn xóa toàn bộ dữ liệu (chủ đề, bài học, bài kiểm tra).</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Khối Lớp</label>
                <select 
                  value={deleteDataGrade}
                  onChange={e => setDeleteDataGrade(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="all">Tất cả các khối (Xóa sạch)</option>
                  <option value="6">Khối 6</option>
                  <option value="7">Khối 7</option>
                  <option value="8">Khối 8</option>
                  <option value="9">Khối 9</option>
                  <option value="10">Khối 10</option>
                  <option value="11">Khối 11</option>
                  <option value="12">Khối 12</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowDeleteDataModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleDeleteDataByGrade}
                  disabled={isDeletingData}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Trash2 size={18} /> {isDeletingData ? 'Đang xóa...' : 'Xác nhận xóa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}`;

content = content.replace("    </>\n  );\n}", modalUI + "\n    </>\n  );\n}");

fs.writeFileSync('src/pages/teacher/Curriculum.tsx', content);
