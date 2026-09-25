import React, { useState, useRef } from 'react';
import { 
  Printer, 
  Download, 
  FileText, 
  X, 
  Check, 
  Settings2, 
  Loader2, 
  ExternalLink, 
  FileCheck, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import MathText from '../MathText';
import { generatePdfFromElements } from '../../utils/offlinePdfExport';
import { ensureAttachmentDataUrl } from '../../lib/fileUtils';
import { repairVietnameseDocument, convertTcvn3ToUnicode } from '../../lib/vietnameseFont';

/**
 * Converts raw LaTeX math into clean, readable mathematical typography for Microsoft Word
 */
function formatLatexForWord(rawLatex: string): string {
  if (!rawLatex) return '';
  let s = rawLatex.trim();
  // Fractions: \frac{a}{b} -> (a)/(b)
  s = s.replace(/\\(?:d|t)?frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)');
  s = s.replace(/\\(?:d|t)?frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)');
  // Square root: \sqrt{a} -> √(a)
  s = s.replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');
  // Superscripts & Subscripts
  s = s.replace(/\^\{([^{}]+)\}/g, '<sup>$1</sup>');
  s = s.replace(/\^([0-9a-zA-Z])/g, '<sup>$1</sup>');
  s = s.replace(/_\{([^{}]+)\}/g, '<sub>$1</sub>');
  s = s.replace(/_([0-9a-zA-Z])/g, '<sub>$1</sub>');
  // Vectors
  s = s.replace(/\\(?:vec|overrightarrow)\{([^{}]+)\}/g, '$1⃗');
  // Math & Greek symbols
  s = s
    .replace(/\\pm\b/g, '±')
    .replace(/\\times\b/g, '×')
    .replace(/\\div\b/g, '÷')
    .replace(/\\le(q)?\b/g, '≤')
    .replace(/\\ge(q)?\b/g, '≥')
    .replace(/\\neq\b/g, '≠')
    .replace(/\\approx\b/g, '≈')
    .replace(/\\equiv\b/g, '≡')
    .replace(/\\in\b/g, '∈')
    .replace(/\\notin\b/g, '∉')
    .replace(/\\subset\b/g, '⊂')
    .replace(/\\cup\b/g, '∪')
    .replace(/\\cap\b/g, '∩')
    .replace(/\\emptyset\b/g, '∅')
    .replace(/\\infty\b/g, '∞')
    .replace(/\\int\b/g, '∫')
    .replace(/\\sum\b/g, '∑')
    .replace(/\\prod\b/g, '∏')
    .replace(/\\alpha\b/g, 'α')
    .replace(/\\beta\b/g, 'β')
    .replace(/\\gamma\b/g, 'γ')
    .replace(/\\Delta\b/g, 'Δ')
    .replace(/\\pi\b/g, 'π')
    .replace(/\\theta\b/g, 'θ')
    .replace(/\\cdot\b/g, '·')
    .replace(/\\Leftrightarrow\b/g, ' ⇔ ')
    .replace(/\\Rightarrow\b/g, ' ⇒ ')
    .replace(/\\to\b/g, ' → ')
    .replace(/\\parallel\b/g, ' ∥ ')
    .replace(/\\perp\b/g, ' ⊥ ')
    .replace(/\\left[\[\(\{.]/g, '')
    .replace(/\\right[\]\)\}.]/g, '')
    .replace(/\\text\{([^{}]+)\}/g, '$1')
    .replace(/\\mathrm\{([^{}]+)\}/g, '$1')
    .replace(/\\mathbf\{([^{}]+)\}/g, '<b>$1</b>');

  return s;
}

interface LessonPrintExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: {
    id: string;
    title: string;
    content?: string;
    knowledge?: string;
    grade?: number | string;
    topicId?: string;
    attachment?: any;
    videoUrl?: string;
    updatedAt?: any;
    createdAt?: any;
  } | null;
  topicName?: string;
  grade?: number | string;
  teacherName?: string;
}

export const LessonPrintExportModal: React.FC<LessonPrintExportModalProps> = ({
  isOpen,
  onClose,
  lesson,
  topicName = '',
  grade = '',
  teacherName = 'Giáo viên bộ môn'
}) => {
  const [fontSize, setFontSize] = useState<'12pt' | '13pt' | '14pt'>('13pt');
  const [schoolName, setSchoolName] = useState('TRƯỜNG THPT ....................');
  const [departmentName, setDepartmentName] = useState('TỔ TOÁN - TIN HỌC');
  const [showHeader, setShowHeader] = useState(true);
  const [showFooter, setShowFooter] = useState(true);
  const [showMetadata, setShowMetadata] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isDownloadingOriginal, setIsDownloadingOriginal] = useState(false);
  const [pdfProgressText, setPdfProgressText] = useState('');
  const [exportSuccessMsg, setExportSuccessMsg] = useState('');

  const printContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !lesson) return null;

  const rawLessonText = lesson.content || lesson.knowledge || '';
  const lessonContent = convertTcvn3ToUnicode(repairVietnameseDocument(rawLessonText));
  const currentYear = new Date().getFullYear();
  const currentDateStr = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // 1. Tải lại file gốc nguyên bản của bài học (nếu có tệp đính kèm)
  const handleDownloadOriginal = async () => {
    if (!lesson?.attachment) return;
    setIsDownloadingOriginal(true);
    try {
      const dataUrl = await ensureAttachmentDataUrl(lesson.attachment);
      if (dataUrl) {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = lesson.attachment.name || `${lesson.title}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setExportSuccessMsg(`Đã tải về tệp gốc nguyên bản: ${lesson.attachment.name}`);
        setTimeout(() => setExportSuccessMsg(''), 5000);
      } else if (lesson.attachment.fileUrl) {
        window.open(lesson.attachment.fileUrl, '_blank');
      }
    } catch (e: any) {
      alert('Không thể tải tệp gốc: ' + (e?.message || 'Có lỗi xảy ra'));
    } finally {
      setIsDownloadingOriginal(false);
    }
  };

  // 2. Trình duyệt In trực tiếp (Browser Print -> Máy in giấy hoặc Lưu PDF)
  const handleNativePrint = async () => {
    if (typeof document !== 'undefined' && document.fonts) {
      await document.fonts.ready;
    }
    window.print();
  };

  // 3. Xuất file PDF chuẩn A4 tải về máy
  const handleExportPdf = async () => {
    const container = printContainerRef.current;
    if (!container) return;

    setIsExportingPdf(true);
    setPdfProgressText('Đang nạp phông chữ chuẩn và kết xuất trang in A4...');

    try {
      // Đảm bảo toàn bộ phông chữ hệ thống & KaTeX đã nạp xong
      if (typeof document !== 'undefined' && document.fonts) {
        await document.fonts.ready;
      }
      await new Promise(resolve => setTimeout(resolve, 400));

      const cleanTitle = (lesson.title || 'Bai_hoc').replace(/[\s\/\\:*?"<>|]+/g, '_');
      const fileName = `Bai_hoc_${cleanTitle}_Khoi${grade || ''}_${Date.now()}.pdf`;

      const result = await generatePdfFromElements([container], {
        fileName,
        onProgress: (text) => setPdfProgressText(text)
      });

      setExportSuccessMsg(`Đã tạo thành công file PDF: ${result.fileName}`);
      setTimeout(() => setExportSuccessMsg(''), 5000);
    } catch (err: any) {
      console.error('Lỗi khi xuất PDF bài học:', err);
      alert('Lỗi xuất PDF: ' + (err?.message || 'Không thể tạo file'));
    } finally {
      setIsExportingPdf(false);
      setPdfProgressText('');
    }
  };

  // 4. Xuất file Microsoft Word (.doc) chuẩn phông tiếng Việt & công thức toán
  const handleExportWord = () => {
    const container = printContainerRef.current;
    if (!container) return;

    try {
      const cleanTitle = (lesson.title || 'Bai_hoc').replace(/[\s\/\\:*?"<>|]+/g, '_');
      const fileName = `Bai_hoc_${cleanTitle}_Khoi${grade || ''}.doc`;

      // Tạo bản sao DOM làm sạch riêng cho Microsoft Word
      const clone = container.cloneNode(true) as HTMLElement;

      // Xử lý tất cả các phần tử KaTeX để Microsoft Word hiển thị chuẩn xác công thức toán & phông chữ
      const katexElements = clone.querySelectorAll('.katex');
      katexElements.forEach(katexEl => {
        const annotation = katexEl.querySelector('annotation[encoding="application/x-tex"]');
        const rawLatex = annotation ? annotation.textContent || '' : katexEl.textContent || '';
        const mathmlEl = katexEl.querySelector('math');

        const wrapper = document.createElement('span');
        wrapper.className = 'math-formula-wrapper';

        if (mathmlEl) {
          // Word 2013+ hỗ trợ trực tiếp MathML chuẩn
          const mathmlClone = mathmlEl.cloneNode(true) as HTMLElement;
          mathmlClone.setAttribute('xmlns', 'http://www.w3.org/1998/Math/MathML');
          wrapper.appendChild(mathmlClone);
        } else {
          // Fallback định dạng ký tự toán học đẹp mắt cho Word (phân số, lũy thừa, căn số)
          const formatted = formatLatexForWord(rawLatex);
          const mathSpan = document.createElement('span');
          mathSpan.className = 'math-formula';
          mathSpan.style.fontFamily = "'Cambria Math', 'Times New Roman', serif";
          mathSpan.style.fontStyle = 'italic';
          mathSpan.style.color = '#002060';
          mathSpan.innerHTML = ` ${formatted} `;
          wrapper.appendChild(mathSpan);
        }

        katexEl.parentNode?.replaceChild(wrapper, katexEl);
      });

      // Dọn dẹp các thẻ hiển thị phụ trợ không cần thiết trong Word
      clone.querySelectorAll('.katex-html, .katex-display').forEach(el => {
        if (!el.querySelector('.math-formula-wrapper') && !el.querySelector('math')) {
          el.remove();
        }
      });

      // Loại bỏ các thuộc tính contenteditable hoặc tooltip
      clone.querySelectorAll('[contenteditable]').forEach(el => {
        el.removeAttribute('contenteditable');
        el.removeAttribute('suppresscontenteditablewarning');
        el.removeAttribute('title');
      });

      const htmlBody = clone.innerHTML;

      const htmlDocument = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office'
              xmlns:w='urn:schemas-microsoft-com:office:word'
              xmlns:m='http://schemas.microsoft.com/office/2004/12/omml'
              xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
          <meta name="ProgId" content="Word.Document">
          <meta name="Generator" content="Microsoft Word 15">
          <meta name="Originator" content="Microsoft Word 15">
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotOptimizeForBrowser/>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <title>${lesson.title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap');
            @page Section1 {
              size: 595.3pt 841.9pt; /* A4 */
              margin: 1.0in 0.8in 1.0in 0.8in;
              mso-header-margin: .5in;
              mso-footer-margin: .5in;
            }
            div.Section1 { page: Section1; }
            body, div, p, span, h1, h2, h3, h4, td, th {
              font-family: 'Times New Roman', 'Liberation Serif', 'Be Vietnam Pro', serif !important;
              mso-ascii-font-family: 'Times New Roman';
              mso-fareast-font-family: 'Times New Roman';
              mso-hansi-font-family: 'Times New Roman';
              mso-bidi-font-family: 'Times New Roman';
              font-size: ${fontSize};
              line-height: 1.5;
              color: #000000;
            }
            h1 { font-size: 16pt; font-weight: bold; text-align: center; margin: 12pt 0 6pt 0; color: #1e3a8a; }
            h2 { font-size: 14pt; font-weight: bold; margin: 10pt 0 4pt 0; color: #1e293b; }
            h3 { font-size: 13pt; font-weight: bold; margin: 8pt 0 3pt 0; }
            h4 { font-size: 12pt; font-weight: bold; margin: 6pt 0 2pt 0; }
            p { margin: 0 0 6pt 0; text-align: justify; }
            table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
            table, th, td { border: 1px solid black; padding: 4pt 6pt; }
            th { background-color: #f1f5f9; font-weight: bold; text-align: center; }
            .math-formula, .math-formula-wrapper {
              font-family: 'Cambria Math', 'Times New Roman', serif !important;
              font-style: italic !important;
              color: #002060 !important;
              mso-ascii-font-family: 'Cambria Math';
            }
            blockquote {
              border-left: 3pt solid #3b82f6;
              background-color: #f8fafc;
              padding: 4pt 8pt;
              margin: 6pt 0;
            }
          </style>
        </head>
        <body>
          <div class="Section1">
            ${htmlBody}
          </div>
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff', htmlDocument], { type: 'application/msword;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      setTimeout(() => {
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
      }, 2000);

      setExportSuccessMsg(`Đã tạo thành công file Word: ${fileName}`);
      setTimeout(() => setExportSuccessMsg(''), 5000);
    } catch (err: any) {
      console.error('Lỗi khi xuất Word:', err);
      alert('Lỗi xuất file Word: ' + (err?.message || 'Có lỗi xảy ra'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn">
      <div className="bg-gray-100 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col h-[94vh] overflow-hidden border border-gray-300">
        
        {/* Modal Top Header */}
        <div className="bg-white px-5 py-3.5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <Printer size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-gray-900 truncate">
                Xuất file bài học để in: {lesson.title}
              </h2>
              <p className="text-xs text-gray-500">
                Khối {grade || 'Toán học'} • {topicName || 'Tài liệu giảng dạy'} • Chuẩn trang A4
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-xl transition-colors"
              title="Đóng cửa sổ"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Action & Options Toolbar */}
        <div className="bg-white px-5 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 shadow-2xs">
          {/* Quick Settings */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200">
              <span className="font-semibold text-gray-600">Cỡ chữ in:</span>
              {(['12pt', '13pt', '14pt'] as const).map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setFontSize(size)}
                  className={`px-2 py-0.5 rounded font-medium transition-all ${
                    fontSize === size 
                      ? 'bg-blue-600 text-white shadow-2xs font-bold' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {size === '13pt' ? '13pt (Chuẩn)' : size}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-gray-700 select-none">
              <input
                type="checkbox"
                checked={showHeader}
                onChange={e => setShowHeader(e.target.checked)}
                className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span>Tiêu đề trường / tổ bộ môn</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-gray-700 select-none">
              <input
                type="checkbox"
                checked={showMetadata}
                onChange={e => setShowMetadata(e.target.checked)}
                className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span>Thông tin ngày & người soạn</span>
            </label>
          </div>

        {/* Action Buttons: Print, PDF, Word */}
          <div className="flex items-center gap-2">
            {/* 1. Nút Tải lại tệp gốc nguyên bản (nếu có tệp đính kèm) */}
            {lesson.attachment && (
              <button
                type="button"
                onClick={handleDownloadOriginal}
                disabled={isDownloadingOriginal}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                title={`Tải lại chính xác tệp gốc ban đầu: ${lesson.attachment.name} (giữ nguyên 100% định dạng)`}
              >
                {isDownloadingOriginal ? <Loader2 size={15} className="animate-spin" /> : <FileCheck size={15} />}
                <span>Tải tệp gốc ({lesson.attachment.name.split('.').pop()?.toUpperCase()})</span>
              </button>
            )}

            {/* 2. Nút In trực tiếp */}
            <button
              type="button"
              onClick={handleNativePrint}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors"
              title="Mở hộp thoại In của trình duyệt (In ra máy in giấy hoặc Lưu PDF vector siêu nét)"
            >
              <Printer size={15} />
              <span>In ngay (Ctrl + P)</span>
            </button>

            {/* 3. Nút Tải PDF */}
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-colors disabled:opacity-50"
              title="Tải xuống tệp PDF chuẩn khổ A4 sắc nét"
            >
              {isExportingPdf ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              <span>{isExportingPdf ? 'Đang xuất...' : 'Tải file PDF'}</span>
            </button>

            {/* 4. Nút Tải Word */}
            <button
              type="button"
              onClick={handleExportWord}
              className="flex items-center gap-1.5 bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300 font-semibold px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
              title="Tải tệp Word (.doc) chuẩn phông tiếng Việt và công thức toán học"
            >
              <FileText size={15} className="text-blue-700" />
              <span>Tải file Word (.doc)</span>
            </button>
          </div>
        </div>

        {/* Banner tệp gốc nếu bài học có tệp đính kèm */}
        {lesson.attachment && (
          <div className="bg-emerald-50/90 border-b border-emerald-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs shrink-0">
            <div className="flex items-center gap-2 text-emerald-900 font-medium">
              <FileCheck size={16} className="text-emerald-700 shrink-0" />
              <span>
                Tệp học liệu gốc đính kèm: <strong>{lesson.attachment.name}</strong>
              </span>
              <span className="hidden sm:inline-block text-[11px] text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200">
                100% nguyên vẹn công thức & định dạng gốc
              </span>
            </div>
            <button
              type="button"
              onClick={handleDownloadOriginal}
              disabled={isDownloadingOriginal}
              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isDownloadingOriginal ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
              <span>Tải tệp gốc ngay</span>
            </button>
          </div>
        )}

        {/* Progress or Success alerts */}
        {pdfProgressText && (
          <div className="bg-blue-50 border-b border-blue-200 px-5 py-2 text-xs text-blue-700 font-medium flex items-center gap-2 animate-pulse">
            <Loader2 size={13} className="animate-spin" />
            <span>{pdfProgressText}</span>
          </div>
        )}
        {exportSuccessMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2 text-xs text-emerald-800 font-semibold flex items-center gap-2">
            <Check size={14} className="text-emerald-600" />
            <span>{exportSuccessMsg}</span>
          </div>
        )}

        {/* Printable Canvas & Preview Area */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 flex justify-center bg-gray-200/80">
          <div
            id="lesson-print-content"
            ref={printContainerRef}
            className="bg-white text-gray-900 shadow-xl w-full max-w-[210mm] p-8 sm:p-12 rounded-sm print:p-0 print:shadow-none print:w-full print:max-w-none transition-all"
            style={{
              fontFamily: "'Be Vietnam Pro', 'Times New Roman', 'Liberation Serif', serif",
              fontSize: fontSize,
              lineHeight: 1.5,
              minHeight: '297mm'
            }}
          >
            {/* Embedded styles ensuring high-fidelity font rendering during print and PDF export */}
            <style>{`
              @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,600&display=swap');
              #lesson-print-content, #lesson-print-content p, #lesson-print-content span, #lesson-print-content div, #lesson-print-content td, #lesson-print-content th {
                font-family: 'Be Vietnam Pro', 'Times New Roman', 'Liberation Serif', serif !important;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }
              #lesson-print-content .katex {
                font-family: KaTeX_Main, 'Times New Roman', serif !important;
              }
              #lesson-print-content .katex-math {
                font-family: KaTeX_Math, 'Times New Roman', serif !important;
              }
              @media print {
                @page {
                  size: A4 portrait;
                  margin: 15mm 15mm 15mm 15mm;
                }
                body {
                  background: white !important;
                  margin: 0 !important;
                }
                #lesson-print-content {
                  padding: 0 !important;
                  box-shadow: none !important;
                  max-width: 100% !important;
                  width: 100% !important;
                }
                .export-avoid-break {
                  page-break-inside: avoid;
                  break-inside: avoid;
                }
              }
            `}</style>
            {/* Header Block chuẩn sư phạm Việt Nam */}
            {showHeader && (
              <div className="border-b border-gray-400 pb-3 mb-6">
                <table className="w-full text-center border-collapse header-table" style={{ border: 'none' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'top', border: 'none' }}>
                        <div className="text-[12pt] font-normal uppercase tracking-wider text-gray-800">
                          SỞ GIÁO DỤC VÀ ĐÀO TẠO
                        </div>
                        <div 
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={e => setSchoolName(e.currentTarget.textContent || schoolName)}
                          className="text-[12pt] font-bold uppercase tracking-wider text-gray-900 cursor-text hover:bg-yellow-50 focus:bg-yellow-50 rounded px-1 transition-colors"
                          title="Nhấp để sửa tên trường trực tiếp"
                        >
                          {schoolName}
                        </div>
                        <div 
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={e => setDepartmentName(e.currentTarget.textContent || departmentName)}
                          className="text-[11pt] font-semibold text-gray-700 italic cursor-text hover:bg-yellow-50 focus:bg-yellow-50 rounded px-1 transition-colors"
                          title="Nhấp để sửa tên tổ bộ môn trực tiếp"
                        >
                          {departmentName}
                        </div>
                        <div className="w-24 border-b border-gray-400 mx-auto mt-1 mb-1"></div>
                      </td>
                      <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'top', border: 'none' }}>
                        <div className="text-[12pt] font-bold uppercase tracking-wider text-gray-900">
                          TÀI LIỆU HỌC TẬP & ÔN TẬP
                        </div>
                        <div className="text-[11pt] font-bold text-gray-800">
                          MÔN: TOÁN HỌC {grade ? `- KHỐI ${grade}` : ''}
                        </div>
                        <div className="text-[10pt] text-gray-600 italic">
                          Năm học: {currentYear} - {currentYear + 1}
                        </div>
                        <div className="w-24 border-b border-gray-400 mx-auto mt-1 mb-1"></div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Lesson Title & Topic */}
            <div className="text-center my-4">
              <h1 className="text-[16pt] sm:text-[18pt] font-black uppercase text-gray-900 tracking-wide mb-1 leading-snug">
                BÀI HỌC: {lesson.title}
              </h1>
              {topicName && (
                <div className="text-[12pt] font-bold text-gray-700 italic">
                  Chương / Chủ đề: {topicName}
                </div>
              )}
              {showMetadata && (
                <div className="text-[10pt] text-gray-500 italic mt-1">
                  Người biên soạn: {teacherName} • Ngày xuất bản: {currentDateStr}
                </div>
              )}
            </div>

            {/* Subtle Divider */}
            <div className="flex items-center justify-center my-4 text-gray-400 text-xs font-serif">
              ✦ ✦ ✦
            </div>

            {/* Main Lesson Body */}
            <div className="lesson-print-body mt-4 text-justify leading-relaxed">
              {lessonContent ? (
                <MathText content={lessonContent} isDocument={true} />
              ) : (
                <div className="text-center py-12 text-gray-400 italic">
                  (Bài học này chưa có nội dung văn bản học liệu)
                </div>
              )}
            </div>

            {/* Video & Attachment Notes if present */}
            {(lesson.attachment || lesson.videoUrl) && (
              <div className="mt-8 pt-4 border-t border-dashed border-gray-300 text-[10pt] text-gray-600 export-avoid-break">
                <div className="font-bold text-gray-800 mb-1">TÀI LIỆU VÀ NGUỒN THAM KHẢO LIÊN QUAN:</div>
                {lesson.attachment && (
                  <div>• Tệp học liệu gốc đính kèm: <strong>{lesson.attachment.name}</strong></div>
                )}
                {lesson.videoUrl && (
                  <div>• Video bài giảng trực tuyến: <strong>{lesson.videoUrl}</strong></div>
                )}
              </div>
            )}

            {/* Footer */}
            {showFooter && (
              <div className="mt-10 pt-3 border-t border-gray-300 text-center text-[10pt] text-gray-500 italic export-avoid-break">
                --- HẾT ---
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonPrintExportModal;
