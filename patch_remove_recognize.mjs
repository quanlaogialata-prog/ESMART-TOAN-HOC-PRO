import fs from 'fs';

let content = fs.readFileSync('src/components/DrawingPad.tsx', 'utf8');

// Update DrawingPadProps back
const oldProps = `interface DrawingPadProps {
  onSave: (dataUrl: string, recognizedText?: string) => void;
  onCancel: () => void;
}`;
const newProps = `interface DrawingPadProps {
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}`;
content = content.replace(oldProps, newProps);

// Remove recognize button from UI
const oldTopBarBtn = `            <button 
               onClick={handleRecognize} 
               disabled={isRecognizing}
               className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow text-sm disabled:opacity-70"
            >
              {isRecognizing ? <Loader2 size={16} className="animate-spin" /> : <Type size={16} />}
              {isRecognizing ? 'Đang chuyển...' : 'Chuyển thành chữ'}
            </button>
            <button 
               onClick={handleSave} 
               className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow text-sm"
            >
              <Check size={16} /> Lưu thành Ảnh
            </button>`;
const newTopBarBtn = `            <button 
               onClick={handleSave} 
               className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow text-sm"
            >
              <Check size={16} /> Lưu hình vẽ
            </button>`;
content = content.replace(oldTopBarBtn, newTopBarBtn);

fs.writeFileSync('src/components/DrawingPad.tsx', content);
console.log('patched DrawingPad.tsx');
