import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Trash2, 
  MoveUp, 
  MoveDown, 
  Scissors, 
  Clipboard, 
  Plus, 
  Sparkles, 
  Wand2, 
  Check, 
  Layers, 
  Crop, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight, 
  Eraser, 
  Eye, 
  Edit3, 
  Columns2, 
  Save, 
  RefreshCw, 
  AlertCircle, 
  Image as ImageIcon,
  CheckCircle2,
  FileCheck,
  Minimize2,
  Maximize2
} from 'lucide-react';
import MathText from '../MathText';
import { 
  DocumentBlock, 
  parseContentIntoBlocks, 
  splitTextIntoCustomBlocks,
  serializeBlocksToContent, 
  cleanPdfWhiteSpaces,
  loadPdfDocument, 
  renderPdfPageToCanvas, 
  cropRegionFromCanvas 
} from '../../lib/pdfProcessingEngine';
import { 
  repairVietnameseDocument, 
  formatMathExpressions,
  smartFormatLessonLayout 
} from '../../lib/vietnameseFont';

interface DocumentEditorWorkspaceProps {
  initialContent: string;
  initialTitle: string;
  attachment: {
    name: string;
    size: number;
    type: string;
    dataUrl?: string;
  } | null;
  onSaveLesson: (title: string, content: string) => void;
  onUpdateTitle: (title: string) => void;
  onUpdateContent: (content: string) => void;
  onChangeAttachment: (file: File) => void;
  onRemoveAttachment: () => void;
  isSaving?: boolean;
}

export const DocumentEditorWorkspace: React.FC<DocumentEditorWorkspaceProps> = ({
  initialContent,
  initialTitle,
  attachment,
  onSaveLesson,
  onUpdateTitle,
  onUpdateContent,
  onChangeAttachment,
  onRemoveAttachment,
  isSaving = false
}) => {
  // Title & Content State
  const [title, setTitle] = useState(initialTitle || '');
  const [blocks, setBlocks] = useState<DocumentBlock[]>([]);
  const [clipboardBlock, setClipboardBlock] = useState<DocumentBlock | null>(null);
  
  // Tabs: 'blocks' (Dịch chuyển & Cắt dán), 'pdf_canvas' (Trực quan PDF & Cắt ảnh), 'editor' (Soạn thảo toàn văn)
  const [activeTab, setActiveTab] = useState<'blocks' | 'pdf_canvas' | 'editor'>('blocks');
  const [editorFullText, setEditorFullText] = useState(initialContent || '');
  const [splitView, setSplitView] = useState(true);

  // Status & Notifications
  const [statusMsg, setStatusMsg] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // PDF Viewer & Cropping State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [currentPdfPage, setCurrentPdfPage] = useState(1);
  const [pdfScale, setPdfScale] = useState(1.4);
  const [isRenderingPdf, setIsRenderingPdf] = useState(false);
  const [isCropMode, setIsCropMode] = useState(false);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const [cropRect, setCropRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPdf = Boolean(
    attachment?.name?.toLowerCase().endsWith('.pdf') || 
    attachment?.type?.includes('pdf') ||
    attachment?.dataUrl?.startsWith('data:application/pdf')
  );

  // Theo dõi giá trị đã đồng bộ nội bộ để tránh re-initialization loop khiến màn hình giật/nhảy về đầu trang
  const lastInternalContentRef = useRef<string>(initialContent || '');
  const lastInternalTitleRef = useRef<string>(initialTitle || '');
  const lastAttachmentNameRef = useRef<string>(attachment?.name || '');
  const isInitializedRef = useRef<boolean>(false);
  const blocksScrollContainerRef = useRef<HTMLDivElement>(null);

  // Khởi tạo các khối tài liệu khi nội dung thay đổi từ bên ngoài (lần đầu hoặc khi nạp file/bài học mới)
  useEffect(() => {
    if (!isInitializedRef.current || (initialContent !== lastInternalContentRef.current)) {
      lastInternalContentRef.current = initialContent || '';
      lastInternalTitleRef.current = initialTitle || '';
      setTitle(initialTitle || '');
      setEditorFullText(initialContent || '');
      const parsed = parseContentIntoBlocks(initialContent || '');
      setBlocks(prevBlocks => {
        // Bảo vệ cấu trúc vùng: Nếu hiện tại đã bóc tách được nhiều vùng (ví dụ 7 vùng từ PDF)
        // mà nội dung từ server chỉ parse được 1 khối chung, giữ nguyên các vùng đã bóc tách cho Thầy/Cô!
        if (prevBlocks.length > 1 && parsed.length <= 1 && (initialContent || '').trim().length > 0) {
          return prevBlocks;
        }
        return parsed;
      });
      isInitializedRef.current = true;
    }
  }, [initialContent, initialTitle]);

  // Cập nhật ngay khi tệp đính kèm thay đổi hoặc được nạp mới
  useEffect(() => {
    if (attachment?.name && attachment.name !== lastAttachmentNameRef.current) {
      lastAttachmentNameRef.current = attachment.name;
      if (initialTitle) {
        setTitle(initialTitle);
        lastInternalTitleRef.current = initialTitle;
      }
      if (initialContent) {
        lastInternalContentRef.current = initialContent;
        setEditorFullText(initialContent);
        const parsed = parseContentIntoBlocks(initialContent);
        setBlocks(prevBlocks => {
          if (prevBlocks.length > 1 && parsed.length <= 1) return prevBlocks;
          return parsed;
        });
      }
    }
  }, [attachment?.name, initialTitle, initialContent]);

  // Nạp PDF nếu có file PDF đính kèm & Tự động bóc tách nhanh vào bảng sửa
  useEffect(() => {
    let isMounted = true;
    if (isPdf && attachment?.dataUrl) {
      loadPdfDocument(attachment.dataUrl)
        .then(async (pdf) => {
          if (!isMounted) return;
          setPdfDoc(pdf);
          setPdfPageCount(pdf.numPages);
          setCurrentPdfPage(1);

          // Nếu nội dung hiện tại đang trống hoặc chỉ có 1 khối, trích xuất tức thì các trang PDF vào bảng sửa ngay lập tức!
          if (!lastInternalContentRef.current || lastInternalContentRef.current.trim().length === 0 || blocks.length <= 1) {
            try {
              const pagesText: string[] = [];
              const maxP = Math.min(pdf.numPages, 30);
              for (let i = 1; i <= maxP; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageStrings = textContent.items
                  .map((item: any) => item.str || '')
                  .filter((str: string) => str.trim().length > 0);
                const pageText = pageStrings.join(' ');
                if (pageText.trim()) {
                  pagesText.push(`### Phần ${i}: Trang ${i}\n${pageText}`);
                }
              }
              const extractedQuick = pagesText.join('\n\n');
              if (extractedQuick.trim() && isMounted) {
                const parsed = parseContentIntoBlocks(extractedQuick);
                setBlocks(parsed);
                setEditorFullText(extractedQuick);
                lastInternalContentRef.current = extractedQuick;
                onUpdateContent(extractedQuick);
                setStatusMsg(`Đã nạp tự động ${parsed.length} vùng nội dung từ tệp PDF vào bảng sửa! Bấm vào đây để xem ngay các vùng.`);
                setTimeout(() => setStatusMsg(''), 8000);
              }
            } catch (quickErr) {
              console.warn('Quick PDF text extract notice:', quickErr);
            }
          }
        })
        .catch(err => {
          console.warn('Không thể nạp PDF canvas:', err);
        });
    } else {
      setPdfDoc(null);
      setPdfPageCount(0);
    }
    return () => {
      isMounted = false;
    };
  }, [attachment?.dataUrl, isPdf]);

  // Kết xuất trang PDF lên Canvas khi đổi trang hoặc zoom
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || activeTab !== 'pdf_canvas') return;
    let isCancelled = false;

    setIsRenderingPdf(true);
    renderPdfPageToCanvas(pdfDoc, currentPdfPage, canvasRef.current, pdfScale)
      .then(() => {
        if (!isCancelled) {
          setIsRenderingPdf(false);
          setCropRect(null);
          setCroppedPreviewUrl(null);
        }
      })
      .catch(err => {
        if (!isCancelled) {
          console.warn('Lỗi kết xuất trang PDF:', err);
          setIsRenderingPdf(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, currentPdfPage, pdfScale, activeTab]);

  // Cập nhật lên component cha
  const syncContent = (newBlocks: DocumentBlock[]) => {
    setBlocks(newBlocks);
    const serialized = serializeBlocksToContent(newBlocks);
    lastInternalContentRef.current = serialized;
    setEditorFullText(serialized);
    onUpdateContent(serialized);
  };

  const syncFullText = (text: string) => {
    setEditorFullText(text);
    lastInternalContentRef.current = text;
    onUpdateContent(text);
    // Không tự động gọi parseContentIntoBlocks(text) trên mỗi ký tự gõ phím để giữ vị trí con trỏ và scroll
  };

  // Chuyển tab và đồng bộ nội dung liền mạch giữa các tab
  const handleSwitchTab = (newTab: 'blocks' | 'pdf_canvas' | 'editor') => {
    if (activeTab === 'editor' && newTab === 'blocks') {
      const parsed = parseContentIntoBlocks(editorFullText);
      setBlocks(prev => {
        if (prev.length > 1 && parsed.length <= 1) return prev;
        return parsed;
      });
    } else if (activeTab === 'blocks' && newTab === 'editor') {
      const serialized = serializeBlocksToContent(blocks);
      setEditorFullText(serialized);
    }
    setActiveTab(newTab);
  };

  // Cuộn ngay đến một vùng nội dung cụ thể và tạo hiệu ứng nhấp nháy làm nổi bật
  const scrollToBlock = (index: number) => {
    handleSwitchTab('blocks');
    setTimeout(() => {
      const el = document.getElementById(`block-card-${index}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
        }, 2500);
      } else {
        blocksScrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 80);
  };

  // Tự động phân tách lại văn bản thành các vùng nội dung
  const handleAutoSplitBlocks = () => {
    const textToSplit = editorFullText || serializeBlocksToContent(blocks);
    const newBlocks = splitTextIntoCustomBlocks(textToSplit, 7);
    syncContent(newBlocks);
    setStatusMsg(`Đã tự động phân tách thành ${newBlocks.length} vùng nội dung thành công!`);
    setTimeout(() => setStatusMsg(''), 5000);
    scrollToBlock(0);
  };

  // 1. DỊCH CHUYỂN KHỐI (MOVE UP / DOWN)
  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(index, 1);
    newBlocks.splice(targetIndex, 0, moved);
    syncContent(newBlocks);

    setStatusMsg(`Đã dịch chuyển "${moved.title}" ${direction === 'up' ? 'lên trên' : 'xuống dưới'}`);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  // 2. CẮT KHỐI (CUT)
  const handleCutBlock = (index: number) => {
    const target = blocks[index];
    setClipboardBlock(target);
    const newBlocks = blocks.filter((_, i) => i !== index);
    syncContent(newBlocks.length > 0 ? newBlocks : [{ id: 'b-empty', title: 'Khối mới', content: '', type: 'text' }]);

    setStatusMsg(`Đã cắt vùng "${target.title}" vào bộ nhớ tạm`);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  // 3. DÁN KHỐI (PASTE)
  const handlePasteBlock = (targetIndex: number) => {
    if (!clipboardBlock) return;
    const newBlock: DocumentBlock = {
      ...clipboardBlock,
      id: `block-${Date.now()}`
    };
    const newBlocks = [...blocks];
    newBlocks.splice(targetIndex + 1, 0, newBlock);
    syncContent(newBlocks);

    setStatusMsg(`Đã dán vùng "${newBlock.title}" vào vị trí mới`);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  // 4. XÓA KHỐI (DELETE)
  const handleDeleteBlock = (index: number) => {
    const target = blocks[index];
    if (blocks.length === 1) {
      syncContent([{ id: `b-${Date.now()}`, title: 'Vùng nội dung', content: '', type: 'text' }]);
      return;
    }
    const newBlocks = blocks.filter((_, i) => i !== index);
    syncContent(newBlocks);
    setStatusMsg(`Đã xóa vùng "${target.title}"`);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  // 5. THÊM KHỐI MỚI (ADD BLOCK)
  const handleAddBlock = (targetIndex: number) => {
    const newBlock: DocumentBlock = {
      id: `block-${Date.now()}`,
      title: `Vùng nội dung ${blocks.length + 1}`,
      content: '',
      type: 'text'
    };
    const newBlocks = [...blocks];
    newBlocks.splice(targetIndex + 1, 0, newBlock);
    syncContent(newBlocks);
  };

  // 6. GỘP VỚI KHỐI DƯỚI (MERGE)
  const handleMergeBlock = (index: number) => {
    if (index >= blocks.length - 1) return;
    const current = blocks[index];
    const next = blocks[index + 1];

    const mergedBlock: DocumentBlock = {
      ...current,
      content: current.content + '\n\n' + next.content
    };

    const newBlocks = [...blocks];
    newBlocks.splice(index, 2, mergedBlock);
    syncContent(newBlocks);
    setStatusMsg(`Đã gộp "${current.title}" và "${next.title}"`);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  // 7. CẬP NHẬT NỘI DUNG TỪNG KHỐI (GIỮ NGUYÊN VỊ TRÍ CON TRỎ VÀ SCROLL)
  const handleUpdateBlockContent = (index: number, content: string) => {
    const container = blocksScrollContainerRef.current;
    const currentScrollTop = container ? container.scrollTop : 0;

    setBlocks(prev => {
      const newBlocks = [...prev];
      newBlocks[index] = { ...newBlocks[index], content };
      const serialized = serializeBlocksToContent(newBlocks);
      lastInternalContentRef.current = serialized;
      setEditorFullText(serialized);
      onUpdateContent(serialized);
      return newBlocks;
    });

    if (container && container.scrollTop !== currentScrollTop) {
      container.scrollTop = currentScrollTop;
    }
  };

  const handleUpdateBlockTitle = (index: number, newTitle: string) => {
    const container = blocksScrollContainerRef.current;
    const currentScrollTop = container ? container.scrollTop : 0;

    setBlocks(prev => {
      const newBlocks = [...prev];
      newBlocks[index] = { ...newBlocks[index], title: newTitle };
      const serialized = serializeBlocksToContent(newBlocks);
      lastInternalContentRef.current = serialized;
      setEditorFullText(serialized);
      onUpdateContent(serialized);
      return newBlocks;
    });

    if (container && container.scrollTop !== currentScrollTop) {
      container.scrollTop = currentScrollTop;
    }
  };

  // 8. TÍNH NĂNG ĐẶC BIỆT: XÓA KHOẢNG TRẮNG TRÊN PDF (CLEAN WHITESPACES)
  const handleCleanWhiteSpaces = () => {
    const currentText = activeTab === 'editor' ? editorFullText : serializeBlocksToContent(blocks);
    const { cleanedText, stats } = cleanPdfWhiteSpaces(currentText, {
      trimEmptyLines: true,
      removeHeadersFooters: true,
      unbreakLines: true,
      normalizePunctuation: true,
      removeDoubleSpaces: true
    });

    syncFullText(cleanedText);
    setStatusMsg(`Đã xóa sạch ${stats.linesRemoved} dòng rác/khoảng trắng thừa và tối ưu hóa lề PDF!`);
    setTimeout(() => setStatusMsg(''), 4500);
  };

  // 9. SỬA PHÔNG TIẾNG VIỆT & CHUẨN HÓA LATEX TOÁN
  const handleRepairFontAndMath = () => {
    const currentText = activeTab === 'editor' ? editorFullText : serializeBlocksToContent(blocks);
    const repaired = repairVietnameseDocument(currentText);
    syncFullText(repaired);
    setStatusMsg('Đã sửa sạch lỗi phông TCVN3/VNI và chuẩn hóa công thức LaTeX!');
    setTimeout(() => setStatusMsg(''), 4000);
  };

  // 10. TÍNH NĂNG CẮT VÙNG TRỰC QUAN TỪ CANVAS PDF (VISUAL CROP & PASTE)
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isCropMode || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCropStart({ x, y });
    setCropRect({ x, y, width: 0, height: 0 });
    setCroppedPreviewUrl(null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isCropMode || !cropStart || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const currentY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    const x = Math.min(cropStart.x, currentX);
    const y = Math.min(cropStart.y, currentY);
    const width = Math.abs(currentX - cropStart.x);
    const height = Math.abs(currentY - cropStart.y);

    setCropRect({ x, y, width, height });
  };

  const handleCanvasMouseUp = () => {
    if (!isCropMode || !cropRect || !canvasRef.current) return;
    setCropStart(null);

    if (cropRect.width > 15 && cropRect.height > 15) {
      // Tính tỉ lệ thực tế giữa Canvas pixel và client width
      const scaleX = canvasRef.current.width / canvasRef.current.clientWidth;
      const scaleY = canvasRef.current.height / canvasRef.current.clientHeight;

      const realCropRect = {
        x: cropRect.x * scaleX,
        y: cropRect.y * scaleY,
        width: cropRect.width * scaleX,
        height: cropRect.height * scaleY
      };

      const croppedDataUrl = cropRegionFromCanvas(canvasRef.current, realCropRect, true);
      setCroppedPreviewUrl(croppedDataUrl);
    }
  };

  // Dán vùng ảnh đã cắt từ PDF vào bài học
  const handleInsertCroppedImage = (targetBlockIndex = 0) => {
    if (!croppedPreviewUrl) return;

    const imgMarkdown = `\n\n![Hình vẽ trích từ PDF trang ${currentPdfPage}](${croppedPreviewUrl})\n\n`;

    if (activeTab === 'editor') {
      syncFullText(editorFullText + imgMarkdown);
    } else {
      const newBlocks = [...blocks];
      const target = newBlocks[targetBlockIndex] || newBlocks[0];
      if (target) {
        target.content = target.content.trim() + imgMarkdown;
        syncContent(newBlocks);
      }
    }

    setCropRect(null);
    setCroppedPreviewUrl(null);
    setIsCropMode(false);
    setStatusMsg(`Đã cắt dán thành công hình ảnh từ trang ${currentPdfPage} vào bài học!`);
    setTimeout(() => setStatusMsg(''), 4000);
  };

  // Chèn công thức toán nhanh
  const insertFormulaQuick = (template: string) => {
    syncFullText(editorFullText + ' ' + template + ' ');
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-gray-800 rounded-xl overflow-hidden border border-slate-200">
      
      {/* 1. TOP HEADER: THÔNG TIN TÀI LIỆU GỐC & CÔNG CỤ CHÍNH */}
      <div className="bg-white px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
        
        {/* Left: Tên tệp & Loại tài liệu */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <FileText size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-900 truncate max-w-[260px] md:max-w-md">
                {attachment?.name || title || 'Studio biên soạn tài liệu'}
              </span>
              {isPdf && (
                <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded uppercase">
                  PDF ({pdfPageCount > 0 ? `${pdfPageCount} trang` : 'Đang nạp'})
                </span>
              )}
              {attachment?.name?.endsWith('.docx') && (
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded uppercase">
                  Word .docx
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-gray-500">
              <span>Giao diện chỉnh sửa tài liệu gốc</span>
              <span>•</span>
              <button
                type="button"
                onClick={() => scrollToBlock(0)}
                className="text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                title="Bấm vào để cuộn ngay đến danh sách các vùng nội dung"
              >
                <Layers size={11} className="text-blue-600" />
                <span>{blocks.length} vùng nội dung (Bấm để xem)</span>
              </button>
              <span>•</span>
              <span>{editorFullText.length.toLocaleString('vi-VN')} ký tự</span>
            </div>
          </div>
        </div>

        {/* Center: Chuyển đổi các Chế độ chỉnh sửa */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => scrollToBlock(0)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'blocks'
                ? 'bg-white text-blue-700 shadow-2xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Dịch chuyển các vùng tài liệu, cắt dán và sắp xếp thứ tự các mục"
          >
            <Layers size={14} className={activeTab === 'blocks' ? 'text-blue-600' : 'text-gray-400'} />
            <span>1. Dịch chuyển & Cắt dán vùng</span>
            <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full font-bold">{blocks.length}</span>
          </button>

          {isPdf && (
            <button
              type="button"
              onClick={() => handleSwitchTab('pdf_canvas')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'pdf_canvas'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Xem trang PDF, cắt đồ thị, hình vẽ, bài toán dán vào bài học"
            >
              <Crop size={14} className={activeTab === 'pdf_canvas' ? 'text-blue-600' : 'text-gray-400'} />
              <span>2. Cắt dán ảnh từ PDF</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSwitchTab('editor')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'editor'
                ? 'bg-white text-blue-700 shadow-2xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Soạn thảo toàn văn và xem trước công thức toán KaTeX"
          >
            <Edit3 size={14} className={activeTab === 'editor' ? 'text-blue-600' : 'text-gray-400'} />
            <span>{isPdf ? '3.' : '2.'} Soạn thảo & Xem trước</span>
          </button>
        </div>

        {/* Right Actions: Đổi tệp & Lưu bài học */}
        <div className="flex items-center gap-2">
          <label className="cursor-pointer text-xs font-semibold text-gray-700 hover:text-blue-700 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors flex items-center gap-1">
            <UploadCloud size={14} />
            <span>{attachment ? 'Đổi tệp' : 'Đính kèm tệp / PDF'}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              className="hidden"
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  onChangeAttachment(e.target.files[0]);
                  e.target.value = '';
                }
              }}
            />
          </label>

          <button
            type="button"
            onClick={() => onSaveLesson(title, editorFullText)}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
            title="Lưu lại toàn bộ tài liệu đã chỉnh sửa vào bài học"
          >
            <Save size={14} />
            <span>{isSaving ? 'Đang lưu...' : 'Lưu bài học'}</span>
          </button>
        </div>
      </div>

      {/* 2. SECOND TOOLBAR: XÓA KHOẢNG TRẮNG TRÊN PDF & SỬA LỖI PHÔNG */}
      <div className="bg-slate-100/90 px-4 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
        
        {/* Nhóm công cụ Xóa khoảng trắng & Sửa phông */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Nút Xóa khoảng trắng trên PDF */}
          <button
            type="button"
            onClick={handleCleanWhiteSpaces}
            className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold rounded-lg shadow-2xs transition-colors"
            title="Xóa các dòng trống dồn dập, nối các câu bị PDF ngắt dòng ngang chừng, xóa số trang và header thừa"
          >
            <Eraser size={13} className="text-emerald-600" />
            <span>🧹 Xóa khoảng trắng trên PDF</span>
          </button>

          {/* Sửa phông & công thức LaTeX */}
          <button
            type="button"
            onClick={handleRepairFontAndMath}
            className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-indigo-50 text-indigo-800 border border-indigo-200 font-semibold rounded-lg shadow-2xs transition-colors"
            title="Sửa triệt để lỗi phông chữ tiếng Việt TCVN3/VNI và chuẩn hóa công thức sang LaTeX"
          >
            <Wand2 size={13} className="text-indigo-600" />
            <span>Sửa phông & Công thức LaTeX</span>
          </button>

          {clipboardBlock && (
            <span className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Scissors size={12} className="text-amber-600" />
              <span>Đang giữ vùng tạm: "{clipboardBlock.title.slice(0, 20)}..."</span>
            </span>
          )}
        </div>

        {/* Input Tiêu đề bài học trực tiếp */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <label className="text-[11px] font-bold text-gray-600 shrink-0">
            Tên bài học:
          </label>
          <input
            type="text"
            value={title}
            onChange={e => {
              setTitle(e.target.value);
              onUpdateTitle(e.target.value);
            }}
            placeholder="Nhập tên bài học (hoặc để trống tự nhận diện)..."
            className="w-full px-2.5 py-1 text-xs bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 font-medium"
          />
        </div>
      </div>

      {/* Thông báo tiến trình & thông điệp */}
      {statusMsg && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-1.5 text-xs text-emerald-800 font-medium flex items-center gap-2 animate-fadeIn shrink-0">
          <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* 3. MAIN WORKSPACE CONTENT AREA */}
      <div className="flex-1 overflow-hidden relative">

        {/* ========================================================= */}
        {/* TAB 1: DỊCH CHUYỂN, CẮT DÁN & BIÊN TẬP CÁC KHỐI TÀI LIỆU */}
        {/* ========================================================= */}
        {activeTab === 'blocks' && (
          <div ref={blocksScrollContainerRef} className="h-full overflow-y-auto p-4 md:p-6 space-y-4">
            
            {/* Banner trạng thái trích xuất tài liệu */}
            {isSaving && (
              <div className="bg-linear-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200 p-4 rounded-xl flex items-center justify-between gap-3 text-xs text-blue-900 shadow-2xs animate-pulse">
                <div className="flex items-center gap-2.5">
                  <RefreshCw size={18} className="animate-spin text-blue-600 shrink-0" />
                  <div>
                    <p className="font-bold text-blue-950">Đang tự động bóc tách tài liệu vào bảng sửa...</p>
                    <p className="text-[11px] text-blue-700 font-normal">Hệ thống đang bóc tách văn bản, chuẩn hóa công thức KaTeX, sửa lỗi phông chữ và chia thành các vùng độc lập để Thầy/Cô chỉnh sửa.</p>
                  </div>
                </div>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full shrink-0">
                  Đang xử lý
                </span>
              </div>
            )}

            {/* Hướng dẫn khi bảng sửa đang chờ tài liệu (chưa có tệp đính kèm) */}
            {blocks.length <= 1 && (!blocks[0] || !blocks[0].content.trim()) && !isSaving && !attachment && (
              <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <UploadCloud size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-800">Bảng sửa tài liệu đã sẵn sàng</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Thầy/Cô có thể bấm nút <strong className="text-blue-700">"Đính kèm tệp / PDF"</strong> ở góc trên bên phải để nạp tài liệu tự động, hoặc nhập trực tiếp văn bản vào vùng bên dưới.
                  </p>
                </div>
              </div>
            )}

            {/* Thông tin tài liệu khi ĐÃ NẠP TỆP */}
            {attachment && (
              <div className="p-3.5 bg-linear-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs font-bold">
                    <FileText size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-xs">{attachment.name}</span>
                      <span className="text-[10px] text-blue-700 bg-blue-100 px-2 py-0.2 rounded-full font-semibold">
                        {(attachment.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 mt-0.5">
                      {isSaving ? 'Đang trích xuất văn bản và công thức KaTeX vào các khối bên dưới...' : 'Tài liệu đã sẵn sàng trong giao diện chỉnh sửa. Thầy/Cô có thể dịch chuyển vùng, sửa văn bản hoặc cắt ảnh trực tiếp.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isPdf && (
                    <button
                      type="button"
                      onClick={() => handleSwitchTab('pdf_canvas')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Crop size={14} />
                      <span>Cắt ảnh PDF</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSwitchTab('editor')}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Edit3 size={14} />
                    <span>Soạn toàn văn</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-gray-500">
                Tài liệu được phân thành <strong>{blocks.length} vùng độc lập</strong>. Bạn có thể dùng nút <strong className="text-blue-700">Dịch lên / Dịch xuống</strong> để sắp xếp lại bài giảng, <strong className="text-indigo-700">Cắt dán</strong> hoặc <strong className="text-red-600">Xóa</strong> các phần thừa trên PDF.
              </div>
              <button
                type="button"
                onClick={() => handleAddBlock(blocks.length - 1)}
                className="flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1 rounded-lg transition-colors shrink-0"
              >
                <Plus size={13} />
                <span>Thêm vùng mới ở cuối</span>
              </button>
            </div>

            {blocks.map((block, index) => (
              <div 
                key={block.id} 
                className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 transition-all hover:border-blue-300 group"
              >
                {/* Khối Header Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 border border-blue-100">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={block.title}
                      onChange={e => handleUpdateBlockTitle(index, e.target.value)}
                      placeholder="Tiêu đề vùng này..."
                      className="text-xs font-bold text-gray-800 bg-transparent hover:bg-slate-50 focus:bg-white px-2 py-1 rounded border border-transparent hover:border-gray-200 focus:border-blue-400 outline-none flex-1 min-w-0"
                    />
                    <span className="text-[10px] text-gray-400 shrink-0">
                      ({block.content.length.toLocaleString('vi-VN')} ký tự)
                    </span>
                  </div>

                  {/* Thanh nút Dịch chuyển, Cắt, Dán, Gộp, Xóa */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Dịch chuyển lên */}
                    <button
                      type="button"
                      onClick={() => handleMoveBlock(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Dịch chuyển vùng này lên trên"
                    >
                      <MoveUp size={15} />
                    </button>

                    {/* Dịch chuyển xuống */}
                    <button
                      type="button"
                      onClick={() => handleMoveBlock(index, 'down')}
                      disabled={index === blocks.length - 1}
                      className="p-1.5 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Dịch chuyển vùng này xuống dưới"
                    >
                      <MoveDown size={15} />
                    </button>

                    {/* Cắt khối */}
                    <button
                      type="button"
                      onClick={() => handleCutBlock(index)}
                      className="p-1.5 text-gray-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Cắt vùng này vào bộ nhớ tạm"
                    >
                      <Scissors size={15} />
                    </button>

                    {/* Dán khối vào sau */}
                    {clipboardBlock && (
                      <button
                        type="button"
                        onClick={() => handlePasteBlock(index)}
                        className="px-2 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors flex items-center gap-1"
                        title="Dán vùng đã cắt vào ngay sau vùng này"
                      >
                        <Clipboard size={13} />
                        <span>Dán sau</span>
                      </button>
                    )}

                    {/* Gộp với khối tiếp theo */}
                    {index < blocks.length - 1 && (
                      <button
                        type="button"
                        onClick={() => handleMergeBlock(index)}
                        className="p-1.5 text-gray-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Gộp vùng này với vùng liền kề dưới"
                      >
                        <Layers size={14} />
                      </button>
                    )}

                    {/* Thêm vùng mới tại đây */}
                    <button
                      type="button"
                      onClick={() => handleAddBlock(index)}
                      className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Thêm vùng trống mới ngay phía dưới"
                    >
                      <Plus size={15} />
                    </button>

                    {/* Xóa khối */}
                    <button
                      type="button"
                      onClick={() => handleDeleteBlock(index)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa vùng tài liệu này"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Nội dung khối */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* Ô chỉnh sửa văn bản */}
                  <div>
                    <textarea
                      value={block.content}
                      onChange={e => handleUpdateBlockContent(index, e.target.value)}
                      rows={Math.min(10, Math.max(3, block.content.split('\n').length))}
                      placeholder="Nhập hoặc dán nội dung đoạn tài liệu này (hỗ trợ Markdown & công thức $...$, $$...$$)..."
                      className="w-full p-3 text-xs text-gray-800 font-mono bg-slate-50/70 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none resize-y leading-relaxed"
                    />
                  </div>

                  {/* Xem trước KaTeX trực quan của khối */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 max-h-60 overflow-y-auto text-xs leading-relaxed">
                    {block.content ? (
                      <MathText content={block.content} />
                    ) : (
                      <span className="text-gray-400 italic">Xem trước định dạng đẹp sẽ xuất hiện ở đây...</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: CẮT DÁN ẢNH TỪ TRANG PDF (VISUAL CROP & PASTE)      */}
        {/* ========================================================= */}
        {activeTab === 'pdf_canvas' && isPdf && (
          <div className="h-full flex flex-col md:flex-row overflow-hidden">
            
            {/* Cột trái: PDF Canvas Viewer & Công cụ Cắt khoanh vùng */}
            <div className="w-full md:w-3/5 h-full flex flex-col border-r border-slate-200 bg-slate-200/70">
              
              {/* Toolbar điều khiển trang & phóng to */}
              <div className="bg-white px-3 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
                {/* Chuyển trang */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPdfPage(p => Math.max(1, p - 1))}
                    disabled={currentPdfPage <= 1}
                    className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30"
                    title="Trang trước"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="font-semibold text-gray-700">
                    Trang {currentPdfPage} / {pdfPageCount || 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPdfPage(p => Math.min(pdfPageCount, p + 1))}
                    disabled={currentPdfPage >= pdfPageCount}
                    className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30"
                    title="Trang sau"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Phóng to / Thu nhỏ */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPdfScale(s => Math.max(0.8, s - 0.2))}
                    className="p-1 rounded bg-slate-100 hover:bg-slate-200"
                    title="Thu nhỏ"
                  >
                    <ZoomOut size={15} />
                  </button>
                  <span className="font-medium text-gray-600 text-[11px] w-12 text-center">
                    {Math.round(pdfScale * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setPdfScale(s => Math.min(2.5, s + 0.2))}
                    className="p-1 rounded bg-slate-100 hover:bg-slate-200"
                    title="Phóng to"
                  >
                    <ZoomIn size={15} />
                  </button>
                </div>

                {/* Nút Bật/Tắt chế độ Cắt khoanh vùng */}
                <button
                  type="button"
                  onClick={() => {
                    setIsCropMode(!isCropMode);
                    setCropRect(null);
                    setCroppedPreviewUrl(null);
                  }}
                  className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                    isCropMode 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                  }`}
                >
                  <Crop size={14} />
                  <span>{isCropMode ? 'Đang bật khoanh vùng cắt' : 'Bật khoanh vùng cắt ảnh'}</span>
                </button>
              </div>

              {/* Hướng dẫn nhanh khi bật cắt */}
              {isCropMode && (
                <div className="bg-blue-50 border-b border-blue-200 px-3 py-1.5 text-[11px] text-blue-800 font-medium flex items-center justify-between">
                  <span>💡 <strong>Hướng dẫn:</strong> Dùng chuột kéo chọn một vùng hình chữ nhật trên trang PDF để cắt ảnh đồ thị, hình vẽ hoặc công thức.</span>
                  {cropRect && (
                    <span className="font-bold text-blue-900">
                      Đã chọn: {Math.round(cropRect.width)} x {Math.round(cropRect.height)}px
                    </span>
                  )}
                </div>
              )}

              {/* Khung Canvas hiển thị trang PDF */}
              <div 
                ref={canvasContainerRef}
                className="flex-1 overflow-auto p-4 flex justify-center items-start select-none relative"
              >
                <div className="relative shadow-md border border-gray-300 bg-white">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    className={`block ${isCropMode ? 'cursor-crosshair' : 'cursor-default'}`}
                  />

                  {/* Hộp đánh dấu vùng đang cắt */}
                  {isCropMode && cropRect && cropRect.width > 2 && (
                    <div 
                      className="absolute border-2 border-dashed border-blue-600 bg-blue-500/20 pointer-events-none"
                      style={{
                        left: cropRect.x,
                        top: cropRect.y,
                        width: cropRect.width,
                        height: cropRect.height
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Cột phải: Xem ảnh đã cắt & Dán vào bài học */}
            <div className="w-full md:w-2/5 h-full flex flex-col bg-white overflow-y-auto p-4">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <ImageIcon size={15} className="text-indigo-600" />
                <span>Vùng ảnh / Đồ thị trích từ PDF</span>
              </h3>

              {croppedPreviewUrl ? (
                <div className="space-y-4">
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col items-center">
                    <img 
                      src={croppedPreviewUrl} 
                      alt="Vùng cắt từ PDF" 
                      className="max-h-60 max-w-full object-contain border border-gray-300 rounded shadow-xs bg-white"
                    />
                    <span className="text-[11px] text-gray-500 mt-2">
                      Đã tự động tỉa sạch lề trắng thừa xung quanh
                    </span>
                  </div>

                  {/* Nút hành động dán ảnh */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => handleInsertCroppedImage(0)}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                    >
                      <Plus size={15} />
                      <span>Chèn ảnh này vào bài học</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCropRect(null);
                        setCroppedPreviewUrl(null);
                      }}
                      className="w-full py-1.5 text-xs text-gray-600 hover:text-gray-900 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors"
                    >
                      Hủy bỏ vùng cắt này
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400 border-2 border-dashed border-slate-200 rounded-xl p-6">
                  <Crop size={32} className="mx-auto mb-2 opacity-30 text-blue-600" />
                  <p className="text-xs font-medium text-gray-600">Chưa có vùng ảnh nào được chọn</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Bấm nút <strong>"Bật khoanh vùng cắt ảnh"</strong> ở trên, sau đó kéo chuột khoanh vùng hình vẽ hoặc công thức bất kỳ trên trang PDF bên trái.
                  </p>
                </div>
              )}

              {/* Tóm tắt nội dung bài học đang có */}
              <div className="mt-6 pt-4 border-t border-slate-200">
                <h4 className="text-xs font-bold text-gray-700 mb-2">Xem trước bài học hiện tại:</h4>
                <div className="max-h-56 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <MathText content={editorFullText} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: SOẠN THẢO TOÀN VĂN & XEM TRƯỚC SONG SONG (SPLIT)   */}
        {/* ========================================================= */}
        {activeTab === 'editor' && (
          <div className="h-full flex flex-col">
            
            {/* Toolbar công thức & định dạng */}
            <div className="bg-white px-4 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
              
              {/* Phím tắt công thức toán */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-gray-500">Chèn nhanh:</span>
                <button
                  type="button"
                  onClick={() => insertFormulaQuick('$\\frac{a}{b}$')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded font-mono text-gray-700 font-semibold"
                >
                  a/b
                </button>
                <button
                  type="button"
                  onClick={() => insertFormulaQuick('$\\sqrt{x}$')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded font-mono text-gray-700 font-semibold"
                >
                  √x
                </button>
                <button
                  type="button"
                  onClick={() => insertFormulaQuick('$$\\begin{cases} x + y = 1 \\\\ 2x - y = 3 \\end{cases}$$')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-gray-700 font-semibold"
                >
                  Hệ PT
                </button>
                <button
                  type="button"
                  onClick={() => insertFormulaQuick('> 📌 **Định nghĩa:** ')}
                  className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded font-semibold border border-amber-200"
                >
                  📌 Định nghĩa
                </button>
                <button
                  type="button"
                  onClick={() => insertFormulaQuick('> ⚡ **Định lý:** ')}
                  className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded font-semibold border border-blue-200"
                >
                  ⚡ Định lý
                </button>
                <button
                  type="button"
                  onClick={() => insertFormulaQuick('> 💡 **Chú ý:** ')}
                  className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-semibold border border-emerald-200"
                >
                  💡 Chú ý
                </button>
              </div>

              {/* Tùy chọn xem song song */}
              <button
                type="button"
                onClick={() => setSplitView(!splitView)}
                className="flex items-center gap-1 text-gray-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-slate-100"
              >
                <Columns2 size={14} />
                <span>{splitView ? 'Tắt chia đôi màn hình' : 'Xem song song (Split View)'}</span>
              </button>
            </div>

            {/* Khung Soạn thảo & Xem trước */}
            <div className={`flex-1 overflow-hidden grid ${splitView ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
              {/* Cột soạn thảo Markdown */}
              <div className="h-full flex flex-col border-r border-slate-200 p-3">
                <textarea
                  value={editorFullText}
                  onChange={e => syncFullText(e.target.value)}
                  placeholder="Nội dung toàn bộ bài học (Markdown & công thức toán KaTeX $...$, $$...$$)..."
                  className="w-full h-full p-4 text-xs text-gray-900 font-mono bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Cột xem trước KaTeX thời gian thực */}
              {splitView && (
                <div className="h-full overflow-y-auto p-4 md:p-6 bg-white">
                  <div className="max-w-2xl mx-auto">
                    <MathText content={editorFullText} isDocument={true} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentEditorWorkspace;
