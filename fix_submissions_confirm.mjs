import fs from 'fs';

let content = fs.readFileSync('src/pages/teacher/ManageSubmissions.tsx', 'utf8');

// Add states for modal
content = content.replace(/const \[loading, setLoading\] = useState\(true\);/, `const [loading, setLoading] = useState(true);
  const [reassignSubId, setReassignSubId] = useState<string | null>(null);
  const [sysMsg, setSysMsg] = useState('');
  const [sysError, setSysError] = useState('');`);

const handleReassignStr = /const handleReassign = async \(subId: string\) => \{[\s\S]*?fetchData\(\);\n\s*\} catch \(e\) \{\n\s*console\.error\(e\);\n\s*alert\('Có lỗi xảy ra khi xóa bài\.'\);\n\s*\}\n\s*\}\n\s*\};/;

const newHandleReassign = `const confirmReassign = async () => {
    if (!reassignSubId) return;
    try {
      await deleteDoc(doc(db, 'submissions', reassignSubId));
      setSysMsg('Đã giao lại bài thành công! Học sinh có thể làm lại bài này.');
      setTimeout(() => setSysMsg(''), 3000);
      setReassignSubId(null);
      fetchData();
    } catch (e) {
      console.error(e);
      setSysError('Có lỗi xảy ra khi xóa bài.');
      setTimeout(() => setSysError(''), 3000);
    }
  };`;

content = content.replace(handleReassignStr, newHandleReassign);

content = content.replace(/onClick=\{\(\) => handleReassign\(sub\.id\)\}/g, "onClick={() => setReassignSubId(sub.id)}");

// saveGrades alerts
const saveGradesAlerts = /alert\('Đã cập nhật điểm thành công!'\);/g;
content = content.replace(saveGradesAlerts, "setSysMsg('Đã cập nhật điểm thành công!'); setTimeout(() => setSysMsg(''), 3000);");

const saveGradesErrorAlerts = /alert\('Có lỗi xảy ra khi lưu\.'\);/g;
content = content.replace(saveGradesErrorAlerts, "setSysError('Có lỗi xảy ra khi lưu.'); setTimeout(() => setSysError(''), 3000);");


// Add the UI for sysMsg, sysError and the modal at the bottom
const returnStr = /return \(\n\s*<div className="space-y-6">/;
const newReturn = `return (
    <div className="space-y-6">
      {sysMsg && <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg">{sysMsg}</div>}
      {sysError && <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">{sysError}</div>}
      
      {reassignSubId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Giao lại bài tập</h3>
            <p className="text-gray-600 text-sm mb-6">Bạn có chắc chắn muốn giao lại bài này cho học sinh? <b>Bài làm hiện tại của học sinh sẽ bị xóa.</b></p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setReassignSubId(null)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={confirmReassign}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Chắc chắn xóa & Giao lại
              </button>
            </div>
          </div>
        </div>
      )}`;
      
content = content.replace(returnStr, newReturn);

fs.writeFileSync('src/pages/teacher/ManageSubmissions.tsx', content);
