import fs from 'fs';

const content = `import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Check, RotateCcw, PenTool, Highlighter, Eraser, Undo, Minus, Square, Circle, MousePointer2, Type, Sigma, Maximize, Minimize } from 'lucide-react';
import { getStroke } from 'perfect-freehand';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import html2canvas from 'html2canvas';

// Load mathlive only on client
if (typeof window !== 'undefined') {
  import('mathlive');
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

interface DrawingPadProps {
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

type Tool = 'cursor' | 'pen' | 'highlighter' | 'eraser' | 'line' | 'rect' | 'circle' | 'text' | 'math';
type BgPattern = 'lines' | 'grid' | 'dots' | 'blank';

const COLORS = ['#000000', '#333333', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6'];

interface FloatingElement {
  id: string;
  type: 'text' | 'math';
  x: number;
  y: number;
  value: string;
}

const CANVAS_HEIGHT = 2000;

export default function DrawingPad({ onSave, onCancel }: DrawingPadProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const draftCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState<string>(COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [bgPattern, setBgPattern] = useState<BgPattern>('lines');
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<{x: number, y: number, pressure?: number}[]>([]);
  const [startPos, setStartPos] = useState<{x: number, y: number} | null>(null);
  
  const historyRef = useRef<ImageData[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  
  const [elements, setElements] = useState<FloatingElement[]>([]);
  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isFullscreen, setIsFullscreen] = useState(false);

  const drawBackground = useCallback(() => {
    const canvas = gridCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Clearer lines
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#94a3b8'; // darker slate

    const width = canvas.width;
    const height = canvas.height;
    const dpr = window.devicePixelRatio || 1;
    const spacing = 40 * dpr;

    if (bgPattern === 'lines') {
      for (let y = spacing; y < height; y += spacing) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }
    } else if (bgPattern === 'grid') {
      for (let y = spacing; y < height; y += spacing) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }
      for (let x = spacing; x < width; x += spacing) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
    } else if (bgPattern === 'dots') {
      ctx.fillStyle = '#94a3b8';
      for (let y = spacing; y < height; y += spacing) {
        for (let x = spacing; x < width; x += spacing) {
          ctx.beginPath(); ctx.arc(x, y, 2 * dpr, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
  }, [bgPattern]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    // Use fixed large height for scrolling
    const cw = container.clientWidth;
    const ch = CANVAS_HEIGHT;
    const dpr = window.devicePixelRatio || 1;

    [gridCanvasRef, drawingCanvasRef, draftCanvasRef].forEach(ref => {
      if (ref.current) {
        ref.current.width = cw * dpr;
        ref.current.height = ch * dpr;
        ref.current.style.width = \`\${cw}px\`;
        ref.current.style.height = \`\${ch}px\`;
        const ctx = ref.current.getContext('2d');
        if (ctx) ctx.scale(dpr, dpr);
      }
    });

    drawBackground();
    saveHistoryState();
  }, [drawBackground]);

  // Handle window resize to adjust canvas width
  useEffect(() => {
    const handleResize = () => {
      const container = scrollContainerRef.current;
      if (!container || !drawingCanvasRef.current) return;
      
      const cw = container.clientWidth;
      const dpr = window.devicePixelRatio || 1;
      
      // Only adjust width, keep height and content intact if possible.
      // But resizing a canvas clears it. So we must save and restore.
      const saveImg = drawingCanvasRef.current.getContext('2d')?.getImageData(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
      
      [gridCanvasRef, drawingCanvasRef, draftCanvasRef].forEach(ref => {
        if (ref.current) {
          ref.current.width = cw * dpr;
          ref.current.style.width = \`\${cw}px\`;
          const ctx = ref.current.getContext('2d');
          if (ctx) ctx.scale(dpr, dpr);
        }
      });
      
      drawBackground();
      if (saveImg && drawingCanvasRef.current) {
         drawingCanvasRef.current.getContext('2d')?.putImageData(saveImg, 0, 0);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawBackground]);

  const saveHistoryState = () => {
    if (!drawingCanvasRef.current) return;
    const canvas = drawingCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current.push(data);
    if (historyRef.current.length > 20) historyRef.current.shift();
    setCanUndo(historyRef.current.length > 1);
  };

  const handleUndo = () => {
    if (historyRef.current.length <= 1 || !drawingCanvasRef.current) return;
    historyRef.current.pop();
    const previousState = historyRef.current[historyRef.current.length - 1];
    const ctx = drawingCanvasRef.current.getContext('2d');
    if (ctx) ctx.putImageData(previousState, 0, 0);
    setCanUndo(historyRef.current.length > 1);
  };

  const getSvgPathFromStroke = (stroke: number[][]) => {
    if (!stroke.length) return '';
    const d = stroke.reduce((acc, [x0, y0], i, arr) => {
        const [x1, y1] = arr[(i + 1) % arr.length];
        acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
        return acc;
      }, ['M', ...stroke[0], 'Q']);
    d.push('Z');
    return d.join(' ');
  };

  const renderStroke = (ctx: CanvasRenderingContext2D, pts: {x: number, y: number, pressure?: number}[], isDraft: boolean) => {
    if (pts.length === 0) return;
    if (tool === 'eraser' && isDraft) return; 

    const strokeOptions = {
      size: tool === 'highlighter' ? 24 : strokeWidth,
      thinning: tool === 'pen' ? 0.6 : 0,
      smoothing: 0.5,
      streamline: 0.5,
      simulatePressure: tool !== 'highlighter',
    };

    const strokeData = getStroke(pts.map(p => [p.x, p.y, p.pressure || 0.5]), strokeOptions);
    const pathData = getSvgPathFromStroke(strokeData);
    const path = new Path2D(pathData);

    if (tool === 'highlighter') {
      ctx.fillStyle = color + '40';
      ctx.globalCompositeOperation = 'multiply';
    } else {
      ctx.fillStyle = color;
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.fill(path);
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'cursor') {
      setActiveElementId(null);
      return;
    }

    if (tool === 'text' || tool === 'math') {
      const newId = Date.now().toString();
      const newElement: FloatingElement = { id: newId, type: tool, x, y, value: '' };
      setElements(prev => [...prev, newElement]);
      setActiveElementId(newId);
      setTool('cursor');
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    setActiveElementId(null);
    
    const pressure = e.pointerType === 'pen' ? e.pressure : 0.5;
    setStartPos({ x, y });
    
    if (tool === 'eraser') {
      const ctx = drawingCanvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = 30;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y); ctx.stroke();
      }
    } else if (['line', 'rect', 'circle'].includes(tool)) {
      setPoints([]);
    } else {
      setPoints([{ x, y, pressure }]);
    }
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const pressure = e.pointerType === 'pen' ? Math.max(e.pressure, 0.1) : 0.5;
    
    if (tool === 'eraser') {
      const ctx = drawingCanvasRef.current?.getContext('2d');
      if (ctx) { ctx.lineTo(x, y); ctx.stroke(); }
    } else if (['line', 'rect', 'circle'].includes(tool)) {
      if (!startPos) return;
      const ctx = draftCanvasRef.current?.getContext('2d');
      if (ctx && draftCanvasRef.current) {
        ctx.clearRect(0, 0, draftCanvasRef.current.width, draftCanvasRef.current.height);
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = color;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        if (tool === 'line') {
          ctx.moveTo(startPos.x, startPos.y); ctx.lineTo(x, y);
        } else if (tool === 'rect') {
          ctx.rect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
        } else if (tool === 'circle') {
          const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2));
          ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        }
        ctx.stroke();
      }
    } else {
      setPoints(prev => {
        const newPts = [...prev, { x, y, pressure }];
        const ctx = draftCanvasRef.current?.getContext('2d');
        if (ctx && draftCanvasRef.current) {
          ctx.clearRect(0, 0, draftCanvasRef.current.width, draftCanvasRef.current.height);
          renderStroke(ctx, newPts, true);
        }
        return newPts;
      });
    }
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement> | React.SyntheticEvent) => {
    if (isDrawing && 'pointerId' in e) {
      (e.currentTarget as HTMLCanvasElement).releasePointerCapture((e as React.PointerEvent).pointerId);
    }
    setIsDrawing(false);
    
    if (tool === 'eraser') {
      const ctx = drawingCanvasRef.current?.getContext('2d');
      if (ctx) ctx.globalCompositeOperation = 'source-over';
      saveHistoryState();
    } else if (['line', 'rect', 'circle'].includes(tool)) {
      const draftCtx = draftCanvasRef.current?.getContext('2d');
      const drawCtx = drawingCanvasRef.current?.getContext('2d');
      const canvas = draftCanvasRef.current;
      if (draftCtx && drawCtx && canvas) {
        drawCtx.save();
        drawCtx.setTransform(1, 0, 0, 1, 0, 0);
        drawCtx.drawImage(canvas, 0, 0);
        drawCtx.restore();
        draftCtx.clearRect(0, 0, canvas.width, canvas.height);
      }
      setStartPos(null);
      saveHistoryState();
    } else if (points.length > 0) {
      const draftCtx = draftCanvasRef.current?.getContext('2d');
      const drawCtx = drawingCanvasRef.current?.getContext('2d');
      const canvas = draftCanvasRef.current;
      if (draftCtx && drawCtx && canvas) {
        renderStroke(drawCtx, points, false);
        draftCtx.clearRect(0, 0, canvas.width, canvas.height);
      }
      setPoints([]);
      saveHistoryState();
    }
  };

  const clearCanvas = () => {
    const canvas = drawingCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      saveHistoryState();
      setElements([]);
    }
  };

  // When saving, we need to crop the tall canvas to the actual drawn content
  const handleSave = async () => {
    if (!wrapperRef.current) return;
    setIsSaving(true);
    setActiveElementId(null); 
    
    setElements(prev => prev.filter(el => el.value.trim() !== ''));

    // Wait for DOM to update
    await new Promise(r => setTimeout(r, 200));

    try {
      const canvas = await html2canvas(wrapperRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      // Crop the image to where the actual content ends
      const ctx = canvas.getContext('2d');
      if (ctx) {
         const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
         let maxY = 0;
         for (let y = canvas.height - 1; y >= 0; y--) {
            for (let x = 0; x < canvas.width; x++) {
               const idx = (y * canvas.width + x) * 4;
               // check if pixel is not white
               if (imgData.data[idx] < 255 || imgData.data[idx+1] < 255 || imgData.data[idx+2] < 255) {
                  maxY = y;
                  break;
               }
            }
            if (maxY > 0) break;
         }
         
         // Add some padding
         const cropHeight = Math.min(canvas.height, maxY + 60);
         
         // if everything is empty, cropHeight might be tiny, default to a minimum height
         const finalHeight = Math.max(400 * 2, cropHeight);
         
         const cropCanvas = document.createElement('canvas');
         cropCanvas.width = canvas.width;
         cropCanvas.height = finalHeight;
         const cropCtx = cropCanvas.getContext('2d');
         if (cropCtx) {
           cropCtx.fillStyle = '#ffffff';
           cropCtx.fillRect(0, 0, cropCanvas.width, cropCanvas.height);
           cropCtx.drawImage(canvas, 0, 0, canvas.width, finalHeight, 0, 0, canvas.width, finalHeight);
           onSave(cropCanvas.toDataURL('image/jpeg', 0.9));
           return;
         }
      }
      
      onSave(canvas.toDataURL('image/jpeg', 0.9));
    } catch (err) {
      console.error("Lỗi khi tạo ảnh:", err);
      alert("Đã xảy ra lỗi khi lưu bảng vẽ.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateElement = (id: string, value: string) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, value } : el));
  };
  
  const deleteElement = (id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    setActiveElementId(null);
  };

  const getCursor = () => {
    if (tool === 'cursor') return 'default';
    if (tool === 'text') return 'text';
    if (tool === 'math') return 'crosshair';
    return 'url("data:image/svg+xml;utf8,<svg xmlns=\\\'http://www.w3.org/2000/svg\\\' width=\\\'16\\\' height=\\\'16\\\' viewBox=\\\'0 0 16 16\\\'><circle cx=\\\'8\\\' cy=\\\'8\\\' r=\\\'3.5\\\' fill=\\\'black\\\' stroke=\\\'white\\\' stroke-width=\\\'1.5\\\'/></svg>") 8 8, crosshair';
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-6 backdrop-blur-sm">
      <div className={\`bg-[#f8f9fa] shadow-2xl flex flex-col overflow-hidden border border-gray-200 transition-all duration-300 \${isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl h-[90vh] rounded-2xl'}\`}>
        
        {/* Top App Bar */}
        <div className="px-5 py-3 border-b flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
               <PenTool size={18} />
             </div>
             <div>
               <h3 className="font-bold text-gray-800 leading-tight">Bảng nhập câu trả lời</h3>
               <p className="text-[11px] text-gray-500 font-medium">Hỗ trợ viết tay, văn bản và công thức Toán</p>
             </div>
          </div>
          <div className="flex gap-2 items-center">
            <button 
               onClick={() => setIsFullscreen(!isFullscreen)} 
               className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
               title={isFullscreen ? "Thu nhỏ" : "Phóng to toàn màn hình"}
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1"></div>
            <button 
               onClick={onCancel} 
               disabled={isSaving}
               className="px-5 py-2 rounded-xl hover:bg-gray-100 font-medium text-gray-600 transition-colors text-sm"
            >
              Đóng
            </button>
            <button 
               onClick={handleSave} 
               disabled={isSaving}
               className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow text-sm disabled:opacity-50"
            >
              <Check size={16} /> {isSaving ? 'Đang lưu...' : 'Lưu & Chèn'}
            </button>
          </div>
        </div>
        
        {/* Tools Palette */}
        <div className="px-4 py-2 border-b bg-white/50 flex flex-wrap gap-4 items-center shrink-0 shadow-sm z-20 relative">
          <div className="flex gap-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
            <button onClick={() => setTool('cursor')} className={\`p-2.5 rounded-lg transition-all \${tool === 'cursor' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}\`} title="Chọn / Di chuyển">
              <MousePointer2 size={18} />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1 my-auto"></div>
            
            <button onClick={() => setTool('pen')} className={\`p-2.5 rounded-lg transition-all \${tool === 'pen' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}\`} title="Bút máy">
              <PenTool size={18} />
            </button>
            <button onClick={() => setTool('highlighter')} className={\`p-2.5 rounded-lg transition-all \${tool === 'highlighter' ? 'bg-yellow-50 text-yellow-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}\`} title="Dạ quang">
              <Highlighter size={18} />
            </button>
            <button onClick={() => setTool('eraser')} className={\`p-2.5 rounded-lg transition-all \${tool === 'eraser' ? 'bg-red-50 text-red-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}\`} title="Tẩy xóa">
              <Eraser size={18} />
            </button>
            
            <div className="w-px h-6 bg-gray-200 mx-1 my-auto"></div>
            
            <button onClick={() => setTool('text')} className={\`p-2.5 rounded-lg transition-all \${tool === 'text' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}\`} title="Chèn văn bản">
              <Type size={18} />
            </button>
            <button onClick={() => setTool('math')} className={\`p-2.5 rounded-lg transition-all \${tool === 'math' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}\`} title="Chèn công thức (MathType)">
              <Sigma size={18} />
            </button>

            <div className="w-px h-6 bg-gray-200 mx-1 my-auto hidden sm:block"></div>

            <div className="hidden sm:flex gap-1">
              <button onClick={() => setTool('line')} className={\`p-2.5 rounded-lg transition-all \${tool === 'line' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}\`}><Minus size={18} /></button>
              <button onClick={() => setTool('rect')} className={\`p-2.5 rounded-lg transition-all \${tool === 'rect' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}\`}><Square size={18} /></button>
              <button onClick={() => setTool('circle')} className={\`p-2.5 rounded-lg transition-all \${tool === 'circle' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}\`}><Circle size={18} /></button>
            </div>
          </div>
          
          <div className="flex gap-2 items-center">
            {COLORS.map(c => (
              <button key={c} onClick={() => { setColor(c); if(tool === 'eraser') setTool('pen'); }}
                className={\`w-7 h-7 rounded-full border-2 transition-all \${color === c && tool !== 'eraser' ? 'scale-110 shadow-md ring-2 ring-blue-200 ring-offset-1' : 'scale-95 border-transparent'}\`}
                style={{ backgroundColor: c, borderColor: color === c ? 'white' : 'transparent' }} />
            ))}
          </div>

          <div className="flex gap-2 items-center bg-white p-1.5 rounded-xl shadow-sm border border-gray-100">
            {[2, 4, 8].map(w => (
              <button key={w} onClick={() => setStrokeWidth(w)} className={\`w-8 h-8 flex items-center justify-center rounded-lg \${strokeWidth === w ? 'bg-gray-100' : 'hover:bg-gray-50'}\`}>
                <div className="bg-gray-800 rounded-full" style={{ width: w + 2, height: w + 2 }}></div>
              </button>
            ))}
          </div>
          
          <div className="flex-1"></div>
          
          <div className="flex gap-2">
             <button onClick={handleUndo} disabled={!canUndo} className={\`p-2.5 rounded-xl border flex items-center justify-center \${canUndo ? 'bg-white border-gray-200 text-gray-700 shadow-sm' : 'bg-transparent border-transparent text-gray-300'}\`}><Undo size={18} /></button>
             <button onClick={clearCanvas} className="p-2.5 rounded-xl border border-gray-200 bg-white text-red-500 hover:bg-red-50 shadow-sm"><RotateCcw size={18} /></button>
          </div>
        </div>
        
        {/* Scrollable Canvas Area */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative bg-white border-b" style={{ cursor: getCursor() }}>
          <div id="canvas-capture-area" ref={wrapperRef} className="w-full relative" style={{ height: CANVAS_HEIGHT, overflow: 'hidden' }}>
            <canvas ref={gridCanvasRef} className="absolute inset-0 z-0 pointer-events-none" />
            <canvas ref={drawingCanvasRef} className="absolute inset-0 z-10 pointer-events-none" />
            
            {/* Render Floating Elements */}
            {elements.map(el => {
              const isActive = activeElementId === el.id;
              
              return (
                <div 
                  key={el.id} 
                  className={\`absolute z-30 inline-block \${isActive ? 'ring-2 ring-blue-400 ring-offset-2 rounded' : ''}\`}
                  style={{ left: el.x, top: el.y, minWidth: '50px' }}
                  onPointerDown={(e) => {
                    e.stopPropagation(); // prevent drawing
                    if (tool === 'cursor') setActiveElementId(el.id);
                  }}
                >
                  {el.type === 'text' && (
                    isActive ? (
                      <textarea
                        autoFocus
                        value={el.value}
                        onChange={(e) => updateElement(el.id, e.target.value)}
                        onBlur={() => el.value.trim() === '' ? deleteElement(el.id) : setActiveElementId(null)}
                        className="bg-white/90 text-black border border-blue-400 border-dashed rounded outline-none resize-none font-sans overflow-hidden shadow-sm"
                        style={{ 
                          fontSize: '20px', 
                          lineHeight: '40px',
                          padding: '0 8px',
                          color, 
                          minHeight: '40px', 
                          minWidth: '200px',
                          height: Math.max(40, el.value.split('\\n').length * 40) + 'px'
                        }}
                        placeholder="Nhập văn bản..."
                      />
                    ) : (
                      <div className="font-sans whitespace-pre-wrap pointer-events-none" style={{ fontSize: '20px', lineHeight: '40px', padding: '0 8px', color }}>
                        {el.value}
                      </div>
                    )
                  )}

                  {el.type === 'math' && (
                    isActive ? (
                      <div className="bg-white/90 border border-blue-400 border-dashed rounded shadow-lg min-w-[250px] p-2">
                        <math-field
                          onInput={(e: any) => updateElement(el.id, e.target.value)}
                          style={{ fontSize: '24px', width: '100%', minHeight: '40px', display: 'flex', alignItems: 'center', padding: '0 8px', background: 'white' }}
                        >
                          {el.value}
                        </math-field>
                        <button onClick={() => el.value.trim() === '' ? deleteElement(el.id) : setActiveElementId(null)} className="mt-2 text-xs bg-blue-600 text-white px-3 py-1.5 rounded w-full font-bold hover:bg-blue-700">Lưu công thức</button>
                      </div>
                    ) : (
                      <div 
                        className="pointer-events-none flex items-center"
                        style={{ fontSize: '24px', color, minHeight: '40px', padding: '0 8px' }}
                        dangerouslySetInnerHTML={{ 
                          __html: katex.renderToString(el.value || ' ', { throwOnError: false }) 
                        }} 
                      />
                    )
                  )}
                  
                  {isActive && (
                    <button 
                      onClick={() => deleteElement(el.id)} 
                      className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md z-40"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}

            <canvas
              ref={draftCanvasRef}
              onPointerDown={startDrawing}
              onPointerUp={stopDrawing}
              onPointerOut={stopDrawing}
              onPointerMove={draw}
              onPointerCancel={stopDrawing}
              className="absolute inset-0 z-20 touch-none"
            />
          </div>
        </div>
        
        {/* Status Bar */}
        <div className="px-4 py-2 bg-gray-50 flex justify-between items-center text-[10px] text-gray-400 font-medium shrink-0">
           <div className="flex gap-4 items-center">
             <button onClick={() => setBgPattern('blank')} className={\`hover:text-gray-700 \${bgPattern==='blank'?'text-blue-500':''}\`}>Trắng</button>
             <button onClick={() => setBgPattern('lines')} className={\`hover:text-gray-700 \${bgPattern==='lines'?'text-blue-500':''}\`}>Dòng kẻ</button>
             <button onClick={() => setBgPattern('grid')} className={\`hover:text-gray-700 \${bgPattern==='grid'?'text-blue-500':''}\`}>Ô ly</button>
           </div>
           <div>Bảng Vẽ Đa Năng</div>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/components/DrawingPad.tsx', content);
console.log('rewrote DrawingPad.tsx with requested features');
