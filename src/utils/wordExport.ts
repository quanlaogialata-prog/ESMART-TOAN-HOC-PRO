import { TopicPractice } from '../types/practice';
import { 
  formatPracticeQuestionsAndSections, 
  normalizePhieuText, 
  stripQuestionPrefix,
  splitMcqOptions,
  isTheoryQuestion,
  isPureSectionHeader
} from './practiceFormatter';
import { stripOptionPrefix } from './gradeEngine';
import { detectQuestionType } from './variantGenerator';

/**
 * Xuất phiếu ôn luyện chuyên đề sang định dạng Microsoft Word (.doc)
 * chuẩn quy chế trình bày theo Chương trình GDPT 2018 (Phần I, Phần II, Phần III, Phần IV)
 */
export function exportPracticeToWord(
  practice: TopicPractice, 
  options: { includeAnswers?: boolean } = {}
) {
  const { includeAnswers = false } = options;
  const { sections, orderedQuestions } = formatPracticeQuestionsAndSections(
    practice.questions || [], 
    'per_section'
  );

  const cleanMathHtml = (str: string = ''): string => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br/>');
  };

  const sanitizeFileName = (name: string): string => {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-zA-Z0-9_\-]/g, '_')
      .replace(/_+/g, '_');
  };

  const rawLesson = practice.lessonTitle?.trim() 
    || practice.title.replace(/^(?:Phiếu\s*ôn\s*luyện\s*chuyên\s*đề|Bài\s*ôn\s*luyện\s*chuyên\s*đề)\s*[:\+]?\s*/i, '').trim()
    || 'Chuyên đề môn Toán';
  const cleanLessonName = cleanMathHtml(normalizePhieuText(rawLesson));

  let htmlContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${cleanMathHtml(practice.title)}</title>
  <style>
    @page Section1 {
      size: 21.0cm 29.7cm; /* A4 */
      margin: 2.0cm 2.0cm 2.0cm 2.0cm;
      mso-header-margin: 36.0pt;
      mso-footer-margin: 36.0pt;
      mso-paper-source: 0;
    }
    div.Section1 { page: Section1; }
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.35;
      color: #000;
    }
    table { border-collapse: collapse; }
    .header-table { width: 100%; margin-bottom: 8px; border-bottom: 2pt solid #000; padding-bottom: 6px; }
    .header-table td { vertical-align: top; }
    .student-box {
      border: 1.5pt dashed #64748b;
      padding: 8px 12px;
      margin: 10px 0 14px 0;
      background-color: #f8fafc;
      font-size: 11pt;
    }
    .theory-box {
      border: 1pt solid #93c5fd;
      background-color: #eff6ff;
      padding: 8px 12px;
      margin-bottom: 12px;
      font-size: 11pt;
    }
    .theory-title {
      font-weight: bold;
      color: #1e3a8a;
      text-transform: uppercase;
      font-size: 11pt;
      margin-bottom: 4px;
    }
    .section-title {
      font-weight: bold;
      text-transform: uppercase;
      font-size: 11.5pt;
      margin-top: 14px;
      border-bottom: 1.5pt solid #000;
      padding-bottom: 2px;
    }
    .section-instruction {
      font-size: 10.5pt;
      font-style: italic;
      color: #374151;
      margin-top: 2px;
      margin-bottom: 6px;
    }
    .question-item {
      margin-bottom: 10px;
      page-break-inside: avoid;
    }
    .question-title {
      font-size: 11pt;
      font-weight: bold;
      margin-bottom: 3px;
    }
    .options-table {
      width: 100%;
      margin-top: 4px;
      font-size: 11pt;
    }
    .options-table td {
      padding: 3px 14px 3px 0;
      vertical-align: top;
    }
    .answer-key-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 10.5pt;
    }
    .answer-key-table th, .answer-key-table td {
      border: 1pt solid #000;
      padding: 4px 6px;
      text-align: center;
    }
    .page-break { page-break-before: always; }
  </style>
</head>
<body>
<div class='Section1'>

  <!-- HEADER TRƯỜNG & THÔNG TIN BÀI ÔN LUYỆN -->
  <table class='header-table'>
    <tr>
      <td style='width: 52%; text-align: center;'>
        <div style='font-size: 12pt; font-weight: bold; text-transform: uppercase;'>
          ${cleanMathHtml(practice.schoolName ? practice.schoolName.replace(/ESMART\s+KB/gi, 'ESMART').replace(/TRUNG TÂM LUYỆN THI ESMART/gi, 'TRUNG TÂM ESMART') : 'TRUNG TÂM ESMART')}
        </div>
        <div style='font-size: 11pt; font-weight: bold; margin-top: 2px;'>
          TỔ CHUYÊN MÔN: ${cleanMathHtml(practice.subject?.toUpperCase() || 'TOÁN HỌC')}
        </div>
      </td>
      <td style='width: 48%; text-align: center;'>
        <div style='font-size: 10.5pt; margin-top: 2px;'>
          Môn: <strong>Toán</strong> - Khối <strong>${practice.grade}</strong>
        </div>
        <div style='font-size: 10pt; margin-top: 2px;'>
          Năm học: <strong>${cleanMathHtml(practice.schoolYear || '2025 - 2026')}</strong>
        </div>
      </td>
    </tr>
  </table>

  <!-- TIÊU ĐỀ CHÍNH: CHỈ GIỮ LẠI TÊN BÀI HỌC -->
  <div style='text-align: center; margin: 12px 0 10px 0;'>
    <div style='font-size: 14pt; font-weight: bold; text-transform: uppercase; color: #1e3a8a; letter-spacing: 0;'>
      ${cleanLessonName}
    </div>
  </div>

  <!-- KHUNG THÔNG TIN HỌC SINH (THIẾT KẾ THEO KIỂU PHIẾU HỌC TẬP) -->
  <div class='student-box'>
    <table style='width: 100%; border: none;'>
      <tr>
        <td style='width: 60%; padding: 3px 0;'>
          <strong>Họ và tên học sinh:</strong> .......................................................................................
        </td>
        <td style='width: 20%; padding: 3px 0;'>
          <strong>Lớp:</strong> .........................
        </td>
        <td style='width: 20%; padding: 3px 0; text-align: right;'>
          <strong>Ngày:</strong> ...../...../202...
        </td>
      </tr>
      <tr>
        <td style='padding-top: 8px; font-size: 10pt; color: #475569;' colspan='2'>
          <strong>Tự đánh giá:</strong> &nbsp; [ &nbsp; ] Chưa hiểu &nbsp;&nbsp;&nbsp; [ &nbsp; ] Cần luyện thêm &nbsp;&nbsp;&nbsp; [ &nbsp; ] Đã thành thạo
        </td>
        <td style='padding-top: 8px; font-size: 10pt; color: #475569; text-align: right;'>
          <strong>Thầy/Cô nhận xét:</strong> .................................
        </td>
      </tr>
    </table>
  </div>
`;

  // PHẦN TÓM TẮT LÝ THUYẾT NẾU CÓ
  if (practice.theorySummary && practice.theorySummary.trim()) {
    htmlContent += `
  <div class='theory-box'>
    <div class='theory-title'>📌 TÓM TẮT KIẾN THỨC TRỌNG TÂM & PHƯƠNG PHÁP GIẢI</div>
    <div style='line-height: 1.5;'>
      ${cleanMathHtml(practice.theorySummary)}
    </div>
  </div>
`;
  }

  // PHẦN CÂU HỎI VÀ BÀI TẬP ÔN LUYỆN (SẮP XẾP CHUẨN ĐỊNH DẠNG BỘ GD&ĐT)
  htmlContent += `
  <div style='margin-top: 10px;'>
`;

  sections.forEach((section) => {
    const p = (section.partRoman || '').trim();
    const t = (section.title || '').trim();
    let sectionHeading = p;
    if (t && !p) sectionHeading = t;
    else if (p && t) {
      if (p.toLowerCase().includes(t.toLowerCase())) sectionHeading = p;
      else if (t.toLowerCase().includes(p.toLowerCase())) sectionHeading = t;
      else sectionHeading = `${p}: ${t}`;
    }

    htmlContent += `
    <div class='section-title'>
      ${cleanMathHtml(sectionHeading)}
    </div>
`;
    if (section.instruction && section.instruction.trim() !== sectionHeading) {
      htmlContent += `
    <div class='section-instruction'>
      (${cleanMathHtml(section.instruction)})
    </div>
`;
    }

    section.questions.forEach(({ item: q, partIndex }) => {
      const rawOpts = Array.isArray(q.options) ? q.options : [];
      const opts = rawOpts.length === 1 && /(?:^|\s)[B-D][.:\)]/i.test(rawOpts[0])
        ? splitMcqOptions(rawOpts[0])
        : rawOpts;
      const pointsLabel = q.points ? ` (${q.points} điểm)` : '';
      const qNum = partIndex;
      const stripped = stripQuestionPrefix(q.question || '', sectionHeading);
      if (isPureSectionHeader(stripped)) {
        return;
      }
      const cleanBody = cleanMathHtml(stripped);

      htmlContent += `
    <div class='question-item'>
`;

      const rawText = (q.question || '').toLowerCase();
      const isTheory = isTheoryQuestion(q) || (
        opts.length === 0 && (
          rawText.includes('tóm tắt kiến thức') ||
          rawText.includes('tóm tắt lý thuyết') ||
          rawText.includes('tóm tắt lí thuyết') ||
          rawText.includes('lý thuyết trọng tâm') ||
          rawText.includes('lí thuyết trọng tâm') ||
          rawText.includes('kiến thức cần nhớ') ||
          rawText.includes('kiến thức trọng tâm') ||
          rawText.includes('kiến thức cơ bản') ||
          (rawText.startsWith('lý thuyết') && !rawText.includes('bài tập')) ||
          (rawText.startsWith('lí thuyết') && !rawText.includes('bài tập'))
        )
      );

      if (isTheory) {
        htmlContent += `
        <div style='background-color: #f0fdf4; border: 1pt solid #bbf7d0; padding: 8px 12px; margin: 8px 0; font-size: 10.5pt;'>
          <strong>📌 TÓM TẮT KIẾN THỨC TRỌNG TÂM:</strong>
          <div style='margin-top: 4px;'>${cleanBody}</div>
        </div>
`;
        return;
      }

      const isMcq = !isTheory && (
        opts.length >= 2 || 
        q.type === 'mcq' || 
        detectQuestionType(q) === 'mcq'
      );
      const isTf = !isTheory && !isMcq && (
        q.type === 'tf' || 
        section.type === 'tf' || 
        detectQuestionType(q) === 'tf' ||
        opts.some((o: string) => /^[a-d]\)/i.test(o || ''))
      ) && opts.length > 0;
      const isShort = !isTheory && !isMcq && !isTf && (
        q.type === 'short' || 
        section.type === 'short' ||
        detectQuestionType(q) === 'short'
      );
      // CHỈ CÓ BÀI LÀM ĐỐI VỚI CÂU Ở PHẦN TỰ LUẬN
      const isEssay = !isTheory && !isMcq && !isTf && !isShort && (
        section.type === 'essay' || 
        q.type === 'essay' || 
        q.type === 'tu_luan' ||
        detectQuestionType(q) === 'essay'
      );

      htmlContent += `
      <div class='question-title'>
        ${isEssay ? `Bài ${qNum}${pointsLabel}:` : `Câu ${qNum}:`}
        <span style='font-weight: normal;'> ${cleanBody}</span>
      </div>
`;

      if (isMcq && opts.length > 0) {
        htmlContent += `<table class='options-table'>`;
        if (opts.length === 4) {
          const isShort = opts.every((o: string) => (o || '').length < 24);
          if (isShort) {
            htmlContent += `
            <tr>
              <td style='width: 25%;'><strong>A.</strong> ${cleanMathHtml(stripOptionPrefix(opts[0]))}</td>
              <td style='width: 25%;'><strong>B.</strong> ${cleanMathHtml(stripOptionPrefix(opts[1]))}</td>
              <td style='width: 25%;'><strong>C.</strong> ${cleanMathHtml(stripOptionPrefix(opts[2]))}</td>
              <td style='width: 25%;'><strong>D.</strong> ${cleanMathHtml(stripOptionPrefix(opts[3]))}</td>
            </tr>
`;
          } else {
            htmlContent += `
            <tr>
              <td style='width: 50%;'><strong>A.</strong> ${cleanMathHtml(stripOptionPrefix(opts[0]))}</td>
              <td style='width: 50%;'><strong>B.</strong> ${cleanMathHtml(stripOptionPrefix(opts[1]))}</td>
            </tr>
            <tr>
              <td style='width: 50%;'><strong>C.</strong> ${cleanMathHtml(stripOptionPrefix(opts[2]))}</td>
              <td style='width: 50%;'><strong>D.</strong> ${cleanMathHtml(stripOptionPrefix(opts[3]))}</td>
            </tr>
`;
          }
        } else {
          opts.forEach((opt: string, oIdx: number) => {
            const letter = String.fromCharCode(65 + oIdx);
            htmlContent += `<tr><td><strong>${letter}.</strong> ${cleanMathHtml(stripOptionPrefix(opt))}</td></tr>`;
          });
        }
        htmlContent += `</table>`;
      } else if (isTf && opts.length > 0) {
        htmlContent += `
        <table style='width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 10.5pt;'>
          <tr style='background-color: #f1f5f9; font-weight: bold;'>
            <td style='border: 1pt solid #cbd5e1; padding: 4px 8px; width: 75%;'>Khẳng định / Mệnh đề</td>
            <td style='border: 1pt solid #cbd5e1; padding: 4px; width: 12.5%; text-align: center;'>Đúng</td>
            <td style='border: 1pt solid #cbd5e1; padding: 4px; width: 12.5%; text-align: center;'>Sai</td>
          </tr>
`;
        opts.forEach((opt: string, oIdx: number) => {
          const letter = ['a', 'b', 'c', 'd', 'e'][oIdx] || String.fromCharCode(97 + oIdx);
          htmlContent += `
          <tr>
            <td style='border: 1pt solid #cbd5e1; padding: 4px 8px;'><strong>${letter})</strong> ${cleanMathHtml(stripOptionPrefix(opt))}</td>
            <td style='border: 1pt solid #cbd5e1; text-align: center;'>[ &nbsp; ]</td>
            <td style='border: 1pt solid #cbd5e1; text-align: center;'>[ &nbsp; ]</td>
          </tr>
`;
        });
        htmlContent += `</table>`;
      } else if (isShort) {
        htmlContent += `
        <div style='margin-top: 6px; font-size: 11pt;'>
          <strong>Đáp số:</strong> [ ................................................................ ]
        </div>
`;
      } else if (isEssay) {
        htmlContent += `
        <div style='margin: 8px 0 12px 10px; font-style: italic; color: #555;'>
          Bài làm:
          <div style='height: 25px; border-bottom: 1pt dotted #999; margin-top: 8px;'></div>
          <div style='height: 25px; border-bottom: 1pt dotted #999;'></div>
          <div style='height: 25px; border-bottom: 1pt dotted #999;'></div>
          <div style='height: 25px; border-bottom: 1pt dotted #999;'></div>
          <div style='height: 25px; border-bottom: 1pt dotted #999;'></div>
        </div>
`;
      }

      htmlContent += `</div>`;
    });
  });

  htmlContent += `
    <div style='text-align: center; margin-top: 25px; font-weight: bold; font-size: 11pt;'>
      ---------- HẾT ----------
    </div>
  </div>
`;

  // PHẦN ĐÁP ÁN & HƯỚNG DẪN GIẢI CHI TIẾT (NẾU ĐƯỢC CHỌN)
  if (includeAnswers) {
    htmlContent += `
  <div class='page-break'></div>

  <table class='header-table' style='width: 100%; border-bottom: 2pt solid #000; padding-bottom: 6px; margin-top: 10px;'>
    <tr>
      <td style='width: 50%; text-align: center;'>
        <div style='font-size: 12.5pt; font-weight: bold; text-transform: uppercase;'>
          ${cleanMathHtml(practice.schoolName || 'TRUNG TÂM ESMART')}
        </div>
        <div style='font-size: 11.5pt; font-weight: bold;'>
          TỔ CHUYÊN MÔN: ${cleanMathHtml(practice.subject?.toUpperCase() || 'TOÁN HỌC')}
        </div>
      </td>
      <td style='width: 50%; text-align: center;'>
        <div style='font-size: 13pt; font-weight: bold; text-transform: uppercase; color: #1e3a8a;'>
          ĐÁP ÁN & LỜI GIẢI CHI TIẾT
        </div>
        <div style='font-size: 11pt; font-weight: bold;'>
          ${cleanMathHtml(normalizePhieuText(practice.title))}
        </div>
        <div style='font-size: 10.5pt; font-style: italic;'>
          Khối ${practice.grade} • Năm học: ${cleanMathHtml(practice.schoolYear || '2025 - 2026')}
        </div>
      </td>
    </tr>
  </table>

  <!-- BẢNG ĐÁP ÁN THEO TỪNG PHẦN CHUẨN GDPT 2018 -->
  <div style='margin-top: 14px;'>
    <div style='font-size: 12pt; font-weight: bold; text-transform: uppercase; margin-bottom: 6px; color: #1e3a8a;'>
      I. BẢNG ĐÁP ÁN CÁC PHẦN
    </div>
`;

    sections.forEach(sec => {
      htmlContent += `
    <div style='margin-bottom: 10px;'>
      <div style='font-weight: bold; font-size: 11pt; margin-bottom: 4px;'>${cleanMathHtml(sec.partRoman)}: ${cleanMathHtml(sec.title)}</div>
`;
      if (sec.type === 'mcq') {
        htmlContent += `<table class='answer-key-table'><tr>`;
        sec.questions.forEach(q => {
          htmlContent += `<th style='background-color: #f1f5f9;'>Câu ${q.partIndex}</th>`;
        });
        htmlContent += `</tr><tr>`;
        sec.questions.forEach(q => {
          htmlContent += `<td style='font-weight: bold; color: #1e40af;'>${cleanMathHtml(typeof q.item.correctAnswer === 'string' ? q.item.correctAnswer.slice(0, 5) : '-')}</td>`;
        });
        htmlContent += `</tr></table>`;
      } else {
        htmlContent += `<div style='font-size: 10.5pt;'>`;
        sec.questions.forEach(q => {
          htmlContent += `<div style='margin-bottom: 2px;'><strong>Câu ${q.partIndex}:</strong> <span style='color: #1e40af; font-weight: bold;'>${cleanMathHtml(typeof q.item.correctAnswer === 'string' ? q.item.correctAnswer : JSON.stringify(q.item.correctAnswer))}</span></div>`;
        });
        htmlContent += `</div>`;
      }
      htmlContent += `</div>`;
    });

    htmlContent += `
  </div>

  <!-- HƯỚNG DẪN GIẢI CHI TIẾT TỪNG CÂU -->
  <div style='margin-top: 20px;'>
    <div style='font-size: 12pt; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; color: #1e3a8a;'>
      II. HƯỚNG DẪN GIẢI CHI TIẾT TỪNG BÀI
    </div>
`;

    orderedQuestions.forEach(({ item: q, partIndex }) => {
      const cleanBody = cleanMathHtml(stripQuestionPrefix(q.question || ''));
      htmlContent += `
    <div style='margin-bottom: 12px; padding: 6px 10px; background-color: #fafafa; border-left: 3pt solid #2563eb;'>
      <div style='font-weight: bold;'>
        Câu ${partIndex}: <span style='font-weight: normal;'>${cleanBody}</span>
      </div>
      <div style='margin-top: 3px;'>
        <strong>Đáp án:</strong> <span style='color: #1e40af; font-weight: bold;'>${cleanMathHtml(typeof q.correctAnswer === 'string' ? q.correctAnswer : JSON.stringify(q.correctAnswer))}</span>
      </div>
      ${q.explanation ? `
      <div style='margin-top: 4px; font-style: italic; color: #374151;'>
        <strong>Lời giải chi tiết:</strong> ${cleanMathHtml(q.explanation)}
      </div>
      ` : ''}
    </div>
`;
    });

    htmlContent += `
  </div>
`;
  }

  htmlContent += `
</div>
</body>
</html>
`;

  // Create Word Blob
  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8'
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFileName(normalizePhieuText(practice.title || 'Phieu_on_luyen_chuyen_de'))}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
