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
  Pencil,
  FolderOpen,
  FolderPlus,
  ShieldCheck,
  Scale
} from 'lucide-react';
import { updateDoc, doc, addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import MathText from '../MathText';
import MathRadicalInput from '../common/MathRadicalInput';
import { repairVietnameseDocument, convertTcvn3ToUnicode, healMathSvg } from '../../lib/vietnameseFont';
import EditQuestionsModal from './EditQuestionsModal';
import ExamCreationFourSections from './ExamCreationFourSections';
import UploadQuestionsReviewList from './UploadQuestionsReviewList';
import { QuestionItem, QuestionType } from '../../types/test';
import DocumentReferenceSelectorModal, { SelectedDocumentReference } from './DocumentReferenceSelectorModal';
import { dataUrlToFile, ensureAttachmentDataUrl } from '../../lib/fileUtils';
import { autoReconcileQuestion, checkMcqAnswer, autoEstablishScoringRubric } from '../../utils/gradeEngine';
import { getCurrentSchoolYear, formatSchoolYear, getStandardSchoolYears, matchesSchoolYear } from '../../utils/schoolYear';
import { isPureSectionHeader, isTheoryQuestion, healQuestionOptions } from '../../utils/practiceFormatter';

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
  matrixSourceType: 'preset' | 'file' | 'text';
  setMatrixSourceType: (s: 'preset' | 'file' | 'text') => void;
  matrixText?: string;
  setMatrixText?: (t: string) => void;
  uploadSourceType?: 'file' | 'text';
  setUploadSourceType?: (s: 'file' | 'text') => void;
  uploadPastedText?: string;
  setUploadPastedText?: (t: string) => void;
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
  customEssayEnabled?: boolean;
  setCustomEssayEnabled?: (v: boolean) => void;
  customEssayItems?: any[];
  setCustomEssayItems?: React.Dispatch<React.SetStateAction<any[]>>;
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
  matrixText = '',
  setMatrixText = () => {},
  uploadSourceType = 'file',
  setUploadSourceType = () => {},
  uploadPastedText = '',
  setUploadPastedText = () => {},
  matrixConfig,
  setMatrixConfig,
  selectedMatrixPreset,
  setSelectedMatrixPreset,
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
  customEssayEnabled,
  setCustomEssayEnabled,
  customEssayItems,
  setCustomEssayItems,
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
  // Khi ở chế độ 'upload', không sử dụng tham chiếu tài liệu thư viện vì bóc tách trực tiếp 100% từ đề gốc tải lên
  const activeRef = onlineCreationMode === 'upload' ? null : (selectedReference !== undefined ? selectedReference : localRef);
  const setActiveRef = setSelectedReference || setLocalRef;

  // Trạng thái cho tính năng: Tải lên tài liệu đề thi đơn lẻ -> Trích xuất câu hỏi và hiển thị ngay giao diện chỉnh sửa
  const [singleUploadedQuestions, setSingleUploadedQuestions] = React.useState<QuestionItem[]>([]);
  const [isExtractingSingleFile, setIsExtractingSingleFile] = React.useState(false);
  const [singleExtractError, setSingleExtractError] = React.useState('');
  const [showEditSingleQuestionsModal, setShowEditSingleQuestionsModal] = React.useState(false);
  const [showReviewSingleQuestions, setShowReviewSingleQuestions] = React.useState(true);
  const [autoFilledInfo, setAutoFilledInfo] = React.useState<{
    title?: string;
    grade?: number | string;
    durationMinutes?: number | string;
    schoolYear?: string;
    schoolOrOrg?: string;
    examFormat?: string;
    suggestedTopic?: string;
    questionsCount?: number;
  } | null>(null);

  // Trạng thái tạo nhanh chuyên đề mới ngay tại chỗ
  const [isCreatingNewTopic, setIsCreatingNewTopic] = React.useState(false);
  const [newTopicInputName, setNewTopicInputName] = React.useState('');
  const [isSavingTopic, setIsSavingTopic] = React.useState(false);

  const handleCreateQuickTopic = async () => {
    if (!newTopicInputName.trim()) return;
    setIsSavingTopic(true);
    try {
      const gNum = parseInt(newGrade, 10) || 12;
      const newTopicData = {
        name: newTopicInputName.trim(),
        grade: gNum,
        isSpecial: false,
        schoolYear: newSchoolYear || getCurrentSchoolYear(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'topics'), newTopicData);
      const createdId = docRef.id;
      topics.push({ id: createdId, ...newTopicData });
      setNewTopicId(createdId);
      setNewTopicInputName('');
      setIsCreatingNewTopic(false);
    } catch (err: any) {
      console.error("Error creating quick topic:", err);
    } finally {
      setIsSavingTopic(false);
    }
  };

  // Tính tổng biểu điểm hiện tại của toàn bộ đề thi
  const totalCalculatedPoints = React.useMemo(() => {
    return singleUploadedQuestions.reduce((acc, q) => acc + (typeof q.points === 'number' && !isNaN(q.points) ? q.points : 0), 0);
  }, [singleUploadedQuestions]);

  // Tự động cân bằng và phân bổ biểu điểm về tròn 10.0 điểm
  const handleAutoBalancePoints = () => {
    if (singleUploadedQuestions.length === 0) return;
    const balanced = autoEstablishScoringRubric(singleUploadedQuestions);
    setSingleUploadedQuestions(balanced);
  };

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

      const resJson = await res.json();
      const rawExtracted = Array.isArray(resJson) ? resJson : (resJson.questions || []);
      const testInfo = (!Array.isArray(resJson) && resJson.testInfo) ? resJson.testInfo : null;

      if (Array.isArray(rawExtracted) && rawExtracted.length > 0) {
        const extracted = rawExtracted
          .filter((rawQ: any) => !isPureSectionHeader(rawQ.question || '') && !isTheoryQuestion(rawQ))
          .map((rawQ: any) => {
            const healedQ = healQuestionOptions(autoReconcileQuestion(rawQ).question);
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
        const rubricQuestions = autoEstablishScoringRubric(extracted);
        setSingleUploadedQuestions(rubricQuestions);

        // 1. Tự động nhận diện và điền Tên đề thi
        const autoTitle = testInfo?.title 
          ? repairVietnameseDocument(convertTcvn3ToUnicode(testInfo.title))
          : repairVietnameseDocument(convertTcvn3ToUnicode(targetFile.name.replace(/\.[^/.]+$/, "")));
        setNewTitle(autoTitle);

        // 2. Tự động nhận diện và điền Khối lớp
        const detectedGrade = testInfo?.grade ? Number(testInfo.grade) : parseInt(newGrade, 10);
        if (detectedGrade >= 6 && detectedGrade <= 12) {
          setNewGrade(detectedGrade.toString());
        }

        // 3. Tự động nhận diện và điền Thời gian làm bài (phút)
        if (testInfo?.durationMinutes) {
          setNewDuration(testInfo.durationMinutes.toString());
        }

        // 4. Tự động nhận diện và điền Năm học
        if (testInfo?.schoolYear) {
          setNewSchoolYear(testInfo.schoolYear);
        }

        // 5. Tự động khớp Chủ đề / Chương phù hợp theo khối lớp và tên đề
        const gradeTopics = topics.filter(t => t.grade === (detectedGrade || 12));
        if (gradeTopics.length > 0) {
          let matched = null;
          const searchStr = (autoTitle + ' ' + (testInfo?.suggestedTopic || '')).toLowerCase();
          for (const t of gradeTopics) {
            const tName = ((t as any).name || (t as any).title || '').toLowerCase();
            const words = tName.split(/\s+/).filter((w: string) => w.length > 3);
            if (words.some((w: string) => searchStr.includes(w))) {
              matched = t;
              break;
            }
          }
          if (matched) {
            setNewTopicId(matched.id);
          } else if (!newTopicId && gradeTopics[0]) {
            setNewTopicId(gradeTopics[0].id);
          }
        }

        // 6. Tự động cập nhật định dạng đề
        if (testInfo?.examFormat) {
          setExamFormat(testInfo.examFormat);
          setAutoGenType(testInfo.examFormat);
        }

        setAutoFilledInfo({
          title: autoTitle,
          grade: detectedGrade,
          durationMinutes: testInfo?.durationMinutes || parseInt(newDuration, 10),
          schoolYear: testInfo?.schoolYear || newSchoolYear,
          schoolOrOrg: testInfo?.schoolOrOrg || '',
          examFormat: testInfo?.examFormat || examFormat,
          suggestedTopic: testInfo?.suggestedTopic || '',
          questionsCount: extracted.length
        });
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

  // Trích xuất câu hỏi từ nội dung văn bản copy & paste
  const handleExtractSingleTextQuestions = async (textToExtract?: string) => {
    const targetText = textToExtract || uploadPastedText;
    if (!targetText || targetText.trim().length < 10) {
      setSingleExtractError('Vui lòng dán hoặc nhập nội dung đề bài (tối thiểu 10 ký tự) để AI trích xuất câu hỏi.');
      return;
    }
    setIsExtractingSingleFile(true);
    setSingleExtractError('');
    try {
      const apiKey = localStorage.getItem('gemini_api_key') || localStorage.getItem('custom_gemini_api_key') || '';
      const res = await fetch('/api/extract-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-gemini-api-key': apiKey } : {})
        },
        body: JSON.stringify({
          extractedText: repairVietnameseDocument(convertTcvn3ToUnicode(targetText)),
          fileName: 'de_thi_dan_truc_tiep.txt'
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.details || errJson.error || `Lỗi trích xuất câu hỏi (${res.status})`);
      }

      const resJson = await res.json();
      const rawExtracted = Array.isArray(resJson) ? resJson : (resJson.questions || []);
      const testInfo = (!Array.isArray(resJson) && resJson.testInfo) ? resJson.testInfo : null;

      if (Array.isArray(rawExtracted) && rawExtracted.length > 0) {
        const extracted = rawExtracted
          .filter((rawQ: any) => !isPureSectionHeader(rawQ.question || '') && !isTheoryQuestion(rawQ))
          .map((rawQ: any) => {
            const healedQ = healQuestionOptions(autoReconcileQuestion(rawQ).question);
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
        const rubricQuestions = autoEstablishScoringRubric(extracted);
        setSingleUploadedQuestions(rubricQuestions);

        // 1. Tự động nhận diện và điền Tên đề thi
        const autoTitle = testInfo?.title 
          ? repairVietnameseDocument(convertTcvn3ToUnicode(testInfo.title))
          : (newTitle && !newTitle.startsWith('Đề ') && newTitle !== '' ? newTitle : `Đề kiểm tra Toán lớp ${newGrade}`);
        setNewTitle(autoTitle);

        // 2. Tự động nhận diện và điền Khối lớp
        const detectedGrade = testInfo?.grade ? Number(testInfo.grade) : parseInt(newGrade, 10);
        if (detectedGrade >= 6 && detectedGrade <= 12) {
          setNewGrade(detectedGrade.toString());
        }

        // 3. Tự động nhận diện và điền Thời gian làm bài (phút)
        if (testInfo?.durationMinutes) {
          setNewDuration(testInfo.durationMinutes.toString());
        }

        // 4. Tự động nhận diện và điền Năm học
        if (testInfo?.schoolYear) {
          setNewSchoolYear(testInfo.schoolYear);
        }

        // 5. Tự động khớp Chủ đề / Chương phù hợp theo khối lớp và tên đề
        const gradeTopics = topics.filter(t => t.grade === (detectedGrade || 12));
        if (gradeTopics.length > 0) {
          let matched = null;
          const searchStr = (autoTitle + ' ' + (testInfo?.suggestedTopic || '')).toLowerCase();
          for (const t of gradeTopics) {
            const tName = ((t as any).name || (t as any).title || '').toLowerCase();
            const words = tName.split(/\s+/).filter((w: string) => w.length > 3);
            if (words.some((w: string) => searchStr.includes(w))) {
              matched = t;
              break;
            }
          }
          if (matched) {
            setNewTopicId(matched.id);
          } else if (!newTopicId && gradeTopics[0]) {
            setNewTopicId(gradeTopics[0].id);
          }
        }

        // 6. Tự động cập nhật định dạng đề
        if (testInfo?.examFormat) {
          setExamFormat(testInfo.examFormat);
          setAutoGenType(testInfo.examFormat);
        }

        setAutoFilledInfo({
          title: autoTitle,
          grade: detectedGrade,
          durationMinutes: testInfo?.durationMinutes || parseInt(newDuration, 10),
          schoolYear: testInfo?.schoolYear || newSchoolYear,
          schoolOrOrg: testInfo?.schoolOrOrg || '',
          examFormat: testInfo?.examFormat || examFormat,
          suggestedTopic: testInfo?.suggestedTopic || '',
          questionsCount: extracted.length
        });
      } else {
        throw new Error("Không phát hiện được câu hỏi nào từ nội dung dán. Bạn có thể kiểm tra lại văn bản hoặc thêm câu hỏi thủ công.");
      }
    } catch (err: any) {
      console.error("Single text extract error:", err);
      setSingleExtractError(err.message || "Lỗi khi trích xuất câu hỏi từ văn bản dán");
    } finally {
      setIsExtractingSingleFile(false);
    }
  };

  const handleExtractFromRefKnowledge = async () => {
    if (!activeRef?.knowledge) return;
    setIsExtractingSingleFile(true);
    setSingleExtractError('');
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
      const resJson = await res.json();
      const rawExtracted = Array.isArray(resJson) ? resJson : (resJson.questions || []);
      const testInfo = (!Array.isArray(resJson) && resJson.testInfo) ? resJson.testInfo : null;

      if (Array.isArray(rawExtracted) && rawExtracted.length > 0) {
        const extracted = rawExtracted
          .filter((rawQ: any) => !isPureSectionHeader(rawQ.question || '') && !isTheoryQuestion(rawQ))
          .map((rawQ: any) => {
            const healedQ = healQuestionOptions(autoReconcileQuestion(rawQ).question);
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
        const rubricQuestions = autoEstablishScoringRubric(extracted);
        setSingleUploadedQuestions(rubricQuestions);

        if (testInfo?.title) setNewTitle(repairVietnameseDocument(convertTcvn3ToUnicode(testInfo.title)));
        if (testInfo?.grade) setNewGrade(testInfo.grade.toString());
        if (testInfo?.durationMinutes) setNewDuration(testInfo.durationMinutes.toString());
        if (testInfo?.schoolYear) setNewSchoolYear(testInfo.schoolYear);
        if (testInfo?.examFormat) {
          setExamFormat(testInfo.examFormat);
          setAutoGenType(testInfo.examFormat);
        }

        setAutoFilledInfo({
          title: testInfo?.title || newTitle,
          grade: testInfo?.grade || newGrade,
          durationMinutes: testInfo?.durationMinutes || newDuration,
          schoolYear: testInfo?.schoolYear || newSchoolYear,
          schoolOrOrg: testInfo?.schoolOrOrg || '',
          examFormat: testInfo?.examFormat || examFormat,
          suggestedTopic: testInfo?.suggestedTopic || '',
          questionsCount: extracted.length
        });

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
    setAutoFilledInfo(null);
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
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span>
                    {editingTestId 
                      ? (onlineCreationMode === 'auto' ? 'Chỉnh sửa đề thi tự động' : (onlineCreationMode === 'upload' ? 'Chỉnh sửa đề tải lên' : 'Chỉnh sửa đề theo ma trận'))
                      : (onlineCreationMode === 'auto' ? '1. Tạo đề thi tự động' : (onlineCreationMode === 'upload' ? '2. Tạo đề từ đề tải lên' : '3. Tạo đề theo ma trận'))
                    }
                  </span>
                </h2>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  onlineCreationMode === 'auto'
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : (onlineCreationMode === 'upload' 
                        ? 'bg-indigo-100 text-indigo-800 border-indigo-200' 
                        : 'bg-purple-100 text-purple-800 border-purple-200')
                }`}>
                  {onlineCreationMode === 'auto' 
                    ? '1. Tự động chuẩn hóa (4 phần)' 
                    : (onlineCreationMode === 'upload' 
                        ? '2. Đề tải lên hoặc dán trực tiếp (2 phần)' 
                        : '3. Theo ma trận & bản đặc tả (2 phần)')}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {onlineCreationMode === 'auto' 
                  ? 'Quy trình 4 phần: 1. Hình thức đề thi → 2. Tài liệu tham chiếu → 3. Phạm vi kiến thức → 4. Thông tin cơ bản đề thi'
                  : (onlineCreationMode === 'upload' 
                      ? 'Quy trình 2 phần: 1. Tải lên tệp hoặc dán nội dung đề bài (100% bám sát đề gốc) → 2. Thông tin cơ bản đề thi'
                      : 'Quy trình 2 phần: 1. Ma trận đề thi & bản đặc tả (Tải tệp / Dán trực tiếp, tài liệu tham chiếu mặc định) → 2. Thông tin đề thi')}
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
          {/* BỐ CỤC 4 PHẦN TẠO ĐỀ THI TỰ ĐỘNG                               */}
          {/* 1. Phương thức tạo đề                                         */}
          {/* 2. Hình thức đề thi                                           */}
          {/* 3. Tài liệu tham chiếu                                         */}
          {/* 4. Thông tin cơ bản đề thi                                     */}
          {/* ============================================================ */}
          <ExamCreationFourSections
            onlineCreationMode={onlineCreationMode}
            setOnlineCreationMode={setOnlineCreationMode}
            customEssayEnabled={customEssayEnabled}
            setCustomEssayEnabled={setCustomEssayEnabled}
            customEssayItems={customEssayItems}
            setCustomEssayItems={setCustomEssayItems}
            matrixSourceType={matrixSourceType}
            setMatrixSourceType={setMatrixSourceType}
            matrixText={matrixText}
            setMatrixText={setMatrixText}
            uploadSourceType={uploadSourceType}
            setUploadSourceType={setUploadSourceType}
            uploadPastedText={uploadPastedText}
            setUploadPastedText={setUploadPastedText}
            onExtractSingleTextQuestions={handleExtractSingleTextQuestions}
            matrixPresets={matrixPresets}
            selectedMatrixPreset={selectedMatrixPreset}
            applyMatrixPreset={applyMatrixPreset}
            matrixConfig={matrixConfig}
            setMatrixConfig={setMatrixConfig}
            matrixFile={matrixFile}
            setMatrixFile={setMatrixFile}
            newFile={newFile}
            setNewFile={setNewFile}
            splitAnswers={splitAnswers}
            setSplitAnswers={setSplitAnswers}
            newAnswerFile={newAnswerFile}
            setNewAnswerFile={setNewAnswerFile}
            isExtractingSingleFile={isExtractingSingleFile}
            singleExtractError={singleExtractError}
            onExtractSingleFileQuestions={handleExtractSingleFileQuestions}
            singleUploadedQuestions={singleUploadedQuestions}
            totalCalculatedPoints={totalCalculatedPoints}
            onAutoBalancePoints={handleAutoBalancePoints}
            onOpenEditModal={() => setShowEditSingleQuestionsModal(true)}
            onAddQuestionToSingle={handleAddQuestionToSingle}
            showReviewSingleQuestions={showReviewSingleQuestions}
            onToggleReviewSingleQuestions={() => setShowReviewSingleQuestions(!showReviewSingleQuestions)}
            onUpdateSingleQuestion={handleUpdateSingleQuestion}
            onDuplicateSingleQuestion={handleDuplicateSingleQuestion}
            onDeleteSingleQuestion={handleDeleteSingleQuestion}

            examFormat={examFormat}
            setExamFormat={setExamFormat}
            setAutoGenType={setAutoGenType}
            formatPresets={formatPresets}
            activePresetId={activePresetId}
            applyPreset={applyPreset}
            part1Count={part1Count}
            setPart1Count={setPart1Count}
            part2Count={part2Count}
            setPart2Count={setPart2Count}
            part3Count={part3Count}
            setPart3Count={setPart3Count}
            customPart1Enabled={customPart1Enabled}
            setCustomPart1Enabled={setCustomPart1Enabled}
            customPart1Count={customPart1Count}
            setCustomPart1Count={setCustomPart1Count}
            customPart2Enabled={customPart2Enabled}
            setCustomPart2Enabled={setCustomPart2Enabled}
            customPart2Count={customPart2Count}
            setCustomPart2Count={setCustomPart2Count}
            customPart3Enabled={customPart3Enabled}
            setCustomPart3Enabled={setCustomPart3Enabled}
            customPart3Count={customPart3Count}
            setCustomPart3Count={setCustomPart3Count}
            essayCount={essayCount}
            setEssayCount={setEssayCount}
            mcqCount={mcqCount}
            setMcqCount={setMcqCount}
            setSysError={setSysError}

            activeRef={activeRef}
            setActiveRef={setActiveRef}
            onOpenRefSelectorModal={() => setShowRefSelectorModal(true)}
            onLoadRefAttachmentAsTest={() => {
              if (activeRef?.attachment?.dataUrl) {
                try {
                  const file = dataUrlToFile(
                    activeRef.attachment.dataUrl,
                    activeRef.attachment.name,
                    activeRef.attachment.type
                  );
                  setNewFile(file);
                  setOnlineCreationMode("upload");
                  handleExtractSingleFileQuestions(file);
                } catch (err) {
                  console.error("Error loading file from reference:", err);
                }
              }
            }}
            onExtractFromRefKnowledge={handleExtractFromRefKnowledge}
            referenceFile={referenceFile}
            setReferenceFile={setReferenceFile}
            referenceNotes={referenceNotes}
            setReferenceNotes={setReferenceNotes}
            topics={topics}
            lessons={lessons}

            newTitle={newTitle}
            setNewTitle={setNewTitle}
            newSchoolYear={newSchoolYear}
            setNewSchoolYear={setNewSchoolYear}
            newGrade={newGrade}
            setNewGrade={setNewGrade}
            newDuration={newDuration}
            setNewDuration={setNewDuration}
            newTopicId={newTopicId}
            setNewTopicId={setNewTopicId}
            isCreatingNewTopic={isCreatingNewTopic}
            setIsCreatingNewTopic={setIsCreatingNewTopic}
            newTopicInputName={newTopicInputName}
            setNewTopicInputName={setNewTopicInputName}
            isSavingTopic={isSavingTopic}
            onSaveQuickTopic={handleCreateQuickTopic}
            createMultiVariant={createMultiVariant}
            setCreateMultiVariant={setCreateMultiVariant}
            createVariantMethod={createVariantMethod}
            setCreateVariantMethod={setCreateVariantMethod}
            customVariantCodes={customVariantCodes}
            setCustomVariantCodes={setCustomVariantCodes}
            shuffleQuestions={shuffleQuestions}
            setShuffleQuestions={setShuffleQuestions}
            shuffleOptions={shuffleOptions}
            setShuffleOptions={setShuffleOptions}
          />

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
