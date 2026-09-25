// Bộ công cụ xử lý, cắt dán và làm sạch tài liệu PDF & văn bản
import * as pdfjsLib from 'pdfjs-dist';

// Cấu hình worker cho pdfjs-dist
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '5.4.296'}/pdf.worker.min.mjs`;
  } catch (e) {
    console.warn('PDF.js worker initialization warning:', e);
  }
}

export interface DocumentBlock {
  id: string;
  title: string;
  content: string;
  type: 'header' | 'theory' | 'example' | 'exercise' | 'image' | 'text';
  pageNumber?: number;
}

/**
 * Xóa khoảng trắng trên PDF và làm sạch văn bản
 */
export interface CleanPdfOptions {
  trimEmptyLines?: boolean;
  removeHeadersFooters?: boolean;
  unbreakLines?: boolean;
  normalizePunctuation?: boolean;
  removeDoubleSpaces?: boolean;
}

export function cleanPdfWhiteSpaces(
  rawText: string, 
  options: CleanPdfOptions = {
    trimEmptyLines: true,
    removeHeadersFooters: true,
    unbreakLines: true,
    normalizePunctuation: true,
    removeDoubleSpaces: true
  }
): { cleanedText: string; stats: { linesRemoved: number; charsReduced: number } } {
  if (!rawText) return { cleanedText: '', stats: { linesRemoved: 0, charsReduced: 0 } };

  const originalLength = rawText.length;
  const originalLineCount = rawText.split('\n').length;

  let text = rawText;

  // 1. Chuẩn hóa ký tự xuống dòng
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 2. Xóa các ký tự điều khiển và tab thừa
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

  let lines = text.split('\n');

  // 3. Xóa Header / Footer & số trang thường gặp trong PDF
  if (options.removeHeadersFooters) {
    const headerFooterPatterns = [
      /^(trang|page)\s*\d+(\s*[\/\-]\s*\d+)?\s*$/i,
      /^\d+\s*[\/\-]\s*\d+\s*$/,
      /^(sở|phòng|bộ)\s+giáo\s+dục\s+và\s+đào\s+tạo.*$/i,
      /^trường\s+(thpt|thcs|tiểu\s+học|đại\s+học).*$/i,
      /^tổ\s+(toán|khtn|chuyên\s+môn).*$/i,
      /^tài\s+liệu\s+(lưu\s+hành\s+nội\s+bộ|ôn\s+tập|giảng\s+dạy).*$/i,
      /^---+\s*(trang|page)\s*\d+.*$/i,
      /^www\.[a-z0-9\.\-]+\.[a-z]{2,}.*$/i,
      /^https?:\/\/[^\s]+$/i,
      /^(giáo\s+viên|biên\s+soạn|thầy|cô)\s*:\s*[^\n]{3,40}$/i
    ];

    lines = lines.filter(line => {
      const trimmed = line.trim();
      if (!trimmed) return true; // Giữ dòng trống để xử lý ở bước sau
      for (const pattern of headerFooterPatterns) {
        if (pattern.test(trimmed)) {
          return false;
        }
      }
      return true;
    });
  }

  // 4. Cắt khoảng trắng đầu và cuối mỗi dòng (Trim line whitespace)
  lines = lines.map(line => line.trim());

  // 5. Nối các câu bị ngắt dòng ngang xương do PDF (Un-break line wrapping)
  if (options.unbreakLines) {
    const unbreaked: string[] = [];
    let currentParagraph = '';

    const isSpecialBlockStart = (line: string): boolean => {
      if (!line) return false;
      // Heading Markdown
      if (/^#{1,6}\s/.test(line)) return true;
      // Bullet list
      if (/^[\-\*\+\•]\s/.test(line)) return true;
      // Numbered list
      if (/^(\d+|[a-zA-Z])[\.\)]\s/.test(line)) return true;
      // Callout quote
      if (/^>\s/.test(line)) return true;
      // Math block
      if (line.startsWith('$$') || line.endsWith('$$')) return true;
      // LaTeX environments
      if (line.includes('\\begin{') || line.includes('\\end{')) return true;
      // Table
      if (line.startsWith('|') && line.endsWith('|')) return true;
      // Key markers
      if (/^(ví dụ|bài tập|định nghĩa|định lý|chú ý|nhận xét|hệ quả|dạng \d+|phương pháp)/i.test(line)) return true;
      return false;
    };

    const shouldJoinWithNext = (prevLine: string, nextLine: string): boolean => {
      if (!prevLine || !nextLine) return false;
      if (isSpecialBlockStart(prevLine) || isSpecialBlockStart(nextLine)) return false;
      
      // Nếu dòng trước kết thúc bằng dấu chấm, chấm than, hỏi chấm, hai chấm thì không nối
      const endsWithSentencePunctuation = /[\.\?\!\:\;]$/.test(prevLine);
      if (endsWithSentencePunctuation) return false;

      // Nếu dòng tiếp theo bắt đầu bằng chữ hoa hoặc số mục thì có thể là câu mới
      const startsWithLowercase = /^[a-zà-ỹ0-9\$\(\[\{\\\/]/i.test(nextLine);
      return startsWithLowercase;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (!line) {
        if (currentParagraph) {
          unbreaked.push(currentParagraph);
          currentParagraph = '';
        }
        unbreaked.push('');
        continue;
      }

      if (isSpecialBlockStart(line)) {
        if (currentParagraph) {
          unbreaked.push(currentParagraph);
          currentParagraph = '';
        }
        unbreaked.push(line);
      } else {
        if (currentParagraph) {
          if (shouldJoinWithNext(currentParagraph, line)) {
            // Nối có khoảng trắng ở giữa
            currentParagraph += ' ' + line;
          } else {
            unbreaked.push(currentParagraph);
            currentParagraph = line;
          }
        } else {
          currentParagraph = line;
        }
      }
    }

    if (currentParagraph) {
      unbreaked.push(currentParagraph);
    }

    lines = unbreaked;
  }

  // 6. Xóa các dòng trống liên tiếp (3+ dòng trống gom thành 1-2 dòng trống)
  if (options.trimEmptyLines) {
    const compactLines: string[] = [];
    let emptyCount = 0;

    for (const line of lines) {
      if (!line) {
        emptyCount++;
        if (emptyCount <= 1) {
          compactLines.push('');
        }
      } else {
        emptyCount = 0;
        compactLines.push(line);
      }
    }

    lines = compactLines;
  }

  let result = lines.join('\n').trim();

  // 7. Chuẩn hóa khoảng trắng kép giữa các từ
  if (options.removeDoubleSpaces) {
    result = result.replace(/[ \t]{2,}/g, ' ');
  }

  // 8. Chuẩn hóa dấu câu tiếng Việt
  if (options.normalizePunctuation) {
    // Xóa dấu cách trước dấu chấm, phẩy, hai chấm, chấm phẩy
    result = result.replace(/([a-zA-Z0-9\u00C0-\u1EF9])\s+([,.:;?!])/g, '$1$2');
    // Thêm khoảng trắng sau dấu câu nếu bị dính chữ (trừ số thập phân như 3.14 hoặc 1,5)
    result = result.replace(/([,.:;?!])([a-zA-Z\u00C0-\u1EF9])/g, '$1 $2');
  }

  const finalLength = result.length;
  const finalLineCount = result.split('\n').length;

  return {
    cleanedText: result,
    stats: {
      linesRemoved: Math.max(0, originalLineCount - finalLineCount),
      charsReduced: Math.max(0, originalLength - finalLength)
    }
  };
}

/**
 * Phân tích văn bản thành các khối nội dung (Blocks) có thể dịch chuyển, cắt dán
 */
export function parseContentIntoBlocks(content: string): DocumentBlock[] {
  if (!content || !content.trim()) {
    return [{
      id: 'block-1',
      title: 'Nội dung bài học',
      content: '',
      type: 'text'
    }];
  }

  const lines = content.split('\n');
  const blocks: DocumentBlock[] = [];
  let currentTitle = 'Mở đầu / Giới thiệu';
  let currentContent: string[] = [];
  let currentType: DocumentBlock['type'] = 'header';
  let blockCounter = 1;

  const pushCurrentBlock = () => {
    const text = currentContent.join('\n').trim();
    if (text || blocks.length === 0) {
      blocks.push({
        id: `block-${blockCounter++}`,
        title: currentTitle || `Vùng nội dung ${blocks.length + 1}`,
        content: text,
        type: currentType
      });
    }
    currentContent = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Nhận diện Tiêu đề Markdown H1, H2, H3, H4
    if (/^#{1,4}\s/.test(trimmed)) {
      if (currentContent.length > 0) {
        pushCurrentBlock();
      }
      currentTitle = trimmed.replace(/^#{1,4}\s+/, '');
      currentType = 'header';
      currentContent.push(line);
      continue;
    }

    // Nhận diện Đề mục lớn tiếng Việt: I. II. III. ...
    if (/^(I|II|III|IV|V|VI|VII|VIII|IX|X)\.\s+/i.test(trimmed)) {
      if (currentContent.length > 0) {
        pushCurrentBlock();
      }
      currentTitle = trimmed;
      currentType = 'theory';
      currentContent.push(line);
      continue;
    }

    // Nhận diện Dạng toán, Ví dụ, Bài tập, Câu hỏi
    if (/^(Dạng\s+\d+|Ví\s+dụ\s+\d+|Bài\s+tập\s+\d+|Luyện\s+tập\s+\d+|Câu\s+\d+)[:\.\-\s]/i.test(trimmed)) {
      if (currentContent.length > 0) {
        pushCurrentBlock();
      }
      currentTitle = trimmed.slice(0, 50);
      currentType = trimmed.toLowerCase().includes('ví dụ') ? 'example' : 'exercise';
      currentContent.push(line);
      continue;
    }

    // Nhận diện Phân trang từ PDF: "--- TRANG X ---", "--- PAGE X ---", "--- TRANG page_number ---"
    if (/^---+\s*(TRANG|PAGE)\s*(\d+|page_number)?.*$/i.test(trimmed)) {
      const match = trimmed.match(/(\d+)/);
      const pageNum = match ? parseInt(match[1], 10) : (blocks.length + 1);
      if (currentContent.length > 0) {
        pushCurrentBlock();
      }
      currentTitle = `Vùng ${pageNum}: Trang ${pageNum}`;
      currentType = 'text';
      continue;
    }

    // Nhận diện dòng bắt đầu bằng "Trang X" hoặc "Page X" đứng riêng
    if (/^(Trang|Page)\s*(\d+)[:\.\-\s]*$/i.test(trimmed)) {
      const match = trimmed.match(/(\d+)/);
      const pageNum = match ? parseInt(match[1], 10) : (blocks.length + 1);
      if (currentContent.length > 0) {
        pushCurrentBlock();
      }
      currentTitle = `Vùng ${pageNum}: Trang ${pageNum}`;
      currentType = 'text';
      continue;
    }

    // Nhận diện Phần X, Vùng X, Chương X
    if (/^(Phần\s+\d+|Vùng\s+\d+|Chương\s+\d+|Mục\s+\d+)[:\.\-\s]/i.test(trimmed)) {
      if (currentContent.length > 0) {
        pushCurrentBlock();
      }
      currentTitle = trimmed.slice(0, 50);
      currentType = 'theory';
      currentContent.push(line);
      continue;
    }

    // Nhận diện khối ảnh
    if (trimmed.startsWith('![') && trimmed.includes('](')) {
      if (currentContent.length > 0) {
        pushCurrentBlock();
      }
      currentTitle = 'Hình vẽ / Đồ thị';
      currentType = 'image';
      currentContent.push(line);
      pushCurrentBlock();
      currentTitle = `Vùng nội dung tiếp theo`;
      currentType = 'text';
      continue;
    }

    currentContent.push(line);
  }

  if (currentContent.length > 0 || blocks.length === 0) {
    pushCurrentBlock();
  }

  return blocks;
}

/**
 * Tự động chia lại văn bản thành N vùng nội dung đồng đều theo đoạn/trang
 */
export function splitTextIntoCustomBlocks(content: string, targetCount: number = 7): DocumentBlock[] {
  if (!content || !content.trim()) {
    return [{
      id: 'block-1',
      title: 'Vùng 1: Nội dung bài học',
      content: '',
      type: 'text'
    }];
  }

  // Thử dùng bộ parse chuẩn trước
  const standard = parseContentIntoBlocks(content);
  if (standard.length >= 2) {
    return standard;
  }

  // Nếu bộ parse chuẩn chỉ ra 1 khối duy nhất nhưng văn bản dài, chia thông minh theo đoạn văn
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  if (paragraphs.length <= 1) {
    return [{
      id: 'block-1',
      title: 'Vùng 1: Toàn bộ nội dung',
      content: content.trim(),
      type: 'text'
    }];
  }

  const count = Math.min(targetCount, paragraphs.length);
  const perChunk = Math.ceil(paragraphs.length / count);
  const blocks: DocumentBlock[] = [];

  for (let i = 0; i < count; i++) {
    const chunk = paragraphs.slice(i * perChunk, (i + 1) * perChunk).join('\n\n');
    if (chunk.trim()) {
      blocks.push({
        id: `block-${i + 1}`,
        title: `Vùng ${i + 1}: Phần ${i + 1}`,
        content: chunk.trim(),
        type: i === 0 ? 'header' : 'theory'
      });
    }
  }

  return blocks.length > 0 ? blocks : standard;
}

/**
 * Gộp các khối nội dung thành văn bản Markdown hoàn chỉnh
 */
export function serializeBlocksToContent(blocks: DocumentBlock[]): string {
  return blocks
    .map(b => b.content.trim())
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Tải tài liệu PDF từ DataURL hoặc Uint8Array
 */
export async function loadPdfDocument(fileDataUrl: string) {
  try {
    const parts = fileDataUrl.split(',');
    const base64 = parts[1] || parts[0];
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const loadingTask = pdfjsLib.getDocument({ data: bytes });
    const pdf = await loadingTask.promise;
    return pdf;
  } catch (err) {
    console.error('Lỗi khi nạp PDF với PDF.js:', err);
    throw err;
  }
}

/**
 * Kết xuất một trang PDF lên Canvas
 */
export async function renderPdfPageToCanvas(
  pdf: any,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale = 1.5
): Promise<{ width: number; height: number }> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Không thể lấy 2D context của Canvas');

  const renderContext = {
    canvasContext: ctx,
    viewport: viewport
  };

  await page.render(renderContext).promise;
  return { width: viewport.width, height: viewport.height };
}

/**
 * Cắt vùng hình chữ nhật từ Canvas và tự động tỉa khoảng trắng viền
 */
export function cropRegionFromCanvas(
  sourceCanvas: HTMLCanvasElement,
  cropRect: { x: number; y: number; width: number; height: number },
  autoCropWhiteMargins = true
): string {
  const { x, y, width, height } = cropRect;
  if (width <= 0 || height <= 0) return '';

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = width;
  cropCanvas.height = height;

  const ctx = cropCanvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.drawImage(
    sourceCanvas,
    x, y, width, height,
    0, 0, width, height
  );

  if (!autoCropWhiteMargins) {
    return cropCanvas.toDataURL('image/png');
  }

  // Tự động cắt bỏ viền trắng thừa xung quanh hình vẽ / đồ thị
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    let top = 0;
    let bottom = height - 1;
    let left = 0;
    let right = width - 1;

    const isWhite = (pixelIndex: number) => {
      const r = data[pixelIndex];
      const g = data[pixelIndex + 1];
      const b = data[pixelIndex + 2];
      const a = data[pixelIndex + 3];
      return a < 10 || (r > 245 && g > 245 && b > 245);
    };

    // Scan top
    let found = false;
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        if (!isWhite((r * width + c) * 4)) {
          top = Math.max(0, r - 4);
          found = true;
          break;
        }
      }
      if (found) break;
    }

    // Scan bottom
    found = false;
    for (let r = height - 1; r >= top; r--) {
      for (let c = 0; c < width; c++) {
        if (!isWhite((r * width + c) * 4)) {
          bottom = Math.min(height - 1, r + 4);
          found = true;
          break;
        }
      }
      if (found) break;
    }

    // Scan left
    found = false;
    for (let c = 0; c < width; c++) {
      for (let r = top; r <= bottom; r++) {
        if (!isWhite((r * width + c) * 4)) {
          left = Math.max(0, c - 4);
          found = true;
          break;
        }
      }
      if (found) break;
    }

    // Scan right
    found = false;
    for (let c = width - 1; c >= left; c--) {
      for (let r = top; r <= bottom; r++) {
        if (!isWhite((r * width + c) * 4)) {
          right = Math.min(width - 1, c + 4);
          found = true;
          break;
        }
      }
      if (found) break;
    }

    const trimmedWidth = right - left + 1;
    const trimmedHeight = bottom - top + 1;

    if (trimmedWidth > 10 && trimmedHeight > 10 && (trimmedWidth < width || trimmedHeight < height)) {
      const trimmedCanvas = document.createElement('canvas');
      trimmedCanvas.width = trimmedWidth;
      trimmedCanvas.height = trimmedHeight;
      const tCtx = trimmedCanvas.getContext('2d');
      if (tCtx) {
        tCtx.fillStyle = '#ffffff';
        tCtx.fillRect(0, 0, trimmedWidth, trimmedHeight);
        tCtx.drawImage(
          cropCanvas,
          left, top, trimmedWidth, trimmedHeight,
          0, 0, trimmedWidth, trimmedHeight
        );
        return trimmedCanvas.toDataURL('image/png');
      }
    }
  } catch (e) {
    console.warn('Auto crop margin warning:', e);
  }

  return cropCanvas.toDataURL('image/png');
}

/**
 * Trích xuất toàn bộ văn bản từ file PDF ngay trong trình duyệt bằng PDF.js
 */
export async function extractTextFromPdfInBrowser(fileDataUrl: string): Promise<string> {
  try {
    const pdf = await loadPdfDocument(fileDataUrl);
    const numPages = pdf.numPages;
    const pagesText: string[] = [];

    for (let i = 1; i <= numPages; i++) {
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

    return pagesText.join('\n\n');
  } catch (err) {
    console.warn('Lỗi trích xuất văn bản PDF trực tiếp trong trình duyệt:', err);
    return '';
  }
}
