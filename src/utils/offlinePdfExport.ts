import html2canvasPro from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

interface GeneratePdfOptions {
  fileName: string;
  onProgress?: (text: string) => void;
}

/**
 * Converts an array of HTML elements (or single element) into a paginated A4 PDF.
 * Uses html2canvas-pro to support Tailwind v4 OKLCH colors, KaTeX formulas, and images.
 */
export async function generatePdfFromElements(
  elements: HTMLElement[],
  options: GeneratePdfOptions
): Promise<{ blob: Blob; url: string; fileName: string }> {
  const { fileName, onProgress } = options;

  onProgress?.('Khởi tạo công cụ xuất PDF chuẩn in ấn...');

  const pdf = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
    compress: true
  });

  const pageWidthMm = 210;
  const pageHeightMm = 297;
  const marginMm = 10;
  const printableWidthMm = pageWidthMm - marginMm * 2; // 190 mm
  const printableHeightMm = pageHeightMm - marginMm * 2; // 277 mm

  let isFirstPage = true;

  for (let eIdx = 0; eIdx < elements.length; eIdx++) {
    const el = elements[eIdx];
    if (elements.length > 1) {
      onProgress?.(`Đang xử lý phần ${eIdx + 1}/${elements.length}...`);
    } else {
      onProgress?.('Đang kết xuất nội dung bản in chất lượng cao...');
    }

    // Capture using html2canvas-pro with high DPI (scale: 2)
    const canvas = await html2canvasPro(el, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const mmPerCanvasPx = printableWidthMm / canvas.width;
    const maxPageCanvasPx = Math.floor(printableHeightMm / mmPerCanvasPx);

    // If element fits on 1 page
    if (canvas.height <= maxPageCanvasPx) {
      if (!isFirstPage) {
        pdf.addPage();
      }
      isFirstPage = false;
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const renderHeightMm = canvas.height * mmPerCanvasPx;
      pdf.addImage(imgData, 'JPEG', marginMm, marginMm, printableWidthMm, renderHeightMm);
      continue;
    }

    // Find breakable elements (e.g., questions) to avoid slicing them in half
    const avoidElements = el.querySelectorAll('.export-avoid-break');
    const containerRect = el.getBoundingClientRect();
    const avoidItems: { top: number; bottom: number }[] = [];

    avoidElements.forEach(itemEl => {
      const r = itemEl.getBoundingClientRect();
      const relTop = ((r.top - containerRect.top) / containerRect.height) * canvas.height;
      const relBottom = ((r.bottom - containerRect.top) / containerRect.height) * canvas.height;
      avoidItems.push({ top: relTop, bottom: relBottom });
    });

    let currentY = 0;
    let pageInElement = 0;

    while (currentY < canvas.height - 2) {
      if (!isFirstPage || pageInElement > 0) {
        pdf.addPage();
      }
      isFirstPage = false;

      let sliceBottom = currentY + maxPageCanvasPx;

      if (sliceBottom >= canvas.height) {
        sliceBottom = canvas.height;
      } else {
        // Find if sliceBottom cuts through an item to avoid
        for (const item of avoidItems) {
          if (item.top < sliceBottom && item.bottom > sliceBottom) {
            // Cut right before this item starts (push item to next page)
            // Ensure at least 150px progress so we don't loop indefinitely
            if (item.top > currentY + 150) {
              sliceBottom = item.top;
              break;
            }
          }
        }
      }

      const sliceHeight = sliceBottom - currentY;
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceHeight;

      const ctx = sliceCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, sliceHeight);
        ctx.drawImage(
          canvas,
          0,
          currentY,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight
        );

        const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.98);
        const renderHeightMm = sliceHeight * mmPerCanvasPx;
        pdf.addImage(sliceData, 'JPEG', marginMm, marginMm, printableWidthMm, renderHeightMm);
      }

      currentY = sliceBottom;
      pageInElement++;
    }
  }

  onProgress?.('Đang tạo tệp PDF tải xuống...');

  // Output blob
  const pdfBlob = pdf.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);

  // Trigger download automatically
  try {
    const downloadLink = document.createElement('a');
    downloadLink.href = pdfUrl;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    setTimeout(() => {
      document.body.removeChild(downloadLink);
    }, 2000);
  } catch (err) {
    console.warn('Auto download link trigger error:', err);
  }

  return { blob: pdfBlob, url: pdfUrl, fileName };
}
