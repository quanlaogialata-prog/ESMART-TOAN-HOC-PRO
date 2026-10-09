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
  AlertCircle,
  Wand2,
  Scissors,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Loader2,
  CheckSquare,
  Square,
  BookMarked,
  BookOpenCheck,
  HelpCircle,
  Edit3,
  FileCode,
  CheckCircle,
  RefreshCw,
  Copy,
  Pencil
} from 'lucide-react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import MathText from '../MathText';
import MathRadicalInput from '../common/MathRadicalInput';
import { repairVietnameseDocument, convertTcvn3ToUnicode, healMathSvg } from '../../lib/vietnameseFont';
import EditQuestionsModal from './EditQuestionsModal';
import { QuestionItem, QuestionType } from '../../types/test';
import DocumentReferenceSelectorModal, { SelectedDocumentReference } from './DocumentReferenceSelectorModal';
import { dataUrlToFile, ensureAttachmentDataUrl } from '../../lib/fileUtils';
import { autoReconcileQuestion, checkMcqAnswer } from '../../utils/gradeEngine';
import { getCurrentSchoolYear, formatSchoolYear, getStandardSchoolYears, matchesSchoolYear } from '../../utils/schoolYear';

interface CreateOnlineTestModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent, customQuestions?: QuestionItem[]) => void;
  onSaveBatchTests?: (tests: any[], targetGrade: number, targetTopicId: string) => Promise<void>;
  editingTestId: string | null;
  selectedReference?: SelectedDocumentReference | null;
  setSelectedReference?: (ref: SelectedDocumentReference | null) => void;
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
  newSchoolYear?: string;
  setNewSchoolYear?: (sy: string) => void;
  topics: Array<{ id: string; name: string; grade: number; schoolYear?: string }>;
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
  referenceFile?: File | null;
  setReferenceFile?: (f: File | null) => void;
  referenceNotes?: string;
  setReferenceNotes?: (n: string) => void;
  lessons?: any[];
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
  selectedReference,
  setSelectedReference,
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
  newSchoolYear = getCurrentSchoolYear(),
  setNewSchoolYear = () => {},
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
  referenceFile = null,
  setReferenceFile = () => {},
  referenceNotes = '',
  setReferenceNotes = () => {},
  lessons = [],
  isSaving,
  sysError,
  setSysError,
  sysMsg,
  onSaveBatchTests,
}) => {
  // Tham chiếu Thư viện tài liệu
  const [showRefSelectorModal, setShowRefSelectorModal] = React.useState(false);
  const [localRef, setLocalRef] = React.useState<SelectedDocumentReference | null>(null);
  // Khi ở chế độ 'upload' (Tạo đề từ đề tải lên), không sử dụng tham chiếu tài liệu thư viện
  const activeRef = onlineCreationMode === 'upload' ? null : (selectedReference !== undefined ? selectedReference : localRef);
  const setActiveRef = setSelectedReference || setLocalRef;

  // Trạng thái cho tính năng: Tải lên tài liệu đề thi đơn lẻ -> Trích xuất câu hỏi và hiển thị ngay giao diện chỉnh sửa
  const [singleUploadedQuestions, setSingleUploadedQuestions] = React.useState<QuestionItem[]>([]);
  const [isExtractingSingleFile, setIsExtractingSingleFile] = React.useState(false);
  const [singleExtractError, setSingleExtractError] = React.useState('');
  const [showEditSingleQuestionsModal, setShowEditSingleQuestionsModal] = React.useState(false);
  const [showReviewSingleQuestions, setShowReviewSingleQuestions] = React.useState(true);

  // Tự động trích xuất câu hỏi từ tệp đề bài tải lên để hiện ngay giao diện chỉnh sửa
  const handleExtractSingleFileQuestions = async (fileToExtract?: File) => {
    const targetFile = fileToExtract || newFile;
    if (!targetFile) return;
    setIsExtractingSingleFile(true);
    setSingleExtractError('');
    try {
      const fileDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(targetFile);
      });

      const apiKey = localStorage.getItem('gemini_api_key') || localStorage.getItem('custom_gemini_api_key') || '';
      const res = await fetch('/api/extract-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-gemini-api-key': apiKey } : {})
        },
        body: JSON.stringify({
          fileDataUrl,
          fileName: targetFile.name,
          mimeType: targetFile.type,
          extractedText: activeRef?.knowledge ? repairVietnameseDocument(convertTcvn3ToUnicode(activeRef.knowledge)) : undefined
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.details || errJson.error || `Lỗi trích xuất câu hỏi (${res.status})`);
      }

      const rawExtracted = await res.json();
      if (Array.isArray(rawExtracted) && rawExtracted.length > 0) {
        const extracted = rawExtracted.map((rawQ: any) => {
          const healedQ = autoReconcileQuestion(rawQ).question;
          return {
            ...healedQ,
            question: repairVietnameseDocument(convertTcvn3ToUnicode(healedQ.question || '')),
            options: Array.isArray(healedQ.options) 
              ? healedQ.options.map((opt: string) => repairVietnameseDocument(convertTcvn3ToUnicode(opt || ''))) 
              : [],
            explanation: repairVietnameseDocument(convertTcvn3ToUnicode(healedQ.explanation || '')),
            correctAnswer: typeof healedQ.correctAnswer === 'string' ? repairVietnameseDocument(healedQ.correctAnswer) : healedQ.correctAnswer,
            figureSvg: healedQ.figureSvg ? healMathSvg(healedQ.figureSvg) : healedQ.figureSvg
          };
        });
        setSingleUploadedQuestions(extracted);
        if (!newTitle.trim()) {
          const cleanName = repairVietnameseDocument(convertTcvn3ToUnicode(targetFile.name.replace(/\.[^/.]+$/, "")));
          setNewTitle(cleanName);
        }
      } else {
        throw new Error("Không phát hiện được câu hỏi nào từ tệp. Bạn có thể kiểm tra lại định dạng tệp hoặc nhập thủ công.");
      }
    } catch (err: any) {
      console.error("Single file extract error:", err);
      setSingleExtractError(err.message || "Lỗi khi trích xuất câu hỏi từ tài liệu");
    } finally {
      setIsExtractingSingleFile(false);
    }
  };

  const handleExtractFromRefKnowledge = async () => {
    if (!activeRef?.knowledge) return;
    setIsExtractingSingleFile(true);
    setSingleExtractError(null);
    try {
      const apiKey = localStorage.getItem('gemini_api_key') || localStorage.getItem('custom_gemini_api_key') || '';
      const res = await fetch('/api/extract-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-gemini-api-key': apiKey } : {})
        },
        body: JSON.stringify({
          extractedText: activeRef.knowledge,
          fileName: activeRef.lessonTitle || 'Tài liệu thư viện'
        })
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.details || errJson.error || `Lỗi trích xuất câu hỏi (${res.status})`);
      }
      const rawExtracted = await res.json();
      if (Array.isArray(rawExtracted) && rawExtracted.length > 0) {
        const extracted = rawExtracted.map((rawQ: any) => {
          const healedQ = autoReconcileQuestion(rawQ).question;
          return {
            ...healedQ,
            question: repairVietnameseDocument(convertTcvn3ToUnicode(healedQ.question || '')),
            options: Array.isArray(healedQ.options) 
              ? healedQ.options.map((opt: string) => repairVietnameseDocument(convertTcvn3ToUnicode(opt || ''))) 
              : [],
            explanation: repairVietnameseDocument(convertTcvn3ToUnicode(healedQ.explanation || '')),
            correctAnswer: typeof healedQ.correctAnswer === 'string' ? repairVietnameseDocument(healedQ.correctAnswer) : healedQ.correctAnswer,
            figureSvg: healedQ.figureSvg ? healMathSvg(healedQ.figureSvg) : healedQ.figureSvg
          };
        });
        setSingleUploadedQuestions(extracted);
        setOnlineCreationMode('upload');
      } else {
        throw new Error("Không bóc tách được câu hỏi từ văn bản này.");
      }
    } catch (err: any) {
      console.error("Extract from reference knowledge error:", err);
      setSingleExtractError(err.message || "Lỗi khi trích xuất câu hỏi từ tài liệu");
    } finally {
      setIsExtractingSingleFile(false);
    }
  };

  const handleAddQuestionToSingle = () => {
    const newQ: QuestionItem = {
      id: `q-${Date.now()}`,
      type: 'mcq',
      question: 'Nhập nội dung câu hỏi mới vào đây...',
      options: ['A. Lựa chọn 1', 'B. Lựa chọn 2', 'C. Lựa chọn 3', 'D. Lựa chọn 4'],
      correctAnswer: 'A',
      points: 0.25,
      explanation: 'Lời giải chi tiết...'
    };
    setSingleUploadedQuestions(prev => [...prev, newQ]);
  };

  const handleUpdateSingleQuestion = (index: number, updatedFields: Partial<QuestionItem>) => {
    setSingleUploadedQuestions(prev => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = { ...copy[index], ...updatedFields };
      }
      return copy;
    });
  };

  const handleDeleteSingleQuestion = (index: number) => {
    setSingleUploadedQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleDuplicateSingleQuestion = (index: number) => {
    setSingleUploadedQuestions(prev => {
      const copy = [...prev];
      const target = copy[index];
      if (target) {
        const duplicated: QuestionItem = {
          ...target,
          id: `q-${Date.now()}`,
          question: `${target.question} (Bản sao)`
        };
        copy.splice(index + 1, 0, duplicated);
      }
      return copy;
    });
  };

  // Đặt lại giao diện mặc định, xóa toàn bộ trạng thái tạm thời khi đóng modal
  const resetUploadAndSeparatedState = () => {
    if (setLocalRef) setLocalRef(null);
    if (setSelectedReference) setSelectedReference(null);
    if (setReferenceFile) setReferenceFile(null);
    if (setReferenceNotes) setReferenceNotes('');
    try {
      delete (window as any).__pendingTestReference;
      sessionStorage.removeItem('pendingTestReference');
    } catch (e) {
      // ignore
    }
    setNewFile(null);
    setNewAnswerFile(null);
    setSplitAnswers(false);
    setSingleUploadedQuestions([]);
    setSingleExtractError('');
  };

  const handleModalClose = () => {
    resetUploadAndSeparatedState();
    onClose();
  };

  const handleFormSubmitInternal = (e: React.FormEvent) => {
    if (!newTitle.trim()) {
      const fallbackTitle = newFile?.name 
        ? newFile.name.replace(/\.[^/.]+$/, "") 
        : `Đề kiểm tra Toán lớp ${newGrade}`;
      setNewTitle(fallbackTitle);
    }
    onSubmit(e, singleUploadedQuestions.length > 0 ? singleUploadedQuestions : undefined);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto" onClick={handleModalClose}>
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] my-auto border border-gray-100" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-gray-100 bg-gray-50/90 shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={handleModalClose} 
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
            onClick={handleModalClose} 
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-200/60 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleFormSubmitInternal} className="p-5 sm:p-6 space-y-6 overflow-y-auto">
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
          {/* PHẦN THAM CHIẾU THƯ VIỆN TÀI LIỆU (REFERENCE LIBRARY)        */}
          {/* Chỉ hiển thị cho Tạo đề tự động hoặc Ma trận, KHÔNG hiển thị trong Tạo đề từ đề tải lên */}
          {/* ============================================================ */}
          {onlineCreationMode !== 'upload' && (
            <div className="p-4 rounded-2xl border-2 transition-all shadow-2xs bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white border-blue-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs shrink-0">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-gray-900">
                        Tài liệu tham chiếu từ Thư viện
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        Chuẩn kiến thức & ma trận
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {activeRef 
                        ? 'Đề thi đang được liên kết tham chiếu với tài liệu trong Thư viện.' 
                        : 'Chọn tài liệu, chuyên đề hoặc bài học trong Thư viện để làm căn cứ tham chiếu hoặc lấy đề bài gốc.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setShowRefSelectorModal(true)}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <BookOpen size={14} />
                    <span>{activeRef ? 'Đổi tài liệu khác' : 'Chọn từ Thư viện tài liệu'}</span>
                  </button>
                  {activeRef && (
                    <button
                      type="button"
                      onClick={() => setActiveRef(null)}
                      className="px-2.5 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      title="Hủy liên kết tài liệu tham chiếu"
                    >
                      Hủy
                    </button>
                  )}
                </div>
              </div>

              {/* Chi tiết tài liệu tham chiếu đã chọn */}
              {activeRef && (
                <div className="mt-3 pt-3 border-t border-blue-100 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white rounded-xl border border-blue-200 shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-gray-900 truncate">
                            {activeRef.lessonTitle}
                          </span>
                          <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.2 rounded-md font-semibold shrink-0">
                            {activeRef.topicName} (Khối {activeRef.grade})
                          </span>
                        </div>
                        {activeRef.attachment?.name && (
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            📎 Tệp đính kèm: <strong>{activeRef.attachment.name}</strong>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Nút nạp tệp tài liệu này làm đề thi để trích xuất */}
                      {activeRef.attachment?.dataUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              const file = dataUrlToFile(
                                activeRef.attachment!.dataUrl!, 
                                activeRef.attachment!.name, 
                                activeRef.attachment!.type
                              );
                              setNewFile(file);
                              setOnlineCreationMode('upload');
                              handleExtractSingleFileQuestions(file);
                            } catch (err) {
                              console.error("Error loading file from reference:", err);
                            }
                          }}
                          className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                          title="Nạp tệp này làm đề thi và trích xuất câu hỏi ngay lập tức"
                        >
                          <Sparkles size={13} />
                          <span>Nạp tệp làm đề & Trích xuất câu hỏi</span>
                        </button>
                      )}

                      {/* Nút bóc tách câu hỏi từ nội dung văn bản học liệu trong thư viện */}
                      {activeRef.knowledge && (
                        <button
                          type="button"
                          onClick={handleExtractFromRefKnowledge}
                          disabled={isExtractingSingleFile}
                          className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                          title="Bóc tách câu hỏi và đáp án trực tiếp từ nội dung văn bản của tài liệu thư viện này"
                        >
                          <Sparkles size={13} />
                          <span>Trích xuất đề từ nội dung tài liệu</span>
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* PHẦN I: 4 HÌNH THỨC ĐỀ THI                                    */}
          {/* ============================================================ */}
          {onlineCreationMode !== 'upload' && (
            <>
              <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold">1</span>
                    Hình thức đề thi
                  </label>
                  <span className="text-xs text-gray-500">
                    Áp dụng cho: <strong>{onlineCreationMode === 'auto' ? 'Tạo tự động' : 'Ma trận có sẵn'}</strong>
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
            </>
          )}

          {/* ============================================================ */}
          {/* PHẦN IV: CẤU HÌNH THEO TỪNG PHƯƠNG THỨC                        */}
          {/* ============================================================ */}
          {/* 1. Nếu là phương thức 'auto' (Tạo đề thi tự động) */}
          {onlineCreationMode === 'auto' && (
            <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/30 to-blue-50/50 p-4 rounded-xl border border-blue-200/80 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-blue-950 uppercase tracking-wide flex items-center gap-1.5">
                  <BookOpenCheck size={16} className="text-blue-600" />
                  Nguồn kiến thức & Tài liệu tham chiếu
                </label>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                  referenceFile ? 'bg-indigo-100 text-indigo-800' : 'bg-blue-100/90 text-blue-800'
                }`}>
                  {referenceFile ? 'Đã tải tài liệu bổ sung' : 'Mặc định: SGK Kết nối tri thức'}
                </span>
              </div>

              {/* HỘP THÔNG TIN: MẶC ĐỊNH HOẶC TÀI LIỆU BỔ SUNG */}
              {!referenceFile ? (
                <div className="bg-white/95 p-3.5 rounded-xl border border-blue-200/80 space-y-2.5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                      <BookMarked size={18} />
                    </div>
                    <div className="flex-1 text-xs">
                      <div className="flex items-center gap-2 font-bold text-blue-950">
                        <span>Áp dụng nguồn tài liệu chuẩn mực mặc định</span>
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full">
                          Tự động chọn
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                        Do Thầy/Cô chưa tải lên tài liệu bổ sung, hệ thống sẽ tự động bám sát nguồn học liệu chuẩn theo:
                      </p>
                      <ul className="mt-2 space-y-1.5 text-[11px]">
                        <li className="flex items-start gap-2 text-blue-950 font-medium">
                          <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                          <span>
                            <strong>Sách giáo khoa Kết nối tri thức với cuộc sống</strong> (Môn Toán lớp {newGrade || 9})
                          </span>
                        </li>
                        <li className="flex items-start gap-2 text-blue-950 font-medium">
                          <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                          <span>
                            Tài liệu & bài học trong chủ đề: <strong>{(() => {
                              const tObj = topics.find(t => t.id === newTopicId);
                              return tObj ? ((tObj as any).title || tObj.name) : 'Chủ đề đã chọn';
                            })()}</strong>
                            {(() => {
                              const tLessons = lessons.filter((l: any) => l.topicId === newTopicId);
                              return tLessons.length > 0 ? (
                                <span className="text-gray-500 font-normal ml-1">
                                  ({tLessons.length} bài học: {tLessons.slice(0, 3).map((l: any) => l.title).join(', ')}{tLessons.length > 3 ? '...' : ''})
                                </span>
                              ) : null;
                            })()}
                          </span>
                        </li>
                        <li className="flex items-start gap-2 text-blue-950 font-medium">
                          <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                          <span>
                            Ngân hàng đề thi chuẩn hóa định dạng mới & các nguồn học liệu chất lượng cao của Bộ GD&ĐT.
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-3.5 rounded-xl border border-indigo-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                        <FileText size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                          <span>{referenceFile.name}</span>
                          <span className="text-[10px] text-gray-400 font-normal">
                            ({(referenceFile.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <p className="text-[11px] text-indigo-700 font-medium mt-0.5">
                          AI sẽ ưu tiên bám sát tài liệu tham chiếu bổ sung này, kết hợp cùng SGK Kết nối tri thức.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReferenceFile(null)}
                      className="px-2.5 py-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 border border-red-100"
                      title="Xóa tệp và trở về mặc định"
                    >
                      <X size={14} />
                      <span>Dùng mặc định</span>
                    </button>
                  </div>
                </div>
              )}

              {/* NÚT TẢI LÊN TÀI LIỆU THAM CHIẾU BỔ SUNG */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 hover:border-blue-400 rounded-xl text-xs font-bold shadow-2xs transition-all">
                  <Upload size={14} className="text-blue-600" />
                  <span>{referenceFile ? 'Thay đổi tài liệu tham chiếu' : 'Tải lên tài liệu tham chiếu bổ sung (Tùy chọn)'}</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setReferenceFile(e.target.files[0]);
                      }
                    }}
                  />
                </label>

                <span className="text-[11px] text-gray-500 italic">
                  Hỗ trợ tệp PDF, Word (.docx), TXT, Excel, Ảnh...
                </span>
              </div>

              {/* GHI CHÚ TRỌNG TÂM KIẾN THỨC BỔ SUNG */}
              <div className="pt-0.5">
                <input
                  type="text"
                  value={referenceNotes}
                  onChange={(e) => setReferenceNotes(e.target.value)}
                  placeholder="Ghi chú thêm cho AI (ví dụ: Tập trung vào đạo hàm, đồ thị hàm số và bài toán thực tế)..."
                  className="w-full px-3 py-2 text-xs border border-blue-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-400"
                />
              </div>
            </div>
          )}

          {/* 2. Nếu là phương thức 'matrix' (Tạo đề theo ma trận) */}
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

              {/* NGUỒN KIẾN THỨC & TÀI LIỆU THAM CHIẾU BỔ SUNG CHO MA TRẬN */}
              <div className="bg-gradient-to-br from-emerald-50/70 via-teal-50/30 to-emerald-50/50 p-3.5 rounded-xl border border-emerald-200/80 space-y-3 shadow-2xs mt-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <label className="text-xs font-bold text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
                    <BookOpenCheck size={16} className="text-emerald-600 shrink-0" />
                    Nguồn tài liệu tham chiếu bổ sung cho đề theo ma trận
                  </label>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 w-fit ${
                    referenceFile ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-100/90 text-teal-800'
                  }`}>
                    {referenceFile ? 'Đã tải tài liệu tham chiếu bổ sung' : 'Mặc định: SGK Kết nối tri thức & Học liệu chủ đề'}
                  </span>
                </div>

                {/* HỘP THÔNG TIN: MẶC ĐỊNH HOẶC TÀI LIỆU BỔ SUNG */}
                {!referenceFile ? (
                  <div className="bg-white/95 p-3 rounded-xl border border-emerald-200/80 space-y-2">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <BookMarked size={16} />
                      </div>
                      <div className="flex-1 text-xs">
                        <div className="flex items-center gap-2 font-bold text-emerald-950">
                          <span>Áp dụng nguồn tài liệu chuẩn mực mặc định</span>
                          <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full">
                            Tự động chọn
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                          Do Thầy/Cô chưa tải lên tài liệu bổ sung, hệ thống sẽ kết hợp khung ma trận này cùng nguồn học liệu chuẩn:
                        </p>
                        <ul className="mt-1.5 space-y-1 text-[11px]">
                          <li className="flex items-start gap-2 text-emerald-950 font-medium">
                            <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                            <span>
                              <strong>Sách giáo khoa Kết nối tri thức với cuộc sống</strong> (Môn Toán lớp {newGrade || 9})
                            </span>
                          </li>
                          <li className="flex items-start gap-2 text-emerald-950 font-medium">
                            <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                            <span>
                              Tài liệu & bài học trong chủ đề: <strong>{(() => {
                                const tObj = topics.find(t => t.id === newTopicId);
                                return tObj ? ((tObj as any).title || tObj.name) : 'Chủ đề đã chọn';
                              })()}</strong>
                              {(() => {
                                const tLessons = lessons.filter((l: any) => l.topicId === newTopicId);
                                return tLessons.length > 0 ? (
                                  <span className="text-gray-500 font-normal ml-1">
                                    ({tLessons.length} bài học: {tLessons.slice(0, 3).map((l: any) => l.title).join(', ')}{tLessons.length > 3 ? '...' : ''})
                                  </span>
                                ) : null;
                              })()}
                            </span>
                          </li>
                          <li className="flex items-start gap-2 text-emerald-950 font-medium">
                            <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                            <span>
                              Ngân hàng câu hỏi chuẩn hóa định dạng mới & các nguồn học liệu chất lượng cao của Bộ GD&ĐT.
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <FileText size={16} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                            <span>{referenceFile.name}</span>
                            <span className="text-[10px] text-gray-400 font-normal">
                              ({(referenceFile.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                            AI sẽ tạo đề theo tỷ lệ ma trận, ưu tiên bám sát các dạng bài và kiến thức trong tài liệu tham chiếu bổ sung này.
                          </p>
                        </div>
                      </div>
                      {setReferenceFile && (
                        <button
                          type="button"
                          onClick={() => setReferenceFile(null)}
                          className="px-2.5 py-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 border border-red-100"
                          title="Xóa tệp và trở về mặc định"
                        >
                          <X size={14} />
                          <span>Dùng mặc định</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* NÚT TẢI LÊN TÀI LIỆU THAM CHIẾU BỔ SUNG */}
                {setReferenceFile && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
                    <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 hover:border-emerald-400 rounded-xl text-xs font-bold shadow-2xs transition-all">
                      <Upload size={14} className="text-emerald-600" />
                      <span>{referenceFile ? 'Thay đổi tài liệu tham chiếu bổ sung' : 'Tải lên tài liệu tham chiếu bổ sung (Tùy chọn)'}</span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.png,.jpg,.jpeg"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setReferenceFile(e.target.files[0]);
                          }
                        }}
                      />
                    </label>

                    <span className="text-[11px] text-gray-500 italic">
                      Hỗ trợ tệp PDF, Word (.docx), TXT, Excel, Ảnh...
                    </span>
                  </div>
                )}

                {/* GHI CHÚ TRỌNG TÂM KIẾN THỨC BỔ SUNG */}
                {setReferenceNotes && (
                  <div>
                    <input
                      type="text"
                      value={referenceNotes || ''}
                      onChange={(e) => setReferenceNotes(e.target.value)}
                      placeholder="Ghi chú thêm cho AI biên soạn theo ma trận (ví dụ: Tập trung vào bài toán thực tế, bài tập hình học...)..."
                      className="w-full px-3 py-2 text-xs border border-emerald-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-gray-400"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. Nếu là phương thức 'upload' (Tạo đề từ đề tải lên) */}
          {onlineCreationMode === 'upload' && (
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-200 space-y-4">
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
                  onChange={(e) => {
                    const file = e.target.files ? e.target.files[0] : null;
                    setNewFile(file);
                    setSingleUploadedQuestions([]);
                    setSingleExtractError('');
                    if (file) {
                      // Tự động đọc và bóc tách câu hỏi ngay lập tức để hiện giao diện chỉnh sửa!
                      setTimeout(() => {
                        handleExtractSingleFileQuestions(file);
                      }, 100);
                    }
                  }}
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
                      Tệp này chứa CẢ ĐỀ BÀI VÀ ĐÁP ÁN (AI tự động bóc tách thành 2 phần cho 1 đề)
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

                  <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-200/90 text-xs text-indigo-950 flex items-start gap-2.5 shadow-2xs">
                    <CheckCircle2 size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-indigo-950">
                        <span>Hình thức đề thi & Cấu trúc số câu: Lấy theo đề gốc</span>
                        <span className="text-[10px] bg-indigo-200 text-indigo-900 font-extrabold px-1.5 py-0.2 rounded">Tự động nhận diện</span>
                      </div>
                      <p className="text-[11px] text-indigo-800/80 leading-relaxed">
                        Hệ thống sẽ giữ nguyên vẹn 100% hình thức đề và cấu trúc số câu của đề gốc đã tải lên (Trắc nghiệm nhiều lựa chọn, Đúng/Sai, Trả lời ngắn, Tự luận) cùng đáp án và lời giải chi tiết.
                      </p>
                    </div>
                  </div>

                  {/* TRẠNG THÁI TRÍCH XUẤT CÂU HỎI CHO TỆP ĐƠN LẺ */}
                  {isExtractingSingleFile && (
                    <div className="p-4 bg-linear-to-r from-indigo-50 via-purple-50 to-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between gap-3 text-xs text-indigo-950 animate-pulse shadow-2xs">
                      <div className="flex items-center gap-3">
                        <Loader2 size={20} className="animate-spin text-indigo-600 shrink-0" />
                        <div>
                          <p className="font-bold text-sm text-indigo-950">Đang đọc tài liệu "{newFile?.name}" và trích xuất câu hỏi...</p>
                          <p className="text-[11px] text-indigo-700">Hệ thống đang tự động bóc tách từng câu hỏi, công thức KaTeX, đáp án A-B-C-D và lời giải để hiện ngay giao diện chỉnh sửa.</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-indigo-200/80 text-indigo-900 font-bold px-2.5 py-1 rounded-full shrink-0">
                        Đang trích xuất
                      </span>
                    </div>
                  )}

                  {singleExtractError && (
                    <div className="p-3.5 bg-red-50 text-red-700 rounded-xl text-xs font-medium border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={16} className="shrink-0 text-red-600" />
                        <span>{singleExtractError}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleExtractSingleFileQuestions()}
                          className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded-lg transition-colors text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw size={13} />
                          <span>Thử lại</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleAddQuestionToSingle}
                          className="px-3 py-1 bg-white hover:bg-red-50 text-red-700 border border-red-200 font-bold rounded-lg transition-colors text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={13} />
                          <span>Thêm câu thủ công</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {newFile && !isExtractingSingleFile && singleUploadedQuestions.length === 0 && !singleExtractError && (
                    <div className="p-4 bg-white border border-dashed border-indigo-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-2xs">
                      <div className="flex items-center gap-2.5 text-gray-700">
                        <FileCode size={20} className="text-indigo-600 shrink-0" />
                        <div>
                          <p className="font-bold text-gray-900">Tệp đã chọn: {newFile.name}</p>
                          <p className="text-[11px] text-gray-500">{(newFile.size / 1024).toFixed(1)} KB • Bấm nút bên cạnh để mở giao diện chỉnh sửa câu hỏi</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleExtractSingleFileQuestions()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer"
                      >
                        <Sparkles size={14} />
                        <span>Trích xuất & Mở giao diện sửa</span>
                      </button>
                    </div>
                  )}

                  {/* GIAO DIỆN CHỈNH SỬA CÂU HỎI TRỰC QUAN TOÀN DIỆN SAU KHI TẢI LÊN TÀI LIỆU */}
                  {singleUploadedQuestions.length > 0 && (
                    <div className="space-y-3.5 pt-1">
                      {/* Thanh tiêu đề thống kê & nút mở Studio sửa câu hỏi */}
                      <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="font-bold text-xs text-gray-900">
                              Đã trích xuất {singleUploadedQuestions.length} câu hỏi từ tài liệu "{newFile?.name}"
                            </span>
                          </div>
                          
                          {/* Phân loại các dạng câu */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px]">
                            {singleUploadedQuestions.filter(q => q.type === 'mcq').length > 0 && (
                              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-semibold border border-blue-200">
                                {singleUploadedQuestions.filter(q => q.type === 'mcq').length} TN 4 lựa chọn
                              </span>
                            )}
                            {singleUploadedQuestions.filter(q => q.type === 'tf').length > 0 && (
                              <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-semibold border border-purple-200">
                                {singleUploadedQuestions.filter(q => q.type === 'tf').length} Đúng/Sai
                              </span>
                            )}
                            {singleUploadedQuestions.filter(q => q.type === 'short').length > 0 && (
                              <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 font-semibold border border-teal-200">
                                {singleUploadedQuestions.filter(q => q.type === 'short').length} Trả lời ngắn
                              </span>
                            )}
                            {singleUploadedQuestions.filter(q => q.type === 'essay').length > 0 && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                                {singleUploadedQuestions.filter(q => q.type === 'essay').length} Tự luận
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Nút mở Modal Chuyên sâu & Nút Thêm câu mới */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setShowEditSingleQuestionsModal(true)}
                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Mở giao diện chỉnh sửa chuyên sâu toàn màn hình: Sửa công thức KaTeX, hình vẽ SVG đồ thị Oxy, đáp án và biểu điểm"
                          >
                            <Sparkles size={14} />
                            <span>Mở bảng sửa chuyên sâu</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleAddQuestionToSingle}
                            className="px-3 py-2 bg-white hover:bg-gray-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
                            title="Thêm một câu hỏi mới vào cuối đề"
                          >
                            <Plus size={14} />
                            <span>Thêm câu</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowReviewSingleQuestions(!showReviewSingleQuestions)}
                            className="px-2.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
                            title="Thu gọn hoặc mở rộng danh sách câu hỏi"
                          >
                            {showReviewSingleQuestions ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </button>
                        </div>
                      </div>

                      {/* DANH SÁCH CHI TIẾT CÁC CÂU HỎI TRỰC TIẾP CHO PHÉP XEM & SỬA */}
                      {showReviewSingleQuestions && (
                        <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                          {singleUploadedQuestions.map((q, qIdx) => (
                            <div key={q.id || qIdx} className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs hover:border-indigo-300 transition-all space-y-2.5">
                              {/* Thanh tiêu đề câu hỏi: Thứ tự câu, Chọn loại, Điểm và Nút thao tác */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center border border-indigo-100 shrink-0">
                                    {qIdx + 1}
                                  </span>
                                  
                                  {/* Dropdown đổi loại câu hỏi nhanh */}
                                  <select
                                    value={q.type}
                                    onChange={(e) => handleUpdateSingleQuestion(qIdx, { type: e.target.value as QuestionType })}
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
                                      step="0.1"
                                      min="0.1"
                                      max="10"
                                      value={q.points || (q.type === 'mcq' ? 0.25 : q.type === 'tf' ? 1.0 : q.type === 'short' ? 0.5 : 1.0)}
                                      onChange={(e) => handleUpdateSingleQuestion(qIdx, { points: parseFloat(e.target.value) || 0.25 })}
                                      className="w-10 bg-transparent text-center font-bold text-gray-800 outline-none"
                                    />
                                  </div>
                                </div>

                                {/* Nút thao tác câu hỏi: Nhân đôi, Xóa */}
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleDuplicateSingleQuestion(qIdx)}
                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                    title="Nhân bản câu này"
                                  >
                                    <Copy size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSingleQuestion(qIdx)}
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
                                    onChange={(e) => handleUpdateSingleQuestion(qIdx, { question: e.target.value })}
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
                                              onClick={() => handleUpdateSingleQuestion(qIdx, { correctAnswer: letter })}
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
                                                handleUpdateSingleQuestion(qIdx, { options: newOpts });
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
                                        handleUpdateSingleQuestion(qIdx, { correctAnswer: newAns });
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
                                                  handleUpdateSingleQuestion(qIdx, { options: newOpts });
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
                                      onChange={(val) => handleUpdateSingleQuestion(qIdx, { correctAnswer: val })}
                                      placeholder="Ví dụ: √2, 2√3, √3/2, 12 hoặc -3/4..."
                                    />
                                  ) : (
                                    <input
                                      type="text"
                                      value={q.correctAnswer || ''}
                                      onChange={(e) => handleUpdateSingleQuestion(qIdx, { correctAnswer: e.target.value })}
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
                                  onChange={(e) => handleUpdateSingleQuestion(qIdx, { explanation: e.target.value })}
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
                  )}
            </div>
          )}

          {/* ============================================================ */}
          {/* PHẦN V: CHI TIẾT SỐ CÂU CÁC PHẦN (TÙY CHỈNH)                 */}
          {/* ============================================================ */}
          {onlineCreationMode !== 'upload' && (
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
          )}

          {/* ============================================================ */}
          {/* PHẦN VI: THÔNG TIN CƠ BẢN CỦA ĐỀ KIỂM TRA                     */}
          {/* ============================================================ */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-4">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700">
              Thông tin cơ bản đề kiểm tra
            </label>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Tên đề kiểm tra</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="VD: Đề kiểm tra 1 tiết chương 1 hình học"
                className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Năm học *</label>
                <select
                  value={newSchoolYear}
                  onChange={(e) => setNewSchoolYear(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-blue-900 bg-blue-50/40"
                >
                  {getStandardSchoolYears().map(sy => (
                    <option key={sy} value={sy}>
                      {formatSchoolYear(sy)} {sy === getCurrentSchoolYear() ? '(Hiện tại)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Thời gian (phút) *
                </label>
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
                  {topics.filter(t => t.grade === parseInt(newGrade, 10) && matchesSchoolYear(t.schoolYear, newSchoolYear)).map(t => (
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
              onClick={handleModalClose}
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
                  Đang xử lý lưu đề...
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

      {/* MODAL CHỈNH SỬA CHUYÊN SÂU TOÀN BỘ CÂU HỎI CHO ĐỀ TẢI LÊN */}
      {showEditSingleQuestionsModal && (
        <EditQuestionsModal
          testTitle={newTitle || newFile?.name || 'Đề kiểm tra tải lên'}
          initialQuestions={singleUploadedQuestions}
          isOpen={showEditSingleQuestionsModal}
          onClose={() => setShowEditSingleQuestionsModal(false)}
          onSave={async (updated) => {
            setSingleUploadedQuestions(updated);
            setShowEditSingleQuestionsModal(false);
          }}
        />
      )}

      {/* MODAL CHỌN TÀI LIỆU THAM CHIẾU TỪ THƯ VIỆN */}
      {showRefSelectorModal && (
        <DocumentReferenceSelectorModal
          isOpen={showRefSelectorModal}
          onClose={() => setShowRefSelectorModal(false)}
          initialGrade={parseInt(newGrade, 10) || 9}
          onSelect={async (ref) => {
            setActiveRef(ref);
            if (ref.grade) setNewGrade(ref.grade.toString());
            if (ref.topicId) setNewTopicId(ref.topicId);
            if (!newTitle.trim()) {
              setNewTitle(repairVietnameseDocument(convertTcvn3ToUnicode(ref.lessonTitle || ref.attachment?.name || '')));
            }
            if (ref.knowledge && setReferenceNotes) {
              setReferenceNotes(repairVietnameseDocument(convertTcvn3ToUnicode(ref.knowledge)));
            }
            if (ref.attachment && !ref.attachment.dataUrl) {
              try {
                const resolvedUrl = await ensureAttachmentDataUrl(ref.attachment);
                if (resolvedUrl) ref.attachment.dataUrl = resolvedUrl;
              } catch (err) {
                console.warn('Could not auto-resolve reference attachment dataUrl:', err);
              }
            }
            if (ref.attachment?.dataUrl && ref.attachment?.name) {
              try {
                const autoFile = dataUrlToFile(ref.attachment.dataUrl, ref.attachment.name, ref.attachment.type);
                setNewFile(autoFile);
              } catch (e) {
                console.warn('Could not auto-create file from reference attachment:', e);
              }
            }
          }}
        />
      )}
    </div>
  );
};
