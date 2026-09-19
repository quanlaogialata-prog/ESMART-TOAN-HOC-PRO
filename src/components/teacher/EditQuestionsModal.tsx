import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Copy,
  Image as ImageIcon,
  Table as TableIcon,
  Sparkles,
  BookOpen,
  HelpCircle,
  Code,
  Eye,
  CheckCircle,
  X,
  Upload,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import MathText from '../MathText';
import QuestionVisualRenderer from '../common/QuestionVisualRenderer';
import { QuestionItem, QuestionType, QuestionReference } from '../../types/test';
import { MATH_FIGURE_TEMPLATES, MathFigureTemplate } from '../../utils/mathFigureTemplates';
import { stripOptionPrefix } from '../../utils/gradeEngine';

interface EditQuestionsModalProps {
  testTitle: string;
  initialQuestions: QuestionItem[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (questions: QuestionItem[]) => Promise<void>;
  isSaving?: boolean;
}

export default function EditQuestionsModal({
  testTitle,
  initialQuestions,
  isOpen,
  onClose,
  onSave,
  isSaving = false,
}: EditQuestionsModalProps) {
  const [questions, setQuestions] = useState<QuestionItem[]>(() => {
    return initialQuestions && initialQuestions.length > 0 
      ? JSON.parse(JSON.stringify(initialQuestions))
      : [];
  });
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [showFigureTemplateModal, setShowFigureTemplateModal] = useState<boolean>(false);
  const [showRawSvgEditor, setShowRawSvgEditor] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'content' | 'visual' | 'reference'>('content');

  if (!isOpen) return null;

  const currentQ: QuestionItem | undefined = questions[activeIndex];

  const updateCurrentQuestion = (fields: Partial<QuestionItem>) => {
    if (!currentQ) return;
    const updated = [...questions];
    updated[activeIndex] = {
      ...currentQ,
      ...fields,
    };
    setQuestions(updated);
  };

  const updateReference = (refFields: Partial<QuestionReference>) => {
    if (!currentQ) return;
    const currentRef = currentQ.reference || {};
    updateCurrentQuestion({
      reference: {
        ...currentRef,
        ...refFields,
      }
    });
  };

  const handleAddNewQuestion = () => {
    const newQ: QuestionItem = {
      id: `q_${Date.now()}`,
      type: 'mcq',
      question: 'Nội dung câu hỏi mới...',
      options: [
        'A. Phương án A',
        'B. Phương án B',
        'C. Phương án C',
        'D. Phương án D'
      ],
      correctAnswer: 'A',
      points: 1,
      explanation: 'Lời giải chi tiết cho câu hỏi này...',
      figureType: 'none',
      reference: {
        topic: 'Toán THPT',
        curriculumLesson: 'Bài học tham chiếu',
        cognitiveLevel: 'Thông hiểu',
        competency: 'Tư duy và lập luận toán học',
        coreKnowledge: 'Công thức và kiến thức trọng tâm...',
        variationGuide: 'Gợi ý thay đổi số liệu...'
      }
    };
    setQuestions([...questions, newQ]);
    setActiveIndex(questions.length);
  };

  const handleDuplicateQuestion = (idx: number) => {
    const target = questions[idx];
    if (!target) return;
    const duplicated: QuestionItem = JSON.parse(JSON.stringify(target));
    duplicated.id = `q_${Date.now()}`;
    const nextList = [...questions];
    nextList.splice(idx + 1, 0, duplicated);
    setQuestions(nextList);
    setActiveIndex(idx + 1);
  };

  const handleDeleteQuestion = (idx: number) => {
    if (questions.length <= 1) {
      alert('Đề thi cần có ít nhất một câu hỏi.');
      return;
    }
    if (!confirm(`Bạn có chắc chắn muốn xóa Câu ${idx + 1}?`)) return;
    const nextList = questions.filter((_, i) => i !== idx);
    setQuestions(nextList);
    if (activeIndex >= nextList.length) {
      setActiveIndex(Math.max(0, nextList.length - 1));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateCurrentQuestion({
        imageUrl: reader.result as string,
        figureType: 'image',
        figureDescription: currentQ?.figureDescription || 'Hình vẽ minh họa'
      });
    };
    reader.readAsDataURL(file);
  };

  const applyFigureTemplate = (template: MathFigureTemplate) => {
    updateCurrentQuestion({
      figureType: template.figureType,
      figureSvg: template.figureSvg || '',
      figureTable: template.figureTable || '',
      figureDescription: template.figureDescription
    });
    setShowFigureTemplateModal(false);
  };

  const removeFigure = () => {
    updateCurrentQuestion({
      figureType: 'none',
      figureSvg: undefined,
      figureTable: undefined,
      figureDescription: undefined,
      imageUrl: undefined
    });
    setShowRawSvgEditor(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-60 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-6xl h-[92vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 p-2 rounded-xl border border-slate-200 shadow-2xs transition-colors flex items-center gap-1.5 text-sm font-semibold cursor-pointer"
            >
              <ArrowLeft size={16} /> Trở lại
            </button>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-800 truncate flex items-center gap-2">
                <span>Chỉnh sửa câu hỏi & Nội dung tham chiếu:</span>
                <span className="text-blue-600 font-semibold truncate max-w-xs sm:max-w-md">{testTitle}</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Tổng cộng {questions.length} câu hỏi • Có hình vẽ, bảng biểu & chuẩn tham chiếu GDPT
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onSave(questions)}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-200 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save size={16} />
              {isSaving ? 'Đang lưu...' : 'Lưu tất cả thay đổi'}
            </button>
          </div>
        </div>

        {/* Main Body: Two Columns Layout */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Sidebar: Questions Navigator */}
          <div className="w-56 sm:w-64 border-r border-slate-200 bg-slate-50/70 flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Danh sách câu ({questions.length})
              </span>
              <button
                type="button"
                onClick={handleAddNewQuestion}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                title="Thêm câu hỏi mới"
              >
                <Plus size={14} /> Thêm câu
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {questions.map((q, idx) => {
                const isSelected = idx === activeIndex;
                const hasVisual = Boolean(q.figureSvg || q.figureTable || q.imageUrl);
                const level = q.reference?.cognitiveLevel || '';
                
                return (
                  <button
                    key={q.id || idx}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                        : 'bg-white hover:bg-slate-100/90 text-slate-700 border border-slate-200/80 shadow-2xs'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                          Câu {idx + 1}
                        </span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                          isSelected ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {q.type === 'mcq' ? 'MCQ' : q.type === 'tf' ? 'Đúng/Sai' : q.type === 'short' ? 'Điền' : 'Tự luận'}
                        </span>
                      </div>
                      <p className={`text-[11px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                        {q.question || 'Câu hỏi chưa có nội dung...'}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {hasVisual && (
                        <span 
                          className={`p-0.5 rounded ${isSelected ? 'text-white' : 'text-blue-600'}`}
                          title="Có hình vẽ hoặc bảng biểu"
                        >
                          <ImageIcon size={12} />
                        </span>
                      )}
                      {level && (
                        <span className={`text-[9px] font-bold px-1 rounded ${
                          isSelected ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {level.slice(0, 2)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Editor Area */}
          {currentQ ? (
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
              
              {/* Question Control Strip */}
              <div className="px-6 py-3 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm">Câu {activeIndex + 1}:</span>
                    <select
                      value={currentQ.type}
                      onChange={(e) => updateCurrentQuestion({ type: e.target.value as QuestionType })}
                      className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-blue-500 cursor-pointer"
                    >
                      <option value="mcq">Trắc nghiệm 4 lựa chọn (A, B, C, D)</option>
                      <option value="tf">Trắc nghiệm Đúng / Sai (4 ý a, b, c, d)</option>
                      <option value="short">Trả lời ngắn (Điền đáp số)</option>
                      <option value="essay">Tự luận (Trình bày bài giải)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="font-medium">Điểm:</span>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      max="10"
                      value={currentQ.points ?? 1}
                      onChange={(e) => updateCurrentQuestion({ points: parseFloat(e.target.value) || 0 })}
                      className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center focus:outline-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="font-medium">Mức độ:</span>
                    <select
                      value={currentQ.reference?.cognitiveLevel || 'Thông hiểu'}
                      onChange={(e) => updateReference({ cognitiveLevel: e.target.value })}
                      className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-blue-500 cursor-pointer"
                    >
                      <option value="Nhận biết">Nhận biết</option>
                      <option value="Thông hiểu">Thông hiểu</option>
                      <option value="Vận dụng">Vận dụng</option>
                      <option value="Vận dụng cao">Vận dụng cao</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDuplicateQuestion(activeIndex)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                    title="Nhân bản câu hỏi này"
                  >
                    <Copy size={13} /> Nhân bản
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(activeIndex)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg border border-rose-200 flex items-center gap-1 transition-colors cursor-pointer"
                    title="Xóa câu hỏi này"
                  >
                    <Trash2 size={13} /> Xóa
                  </button>
                </div>
              </div>

              {/* Sub-tabs: Nội dung câu hỏi / Hình vẽ & Bảng biểu / Tham chiếu sửa đề */}
              <div className="px-6 border-b border-slate-200 bg-slate-50/50 flex items-center gap-4 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('content')}
                  className={`py-2.5 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'content'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <BookOpen size={14} /> 1. Nội dung đề bài & Đáp án
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('visual')}
                  className={`py-2.5 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'visual'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ImageIcon size={14} /> 2. Hình vẽ & Bảng biểu minh họa
                  {(currentQ.figureSvg || currentQ.figureTable || currentQ.imageUrl) && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('reference')}
                  className={`py-2.5 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'reference'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Sparkles size={14} className="text-amber-500" /> 3. Nội dung tham chiếu để giáo viên sửa đề
                </button>
              </div>

              {/* Tab Panels Container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
                
                {/* TAB 1: QUESTION CONTENT & OPTIONS */}
                {activeTab === 'content' && (
                  <div className="space-y-6">
                    {/* Live Visual Figure or Table banner if present */}
                    {((currentQ.figureType !== 'none' && (currentQ.figureSvg || currentQ.figureTable)) || currentQ.imageUrl) && (
                      <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                            <ImageIcon size={13} className="text-blue-600" /> Hình vẽ / Bảng biểu đính kèm:
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveTab('visual')}
                            className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                          >
                            Chỉnh sửa hình/bảng →
                          </button>
                        </div>
                        <QuestionVisualRenderer
                          figureType={currentQ.figureType}
                          figureSvg={currentQ.figureSvg}
                          figureTable={currentQ.figureTable}
                          figureDescription={currentQ.figureDescription}
                          imageUrl={currentQ.imageUrl}
                        />
                      </div>
                    )}

                    {/* Question Stem */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                          Đề bài (Hỗ trợ công thức LaTeX: $...$ hoặc $$...$$)
                        </label>
                      </div>
                      <textarea
                        rows={3}
                        value={currentQ.question}
                        onChange={(e) => updateCurrentQuestion({ question: e.target.value })}
                        placeholder="Nhập nội dung câu hỏi tại đây... (Ví dụ: Cho hàm số $y = f(x)$ có bảng biến thiên như hình bên...)"
                        className="w-full p-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-800 focus:outline-blue-500 bg-slate-50/50"
                      />
                      {currentQ.question && (
                        <div className="mt-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-sm text-slate-800">
                          <span className="text-xs font-bold text-blue-700 block mb-1">Xem trước đề bài:</span>
                          <MathText content={currentQ.question} />
                        </div>
                      )}
                    </div>

                    {/* Options: Based on question type */}
                    {currentQ.type === 'mcq' && (
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                          4 Phương án lựa chọn (Chọn nút tròn để đặt làm đáp án đúng)
                        </label>

                        <div className="space-y-2.5">
                          {['A', 'B', 'C', 'D'].map((letter, optIdx) => {
                            const currentOptions = Array.isArray(currentQ.options) ? [...currentQ.options] : [];
                            const rawOpt = currentOptions[optIdx] || '';
                            const cleanText = stripOptionPrefix(rawOpt);
                            const isCorrect = (currentQ.correctAnswer || '').trim().toUpperCase() === letter ||
                                              (currentQ.correctAnswer || '').trim() === rawOpt.trim();

                            return (
                              <div 
                                key={letter}
                                className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                                  isCorrect ? 'bg-emerald-50/80 border-emerald-300' : 'bg-white border-slate-200'
                                }`}
                              >
                                <label className="flex items-center gap-1.5 mt-1 cursor-pointer shrink-0">
                                  <input
                                    type="radio"
                                    name={`correct_mcq_${currentQ.id}`}
                                    checked={isCorrect}
                                    onChange={() => updateCurrentQuestion({ correctAnswer: letter })}
                                    className="w-4 h-4 text-emerald-600 cursor-pointer"
                                  />
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                    isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                                  }`}>
                                    {letter}
                                  </span>
                                </label>

                                <div className="flex-1 space-y-1">
                                  <input
                                    type="text"
                                    value={cleanText}
                                    onChange={(e) => {
                                      const nextOpts = [...currentOptions];
                                      nextOpts[optIdx] = `${letter}. ${e.target.value}`;
                                      updateCurrentQuestion({ options: nextOpts });
                                    }}
                                    placeholder={`Nhập phương án ${letter}...`}
                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50/50 focus:outline-blue-500"
                                  />
                                  {cleanText && (
                                    <div className="text-xs text-slate-600 pl-1">
                                      <MathText content={cleanText} />
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* True / False Sub-statements */}
                    {currentQ.type === 'tf' && (
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                          4 Ý khẳng định Đúng / Sai (Chuẩn Bộ GD&ĐT)
                        </label>

                        <div className="space-y-3">
                          {['a', 'b', 'c', 'd'].map((letter, optIdx) => {
                            const currentOptions = Array.isArray(currentQ.options) ? [...currentQ.options] : [];
                            const rawOpt = currentOptions[optIdx] || '';
                            const cleanText = stripOptionPrefix(rawOpt);

                            // Parse current correctness from correctAnswer (e.g. "a-Đ, b-S, c-Đ, d-S")
                            const ansStr = currentQ.correctAnswer || '';
                            const isDung = ansStr.includes(`${letter}-Đ`) || ansStr.includes(`${letter}) Đúng`);
                            const isSai = ansStr.includes(`${letter}-S`) || ansStr.includes(`${letter}) Sai`);

                            const setSubAnswer = (val: 'Đ' | 'S') => {
                              let currentMap: Record<string, string> = { a: 'Đ', b: 'S', c: 'Đ', d: 'S' };
                              // Parse existing
                              ['a', 'b', 'c', 'd'].forEach(k => {
                                if (ansStr.includes(`${k}-Đ`)) currentMap[k] = 'Đ';
                                else if (ansStr.includes(`${k}-S`)) currentMap[k] = 'S';
                              });
                              currentMap[letter] = val;
                              const newAns = `a-${currentMap.a}, b-${currentMap.b}, c-${currentMap.c}, d-${currentMap.d}`;
                              updateCurrentQuestion({ correctAnswer: newAns });
                            };

                            return (
                              <div key={letter} className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center text-xs font-bold shrink-0">
                                    {letter})
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setSubAnswer('Đ')}
                                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        isDung ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                      }`}
                                    >
                                      Đúng (Đ)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setSubAnswer('S')}
                                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        isSai ? 'bg-rose-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                      }`}
                                    >
                                      Sai (S)
                                    </button>
                                  </div>
                                </div>

                                <input
                                  type="text"
                                  value={cleanText}
                                  onChange={(e) => {
                                    const nextOpts = [...currentOptions];
                                    nextOpts[optIdx] = `${letter}) ${e.target.value}`;
                                    updateCurrentQuestion({ options: nextOpts });
                                  }}
                                  placeholder={`Khẳng định ý ${letter})...`}
                                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-blue-500"
                                />
                                {cleanText && (
                                  <div className="text-xs text-slate-600 pl-1">
                                    <MathText content={cleanText} />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Short Answer or Essay */}
                    {(currentQ.type === 'short' || currentQ.type === 'essay') && (
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                          {currentQ.type === 'short' ? 'Đáp số / Giá trị số trả lời ngắn:' : 'Tóm tắt kết quả chính:'}
                        </label>
                        <input
                          type="text"
                          value={currentQ.correctAnswer || ''}
                          onChange={(e) => updateCurrentQuestion({ correctAnswer: e.target.value })}
                          placeholder={currentQ.type === 'short' ? 'Ví dụ: 15 hoặc -3/4 hoặc 2.5' : 'Đáp số tóm tắt...'}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-800 bg-slate-50/50 focus:outline-blue-500"
                        />
                      </div>
                    )}

                    {/* Explanation / Solution */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                        Lời giải chi tiết & Barem chấm điểm (Step-by-step Solution):
                      </label>
                      <textarea
                        rows={4}
                        value={currentQ.explanation || ''}
                        onChange={(e) => updateCurrentQuestion({ explanation: e.target.value })}
                        placeholder="Nhập lời giải chi tiết từng bước (Hỗ trợ công thức LaTeX: $...$)..."
                        className="w-full p-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 focus:outline-blue-500 bg-slate-50/50"
                      />
                      {currentQ.explanation && (
                        <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-800">
                          <span className="font-bold text-slate-700 block mb-1">Xem trước lời giải:</span>
                          <MathText content={currentQ.explanation} />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: VISUALS (FIGURES / TABLES / IMAGES) */}
                {activeTab === 'visual' && (
                  <div className="space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <ImageIcon size={18} className="text-blue-600" />
                            Quản lý hình vẽ & Bảng biểu cho câu hỏi này
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Hỗ trợ hình học không gian SVG, đồ thị toạ độ Oxy, bảng biến thiên và hình ảnh tải lên.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowFigureTemplateModal(true)}
                            className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-200"
                          >
                            <Layers size={14} /> Chèn mẫu hình/bảng toán học
                          </button>

                          <label className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200">
                            <Upload size={14} /> Tải ảnh từ máy
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>

                          {(currentQ.figureSvg || currentQ.figureTable || currentQ.imageUrl) && (
                            <button
                              type="button"
                              onClick={removeFigure}
                              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-200"
                            >
                              <Trash2 size={14} /> Xóa hình/bảng
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Rule Note */}
                      <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
                        <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Quy chuẩn đề thi:</span> Chỉ những câu hỏi nào đề bài cho sẵn bảng (bảng biến thiên, bảng tần số) hoặc cho sẵn hình vẽ (đồ thị, hình cho sẵn dữ kiện) thì mới cần đính kèm. Những câu đề bài không cho dữ liệu bảng/hình vẽ thì không vẽ sẵn để học sinh tự làm bài và tự vẽ nháp.
                        </div>
                      </div>

                      {/* Figure Description Caption */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Chú thích hình vẽ / Tiêu đề bảng biểu (Ví dụ: "Hình chóp S.ABCD có đáy là hình vuông"):
                        </label>
                        <input
                          type="text"
                          value={currentQ.figureDescription || ''}
                          onChange={(e) => updateCurrentQuestion({ figureDescription: e.target.value })}
                          placeholder="Nhập chú thích hiển thị dưới hình vẽ..."
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50/50 focus:outline-blue-500"
                        />
                      </div>

                      {/* Current Visual Preview */}
                      {(currentQ.figureSvg || currentQ.figureTable || currentQ.imageUrl) ? (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-xs font-bold text-slate-600 block mb-2">Xem trước trực quan:</span>
                          <QuestionVisualRenderer
                            figureType={currentQ.figureType}
                            figureSvg={currentQ.figureSvg}
                            figureTable={currentQ.figureTable}
                            figureDescription={currentQ.figureDescription}
                            imageUrl={currentQ.imageUrl}
                          />

                          {/* Raw Editor Toggles */}
                          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => setShowRawSvgEditor(!showRawSvgEditor)}
                              className="text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                            >
                              <Code size={14} />
                              {showRawSvgEditor ? 'Ẩn mã nguồn SVG / Bảng' : 'Chỉnh sửa trực tiếp mã nguồn SVG / Bảng biểu'}
                            </button>
                          </div>

                          {showRawSvgEditor && (
                            <div className="mt-3 space-y-3">
                              {currentQ.figureSvg && (
                                <div>
                                  <label className="text-xs font-bold text-slate-700 block mb-1">Mã SVG:</label>
                                  <textarea
                                    rows={8}
                                    value={currentQ.figureSvg}
                                    onChange={(e) => updateCurrentQuestion({ figureSvg: e.target.value })}
                                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono text-xs bg-white text-slate-800"
                                  />
                                </div>
                              )}
                              {currentQ.figureTable && (
                                <div>
                                  <label className="text-xs font-bold text-slate-700 block mb-1">Nội dung bảng (Markdown format):</label>
                                  <textarea
                                    rows={6}
                                    value={currentQ.figureTable}
                                    onChange={(e) => updateCurrentQuestion({ figureTable: e.target.value })}
                                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono text-xs bg-white text-slate-800"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                          <ImageIcon size={36} className="mx-auto text-slate-400 mb-2" />
                          <p className="text-sm font-bold text-slate-700">Câu hỏi này chưa có hình vẽ hoặc bảng biểu</p>
                          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                            Bạn có thể chọn từ kho hình mẫu toán học (hình chóp, lăng trụ, đồ thị, bảng biến thiên) hoặc tải ảnh lên.
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowFigureTemplateModal(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm transition-colors cursor-pointer"
                          >
                            + Chọn mẫu hình toán học
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: REFERENCE & TEACHER EDITING GUIDE */}
                {activeTab === 'reference' && (
                  <div className="space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-2xs space-y-5">
                      <div className="pb-3 border-b border-indigo-100">
                        <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                          <Sparkles size={18} className="text-amber-500" />
                          Nội dung tham chiếu sư phạm & Hướng dẫn sửa đề
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Thông tin đối chiếu chuẩn chương trình GDPT, ma trận nhận thức và chỉ dẫn sửa đề cho giáo viên.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Topic */}
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Chủ đề kiến thức tham chiếu:
                          </label>
                          <input
                            type="text"
                            value={currentQ.reference?.topic || ''}
                            onChange={(e) => updateReference({ topic: e.target.value })}
                            placeholder="Ví dụ: Hình học không gian - Thể tích khối chóp"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50/50 focus:outline-blue-500"
                          />
                        </div>

                        {/* Curriculum Lesson */}
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Bài học SGK tham chiếu (Toán GDPT 2018):
                          </label>
                          <input
                            type="text"
                            value={currentQ.reference?.curriculumLesson || ''}
                            onChange={(e) => updateReference({ curriculumLesson: e.target.value })}
                            placeholder="Ví dụ: SGK Toán 12 - Chương 1: Bài 1"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50/50 focus:outline-blue-500"
                          />
                        </div>

                        {/* Cognitive Level */}
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Mức độ nhận thức (Ma trận):
                          </label>
                          <select
                            value={currentQ.reference?.cognitiveLevel || 'Thông hiểu'}
                            onChange={(e) => updateReference({ cognitiveLevel: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50/50 focus:outline-blue-500 cursor-pointer"
                          >
                            <option value="Nhận biết">Nhận biết (NB)</option>
                            <option value="Thông hiểu">Thông hiểu (TH)</option>
                            <option value="Vận dụng">Vận dụng (VD)</option>
                            <option value="Vận dụng cao">Vận dụng cao (VDC)</option>
                          </select>
                        </div>

                        {/* Competency */}
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Năng lực toán học mục tiêu:
                          </label>
                          <input
                            type="text"
                            value={currentQ.reference?.competency || ''}
                            onChange={(e) => updateReference({ competency: e.target.value })}
                            placeholder="Ví dụ: Tư duy và lập luận toán học"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50/50 focus:outline-blue-500"
                          />
                        </div>
                      </div>

                      {/* Core Knowledge */}
                      <div>
                        <label className="text-xs font-bold text-indigo-900 block mb-1 flex items-center gap-1.5">
                          <BookOpen size={14} className="text-indigo-600" />
                          Kiến thức trọng tâm & Công thức cốt lõi cần nhớ:
                        </label>
                        <textarea
                          rows={3}
                          value={currentQ.reference?.coreKnowledge || ''}
                          onChange={(e) => updateReference({ coreKnowledge: e.target.value })}
                          placeholder="Ví dụ: Công thức tính thể tích khối chóp $V = \frac{1}{3}Bh$; Điều kiện hàm số đồng biến trên khoảng $K$ là $f'(x) \ge 0, \forall x \in K$..."
                          className="w-full p-3 rounded-lg border border-indigo-200 text-xs font-medium text-slate-800 focus:outline-blue-500 bg-indigo-50/20"
                        />
                        {currentQ.reference?.coreKnowledge && (
                          <div className="mt-1.5 p-2.5 bg-indigo-50/60 rounded-lg text-xs text-indigo-950">
                            <MathText content={currentQ.reference.coreKnowledge} />
                          </div>
                        )}
                      </div>

                      {/* Variation Guide for Teachers */}
                      <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
                        <label className="text-xs font-bold text-amber-900 block flex items-center gap-1.5">
                          <Sparkles size={14} className="text-amber-600" />
                          Hướng dẫn giáo viên sửa đề / Đổi số liệu tương đương:
                        </label>
                        <textarea
                          rows={4}
                          value={currentQ.reference?.variationGuide || ''}
                          onChange={(e) => updateReference({ variationGuide: e.target.value })}
                          placeholder="Hướng dẫn cho giáo viên: Có thể đổi hàm số thành $y = x^3 - 3x^2$ để nghiệm đạo hàm vẫn là 0 và 2; đổi chiều cao từ $a\sqrt{3}$ sang $2a$..."
                          className="w-full p-3 rounded-lg border border-amber-300 text-xs font-medium text-slate-800 focus:outline-amber-500 bg-white"
                        />
                        {currentQ.reference?.variationGuide && (
                          <div className="mt-1.5 p-2.5 bg-white/90 rounded-lg border border-amber-200 text-xs text-amber-950 font-medium">
                            <span className="font-bold text-amber-800 block mb-0.5">Hiển thị trực quan:</span>
                            <MathText content={currentQ.reference.variationGuide} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-12 text-slate-400">
              Chưa chọn câu hỏi nào.
            </div>
          )}

        </div>

      </div>

      {/* Modal: Library of Pre-built Math Figures */}
      {showFigureTemplateModal && (
        <div 
          className="fixed inset-0 z-70 bg-black/60 flex items-center justify-center p-4 backdrop-blur-2xs animate-in fade-in duration-150"
          onClick={() => setShowFigureTemplateModal(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Layers size={18} className="text-blue-600" />
                  Kho mẫu hình vẽ & Bảng biểu toán học chuẩn
                </h3>
                <p className="text-xs text-slate-500">
                  Chọn mẫu để chèn ngay vào câu hỏi hiện tại. Bạn có thể chỉnh sửa lại sau khi chèn.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFigureTemplateModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {MATH_FIGURE_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="bg-slate-50/70 hover:bg-blue-50/40 p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-all flex flex-col justify-between group cursor-pointer"
                  onClick={() => applyFigureTemplate(tmpl)}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {tmpl.name}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                        {tmpl.figureType === 'svg' ? 'SVG Hình học/Đồ thị' : 'Bảng biến thiên'}
                      </span>
                    </div>

                    <div className="my-2 bg-white rounded-lg p-2 border border-slate-200 flex items-center justify-center min-h-[140px]">
                      <QuestionVisualRenderer
                        figureType={tmpl.figureType}
                        figureSvg={tmpl.figureSvg}
                        figureTable={tmpl.figureTable}
                        figureDescription={tmpl.figureDescription}
                        interactive={false}
                      />
                    </div>

                    <p className="text-xs text-slate-500 italic mt-1">
                      {tmpl.figureDescription}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-200/80 flex justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        applyFigureTemplate(tmpl);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-2xs flex items-center gap-1"
                    >
                      <Plus size={13} /> Dùng mẫu này
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowFigureTemplateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
