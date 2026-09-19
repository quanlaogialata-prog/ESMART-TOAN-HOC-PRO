import React from 'react';
import {
  Sparkles,
  Upload,
  LayoutGrid,
  List,
  Sliders,
  Layers,
  Shuffle,
  Clock,
  BookOpen,
  Info,
  X,
  ArrowLeft,
  Check,
  FileSpreadsheet,
  FileText,
  AlertCircle
} from 'lucide-react';

interface CreateOnlineTestModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  editingTestId: string | null;
  onlineCreationMode: 'auto' | 'upload' | 'matrix';
  setOnlineCreationMode: (mode: 'auto' | 'upload' | 'matrix') => void;
  examFormat: 'mcq_3part' | 'mcq_custom' | 'essay' | 'mixed';
  setExamFormat: (f: 'mcq_3part' | 'mcq_custom' | 'essay' | 'mixed') => void;
  autoGenType: string;
  setAutoGenType: (t: any) => void;
  matrixSourceType: 'preset' | 'file';
  setMatrixSourceType: (s: 'preset' | 'file') => void;
  matrixConfig: {
    name: string;
    levels: { recognize: number; understand: number; apply: number; highApply: number };
    notes?: string;
  };
  setMatrixConfig: React.Dispatch<React.SetStateAction<{
    name: string;
    levels: { recognize: number; understand: number; apply: number; highApply: number };
    notes?: string;
  }>>;
  selectedMatrixPreset: string;
  setSelectedMatrixPreset: (p: string) => void;
  matrixFile: File | null;
  setMatrixFile: (f: File | null) => void;
  activePresetId: string;
  setActivePresetId: (id: string) => void;
  formatPresets: Record<string, any[]>;
  matrixPresets: any[];
  applyPreset: (preset: any, format: string) => void;
  applyMatrixPreset: (preset: any) => void;
  newTitle: string;
  setNewTitle: (t: string) => void;
  newDuration: string;
  setNewDuration: (d: string) => void;
  newGrade: string;
  setNewGrade: (g: string) => void;
  newTopicId: string;
  setNewTopicId: (id: string) => void;
  topics: Array<{ id: string; name: string; grade: number }>;
  part1Count: string;
  setPart1Count: (c: string) => void;
  part2Count: string;
  setPart2Count: (c: string) => void;
  part3Count: string;
  setPart3Count: (c: string) => void;
  customPart1Enabled: boolean;
  setCustomPart1Enabled: (e: boolean) => void;
  customPart1Count: string;
  setCustomPart1Count: (c: string) => void;
  customPart2Enabled: boolean;
  setCustomPart2Enabled: (e: boolean) => void;
  customPart2Count: string;
  setCustomPart2Count: (c: string) => void;
  customPart3Enabled: boolean;
  setCustomPart3Enabled: (e: boolean) => void;
  customPart3Count: string;
  setCustomPart3Count: (c: string) => void;
  mcqCount: string;
  setMcqCount: (c: string) => void;
  essayCount: string;
  setEssayCount: (c: string) => void;
  newFile: File | null;
  setNewFile: (f: File | null) => void;
  newAnswerFile: File | null;
  setNewAnswerFile: (f: File | null) => void;
  splitAnswers: boolean;
  setSplitAnswers: (s: boolean) => void;
  createMultiVariant: boolean;
  setCreateMultiVariant: (v: boolean) => void;
  createVariantMethod: 'isomorphic' | 'shuffle';
  setCreateVariantMethod: (m: 'isomorphic' | 'shuffle') => void;
  customVariantCodes: string;
  setCustomVariantCodes: (c: string) => void;
  shuffleQuestions: boolean;
  setShuffleQuestions: (s: boolean) => void;
  shuffleOptions: boolean;
  setShuffleOptions: (s: boolean) => void;
  isSaving: boolean;
  sysError: string;
  setSysError: (e: string) => void;
  sysMsg: string;
}

export const CreateOnlineTestModal: React.FC<CreateOnlineTestModalProps> = ({
  show,
  onClose,
  onSubmit,
  editingTestId,
  onlineCreationMode,
  setOnlineCreationMode,
  examFormat,
  setExamFormat,
  autoGenType,
  setAutoGenType,
  matrixSourceType,
  setMatrixSourceType,
  matrixConfig,
  selectedMatrixPreset,
  matrixFile,
  setMatrixFile,
  activePresetId,
  formatPresets,
  matrixPresets,
  applyPreset,
  applyMatrixPreset,
  newTitle,
  setNewTitle,
  newDuration,
  setNewDuration,
  newGrade,
  setNewGrade,
  newTopicId,
  setNewTopicId,
  topics,
  part1Count,
  setPart1Count,
  part2Count,
  setPart2Count,
  part3Count,
  setPart3Count,
  customPart1Enabled,
  setCustomPart1Enabled,
  customPart1Count,
  setCustomPart1Count,
  customPart2Enabled,
  setCustomPart2Enabled,
  customPart2Count,
  setCustomPart2Count,
  customPart3Enabled,
  setCustomPart3Enabled,
  customPart3Count,
  setCustomPart3Count,
  mcqCount,
  setMcqCount,
  essayCount,
  setEssayCount,
  newFile,
  setNewFile,
  newAnswerFile,
  setNewAnswerFile,
  splitAnswers,
  setSplitAnswers,
  createMultiVariant,
  setCreateMultiVariant,
  createVariantMethod,
  setCreateVariantMethod,
  customVariantCodes,
  setCustomVariantCodes,
  shuffleQuestions,
  setShuffleQuestions,
  shuffleOptions,
  setShuffleOptions,
  isSaving,
  sysError,
  setSysError,
  sysMsg,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] my-auto border border-gray-100" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-gray-100 bg-gray-50/90 shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-800 flex items-center gap-1.5 font-semibold bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-2xs hover:bg-gray-50 transition-colors text-xs"
            >
              <ArrowLeft size={16} /> Trở lại
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span>
                  {editingTestId 
                    ? (onlineCreationMode === 'auto' ? 'Chỉnh sửa đề thi tự động' : (onlineCreationMode === 'upload' ? 'Chỉnh sửa đề tải lên' : 'Chỉnh sửa đề theo ma trận'))
                    : (onlineCreationMode === 'auto' ? 'Tạo đề thi tự động' : (onlineCreationMode === 'upload' ? 'Tạo đề từ đề tải lên' : 'Tạo đề theo ma trận có sẵn'))
                  }
                </span>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  onlineCreationMode === 'auto'
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : (onlineCreationMode === 'upload' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200')
                }`}>
                  {onlineCreationMode === 'auto' ? 'AI & Ngân hàng đề' : (onlineCreationMode === 'upload' ? 'Tệp PDF / Word / Ảnh' : 'Chuẩn Bộ GD&ĐT & Trường')}
                </span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {onlineCreationMode === 'auto' 
                  ? 'AI & Ngân hàng câu hỏi tự động sinh đề thi toán học chuẩn mực kèm đáp án và lời giải chi tiết'
                  : (onlineCreationMode === 'upload' 
                      ? 'Tải tệp đề PDF, Word, Ảnh lên để AI tự động trích xuất thành đề làm bài tương tác trực tuyến'
                      : 'Tạo đề chuẩn theo khung ma trận năng lực Bộ GD&ĐT (4 mức độ) hoặc tệp ma trận của trường')}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-200/60 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 sm:p-6 space-y-6 overflow-y-auto">
          {sysError && (
            <div className="p-3.5 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200 font-medium flex items-center gap-2">
              <AlertCircle size={17} className="shrink-0 text-red-600" />
              <span>{sysError}</span>
            </div>
          )}
          {sysMsg && (
            <div className="p-3.5 bg-green-50 text-green-800 rounded-xl text-sm border border-green-200 font-medium flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping"></span>
              {sysMsg}
            </div>
          )}

          {/* ============================================================ */}
          {/* PHƯƠNG THỨC TẠO ĐỀ DUY NHẤT TƯƠNG ỨNG MỖI MỤC                 */}
          {/* ============================================================ */}
          {onlineCreationMode === 'auto' && (
            <div className="p-4 rounded-xl border-2 bg-gradient-to-r from-blue-50 to-indigo-50/40 border-blue-500/70 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <span className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs shrink-0">
                  <Sparkles size={20} />
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-blue-950">Phương thức: Tạo đề thi tự động</h3>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-200/80 text-blue-800">
                      AI & Ngân hàng câu hỏi
                    </span>
                  </div>
                  <p className="text-xs text-blue-800/80 mt-1 leading-relaxed">
                    Hệ thống AI kết hợp ngân hàng đề tự động tạo câu hỏi trắc nghiệm, tự luận toán học chuẩn mực kèm đáp án và lời giải chi tiết.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 bg-white/90 px-3 py-2 rounded-lg border border-blue-200 shrink-0 self-start sm:self-auto">
                <span>✓ Tự sinh đáp án</span>
                <span>&bull;</span>
                <span>✓ Lời giải chi tiết</span>
              </div>
            </div>
          )}

          {onlineCreationMode === 'upload' && (
            <div className="p-4 rounded-xl border-2 bg-gradient-to-r from-indigo-50 to-purple-50/40 border-indigo-500/70 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <span className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs shrink-0">
                  <Upload size={20} />
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-indigo-950">Phương thức: Tạo đề từ đề tải lên</h3>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-200/80 text-indigo-800">
                      Tệp PDF, Word (.docx), Ảnh
                    </span>
                  </div>
                  <p className="text-xs text-indigo-800/80 mt-1 leading-relaxed">
                    Tải lên tệp đề bài có sẵn từ máy tính; AI tự động bóc tách thành đề làm bài tương tác trực tuyến cho học sinh.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 bg-white/90 px-3 py-2 rounded-lg border border-indigo-200 shrink-0 self-start sm:self-auto">
                <span>✓ Đa định dạng</span>
                <span>&bull;</span>
                <span>✓ Tách đề & đáp án</span>
              </div>
            </div>
          )}

          {onlineCreationMode === 'matrix' && (
            <div className="p-4 rounded-xl border-2 bg-gradient-to-r from-emerald-50 to-teal-50/40 border-emerald-500/70 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <span className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs shrink-0">
                  <LayoutGrid size={20} />
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-emerald-950">Phương thức: Tạo đề theo ma trận có sẵn</h3>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-200/80 text-emerald-800">
                      Chuẩn Bộ GD&ĐT & Trường
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800/80 mt-1 leading-relaxed">
                    Tạo đề chuẩn theo khung ma trận năng lực 4 mức độ nhận thức (NB – TH – VD – VDC) hoặc tải lên tệp ma trận của trường.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-white/90 px-3 py-2 rounded-lg border border-emerald-200 shrink-0 self-start sm:self-auto">
                <span>✓ 4 Mức độ nhận thức</span>
                <span>&bull;</span>
                <span>✓ Khung chuẩn Bộ/Sở</span>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* PHẦN I: 4 HÌNH THỨC ĐỀ THI                                    */}
          {/* ============================================================ */}
          <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold">1</span>
                Hình thức đề thi
              </label>
              <span className="text-xs text-gray-500">
                Áp dụng cho: <strong>{onlineCreationMode === 'auto' ? 'Tạo tự động' : (onlineCreationMode === 'upload' ? 'Đề tải lên' : 'Ma trận có sẵn')}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* 1. Trắc nghiệm 3 phần */}
              <button
                type="button"
                onClick={() => {
                  setExamFormat('mcq_3part');
                  if (onlineCreationMode !== 'matrix') setAutoGenType('mcq_3part');
                  const presets = formatPresets.mcq_3part;
                  if (presets && presets[0]) applyPreset(presets[0], 'mcq_3part');
                }}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  examFormat === 'mcq_3part'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-600/20'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-85 mb-1">
                    Chuẩn Bộ GD&ĐT
                  </div>
                  <div className="font-bold text-xs sm:text-sm">Trắc nghiệm 3 phần</div>
                </div>
                <p className={`text-[11px] mt-2 line-clamp-2 ${examFormat === 'mcq_3part' ? 'text-blue-100' : 'text-gray-500'}`}>
                  Nhiều PA + Đúng/Sai + Trả lời ngắn
                </p>
              </button>

              {/* 2. Trắc nghiệm tùy biến */}
              <button
                type="button"
                onClick={() => {
                  setExamFormat('mcq_custom');
                  if (onlineCreationMode !== 'matrix') setAutoGenType('mcq_custom');
                  const presets = formatPresets.mcq_custom;
                  if (presets && presets[0]) applyPreset(presets[0], 'mcq_custom');
                }}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  examFormat === 'mcq_custom'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-600/20'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-85 mb-1">
                    Linh hoạt
                  </div>
                  <div className="font-bold text-xs sm:text-sm">Trắc nghiệm tùy biến</div>
                </div>
                <p className={`text-[11px] mt-2 line-clamp-2 ${examFormat === 'mcq_custom' ? 'text-indigo-100' : 'text-gray-500'}`}>
                  Chọn kết hợp 1 hoặc 2 phần tự do
                </p>
              </button>

              {/* 3. Tự luận */}
              <button
                type="button"
                onClick={() => {
                  setExamFormat('essay');
                  if (onlineCreationMode !== 'matrix') setAutoGenType('essay');
                  const presets = formatPresets.essay;
                  if (presets && presets[0]) applyPreset(presets[0], 'essay');
                }}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  examFormat === 'essay'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-600/20'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-85 mb-1">
                    Toán tự luận
                  </div>
                  <div className="font-bold text-xs sm:text-sm">Tự luận</div>
                </div>
                <p className={`text-[11px] mt-2 line-clamp-2 ${examFormat === 'essay' ? 'text-amber-100' : 'text-gray-500'}`}>
                  Bài toán tự luận có barem và lời giải
                </p>
              </button>

              {/* 4. Tổng hợp */}
              <button
                type="button"
                onClick={() => {
                  setExamFormat('mixed');
                  if (onlineCreationMode !== 'matrix') setAutoGenType('mixed');
                  const presets = formatPresets.mixed;
                  if (presets && presets[0]) applyPreset(presets[0], 'mixed');
                }}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  examFormat === 'mixed'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm ring-2 ring-purple-600/20'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-85 mb-1">
                    TN + Tự luận
                  </div>
                  <div className="font-bold text-xs sm:text-sm">Tổng hợp</div>
                </div>
                <p className={`text-[11px] mt-2 line-clamp-2 ${examFormat === 'mixed' ? 'text-purple-100' : 'text-gray-500'}`}>
                  Kết hợp trắc nghiệm khách quan & tự luận
                </p>
              </button>
            </div>
          </div>

          {/* ============================================================ */}
          {/* PHẦN III: MẪU GỢI Ý ĐI KÈM CỦA HÌNH THỨC NÀY                  */}
          {/* ============================================================ */}
          <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" />
                Mẫu gợi ý đi kèm của hình thức này
              </label>
              <span className="text-[11px] text-blue-700 font-medium">
                Nhấp để tự động điền số câu, thời gian và barem chuẩn
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {(formatPresets[examFormat] || []).map((preset: any) => {
                const isSelected = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset, examFormat)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-white border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                        : 'bg-white/80 border-gray-200 hover:border-blue-200 hover:bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          {preset.badge}
                        </span>
                        <span className="text-xs font-bold text-blue-900 flex items-center gap-1">
                          <Clock size={12} className="text-blue-600" /> {preset.duration}'
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-gray-900 leading-snug mt-1">{preset.name}</h4>
                      <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{preset.desc}</p>
                    </div>
                    
                    <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                      <span className="text-gray-500 font-medium">{preset.totalQuestions} câu</span>
                      {isSelected ? (
                        <span className="text-blue-600 font-bold flex items-center gap-0.5">
                          <Check size={13} /> Đang chọn
                        </span>
                      ) : (
                        <span className="text-blue-500 hover:underline">Áp dụng</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ============================================================ */}
          {/* PHẦN IV: CẤU HÌNH THEO TỪNG PHƯƠNG THỨC                        */}
          {/* ============================================================ */}
          {/* 1. Nếu là phương thức 'matrix' (Tạo đề theo ma trận) */}
          {onlineCreationMode === 'matrix' && (
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
                  <LayoutGrid size={15} className="text-emerald-600" />
                  Nguồn ma trận đề thi
                </label>
                <div className="flex bg-white rounded-lg p-0.5 border border-emerald-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setMatrixSourceType('preset')}
                    className={`px-3 py-1 rounded-md font-semibold transition-all ${
                      matrixSourceType === 'preset' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-emerald-800 hover:bg-emerald-50'
                    }`}
                  >
                    Khung chuẩn có sẵn
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatrixSourceType('file')}
                    className={`px-3 py-1 rounded-md font-semibold transition-all ${
                      matrixSourceType === 'file' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-emerald-800 hover:bg-emerald-50'
                    }`}
                  >
                    Tải tệp ma trận trường
                  </button>
                </div>
              </div>

              {matrixSourceType === 'preset' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {matrixPresets.map(mp => (
                      <button
                        key={mp.id}
                        type="button"
                        onClick={() => applyMatrixPreset(mp)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          selectedMatrixPreset === mp.id
                            ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-2xs'
                            : 'bg-white/70 border-emerald-100 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-emerald-950">{mp.name}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">{mp.badge}</span>
                        </div>
                        <p className="text-[11px] text-gray-500">{mp.desc}</p>
                      </button>
                    ))}
                  </div>

                  {/* Thanh phân bổ tỷ lệ ma trận năng lực */}
                  <div className="bg-white p-3 rounded-xl border border-emerald-200">
                    <div className="text-xs font-bold text-gray-700 mb-2 flex items-center justify-between">
                      <span>Tỷ lệ phân bổ năng lực nhận thức theo ma trận:</span>
                      <span className="text-emerald-700 font-bold">{matrixConfig.levels.recognize + matrixConfig.levels.understand + matrixConfig.levels.apply + matrixConfig.levels.highApply}%</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs font-medium">
                      <div className="p-2 bg-blue-50 text-blue-900 rounded-lg border border-blue-200">
                        <div className="text-[10px] text-gray-500 uppercase font-semibold">Nhận biết</div>
                        <div className="font-bold text-sm text-blue-700">{matrixConfig.levels.recognize}%</div>
                      </div>
                      <div className="p-2 bg-teal-50 text-teal-900 rounded-lg border border-teal-200">
                        <div className="text-[10px] text-gray-500 uppercase font-semibold">Thông hiểu</div>
                        <div className="font-bold text-sm text-teal-700">{matrixConfig.levels.understand}%</div>
                      </div>
                      <div className="p-2 bg-amber-50 text-amber-900 rounded-lg border border-amber-200">
                        <div className="text-[10px] text-gray-500 uppercase font-semibold">Vận dụng</div>
                        <div className="font-bold text-sm text-amber-700">{matrixConfig.levels.apply}%</div>
                      </div>
                      <div className="p-2 bg-rose-50 text-rose-900 rounded-lg border border-rose-200">
                        <div className="text-[10px] text-gray-500 uppercase font-semibold">Vận dụng cao</div>
                        <div className="font-bold text-sm text-rose-700">{matrixConfig.levels.highApply}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-emerald-950 mb-1.5">
                    Tải lên tệp ma trận đề thi (Excel, PDF, Word, Ảnh...):
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setMatrixFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full px-3 py-2 border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200 bg-white"
                    accept=".xlsx,.xls,.pdf,.doc,.docx,.png,.jpg,.jpeg"
                  />
                  <p className="text-[11px] text-emerald-700 mt-1.5">
                    Hệ thống sẽ dùng AI phân tích khung ma trận của trường để sinh câu hỏi bám sát chuẩn kiến thức kỹ năng.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 2. Nếu là phương thức 'upload' (Tạo đề từ đề tải lên) */}
          {onlineCreationMode === 'upload' && (
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-indigo-950 uppercase tracking-wide flex items-center gap-1.5">
                  <Upload size={15} className="text-indigo-600" />
                  Tệp đề bài tải lên từ máy tính
                </label>
                <span className="text-[11px] text-indigo-700 font-medium">Hỗ trợ PDF, Word (.docx), Ảnh chụp</span>
              </div>

              <div>
                <input
                  type="file"
                  onChange={(e) => setNewFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full px-3 py-2 border border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-100 file:text-indigo-800 hover:file:bg-indigo-200 bg-white"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input 
                  type="checkbox" 
                  id="splitAnswers"
                  checked={splitAnswers}
                  onChange={(e) => setSplitAnswers(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300"
                />
                <label htmlFor="splitAnswers" className="text-xs font-medium text-gray-700 cursor-pointer">
                  Tệp này chứa CẢ ĐỀ BÀI VÀ ĐÁP ÁN (AI tự động bóc tách thành 2 phần)
                </label>
              </div>

              {!splitAnswers && (
                <div className="pt-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tệp ĐÁP ÁN / Biểu điểm (Tùy chọn - nếu có riêng):
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setNewAnswerFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 bg-white"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  />
                </div>
              )}

              <div className="p-3 bg-white rounded-lg border border-indigo-100 text-[11px] text-gray-600 flex items-start gap-2">
                <Info size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                <span>
                  AI sẽ đọc nội dung tệp đề bài của bạn, tự động trích xuất các câu hỏi theo hình thức <strong>{examFormat === 'mcq_3part' ? 'Trắc nghiệm 3 phần' : (examFormat === 'mcq_custom' ? 'Trắc nghiệm tùy biến' : (examFormat === 'essay' ? 'Tự luận' : 'Tổng hợp'))}</strong> đã chọn để học sinh làm bài trực tuyến.
                </span>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* PHẦN V: CHI TIẾT SỐ CÂU CÁC PHẦN (TÙY CHỈNH)                 */}
          {/* ============================================================ */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
                <BookOpen size={14} className="text-blue-600" />
                Cấu trúc số câu chi tiết
              </label>
              <span className="text-[11px] text-gray-500">Giáo viên có thể điều chỉnh số câu theo nhu cầu</span>
            </div>

            {/* 1. Dành cho Trắc nghiệm 3 phần */}
            {examFormat === 'mcq_3part' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200">
                  <div className="text-xs font-bold text-blue-950 mb-1">Phần I: Nhiều lựa chọn</div>
                  <div className="text-[11px] text-gray-500 mb-2">4 phương án A, B, C, D (1 PA đúng)</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">Số câu hỏi:</span>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      value={part1Count}
                      onChange={(e) => setPart1Count(e.target.value)}
                      className="w-16 px-2.5 py-1 border border-blue-300 rounded-lg text-center text-sm font-bold text-blue-900 bg-white"
                    />
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-200">
                  <div className="text-xs font-bold text-indigo-950 mb-1">Phần II: Đúng / Sai</div>
                  <div className="text-[11px] text-gray-500 mb-2">Mỗi câu có 4 ý a), b), c), d)</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">Số câu hỏi:</span>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={part2Count}
                      onChange={(e) => setPart2Count(e.target.value)}
                      className="w-16 px-2.5 py-1 border border-indigo-300 rounded-lg text-center text-sm font-bold text-indigo-900 bg-white"
                    />
                  </div>
                </div>

                <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-200">
                  <div className="text-xs font-bold text-purple-950 mb-1">Phần III: Trả lời ngắn</div>
                  <div className="text-[11px] text-gray-500 mb-2">Điền kết quả số học / công thức</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">Số câu hỏi:</span>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={part3Count}
                      onChange={(e) => setPart3Count(e.target.value)}
                      className="w-16 px-2.5 py-1 border border-purple-300 rounded-lg text-center text-sm font-bold text-purple-900 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. Dành cho Trắc nghiệm tùy biến */}
            {examFormat === 'mcq_custom' && (
              <div className="space-y-2">
                <p className="text-xs text-indigo-700 font-medium">
                  Chọn 1 hoặc tối đa 2 phần từ cấu trúc 3 phần:
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* P1 */}
                  <div className={`p-3 rounded-xl border transition-all ${
                    customPart1Enabled ? 'bg-blue-50/70 border-blue-300' : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-800">
                        <input
                          type="checkbox"
                          checked={customPart1Enabled}
                          onChange={(e) => {
                            const nextVal = e.target.checked;
                            if (!nextVal && !customPart2Enabled && !customPart3Enabled) return;
                            if (nextVal && [customPart1Enabled, customPart2Enabled, customPart3Enabled].filter(Boolean).length >= 2) {
                              setSysError('Dạng tùy biến chỉ cho phép chọn 1 hoặc 2 phần!');
                              setTimeout(() => setSysError(''), 4000);
                              return;
                            }
                            setCustomPart1Enabled(nextVal);
                          }}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        Phần I: Nhiều PA
                      </label>
                    </div>
                    {customPart1Enabled && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-gray-500">Số câu:</span>
                        <input
                          type="number"
                          min="1"
                          max="40"
                          value={customPart1Count}
                          onChange={(e) => setCustomPart1Count(e.target.value)}
                          className="w-16 px-2 py-1 border border-blue-300 rounded-lg text-center text-xs font-bold text-blue-900 bg-white"
                        />
                      </div>
                    )}
                  </div>

                  {/* P2 */}
                  <div className={`p-3 rounded-xl border transition-all ${
                    customPart2Enabled ? 'bg-indigo-50/70 border-indigo-300' : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-800">
                        <input
                          type="checkbox"
                          checked={customPart2Enabled}
                          onChange={(e) => {
                            const nextVal = e.target.checked;
                            if (!nextVal && !customPart1Enabled && !customPart3Enabled) return;
                            if (nextVal && [customPart1Enabled, customPart2Enabled, customPart3Enabled].filter(Boolean).length >= 2) {
                              setSysError('Dạng tùy biến chỉ cho phép chọn 1 hoặc 2 phần!');
                              setTimeout(() => setSysError(''), 4000);
                              return;
                            }
                            setCustomPart2Enabled(nextVal);
                          }}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        Phần II: Đúng/Sai
                      </label>
                    </div>
                    {customPart2Enabled && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-gray-500">Số câu:</span>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={customPart2Count}
                          onChange={(e) => setCustomPart2Count(e.target.value)}
                          className="w-16 px-2 py-1 border border-indigo-300 rounded-lg text-center text-xs font-bold text-indigo-900 bg-white"
                        />
                      </div>
                    )}
                  </div>

                  {/* P3 */}
                  <div className={`p-3 rounded-xl border transition-all ${
                    customPart3Enabled ? 'bg-purple-50/70 border-purple-300' : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-800">
                        <input
                          type="checkbox"
                          checked={customPart3Enabled}
                          onChange={(e) => {
                            const nextVal = e.target.checked;
                            if (!nextVal && !customPart1Enabled && !customPart2Enabled) return;
                            if (nextVal && [customPart1Enabled, customPart2Enabled, customPart3Enabled].filter(Boolean).length >= 2) {
                              setSysError('Dạng tùy biến chỉ cho phép chọn 1 hoặc 2 phần!');
                              setTimeout(() => setSysError(''), 4000);
                              return;
                            }
                            setCustomPart3Enabled(nextVal);
                          }}
                          className="w-4 h-4 text-purple-600 rounded"
                        />
                        Phần III: Trả lời ngắn
                      </label>
                    </div>
                    {customPart3Enabled && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-gray-500">Số câu:</span>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={customPart3Count}
                          onChange={(e) => setCustomPart3Count(e.target.value)}
                          className="w-16 px-2 py-1 border border-purple-300 rounded-lg text-center text-xs font-bold text-purple-900 bg-white"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 3. Dành cho Tự luận */}
            {examFormat === 'essay' && (
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-amber-950">Số bài toán tự luận:</div>
                  <div className="text-[11px] text-gray-500">Có barem biểu điểm & hướng dẫn chấm từng bước</div>
                </div>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={essayCount}
                  onChange={(e) => setEssayCount(e.target.value)}
                  className="w-20 px-3 py-1.5 border border-amber-300 rounded-lg text-center text-sm font-bold text-amber-900 bg-white"
                />
              </div>
            )}

            {/* 4. Dành cho Tổng hợp */}
            {examFormat === 'mixed' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-purple-950">Số câu trắc nghiệm:</div>
                    <div className="text-[11px] text-gray-500">Trắc nghiệm 4 lựa chọn</div>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={mcqCount}
                    onChange={(e) => setMcqCount(e.target.value)}
                    className="w-20 px-3 py-1.5 border border-purple-300 rounded-lg text-center text-sm font-bold text-purple-900 bg-white"
                  />
                </div>

                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-amber-950">Số câu tự luận:</div>
                    <div className="text-[11px] text-gray-500">Bài toán trình bày lời giải</div>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={essayCount}
                    onChange={(e) => setEssayCount(e.target.value)}
                    className="w-20 px-3 py-1.5 border border-amber-300 rounded-lg text-center text-sm font-bold text-amber-900 bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* PHẦN VI: THÔNG TIN CƠ BẢN CỦA ĐỀ KIỂM TRA                     */}
          {/* ============================================================ */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-4">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700">
              Thông tin cơ bản đề kiểm tra
            </label>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Tên đề kiểm tra *</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="VD: Đề kiểm tra 1 tiết chương 1 hình học"
                className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Thời gian (phút) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Khối lớp *</label>
                <select
                  value={newGrade}
                  onChange={(e) => setNewGrade(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium bg-white"
                >
                  <option value="6">Khối 6</option>
                  <option value="7">Khối 7</option>
                  <option value="8">Khối 8</option>
                  <option value="9">Khối 9</option>
                  <option value="10">Khối 10</option>
                  <option value="11">Khối 11</option>
                  <option value="12">Khối 12</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Chủ đề / Chương</label>
                <select
                  value={newTopicId}
                  onChange={(e) => setNewTopicId(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium bg-white"
                >
                  <option value="">-- Chọn chủ đề thuộc khối {newGrade} --</option>
                  {topics.filter(t => t.grade === parseInt(newGrade, 10)).map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* PHẦN VII: TẠO NHIỀU MÃ ĐỀ THI (MULTI-VARIANT)                 */}
          {/* ============================================================ */}
          <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="createMultiVariant"
                  checked={createMultiVariant}
                  onChange={(e) => setCreateMultiVariant(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
                <label htmlFor="createMultiVariant" className="text-sm font-bold text-indigo-950 cursor-pointer flex items-center gap-1.5">
                  <Layers size={16} className="text-indigo-600" />
                  Tạo nhiều mã đề thi (Đổi số liệu hoặc Đảo câu hỏi)
                </label>
              </div>
              {createMultiVariant && (
                <span className="text-[11px] font-extrabold bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full">
                  Bật
                </span>
              )}
            </div>

            {createMultiVariant && (
              <div className="space-y-3 pt-2 border-t border-indigo-200/60">
                <div>
                  <label className="block text-xs font-bold text-indigo-900 mb-1.5">
                    Phương thức sinh mã đề:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCreateVariantMethod('isomorphic')}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all flex flex-col gap-1 ${
                        createVariantMethod === 'isomorphic'
                          ? 'bg-amber-50/90 border-amber-400 text-amber-950 shadow-2xs'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="font-bold flex items-center gap-1.5 text-amber-900">
                        <Sparkles size={13} className="text-amber-600" />
                        Đổi số liệu (Mã đề tương tự)
                      </span>
                      <span className="text-[11px] text-gray-500">
                        Giữ nguyên dạng bài & cấu trúc, AI đổi số liệu và tự tính lại đáp án
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCreateVariantMethod('shuffle')}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all flex flex-col gap-1 ${
                        createVariantMethod === 'shuffle'
                          ? 'bg-indigo-50/90 border-indigo-400 text-indigo-950 shadow-2xs'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="font-bold flex items-center gap-1.5 text-indigo-900">
                        <Shuffle size={13} className="text-indigo-600" />
                        Đảo câu hỏi & phương án
                      </span>
                      <span className="text-[11px] text-gray-500">
                        Giữ nguyên 100% nội dung, chỉ xáo trộn thứ tự câu và đáp án A, B, C, D
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-indigo-900 mb-1">
                    Các mã đề cần sinh (phân cách bởi dấu phẩy):
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={customVariantCodes}
                      onChange={(e) => setCustomVariantCodes(e.target.value)}
                      placeholder="101, 102, 103, 104"
                      className="flex-1 px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-sm text-indigo-900 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setCustomVariantCodes('101, 102, 103, 104')}
                      className="text-xs font-bold px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-indigo-700 hover:bg-indigo-50"
                    >
                      4 mã
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomVariantCodes('201, 202, 203, 204, 205, 206')}
                      className="text-xs font-bold px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-indigo-700 hover:bg-indigo-50"
                    >
                      6 mã
                    </button>
                  </div>
                </div>

                {createVariantMethod === 'shuffle' && (
                  <div className="flex flex-wrap gap-4 pt-1">
                    <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shuffleQuestions}
                        onChange={(e) => setShuffleQuestions(e.target.checked)}
                        className="w-3.5 h-3.5 text-indigo-600 rounded border-gray-300"
                      />
                      <span>Xáo trộn thứ tự câu hỏi</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shuffleOptions}
                        onChange={(e) => setShuffleOptions(e.target.checked)}
                        className="w-3.5 h-3.5 text-indigo-600 rounded border-gray-300"
                      />
                      <span>Xáo trộn thứ tự đáp án A, B, C, D</span>
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="pt-4 flex gap-3 justify-end border-t border-gray-100 sticky bottom-0 bg-white py-3">
            <button 
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className={`px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-colors shadow-2xs ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Đóng
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className={`px-6 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition-all shadow-md shadow-blue-200 flex items-center gap-2 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Đang xử lý tạo đề...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  {editingTestId ? 'Lưu thay đổi' : 'Xác nhận tạo đề online'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
