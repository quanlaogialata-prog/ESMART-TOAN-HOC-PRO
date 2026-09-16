import fs from 'fs';

let content = fs.readFileSync('src/components/DrawingPad.tsx', 'utf8');

// Update DrawingPadProps
const oldProps = `interface DrawingPadProps {
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}`;
const newProps = `interface DrawingPadProps {
  onSave: (dataUrl: string, recognizedText?: string) => void;
  onCancel: () => void;
}`;
content = content.replace(oldProps, newProps);

// Add state for loading
const oldImport = `import { Check, RotateCcw, PenTool, Highlighter, Eraser, Undo, Grid, List, Minus, Square, Circle } from 'lucide-react';`;
const newImport = `import { Check, RotateCcw, PenTool, Highlighter, Eraser, Undo, Grid, List, Minus, Square, Circle, Type, Loader2 } from 'lucide-react';`;
content = content.replace(oldImport, newImport);

const stateInject = `  const [points, setPoints] = useState<{x: number, y: number, pressure?: number}[]>([]);
  const [startPos, setStartPos] = useState<{x: number, y: number} | null>(null);
  
  const [isRecognizing, setIsRecognizing] = useState(false);`;
content = content.replace(`  const [points, setPoints] = useState<{x: number, y: number, pressure?: number}[]>([]);\n  const [startPos, setStartPos] = useState<{x: number, y: number} | null>(null);`, stateInject);

// Add handleRecognize function
const handleSaveBlock = `  const handleSave = () => {`;
const handleRecognizeBlock = `  const handleRecognize = async () => {
    if (!gridCanvasRef.current || !drawingCanvasRef.current) return;
    setIsRecognizing(true);
    try {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = gridCanvasRef.current.width;
      tempCanvas.height = gridCanvasRef.current.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(drawingCanvasRef.current, 0, 0); // only draw ink, not grid
        const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.9);
        
        const response = await fetch('/api/recognize-handwriting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUrl })
        });
        
        const data = await response.json();
        if (data.text) {
          onSave(dataUrl, data.text);
        } else {
          alert('Không tìm thấy chữ hoặc công thức trong hình vẽ.');
        }
      }
    } catch (error) {
      console.error('Recognition error:', error);
      alert('Lỗi nhận diện. Vui lòng thử lại sau.');
    } finally {
      setIsRecognizing(false);
    }
  };

  const handleSave = () => {`;
content = content.replace(handleSaveBlock, handleRecognizeBlock);

// Add button to the top bar
const oldTopBarBtn = `            <button 
               onClick={handleSave} 
               className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow text-sm"
            >
              <Check size={16} /> Lưu & Chèn
            </button>`;
const newTopBarBtn = `            <button 
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
content = content.replace(oldTopBarBtn, newTopBarBtn);

fs.writeFileSync('src/components/DrawingPad.tsx', content);
console.log('patched');
