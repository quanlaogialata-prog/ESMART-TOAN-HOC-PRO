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
  Copy
} from 'lucide-react';
import MathText from '../MathText';
import EditQuestionsModal from './EditQuestionsModal';
import { QuestionItem, QuestionType } from '../../types/test';
import DocumentReferenceSelectorModal, { SelectedDocumentReference } from './DocumentReferenceSelectorModal';
import { dataUrlToFile } from '../../lib/fileUtils';

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
  // Trạng thái cho tính năng: Tệp gộp tất cả các bài kiểm tra của chủ đề -> Tách thành các đề online riêng biệt
  const [isTopicCombinedFile, setIsTopicCombinedFile] = React.useState(false);
  const [isSplittingTopic, setIsSplittingTopic] = React.useState(false);
  const [separatedTests, setSeparatedTests] = React.useState<any[]>([]);
  const [expandedTestId, setExpandedTestId] = React.useState<string | null>(null);
  const [splitLocalError, setSplitLocalError] = React.useState('');
  const [splitLocalSuccess, setSplitLocalSuccess] = React.useState('');
  const [isSavingBatchLocal, setIsSavingBatchLocal] = React.useState(false);
  const [isDetectingStructure, setIsDetectingStructure] = React.useState(false);
  const [detectedSummary, setDetectedSummary] = React.useState('');

  // Thông tin bổ sung do giáo viên cung cấp hỗ trợ AI tách đề chính xác: số lượng, tên đề, phạm vi trang của đề và bảng đáp án chung
  const [expectedTestCount, setExpectedTestCount] = React.useState('');
  const [hasInlineAnswers, setHasInlineAnswers] = React.useState(false);
  const [splitTestItems, setSplitTestItems] = React.useState<{ 
    id: string; 
    title: string; 
    fromPage: string; 
    toPage: string; 
    answerFromPage?: string; 
    answerToPage?: string; 
  }[]>([
    { id: '1', title: '', fromPage: '1', toPage: '' }
  ]);
  const [answerFromPage, setAnswerFromPage] = React.useState('');
  const [answerToPage, setAnswerToPage] = React.useState('');
  const [splitNotes, setSplitNotes] = React.useState('');
  const [showSplitHelper, setShowSplitHelper] = React.useState(false);
  const [splitHelperMode, setSplitHelperMode] = React.useState<'table' | 'quick'>('table');
  const [quickInputText, setQuickInputText] = React.useState('');

  // Tham chiếu Thư viện tài liệu
  const [showRefSelectorModal, setShowRefSelectorModal] = React.useState(false);
  const [localRef, setLocalRef] = React.useState<SelectedDocumentReference | null>(null);
  const activeRef = selectedReference !== undefined ? selectedReference : localRef;
  const setActiveRef = setSelectedReference || setLocalRef;

  // Trạng thái cho tính năng: Tải lên tài liệu đề thi đơn lẻ -> Trích xuất câu hỏi và hiển thị ngay giao diện chỉnh sửa
  const [singleUploadedQuestions, setSingleUploadedQuestions] = React.useState<QuestionItem[]>([]);
  const [isExtractingSingleFile, setIsExtractingSingleFile] = React.useState(false);
  const [singleExtractError, setSingleExtractError] = React.useState('');
  const [showEditSingleQuestionsModal, setShowEditSingleQuestionsModal] = React.useState(false);
  const [editingSeparatedTestIndex, setEditingSeparatedTestIndex] = React.useState<number | null>(null);
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
          mimeType: targetFile.type
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.details || errJson.error || `Lỗi trích xuất câu hỏi (${res.status})`);
      }

      const extracted = await res.json();
      if (Array.isArray(extracted) && extracted.length > 0) {
        setSingleUploadedQuestions(extracted);
        if (!newTitle.trim()) {
          const cleanName = targetFile.name.replace(/\.[^/.]+$/, "");
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

  const handleAddSplitItem = () => {
    setSplitTestItems(prev => {
      const last = prev[prev.length - 1];
      let nextFrom = '';
      if (last && last.toPage && !isNaN(Number(last.toPage))) {
        nextFrom = String(Number(last.toPage) + 1);
      }
      return [
        ...prev,
        { id: String(Date.now()), title: '', fromPage: nextFrom, toPage: '' }
      ];
    });
  };

  const handleRemoveSplitItem = (id: string) => {
    setSplitTestItems(prev => {
      if (prev.length <= 1) return [{ id: '1', title: '', fromPage: '1', toPage: '' }];
      return prev.filter(item => item.id !== id);
    });
  };

  const handleUpdateSplitItem = (id: string, field: 'title' | 'fromPage' | 'toPage' | 'answerFromPage' | 'answerToPage', value: string) => {
    setSplitTestItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleAutoGenerateRows = (countNum?: number) => {
    const target = countNum !== undefined ? countNum : parseInt(expectedTestCount, 10);
    if (!target || isNaN(target) || target <= 0) return;
    const count = Math.min(Math.max(1, target), 30);
    setSplitTestItems(prev => {
      const newItems: { id: string; title: string; fromPage: string; toPage: string; answerFromPage?: string; answerToPage?: string }[] = [];
      for (let i = 0; i < count; i++) {
        const existing = prev[i];
        if (existing) {
          newItems.push(existing);
        } else {
          const prevItem = newItems[i - 1];
          let nextFrom = '';
          if (prevItem && prevItem.toPage && !isNaN(Number(prevItem.toPage))) {
            nextFrom = String(Number(prevItem.toPage) + 1);
          }
          newItems.push({
            id: String(Date.now() + i),
            title: '',
            fromPage: nextFrom,
            toPage: ''
          });
        }
      }
      return newItems;
    });
  };

  const handleApplySampleTemplate = () => {
    setExpectedTestCount('6');
    setSplitTestItems([
      { id: '1', title: 'Kiểm tra 15 phút: Giá trị lượng giác của một góc - Đề 1', fromPage: '1', toPage: '3' },
      { id: '2', title: 'Kiểm tra 15 phút: Giá trị lượng giác của một góc - Đề 2', fromPage: '4', toPage: '6' },
      { id: '3', title: 'Kiểm tra 15 phút: Hệ thức lượng trong tam giác - Đề 1', fromPage: '7', toPage: '9' },
      { id: '4', title: 'Kiểm tra 15 phút: Hệ thức lượng trong tam giác - Đề 2', fromPage: '10', toPage: '12' },
      { id: '5', title: 'Bài kiểm tra cuối chương - Đề 1', fromPage: '13', toPage: '16' },
      { id: '6', title: 'Bài kiểm tra cuối chương - Đề 2', fromPage: '17', toPage: '20' },
    ]);
    setHasInlineAnswers(false);
    setAnswerFromPage('21');
    setAnswerToPage('25');
    setSplitNotes('Các đáp án nằm riêng ở các trang cuối tài liệu từ trang 21 đến 25');
  };

  // Đặt lại giao diện mặc định, xóa toàn bộ trạng thái tạm thời khi đóng modal
  const resetUploadAndSeparatedState = () => {
    setSeparatedTests([]);
    setIsTopicCombinedFile(false);
    setSplitLocalError('');
    setSplitLocalSuccess('');
    setExpectedTestCount('');
    setHasInlineAnswers(false);
    setSplitTestItems([{ id: '1', title: '', fromPage: '1', toPage: '' }]);
    setAnswerFromPage('');
    setAnswerToPage('');
    setSplitNotes('');
    setQuickInputText('');
    setShowSplitHelper(false);
    setIsDetectingStructure(false);
    setDetectedSummary('');
    setNewFile(null);
    setNewAnswerFile(null);
    setSplitAnswers(false);
    if (setReferenceFile) setReferenceFile(null);
    if (setReferenceNotes) setReferenceNotes('');
  };

  const handleModalClose = () => {
    resetUploadAndSeparatedState();
    onClose();
  };

  // Tự động phân tích cấu trúc đề (số lượng đề, tên đề, trang câu hỏi và trang đáp án)
  const handleAutoDetectStructure = async (targetCount?: number) => {
    if (!newFile) {
      setSplitLocalError('Vui lòng chọn tệp tài liệu bài kiểm tra của chủ đề trước (PDF, Word hoặc Ảnh).');
      return;
    }
    setSplitLocalError('');
    setSplitLocalSuccess('');
    setIsDetectingStructure(true);

    try {
      const fileDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(newFile);
      });

      const gradeNum = parseInt(newGrade, 10) || 12;
      const topicObj = topics.find(t => t.id === newTopicId);
      const topicName = topicObj ? topicObj.name : '';
      const countToUse = targetCount !== undefined ? targetCount : (expectedTestCount.trim() ? parseInt(expectedTestCount, 10) : undefined);

      const apiKey = localStorage.getItem('gemini_api_key') || localStorage.getItem('custom_gemini_api_key') || '';
      const res = await fetch('/api/detect-topic-tests-structure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-gemini-api-key': apiKey } : {})
        },
        body: JSON.stringify({
          fileDataUrl,
          fileName: newFile.name,
          mimeType: newFile.type,
          grade: gradeNum,
          topicName,
          expectedTestCount: countToUse
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.details || errJson.error || `Lỗi khi phân tích cấu trúc (${res.status})`);
      }

      const data = await res.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
        setSplitTestItems(data.items);
        setExpectedTestCount(String(data.items.length));
        if (data.hasInlineAnswers !== undefined) {
          setHasInlineAnswers(Boolean(data.hasInlineAnswers));
        }
        if (data.answerPageRange) {
          const parts = String(data.answerPageRange).split('-');
          if (parts[0]) setAnswerFromPage(parts[0].trim());
          if (parts[1]) setAnswerToPage(parts[1].trim());
          else if (parts[0]) setAnswerToPage(parts[0].trim());
        }
        if (data.summary) {
          setDetectedSummary(data.summary);
        }
        setShowSplitHelper(true);
        setSplitHelperMode('table');
        setSplitLocalSuccess(`✅ AI đã tự động phân tích và điền thông số ${data.items.length} đề thi từ tài liệu! Thầy/Cô có thể điều chỉnh lại nếu cần, sau đó bấm nút "Tạo đề".`);
      } else {
        throw new Error("Không phát hiện được thông số đề rõ ràng từ tài liệu. Thầy/Cô có thể nhập thủ công theo các ô bên dưới.");
      }
    } catch (err: any) {
      console.error("Detect Structure Error:", err);
      setSplitLocalError(err.message || "Lỗi khi phân tích cấu trúc đề");
    } finally {
      setIsDetectingStructure(false);
    }
  };

  // Phân tích và tách đề từ tệp gộp của chủ đề
  const handleAnalyzeAndSplitTopicTests = async () => {
    if (!newFile) {
      setSplitLocalError('Vui lòng chọn tệp tài liệu bài kiểm tra của chủ đề ở trên (PDF, Word hoặc Ảnh).');
      return;
    }
    setSplitLocalError('');
    setSplitLocalSuccess('');
    setIsSplittingTopic(true);

    try {
      const fileDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(newFile);
      });

      const gradeNum = parseInt(newGrade, 10) || 12;
      const topicObj = topics.find(t => t.id === newTopicId);
      const topicName = topicObj ? topicObj.name : '';

      const validItems = splitTestItems.filter(item => 
        (item.title && item.title.trim()) || 
        (item.fromPage && item.fromPage.trim()) || 
        (item.toPage && item.toPage.trim()) || 
        ((item as any).answerFromPage && (item as any).answerFromPage.trim())
      );
      
      let constructedTitles = '';
      if (splitHelperMode === 'quick' && quickInputText.trim()) {
        constructedTitles = quickInputText.trim();
      } else if (validItems.length > 0) {
        constructedTitles = validItems.map((item, idx) => {
          const tTitle = item.title?.trim() || `Đề số ${idx + 1}`;
          const pageRange = (item.fromPage?.trim() && item.toPage?.trim())
            ? `(Phạm vi đề: từ trang ${item.fromPage.trim()} đến trang ${item.toPage.trim()})`
            : (item.fromPage?.trim() ? `(Phạm vi đề: trang ${item.fromPage.trim()})` : '');
          return `- Đề ${idx + 1}: ${tTitle} ${pageRange}${hasInlineAnswers ? ' [Đề gộp sẵn đáp án]' : ''}`.trim();
        }).join('\n');
      }

      const answerRange = (answerFromPage.trim() && answerToPage.trim())
        ? `${answerFromPage.trim()}-${answerToPage.trim()}`
        : (answerFromPage.trim() || undefined);

      const targetCount = expectedTestCount.trim() 
        ? parseInt(expectedTestCount, 10) 
        : (validItems.length > 0 ? validItems.length : undefined);

      const apiKey = localStorage.getItem('gemini_api_key') || localStorage.getItem('custom_gemini_api_key') || '';
      const res = await fetch('/api/split-topic-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-gemini-api-key': apiKey } : {})
        },
        body: JSON.stringify({
          fileDataUrl,
          fileName: newFile.name,
          mimeType: newFile.type,
          grade: gradeNum,
          topicName,
          expectedTestCount: targetCount,
          expectedTestTitles: constructedTitles || undefined,
          splitTestItems: validItems,
          hasInlineAnswers,
          answerPageRange: answerRange,
          splitNotes: splitNotes.trim() || undefined
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.details || errJson.error || `Lỗi máy chủ (${res.status})`);
      }

      const data = await res.json();
      if (!data.tests || data.tests.length === 0) {
        throw new Error("Không tìm thấy bài kiểm tra nào trong tài liệu hoặc không thể phân tách.");
      }

      const initializedTests = data.tests.map((t: any) => ({
        ...t,
        selected: true
      }));

      setSeparatedTests(initializedTests);
      setSplitLocalSuccess(`Đã bóc tách thành công ${initializedTests.length} bài kiểm tra và đáp án của chủ đề!`);
      if (initializedTests.length > 0) {
        setExpandedTestId(initializedTests[0].id);
      }
    } catch (err: any) {
      console.error("Error analyzing topic tests:", err);
      setSplitLocalError(err.message || 'Lỗi khi phân tích và tách đề.');
    } finally {
      setIsSplittingTopic(false);
    }
  };

  // Lưu tất cả các đề online đã chọn vào Firestore
  const handleSaveSeparatedTests = async () => {
    const selected = separatedTests.filter(t => t.selected);
    if (selected.length === 0) {
      setSplitLocalError('Vui lòng chọn ít nhất 1 đề kiểm tra để lưu.');
      return;
    }

    const gradeNum = parseInt(newGrade, 10) || 12;
    const validTopics = topics.filter(t => t.grade === gradeNum);
    const targetTopicId = newTopicId || (validTopics.length > 0 ? validTopics[0].id : `topic-${gradeNum}`);

    if (onSaveBatchTests) {
      setIsSavingBatchLocal(true);
      try {
        await onSaveBatchTests(selected, gradeNum, targetTopicId);
      } finally {
        setIsSavingBatchLocal(false);
      }
    }
  };

  const handleToggleSelectAll = (select: boolean) => {
    setSeparatedTests(prev => prev.map(t => ({ ...t, selected: select })));
  };

  const handleToggleTestSelect = (id: string) => {
    setSeparatedTests(prev => prev.map(t => t.id === id ? { ...t, selected: !t.selected } : t));
  };

  const handleUpdateTestTitle = (id: string, title: string) => {
    setSeparatedTests(prev => prev.map(t => t.id === id ? { ...t, title } : t));
  };

  const handleUpdateTestDuration = (id: string, durationMinutes: number) => {
    setSeparatedTests(prev => prev.map(t => t.id === id ? { ...t, durationMinutes } : t));
  };

  const handleDeleteSeparatedTest = (id: string) => {
    setSeparatedTests(prev => prev.filter(t => t.id !== id));
  };

  const handleFormSubmitInternal = (e: React.FormEvent) => {
    if (onlineCreationMode === 'upload' && isTopicCombinedFile) {
      e.preventDefault();
      if (separatedTests.length > 0) {
        handleSaveSeparatedTests();
      } else {
        handleAnalyzeAndSplitTopicTests();
      }
      return;
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
            onClick={onClose} 
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
          {/* ============================================================ */}
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
                </div>
              </div>
            )}
          </div>

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
                    setSeparatedTests([]);
                    setSplitLocalError('');
                    setSplitLocalSuccess('');
                    setSingleUploadedQuestions([]);
                    setSingleExtractError('');
                    if (file) {
                      if (isTopicCombinedFile) {
                        const count = expectedTestCount.trim() ? parseInt(expectedTestCount, 10) : undefined;
                        // Tự động quét và điền thông số các đề ngay khi tải tệp
                        setTimeout(() => {
                          handleAutoDetectStructure(count);
                        }, 150);
                      } else {
                        // Tự động đọc và bóc tách câu hỏi ngay lập tức để hiện giao diện chỉnh sửa!
                        setTimeout(() => {
                          handleExtractSingleFileQuestions(file);
                        }, 100);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-100 file:text-indigo-800 hover:file:bg-indigo-200 bg-white"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                />
              </div>

              {/* TÍNH NĂNG TÁCH CÁC ĐỀ VÀ ĐÁP ÁN CỦA CẢ CHỦ ĐỀ THÀNH CÁC ĐỀ ONLINE RIÊNG BIỆT */}
              <div className="p-3.5 bg-gradient-to-br from-amber-50 via-orange-50/40 to-amber-50/20 rounded-xl border border-amber-200/90 shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="isTopicCombinedFile"
                      checked={isTopicCombinedFile}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsTopicCombinedFile(checked);
                        if (!checked) {
                          setSeparatedTests([]);
                          setSplitLocalError('');
                          setSplitLocalSuccess('');
                        } else if (newFile) {
                          const count = expectedTestCount.trim() ? parseInt(expectedTestCount, 10) : undefined;
                          setTimeout(() => {
                            handleAutoDetectStructure(count);
                          }, 150);
                        }
                      }}
                      className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500 mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                        <Scissors size={15} className="text-amber-600" />
                        Tệp gộp tất cả các bài kiểm tra của chủ đề (Tự động tách thành các đề online riêng biệt)
                      </span>
                      <span className="text-[11px] text-amber-800/80 block mt-0.5 leading-snug">
                        Dành cho tài liệu tổng hợp của cả chủ đề. Thầy/Cô <strong>không cần đặt tên đề kiểm tra</strong> — hệ thống tự động nhận diện và bóc tách đầy đủ tất cả các đề (kiểm tra 15 phút, bài kiểm tra cuối chương, Đề 1, Đề 2...).
                      </span>
                    </div>
                  </label>
                  <span className="px-2.5 py-1 bg-amber-200/80 text-amber-950 font-bold text-[10px] rounded-lg tracking-wide shrink-0">
                    Chuyên đề
                  </span>
                </div>

                {isTopicCombinedFile && (
                  <div className="pt-1 space-y-3 border-t border-amber-200/60 mt-2">
                    <div className="text-[11px] text-amber-900/90 bg-white/80 p-2.5 rounded-lg border border-amber-200/70 flex items-start gap-2">
                      <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        AI sẽ đọc toàn bộ tệp đến tận trang cuối cùng, tự động nhận diện tất cả các bài kiểm tra trong chủ đề (bao gồm cả các bài kiểm tra 15 phút từng bài và <strong>bài kiểm tra cuối chương</strong>), bóc tách chính xác từng câu hỏi và ghép đúng đáp án/lời giải chi tiết.
                      </span>
                    </div>

                    {/* KHỐI TƯƠNG TÁC NHANH: BẤM SỐ LƯỢNG ĐỀ ĐỂ AI TỰ ĐỘNG PHÂN TÍCH VÀ ĐIỀN THÔNG SỐ */}
                    <div className="bg-gradient-to-br from-amber-100/70 via-orange-50 to-amber-50 p-3 rounded-xl border border-amber-300 shadow-2xs space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                          <Sparkles size={15} className="text-amber-600" />
                          <span>Bấm số lượng đề để AI tự động phân tích & điền thông số tương ứng:</span>
                        </span>
                        {isDetectingStructure && (
                          <span className="text-[11px] font-bold text-amber-900 bg-amber-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
                            <Loader2 size={12} className="animate-spin text-amber-700" />
                            <span>Đang đọc tài liệu & điền thông số...</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {[2, 3, 4, 5, 6, 8, 10].map((num) => (
                          <button
                            key={num}
                            type="button"
                            disabled={isDetectingStructure || !newFile}
                            onClick={() => {
                              setExpectedTestCount(String(num));
                              handleAutoDetectStructure(num);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer ${
                              expectedTestCount === String(num)
                                ? 'bg-amber-600 text-white shadow-amber-300'
                                : 'bg-white hover:bg-amber-100/90 text-amber-900 border border-amber-300'
                            } disabled:opacity-40 disabled:cursor-not-allowed`}
                            title={`Bấm để AI phân tích tài liệu và cấu hình thành ${num} đề`}
                          >
                            <span>{num} đề</span>
                          </button>
                        ))}

                        <button
                          type="button"
                          disabled={isDetectingStructure || !newFile}
                          onClick={() => handleAutoDetectStructure()}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-2xs transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                          title="Để AI tự động quét tài liệu và phát hiện chính xác số lượng đề"
                        >
                          {isDetectingStructure ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Wand2 size={13} />
                          )}
                          <span>Tự động quét theo tệp</span>
                        </button>
                      </div>

                      {!newFile ? (
                        <p className="text-[11px] text-amber-800/80 italic">
                          💡 Vui lòng tải lên tệp đề gộp (PDF hoặc Word) ở trên trước, sau đó bấm chọn số lượng đề để AI tự động điền tên đề và số trang.
                        </p>
                      ) : (
                        <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
                          💡 Khi Thầy/Cô bấm số lượng đề, AI sẽ phân tích tài liệu và tự động điền tên từng đề, số trang câu hỏi và phạm vi trang đáp án ở mục <strong>Hỗ trợ AI tách đề</strong> bên dưới. Thầy/Cô chỉ cần chỉnh lại nếu hệ thống tách thiếu, sau đó bấm nút <strong>Tạo đề</strong>.
                        </p>
                      )}

                      {detectedSummary && (
                        <div className="text-[11px] text-emerald-900 bg-emerald-50 border border-emerald-200/90 p-2 rounded-lg font-medium flex items-start gap-1.5">
                          <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                          <span>{detectedSummary}</span>
                        </div>
                      )}
                    </div>

                    {/* NÚT / KHUNG HỖ TRỢ NHẬP THÔNG TIN BỔ SUNG: SỐ LƯỢNG ĐỀ, TÊN ĐỀ VÀ PHẠM VI TRANG TÀI LIỆU GỐC */}
                    <div className="bg-white/95 p-3.5 rounded-xl border border-amber-200 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setShowSplitHelper(!showSplitHelper)}
                          className="flex items-center gap-1.5 text-xs font-bold text-amber-950 hover:text-amber-800 transition-colors text-left"
                        >
                          <Sliders size={14} className="text-amber-600 shrink-0" />
                          <span>Hỗ trợ AI tách đề: Số lượng đề, tên đề & phạm vi trang (Từ trang... Đến trang...)</span>
                          {showSplitHelper ? <ChevronUp size={14} className="text-gray-400 shrink-0" /> : <ChevronDown size={14} className="text-gray-400 shrink-0" />}
                        </button>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                          expectedTestCount || splitTestItems.some(i => i.title || i.fromPage)
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {expectedTestCount || splitTestItems.some(i => i.title || i.fromPage)
                            ? `Đã cấu hình ${expectedTestCount ? `${expectedTestCount} đề` : `${splitTestItems.filter(i => i.title || i.fromPage).length} đề`}`
                            : 'Khuyến nghị'}
                        </span>
                      </div>

                      {showSplitHelper ? (
                        <div className="pt-2 border-t border-amber-100 space-y-3">
                          <p className="text-[11px] text-gray-600 leading-relaxed">
                            Thầy/Cô cung cấp <strong>số lượng đề</strong>, <strong>tên đề</strong> và <strong>phạm vi từ trang thứ mấy đến trang mấy trong tài liệu gốc</strong> để hệ thống AI phân tách chuẩn xác 100%, không bị sót đề hay lẫn câu hỏi giữa các đề:
                          </p>

                          {/* DÒNG 1: SỐ LƯỢNG ĐỀ VÀ CÁC NÚT TÁC VỤ NHANH */}
                          <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/80 flex flex-wrap items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2">
                              <label className="text-xs font-bold text-amber-950 shrink-0">
                                Số lượng đề trong tài liệu:
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="30"
                                value={expectedTestCount}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setExpectedTestCount(val);
                                }}
                                onBlur={(e) => {
                                  const num = parseInt(e.target.value, 10);
                                  if (num > 0 && newFile) {
                                    handleAutoDetectStructure(num);
                                  } else if (num > 0) {
                                    handleAutoGenerateRows(num);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const num = parseInt((e.target as HTMLInputElement).value, 10);
                                    if (num > 0 && newFile) {
                                      handleAutoDetectStructure(num);
                                    } else if (num > 0) {
                                      handleAutoGenerateRows(num);
                                    }
                                  }
                                }}
                                placeholder="VD: 6"
                                className="w-20 px-2.5 py-1 text-xs border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white font-bold text-center text-amber-900 shadow-2xs"
                              />
                              <span className="text-[11px] text-gray-500 font-medium">đề</span>

                              <button
                                type="button"
                                onClick={() => handleAutoDetectStructure(expectedTestCount ? parseInt(expectedTestCount, 10) : undefined)}
                                disabled={isDetectingStructure || !newFile}
                                className="px-2.5 py-1 text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                                title="AI quét tài liệu và tự động điền các thông số tương ứng"
                              >
                                {isDetectingStructure ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                <span>AI quét & điền thông số</span>
                              </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleAutoGenerateRows()}
                                disabled={!expectedTestCount}
                                className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-amber-100/70 text-amber-900 border border-amber-300 rounded-lg shadow-2xs transition-colors disabled:opacity-40"
                              >
                                ⚡ Đồng bộ {expectedTestCount || ''} dòng
                              </button>
                              <button
                                type="button"
                                onClick={handleApplySampleTemplate}
                                className="px-2.5 py-1 text-[11px] font-bold bg-amber-700 hover:bg-amber-800 text-white rounded-lg shadow-2xs transition-colors"
                                title="Điền mẫu cấu trúc 6 đề (2 đề bài 1, 2 đề bài 2, 2 đề ôn tập chương)"
                              >
                                ⚡ Mẫu gợi ý (6 đề)
                              </button>
                              <div className="flex items-center bg-white p-0.5 rounded-lg border border-amber-200">
                                <button
                                  type="button"
                                  onClick={() => setSplitHelperMode('table')}
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                    splitHelperMode === 'table' ? 'bg-amber-100 text-amber-900' : 'text-gray-500 hover:text-gray-700'
                                  }`}
                                >
                                  Bảng từng đề
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSplitHelperMode('quick')}
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                    splitHelperMode === 'quick' ? 'bg-amber-100 text-amber-900' : 'text-gray-500 hover:text-gray-700'
                                  }`}
                                >
                                  Nhập nhanh văn bản
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* TRẠNG THÁI ĐANG PHÂN TÍCH CẤU TRÚC */}
                          {isDetectingStructure && (
                            <div className="p-3 bg-amber-50 text-amber-900 rounded-xl text-xs font-semibold border border-amber-300 flex items-center gap-2 animate-pulse shadow-2xs">
                              <Loader2 size={16} className="animate-spin text-amber-600 shrink-0" />
                              <span>🤖 AI đang đọc tài liệu và tự động phân tích phạm vi các đề... Vui lòng đợi trong giây lát.</span>
                            </div>
                          )}

                          {/* PHẦN 1: DANH SÁCH CHI TIẾT TỪNG ĐỀ (PHẠM VI TRANG GỒM CẢ ĐỀ VÀ ĐÁP ÁN ĐI KÈM) */}
                          {splitHelperMode === 'table' ? (
                            <div className="space-y-2.5">
                              <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-700 font-bold px-1 gap-1">
                                <span>Danh sách các đề & Phạm vi trang:</span>
                                <span className="text-[10px] text-amber-800 font-normal bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  💡 Phạm vi đề được hiểu bao gồm toàn bộ đề (gồm cả câu hỏi và đáp án đi kèm nếu đề có kèm đáp án)
                                </span>
                              </div>

                              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                {splitTestItems.map((item, idx) => (
                                  <div 
                                    key={item.id} 
                                    className="p-2.5 rounded-xl border border-amber-200/90 bg-white hover:border-amber-400 hover:shadow-xs transition-all flex flex-wrap sm:flex-nowrap items-center gap-2"
                                  >
                                    <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-1 rounded-md shrink-0">
                                      Đề {idx + 1}
                                    </span>

                                    <div className="flex-1 min-w-[180px]">
                                      <input
                                        type="text"
                                        value={item.title}
                                        onChange={(e) => handleUpdateSplitItem(item.id, 'title', e.target.value)}
                                        placeholder={`Tên đề ${idx + 1} (VD: Kiểm tra 15 phút: Giá trị lượng giác - Đề 1)`}
                                        className="w-full px-2.5 py-1 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none text-gray-800 font-medium placeholder:font-normal"
                                      />
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0 bg-indigo-50/80 border border-indigo-200/90 px-2.5 py-1 rounded-lg text-xs">
                                      <span className="text-[11px] font-semibold text-indigo-950">Phạm vi từ trang:</span>
                                      <input
                                        type="number"
                                        min="1"
                                        value={item.fromPage}
                                        onChange={(e) => handleUpdateSplitItem(item.id, 'fromPage', e.target.value)}
                                        placeholder="Trang"
                                        className="w-12 px-1 py-0.5 text-xs border border-indigo-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none text-center font-bold text-indigo-700 bg-white shadow-2xs"
                                        title="Trang bắt đầu của đề"
                                      />
                                      <span className="text-[11px] font-semibold text-indigo-950">đến:</span>
                                      <input
                                        type="number"
                                        min="1"
                                        value={item.toPage}
                                        onChange={(e) => handleUpdateSplitItem(item.id, 'toPage', e.target.value)}
                                        placeholder="Trang"
                                        className="w-12 px-1 py-0.5 text-xs border border-indigo-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none text-center font-bold text-indigo-700 bg-white shadow-2xs"
                                        title="Trang kết thúc của đề"
                                      />
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSplitItem(item.id)}
                                      disabled={splitTestItems.length <= 1}
                                      className="text-gray-400 hover:text-red-600 disabled:opacity-20 p-1.5 transition-colors shrink-0 rounded-lg hover:bg-red-50"
                                      title="Xóa đề này"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>

                              <div className="flex flex-wrap items-center justify-between pt-1 gap-2">
                                <button
                                  type="button"
                                  onClick={handleAddSplitItem}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-colors shadow-2xs"
                                >
                                  <Plus size={13} />
                                  <span>Thêm đề & phạm vi trang</span>
                                </button>
                                <span className="text-[10px] text-gray-500 font-medium">
                                  Tổng cộng: <strong className="text-amber-900">{splitTestItems.length} đề</strong> đã thiết lập
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                Nhập nhanh danh sách đề kèm phạm vi trang (mỗi đề 1 dòng):
                              </label>
                              <textarea
                                rows={6}
                                value={quickInputText}
                                onChange={(e) => setQuickInputText(e.target.value)}
                                placeholder={`Ví dụ:\n- Đề 1: Kiểm tra 15 phút: Giá trị lượng giác của một góc - Đề 1 (từ trang 1 đến 3)\n- Đề 2: Kiểm tra 15 phút: Giá trị lượng giác của một góc - Đề 2 (từ trang 4 đến 6)\n- Đề 3: Kiểm tra 15 phút: Hệ thức lượng trong tam giác - Đề 1 (từ trang 7 đến 9)\n- Đề 4: Kiểm tra 15 phút: Hệ thức lượng trong tam giác - Đề 2 (từ trang 10 đến 12)\n- Đề 5: Bài kiểm tra cuối chương - Đề 1 (từ trang 13 đến 16)\n- Đề 6: Bài kiểm tra cuối chương - Đề 2 (từ trang 17 đến 20)`}
                                className="w-full px-3 py-2 text-xs border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white text-gray-800 font-mono leading-relaxed"
                              />
                            </div>
                          )}

                          {/* PHẦN 2: NÚT TÍCH ĐỀ GỘP ĐÁP ÁN (GHI NGAY DƯỚI DANH SÁCH TỪNG ĐỀ) */}
                          <div className="bg-amber-50/90 p-3 rounded-xl border border-amber-300 flex items-start gap-2.5 shadow-2xs">
                            <input
                              type="checkbox"
                              id="checkbox-has-inline-answers"
                              checked={hasInlineAnswers}
                              onChange={(e) => setHasInlineAnswers(e.target.checked)}
                              className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500 mt-0.5 cursor-pointer shrink-0"
                            />
                            <label htmlFor="checkbox-has-inline-answers" className="cursor-pointer select-none">
                              <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                                <CheckCircle2 size={14} className={hasInlineAnswers ? "text-amber-700" : "text-gray-400"} />
                                Đề gộp đáp án (Đề thi và lời giải/đáp án nằm liền kề trong cùng phạm vi từng đề)
                              </span>
                              <span className="text-[11px] text-amber-800/90 block mt-0.5 leading-relaxed">
                                {hasInlineAnswers 
                                  ? 'Đang bật: Hệ thống hiểu phạm vi trang của mỗi đề (từ trang... đến trang...) đã gồm cả câu hỏi và đáp án đi kèm — AI sẽ tự động phân tích và bóc tách đáp án cho từng đề.' 
                                  : 'Tích chọn ô này nếu trong tài liệu mỗi đề đã có sẵn đáp án/lời giải đi liền trong cùng phạm vi trang để hệ thống hiểu và tự tách.'}
                              </span>
                            </label>
                          </div>

                          {/* PHẦN 3: PHẠM VI TRANG CHỨA BẢNG ĐÁP ÁN CHUNG TOÀN BỘ TÀI LIỆU (KHI ĐÁP ÁN NẰM RIÊNG Ở CUỐI) */}
                          <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/90 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                                <BookOpen size={14} className="text-emerald-700" />
                                <span>Phạm vi trang chứa Bảng đáp án chung toàn bộ tài liệu:</span>
                              </label>
                              <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                                Khi đáp án nằm riêng ở các trang cuối tài liệu
                              </span>
                            </div>

                            <p className="text-[11px] text-emerald-800/90 leading-relaxed">
                              Trường hợp các đáp án nằm riêng ở các trang cuối tài liệu (ví dụ trang 21 đến 25), Thầy/Cô nhập phạm vi trang tại đây. AI sẽ tự động đọc bảng đáp án chung và ghép chính xác đáp án/lời giải vào từng đề tương ứng.
                            </p>

                            <div className="flex flex-wrap items-center gap-2 text-xs pt-0.5">
                              <span className="text-gray-700 font-medium">Bảng đáp án từ trang:</span>
                              <input
                                type="number"
                                min="1"
                                value={answerFromPage}
                                onChange={(e) => setAnswerFromPage(e.target.value)}
                                placeholder="VD: 21"
                                className="w-16 px-2 py-1 text-xs border border-emerald-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none text-center font-bold text-emerald-900 bg-white shadow-2xs"
                              />
                              <span className="text-gray-700 font-medium">đến trang:</span>
                              <input
                                type="number"
                                min="1"
                                value={answerToPage}
                                onChange={(e) => setAnswerToPage(e.target.value)}
                                placeholder="VD: 25"
                                className="w-16 px-2 py-1 text-xs border border-emerald-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none text-center font-bold text-emerald-900 bg-white shadow-2xs"
                              />
                              {answerFromPage && (
                                <span className="text-[11px] text-emerald-700 font-medium">
                                  (Trang {answerFromPage}{answerToPage ? ` - ${answerToPage}` : ''})
                                </span>
                              )}
                            </div>
                          </div>

                          {/* PHẦN 4: GHI CHÚ PHÂN TÁCH THÊM */}
                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                              Ghi chú phân tách thêm cho AI (Tùy chọn):
                            </label>
                            <input
                              type="text"
                              value={splitNotes}
                              onChange={(e) => setSplitNotes(e.target.value)}
                              placeholder="Ví dụ: Mỗi đề có 12 câu trắc nghiệm, phần bài tập cuối chương có 2 mã đề 101 và 102..."
                              className="w-full px-2.5 py-1.5 text-xs border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-gray-800"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-[11px] text-gray-500">
                          <span className="truncate pr-2">
                            {expectedTestCount || splitTestItems.some(i => i.title || i.fromPage)
                              ? `Đã cấu hình mục tiêu tách: ${expectedTestCount ? `${expectedTestCount} đề` : `${splitTestItems.filter(i => i.title || i.fromPage).length} đề`} (kèm tên đề & phạm vi trang)`
                              : 'Bấm để nhập số lượng, tên đề và phạm vi từ trang thứ mấy đến trang mấy trong tài liệu gốc.'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowSplitHelper(true)}
                            className="text-amber-700 font-bold hover:underline shrink-0 ml-2"
                          >
                            {expectedTestCount || splitTestItems.some(i => i.title || i.fromPage) ? 'Chỉnh sửa' : 'Nhập thông tin hỗ trợ'}
                          </button>
                        </div>
                      )}
                    </div>

                    {newFile && separatedTests.length === 0 && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleAnalyzeAndSplitTopicTests}
                          disabled={isSplittingTopic || isDetectingStructure}
                          className="px-5 py-2.5 bg-gradient-to-r from-amber-600 via-orange-600 to-indigo-600 hover:from-amber-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-300 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {isSplittingTopic ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              <span>Đang đọc tệp và tự động bóc tách các đề kiểm tra trong chủ đề...</span>
                            </>
                          ) : (
                            <>
                              <Wand2 size={16} />
                              <span>
                                Tạo đề {splitTestItems.some(i => i.title || i.fromPage) ? `(Tách thành ${expectedTestCount || splitTestItems.filter(i => i.title || i.fromPage).length} đề online theo thông số)` : '(Phân tách và tạo các đề online)'}
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {splitLocalError && (
                      <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium border border-red-200 flex items-center gap-2">
                        <AlertCircle size={15} className="shrink-0 text-red-600" />
                        <span>{splitLocalError}</span>
                      </div>
                    )}

                    {splitLocalSuccess && (
                      <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-medium border border-emerald-200 flex items-center gap-2">
                        <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
                        <span>{splitLocalSuccess}</span>
                      </div>
                    )}

                    {/* DANH SÁCH CÁC ĐỀ ĐÃ TÁCH TỪ CHỦ ĐỀ */}
                    {separatedTests.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-3 rounded-xl border border-amber-200 shadow-2xs gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-xs font-bold text-gray-800">
                              Tìm thấy {separatedTests.length} bài kiểm tra riêng biệt
                            </span>
                            <span className="text-[11px] text-gray-500 font-medium">
                              (Đã chọn {separatedTests.filter(t => t.selected).length}/{separatedTests.length} đề)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleSelectAll(true)}
                              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
                            >
                              Chọn tất cả
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleSelectAll(false)}
                              className="text-[11px] font-semibold text-gray-600 hover:text-gray-800 px-2.5 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                              Bỏ chọn
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSeparatedTests([]);
                                setSplitLocalSuccess('');
                              }}
                              className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 px-2.5 py-1 rounded bg-amber-100 hover:bg-amber-200 transition-colors"
                            >
                              Tách lại
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                          {separatedTests.map((test, tIdx) => {
                            const isExpanded = expandedTestId === test.id;
                            return (
                              <div
                                key={test.id}
                                className={`rounded-xl border transition-all ${
                                  test.selected
                                    ? 'bg-white border-amber-300 shadow-xs'
                                    : 'bg-gray-50/80 border-gray-200 opacity-75'
                                }`}
                              >
                                <div className="p-3.5 space-y-3">
                                  <div className="flex items-start gap-3">
                                    <input
                                      type="checkbox"
                                      checked={test.selected}
                                      onChange={() => handleToggleTestSelect(test.id)}
                                      className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500 mt-1 cursor-pointer shrink-0"
                                    />
                                    <div className="flex-1 space-y-2">
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex-1">
                                          <div className="text-[10px] font-semibold text-amber-800 mb-0.5 flex items-center gap-1">
                                            <Sparkles size={11} className="text-amber-600" />
                                            <span>Tên đề kiểm tra (Tự động nhận diện từ tài liệu):</span>
                                          </div>
                                          <input
                                            type="text"
                                            value={test.title}
                                            onChange={(e) => handleUpdateTestTitle(test.id, e.target.value)}
                                            className="w-full px-3 py-1.5 border border-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg text-xs font-bold text-gray-900 outline-none bg-white"
                                            placeholder={`Đề ${tIdx + 1}`}
                                          />
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                          <div className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200 text-xs">
                                            <Clock size={13} className="text-gray-500" />
                                            <input
                                              type="number"
                                              min="1"
                                              max="180"
                                              value={test.durationMinutes}
                                              onChange={(e) => handleUpdateTestDuration(test.id, parseInt(e.target.value, 10) || 45)}
                                              className="w-12 bg-transparent text-center font-bold text-gray-800 outline-none"
                                            />
                                            <span className="text-[11px] text-gray-500">phút</span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteSeparatedTest(test.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Xóa đề này khỏi danh sách lưu"
                                          >
                                            <Trash2 size={15} />
                                          </button>
                                        </div>
                                      </div>

                                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                                          {test.questions.length} câu hỏi
                                        </span>
                                        {test.mcqCount > 0 && (
                                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium">
                                            {test.mcqCount} câu TN 4 lựa chọn
                                          </span>
                                        )}
                                        {test.tfCount > 0 && (
                                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium">
                                            {test.tfCount} câu Đúng/Sai
                                          </span>
                                        )}
                                        {test.shortCount > 0 && (
                                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium">
                                            {test.shortCount} câu Trả lời ngắn
                                          </span>
                                        )}
                                        {test.essayCount > 0 && (
                                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-medium">
                                            {test.essayCount} câu Tự luận
                                          </span>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() => setEditingSeparatedTestIndex(tIdx)}
                                          className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
                                          title="Chỉnh sửa câu hỏi, đáp án, KaTeX và hình vẽ của đề này"
                                        >
                                          <Edit3 size={13} />
                                          <span>Sửa câu hỏi</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => setExpandedTestId(isExpanded ? null : test.id)}
                                          className="ml-auto flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-md hover:bg-indigo-50 transition-colors"
                                        >
                                          {isExpanded ? <EyeOff size={13} /> : <Eye size={13} />}
                                          <span>{isExpanded ? 'Ẩn xem trước' : 'Xem câu hỏi & đáp án'}</span>
                                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* PREVIEW CÂU HỎI & LỜI GIẢI CHI TIẾT */}
                                  {isExpanded && (
                                    <div className="mt-3 pt-3 border-t border-gray-100 bg-gray-50/70 p-3 rounded-lg space-y-3">
                                      <div className="text-xs font-bold text-gray-700 flex items-center justify-between">
                                        <span>Chi tiết các câu hỏi & đáp án đã bóc tách:</span>
                                        <span className="text-[11px] text-gray-500 font-normal">
                                          Chuẩn hóa công thức Toán học LaTeX
                                        </span>
                                      </div>
                                      <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                                        {test.questions.map((q: any, qIdx: number) => (
                                          <div key={q.id || qIdx} className="bg-white p-3 rounded-lg border border-gray-200 text-xs space-y-2">
                                            <div className="flex items-start justify-between gap-2">
                                              <div className="font-semibold text-gray-900 flex-1 leading-relaxed">
                                                <span className="text-blue-600 font-bold mr-1.5">Câu {qIdx + 1}:</span>
                                                <MathText content={q.question || ''} />
                                              </div>
                                              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 font-medium rounded shrink-0">
                                                {q.points || 0.25}đ
                                              </span>
                                            </div>

                                            {/* Lựa chọn A, B, C, D */}
                                            {q.options && q.options.length > 0 && (
                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-3 pt-1">
                                                {q.options.map((opt: string, oIdx: number) => (
                                                  <div key={oIdx} className="text-gray-700 flex items-start gap-1">
                                                    <MathText content={opt} />
                                                  </div>
                                                ))}
                                              </div>
                                            )}

                                            {/* Đáp án đúng & Lời giải */}
                                            <div className="pt-2 border-t border-gray-100 flex flex-col gap-1 bg-emerald-50/50 p-2.5 rounded-md">
                                              <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-bold text-emerald-800">
                                                  Đáp án đúng:
                                                </span>
                                                <span className="px-2 py-0.5 bg-emerald-600 text-white font-bold text-[11px] rounded">
                                                  {q.correctAnswer || 'Chưa có'}
                                                </span>
                                              </div>
                                              {q.explanation && (
                                                <div className="text-[11px] text-gray-700 leading-relaxed pt-1">
                                                  <span className="font-semibold text-emerald-900 mr-1">Hướng dẫn giải:</span>
                                                  <MathText content={q.explanation} />
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* NÚT LƯU DANH SÁCH ĐỀ ĐÃ TÁCH */}
                        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-100/70 p-3 rounded-xl border border-amber-300">
                          <div className="text-xs text-amber-950 font-medium">
                            Sẵn sàng tạo <strong>{separatedTests.filter(t => t.selected).length}</strong> đề thi online riêng biệt cho chủ đề!
                          </div>
                          <button
                            type="button"
                            onClick={handleSaveSeparatedTests}
                            disabled={isSavingBatchLocal || separatedTests.filter(t => t.selected).length === 0}
                            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                          >
                            {isSavingBatchLocal ? (
                              <>
                                <Loader2 size={15} className="animate-spin" />
                                <span>Đang lưu các đề online vào hệ thống...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles size={15} />
                                <span>Lưu {separatedTests.filter(t => t.selected).length} đề online này vào chủ đề</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!isTopicCombinedFile && (
                <>
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
                                      const isCorrect = q.correctAnswer === letter || opt.trim().startsWith(letter + '.');
                                      return (
                                        <div 
                                          key={oIdx} 
                                          className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs transition-colors ${
                                            isCorrect ? 'bg-emerald-50 border-emerald-300 font-semibold' : 'bg-white border-gray-200'
                                          }`}
                                        >
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
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Đúng / Sai đối với TF */}
                              {q.type === 'tf' && q.options && q.options.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                  <label className="text-[10px] font-bold text-gray-500 block">Các ý a, b, c, d:</label>
                                  <div className="space-y-1">
                                    {q.options.map((stmt, sIdx) => (
                                      <div key={sIdx} className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-lg border border-gray-200 text-xs">
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
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Trả lời ngắn / Tự luận */}
                              {(q.type === 'short' || q.type === 'essay') && (
                                <div className="pt-1">
                                  <label className="text-[10px] font-bold text-gray-500 mb-0.5 block">Đáp số / Kết quả chính xác:</label>
                                  <input
                                    type="text"
                                    value={q.correctAnswer || ''}
                                    onChange={(e) => handleUpdateSingleQuestion(qIdx, { correctAnswer: e.target.value })}
                                    placeholder={q.type === 'short' ? 'Ví dụ: 12 hoặc -3/4' : 'Tóm tắt kết quả chính...'}
                                    className="w-full px-2.5 py-1 text-xs border border-gray-200 rounded-lg outline-none focus:border-indigo-400 font-bold text-indigo-900 bg-white"
                                  />
                                </div>
                              )}

                              {/* Lời giải chi tiết */}
                              <div className="pt-1 border-t border-gray-100 flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-emerald-800">Lời giải chi tiết:</label>
                                <textarea
                                  value={q.explanation || ''}
                                  onChange={(e) => handleUpdateSingleQuestion(qIdx, { explanation: e.target.value })}
                                  rows={2}
                                  placeholder="Nhập hướng dẫn giải hoặc lời giải chi tiết..."
                                  className="w-full text-xs p-2 rounded-lg border border-emerald-200 bg-emerald-50/30 focus:border-emerald-400 outline-none leading-relaxed resize-y font-mono"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
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

            {isTopicCombinedFile ? (
              <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50/40 border border-amber-200/90 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-2.5 text-xs text-amber-950">
                  <Sparkles size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold flex items-center gap-1.5 text-amber-950">
                      <span>Tên các đề kiểm tra: Tự động nhận diện từ tài liệu</span>
                      <span className="text-[10px] bg-amber-200 text-amber-900 font-extrabold px-1.5 py-0.5 rounded">Tự động</span>
                    </div>
                    <p className="text-[11px] text-amber-800/80 mt-0.5 leading-relaxed">
                      Thầy/Cô <strong>không cần đặt tên đề ở đây</strong>. Hệ thống tự động đặt tên chuẩn xác cho từng đề (15 phút, 1 tiết, Đề 1, Đề 2...) dựa theo nội dung trong tệp tải lên.
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0 shadow-2xs">
                  ✓ Không cần nhập tên
                </span>
              </div>
            ) : (
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
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {isTopicCombinedFile ? "Thời gian mặc định (phút)" : "Thời gian (phút) *"}
                </label>
                <input
                  type="number"
                  required={!isTopicCombinedFile}
                  min="1"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                />
                {isTopicCombinedFile && (
                  <span className="text-[10px] text-amber-800 mt-1 block">Tự động nhận diện theo từng đề (15 hoặc 45 phút)</span>
                )}
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
              onClick={handleModalClose}
              disabled={isSaving || isSavingBatchLocal || isSplittingTopic}
              className={`px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-colors shadow-2xs ${(isSaving || isSavingBatchLocal || isSplittingTopic) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Đóng
            </button>
            <button 
              type="submit"
              disabled={isSaving || isSavingBatchLocal || isSplittingTopic || (isTopicCombinedFile && separatedTests.length > 0 && separatedTests.filter(t => t.selected).length === 0)}
              className={`px-6 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition-all shadow-md shadow-blue-200 flex items-center gap-2 ${(isSaving || isSavingBatchLocal || isSplittingTopic || (isTopicCombinedFile && separatedTests.length > 0 && separatedTests.filter(t => t.selected).length === 0)) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSaving || isSavingBatchLocal ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Đang xử lý lưu đề...
                </>
              ) : isSplittingTopic ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang bóc tách các đề...
                </>
              ) : isTopicCombinedFile ? (
                separatedTests.length > 0 ? (
                  <>
                    <Sparkles size={16} />
                    Lưu {separatedTests.filter(t => t.selected).length} đề online đã chọn
                  </>
                ) : (
                  <>
                    <Scissors size={16} />
                    Tạo {splitTestItems.some(i => i.title || i.fromPage) ? `${expectedTestCount || splitTestItems.filter(i => i.title || i.fromPage).length} đề online` : 'các đề online'}
                  </>
                )
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

      {/* MODAL CHỈNH SỬA CÂU HỎI CHO ĐỀ TÁCH TỪ CHUYÊN ĐỀ */}
      {editingSeparatedTestIndex !== null && separatedTests[editingSeparatedTestIndex] && (
        <EditQuestionsModal
          testTitle={separatedTests[editingSeparatedTestIndex].title || 'Đề kiểm tra'}
          initialQuestions={separatedTests[editingSeparatedTestIndex].questions || []}
          isOpen={true}
          onClose={() => setEditingSeparatedTestIndex(null)}
          onSave={async (updated) => {
            setSeparatedTests(prev => {
              const copy = [...prev];
              if (copy[editingSeparatedTestIndex]) {
                copy[editingSeparatedTestIndex].questions = updated;
                copy[editingSeparatedTestIndex].mcqCount = updated.filter((q: any) => q.type === 'mcq').length;
                copy[editingSeparatedTestIndex].tfCount = updated.filter((q: any) => q.type === 'tf').length;
                copy[editingSeparatedTestIndex].shortCount = updated.filter((q: any) => q.type === 'short').length;
                copy[editingSeparatedTestIndex].essayCount = updated.filter((q: any) => q.type === 'essay').length;
              }
              return copy;
            });
            setEditingSeparatedTestIndex(null);
          }}
        />
      )}

      {/* MODAL CHỌN TÀI LIỆU THAM CHIẾU TỪ THƯ VIỆN */}
      {showRefSelectorModal && (
        <DocumentReferenceSelectorModal
          isOpen={showRefSelectorModal}
          onClose={() => setShowRefSelectorModal(false)}
          initialGrade={parseInt(newGrade, 10) || 9}
          onSelect={(ref) => {
            setActiveRef(ref);
            if (ref.grade) setNewGrade(ref.grade.toString());
            if (ref.topicId) setNewTopicId(ref.topicId);
            if (!newTitle.trim()) {
              setNewTitle(ref.lessonTitle || ref.attachment?.name || '');
            }
            if (ref.knowledge && setReferenceNotes) {
              setReferenceNotes(ref.knowledge);
            }
          }}
        />
      )}
    </div>
  );
};
