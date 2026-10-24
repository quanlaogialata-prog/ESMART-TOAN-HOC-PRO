import React from 'react';
import { TopicPractice } from '../../types/practice';
import MathText from '../MathText';
import { stripOptionPrefix } from '../../utils/gradeEngine';
import { 
  formatPracticeQuestionsAndSections, 
  NumberingMode, 
  normalizePhieuText, 
  stripQuestionPrefix,
  splitMcqOptions,
  isTheoryQuestion,
  isPureSectionHeader,
  isInstructionOrRangeOnly,
  calculateEssayAnswerLineCount
} from '../../utils/practiceFormatter';
import { detectQuestionType } from '../../utils/variantGenerator';

interface PracticeExamPaperContentProps {
  practice: TopicPractice;
  showAnswers?: boolean;
  numberingMode?: NumberingMode;
}

export default function PracticeExamPaperContent({ 
  practice, 
  showAnswers = false,
  numberingMode = 'per_section'
}: PracticeExamPaperContentProps) {
  const { sections, orderedQuestions } = formatPracticeQuestionsAndSections(
    practice.questions || [], 
    numberingMode
  );

  // Trích xuất tên bài / chuyên đề sạch sẽ cho dòng dưới tiêu đề chính, chuẩn hóa chính tả chữ PHIẾU
  const rawLesson = practice.lessonTitle?.trim() 
    || practice.title.replace(/^(?:Phiếu\s*ôn\s*luyện\s*chuyên\s*đề|Bài\s*ôn\s*luyện\s*chuyên\s*đề)\s*[:\+]?\s*/i, '').trim()
    || 'Bài học môn Toán';
  const lessonName = normalizePhieuText(rawLesson);

  return (
    <div 
      className="bg-white text-gray-900 leading-normal p-6 sm:p-10 w-full max-w-[210mm] mx-auto min-h-[297mm] shadow-sm border border-gray-200 print:border-none print:shadow-none print:p-0 print:m-0 print:w-full print:max-w-none text-[13pt] box-border"
      style={{ fontFamily: "'Times New Roman', Times, 'Liberation Serif', serif" }}
    >
      {/* ============================================================ */}
      {/* 1. HEADER TRƯỜNG & THÔNG TIN PHIẾU ÔN LUYỆN CHUYÊN ĐỀ        */}
      {/* ============================================================ */}
      <div className="export-avoid-break flex justify-between items-start border-b-2 border-gray-900 pb-3 mb-3">
        {/* Cột trái */}
        <div className="w-[52%] text-center">
          <div className="font-bold uppercase text-[12.5px] sm:text-[13.5px] text-gray-900">
            {practice.schoolName ? practice.schoolName.replace(/ESMART\s+KB/gi, 'ESMART').replace(/TRUNG TÂM LUYỆN THI ESMART/gi, 'TRUNG TÂM ESMART') : 'TRUNG TÂM ESMART'}
          </div>
          <div className="font-semibold text-xs mt-0.5 text-gray-800">
            TỔ CHUYÊN MÔN: {practice.subject?.toUpperCase() || 'TOÁN HỌC'}
          </div>
        </div>

        {/* Cột phải */}
        <div className="w-[46%] text-center">
          <div className="text-xs font-semibold text-gray-800">
            Môn: <strong>Toán</strong> - Khối <strong>{practice.grade}</strong>
          </div>
          <div className="text-xs text-gray-700 mt-0.5">
            Năm học: <strong>{practice.schoolYear || '2025 - 2026'}</strong>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. TIÊU ĐỀ BÀI HỌC (CHỈ GIỮ LẠI TÊN BÀI HỌC)                 */}
      {/* ============================================================ */}
      <div className="export-avoid-break text-center my-3.5">
        <h1 
          className="text-base sm:text-lg font-bold uppercase tracking-normal text-blue-900 font-serif leading-snug"
          style={{ letterSpacing: '0px', wordSpacing: 'normal' }}
        >
          {lessonName}
        </h1>
      </div>

      {/* ============================================================ */}
      {/* 3. KHUNG THÔNG TIN HỌC SINH (THIẾT KẾ THEO KIỂU PHIẾU HỌC TẬP)*/}
      {/* ============================================================ */}
      <div className="export-avoid-break border-2 border-dashed border-gray-400 rounded-xl p-3 mb-4 text-xs bg-gray-50/60 font-sans">
        <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4">
          <div className="flex-1 min-w-[220px]">
            <span className="font-bold text-gray-900">Họ và tên học sinh:</span> ............................................................................................
          </div>
          <div className="w-28">
            <span className="font-bold text-gray-900">Lớp:</span> ........................
          </div>
          <div className="min-w-[140px] text-right">
            <span className="font-bold text-gray-900">Ngày:</span> ..... / ..... / 202...
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-y-1.5 gap-x-3 mt-2.5 pt-2 border-t border-dotted border-gray-300 text-[11.5px] text-gray-700">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800">Tự đánh giá:</span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3.5 h-3.5 border border-gray-500 rounded-full inline-block"></span> Chưa hiểu
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3.5 h-3.5 border border-gray-500 rounded-full inline-block"></span> Cần luyện thêm
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3.5 h-3.5 border border-gray-500 rounded-full inline-block"></span> Đã thành thạo
            </span>
          </div>
          <div className="flex-1 text-right min-w-[220px]">
            <span className="font-semibold text-gray-800">Thầy/Cô nhận xét:</span> ...................................................................
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. TÓM TẮT KIẾN THỨC TRỌNG TÂM (NẾU CÓ)                     */}
      {/* ============================================================ */}
      {practice.theorySummary && practice.theorySummary.trim() && (
        <div className="export-avoid-break mb-5 p-3.5 bg-blue-50/50 border border-blue-200 rounded-lg text-xs leading-relaxed">
          <div className="font-bold uppercase text-blue-900 text-xs mb-1.5 flex items-center gap-1.5">
            <span>📌 TÓM TẮT KIẾN THỨC TRỌNG TÂM & PHƯƠNG PHÁP GIẢI</span>
          </div>
          <div className="text-gray-800 whitespace-pre-line font-sans text-xs sm:text-[12.5px]">
            <MathText content={practice.theorySummary} />
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. HỆ THỐNG CÂU HỎI VÀ BÀI TẬP ÔN LUYỆN (SẮP XẾP CHUẨN ĐỊNH DẠNG)*/}
      {/* ============================================================ */}
      <div className="space-y-6 text-[13px] leading-relaxed">
        {sections.map((section, sIdx) => {
          // Tính toán tiêu đề dạng bài hiển thị duy nhất 1 lần ở đầu phần
          const p = (section.partRoman || '').trim();
          const t = (section.title || '').trim();
          let sectionHeading = p;
          if (t && !p) sectionHeading = t;
          else if (p && t) {
            if (p.toLowerCase().includes(t.toLowerCase())) sectionHeading = p;
            else if (t.toLowerCase().includes(p.toLowerCase())) sectionHeading = t;
            else sectionHeading = `${p}: ${t}`;
          }

          return (
            <div key={sIdx} className="space-y-3">
              {/* Tiêu đề dạng bài hoặc Phần từ tài liệu gốc - chỉ hiển thị khi có tiêu đề */}
              {sectionHeading && (
                <div className="export-avoid-break pt-2.5 pb-1 border-b-2 border-gray-900">
                  <div className="font-bold text-[12px] sm:text-[13px] tracking-normal text-gray-900">
                    {sectionHeading}
                  </div>
                  {section.instruction && section.instruction.trim() !== sectionHeading && (
                    <div className="text-[11.5px] italic text-gray-700 mt-0.5">
                      ({section.instruction})
                    </div>
                  )}
                </div>
              )}

              {/* Danh sách câu hỏi trong phần: bố trí lần lượt và KHÔNG lặp lại tiêu đề dạng */}
              <div className="space-y-3.5">
                {section.questions.map(({ item: q, globalIndex, partIndex, displayNumber }) => {
                  const rawOpts = Array.isArray(q.options) ? q.options : [];
                  // Tự động phân tách phương án nếu bị dính liền vào 1 chuỗi
                  const opts = rawOpts.length === 1 && /(?:^|\s)[B-D][.:\)]/i.test(rawOpts[0])
                    ? splitMcqOptions(rawOpts[0])
                    : rawOpts;
                  const qNumber = numberingMode === 'per_section' ? partIndex : displayNumber;
                  // Chuẩn hóa nội dung câu hỏi: loại bỏ tiêu đề dạng bài và "Câu 1:" bị lặp lại ở đầu chuỗi
                  const cleanQuestionText = stripQuestionPrefix(q.question || '', sectionHeading);

                  // Nếu mục này là tiêu đề phần hoặc tiêu đề trắc nghiệm khách quan đứng riêng hoặc dòng chỉ dẫn -> không hiển thị thành câu hỏi
                  if (isPureSectionHeader(cleanQuestionText) || isInstructionOrRangeOnly(cleanQuestionText)) {
                    return null;
                  }

                  // Tự động kiểm tra và bóc tách phương án trắc nghiệm A, B, C, D nếu còn bị dính trong thân câu hỏi
                  let effectiveOpts = opts;
                  let effectiveStem = cleanQuestionText;
                  if (effectiveOpts.length < 2) {
                    const splitted = splitMcqOptions(cleanQuestionText);
                    if (splitted.length >= 2) {
                      effectiveOpts = splitted;
                      const firstA = cleanQuestionText.search(/(?:^|\n|\s+)(?:\[A\]|\(A\)|A[\.:\)])\s+/);
                      if (firstA >= 0) {
                        effectiveStem = cleanQuestionText.substring(0, firstA).trim();
                      }
                    }
                  }

                  return (
                    <div
                      key={q.id || globalIndex}
                      className="export-avoid-break break-inside-avoid pb-2.5 border-b border-dotted border-gray-300 last:border-0"
                      style={{ pageBreakInside: 'avoid' }}
                    >
                      {/* Xác định dạng câu hỏi thực tế */}
                      {(() => {
                        // 0. Nếu mục này là tiêu đề phân đoạn hoặc chỉ dẫn làm bài: TUYỆT ĐỐI KHÔNG HIỂN THỊ "Bài X" hay ô "Bài làm"
                        if (isPureSectionHeader(effectiveStem) || isInstructionOrRangeOnly(effectiveStem)) {
                          if (isInstructionOrRangeOnly(effectiveStem)) {
                            return null;
                          }
                          return (
                            <div className="py-2 my-1.5 border-b-2 border-gray-800 text-center font-bold text-gray-900 uppercase tracking-wide text-xs sm:text-sm font-sans bg-gray-50/80 rounded px-2">
                              <MathText content={effectiveStem} />
                            </div>
                          );
                        }

                        // 1. Kiểm tra xem có phải nội dung Tóm tắt lý thuyết không: BỎ HOÀN TOÀN KHUNG BÀI LÀM
                        const rawText = (q.question || '').toLowerCase();
                        const isTheory = isTheoryQuestion(q) || (
                          effectiveOpts.length === 0 && (
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

                        // Nếu là nội dung tóm tắt lý thuyết: Tuyệt đối KHÔNG hiển thị khung "Bài làm"
                        if (isTheory) {
                          return (
                            <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-lg text-xs text-gray-800 leading-relaxed mb-2 font-sans">
                              <div className="font-bold text-blue-900 mb-1 flex items-center gap-1.5 uppercase">
                                <span>📌 TÓM TẮT KIẾN THỨC TRỌNG TÂM</span>
                              </div>
                              <div className="whitespace-pre-line">
                                <MathText content={effectiveStem} />
                              </div>
                            </div>
                          );
                        }

                        // 2. Trắc nghiệm 4 lựa chọn (A, B, C, D) - KHÔNG CÓ BÀI LÀM
                        const hasCapitalMcqOpts = effectiveOpts.length >= 2 && (
                          effectiveOpts.some((o: string) => /^(?:\[?[A-D]\]?|[A-D][\.\:\)])\s+/i.test((o || '').trim())) ||
                          (effectiveOpts.length === 4 && !effectiveOpts.some((o: string) => /^[a-d][\.\:\)]/i.test((o || '').trim())))
                        );
                        const isMcq = !isTheory && (
                          hasCapitalMcqOpts || 
                          q.type === 'mcq' || 
                          detectQuestionType({ ...q, options: effectiveOpts, question: effectiveStem }) === 'mcq'
                        );

                        // 3. Trắc nghiệm Đúng / Sai - KHÔNG CÓ BÀI LÀM
                        const isTf = !isTheory && !isMcq && (
                          q.type === 'tf' || 
                          section.type === 'tf' || 
                          detectQuestionType(q) === 'tf' ||
                          effectiveOpts.some((o: string) => /^[a-d]\)/i.test(o || ''))
                        ) && effectiveOpts.length > 0;

                        // 4. Trả lời ngắn - KHÔNG CÓ BÀI LÀM (chỉ có ô điền đáp số ngắn)
                        const isShort = !isTheory && !isMcq && !isTf && (
                          q.type === 'short' || 
                          section.type === 'short' ||
                          detectQuestionType(q) === 'short'
                        );

                        // 5. Tự luận: CHỈ CÓ BÀI LÀM ĐỐI VỚI CÂU Ở PHẦN TỰ LUẬN (Tuyệt đối không áp dụng cho trắc nghiệm)
                        const isEssay = !isTheory && !isMcq && !isTf && !isShort && (
                          section.type === 'essay' || 
                          q.type === 'essay' || 
                          q.type === 'tu_luan' ||
                          detectQuestionType(q) === 'essay'
                        );

                      return (
                        <>
                          {/* Thân câu hỏi */}
                          <div className="font-semibold text-gray-900 mb-1 flex items-start gap-1.5">
                            <span className="font-bold shrink-0">
                              {isEssay
                                ? `Bài ${qNumber}${q.points ? ` (${q.points} điểm)` : ''}:`
                                : `Câu ${qNumber}:`}
                            </span>
                            <div className="flex-1 font-normal whitespace-pre-line leading-relaxed">
                              <MathText content={effectiveStem} />
                            </div>
                          </div>

                          {q.imageUrl && (
                            <div className="my-2 max-w-sm">
                              <img src={q.imageUrl} alt={`Hình câu ${qNumber}`} className="max-h-48 rounded border border-gray-200" />
                            </div>
                          )}

                          {/* Dạng 1: Trắc nghiệm 4 lựa chọn (A, B, C, D) - Giữ nguyên cấu trúc, KHÔNG có phần bài làm */}
                          {isMcq && (
                            <div className={`grid gap-y-2 mt-2 pl-3 text-xs sm:text-[13px] ${
                              effectiveOpts.every((o: string) => (o || '').length < 28)
                                ? 'grid-cols-2 sm:grid-cols-4 print:grid-cols-4 gap-x-6 sm:gap-x-10 print:gap-x-8'
                                : effectiveOpts.every((o: string) => (o || '').length < 60)
                                ? 'grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-x-8 sm:gap-x-12 print:gap-x-12'
                                : 'grid-cols-1 gap-y-2'
                            }`}>
                              {effectiveOpts.map((opt: string, oIdx: number) => {
                                const letter = String.fromCharCode(65 + oIdx);
                                const cleanText = stripOptionPrefix(opt || '');
                                return (
                                  <div key={oIdx} className="flex items-start gap-2 min-w-0 pr-3">
                                    <span className="font-bold text-gray-950 shrink-0 select-none">{letter}.</span>
                                    <div className="flex-1 font-normal break-words leading-relaxed">
                                      <MathText content={cleanText} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Dạng 2: Trắc nghiệm Đúng / Sai - Giữ nguyên cấu trúc, KHÔNG có phần bài làm */}
                          {isTf && (
                            <div className="mt-2 border border-gray-400 text-xs rounded-sm overflow-hidden bg-white">
                              <div className="bg-gray-100 flex font-bold border-b border-gray-400 py-1.5 px-3 text-[11.5px] text-gray-800">
                                <span className="flex-1">Khẳng định / Mệnh đề</span>
                                <span className="w-16 text-center border-l border-gray-400">Đúng</span>
                                <span className="w-16 text-center border-l border-gray-400">Sai</span>
                              </div>
                              {opts.map((opt: string, oIdx: number) => {
                                const letter = ['a', 'b', 'c', 'd', 'e'][oIdx] || String.fromCharCode(97 + oIdx);
                                const cleanText = stripOptionPrefix(opt || '');
                                return (
                                  <div key={oIdx} className="flex items-center border-b border-gray-200 last:border-0 py-1.5 px-3 hover:bg-gray-50/40">
                                    <span className="font-bold mr-2 text-gray-900 shrink-0">{letter})</span>
                                    <div className="flex-1 font-normal text-gray-800 pr-2">
                                      <MathText content={cleanText} />
                                    </div>
                                    <span className="w-16 flex items-center justify-center border-l border-gray-200 py-0.5">
                                      <span className="inline-block w-4 h-4 border-2 border-gray-500 rounded-sm"></span>
                                    </span>
                                    <span className="w-16 flex items-center justify-center border-l border-gray-200 py-0.5">
                                      <span className="inline-block w-4 h-4 border-2 border-gray-500 rounded-sm"></span>
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Dạng 3: Trả lời ngắn - Giữ nguyên cấu trúc, KHÔNG có phần bài làm */}
                          {isShort && (
                            <div className="mt-2.5 pl-3 flex items-center gap-3 text-xs sm:text-[12.5px] font-sans">
                              <span className="font-bold text-gray-800">Đáp số:</span>
                              <div className="w-48 h-7 border-2 border-dashed border-gray-400 rounded-md bg-gray-50/50 flex items-center px-2 text-gray-400 text-[11px] italic">
                                (Ghi kết quả vào đây)
                              </div>
                            </div>
                          )}

                          {/* Dạng 4: Tự luận - CHỈ CÓ BÀI LÀM ĐỐI VỚI CÂU Ở PHẦN TỰ LUẬN */}
                          {isEssay && (() => {
                            const lineCount = calculateEssayAnswerLineCount(q.question || '', rawOpts);
                            return (
                              <div className="mt-3 pl-3 font-sans text-xs text-gray-600">
                                <div className="font-semibold text-gray-700 italic mb-1.5">
                                  Bài làm: <span className="text-[11px] font-normal text-gray-400">({lineCount} dòng)</span>
                                </div>
                                <div className="space-y-3.5">
                                  {Array.from({ length: lineCount }).map((_, lIdx) => (
                                    <div key={lIdx} className="border-b border-dotted border-gray-400 h-5"></div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Hiển thị đáp án ngay dưới câu nếu đang ở chế độ xem có lời giải */}
                          {showAnswers && (q.correctAnswer || q.explanation) && (
                            <div className="mt-2.5 p-2.5 bg-emerald-50/70 border border-emerald-200 rounded text-xs font-sans">
                              {q.correctAnswer && (
                                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                                  <span>Đáp án đúng:</span>
                                  <span className="text-emerald-700 font-extrabold">
                                    {typeof q.correctAnswer === 'string' ? q.correctAnswer : JSON.stringify(q.correctAnswer)}
                                  </span>
                                </div>
                              )}
                              {q.explanation && (
                                <div className="mt-1 text-gray-700 leading-relaxed">
                                  <span className="font-semibold text-emerald-800">Hướng dẫn giải: </span>
                                  <MathText content={q.explanation} />
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      );
                    })()}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Chân trang phiếu bài tập */}
        <div 
          className="export-avoid-break text-center pt-4 border-t border-gray-400 text-xs font-bold text-gray-700 tracking-normal"
          style={{ letterSpacing: '0px', wordSpacing: 'normal' }}
        >
          ---------- HẾT ----------
        </div>
      </div>

      {/* ============================================================ */}
      {/* 6. BẢNG ĐÁP ÁN VÀ LỜI GIẢI CHI TIẾT (BẢN CHO GIÁO VIÊN)      */}
      {/* ============================================================ */}
      {showAnswers && (
        <div className="mt-10 pt-6 border-t-2 border-gray-900 export-avoid-break">
          <div className="text-center mb-5">
            <div className="font-bold uppercase text-xs tracking-wider text-gray-600">
              {practice.schoolName || 'TRUNG TÂM ESMART'} • TỔ CHUYÊN MÔN
            </div>
            <h3 className="font-bold text-base sm:text-lg uppercase text-blue-900 mt-1">
              BẢNG ĐÁP ÁN & HƯỚNG DẪN GIẢI CHI TIẾT
            </h3>
            <p className="text-xs text-gray-600 italic mt-0.5">
              {lessonName} • Khối {practice.grade} • Năm học {practice.schoolYear || '2025 - 2026'}
            </p>
          </div>

          {/* Bảng đáp án phân nhóm theo từng phần thi chuẩn GDPT 2018 */}
          <div className="space-y-4 mb-6">
            {sections.map((sec, secIdx) => (
              <div key={secIdx} className="border border-gray-300 rounded-md p-3 bg-gray-50/70">
                <div className="font-bold text-xs uppercase text-blue-900 mb-2">
                  {sec.partRoman}: {sec.title}
                </div>

                {sec.type === 'mcq' && (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-900 text-xs text-center font-sans bg-white">
                      <thead>
                        <tr className="bg-gray-100 font-bold">
                          {sec.questions.map((q) => {
                            const qNum = numberingMode === 'per_section' ? q.partIndex : q.displayNumber;
                            return (
                              <th key={q.displayNumber} className="border border-gray-900 p-1 w-10">
                                {qNum}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {sec.questions.map((q) => (
                            <td key={q.displayNumber} className="border border-gray-900 p-1 font-bold text-blue-800">
                              {typeof q.item.correctAnswer === 'string' ? q.item.correctAnswer.slice(0, 5) : '-'}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {sec.type === 'tf' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans">
                    {sec.questions.map((q) => {
                      const qNum = numberingMode === 'per_section' ? q.partIndex : q.displayNumber;
                      return (
                        <div key={q.displayNumber} className="p-2 border border-gray-200 rounded bg-white">
                          <span className="font-bold text-gray-900">
                            Câu {qNum}:
                          </span>{' '}
                          <span className="font-semibold text-emerald-800">
                            {typeof q.item.correctAnswer === 'string' ? q.item.correctAnswer : JSON.stringify(q.item.correctAnswer)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {(sec.type === 'short' || sec.type === 'essay') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans">
                    {sec.questions.map((q) => {
                      const qNum = numberingMode === 'per_section' ? q.partIndex : q.displayNumber;
                      return (
                        <div key={q.displayNumber} className="p-2 border border-gray-200 rounded bg-white">
                          <span className="font-bold text-gray-900">
                            {sec.type === 'essay' ? 'Bài' : 'Câu'} {qNum}:
                          </span>{' '}
                          <span className="font-semibold text-blue-800">
                            {q.item.correctAnswer ? (typeof q.item.correctAnswer === 'string' ? q.item.correctAnswer : JSON.stringify(q.item.correctAnswer)) : 'Xem lời giải chi tiết'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Hướng dẫn giải chi tiết từng câu */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase text-gray-800 mb-2">
              HƯỚNG DẪN GIẢI CHI TIẾT TỪNG BÀI
            </h4>
            {orderedQuestions.map(({ item: q, partIndex, displayNumber }) => {
              const qNum = numberingMode === 'per_section' ? partIndex : displayNumber;
              return (
                <div key={q.id || displayNumber} className="p-3 bg-gray-50 rounded border border-gray-200 text-xs leading-relaxed">
                  <div className="font-bold text-gray-900 flex items-start justify-between gap-2">
                    <span>Câu {qNum}: {q.question?.slice(0, 140)}...</span>
                    {q.correctAnswer && (
                      <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 shrink-0">
                        Đáp án: <strong>{typeof q.correctAnswer === 'string' ? q.correctAnswer : JSON.stringify(q.correctAnswer)}</strong>
                      </span>
                    )}
                  </div>
                  {q.explanation && (
                    <div className="mt-1.5 text-gray-700 pt-1.5 border-t border-gray-200">
                      <span className="font-semibold text-gray-900">Lời giải chi tiết: </span>
                      <MathText content={q.explanation} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
