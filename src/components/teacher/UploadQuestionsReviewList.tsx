import React from 'react';
import {
  Sparkles,
  Scale,
  Plus,
  ChevronDown,
  ChevronUp,
  Copy,
  Trash2
} from 'lucide-react';
import MathText from '../MathText';
import MathRadicalInput from '../common/MathRadicalInput';
import { QuestionItem, QuestionType } from '../../types/test';
import { checkMcqAnswer } from '../../utils/gradeEngine';

interface UploadQuestionsReviewListProps {
  questions: QuestionItem[];
  totalPoints: number;
  onAutoBalancePoints: () => void;
  onOpenEditModal: () => void;
  onAddQuestion: () => void;
  showReview: boolean;
  onToggleReview: () => void;
  onUpdateQuestion: (index: number, updatedFields: Partial<QuestionItem>) => void;
  onDuplicateQuestion: (index: number) => void;
  onDeleteQuestion: (index: number) => void;
}

export const UploadQuestionsReviewList: React.FC<UploadQuestionsReviewListProps> = ({
  questions,
  totalPoints,
  onAutoBalancePoints,
  onOpenEditModal,
  onAddQuestion,
  showReview,
  onToggleReview,
  onUpdateQuestion,
  onDuplicateQuestion,
  onDeleteQuestion
}) => {
  if (questions.length === 0) return null;

  return (
    <div className="space-y-4 pt-1">
      {/* Thanh điều khiển & Cân bằng biểu điểm */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-200/90 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs text-indigo-950">
            Danh sách câu hỏi trích xuất: <strong className="text-indigo-600">{questions.length} câu</strong>
          </span>
          <span className="text-[11px] bg-indigo-100 text-indigo-900 px-2.5 py-0.5 rounded-full font-bold">
            Tổng điểm: {totalPoints.toFixed(2)} / 10.0
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onAutoBalancePoints}
            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
            title="Tự động cân bằng và làm tròn biểu điểm các câu thành thang điểm 10.0"
          >
            <Scale size={13} className="text-emerald-600" />
            <span>Cân bằng 10.0đ</span>
          </button>
          <button
            type="button"
            onClick={onOpenEditModal}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Mở giao diện chỉnh sửa chuyên sâu toàn màn hình"
          >
            <Sparkles size={13} />
            <span>Mở bảng sửa chuyên sâu</span>
          </button>
          <button
            type="button"
            onClick={onAddQuestion}
            className="px-2.5 py-1.5 bg-white hover:bg-gray-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
            title="Thêm một câu hỏi mới vào cuối đề"
          >
            <Plus size={13} />
            <span>Thêm câu</span>
          </button>
          <button
            type="button"
            onClick={onToggleReview}
            className="px-2 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
            title="Thu gọn hoặc mở rộng danh sách câu hỏi"
          >
            {showReview ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Danh sách chi tiết các câu hỏi trực tiếp cho phép xem & sửa */}
      {showReview && (
        <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
          {questions.map((q, qIdx) => (
            <div key={q.id || qIdx} className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs hover:border-indigo-300 transition-all space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center border border-indigo-100 shrink-0">
                    {qIdx + 1}
                  </span>
                  
                  {/* Dropdown đổi loại câu hỏi nhanh */}
                  <select
                    value={q.type}
                    onChange={(e) => onUpdateQuestion(qIdx, { type: e.target.value as QuestionType })}
                    className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 outline-none text-gray-800 focus:border-indigo-500"
                  >
                    <option value="mcq">Phần I: TN nhiều lựa chọn (A, B, C, D)</option>
                    <option value="tf">Phần II: Đúng / Sai (a, b, c, d)</option>
                    <option value="short">Phần III: Trả lời ngắn (điền số)</option>
                    <option value="essay">Phần Tự luận</option>
                  </select>

                  {/* Điểm số */}
                  <div className="flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-200">
                    <span>Điểm:</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0.05"
                      max="10"
                      value={q.points !== undefined ? q.points : (q.type === 'mcq' ? 0.25 : q.type === 'tf' ? 1.0 : q.type === 'short' ? 0.5 : 1.0)}
                      onChange={(e) => onUpdateQuestion(qIdx, { points: parseFloat(e.target.value) || 0.25 })}
                      className="w-12 bg-transparent text-center font-bold text-gray-800 outline-none"
                    />
                  </div>
                </div>

                {/* Nút thao tác câu hỏi: Nhân đôi, Xóa */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onDuplicateQuestion(qIdx)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                    title="Nhân bản câu này"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteQuestion(qIdx)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Xóa câu hỏi này"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Đề bài câu hỏi: Textarea chỉnh sửa & Xem trước MathText */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 mb-0.5 block">Nội dung câu hỏi (hỗ trợ $...$ LaTeX):</label>
                  <textarea
                    value={q.question}
                    onChange={(e) => onUpdateQuestion(qIdx, { question: e.target.value })}
                    rows={2}
                    className="w-full text-xs p-2 rounded-lg border border-gray-200 focus:border-indigo-400 outline-none leading-relaxed resize-y font-mono"
                  />
                </div>
                <div className="p-2 bg-slate-50/80 rounded-lg border border-slate-200 text-xs leading-relaxed max-h-28 overflow-y-auto">
                  <label className="text-[10px] font-bold text-indigo-700 mb-0.5 block">Xem trước công thức đẹp:</label>
                  <MathText content={q.question || '...'} />
                </div>
              </div>

              {/* Lựa chọn A, B, C, D đối với MCQ */}
              {q.type === 'mcq' && q.options && q.options.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-[10px] font-bold text-gray-500 block">Các phương án & Chọn đáp án đúng:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, oIdx) => {
                      const letter = String.fromCharCode(65 + oIdx);
                      const isCorrect = checkMcqAnswer(letter, q.correctAnswer, q.options).isCorrect;
                      return (
                        <div 
                          key={oIdx} 
                          className={`flex flex-col gap-1 p-2 rounded-lg border text-xs transition-colors ${
                            isCorrect ? 'bg-emerald-50 border-emerald-300 font-semibold' : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onUpdateQuestion(qIdx, { correctAnswer: letter })}
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 cursor-pointer ${
                                isCorrect ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {letter}
                            </button>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...(q.options || [])];
                                newOpts[oIdx] = e.target.value;
                                onUpdateQuestion(qIdx, { options: newOpts });
                              }}
                              className="w-full bg-transparent outline-none text-xs text-gray-800"
                            />
                          </div>
                          {opt && (
                            <div className="pl-7 text-[11px] text-gray-600">
                              <MathText content={opt} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Đúng / Sai đối với TF */}
              {q.type === 'tf' && q.options && q.options.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-gray-500 block">Các ý a, b, c, d & Chọn Đúng/Sai:</label>
                    {q.correctAnswer && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded flex items-center gap-1">
                        Đáp án: <MathText content={String(q.correctAnswer)} />
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {q.options.map((stmt, sIdx) => {
                      const letter = ['a', 'b', 'c', 'd'][sIdx] || String.fromCharCode(97 + sIdx);
                      const ansStr = (q.correctAnswer || '').toString();
                      const isDung = ansStr.includes(`${letter}-Đ`) || ansStr.includes(`${letter}) Đúng`);
                      const isSai = ansStr.includes(`${letter}-S`) || ansStr.includes(`${letter}) Sai`);

                      const setSubAnswer = (val: 'Đ' | 'S') => {
                        let currentMap: Record<string, string> = { a: 'Đ', b: 'S', c: 'Đ', d: 'S' };
                        ['a', 'b', 'c', 'd'].forEach(k => {
                          if (ansStr.includes(`${k}-Đ`)) currentMap[k] = 'Đ';
                          else if (ansStr.includes(`${k}-S`)) currentMap[k] = 'S';
                        });
                        currentMap[letter] = val;
                        const newAns = `a-${currentMap.a}, b-${currentMap.b}, c-${currentMap.c}, d-${currentMap.d}`;
                        onUpdateQuestion(qIdx, { correctAnswer: newAns });
                      };

                      return (
                        <div key={sIdx} className="p-2 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center text-[10px] font-bold shrink-0">
                                {letter})
                              </span>
                              <input
                                type="text"
                                value={stmt}
                                onChange={(e) => {
                                  const newOpts = [...(q.options || [])];
                                  newOpts[sIdx] = e.target.value;
                                  onUpdateQuestion(qIdx, { options: newOpts });
                                }}
                                className="flex-1 bg-transparent outline-none text-xs text-gray-800 font-medium"
                              />
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setSubAnswer('Đ')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                  isDung ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                                }`}
                              >
                                Đúng
                              </button>
                              <button
                                type="button"
                                onClick={() => setSubAnswer('S')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                  isSai ? 'bg-rose-600 text-white shadow-2xs' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                                }`}
                              >
                                Sai
                              </button>
                            </div>
                          </div>
                          {stmt && (
                            <div className="pl-7 text-[11px] text-gray-600">
                              <MathText content={stmt} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Trả lời ngắn / Tự luận */}
              {(q.type === 'short' || q.type === 'essay') && (
                <div className="pt-1 space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 block">Đáp số / Kết quả chính xác:</label>
                  {q.type === 'short' ? (
                    <MathRadicalInput
                      value={q.correctAnswer || ''}
                      onChange={(val) => onUpdateQuestion(qIdx, { correctAnswer: val })}
                      placeholder="Ví dụ: √2, 2√3, √3/2, 12 hoặc -3/4..."
                    />
                  ) : (
                    <input
                      type="text"
                      value={q.correctAnswer || ''}
                      onChange={(e) => onUpdateQuestion(qIdx, { correctAnswer: e.target.value })}
                      placeholder="Tóm tắt kết quả chính..."
                      className="w-full px-2.5 py-1 text-xs border border-gray-200 rounded-lg outline-none focus:border-indigo-400 font-bold text-indigo-900 bg-white"
                    />
                  )}
                  {q.correctAnswer && (
                    <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50/80 px-2 py-1 rounded border border-emerald-100 flex items-center gap-1.5">
                      <span className="text-gray-500 font-normal">Xem trước đáp số:</span>
                      <MathText content={String(q.correctAnswer)} />
                    </div>
                  )}
                </div>
              )}

              {/* Lời giải chi tiết */}
              <div className="pt-1 border-t border-gray-100 flex flex-col gap-1">
                <label className="text-[10px] font-bold text-emerald-800">Lời giải chi tiết:</label>
                <textarea
                  value={q.explanation || ''}
                  onChange={(e) => onUpdateQuestion(qIdx, { explanation: e.target.value })}
                  rows={2}
                  placeholder="Nhập hướng dẫn giải hoặc lời giải chi tiết (hỗ trợ công thức $...$)..."
                  className="w-full text-xs p-2 rounded-lg border border-emerald-200 bg-emerald-50/30 focus:border-emerald-400 outline-none leading-relaxed resize-y font-mono"
                />
                {q.explanation && (
                  <div className="mt-1 p-2 bg-emerald-50/50 rounded-lg border border-emerald-100 text-[11px] text-gray-800">
                    <span className="font-bold text-emerald-900 block mb-0.5">Xem trước lời giải:</span>
                    <MathText content={q.explanation} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default UploadQuestionsReviewList;
