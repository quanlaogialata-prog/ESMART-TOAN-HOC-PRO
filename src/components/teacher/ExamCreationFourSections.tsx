import React from 'react';
import {
  Sparkles,
  Upload,
  LayoutGrid,
  BookOpen,
  BookOpenCheck,
  BookMarked,
  Clock,
  Check,
  Layers,
  Shuffle,
  Scale,
  CheckCircle2,
  FileText,
  Loader2,
  AlertCircle,
  RefreshCw,
  Plus,
  FolderPlus,
  FileCode,
  X,
  Target,
  Library,
  Lightbulb,
  GraduationCap,
  Search,
  Bookmark,
  ChevronRight
} from 'lucide-react';
import { QuestionItem } from '../../types/test';
import { SelectedDocumentReference } from './DocumentReferenceSelectorModal';
import { getCurrentSchoolYear, formatSchoolYear, getStandardSchoolYears, matchesSchoolYear } from '../../utils/schoolYear';
import { getCurriculumTopicsByGrade, CurriculumTopic } from '../../data/curriculumTopics';
import UploadQuestionsReviewList from './UploadQuestionsReviewList';
import { Sliders, Wand2, Edit3, Copy, Trash2, HelpCircle, FileSpreadsheet, Download, FileCheck, Clipboard, FileType } from 'lucide-react';

export const SAMPLE_EXAM_PASTE_TEXT = `ĐỀ KIỂM TRA MÔN TOÁN
Thời gian làm bài: 90 phút

PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn. Thí sinh trả lời từ câu 1 đến câu 4.
Câu 1: Cho hàm số y = f(x) có bảng biến thiên trên khoảng (-∞; +∞). Hàm số đồng biến trên khoảng nào dưới đây?
A. (0; 2)
B. (-∞; 0)
C. (2; +∞)
D. (-1; 1)
Đáp án: A
Lời giải: Dựa vào bảng biến thiên, đạo hàm f'(x) mang dấu dương trên (0; 2), do đó hàm số đồng biến trên khoảng (0; 2).

Câu 2: Nghiệm của phương trình 2^(x - 1) = 8 là:
A. x = 4
B. x = 3
C. x = 2
D. x = 1
Đáp án: A
Lời giải: Ta có 2^(x - 1) = 8 = 2^3 <=> x - 1 = 3 <=> x = 4.

PHẦN II. Câu trắc nghiệm đúng sai. Thí sinh trả lời câu 1. Trong mỗi ý a), b), c), d), thí sinh chọn đúng hoặc sai.
Câu 1: Cho hàm số f(x) = x^3 - 3x + 2.
a) Đạo hàm của hàm số là f'(x) = 3x^2 - 3.
b) Phương trình f'(x) = 0 có hai nghiệm phân biệt là x = 1 và x = -1.
c) Điểm cực đại của đồ thị hàm số là (1; 0).
d) Giá trị cực tiểu của hàm số bằng 4.
Đáp án: a-Đ, b-Đ, c-S, d-S
Lời giải:
a) Đúng vì f'(x) = 3x^2 - 3.
b) Đúng vì 3x^2 - 3 = 0 <=> x = ±1.
c) Sai vì điểm cực đại là (-1; 4).
d) Sai vì giá trị cực tiểu tại x = 1 là f(1) = 0.

PHẦN III. Câu trắc nghiệm trả lời ngắn. Thí sinh trả lời câu 1.
Câu 1: Một vật chuyển động theo quy luật s(t) = -t^3 + 6t^2 + 9t với t là thời gian tính bằng giây và s là quãng đường tính bằng mét. Vận tốc lớn nhất của vật đạt được bằng bao nhiêu m/s?
Đáp án: 21
Lời giải: Vận tốc tức thời v(t) = s'(t) = -3t^2 + 12t + 9 = -3(t - 2)^2 + 21 <= 21. Vận tốc lớn nhất đạt 21 m/s khi t = 2.`;

export const SAMPLE_MATRIX_SPEC_TEXT = `I. KHUNG MA TRẬN ĐỀ THI KIỂM TRA MÔN TOÁN
- Mạch kiến thức chính: Đại số & Một số yếu tố giải tích; Hình học & Đo lường
- Tỉ lệ mức độ nhận thức: Nhận biết: 40%, Thông hiểu: 30%, Vận dụng: 20%, Vận dụng cao: 10%
- Cấu trúc đề thi:
  + Phần I: 12 câu trắc nghiệm nhiều phương án lựa chọn (A, B, C, D)
  + Phần II: 4 câu trắc nghiệm Đúng/Sai (mỗi câu gồm 4 ý a, b, c, d)
  + Phần III: 6 câu trắc nghiệm Trả lời ngắn

II. BẢN ĐẶC TẢ CHI TIẾT CÂU HỎI VÀ YÊU CẦU CẦN ĐẠT
1. PHẦN I: TRẮC NGHIỆM NHIỀU LỰA CHỌN (12 CÂU)
- Câu 1 (NB): Nhận biết khái niệm, định nghĩa và tính chất cơ bản.
- Câu 2 (NB): Nhận diện công thức toán học và tập xác định.
- Câu 3 (NB): Xác định đồ thị, bảng biến thiên hoặc hình vẽ minh họa.
- Câu 4 (NB): Tính toán trực tiếp bằng 1 bước biến đổi đơn giản.
- Câu 5 (NB): Nhận biết yếu tố hình học cơ bản (vectơ, góc, khoảng cách, tọa độ).
- Câu 6 (TH): Áp dụng công thức tìm nghiệm hoặc tính giá trị biểu thức.
- Câu 7 (TH): Biến đổi phương trình, bất phương trình cơ bản.
- Câu 8 (TH): Đọc thông tin từ bảng số liệu, đồ thị để suy ra kết luận.
- Câu 9 (TH): Tính thể tích, diện tích hoặc quan hệ vuông góc/song song.
- Câu 10 (TH): Xác định hệ số, tọa độ đỉnh hoặc tâm đường tròn.
- Câu 11 (VD): Giải bài toán liên kết 2 bước kiến thức.
- Câu 12 (VD): Bài toán thực tế mức độ đơn giản.

2. PHẦN II: TRẮC NGHIỆM ĐÚNG/SAI (4 CÂU)
- Câu 1 (NB-TH): Khảo sát tính đúng sai của hàm số/biểu thức (ý a, b mức NB; ý c, d mức TH).
- Câu 2 (TH-VD): Bài toán hình học không gian hoặc tọa độ (ý a, b mức TH; ý c, d mức VD).
- Câu 3 (TH-VD): Phương trình, hệ phương trình hoặc bài toán xác suất (ý a, b mức TH; ý c, d mức VD).
- Câu 4 (VD-VDC): Ứng dụng thực tế hoặc bài toán liên môn (ý a, b mức TH; ý c, d mức VD - VDC).

3. PHẦN III: TRẢ LỜI NGẮN (6 CÂU)
- Câu 1 (VD): Tìm số nghiệm nguyên hoặc số giá trị tham số m thỏa mãn điều kiện.
- Câu 2 (VD): Tính diện tích hình phẳng hoặc thể tích khối đa diện.
- Câu 3 (VD): Bài toán xác suất hoặc thống kê thực tế.
- Câu 4 (VD): Bài toán tối ưu hóa / cực trị trong đời sống.
- Câu 5 (VDC): Bài toán phân loại nâng cao, tìm giá trị lớn nhất / nhỏ nhất.
- Câu 6 (VDC): Bài toán tư duy sáng tạo, tích hợp liên môn.`;

export interface CustomEssayItem {
  id: string;
  order: number;
  title: string;
  topicScope: string;
  description: string;
  points: number;
  level: 'NB' | 'TH' | 'VD' | 'VDC';
}

export interface ExamCreationFourSectionsProps {
  // Section 1: Phương thức tạo đề
  onlineCreationMode: 'auto' | 'upload' | 'matrix';
  setOnlineCreationMode: (mode: 'auto' | 'upload' | 'matrix') => void;
  customEssayEnabled?: boolean;
  setCustomEssayEnabled?: (v: boolean) => void;
  customEssayItems?: CustomEssayItem[];
  setCustomEssayItems?: React.Dispatch<React.SetStateAction<CustomEssayItem[]>>;
  matrixSourceType: 'preset' | 'file' | 'text';
  setMatrixSourceType: (type: 'preset' | 'file' | 'text') => void;
  matrixText?: string;
  setMatrixText?: (text: string) => void;
  uploadSourceType?: 'file' | 'text';
  setUploadSourceType?: (type: 'file' | 'text') => void;
  uploadPastedText?: string;
  setUploadPastedText?: (text: string) => void;
  onExtractSingleTextQuestions?: (text?: string) => void;
  matrixPresets: any[];
  selectedMatrixPreset: string;
  applyMatrixPreset: (preset: any) => void;
  matrixConfig: any;
  setMatrixConfig?: React.Dispatch<React.SetStateAction<any>>;
  matrixFile?: File | null;
  setMatrixFile: (file: File | null) => void;
  newFile: File | null;
  setNewFile: (file: File | null) => void;
  splitAnswers: boolean;
  setSplitAnswers: (val: boolean) => void;
  newAnswerFile: File | null;
  setNewAnswerFile: (file: File | null) => void;
  isExtractingSingleFile: boolean;
  singleExtractError: string;
  onExtractSingleFileQuestions: (file?: File) => void;
  singleUploadedQuestions: QuestionItem[];
  totalCalculatedPoints: number;
  onAutoBalancePoints: () => void;
  onOpenEditModal: () => void;
  onAddQuestionToSingle: () => void;
  showReviewSingleQuestions: boolean;
  onToggleReviewSingleQuestions: () => void;
  onUpdateSingleQuestion: (index: number, updatedFields: Partial<QuestionItem>) => void;
  onDuplicateSingleQuestion: (index: number) => void;
  onDeleteSingleQuestion: (index: number) => void;

  // Section 2: Hình thức đề thi
  examFormat: 'mcq_3part' | 'mcq_custom' | 'essay' | 'mixed';
  setExamFormat: (f: 'mcq_3part' | 'mcq_custom' | 'essay' | 'mixed') => void;
  setAutoGenType: (t: any) => void;
  formatPresets: Record<string, any[]>;
  activePresetId: string | null;
  applyPreset: (preset: any, format: string) => void;
  part1Count: string;
  setPart1Count: (v: string) => void;
  part2Count: string;
  setPart2Count: (v: string) => void;
  part3Count: string;
  setPart3Count: (v: string) => void;
  customPart1Enabled: boolean;
  setCustomPart1Enabled: (v: boolean) => void;
  customPart1Count: string;
  setCustomPart1Count: (v: string) => void;
  customPart2Enabled: boolean;
  setCustomPart2Enabled: (v: boolean) => void;
  customPart2Count: string;
  setCustomPart2Count: (v: string) => void;
  customPart3Enabled: boolean;
  setCustomPart3Enabled: (v: boolean) => void;
  customPart3Count: string;
  setCustomPart3Count: (v: string) => void;
  essayCount: string;
  setEssayCount: (v: string) => void;
  mcqCount: string;
  setMcqCount: (v: string) => void;
  setSysError?: (msg: string) => void;

  // Section 3: Tài liệu tham chiếu
  activeRef: SelectedDocumentReference | null;
  setActiveRef: (ref: SelectedDocumentReference | null) => void;
  onOpenRefSelectorModal: () => void;
  onLoadRefAttachmentAsTest: () => void;
  onExtractFromRefKnowledge: () => void;
  referenceFile: File | null;
  setReferenceFile: (file: File | null) => void;
  referenceNotes: string;
  setReferenceNotes: (notes: string) => void;
  topics: any[];
  lessons: any[];

  // Section 4: Thông tin cơ bản đề thi
  newTitle: string;
  setNewTitle: (title: string) => void;
  newSchoolYear: string;
  setNewSchoolYear: (sy: string) => void;
  newGrade: string;
  setNewGrade: (g: string) => void;
  newDuration: string;
  setNewDuration: (d: string) => void;
  newTopicId: string;
  setNewTopicId: (tId: string) => void;
  isCreatingNewTopic: boolean;
  setIsCreatingNewTopic: (v: boolean) => void;
  newTopicInputName: string;
  setNewTopicInputName: (name: string) => void;
  isSavingTopic: boolean;
  onSaveQuickTopic: () => Promise<void>;
  createMultiVariant: boolean;
  setCreateMultiVariant: (v: boolean) => void;
  createVariantMethod: 'isomorphic' | 'shuffle';
  setCreateVariantMethod: (v: 'isomorphic' | 'shuffle') => void;
  customVariantCodes: string;
  setCustomVariantCodes: (v: string) => void;
  shuffleQuestions: boolean;
  setShuffleQuestions: (v: boolean) => void;
  shuffleOptions: boolean;
  setShuffleOptions: (v: boolean) => void;
}

export const ExamCreationFourSections: React.FC<ExamCreationFourSectionsProps> = ({
  onlineCreationMode,
  setOnlineCreationMode,
  customEssayEnabled,
  setCustomEssayEnabled,
  customEssayItems,
  setCustomEssayItems,
  matrixSourceType,
  setMatrixSourceType,
  matrixText = '',
  setMatrixText = () => {},
  uploadSourceType = 'file',
  setUploadSourceType = () => {},
  uploadPastedText = '',
  setUploadPastedText = () => {},
  onExtractSingleTextQuestions = () => {},
  matrixPresets,
  selectedMatrixPreset,
  applyMatrixPreset,
  matrixConfig,
  setMatrixConfig,
  matrixFile,
  setMatrixFile,
  newFile,
  setNewFile,
  splitAnswers,
  setSplitAnswers,
  newAnswerFile,
  setNewAnswerFile,
  isExtractingSingleFile,
  singleExtractError,
  onExtractSingleFileQuestions,
  singleUploadedQuestions,
  totalCalculatedPoints,
  onAutoBalancePoints,
  onOpenEditModal,
  onAddQuestionToSingle,
  showReviewSingleQuestions,
  onToggleReviewSingleQuestions,
  onUpdateSingleQuestion,
  onDuplicateSingleQuestion,
  onDeleteSingleQuestion,

  examFormat,
  setExamFormat,
  setAutoGenType,
  formatPresets,
  activePresetId,
  applyPreset,
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
  essayCount,
  setEssayCount,
  mcqCount,
  setMcqCount,
  setSysError,

  activeRef,
  setActiveRef,
  onOpenRefSelectorModal,
  onLoadRefAttachmentAsTest,
  onExtractFromRefKnowledge,
  referenceFile,
  setReferenceFile,
  referenceNotes,
  setReferenceNotes,
  topics,
  lessons,

  newTitle,
  setNewTitle,
  newSchoolYear,
  setNewSchoolYear,
  newGrade,
  setNewGrade,
  newDuration,
  setNewDuration,
  newTopicId,
  setNewTopicId,
  isCreatingNewTopic,
  setIsCreatingNewTopic,
  newTopicInputName,
  setNewTopicInputName,
  isSavingTopic,
  onSaveQuickTopic,
  createMultiVariant,
  setCreateMultiVariant,
  createVariantMethod,
  setCreateVariantMethod,
  customVariantCodes,
  setCustomVariantCodes,
  shuffleQuestions,
  setShuffleQuestions,
  shuffleOptions,
  setShuffleOptions
}) => {
  // Quản lý cấu hình bài toán tự luận tùy biến

  const defaultCustomEssayList: CustomEssayItem[] = React.useMemo(() => [
    {
      id: 'essay_1',
      order: 1,
      title: 'Rút gọn biểu thức và tính giá trị',
      topicScope: 'Đa thức nhiều biến & Hằng đẳng thức đáng nhớ',
      description: 'Cho biểu thức đa thức: ý a) Thu gọn đa thức P; ý b) Tính giá trị của P tại x, y cho trước',
      points: 1.5,
      level: 'TH'
    },
    {
      id: 'essay_2',
      order: 2,
      title: 'Giải toán bằng cách lập phương trình',
      topicScope: 'Phương trình bậc nhất một ẩn / Phân tích đa thức',
      description: 'Bài toán có lời văn gắn với thực tế chuyển động hoặc kinh tế; lập phương trình để tìm đại lượng chưa biết',
      points: 1.5,
      level: 'VD'
    },
    {
      id: 'essay_3',
      order: 3,
      title: 'Hình học phẳng: Tứ giác & Định lý Thalès',
      topicScope: 'Tứ giác (Hình bình hành, chữ nhật) & Định lý Thalès',
      description: 'Cho hình vẽ: ý a) Chứng minh tứ giác là hình bình hành; ý b) Áp dụng định lí Thalès tính độ dài đoạn thẳng',
      points: 2.0,
      level: 'VD'
    }
  ], []);

  const [localEssayEnabled, setLocalEssayEnabled] = React.useState<boolean>(true);
  const [localEssayItems, setLocalEssayItems] = React.useState<CustomEssayItem[]>(defaultCustomEssayList);

  const essayEnabled = customEssayEnabled !== undefined ? customEssayEnabled : localEssayEnabled;
  const setEssayEnabled = (val: boolean) => {
    setLocalEssayEnabled(val);
    if (setCustomEssayEnabled) setCustomEssayEnabled(val);
  };

  const essayItems = customEssayItems !== undefined ? customEssayItems : localEssayItems;
  const setEssayItems = (items: CustomEssayItem[]) => {
    setLocalEssayItems(items);
    if (setCustomEssayItems) setCustomEssayItems(items);
  };

  // Chế độ tài liệu tham chiếu: 'default' (Mặc định: SGK KNTT + Ngân hàng đề Bộ GD&ĐT) hoặc 'custom_library' (Tự chọn từ Thư viện)
  const [refMode, setRefMode] = React.useState<'default' | 'custom_library'>(activeRef ? 'custom_library' : 'default');

  // Quản lý bộ chọn chuyên đề & bài học từ Thư viện (Chế độ tự chọn)
  const [selectedRefTopicId, setSelectedRefTopicId] = React.useState<string>(newTopicId || 'all');
  const [selectedRefLessonId, setSelectedRefLessonId] = React.useState<string>(activeRef?.lessonId || '');

  // Phân tích và quản lý Phạm vi kiến thức (Áp dụng khi chọn 'default')
  const parseInitialTopicAndFocus = () => {
    if (!referenceNotes) {
      const currentT = topics.find(t => t.id === newTopicId);
      const name = currentT ? (currentT.title || currentT.name || '') : '';
      return {
        topics: name ? [name] : [],
        topic: name,
        focus: ''
      };
    }
    const multiMatch = referenceNotes.match(/^\[Các chuyên đề(?:\s*\(\d+\))?:\s*([^\]]+)\]\s*(.*)$/s);
    if (multiMatch) {
      const topicList = multiMatch[1].split(/;\s*/).map(s => s.trim()).filter(Boolean);
      return {
        topics: topicList,
        topic: multiMatch[1].trim(),
        focus: multiMatch[2].trim()
      };
    }
    const match = referenceNotes.match(/^\[Chuyên đề:\s*([^\]]+)\]\s*(.*)$/s);
    if (match) {
      const topicList = match[1].split(/;\s*/).map(s => s.trim()).filter(Boolean);
      return {
        topics: topicList,
        topic: match[1].trim(),
        focus: match[2].trim()
      };
    }
    return { topics: [], topic: '', focus: referenceNotes };
  };

  const initialParsed = React.useMemo(() => parseInitialTopicAndFocus(), []);
  const [selectedTopicTitles, setSelectedTopicTitles] = React.useState<string[]>(initialParsed.topics);
  const [defaultTopicScope, setDefaultTopicScope] = React.useState<string>(initialParsed.topic);
  const [defaultKnowledgeFocus, setDefaultKnowledgeFocus] = React.useState<string>(initialParsed.focus);

  // Trạng thái và helper cho phương thức: Tạo đề theo ma trận
  const totalMatrixPercent = React.useMemo(() => {
    const l = matrixConfig?.levels || {};
    return (Number(l.recognize) || 0) + (Number(l.understand) || 0) + (Number(l.apply) || 0) + (Number(l.highApply) || 0);
  }, [matrixConfig]);

  const updateMatrixLevel = (key: 'recognize' | 'understand' | 'apply' | 'highApply', val: number) => {
    if (!setMatrixConfig) return;
    const clamped = Math.max(0, Math.min(100, val));
    setMatrixConfig((prev: any) => ({
      ...prev,
      levels: {
        ...(prev?.levels || { recognize: 40, understand: 30, apply: 20, highApply: 10 }),
        [key]: clamped
      }
    }));
  };

  const handleBalanceMatrixPercent = () => {
    if (!setMatrixConfig) return;
    const l = matrixConfig?.levels || { recognize: 40, understand: 30, apply: 20, highApply: 10 };
    const curTotal = (Number(l.recognize) || 0) + (Number(l.understand) || 0) + (Number(l.apply) || 0) + (Number(l.highApply) || 0);
    if (curTotal === 0) {
      setMatrixConfig((prev: any) => ({
        ...prev,
        levels: { recognize: 40, understand: 30, apply: 20, highApply: 10 }
      }));
      return;
    }
    const factor = 100 / curTotal;
    const newNB = Math.round((Number(l.recognize) || 0) * factor);
    const newTH = Math.round((Number(l.understand) || 0) * factor);
    const newVD = Math.round((Number(l.apply) || 0) * factor);
    const newVDC = Math.max(0, 100 - newNB - newTH - newVD);
    setMatrixConfig((prev: any) => ({
      ...prev,
      levels: { recognize: newNB, understand: newTH, apply: newVD, highApply: newVDC }
    }));
  };
  // Cập nhật và đồng bộ referenceNotes khi sửa thủ công
  const handleUpdateScope = (topicVal: string, focusVal: string) => {
    setDefaultTopicScope(topicVal);
    setDefaultKnowledgeFocus(focusVal);

    if (topicVal.trim()) {
      const list = topicVal.split(/;\s*/).map(s => s.trim()).filter(Boolean);
      setSelectedTopicTitles(list);
    } else {
      setSelectedTopicTitles([]);
    }

    const isMulti = topicVal.includes(';') || (selectedTopicTitles.length > 1);
    const combined = topicVal.trim()
      ? (focusVal.trim()
          ? (isMulti ? `[Các chuyên đề: ${topicVal.trim()}]\n\n${focusVal.trim()}` : `[Chuyên đề: ${topicVal.trim()}]\n\n${focusVal.trim()}`)
          : (isMulti ? `[Các chuyên đề: ${topicVal.trim()}]` : `[Chuyên đề: ${topicVal.trim()}]`))
      : focusVal.trim();
    setReferenceNotes(combined);

    // Tự động nhận diện và đồng bộ khối lớp nếu giáo viên gõ hoặc chọn chuyên đề lớp cụ thể (như lớp 8)
    const detectGradeFromText = (text: string): number | null => {
      const m = text.match(/(?:toán|lớp)\s*(6|7|8|9|10|11|12)\b/i);
      return m ? parseInt(m[1], 10) : null;
    };
    const detected = detectGradeFromText(`${topicVal} ${focusVal}`);
    if (detected && detected.toString() !== newGrade) {
      setNewGrade(detected.toString());
      const matchTopic = topics.find(t => t.grade === detected);
      if (matchTopic) {
        setNewTopicId(matchTopic.id);
      }
      if (!newTitle.trim() || newTitle.startsWith('Đề kiểm tra Toán lớp')) {
        setNewTitle(`Đề kiểm tra Toán lớp ${detected} - ${topicVal.trim() || 'Chuyên đề'}`);
      }
    }
  };

  // Đồng bộ khi activeRef thay đổi từ bên ngoài (ví dụ từ modal selector)
  React.useEffect(() => {
    if (activeRef) {
      setRefMode('custom_library');
      if (activeRef.topicId) {
        setSelectedRefTopicId(activeRef.topicId);
      }
      if (activeRef.lessonId) {
        setSelectedRefLessonId(activeRef.lessonId);
      }
    }
  }, [activeRef]);

  // Danh sách chuyên đề theo khối lớp đang chọn
  const gradeNum = Number(newGrade) || 8;
  const gradeTopics = React.useMemo(() => {
    return topics.filter(t => !t.grade || Number(t.grade) === gradeNum);
  }, [topics, gradeNum]);

  // Danh sách bài học có thể chọn trong thư viện
  const availableLessons = React.useMemo(() => {
    return lessons.filter(l => {
      if (selectedRefTopicId && selectedRefTopicId !== 'all') {
        return l.topicId === selectedRefTopicId;
      }
      return !l.grade || Number(l.grade) === gradeNum;
    });
  }, [lessons, selectedRefTopicId, gradeNum]);

  // Xử lý chọn bài học từ dropdown trong thư viện
  const handleSelectLessonFromDropdown = (lessonId: string) => {
    setSelectedRefLessonId(lessonId);
    if (!lessonId) {
      setActiveRef(null);
      return;
    }
    const targetLesson = lessons.find(l => l.id === lessonId);
    if (targetLesson) {
      const parentTopic = topics.find(t => t.id === targetLesson.topicId);
      const targetGrade = targetLesson.grade || parentTopic?.grade || gradeNum;
      setNewGrade(targetGrade.toString());
      if (targetLesson.topicId) {
        setNewTopicId(targetLesson.topicId);
      }
      if (!newTitle.trim() || newTitle.startsWith('Đề kiểm tra Toán lớp')) {
        setNewTitle(`Đề kiểm tra Toán lớp ${targetGrade} - ${targetLesson.title}`);
      }
      setActiveRef({
        docId: targetLesson.id,
        topicId: targetLesson.topicId,
        topicName: parentTopic?.title || parentTopic?.name || 'Chuyên đề',
        lessonId: targetLesson.id,
        lessonTitle: targetLesson.title,
        grade: targetGrade,
        attachment: targetLesson.attachment || null,
        knowledge: targetLesson.content || targetLesson.knowledge || '',
        videoUrl: targetLesson.videoUrl || ''
      });
    }
  };

  // Tìm kiếm và lọc danh sách chuyên đề đầy đủ của khối lớp
  const [topicSearchKeyword, setTopicSearchKeyword] = React.useState<string>('');
  const [topicTermFilter, setTopicTermFilter] = React.useState<'ALL' | 'Học kỳ 1' | 'Học kỳ 2' | 'Chuyên đề ôn tập'>('ALL');
  const [isTopicListExpanded, setIsTopicListExpanded] = React.useState<boolean>(true);

  // Danh sách đầy đủ chuẩn SGK Kết nối tri thức cho khối lớp
  const standardCurriculumTopics = React.useMemo(() => {
    return getCurriculumTopicsByGrade(gradeNum);
  }, [gradeNum]);

  // Hợp nhất danh sách chuyên đề đầy đủ chuẩn SGK và các chuyên đề riêng trong thư viện trường
  const allCurriculumTopicsForGrade = React.useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      term?: string;
      chapterNumber?: number;
      defaultFocus: string;
      source: 'standard' | 'custom';
      dbTopicId?: string;
    }> = standardCurriculumTopics.map(st => {
      const matchedDb = gradeTopics.find(gt => {
        const dbName = (gt.title || gt.name || '').toLowerCase();
        const stName = st.title.toLowerCase();
        return dbName.includes(stName.substring(0, 15)) || stName.includes(dbName.substring(0, 15));
      });
      return {
        id: st.id,
        title: st.title,
        term: st.term,
        chapterNumber: st.chapterNumber,
        defaultFocus: st.defaultFocus,
        source: 'standard' as const,
        dbTopicId: matchedDb?.id
      };
    });

    // Thêm các chuyên đề riêng trong db mà chưa có trong danh sách chuẩn
    gradeTopics.forEach(gt => {
      const gName = (gt.title || gt.name || '').trim();
      if (gName && !list.some(item => item.title.toLowerCase() === gName.toLowerCase())) {
        list.push({
          id: gt.id,
          title: gName,
          term: 'Chuyên đề ôn tập',
          defaultFocus: `Trọng tâm kiến thức và ôn luyện kiểm tra: ${gName} môn Toán lớp ${gradeNum}.`,
          source: 'custom' as const,
          dbTopicId: gt.id
        });
      }
    });

    return list;
  }, [standardCurriculumTopics, gradeTopics, gradeNum]);

  // Lọc theo từ khóa tìm kiếm và học kỳ
  const filteredCurriculumTopics = React.useMemo(() => {
    return allCurriculumTopicsForGrade.filter(item => {
      const matchesSearch = !topicSearchKeyword.trim() || 
        item.title.toLowerCase().includes(topicSearchKeyword.toLowerCase()) ||
        item.defaultFocus.toLowerCase().includes(topicSearchKeyword.toLowerCase());
      
      const matchesTerm = topicTermFilter === 'ALL' || item.term === topicTermFilter;
      return matchesSearch && matchesTerm;
    });
  }, [allCurriculumTopicsForGrade, topicSearchKeyword, topicTermFilter]);

  // Hàm cập nhật danh sách các chuyên đề được chọn (hỗ trợ chọn nhiều chuyên đề)
  const updateSelectedTopics = (newTitles: string[]) => {
    setSelectedTopicTitles(newTitles);

    if (newTitles.length === 0) {
      setDefaultTopicScope('');
      setDefaultKnowledgeFocus('');
      setReferenceNotes('');
      return;
    }

    const scopeStr = newTitles.join('; ');
    setDefaultTopicScope(scopeStr);

    // Tổng hợp nội dung kiến thức trọng tâm của tất cả chuyên đề được chọn
    const focusSections = newTitles.map((title, idx) => {
      const matched = allCurriculumTopicsForGrade.find(t => t.title.toLowerCase() === title.toLowerCase());
      const focus = matched?.defaultFocus || `Trọng tâm kiến thức và bài tập môn Toán lớp ${gradeNum}: ${title}`;
      return newTitles.length === 1
        ? focus
        : `• [Chuyên đề ${idx + 1}: ${title}]\n${focus}`;
    });
    const aggregatedFocus = focusSections.join('\n\n');
    setDefaultKnowledgeFocus(aggregatedFocus);

    const refNotesStr = newTitles.length === 1
      ? `[Chuyên đề: ${newTitles[0]}]\n\n${aggregatedFocus}`
      : `[Các chuyên đề (${newTitles.length}): ${scopeStr}]\n\n${aggregatedFocus}`;
    setReferenceNotes(refNotesStr);

    // Tự động cập nhật tên đề thi nếu tên đề thi đang để mặc định
    if (!newTitle.trim() || newTitle.startsWith('Đề kiểm tra Toán lớp')) {
      if (newTitles.length === 1) {
        setNewTitle(`Đề kiểm tra Toán lớp ${gradeNum} - ${newTitles[0]}`);
      } else if (newTitles.length === 2) {
        setNewTitle(`Đề kiểm tra Toán lớp ${gradeNum} - ${newTitles[0]} & ${newTitles[1]}`);
      } else {
        setNewTitle(`Đề kiểm tra Toán lớp ${gradeNum} (${newTitles.length} chuyên đề)`);
      }
    }

    // Đồng bộ chuyên đề lưu trữ (newTopicId) với chuyên đề đầu tiên có trong database
    const firstDbMatch = allCurriculumTopicsForGrade.find(t => newTitles.includes(t.title) && t.dbTopicId);
    if (firstDbMatch?.dbTopicId) {
      setNewTopicId(firstDbMatch.dbTopicId);
    } else if (newTitles[0]) {
      setNewTopicInputName(newTitles[0]);
    }
  };

  // Toggle chọn / bỏ chọn một chuyên đề
  const handleToggleTopic = (topicTitle: string) => {
    const isAlready = selectedTopicTitles.some(st => st.trim().toLowerCase() === topicTitle.trim().toLowerCase());
    let nextTitles: string[];
    if (isAlready) {
      nextTitles = selectedTopicTitles.filter(st => st.trim().toLowerCase() !== topicTitle.trim().toLowerCase());
    } else {
      nextTitles = [...selectedTopicTitles, topicTitle];
    }
    updateSelectedTopics(nextTitles);
  };

  // Chọn duy nhất một chuyên đề
  const handleSelectOnlyTopic = (topicTitle: string) => {
    updateSelectedTopics([topicTitle]);
  };

  // Chọn toàn bộ các chuyên đề của khối lớp
  const handleSelectAllTopics = () => {
    const allTitles = allCurriculumTopicsForGrade.map(t => t.title);
    updateSelectedTopics(allTitles);
  };

  // Chọn theo học kỳ
  const handleSelectTermTopics = (term: 'Học kỳ 1' | 'Học kỳ 2' | 'Chuyên đề ôn tập') => {
    const termTitles = allCurriculumTopicsForGrade.filter(t => t.term === term).map(t => t.title);
    if (termTitles.length > 0) {
      updateSelectedTopics(termTitles);
    }
  };

  // Bỏ chọn tất cả
  const handleClearAllTopics = () => {
    updateSelectedTopics([]);
  };

  // Hàm chọn chuyên đề tương thích cũ
  const handleSelectCurriculumTopic = (topicItem: { title: string; defaultFocus?: string; dbTopicId?: string }) => {
    handleToggleTopic(topicItem.title);
  };

  // Tự động khởi tạo chuyên đề nếu chưa chọn
  React.useEffect(() => {
    if (selectedTopicTitles.length === 0 && allCurriculumTopicsForGrade.length > 0) {
      if (defaultTopicScope.trim()) {
        const parts = defaultTopicScope.split(/;\s*/).map(s => s.trim()).filter(Boolean);
        const matched = allCurriculumTopicsForGrade
          .filter(t => parts.some(p => p.toLowerCase() === t.title.toLowerCase()))
          .map(t => t.title);
        if (matched.length > 0) {
          setSelectedTopicTitles(matched);
          return;
        }
      }
      const firstT = allCurriculumTopicsForGrade[0];
      setSelectedTopicTitles([firstT.title]);
      if (!defaultTopicScope.trim()) {
        setDefaultTopicScope(firstT.title);
        setDefaultKnowledgeFocus(firstT.defaultFocus || '');
        setReferenceNotes(`[Chuyên đề: ${firstT.title}]\n\n${firstT.defaultFocus || ''}`);
      }
    }
  }, [allCurriculumTopicsForGrade]);

  // Danh sách gợi ý tên chuyên đề nhanh theo khối lớp
  const suggestedTopicsList = React.useMemo(() => {
    return allCurriculumTopicsForGrade.map(t => t.title);
  }, [allCurriculumTopicsForGrade]);

  // Gợi ý mẫu nội dung kiến thức trọng tâm
  const quickFocusSnippets = [
    { label: 'Toàn bộ chuyên đề', text: 'Bao quát toàn bộ các đơn vị kiến thức cốt lõi trong chuyên đề, cân đối giữa lý thuyết và bài tập thực hành.' },
    { label: 'Kiến thức trọng tâm & Bài toán thực tế', text: 'Tập trung vào định nghĩa, công thức cốt lõi và các bài toán liên hệ thực tiễn đời sống theo định dạng GDPT 2018.' },
    { label: 'Chuẩn định dạng mới Bộ GD&ĐT', text: 'Bám sát ma trận năng lực: Nhận biết, Thông hiểu, Vận dụng; các câu hỏi Đúng/Sai và Trả lời ngắn theo format mới.' },
    { label: 'Phân loại học sinh & Vận dụng cao', text: 'Tập trung các bài toán biến đổi nâng cao, cực trị, giải toán thực tế và câu hỏi phân hóa học sinh khá giỏi.' }
  ];

  // Thêm câu tự luận mới
  const handleAddEssayItem = () => {
    const nextOrder = essayItems.length + 1;
    const newItem: CustomEssayItem = {
      id: `essay_${Date.now()}_${nextOrder}`,
      order: nextOrder,
      title: `Bài toán tự luận ${nextOrder}`,
      topicScope: selectedTopicTitles[0] || (topics.find(t => t.id === newTopicId)?.name || `Toán lớp ${gradeNum}`),
      description: 'Cho bài toán: ý a) ...; ý b) ...',
      points: 1.5,
      level: 'VD'
    };
    setEssayItems([...essayItems, newItem]);
  };

  // Xóa câu tự luận
  const handleDeleteEssayItem = (id: string) => {
    const remaining = essayItems.filter(it => it.id !== id).map((it, idx) => ({ ...it, order: idx + 1 }));
    setEssayItems(remaining);
  };

  // Nhân bản câu tự luận
  const handleDuplicateEssayItem = (item: CustomEssayItem) => {
    const duplicated: CustomEssayItem = {
      ...item,
      id: `essay_${Date.now()}_dup`,
      order: essayItems.length + 1,
      title: `${item.title} (Bản sao)`
    };
    setEssayItems([...essayItems, duplicated]);
  };

  // Cập nhật câu tự luận
  const handleUpdateEssayItem = (id: string, updates: Partial<CustomEssayItem>) => {
    setEssayItems(essayItems.map(it => it.id === id ? { ...it, ...updates } : it));
  };

  // Áp dụng bộ mẫu tự luận nhanh
  const handleApplyEssayPreset = (presetType: 'standard_3' | 'term_4' | 'advanced_2') => {
    if (presetType === 'standard_3') {
      setEssayItems([
        {
          id: `essay_${Date.now()}_1`,
          order: 1,
          title: 'Rút gọn biểu thức và tính giá trị',
          topicScope: selectedTopicTitles[0] || 'Đa thức nhiều biến và Hằng đẳng thức',
          description: 'Cho biểu thức đa thức: ý a) Thu gọn đa thức P; ý b) Tính giá trị của P khi biết giá trị của biến',
          points: 1.5,
          level: 'TH'
        },
        {
          id: `essay_${Date.now()}_2`,
          order: 2,
          title: 'Giải toán bằng cách lập phương trình',
          topicScope: 'Phương trình bậc nhất một ẩn / Phân tích đa thức',
          description: 'Bài toán có lời văn gắn với thực tế năng suất, chuyển động hoặc kinh tế; lập phương trình để tìm đại lượng chưa biết',
          points: 1.5,
          level: 'VD'
        },
        {
          id: `essay_${Date.now()}_3`,
          order: 3,
          title: 'Hình học phẳng: Tứ giác & Định lý Thalès',
          topicScope: 'Tứ giác (Hình bình hành, chữ nhật) & Định lý Thalès',
          description: 'Cho hình vẽ: ý a) Chứng minh tứ giác là hình bình hành; ý b) Áp dụng định lí Thalès tính độ dài đoạn thẳng',
          points: 2.0,
          level: 'VD'
        }
      ]);
    } else if (presetType === 'term_4') {
      setEssayItems([
        {
          id: `essay_${Date.now()}_1`,
          order: 1,
          title: 'Rút gọn biểu thức chứa biến',
          topicScope: selectedTopicTitles[0] || 'Phân thức đại số & Đa thức',
          description: 'Rút gọn biểu thức P và tìm giá trị nguyên của biến để biểu thức đạt giá trị nguyên',
          points: 1.5,
          level: 'TH'
        },
        {
          id: `essay_${Date.now()}_2`,
          order: 2,
          title: 'Bài toán thực tế kinh tế / chuyển động',
          topicScope: 'Phương trình bậc nhất và hàm số',
          description: 'Thiết lập mô hình toán học giải quyết tình huống kinh doanh hoặc chuyển động trong đời sống',
          points: 1.5,
          level: 'VD'
        },
        {
          id: `essay_${Date.now()}_3`,
          order: 3,
          title: 'Hình học tổng hợp 3 ý',
          topicScope: 'Tam giác đồng dạng & Định lý Thalès',
          description: 'ý a) Chứng minh hai tam giác đồng dạng; ý b) Chứng minh đẳng thức tích hình học; ý c) Tính diện tích',
          points: 2.5,
          level: 'VD'
        },
        {
          id: `essay_${Date.now()}_4`,
          order: 4,
          title: 'Bất đẳng thức & Giá trị nhỏ nhất (Phân hóa cao)',
          topicScope: 'Bất đẳng thức & Cực trị đại số',
          description: 'Tìm giá trị lớn nhất / nhỏ nhất của biểu thức chứa biến với điều kiện ràng buộc',
          points: 0.5,
          level: 'VDC'
        }
      ]);
    } else if (presetType === 'advanced_2') {
      setEssayItems([
        {
          id: `essay_${Date.now()}_1`,
          order: 1,
          title: 'Hình học phẳng nâng cao',
          topicScope: 'Tứ giác đặc biệt & Đường thẳng đồng quy',
          description: 'Chứng minh ba điểm thẳng hàng hoặc ba đường thẳng đồng quy, tính góc',
          points: 2.0,
          level: 'VD'
        },
        {
          id: `essay_${Date.now()}_2`,
          order: 2,
          title: 'Phương trình nghiệm nguyên hoặc Cực trị',
          topicScope: 'Đại số nâng cao & Chia hết',
          description: 'Tìm các nghiệm nguyên thỏa mãn phương trình hoặc tìm giá trị nhỏ nhất của biểu thức',
          points: 1.0,
          level: 'VDC'
        }
      ]);
    }
  };

  // Hàm render UI Phạm vi kiến thức dùng chung cho Tạo đề theo mô tả và Tài liệu mặc định
  const renderKnowledgeScopeUI = (theme: 'emerald' | 'indigo' = 'emerald', customTitle = 'Phạm vi kiến thức', customBadge = 'Chỉ áp dụng khi chọn tài liệu mặc định') => {
    const isIndigo = theme === 'indigo';
    const borderCol = isIndigo ? 'border-indigo-300' : 'border-emerald-300';
    const bgGrad = isIndigo ? 'from-indigo-50/60 via-purple-50/30 to-white' : 'from-emerald-50/60 via-teal-50/30 to-white';
    const headerBorder = isIndigo ? 'border-indigo-100' : 'border-emerald-100';
    const iconBg = isIndigo ? 'bg-indigo-600' : 'bg-emerald-600';
    const badgeCls = isIndigo ? 'bg-indigo-100 text-indigo-800 border-indigo-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200';
    const aiTagCol = isIndigo ? 'text-indigo-800 border-indigo-200' : 'text-emerald-800 border-emerald-200';
    const gradeBoxBg = isIndigo ? 'bg-indigo-100/70 border-indigo-200' : 'bg-emerald-100/70 border-emerald-200';
    const gradeTextCol = isIndigo ? 'text-indigo-950' : 'text-emerald-950';
    const gradeTagCol = isIndigo ? 'text-indigo-800 border-indigo-300' : 'text-emerald-800 border-emerald-300';
    const gradeSubCol = isIndigo ? 'text-indigo-700' : 'text-emerald-700';
    const activeGradeBtn = isIndigo ? 'bg-indigo-600 text-white shadow-xs scale-105 ring-2 ring-indigo-300 font-black' : 'bg-emerald-600 text-white shadow-xs scale-105 ring-2 ring-emerald-300 font-black';
    const inactiveGradeBtn = isIndigo ? 'bg-white hover:bg-indigo-50 text-gray-700 border border-indigo-200' : 'bg-white hover:bg-emerald-50 text-gray-700 border border-emerald-200';

    return (
      <div className={`p-4 sm:p-5 rounded-xl border-2 ${borderCol} bg-gradient-to-br ${bgGrad} shadow-xs space-y-4`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b ${headerBorder}`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg ${iconBg} text-white flex items-center justify-center shrink-0 shadow-xs`}>
              <Target size={18} />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                <span>{customTitle}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeCls}`}>
                  {customBadge}
                </span>
              </h4>
              <p className="text-[11px] text-gray-600 mt-0.5">
                Giáo viên chọn khối lớp và chuyên đề hoặc nhập kiến thức trọng tâm để hệ thống liên kết học liệu và biên soạn chính xác
              </p>
            </div>
          </div>
          <span className={`text-[11px] font-bold ${aiTagCol} bg-white px-2.5 py-1 rounded-lg border shadow-2xs self-start sm:self-auto flex items-center gap-1`}>
            <Lightbulb size={13} className="text-amber-500" />
            <span>Định hướng biên soạn AI</span>
          </span>
        </div>

        {/* Chọn khối lớp mục tiêu cho phạm vi kiến thức */}
        <div className={`${gradeBoxBg} p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5`}>
          <div className="flex items-center gap-2">
            <GraduationCap size={16} className={gradeSubCol} />
            <span className={`text-xs font-extrabold ${gradeTextCol}`}>Khối lớp mục tiêu:</span>
            <span className={`text-xs font-black ${gradeTagCol} bg-white px-2.5 py-0.5 rounded-md border shadow-2xs`}>
              Toán Lớp {gradeNum}
            </span>
            <span className={`text-[11px] font-bold ${gradeSubCol} hidden sm:inline`}>
              ({allCurriculumTopicsForGrade.length} chuyên đề chuẩn SGK Kết nối tri thức)
            </span>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {['6', '7', '8', '9', '10', '11', '12'].map(g => (
              <button
                key={g}
                type="button"
                onClick={() => {
                  setNewGrade(g);
                  const gNum = parseInt(g, 10);
                  const stdTopics = getCurriculumTopicsByGrade(gNum);
                  if (stdTopics.length > 0) {
                    const firstT = stdTopics[0];
                    updateSelectedTopics([firstT.title]);
                  }
                  const matchingTopics = topics.filter(t => t.grade === gNum);
                  if (matchingTopics.length > 0) {
                    setNewTopicId(matchingTopics[0].id);
                  }
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  gradeNum === parseInt(g, 10) ? activeGradeBtn : inactiveGradeBtn
                }`}
              >
                Lớp {g}
              </button>
            ))}
          </div>
        </div>

        {/* HIỂN THỊ ĐẦY ĐỦ TÊN CÁC CHUYÊN ĐỀ CỦA KHỐI LỚP - CHỌN NHIỀU CĐ */}
        <div className={`bg-white rounded-xl border-2 ${borderCol} p-3.5 sm:p-4 space-y-3.5 shadow-2xs`}>
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b ${headerBorder} pb-2.5`}>
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-lg ${iconBg} text-white flex items-center justify-center text-xs font-black shrink-0`}>
                  <BookOpen size={13} />
                </span>
                <h5 className="text-xs sm:text-sm font-black text-gray-900 tracking-tight flex items-center gap-2 flex-wrap">
                  <span>Danh sách đầy đủ các chuyên đề Toán Lớp {gradeNum}</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badgeCls}`}>
                    Hiện đủ {allCurriculumTopicsForGrade.length} chuyên đề
                  </span>
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                    <Sparkles size={11} className="text-purple-600" />
                    <span>Cho phép chọn nhiều chuyên đề ({selectedTopicTitles.length} đã chọn)</span>
                  </span>
                </h5>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                SGK Toán Kết nối tri thức với cuộc sống & Ngân hàng đề Bộ GD&ĐT. Tích chọn một hoặc nhiều chuyên đề để tạo đề kiểm tra 1 tiết, giữa kỳ hoặc cuối kỳ.
              </p>
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setIsTopicListExpanded(!isTopicListExpanded)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${isIndigo ? 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border-indigo-200' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200'} border transition-colors flex items-center gap-1 cursor-pointer`}
              >
                <span>{isTopicListExpanded ? 'Thu gọn danh sách chuyên đề' : `Xem toàn bộ ${allCurriculumTopicsForGrade.length} chuyên đề`}</span>
              </button>
            </div>
          </div>

          {/* Thanh thao tác chọn nhanh nhiều chuyên đề */}
          <div className={`flex flex-wrap items-center justify-between gap-2 p-2 ${isIndigo ? 'bg-indigo-50/70 border-indigo-200' : 'bg-emerald-50/70 border-emerald-200'} rounded-xl border`}>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[11px] font-extrabold ${gradeTextCol} flex items-center gap-1 mr-1`}>
                <CheckCircle2 size={13} className={gradeSubCol} />
                <span>Chọn nhanh:</span>
              </span>
              <button
                type="button"
                onClick={handleSelectAllTopics}
                className={`text-[11px] px-2.5 py-1 rounded-lg bg-white ${isIndigo ? 'hover:bg-indigo-100 text-indigo-800 border-indigo-300' : 'hover:bg-emerald-100 text-emerald-800 border-emerald-300'} font-bold border transition-all cursor-pointer shadow-2xs`}
                title="Chọn tất cả các chuyên đề trong cả năm học"
              >
                + Chọn tất cả ({allCurriculumTopicsForGrade.length} CĐ)
              </button>
              <button
                type="button"
                onClick={() => handleSelectTermTopics('Học kỳ 1')}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white hover:bg-blue-100 text-blue-800 font-bold border border-blue-300 transition-all cursor-pointer shadow-2xs"
                title="Chọn tất cả chuyên đề thuộc Học kỳ 1"
              >
                + Học kỳ 1 ({allCurriculumTopicsForGrade.filter(t => t.term === 'Học kỳ 1').length} CĐ)
              </button>
              <button
                type="button"
                onClick={() => handleSelectTermTopics('Học kỳ 2')}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white hover:bg-purple-100 text-purple-800 font-bold border border-purple-300 transition-all cursor-pointer shadow-2xs"
                title="Chọn tất cả chuyên đề thuộc Học kỳ 2"
              >
                + Học kỳ 2 ({allCurriculumTopicsForGrade.filter(t => t.term === 'Học kỳ 2').length} CĐ)
              </button>
            </div>

            {selectedTopicTitles.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllTopics}
                className="text-[11px] px-2 py-0.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 font-bold transition-all cursor-pointer"
                title="Bỏ chọn tất cả chuyên đề để chọn lại từ đầu"
              >
                Bỏ chọn tất cả
              </button>
            )}
          </div>

          {/* Dải hiển thị danh sách các chuyên đề đang được chọn */}
          {selectedTopicTitles.length > 0 && (
            <div className={`p-3 bg-gradient-to-r ${isIndigo ? 'from-indigo-50 via-purple-50 to-indigo-50 border-indigo-300' : 'from-emerald-50 via-teal-50 to-emerald-50 border-emerald-300'} rounded-xl border space-y-2`}>
              <div className="flex items-center justify-between flex-wrap gap-1.5">
                <span className={`text-xs font-black ${gradeTextCol} flex items-center gap-1.5`}>
                  <span className={`w-5 h-5 rounded-md ${iconBg} text-white flex items-center justify-center text-[10px] font-black`}>
                    {selectedTopicTitles.length}
                  </span>
                  <span>Đang chọn {selectedTopicTitles.length} chuyên đề vào đề thi:</span>
                </span>
                {selectedTopicTitles.length > 1 && (
                  <span className={`text-[10px] font-bold ${isIndigo ? 'text-indigo-800 border-indigo-200' : 'text-emerald-800 border-emerald-200'} bg-white/80 px-2 py-0.5 rounded-md border`}>
                    ✨ Đề thi sẽ tổng hợp & phân bổ câu hỏi từ tất cả các chuyên đề này
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                {selectedTopicTitles.map((tTitle, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border ${borderCol} rounded-lg text-xs font-bold ${isIndigo ? 'text-indigo-900 hover:border-indigo-500' : 'text-emerald-900 hover:border-emerald-500'} shadow-2xs transition-all`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${iconBg} shrink-0`}></span>
                    <span className="line-clamp-1 max-w-[280px] sm:max-w-md">{tTitle}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleTopic(tTitle)}
                      className="w-4 h-4 rounded-full hover:bg-red-100 text-gray-400 hover:text-red-600 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer shrink-0"
                      title="Bỏ chuyên đề này khỏi đề thi"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Menu Dropdown Chọn Nhanh Đầy Đủ Chuyên Đề */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles size={12} className={gradeSubCol} />
                <span>Bấm vào menu dưới đây để thêm/bớt chuyên đề Toán Lớp {gradeNum}:</span>
              </span>
              <span className={`text-[10px] ${gradeSubCol} font-semibold`}>
                {selectedTopicTitles.length}/{allCurriculumTopicsForGrade.length} chuyên đề đã chọn
              </span>
            </label>
            <select
              value=""
              onChange={(e) => {
                const val = e.target.value;
                if (!val) return;
                handleToggleTopic(val);
              }}
              className={`w-full px-3 py-2 text-xs font-bold border-2 ${borderCol} rounded-xl ${isIndigo ? 'bg-indigo-50/50 hover:bg-indigo-50 focus:ring-indigo-500' : 'bg-emerald-50/50 hover:bg-emerald-50 focus:ring-emerald-500'} text-gray-900 focus:ring-2 focus:bg-white outline-none cursor-pointer shadow-2xs`}
            >
              <option value="">-- Bấm vào đây để chọn thêm hoặc bỏ bớt chuyên đề ({selectedTopicTitles.length} đang chọn) --</option>
              {allCurriculumTopicsForGrade.map((top, idx) => {
                const isSelected = selectedTopicTitles.some(st => st.trim().toLowerCase() === top.title.trim().toLowerCase());
                return (
                  <option key={top.id || idx} value={top.title}>
                    {isSelected ? '✓ [Đang chọn] ' : '+ [Thêm vào đề] '} {top.title} {top.term ? `[${top.term}]` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Lưới hiển thị chi tiết ĐẦY ĐỦ TÊN CÁC CHUYÊN ĐỀ (Có Checkbox chọn nhiều) */}
          {isTopicListExpanded && (
            <div className="space-y-2.5 pt-1">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1 flex-wrap">
                  {(['ALL', 'Học kỳ 1', 'Học kỳ 2', 'Chuyên đề ôn tập'] as const).map((tFilter) => {
                    const count = tFilter === 'ALL' 
                      ? allCurriculumTopicsForGrade.length 
                      : allCurriculumTopicsForGrade.filter(t => t.term === tFilter).length;
                    if (tFilter !== 'ALL' && count === 0) return null;
                    return (
                      <button
                        key={tFilter}
                        type="button"
                        onClick={() => setTopicTermFilter(tFilter)}
                        className={`text-[11px] px-2.5 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                          topicTermFilter === tFilter
                            ? `${iconBg} text-white shadow-2xs`
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }`}
                      >
                        {tFilter === 'ALL' ? `Tất cả (${count})` : `${tFilter} (${count})`}
                      </button>
                    );
                  })}
                </div>

                <div className="relative w-full sm:w-60">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={topicSearchKeyword}
                    onChange={(e) => setTopicSearchKeyword(e.target.value)}
                    placeholder={`Tìm tên chuyên đề lớp ${gradeNum}...`}
                    className={`w-full pl-7 pr-3 py-1 text-xs border border-gray-200 rounded-lg bg-gray-50/70 focus:bg-white focus:ring-1 ${isIndigo ? 'focus:ring-indigo-500' : 'focus:ring-emerald-500'} outline-none placeholder:text-gray-400 font-medium`}
                  />
                  {topicSearchKeyword && (
                    <button
                      type="button"
                      onClick={() => setTopicSearchKeyword('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
                {filteredCurriculumTopics.map((item, idx) => {
                  const isSelected = selectedTopicTitles.some(st => st.trim().toLowerCase() === item.title.trim().toLowerCase());
                  return (
                    <div
                      key={item.id || idx}
                      onClick={() => handleToggleTopic(item.title)}
                      className={`p-3 rounded-xl border-2 transition-all cursor-pointer text-left flex flex-col justify-between group ${
                        isSelected
                          ? `${isIndigo ? 'border-indigo-600 bg-indigo-50/90 ring-indigo-500/20' : 'border-emerald-600 bg-emerald-50/90 ring-emerald-500/20'} ring-2 shadow-xs`
                          : `border-gray-200 bg-white ${isIndigo ? 'hover:border-indigo-400 hover:bg-indigo-50/30' : 'hover:border-emerald-400 hover:bg-emerald-50/30'}`
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-1.5">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleToggleTopic(item.title);
                              }}
                              className={`w-4 h-4 rounded ${isIndigo ? 'text-indigo-600 focus:ring-indigo-500' : 'text-emerald-600 focus:ring-emerald-500'} border-gray-300 cursor-pointer`}
                            />
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                              item.term === 'Học kỳ 1' 
                                ? 'bg-blue-100 text-blue-800' 
                                : item.term === 'Học kỳ 2' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-amber-100 text-amber-800'
                            }`}>
                              {item.term || `Toán ${gradeNum}`}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectOnlyTopic(item.title);
                              }}
                              className={`text-[10px] font-bold text-gray-500 ${isIndigo ? 'hover:text-indigo-800 hover:bg-indigo-100/70' : 'hover:text-emerald-800 hover:bg-emerald-100/70'} px-2 py-0.5 rounded transition-colors cursor-pointer`}
                              title="Chỉ chọn duy nhất chuyên đề này cho đề thi"
                            >
                              Chỉ chọn CĐ này
                            </button>

                            {isSelected ? (
                              <span className={`text-[10px] font-black ${isIndigo ? 'text-indigo-800 bg-indigo-200/90' : 'text-emerald-800 bg-emerald-200/90'} px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs`}>
                                <Check size={11} className="stroke-[3]" />
                                <span>Đã chọn</span>
                              </span>
                            ) : (
                              <span className={`text-[10px] font-bold text-gray-400 ${isIndigo ? 'group-hover:text-indigo-700' : 'group-hover:text-emerald-700'} transition-colors`}>
                                + Chọn thêm
                              </span>
                            )}
                          </div>
                        </div>

                        <h6 className={`font-black text-xs leading-snug ${
                          isSelected ? `${isIndigo ? 'text-indigo-950' : 'text-emerald-950'} font-extrabold` : `text-gray-900 ${isIndigo ? 'group-hover:text-indigo-900' : 'group-hover:text-emerald-900'}`
                        }`}>
                          {item.title}
                        </h6>

                        {item.defaultFocus && (
                          <p className="text-[11px] text-gray-600 mt-1.5 line-clamp-2 leading-relaxed">
                            {item.defaultFocus.replace(/^- (?:Nhận biết|Thông hiểu|Vận dụng|Dạng \d+):\s*/gm, '• ').substring(0, 130)}...
                          </p>
                        )}
                      </div>

                      <div className="pt-2 mt-2 border-t border-gray-100 flex items-center justify-between text-[10px]">
                        <span className="text-gray-400 font-semibold">Toán Lớp {gradeNum} - SGK KNTT</span>
                        <span className={`font-bold ${isSelected ? `${isIndigo ? 'text-indigo-700' : 'text-emerald-700'} font-extrabold` : `text-gray-500 ${isIndigo ? 'group-hover:text-indigo-700' : 'group-hover:text-emerald-700'}`}`}>
                          {isSelected ? '✓ Đang kích hoạt trong đề' : '+ Bấm để chọn vào đề'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 1. Tên chuyên đề kiểm tra / ôn tập (Đã chọn & Cho phép chỉnh sửa) */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <span>Tên các chuyên đề kiểm tra / ôn tập ({selectedTopicTitles.length} chuyên đề đã chọn):</span>
              <span className="text-red-500 font-bold">*</span>
            </label>
            {defaultTopicScope && (
              <button
                type="button"
                onClick={() => {
                  const matched = topics.find(t => (t.title || t.name || '').toLowerCase() === defaultTopicScope.toLowerCase());
                  if (matched) {
                    setNewTopicId(matched.id);
                  } else {
                    setNewTopicInputName(defaultTopicScope.split(';')[0].trim());
                    setIsCreatingNewTopic(true);
                  }
                }}
                className={`text-[11px] font-bold ${isIndigo ? 'text-indigo-700 hover:text-indigo-900' : 'text-emerald-700 hover:text-emerald-900'} hover:underline cursor-pointer flex items-center gap-1`}
                title="Đồng bộ tên chuyên đề này sang Phần thông tin cơ bản để lưu trữ đề"
              >
                <RefreshCw size={11} />
                <span>Đồng bộ làm Chuyên đề lưu đề thi</span>
              </button>
            )}
          </div>

          <input
            type="text"
            value={defaultTopicScope}
            onChange={(e) => handleUpdateScope(e.target.value, defaultKnowledgeFocus)}
            placeholder={`Ví dụ: Chương 1: Đa thức nhiều biến; Chương 2: Hằng đẳng thức đáng nhớ (Toán lớp ${gradeNum})...`}
            className={`w-full px-3.5 py-2.5 text-xs sm:text-sm font-bold border-2 ${borderCol} rounded-xl bg-white ${isIndigo ? 'focus:ring-indigo-500' : 'focus:ring-emerald-500'} focus:ring-2 outline-none placeholder:text-gray-400 placeholder:font-normal shadow-2xs text-gray-900`}
          />
        </div>

        {/* 2. Nội dung kiến thức trọng tâm */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <span>Nội dung kiến thức trọng tâm & Dạng bài cần ra đề:</span>
              <span className="text-red-500 font-bold">*</span>
            </label>
            <span className="text-[10px] text-gray-400 font-medium">
              Hệ thống bám sát các dạng bài này
            </span>
          </div>

          <textarea
            rows={4}
            value={defaultKnowledgeFocus}
            onChange={(e) => handleUpdateScope(defaultTopicScope, e.target.value)}
            placeholder="Ví dụ: &#10;- Nhận biết: Công thức nghiệm, định nghĩa, nhận dạng đồ thị hàm số&#10;- Thông hiểu: Giải phương trình, tính giá trị biểu thức đối xứng x1, x2&#10;- Vận dụng: Tìm tham số m thỏa mãn hệ thức, bài toán thực tế chuyển động hoặc hình học..."
            className={`w-full px-3.5 py-2.5 text-xs sm:text-sm border ${borderCol} rounded-xl bg-white ${isIndigo ? 'focus:ring-indigo-500' : 'focus:ring-emerald-500'} focus:ring-2 outline-none placeholder:text-gray-400 font-normal leading-relaxed shadow-2xs`}
          />

          {/* Chips mẫu kiến thức trọng tâm */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] text-gray-500 font-semibold">
              Mẫu gợi ý nhanh:
            </span>
            {quickFocusSnippets.map((qf, qidx) => (
              <button
                key={qidx}
                type="button"
                onClick={() => handleUpdateScope(defaultTopicScope, qf.text)}
                className={`text-[11px] px-2 py-0.5 rounded-lg ${isIndigo ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'} border transition-all cursor-pointer font-medium`}
                title={qf.text}
              >
                + {qf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Xác nhận liên kết hệ thống */}
        <div className={`p-3 bg-white rounded-xl border ${isIndigo ? 'border-indigo-200 text-indigo-900' : 'border-emerald-200 text-emerald-900'} flex items-start gap-2.5 text-xs leading-relaxed shadow-2xs`}>
          <CheckCircle2 size={16} className={`${isIndigo ? 'text-indigo-600' : 'text-emerald-600'} shrink-0 mt-0.5`} />
          <div>
            <span className="font-bold">Cơ chế biên soạn tự động chuẩn hóa:</span> Hệ thống sẽ tự động đối chiếu Sách giáo khoa Toán Kết nối tri thức với cuộc sống (Lớp {newGrade || 8}) và Ngân hàng đề thi chuẩn Bộ GD&ĐT bám sát đầy đủ <strong>{selectedTopicTitles.length > 0 ? `${selectedTopicTitles.length} chuyên đề đã chọn (${selectedTopicTitles.join(', ')})` : (defaultTopicScope || 'Chuyên đề')}</strong> và <strong>kiến thức trọng tâm</strong> ở trên để tạo đề thi hoàn chỉnh kèm đáp án, bảng ma trận và lời giải KaTeX.
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* 2. TẠO ĐỀ TỪ ĐỀ TẢI LÊN: PHẦN 1: TẢI ĐỀ GỐC & TRÍCH XUẤT CÂU HỎI */}
      {/* ============================================================ */}
      {onlineCreationMode === 'upload' && (
        <div className="bg-white rounded-2xl border border-indigo-200/90 shadow-2xs overflow-hidden transition-all">
          <div className="bg-gradient-to-r from-indigo-50/90 via-purple-50/40 to-indigo-50/60 p-4 border-b border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-xs shrink-0">
                1
              </span>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-gray-900 tracking-tight flex items-center gap-2">
                  <span>1. Đề thi tải lên hoặc dán trực tiếp & Trích xuất câu hỏi</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                    Phần 1/2
                  </span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Tải lên tệp đề PDF, Word, Ảnh hoặc Dán trực tiếp nội dung đề bài (100% bám sát đề gốc)
                </p>
              </div>
            </div>
            <span className="text-xs text-indigo-800 font-bold bg-white/95 px-3 py-1.5 rounded-xl border border-indigo-200/80 shadow-2xs self-start sm:self-auto flex items-center gap-1.5">
              <Upload size={13} className="text-indigo-600" />
              <span>100% theo đề gốc</span>
            </span>
          </div>

          <div className="p-4 sm:p-5 space-y-4">
            {/* Thanh chuyển đổi phương thức: Tải tệp vs Nhập bằng Copy & Paste */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-indigo-100">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Phương thức nhập đề thi:
              </span>
              <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-indigo-200 shadow-2xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setUploadSourceType && setUploadSourceType('file')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    uploadSourceType !== 'text'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-gray-600 hover:text-indigo-700 hover:bg-indigo-50'
                  }`}
                >
                  <Upload size={13} />
                  <span>Tải lên tệp đề thi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadSourceType && setUploadSourceType('text')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    uploadSourceType === 'text'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-gray-600 hover:text-indigo-700 hover:bg-indigo-50'
                  }`}
                >
                  <FileText size={13} />
                  <span>Nhập đề bằng Copy & Paste</span>
                </button>
              </div>
            </div>

            {uploadSourceType === 'text' ? (
              /* B. NHẬP ĐỀ BẰNG COPY & PASTE */
              <div className="bg-gradient-to-br from-indigo-50/70 via-purple-50/30 to-white p-4 sm:p-5 rounded-xl border border-indigo-200 space-y-3.5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-indigo-950 uppercase tracking-wide flex items-center gap-1.5">
                      <FileText size={15} className="text-indigo-600" />
                      Dán trực tiếp văn bản đề thi (Copy & Paste)
                    </label>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Hỗ trợ dán văn bản từ Word, PDF, Web hoặc bảng trích xuất. AI sẽ tự động phân tích câu hỏi, công thức KaTeX, đáp án A-B-C-D và lời giải.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const text = await navigator.clipboard.readText();
                          if (text && setUploadPastedText) {
                            setUploadPastedText(text);
                          }
                        } catch (err) {
                          alert('Trình duyệt chặn truy cập Clipboard tự động. Vui lòng nhấn Ctrl + V để dán trực tiếp vào ô bên dưới.');
                        }
                      }}
                      className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                      title="Dán nhanh nội dung từ khay nhớ tạm"
                    >
                      <Clipboard size={12} />
                      <span>Dán từ Clipboard</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (setUploadPastedText) setUploadPastedText(SAMPLE_EXAM_PASTE_TEXT);
                      }}
                      className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                      title="Nạp cấu trúc đề mẫu chuẩn 3 phần của Bộ GD&ĐT"
                    >
                      <Sparkles size={12} />
                      <span>Chèn mẫu đề chuẩn Bộ GD&ĐT</span>
                    </button>
                    {uploadPastedText && (
                      <button
                        type="button"
                        onClick={() => {
                          if (setUploadPastedText) setUploadPastedText('');
                        }}
                        className="px-2 py-1 text-xs font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    rows={10}
                    value={uploadPastedText || ''}
                    onChange={(e) => setUploadPastedText && setUploadPastedText(e.target.value)}
                    placeholder={`Dán văn bản đề thi vào đây...\nVí dụ:\nĐỀ KIỂM TRA MÔN TOÁN\nPHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn...\nCâu 1: Cho hàm số y = f(x). Khẳng định nào đúng?\nA. Hàm số đồng biến trên (0; 2)\nB. Hàm số nghịch biến trên R\nC. Đồ thị đi qua điểm (1; 2)\nD. Cực đại tại x = 0\nĐáp án: A\nLời giải: Ta có đạo hàm...`}
                    className="w-full px-3.5 py-3 text-xs sm:text-sm font-mono border border-indigo-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-gray-400 placeholder:font-sans leading-relaxed shadow-2xs"
                  />
                  <div className="absolute right-3 bottom-3 text-[10px] text-gray-400 font-mono bg-white/90 px-1.5 py-0.5 rounded border border-gray-200">
                    {(uploadPastedText || '').length} ký tự
                  </div>
                </div>

                {/* Nút bấm trích xuất từ văn bản dán */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                  <span className="text-[11px] text-indigo-800 font-medium flex items-center gap-1.5">
                    <Sparkles size={13} className="text-indigo-600 shrink-0" />
                    Bấm nút để AI bóc tách câu hỏi, đáp án, lời giải và mở bảng chỉnh sửa trực tiếp.
                  </span>
                  <button
                    type="button"
                    disabled={!uploadPastedText || uploadPastedText.trim().length < 10 || isExtractingSingleFile}
                    onClick={() => {
                      if (onExtractSingleTextQuestions) {
                        onExtractSingleTextQuestions(uploadPastedText);
                      } else {
                        onExtractSingleFileQuestions();
                      }
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    {isExtractingSingleFile ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Đang phân tích văn bản & bóc tách...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Trích xuất câu hỏi từ văn bản vừa dán</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* A. TẢI TỆP ĐỀ BÀI TỪ MÁY TÍNH */
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
                      if (file) {
                        setTimeout(() => {
                          onExtractSingleFileQuestions(file);
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
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 cursor-pointer"
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
              </div>
            )}

              {/* Trạng thái trích xuất câu hỏi */}
              {isExtractingSingleFile && (
                <div className="p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between gap-3 text-xs text-indigo-950 animate-pulse shadow-2xs">
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
                      onClick={() => onExtractSingleFileQuestions()}
                      className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded-lg transition-colors text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw size={13} />
                      <span>Thử lại</span>
                    </button>
                    <button
                      type="button"
                      onClick={onAddQuestionToSingle}
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
                    onClick={() => onExtractSingleFileQuestions()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer"
                  >
                    <Sparkles size={14} />
                    <span>Trích xuất & Mở giao diện sửa</span>
                  </button>
                </div>
              )}

              {/* Danh sách câu hỏi đã trích xuất & Cho phép chỉnh sửa trực tiếp */}
              <UploadQuestionsReviewList
                questions={singleUploadedQuestions}
                totalPoints={totalCalculatedPoints}
                onAutoBalancePoints={onAutoBalancePoints}
                onOpenEditModal={onOpenEditModal}
                onAddQuestion={onAddQuestionToSingle}
                showReview={showReviewSingleQuestions}
                onToggleReview={onToggleReviewSingleQuestions}
                onUpdateQuestion={onUpdateSingleQuestion}
                onDuplicateQuestion={onDuplicateSingleQuestion}
                onDeleteQuestion={onDeleteSingleQuestion}
              />
            </div>
          </div>
        )}

      {/* ============================================================ */}
      {/* 3. TẠO ĐỀ THEO YÊU CẦU: PHẦN 1: FORM MÔ TẢ YÊU CẦU ĐỀ THI    */}
      {/* ============================================================ */}
      {(onlineCreationMode === 'auto' || onlineCreationMode === 'matrix') && (
        <div className={`bg-white rounded-2xl border ${onlineCreationMode === 'matrix' ? 'border-purple-200/90' : 'border-indigo-200/90'} shadow-2xs overflow-hidden transition-all`}>
          <div className={`bg-gradient-to-r ${onlineCreationMode === 'matrix' ? 'from-purple-50/90 via-indigo-50/40 to-purple-50/60 border-purple-100' : 'from-indigo-50/90 via-purple-50/40 to-indigo-50/60 border-indigo-100'} p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2.5`}>
            <div className="flex items-center gap-3">
              <span className={`w-7 h-7 rounded-xl ${onlineCreationMode === 'matrix' ? 'bg-purple-600' : 'bg-indigo-600'} text-white flex items-center justify-center text-xs font-black shadow-xs shrink-0`}>
                {onlineCreationMode === 'matrix' ? <LayoutGrid size={15} /> : '1'}
              </span>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-gray-900 tracking-tight flex items-center gap-2">
                  <span>{onlineCreationMode === 'matrix' ? '1. Ma trận đề thi và bản đặc tả' : '1. Hình thức đề thi'}</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${onlineCreationMode === 'matrix' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-indigo-100 text-indigo-800 border border-indigo-200'}`}>
                    {onlineCreationMode === 'matrix' ? 'Phần 1/2' : 'Phần 1/4'}
                  </span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {onlineCreationMode === 'matrix' 
                    ? 'Tất cả nội dung, phạm vi kiến thức và cấu trúc đề thi đều lấy theo ma trận đặc tả. Nội dung kiến thức tham chiếu được lấy mặc định theo thư viện tài liệu tham chiếu.'
                    : 'Thiết lập dạng trắc nghiệm 3 phần (chuẩn Bộ GD&ĐT), trắc nghiệm tùy biến, tự luận hoặc đề tổng hợp'}
                </p>
              </div>
            </div>
            <span className={`text-xs ${onlineCreationMode === 'matrix' ? 'text-purple-800 border-purple-200/80' : 'text-indigo-800 border-indigo-200/80'} font-bold bg-white/95 px-3 py-1.5 rounded-xl border shadow-2xs self-start sm:self-auto flex items-center gap-1.5`}>
              <Scale size={13} className={onlineCreationMode === 'matrix' ? 'text-purple-600' : 'text-indigo-600'} />
              <span>{onlineCreationMode === 'matrix' ? 'Ma trận & Bản đặc tả' : 'Cấu trúc & Biểu điểm'}</span>
            </span>
          </div>

          <div className="p-4 sm:p-5 space-y-6">
            {/* KHUNG MA TRẬN MỨC ĐỘ NHẬN THỨC CHO PHƯƠNG THỨC: TẠO ĐỀ THEO MA TRẬN */}
            {onlineCreationMode === 'matrix' && (
              <div className="p-4 sm:p-5 bg-gradient-to-br from-purple-50/70 via-indigo-50/30 to-white rounded-2xl border-2 border-purple-200 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-purple-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <LayoutGrid size={17} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-purple-950 flex items-center gap-2">
                        <span>Ma trận đề thi & Bản đặc tả chi tiết</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                          Chuẩn GDPT 2018
                        </span>
                      </h4>
                      <p className="text-xs text-purple-700">
                        Căn cứ xác định cấu trúc, nội dung, phạm vi kiến thức và mức độ nhận thức (NB - TH - VD - VDC)
                      </p>
                    </div>
                  </div>

                  {/* 3 Phương thức nhập: Tải lên tệp vs Copy & Paste vs Khung có sẵn */}
                  <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-purple-200 shadow-2xs self-start sm:self-auto flex-wrap">
                    <button
                      type="button"
                      onClick={() => setMatrixSourceType('file')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        matrixSourceType === 'file'
                          ? 'bg-purple-600 text-white shadow-2xs'
                          : 'text-gray-600 hover:text-purple-700 hover:bg-purple-50'
                      }`}
                    >
                      <Upload size={13} />
                      <span>Tải lên tệp ma trận</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMatrixSourceType('text')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        matrixSourceType === 'text'
                          ? 'bg-purple-600 text-white shadow-2xs'
                          : 'text-gray-600 hover:text-purple-700 hover:bg-purple-50'
                      }`}
                    >
                      <FileText size={13} />
                      <span>Nhập đề bằng Copy & Paste</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMatrixSourceType('preset')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        matrixSourceType === 'preset'
                          ? 'bg-purple-600 text-white shadow-2xs'
                          : 'text-gray-600 hover:text-purple-700 hover:bg-purple-50'
                      }`}
                    >
                      <Sliders size={13} />
                      <span>Khung ma trận tỉ lệ nhanh</span>
                    </button>
                  </div>
                </div>

                {/* 1. NGUỒN COPY & PASTE MA TRẬN & BẢN ĐẶC TẢ */}
                {matrixSourceType === 'text' && (
                  <div className="bg-white rounded-xl border border-purple-200 p-4 space-y-3 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                          <FileText size={14} className="text-purple-600" />
                          <span>Dán nội dung Ma trận & Bản đặc tả chi tiết đề thi:</span>
                        </span>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Dán trực tiếp văn bản từ file Word, Excel, PDF hoặc thông tư của Bộ GD&ĐT. AI sẽ tự động đọc từng chủ đề, mức độ nhận thức và yêu cầu cần đạt.
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const text = await navigator.clipboard.readText();
                              if (text && setMatrixText) {
                                setMatrixText(text);
                              }
                            } catch (err) {
                              alert('Trình duyệt chặn truy cập Clipboard tự động. Vui lòng bấm Ctrl + V để dán.');
                            }
                          }}
                          className="px-2.5 py-1 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Clipboard size={12} />
                          <span>Dán từ Clipboard</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (setMatrixText) setMatrixText(SAMPLE_MATRIX_SPEC_TEXT);
                          }}
                          className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                          title="Nạp mẫu Ma trận & Bản đặc tả đề thi chuẩn Bộ GD&ĐT"
                        >
                          <Sparkles size={12} />
                          <span>Chèn mẫu Ma trận & Bản đặc tả chuẩn</span>
                        </button>
                        {matrixText && (
                          <button
                            type="button"
                            onClick={() => {
                              if (setMatrixText) setMatrixText('');
                            }}
                            className="px-2 py-1 text-xs font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="relative">
                      <textarea
                        rows={10}
                        value={matrixText || ''}
                        onChange={(e) => setMatrixText && setMatrixText(e.target.value)}
                        placeholder={`Dán nội dung Ma trận đề thi & Bản đặc tả vào đây...\nVí dụ:\nI. KHUNG MA TRẬN ĐỀ THI KIỂM TRA MÔN TOÁN\n- Mạch kiến thức: Đại số & Một số yếu tố giải tích (60%), Hình học (40%)\n- Tỉ lệ nhận thức: Nhận biết: 40%, Thông hiểu: 30%, Vận dụng: 20%, Vận dụng cao: 10%\n\nII. BẢN ĐẶC TẢ CHI TIẾT CÂU HỎI:\n- Câu 1 (NB): Nhận biết khái niệm và công thức cơ bản...\n- Câu 2 (TH): Biến đổi và giải phương trình...\n- Câu 3 (VD): Bài toán thực tế liên hệ nhiều bước...`}
                        className="w-full px-3.5 py-3 text-xs sm:text-sm font-mono border border-purple-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 outline-none placeholder:text-gray-400 placeholder:font-sans leading-relaxed shadow-2xs"
                      />
                      <div className="absolute right-3 bottom-3 text-[10px] text-gray-400 font-mono bg-white/90 px-1.5 py-0.5 rounded border border-gray-200">
                        {(matrixText || '').length} ký tự
                      </div>
                    </div>

                    <div className="text-[11px] text-purple-900 bg-purple-50/70 p-2.5 rounded-lg border border-purple-200 flex items-center gap-2">
                      <Sparkles size={14} className="text-purple-600 shrink-0" />
                      <span>Hệ thống sẽ bám sát 100% các yêu cầu cần đạt, chủ đề và số câu đã chỉ định trong bản đặc tả để sinh câu hỏi và đáp án chính xác.</span>
                    </div>
                  </div>
                )}

                {/* 2. NGUỒN TẢI LÊN TỆP MA TRẬN */}
                {matrixSourceType === 'file' && (
                  <div className="p-5 bg-white rounded-xl border border-dashed border-purple-300 text-center space-y-3 shadow-2xs">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-2xs">
                      <FileSpreadsheet size={24} />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-sm text-gray-900">
                        Tải lên tệp Ma trận đề thi / Bản đặc tả từ máy tính
                      </h5>
                      <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                        Hỗ trợ tệp <strong>Excel (.xlsx, .xls), Word (.docx, .doc), PDF, Ảnh chụp</strong> ma trận đề thi. AI sẽ tự động đọc tỉ lệ và phân bổ câu hỏi.
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-center gap-3">
                      <input
                        type="file"
                        id="matrix-file-input"
                        className="hidden"
                        accept=".xlsx,.xls,.docx,.doc,.pdf,.png,.jpg,.jpeg"
                        onChange={(e) => {
                          const file = e.target.files ? e.target.files[0] : null;
                          setMatrixFile(file);
                        }}
                      />
                      <label
                        htmlFor="matrix-file-input"
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-sm cursor-pointer transition-all flex items-center gap-2"
                      >
                        <Upload size={14} />
                        <span>Chọn tệp ma trận từ máy tính</span>
                      </label>
                    </div>

                    {matrixFile && (
                      <div className="mt-3 p-3 bg-purple-50 rounded-xl border border-purple-200 text-left flex items-center justify-between gap-3 max-w-md mx-auto shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileCheck size={18} className="text-purple-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-purple-950 truncate">{matrixFile.name}</p>
                            <p className="text-[10px] text-purple-700">{(matrixFile.size / 1024).toFixed(1)} KB • Đã sẵn sàng phân tích ma trận</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setMatrixFile(null)}
                          className="text-xs font-bold text-rose-600 hover:text-rose-800 shrink-0 px-2 py-1 rounded bg-white border border-rose-200 cursor-pointer"
                        >
                          Xóa
                        </button>
                      </div>
                    )}

                    <div className="text-[11px] text-purple-800 bg-purple-50/70 p-2.5 rounded-lg border border-purple-200 font-medium max-w-lg mx-auto flex items-center gap-2">
                      <Sparkles size={14} className="text-purple-600 shrink-0" />
                      <span>AI sẽ tự động trích xuất các cột Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao từ tệp ma trận để tạo đề.</span>
                    </div>
                  </div>
                )}

                {/* 3. NGUỒN KHUNG MA TRẬN CÓ SẴN (PRESET) */}
                {matrixSourceType === 'preset' && (
                  <div className="space-y-4">
                    {/* 4 Mẫu Ma trận Presets */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {(matrixPresets || []).map((mp) => {
                        const isSelected = selectedMatrixPreset === mp.id;
                        return (
                          <button
                            key={mp.id}
                            type="button"
                            onClick={() => applyMatrixPreset(mp)}
                            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-purple-50/90 border-purple-500 ring-2 ring-purple-300 shadow-xs'
                                : 'bg-white border-purple-100 hover:border-purple-300 hover:bg-purple-50/40 shadow-2xs'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="font-bold text-xs text-gray-900 leading-tight">
                                  {mp.name.split('(')[0].trim()}
                                </span>
                                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                                  isSelected ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {mp.badge}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                                {mp.desc}
                              </p>
                            </div>

                            {/* Mini indicators */}
                            <div className="mt-2.5 pt-2 border-t border-purple-100/80 flex items-center justify-between text-[11px] font-bold">
                              <span className="text-blue-600" title="Nhận biết">{mp.recognize}% NB</span>
                              <span className="text-gray-300">•</span>
                              <span className="text-emerald-600" title="Thông hiểu">{mp.understand}% TH</span>
                              <span className="text-gray-300">•</span>
                              <span className="text-amber-600" title="Vận dụng">{mp.apply}% VD</span>
                              <span className="text-gray-300">•</span>
                              <span className="text-rose-600" title="Vận dụng cao">{mp.highApply}% VDC</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* BẢNG ĐIỀU CHỈNH TỈ LỆ CHI TIẾT */}
                    <div className="bg-white rounded-xl border border-purple-200 p-4 space-y-3.5 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                          <Sliders size={14} className="text-purple-600" />
                          <span>Tùy chỉnh phân bổ tỉ lệ 4 mức độ nhận thức:</span>
                        </span>

                        {/* Kiểm tra tổng 100% */}
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                            totalMatrixPercent === 100
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                          }`}>
                            {totalMatrixPercent === 100 ? (
                              <CheckCircle2 size={13} className="text-emerald-600" />
                            ) : (
                              <AlertCircle size={13} className="text-rose-600" />
                            )}
                            <span>Tổng: {totalMatrixPercent}%</span>
                          </span>

                          {totalMatrixPercent !== 100 && (
                            <button
                              type="button"
                              onClick={handleBalanceMatrixPercent}
                              className="px-2.5 py-1 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-300 rounded-lg transition-colors cursor-pointer"
                            >
                              Cân bằng về 100%
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 4 Thanh trượt / Số % */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* 1. Nhận biết */}
                        <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-blue-950">
                            <span>1. Nhận biết (NB)</span>
                            <span className="text-blue-700 font-extrabold">{matrixConfig?.levels?.recognize ?? 40}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={matrixConfig?.levels?.recognize ?? 40}
                            onChange={(e) => updateMatrixLevel('recognize', parseInt(e.target.value, 10))}
                            className="w-full accent-blue-600 cursor-pointer"
                          />
                          <p className="text-[10px] text-blue-700/80">Nhận diện định nghĩa, công thức, khái niệm cơ bản</p>
                        </div>

                        {/* 2. Thông hiểu */}
                        <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                            <span>2. Thông hiểu (TH)</span>
                            <span className="text-emerald-700 font-extrabold">{matrixConfig?.levels?.understand ?? 30}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={matrixConfig?.levels?.understand ?? 30}
                            onChange={(e) => updateMatrixLevel('understand', parseInt(e.target.value, 10))}
                            className="w-full accent-emerald-600 cursor-pointer"
                          />
                          <p className="text-[10px] text-emerald-700/80">Giải thích, tính toán trực tiếp, biến đổi đơn giản</p>
                        </div>

                        {/* 3. Vận dụng */}
                        <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-amber-950">
                            <span>3. Vận dụng (VD)</span>
                            <span className="text-amber-700 font-extrabold">{matrixConfig?.levels?.apply ?? 20}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={matrixConfig?.levels?.apply ?? 20}
                            onChange={(e) => updateMatrixLevel('apply', parseInt(e.target.value, 10))}
                            className="w-full accent-amber-600 cursor-pointer"
                          />
                          <p className="text-[10px] text-amber-700/80">Vận dụng liên kết nhiều bước, giải toán thực tế</p>
                        </div>

                        {/* 4. Vận dụng cao */}
                        <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200 space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-rose-950">
                            <span>4. Vận dụng cao (VDC)</span>
                            <span className="text-rose-700 font-extrabold">{matrixConfig?.levels?.highApply ?? 10}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={matrixConfig?.levels?.highApply ?? 10}
                            onChange={(e) => updateMatrixLevel('highApply', parseInt(e.target.value, 10))}
                            className="w-full accent-rose-600 cursor-pointer"
                          />
                          <p className="text-[10px] text-rose-700/80">Bài toán phân loại, cực trị, sáng tạo và tư duy cao</p>
                        </div>
                      </div>

                      {/* Ghi chú ma trận */}
                      <div className="pt-2">
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Ghi chú yêu cầu ma trận (Tùy chọn):
                        </label>
                        <input
                          type="text"
                          value={matrixConfig?.notes || ''}
                          onChange={(e) => {
                            if (setMatrixConfig) {
                              setMatrixConfig((prev: any) => ({ ...prev, notes: e.target.value }));
                            }
                          }}
                          placeholder="Ví dụ: Ưu tiên câu VDC vào phần Đại số đa thức; câu TH vào hình học tứ giác..."
                          className="w-full px-3 py-1.5 text-xs border border-purple-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* LỰA CHỌN HÌNH THỨC CÂU HỎI */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Scale size={14} className={onlineCreationMode === 'matrix' ? 'text-purple-600' : 'text-indigo-600'} />
                <h4 className="font-extrabold text-xs text-gray-900">
                  {onlineCreationMode === 'matrix' ? 'Lựa chọn hình thức câu hỏi bám sát ma trận:' : 'Hình thức cấu trúc câu hỏi:'}
                </h4>
              </div>
            <>
              {/* 4 Thẻ chọn hình thức đề thi */}
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
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
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
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
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
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
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
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
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

              {/* Mẫu gợi ý đi kèm của hình thức này */}
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
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
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

              {/* Chi tiết số câu các phần */}
              <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
                    <BookOpen size={14} className="text-blue-600" />
                    Cấu trúc số câu chi tiết
                  </label>
                  <span className="text-[11px] text-gray-500">Giáo viên có thể điều chỉnh số câu theo nhu cầu</span>
                </div>

                {/* Dành cho Trắc nghiệm 3 phần */}
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

                {/* Dành cho Trắc nghiệm tùy biến */}
                {examFormat === 'mcq_custom' && (
                  <div className="space-y-2">
                    <p className="text-xs text-indigo-700 font-medium">
                      Chọn 1 hoặc tối đa 2 phần từ cấu trúc 3 phần:
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
                                  if (setSysError) {
                                    setSysError('Dạng tùy biến chỉ cho phép chọn 1 hoặc 2 phần!');
                                    setTimeout(() => setSysError(''), 4000);
                                  }
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
                                  if (setSysError) {
                                    setSysError('Dạng tùy biến chỉ cho phép chọn 1 hoặc 2 phần!');
                                    setTimeout(() => setSysError(''), 4000);
                                  }
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
                                  if (setSysError) {
                                    setSysError('Dạng tùy biến chỉ cho phép chọn 1 hoặc 2 phần!');
                                    setTimeout(() => setSysError(''), 4000);
                                  }
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

                {/* Dành cho Tự luận */}
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

                {/* Dành cho Tổng hợp */}
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
            </>

            {/* THẺ TÀI LIỆU THAM CHIẾU MẶC ĐỊNH (KHI TẠO ĐỀ THEO MA TRẬN) */}
            {onlineCreationMode === 'matrix' && (
              <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-50/80 via-teal-50/30 to-white rounded-2xl border-2 border-emerald-200 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                      <BookOpenCheck size={18} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs sm:text-sm text-emerald-950 flex items-center gap-2 flex-wrap">
                        <span>Tài liệu tham chiếu: Mặc định theo Thư viện tài liệu tham chiếu</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Tự động liên kết
                        </span>
                      </h4>
                      <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                        Hệ thống tự động liên kết học liệu chuẩn: <strong>Sách giáo khoa Toán Kết nối tri thức với cuộc sống (Lớp {newGrade || 9})</strong>, <strong>Ngân hàng đề thi chuẩn hóa</strong> và <strong>Thư viện số của nhà trường</strong>.
                      </p>
                      <p className="text-[11px] text-gray-600 mt-1">
                        Tất cả nội dung và phạm vi kiến thức, cấu trúc đề thi đều lấy theo ma trận đặc tả ở trên. Không cần thiết lập thủ công phạm vi kiến thức.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onOpenRefSelectorModal}
                    className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
                    title="Mở Thư viện tài liệu nếu bạn muốn chỉ định bài học hoặc tệp tài liệu cụ thể"
                  >
                    <BookOpen size={13} className="text-emerald-600" />
                    <span>Duyệt Thư viện tài liệu</span>
                  </button>
                </div>

                {activeRef && (
                  <div className="p-3 bg-white rounded-xl border border-emerald-300 flex items-center justify-between gap-2 text-xs text-emerald-900 shadow-2xs">
                    <div className="flex items-center gap-2 truncate">
                      <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                      <span className="truncate">Tài liệu tham chiếu được chọn: <strong>{activeRef.lessonTitle}</strong> ({activeRef.topicName})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveRef(null)}
                      className="text-[11px] font-bold text-red-600 hover:underline shrink-0 cursor-pointer"
                    >
                      Bỏ chọn (Dùng mặc định)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* ============================================================ */}
      {/* PHẦN 2: TÀI LIỆU THAM CHIẾU (CHỈ KHI TẠO ĐỀ TỰ ĐỘNG)          */}
      {/* ============================================================ */}
      {onlineCreationMode === 'auto' && (
        <div className="bg-white rounded-2xl border border-emerald-200/90 shadow-2xs overflow-hidden transition-all">
        <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/40 to-emerald-50/60 p-4 border-b border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs shrink-0">
              2
            </span>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-gray-900 tracking-tight flex items-center gap-2">
                <span>2. Tài liệu tham chiếu</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Phần 2/4
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Căn cứ nguồn học liệu để hệ thống tự động liên kết và trích xuất câu hỏi chuẩn mực
              </p>
            </div>
          </div>
          <span className="text-xs text-emerald-800 font-bold bg-white/95 px-3 py-1.5 rounded-xl border border-emerald-200/80 shadow-2xs self-start sm:self-auto flex items-center gap-1.5">
            <BookOpenCheck size={13} className="text-emerald-600" />
            <span>Học liệu chuẩn hóa</span>
          </span>
        </div>

        <div className="p-4 sm:p-5 space-y-5">
          {/* 3.1. Chọn phương thức tài liệu tham chiếu (2 Thẻ lựa chọn) */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
              Lựa chọn nguồn tài liệu tham chiếu căn cứ:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Thẻ 1: Mặc định (Tự động liên kết SGK KNTT, Ngân hàng đề, Học liệu Bộ GD&ĐT) */}
              <div
                onClick={() => {
                  setRefMode('default');
                  if (activeRef) setActiveRef(null);
                }}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all relative ${
                  refMode === 'default'
                    ? 'border-emerald-500 bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white shadow-xs'
                    : 'border-gray-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      refMode === 'default' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs sm:text-sm text-gray-900 flex items-center gap-2">
                        <span>Tài liệu tham chiếu mặc định</span>
                      </h4>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                        Tự động liên kết • Chuẩn Bộ GD&ĐT
                      </span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                    refMode === 'default' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-300'
                  }`}>
                    {refMode === 'default' && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>

                <p className="text-[11px] text-gray-600 mt-2.5 leading-relaxed">
                  Tự động liên kết học liệu chuẩn: <strong>SGK Toán Kết nối tri thức với cuộc sống (Lớp {newGrade || 9})</strong>, <strong>Ngân hàng đề thi chuẩn hóa</strong> và <strong>các nguồn học liệu chất lượng cao của Bộ GD&ĐT</strong>.
                </p>

                {refMode === 'default' && (
                  <div className="mt-3 pt-2.5 border-t border-emerald-100 flex items-center gap-1.5 text-[11px] font-bold text-emerald-800">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>Đang kích hoạt chế độ mặc định • Áp dụng mục Phạm vi kiến thức bên dưới</span>
                  </div>
                )}
              </div>

              {/* Thẻ 2: Do giáo viên chọn từ Thư viện (Theo chuyên đề & Chọn bài, không tải lên) */}
              <div
                onClick={() => {
                  setRefMode('custom_library');
                }}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all relative ${
                  refMode === 'custom_library'
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-white shadow-xs'
                    : 'border-gray-200 hover:border-blue-300 bg-white hover:bg-blue-50/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      refMode === 'custom_library' ? 'bg-blue-600 text-white shadow-xs' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Library size={16} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs sm:text-sm text-gray-900 flex items-center gap-2">
                        <span>Tùy chọn do giáo viên chọn</span>
                      </h4>
                      <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                        Thư viện hệ thống • Tự liên kết, không tải lên
                      </span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                    refMode === 'custom_library' ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
                  }`}>
                    {refMode === 'custom_library' && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>

                <p className="text-[11px] text-gray-600 mt-2.5 leading-relaxed">
                  Tùy chọn theo <strong>chuyên đề</strong> và <strong>chọn bài trong thư viện</strong>. Hệ thống tự liên kết nội dung học liệu để biên soạn trực tiếp, <strong>không tải lên tệp ngoài</strong>.
                </p>

                {refMode === 'custom_library' && (
                  <div className="mt-3 pt-2.5 border-t border-blue-100 flex items-center gap-1.5 text-[11px] font-bold text-blue-800">
                    <CheckCircle2 size={13} className="text-blue-600" />
                    <span>{activeRef ? `Đã liên kết bài: "${activeRef.lessonTitle}"` : 'Vui lòng chọn Chuyên đề & Bài học bên dưới'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chi tiết nội dung tương ứng theo chế độ */}

          {/* TRƯỜNG HỢP 1: TÀI LIỆU THAM CHIẾU MẶC ĐỊNH */}
          {refMode === 'default' && (
            <div className="space-y-4">
              {/* Thẻ hiển thị các nguồn mặc định được tự động nạp */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
                    <BookMarked size={16} className="text-emerald-600" />
                    4 Nguồn tài liệu tham chiếu chuẩn mực được liên kết tự động:
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Hệ thống tự động nạp
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-white border border-emerald-100 shadow-2xs flex items-start gap-2.5">
                    <span className="text-base leading-none">📗</span>
                    <div>
                      <strong className="text-gray-900 block font-bold">SGK Toán Kết nối tri thức với cuộc sống</strong>
                      <span className="text-[11px] text-gray-600">Môn Toán lớp {newGrade || 9} (Tập 1 & Tập 2) - Chuẩn GDPT 2018</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-emerald-100 shadow-2xs flex items-start gap-2.5">
                    <span className="text-base leading-none">🏛️</span>
                    <div>
                      <strong className="text-gray-900 block font-bold">Ngân hàng đề thi chuẩn hóa Bộ GD&ĐT</strong>
                      <span className="text-[11px] text-gray-600">Định dạng mới: Trắc nghiệm 4 lựa chọn, Đúng/Sai, Trả lời ngắn & Tự luận</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-emerald-100 shadow-2xs flex items-start gap-2.5">
                    <span className="text-base leading-none">📚</span>
                    <div>
                      <strong className="text-gray-900 block font-bold">Thư viện tài liệu học liệu số ESMART</strong>
                      <span className="text-[11px] text-gray-600">Kho bài tập, chuyên đề chuẩn hóa KaTeX và lời giải chi tiết</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-emerald-100 shadow-2xs flex items-start gap-2.5">
                    <span className="text-base leading-none">🎓</span>
                    <div>
                      <strong className="text-gray-900 block font-bold">Nguồn học liệu chất lượng cao của Bộ GD&ĐT</strong>
                      <span className="text-[11px] text-gray-600">Đề thi khảo sát chất lượng, tài liệu bồi dưỡng chuẩn ma trận năng lực</span>
                    </div>
                  </div>
                </div>
              </div>

                            {/* Thông báo kết nối và đính kèm tài liệu tham khảo bổ sung */}
              <div className="p-4 bg-white rounded-xl border border-emerald-200 flex items-start gap-3 text-xs text-emerald-950 leading-relaxed shadow-2xs">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-extrabold text-emerald-900 block text-xs sm:text-sm mb-0.5">
                    Đã liên kết tự động 4 nguồn học liệu chuẩn GDPT 2018:
                  </strong>
                  <p className="text-gray-600 leading-relaxed">
                    Hệ thống tự động tham chiếu SGK Toán Kết nối tri thức (Lớp {newGrade || "8"}), Ngân hàng đề thi chuẩn Bộ GD&ĐT và Thư viện học liệu số ESMART. Thầy/cô vui lòng chọn các chuyên đề cần ra đề và ma trận mức độ nhận thức tại <strong className="text-emerald-900">Phần 3: Phạm vi kiến thức</strong> ngay bên dưới.
                  </p>
                </div>
              </div>

              {/* Tải lên tệp tài liệu tham khảo bổ sung nếu có */}
              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <FileText size={16} />
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 block">Tài liệu tham khảo bổ sung (tùy chọn):</span>
                    <span className="text-[11px] text-gray-500">Đính kèm tệp PDF/Word/Ảnh giáo trình hoặc đề cương riêng của trường nếu muốn AI bám sát thêm</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="file"
                    id="ref-extra-file-default"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setReferenceFile(e.target.files[0]);
                      }
                    }}
                  />
                  {referenceFile ? (
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-900 font-bold text-xs shadow-2xs">
                      <span className="truncate max-w-[160px]">{referenceFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setReferenceFile(null)}
                        className="text-red-500 hover:text-red-700 ml-1 font-bold cursor-pointer"
                        title="Hủy tệp tham khảo"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="ref-extra-file-default"
                      className="px-3.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg font-bold text-xs cursor-pointer shadow-2xs transition-all flex items-center gap-1.5"
                    >
                      <Upload size={13} />
                      <span>Chọn tệp đính kèm</span>
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TRƯỜNG HỢP 2: TÙY CHỌN TÀI LIỆU DO GIÁO VIÊN CHỌN TỪ THƯ VIỆN */}
          {refMode === 'custom_library' && (
            <div className="space-y-4">
              <div className="p-4 sm:p-5 rounded-xl border-2 border-blue-300 bg-gradient-to-br from-blue-50/60 via-indigo-50/30 to-white shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-100">
                  <div className="flex items-start sm:items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs shrink-0">
                      <Library size={18} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs sm:text-sm text-gray-900 flex items-center gap-2">
                        <span>Chọn tài liệu từ Thư viện học liệu hệ thống</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          Tự liên kết & Biên soạn trực tiếp
                        </span>
                      </h4>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Tùy chọn theo chuyên đề và chọn bài học trong thư viện. Hệ thống tự động liên kết và biên soạn, <strong className="text-blue-800">không cần tải lên tệp</strong>.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onOpenRefSelectorModal}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
                  >
                    <BookOpen size={14} />
                    <span>Duyệt toàn bộ Thư viện tài liệu</span>
                  </button>
                </div>

                {/* Bộ chọn 2 cấp: Theo Chuyên đề & Chọn Bài học */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Cấp 1: Tùy chọn theo Chuyên đề */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <Layers size={13} className="text-blue-600" />
                      <span>1. Chọn Chuyên đề trong Thư viện:</span>
                    </label>
                    <select
                      value={selectedRefTopicId}
                      onChange={(e) => {
                        const tId = e.target.value;
                        setSelectedRefTopicId(tId);
                        setSelectedRefLessonId('');
                        if (tId && tId !== 'all') {
                          const foundT = topics.find(t => t.id === tId);
                          if (foundT?.grade) {
                            setNewGrade(foundT.grade.toString());
                          }
                          setNewTopicId(tId);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold border border-blue-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-2xs"
                    >
                      <option value="all">-- Xem tất cả chuyên đề (Khối {newGrade || 8}) --</option>
                      {gradeTopics.map(t => {
                        const count = lessons.filter(l => l.topicId === t.id).length;
                        return (
                          <option key={t.id} value={t.id}>
                            {t.title || t.name} {count > 0 ? `(${count} bài học)` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Cấp 2: Chọn Bài học trong Thư viện */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <BookOpen size={13} className="text-blue-600" />
                      <span>2. Chọn Bài học trong Thư viện:</span>
                    </label>
                    <select
                      value={selectedRefLessonId}
                      onChange={(e) => handleSelectLessonFromDropdown(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold border border-blue-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-2xs"
                    >
                      <option value="">-- Chọn bài học để liên kết tham chiếu --</option>
                      {availableLessons.map(l => (
                        <option key={l.id} value={l.id}>
                          {l.title} {l.attachment?.name ? `[📎 ${l.attachment.name}]` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Thẻ hiển thị tài liệu đã liên kết */}
                {activeRef ? (
                  <div className="pt-2">
                    <div className="p-3.5 bg-white rounded-xl border border-blue-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-xs sm:text-sm text-gray-900">
                              {activeRef.lessonTitle}
                            </span>
                            <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                              {activeRef.topicName} (Khối {activeRef.grade})
                            </span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                              ✅ Đã tự động liên kết học liệu
                            </span>
                          </div>
                          {activeRef.attachment?.name && (
                            <p className="text-[11px] text-gray-600 mt-1 flex items-center gap-1.5">
                              <FileText size={12} className="text-blue-600" />
                              <span>Tệp đính kèm trong thư viện: <strong>{activeRef.attachment.name}</strong></span>
                            </p>
                          )}
                          {activeRef.knowledge && (
                            <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 italic">
                              "{activeRef.knowledge.replace(/\n+/g, ' ').slice(0, 150)}..."
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        {activeRef.attachment?.dataUrl && (
                          <button
                            type="button"
                            onClick={onLoadRefAttachmentAsTest}
                            className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                            title="Nạp tệp này làm đề thi và trích xuất câu hỏi ngay lập tức"
                          >
                            <Sparkles size={13} />
                            <span>Nạp tệp làm đề & Trích xuất câu hỏi</span>
                          </button>
                        )}

                        {activeRef.knowledge && (
                          <button
                            type="button"
                            onClick={onExtractFromRefKnowledge}
                            disabled={isExtractingSingleFile}
                            className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                            title="Bóc tách câu hỏi và đáp án trực tiếp từ nội dung văn bản của tài liệu thư viện này"
                          >
                            <Sparkles size={13} />
                            <span>Trích xuất đề từ nội dung tài liệu</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setActiveRef(null);
                            setSelectedRefLessonId('');
                          }}
                          className="px-2.5 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Hủy liên kết
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-xs text-blue-900 leading-relaxed flex items-center gap-2">
                    <AlertCircle size={15} className="text-blue-600 shrink-0" />
                    <span>
                      Vui lòng chọn <strong>Chuyên đề</strong> và <strong>Bài học</strong> ở trên hoặc bấm nút <strong>Duyệt toàn bộ Thư viện tài liệu</strong> để chọn bài học tham chiếu.
                    </span>
                  </div>
                )}

                {/* Thông báo phạm vi kiến thức khi ở chế độ thư viện */}
                <div className="p-3 bg-white rounded-xl border border-blue-200 flex items-start gap-2.5 text-xs text-gray-700 leading-relaxed shadow-2xs">
                  <CheckCircle2 size={15} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-gray-900">Phạm vi kiến thức tự động:</span> Khi bạn chọn tài liệu từ Thư viện, hệ thống sẽ tự động lấy toàn bộ nội dung lý thuyết, dạng bài và kiến thức chuẩn của bài học <strong>{activeRef ? activeRef.lessonTitle : 'được chọn'}</strong> để biên soạn đề thi. Không cần nhập thủ công phạm vi kiến thức.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* ============================================================ */}
      {/* PHẦN 3: PHẠM VI KIẾN THỨC (CHỈ KHI TẠO ĐỀ TỰ ĐỘNG)           */}
      {/* ============================================================ */}
      {onlineCreationMode === "auto" && (
        <div className="bg-white rounded-2xl border border-teal-200/90 shadow-2xs overflow-hidden transition-all">
          <div className="bg-gradient-to-r from-teal-50/90 via-emerald-50/40 to-teal-50/60 p-4 border-b border-teal-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-xl bg-teal-600 text-white flex items-center justify-center text-xs font-black shadow-xs shrink-0">
                3
              </span>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-gray-900 tracking-tight flex items-center gap-2">
                  <span>3. Phạm vi kiến thức</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                    Phần 3/4
                  </span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Lựa chọn khối lớp, chuyên đề chuẩn SGK Toán Kết nối tri thức, kiến thức trọng tâm và ma trận mức độ nhận thức
                </p>
              </div>
            </div>
            <span className="text-xs text-teal-800 font-bold bg-white/95 px-3 py-1.5 rounded-xl border border-teal-200/80 shadow-2xs self-start sm:self-auto flex items-center gap-1.5">
              <Target size={13} className="text-teal-600" />
              <span>SGK Toán KNTT & Ma trận năng lực</span>
            </span>
          </div>

          <div className="p-4 sm:p-5">
            {renderKnowledgeScopeUI("emerald", "3. Phạm vi kiến thức đề thi", "Chuẩn SGK Toán Kết nối tri thức & Ma trận Bộ GD&ĐT")}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* PHẦN THÔNG TIN ĐỀ THI: PHẦN 2/2 CHO MATRIX/UPLOAD, 4/4 CHO AUTO */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl border border-purple-200/90 shadow-2xs overflow-hidden transition-all">
        <div className="bg-gradient-to-r from-purple-50/90 via-indigo-50/40 to-purple-50/60 p-4 border-b border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center text-xs font-black shadow-xs shrink-0">
              {(onlineCreationMode === 'matrix' || onlineCreationMode === 'upload') ? '2' : '4'}
            </span>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-gray-900 tracking-tight flex items-center gap-2">
                <span>
                  {onlineCreationMode === 'matrix' 
                    ? '2. Thông tin đề thi' 
                    : onlineCreationMode === 'upload' 
                      ? '2. Thông tin cơ bản đề thi' 
                      : '4. Thông tin cơ bản đề thi'}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                  {(onlineCreationMode === 'matrix' || onlineCreationMode === 'upload') ? 'Phần 2/2' : 'Phần 4/4'}
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {onlineCreationMode === 'matrix'
                  ? 'Đặt tên đề thi, khối lớp, thời gian làm bài, năm học, chuyên đề lưu trữ và các tùy chọn xáo trộn'
                  : 'Đặt tên đề thi, chỉ định năm học, khối lớp, thời gian làm bài, chuyên đề lưu trữ và tùy chọn sinh nhiều mã đề'}
              </p>
            </div>
          </div>
          <span className="text-xs text-purple-800 font-bold bg-white/95 px-3 py-1.5 rounded-xl border border-purple-200/80 shadow-2xs self-start sm:self-auto flex items-center gap-1.5">
            <FileText size={13} className="text-purple-600" />
            <span>Định danh & Thiết lập</span>
          </span>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {/* Tên đề kiểm tra */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <span>Tên đề kiểm tra *</span>
                <span className="text-[10px] text-purple-600 font-semibold">(Hiển thị trên giao diện làm bài)</span>
              </label>
              {newTitle && (
                <button
                  type="button"
                  onClick={() => setNewTitle('')}
                  className="text-[11px] text-gray-400 hover:text-red-600 font-medium cursor-pointer"
                >
                  Xóa để nhập mới
                </button>
              )}
            </div>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="VD: Đề kiểm tra 1 tiết chương 1 hình học không gian"
              className="w-full px-3.5 py-2.5 border border-purple-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 rounded-xl outline-none text-sm font-bold text-gray-900 bg-purple-50/20"
            />
          </div>

          {/* Lưới 4 thông số cơ bản: Năm học, Khối lớp, Thời gian, Chuyên đề */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Năm học */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Năm học *
              </label>
              <select
                value={newSchoolYear}
                onChange={(e) => setNewSchoolYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-xs font-bold text-purple-900 bg-purple-50/30"
              >
                {getStandardSchoolYears().map(sy => (
                  <option key={sy} value={sy}>
                    {formatSchoolYear(sy)} {sy === getCurrentSchoolYear() ? '(Hiện tại)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Khối lớp */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Khối lớp *
              </label>
              <select
                value={newGrade}
                onChange={(e) => {
                  const g = e.target.value;
                  setNewGrade(g);
                  const matchingTopics = topics.filter(t => t.grade === parseInt(g, 10));
                  if (matchingTopics.length > 0 && !matchingTopics.some(t => t.id === newTopicId)) {
                    setNewTopicId(matchingTopics[0].id);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-xs font-medium bg-white"
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

            {/* Thời gian làm bài */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Thời gian làm bài *
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  required
                  min="5"
                  max="180"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  className="w-20 px-2.5 py-1.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-xs font-bold text-gray-900 bg-white text-center"
                />
                <span className="text-xs text-gray-500 font-semibold">phút</span>
                <div className="flex items-center gap-1 pl-1">
                  {['15', '45', '50', '90'].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setNewDuration(mins)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        newDuration === mins 
                          ? 'bg-purple-600 text-white shadow-2xs' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {mins}p
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Chuyên đề / Chủ đề lưu trữ */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-gray-700">
                  Chuyên đề lưu trữ *
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreatingNewTopic(!isCreatingNewTopic)}
                  className="text-[10px] text-purple-700 hover:text-purple-900 font-bold flex items-center gap-0.5 cursor-pointer"
                  title="Tạo nhanh một chuyên đề mới để lưu đề này vào"
                >
                  <FolderPlus size={11} />
                  <span>+ Mới</span>
                </button>
              </div>
              <select
                value={newTopicId}
                onChange={(e) => setNewTopicId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-xs font-medium bg-white"
              >
                <option value="">-- Chọn chuyên đề khối {newGrade} --</option>
                {topics.filter(t => t.grade === parseInt(newGrade, 10) && matchesSchoolYear(t.schoolYear, newSchoolYear)).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>

              {selectedTopicTitles.length > 1 && (
                <div className="mt-1.5 p-2 bg-purple-50/70 border border-purple-200 rounded-lg text-[11px] text-purple-900 leading-tight">
                  <span className="font-bold flex items-center gap-1 text-purple-950">
                    <Sparkles size={11} className="text-purple-600" />
                    <span>Đề thi gồm {selectedTopicTitles.length} chuyên đề (Phần 3):</span>
                  </span>
                  <p className="text-gray-600 mt-0.5 line-clamp-1">
                    {selectedTopicTitles.join(', ')}
                  </p>
                  <span className="text-[10px] text-purple-700 italic block mt-0.5">
                    * Chọn thư mục chuyên đề chính ở trên để quản lý và phân loại đề thi trong hệ thống.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Hộp tạo nhanh chuyên đề mới nếu cần */}
          {isCreatingNewTopic && (
            <div className="p-3 bg-purple-50/80 rounded-xl border border-purple-200 flex flex-col sm:flex-row items-center gap-2">
              <span className="text-xs font-bold text-purple-950 shrink-0">Tạo chuyên đề mới:</span>
              <input
                type="text"
                value={newTopicInputName}
                onChange={(e) => setNewTopicInputName(e.target.value)}
                placeholder="VD: Chuyên đề Tích phân & Ứng dụng thực tế..."
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-purple-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
              />
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  disabled={isSavingTopic || !newTopicInputName.trim()}
                  onClick={onSaveQuickTopic}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSavingTopic ? 'Đang tạo...' : 'Lưu chuyên đề'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingNewTopic(false)}
                  className="px-2.5 py-1.5 text-gray-500 hover:text-gray-700 text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          {/* Tùy chọn tạo nhiều mã đề thi (Multi-variant) */}
          <div className="pt-2 border-t border-purple-100">
            <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="createMultiVariant"
                    checked={createMultiVariant}
                    onChange={(e) => setCreateMultiVariant(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="createMultiVariant" className="text-xs sm:text-sm font-bold text-indigo-950 cursor-pointer flex items-center gap-1.5">
                    <Layers size={16} className="text-indigo-600" />
                    Tạo nhiều mã đề thi (Đổi số liệu hoặc Đảo câu hỏi)
                  </label>
                </div>
                {createMultiVariant && (
                  <span className="text-[11px] font-extrabold bg-indigo-200 text-indigo-800 px-2.5 py-0.5 rounded-full">
                    Đang bật
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
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all flex flex-col gap-1 cursor-pointer ${
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
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all flex flex-col gap-1 cursor-pointer ${
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
                        className="text-xs font-bold px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-indigo-700 hover:bg-indigo-50 cursor-pointer"
                      >
                        4 mã
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomVariantCodes('201, 202, 203, 204, 205, 206')}
                        className="text-xs font-bold px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-indigo-700 hover:bg-indigo-50 cursor-pointer"
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
          </div>
        </div>
      </div>
    </div>
  );
};
export default ExamCreationFourSections;
