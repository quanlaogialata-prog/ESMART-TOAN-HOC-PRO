import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  setDoc,
  deleteDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { TopicPractice } from '../../types/practice';
import { exportPracticeToWord } from '../../utils/wordExport';
import { generatePdfFromElements } from '../../utils/offlinePdfExport';
import PracticeExamPaperContent from '../../components/teacher/PracticeExamPaperContent';
import CreateTopicPracticeModal, { SAMPLE_PRACTICE_LESSON_PASTE } from '../../components/teacher/CreateTopicPracticeModal';
import { normalizePhieuText, sortQuestionsStandard, healQuestionOptions } from '../../utils/practiceFormatter';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Printer, 
  Download, 
  FileText, 
  Trash2, 
  Eye, 
  Edit3, 
  Copy, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  GraduationCap, 
  Layers, 
  X, 
  Sparkles, 
  AlertCircle,
  FileCheck,
  Check,
  ListOrdered,
  Loader2
} from 'lucide-react';
import { getCurrentSchoolYear, getStandardSchoolYears, matchesSchoolYear } from '../../utils/schoolYear';

// Mẫu khởi tạo ban đầu cho giáo viên trải nghiệm ngay
const DEFAULT_INITIAL_PRACTICES: TopicPractice[] = [
  {
    id: 'tp-sample-g12-1',
    title: 'Phiếu ôn luyện chuyên đề: Cực trị của hàm số và ứng dụng',
    lessonTitle: 'Cực trị của hàm số và ứng dụng',
    topicId: 'topic-g12-ch1',
    topicName: 'Ứng dụng đạo hàm để khảo sát hàm số',
    grade: 12,
    schoolYear: getCurrentSchoolYear(),
    schoolName: 'TRUNG TÂM ESMART',
    durationMinutes: 45,
    subject: 'Toán học',
    theorySummary: '1. Định nghĩa cực trị: Cho hàm số y = f(x) xác định trên (a; b) và x0 thuộc (a; b). Nếu f(x) <= f(x0) với mọi x lân cận x0 thì x0 là điểm cực đại. Nếu f(x) >= f(x0) với mọi x lân cận x0 thì x0 là điểm cực tiểu.\n2. Dấu hiệu 1: f\'(x) đổi dấu từ dương sang âm qua x0 => cực đại; f\'(x) đổi dấu từ âm sang dương qua x0 => cực tiểu.',
    examStructure: 'mixed',
    questions: [
      {
        id: 'q12-1',
        type: 'mcq',
        question: 'Cho hàm số $y = f(x)$ có đạo hàm $f\'(x) = x(x - 1)^2(x + 2)$. Số điểm cực trị của hàm số đã cho là:',
        options: ['A. 2', 'B. 3', 'C. 1', 'D. 4'],
        correctAnswer: 'A',
        explanation: 'Ta có $f\'(x) = 0 \\Leftrightarrow x = 0, x = 1$ (nghiệm bội 2), $x = -2$. Đạo hàm chỉ đổi dấu khi qua $x = 0$ và $x = -2$, không đổi dấu qua nghiệm kép $x = 1$. Do đó hàm số có 2 điểm cực trị.',
        points: 0.5
      },
      {
        id: 'q12-2',
        type: 'mcq',
        question: 'Điểm cực đại của đồ thị hàm số $y = -x^3 + 3x + 1$ là:',
        options: ['A. $(1; 3)$', 'B. $(-1; -1)$', 'C. $(1; -1)$', 'D. $(-1; 3)$'],
        correctAnswer: 'A',
        explanation: 'Đạo hàm $y\' = -3x^2 + 3 = 0 \\Leftrightarrow x = 1$ hoặc $x = -1$. Bảng xét dấu cho thấy $y\'$ đổi dấu từ dương sang âm tại $x = 1$. Với $x = 1 \\Rightarrow y = 3$. Điểm cực đại là $(1; 3)$.',
        points: 0.5
      },
      {
        id: 'q12-3',
        type: 'tf',
        question: 'Cho hàm số bậc ba $y = f(x) = x^3 - 3x^2 + 2$. Các mệnh đề sau đúng hay sai?',
        options: [
          'a) Hàm số đồng biến trên các khoảng $(-\\infty; 0)$ và $(2; +\\infty)$.',
          'b) Giá trị cực đại của hàm số bằng 2.',
          'c) Điểm cực tiểu của đồ thị hàm số là $(2; -2)$.',
          'd) Phương trình tiếp tuyến tại điểm cực đại có hệ số góc bằng 1.'
        ],
        correctAnswer: 'a-Đ, b-Đ, c-Đ, d-S',
        explanation: 'a) Đúng vì $y\' = 3x^2 - 6x > 0 \\Leftrightarrow x < 0$ hoặc $x > 2$.\nb) Đúng vì $y_{CĐ} = y(0) = 2$.\nc) Đúng vì $y(2) = 2^3 - 3(4) + 2 = -2$.\nd) Sai vì tiếp tuyến tại điểm cực trị có hệ số góc $k = y\'(0) = 0$.',
        points: 1.0
      },
      {
        id: 'q12-4',
        type: 'short',
        question: 'Tìm giá trị cực tiểu của hàm số $y = x + \\frac{4}{x}$ trên khoảng $(0; +\\infty)$.',
        options: [],
        correctAnswer: '4',
        explanation: 'Với $x > 0$, áp dụng BĐT Cauchy: $x + \\frac{4}{x} \\ge 2\\sqrt{x \\cdot \\frac{4}{x}} = 4$. Đẳng thức xảy ra khi $x = 2$. Vậy $y_{CT} = 4$.',
        points: 1.0
      }
    ],
    createdAt: new Date().toISOString(),
    createdBy: 'teacher'
  },
  {
    id: 'tp-sample-g8-1',
    title: 'Phiếu ôn luyện chuyên đề: Đa thức nhiều biến và Hằng đẳng thức',
    lessonTitle: 'Đa thức nhiều biến và Hằng đẳng thức',
    topicId: 'topic-g8-ch1',
    topicName: 'Chương 1: Đa thức nhiều biến',
    grade: 8,
    schoolYear: getCurrentSchoolYear(),
    schoolName: 'TRUNG TÂM ESMART',
    durationMinutes: 45,
    subject: 'Toán học',
    theorySummary: '1. Đơn thức nhiều biến: là biểu thức đại số chỉ gồm một số, hoặc một biến, hoặc một tích giữa các số và các biến.\n2. Bậc của đa thức: là bậc của hạng tử có bậc cao nhất trong dạng thu gọn của đa thức đó.\n3. Hằng đẳng thức: $(a + b)^2 = a^2 + 2ab + b^2$; $(a - b)^2 = a^2 - 2ab + b^2$; $a^2 - b^2 = (a - b)(a + b)$.',
    examStructure: 'mixed',
    questions: [
      {
        id: 'q1',
        type: 'mcq',
        question: 'Biểu thức nào sau đây là đơn thức nhiều biến?',
        options: ['A. $2x^2y$', 'B. $x + 2y$', 'C. $\\frac{x}{y}$', 'D. $3x^2 - 1$'],
        correctAnswer: 'A',
        explanation: '$2x^2y$ là tích giữa số 2 và các biến x, y nên là đơn thức nhiều biến.',
        points: 0.5
      },
      {
        id: 'q2',
        type: 'mcq',
        question: 'Bậc của đa thức $P = x^4y + 2x^2y^2 - 3x^3 + 5$ là:',
        options: ['A. 4', 'B. 5', 'C. 3', 'D. 2'],
        correctAnswer: 'B',
        explanation: 'Hạng tử $x^4y$ có bậc là $4 + 1 = 5$ (cao nhất), do đó bậc của đa thức P là 5.',
        points: 0.5
      },
      {
        id: 'q3',
        type: 'mcq',
        question: 'Khai triển hằng đẳng thức $(x + 2y)^2$ được kết quả là:',
        options: ['A. $x^2 + 4y^2$', 'B. $x^2 + 4xy + 4y^2$', 'C. $x^2 + 2xy + 4y^2$', 'D. $x^2 - 4xy + 4y^2$'],
        correctAnswer: 'B',
        explanation: 'Áp dụng $(a+b)^2 = a^2 + 2ab + b^2$ với $a = x, b = 2y$, ta có $(x+2y)^2 = x^2 + 4xy + 4y^2$.',
        points: 0.5
      },
      {
        id: 'q4',
        type: 'tf',
        question: 'Cho hai đa thức $M = 2x^2 - xy + 3y^2$ và $N = x^2 + 2xy - y^2$.',
        options: [
          'a) Đa thức M có bậc bằng 2.',
          'b) Giá trị của đa thức N tại $x = 1, y = -1$ bằng 0.',
          'c) Tổng $M + N = 3x^2 + xy + 2y^2$.',
          'd) Hiệu $M - N = x^2 - 3xy + 4y^2$.'
        ],
        correctAnswer: 'a-Đ, b-S, c-Đ, d-Đ',
        explanation: 'a) Đúng. b) Sai vì N(1, -1) = -2. c) Đúng. d) Đúng.',
        points: 1.0
      },
      {
        id: 'q5',
        type: 'essay',
        question: 'Rút gọn biểu thức $B = (x - 3)(x + 3) - (x - 2)^2$ và tính giá trị tại $x = 5$.',
        options: [],
        correctAnswer: 'B = 4x - 13; B(5) = 7',
        explanation: 'a) $B = (x^2 - 9) - (x^2 - 4x + 4) = 4x - 13$.\nb) Với $x = 5$, ta có $B = 4(5) - 13 = 7$.',
        points: 2.0
      }
    ],
    createdAt: new Date().toISOString(),
    createdBy: 'teacher'
  }
];

export default function ManageTopicPractices() {
  const { user } = useAuth();
  const [practices, setPractices] = useState<TopicPractice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>(getCurrentSchoolYear());
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [previewPractice, setPreviewPractice] = useState<TopicPractice | null>(null);
  const [previewShowAnswers, setPreviewShowAnswers] = useState<boolean>(false);
  const [previewNumberingMode, setPreviewNumberingMode] = useState<'per_section' | 'continuous'>('per_section');
  const [editingPractice, setEditingPractice] = useState<TopicPractice | null>(null);

  // Notifications & Exporting state
  const [sysMsg, setSysMsg] = useState<string>('');
  const [sysError, setSysError] = useState<string>('');
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [pdfProgressText, setPdfProgressText] = useState<string>('');

  const printableRef = useRef<HTMLDivElement>(null);

  // Load practices from Firestore or cache
  useEffect(() => {
    loadPractices();
  }, []);

  // Delete practice state
  const [deleteConfirmPractice, setDeleteConfirmPractice] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const getDeletedPracticeIds = (): Set<string> => {
    try {
      const raw = localStorage.getItem('esmart_topic_practices_deleted_ids');
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? arr.filter(Boolean) : []);
    } catch {
      return new Set();
    }
  };

  const addDeletedPracticeIds = (ids: (string | undefined)[]) => {
    try {
      const current = getDeletedPracticeIds();
      ids.forEach(x => {
        if (x && typeof x === 'string') current.add(x);
      });
      localStorage.setItem('esmart_topic_practices_deleted_ids', JSON.stringify(Array.from(current)));
    } catch {
      // ignore storage errors
    }
  };

  const loadPractices = async () => {
    setLoading(true);
    const deletedIds = getDeletedPracticeIds();
    const sanitizePractice = (p: TopicPractice): TopicPractice => ({
      ...p,
      title: normalizePhieuText(p.title || ''),
      lessonTitle: normalizePhieuText(p.lessonTitle || ''),
      topicName: normalizePhieuText(p.topicName || ''),
      questions: (p.questions || []).map(healQuestionOptions)
    });

    try {
      const snap = await getDocs(collection(db, 'topic_practices'));

      if (!snap.empty) {
        const loaded: TopicPractice[] = [];
        snap.forEach(d => {
          const rawData = d.data() as any;
          const legacyId = rawData?.id;
          // Nếu bài này đã nằm trong danh sách đã xóa -> bỏ qua và dọn dẹp trên Firestore
          if (deletedIds.has(d.id) || (legacyId && deletedIds.has(legacyId))) {
            deleteDoc(doc(db, 'topic_practices', d.id)).catch(() => {});
            return;
          }
          // Đặt id: d.id SAU ...rawData để đảm bảo luôn dùng đúng Document ID của Firestore
          loaded.push(sanitizePractice({ ...rawData, id: d.id, _legacyId: legacyId } as TopicPractice));
        });
        setPractices(loaded);
        localStorage.setItem('esmart_topic_practices_cache', JSON.stringify(loaded));
        localStorage.setItem('esmart_topic_practices_initialized', 'true');
      } else {
        const isInit = localStorage.getItem('esmart_topic_practices_initialized');
        const cached = localStorage.getItem('esmart_topic_practices_cache');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            const validCached = (Array.isArray(parsed) ? parsed : [])
              .filter((p: any) => p && !deletedIds.has(p.id) && !(p._legacyId && deletedIds.has(p._legacyId)))
              .map(sanitizePractice);
            setPractices(validCached);
          } catch (e) {
            const defaults = isInit ? [] : DEFAULT_INITIAL_PRACTICES.filter(p => !deletedIds.has(p.id));
            setPractices(defaults);
          }
        } else if (!isInit) {
          const defaults = DEFAULT_INITIAL_PRACTICES.filter(p => !deletedIds.has(p.id));
          setPractices(defaults);
          localStorage.setItem('esmart_topic_practices_cache', JSON.stringify(defaults));
          localStorage.setItem('esmart_topic_practices_initialized', 'true');
        } else {
          setPractices([]);
        }
      }
    } catch (err: any) {
      console.warn('Firestore load topic_practices failed, using cache:', err);
      const isInit = localStorage.getItem('esmart_topic_practices_initialized');
      const cached = localStorage.getItem('esmart_topic_practices_cache');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const validCached = (Array.isArray(parsed) ? parsed : [])
            .filter((p: any) => p && !deletedIds.has(p.id) && !(p._legacyId && deletedIds.has(p._legacyId)))
            .map(sanitizePractice);
          setPractices(validCached);
        } catch (e) {
          setPractices(isInit ? [] : DEFAULT_INITIAL_PRACTICES.filter(p => !deletedIds.has(p.id)));
        }
      } else if (!isInit) {
        setPractices(DEFAULT_INITIAL_PRACTICES.filter(p => !deletedIds.has(p.id)));
      } else {
        setPractices([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Save new practice
  const handleSavePractice = async (practiceData: Omit<TopicPractice, 'id' | 'createdAt' | 'createdBy'>) => {
    const newId = `tp-${Date.now()}`;
    const newPractice: TopicPractice = {
      ...practiceData,
      id: newId,
      createdAt: new Date().toISOString(),
      createdBy: user?.uid || 'teacher',
      ...(user?.email ? { authorEmail: user.email } : {})
    };

    try {
      // Loại bỏ hoàn toàn các trường undefined trước khi lưu lên Firestore và đồng bộ Document ID = newId
      const cleanPayload = JSON.parse(JSON.stringify(newPractice));
      await setDoc(doc(db, 'topic_practices', newId), cleanPayload);
    } catch (e) {
      console.warn('Firestore setDoc fallback:', e);
    }

    setPractices(prev => {
      const updated = [newPractice, ...prev];
      localStorage.setItem('esmart_topic_practices_cache', JSON.stringify(updated));
      localStorage.setItem('esmart_topic_practices_initialized', 'true');
      return updated;
    });

    setSysMsg(`Đã tạo thành công bài ôn luyện: "${newPractice.title}"`);
    setTimeout(() => setSysMsg(''), 5000);

    // Auto open preview so teacher can immediately print or download
    setPreviewPractice(newPractice);
  };

  // Prompt delete practice (open in-app modal instead of blocked window.confirm)
  const promptDeletePractice = (id: string, title: string) => {
    setDeleteConfirmPractice({ id, title });
  };

  // Execute deletion confirmed by user
  const handleConfirmDelete = async () => {
    if (!deleteConfirmPractice) return;
    const { id, title } = deleteConfirmPractice;
    setIsDeleting(true);

    try {
      const targetItem = practices.find(p => p.id === id) as any;
      const legacyId = targetItem?._legacyId;
      addDeletedPracticeIds([id, legacyId]);

      try {
        await deleteDoc(doc(db, 'topic_practices', id));
        // Xóa triệt để cả các bản ghi cũ trên Firestore có trường data().id trùng với id hoặc legacyId
        const snap = await getDocs(collection(db, 'topic_practices'));
        const deletePromises: Promise<void>[] = [];
        snap.forEach(d => {
          const dData = d.data() as any;
          if (d.id === id || d.id === legacyId || dData?.id === id || (legacyId && dData?.id === legacyId)) {
            deletePromises.push(deleteDoc(doc(db, 'topic_practices', d.id)));
          }
        });
        if (deletePromises.length > 0) {
          await Promise.allSettled(deletePromises);
        }
      } catch (e) {
        console.warn('Firestore delete error (local/offline fallback):', e);
      }

      setPractices(prev => {
        const updated = prev.filter(p => p.id !== id && (p as any)._legacyId !== id);
        localStorage.setItem('esmart_topic_practices_cache', JSON.stringify(updated));
        localStorage.setItem('esmart_topic_practices_initialized', 'true');
        return updated;
      });

      if (previewPractice && (previewPractice.id === id || (previewPractice as any)._legacyId === id)) {
        setPreviewPractice(null);
      }

      setSysMsg(`Đã xóa thành công bài ôn luyện: "${title}"`);
      setTimeout(() => setSysMsg(''), 4000);
    } catch (err) {
      console.error('Delete error:', err);
      setSysError('Không thể xóa bài ôn luyện. Vui lòng thử lại.');
      setTimeout(() => setSysError(''), 4000);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmPractice(null);
    }
  };

  // Duplicate practice
  const handleDuplicatePractice = async (p: TopicPractice) => {
    const { id: _ignoreId, createdAt: _ignoreCreated, createdBy: _ignoreBy, ...rest } = p as any;
    const duplicated: Omit<TopicPractice, 'id' | 'createdAt' | 'createdBy'> = {
      ...rest,
      title: `${p.title} (Bản sao)`,
      lessonTitle: `${p.lessonTitle} (Bản sao)`
    };
    await handleSavePractice(duplicated);
  };

  // Sắp xếp lại hệ thống câu hỏi theo đúng định dạng chuẩn GDPT 2018
  const handleSortPracticeQuestions = async (target?: TopicPractice | null) => {
    const targetPractice = target || previewPractice;
    if (!targetPractice) return;

    const sortedQuestions = sortQuestionsStandard(targetPractice.questions || []);
    const updated: TopicPractice = {
      ...targetPractice,
      questions: sortedQuestions
    };

    // Cập nhật Firebase Firestore nếu có ID
    try {
      const cleanQuestions = JSON.parse(JSON.stringify(sortedQuestions));
      await updateDoc(doc(db, 'topic_practices', updated.id), {
        questions: cleanQuestions
      });
    } catch (e) {
      console.warn('Firestore updateDoc fallback:', e);
    }

    // Cập nhật state nội bộ và local storage
    setPractices(prev => {
      const next = prev.map(p => p.id === updated.id ? updated : p);
      localStorage.setItem('esmart_topic_practices_cache', JSON.stringify(next));
      return next;
    });

    if (previewPractice && previewPractice.id === updated.id) {
      setPreviewPractice(updated);
    }

    setSysMsg(`Đã sắp xếp lại hệ thống câu hỏi của "${updated.title}" theo đúng định dạng chuẩn GDPT 2018 (Trắc nghiệm -> Đúng/Sai -> Trả lời ngắn -> Tự luận)!`);
    setTimeout(() => setSysMsg(''), 4000);
  };

  // Export to PDF
  const handleExportPdf = async (practice: TopicPractice, withAnswers: boolean) => {
    if (!printableRef.current) return;
    setIsExportingPdf(true);
    setPdfProgressText('Đang kết xuất bản in PDF chất lượng cao...');

    try {
      const fileName = `${practice.title.replace(/[^a-zA-Z0-9_\-\u00C0-\u024F\u1EA0-\u1EF9\s]/g, '_')}_${withAnswers ? 'Kem_Dap_An' : 'De_On_Luyen'}.pdf`;
      const result = await generatePdfFromElements([printableRef.current], {
        fileName,
        onProgress: (msg) => setPdfProgressText(msg)
      });

      setSysMsg(`Đã tạo thành công tệp PDF: ${result.fileName}`);
      setTimeout(() => setSysMsg(''), 5000);
    } catch (err: any) {
      console.error('PDF export error:', err);
      setSysError('Lỗi xuất PDF: ' + (err?.message || 'Không thể tạo file'));
    } finally {
      setIsExportingPdf(false);
      setPdfProgressText('');
    }
  };

  // Native Browser Print
  const handleNativePrint = () => {
    window.print();
  };

  // Filtered practices
  const filteredPractices = practices
    .filter(p => {
      if (!matchesSchoolYear(p.schoolYear, selectedSchoolYear)) return false;
      if (selectedGradeFilter !== 'all' && p.grade !== Number(selectedGradeFilter)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (p.title || '').toLowerCase().includes(q);
        const matchLesson = (p.lessonTitle || '').toLowerCase().includes(q);
        const matchTopic = (p.topicName || '').toLowerCase().includes(q);
        if (!matchTitle && !matchLesson && !matchTopic) return false;
      }
      return true;
    })
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* 1. HEADER & ACTION BAR                                       */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                <span>Bài ôn luyện theo chủ đề</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  {filteredPractices.length} bài ôn luyện
                </span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Tạo bài học bằng Copy & Paste → Chuyển đổi sang thiết kế bài kiểm tra offline chuẩn in ấn A4 và tải xuống Word (.doc) / PDF
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>+ Tạo bài ôn luyện mới (Copy & Paste)</span>
          </button>
        </div>
      </div>

      {/* TOAST ALERTS */}
      {sysMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{sysMsg}</span>
          </div>
          <button onClick={() => setSysMsg('')} className="text-emerald-600 hover:text-emerald-800">
            <X size={15} />
          </button>
        </div>
      )}
      {sysError && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <span>{sysError}</span>
          </div>
          <button onClick={() => setSysError('')} className="text-red-600 hover:text-red-800">
            <X size={15} />
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. STATS OVERVIEW                                            */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Tổng bài ôn luyện</div>
          <div className="text-xl sm:text-2xl font-extrabold text-blue-700 mt-1">{practices.length}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Bài học đã thiết kế</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Khối lớp hỗ trợ</div>
          <div className="text-xl sm:text-2xl font-extrabold text-indigo-700 mt-1">7 Khối</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Toán từ Lớp 6 đến Lớp 12</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Quy chuẩn tiêu đề</div>
          <div className="text-xs sm:text-sm font-extrabold text-emerald-700 mt-2 truncate">Bài ôn luyện chuyên đề</div>
          <div className="text-[11px] text-gray-500 mt-0.5">+ Tên bài học</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Định dạng in & tải</div>
          <div className="text-xs sm:text-sm font-extrabold text-purple-700 mt-2">Word .doc & In A4</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Chuẩn bài kiểm tra offline</div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. BỘ LỌC KHỐI LỚP, NĂM HỌC & TÌM KIẾM                      */}
      {/* ============================================================ */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {/* Lọc Năm học */}
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 text-xs">
            <Calendar size={13} className="text-gray-500 shrink-0" />
            <span className="font-bold text-gray-700">Năm:</span>
            <select
              value={selectedSchoolYear}
              onChange={(e) => setSelectedSchoolYear(e.target.value)}
              className="bg-transparent font-bold text-blue-700 outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả năm học</option>
              {getStandardSchoolYears().map(sy => (
                <option key={sy} value={sy}>{sy}</option>
              ))}
            </select>
          </div>

          {/* Lọc Khối lớp */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setSelectedGradeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedGradeFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tất cả khối
            </button>
            {[6, 7, 8, 9, 10, 11, 12].map(g => (
              <button
                key={g}
                type="button"
                onClick={() => setSelectedGradeFilter(g.toString())}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedGradeFilter === g.toString()
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Lớp {g}
              </button>
            ))}
          </div>
        </div>

        {/* Ô tìm kiếm */}
        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên bài ôn luyện, chuyên đề..."
            className="w-full pl-9 pr-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. DANH SÁCH BÀI ÔN LUYỆN CHUYÊN ĐỀ                          */}
      {/* ============================================================ */}
      {loading ? (
        <div className="p-12 text-center text-gray-500 text-xs font-medium bg-white rounded-xl border border-gray-200">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Đang tải danh sách bài ôn luyện theo chuyên đề...
        </div>
      ) : filteredPractices.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-300 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
            <BookOpen size={24} />
          </div>
          <div>
            <h4 className="font-extrabold text-sm sm:text-base text-gray-900">
              Chưa có bài ôn luyện nào phù hợp
            </h4>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              Bạn có thể dễ dàng tạo bài ôn luyện mới bằng cách copy & paste nội dung từ giáo án, tài liệu để tự động chuyển thành thiết kế bài kiểm tra offline.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus size={15} />
            <span>+ Tạo bài ôn luyện ngay</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPractices.map(practice => (
            <div
              key={practice.id}
              className="bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group shadow-2xs"
            >
              <div className="p-4 sm:p-5 space-y-3">
                {/* Badges */}
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    Toán Lớp {practice.grade}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                    {practice.schoolYear}
                  </span>
                </div>

                {/* Tiêu đề chuẩn: Bài ôn luyện chuyên đề + Tên bài */}
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug">
                    {practice.title}
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-1 truncate">
                    Chuyên đề: <strong>{practice.topicName}</strong>
                  </p>
                </div>

                {/* Chi tiết câu hỏi và thời lượng */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 text-[11px] text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-blue-600 shrink-0" />
                    <span>{practice.durationMinutes || 45} phút</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileCheck size={13} className="text-emerald-600 shrink-0" />
                    <span>{practice.questions?.length || 0} câu hỏi</span>
                  </div>
                </div>

                {practice.theorySummary && (
                  <div className="text-[10px] text-blue-800 bg-blue-50/60 p-2 rounded-lg border border-blue-100 line-clamp-2">
                    📌 <em>Có phần tóm tắt lý thuyết trọng tâm</em>
                  </div>
                )}
              </div>

              {/* ACTION FOOTER */}
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-1.5 flex-wrap">
                <div className="flex items-center gap-1">
                  {/* Xem & In */}
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewPractice(practice);
                      setPreviewShowAnswers(false);
                    }}
                    className="px-2.5 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                    title="Xem trước định dạng bài kiểm tra và in ấn"
                  >
                    <Eye size={13} />
                    <span>Xem & In</span>
                  </button>

                  {/* Tải Word */}
                  <button
                    type="button"
                    onClick={() => exportPracticeToWord(practice, { includeAnswers: true })}
                    className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                    title="Tải tệp Microsoft Word (.doc) hoàn chỉnh"
                  >
                    <FileText size={13} />
                    <span>Word</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  {/* Sắp xếp lại câu hỏi chuẩn GDPT 2018 */}
                  <button
                    type="button"
                    onClick={() => handleSortPracticeQuestions(practice)}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                    title="Sắp xếp câu hỏi theo chuẩn định dạng GDPT 2018 (Trắc nghiệm -> Đúng/Sai -> Trả lời ngắn -> Tự luận)"
                  >
                    <ListOrdered size={14} />
                  </button>

                  {/* Nhân bản */}
                  <button
                    type="button"
                    onClick={() => handleDuplicatePractice(practice)}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                    title="Nhân bản bài này"
                  >
                    <Copy size={14} />
                  </button>

                  {/* Xóa */}
                  <button
                    type="button"
                    onClick={() => promptDeletePractice(practice.id, practice.title)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                    title="Xóa bài ôn luyện"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. MODAL TẠO BÀI ÔN LUYỆN BẰNG COPY & PASTE                  */}
      {/* ============================================================ */}
      {showCreateModal && (
        <CreateTopicPracticeModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={handleSavePractice}
          initialGrade={selectedGradeFilter !== 'all' ? Number(selectedGradeFilter) : 8}
        />
      )}

      {/* ============================================================ */}
      {/* 6. MODAL XEM TRƯỚC, IN ẤN VÀ TẢI XUỐNG DẠNG BÀI KIỂM TRA      */}
      {/* ============================================================ */}
      {previewPractice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[96vh] my-auto border border-gray-100">
            {/* Modal Toolbar */}
            <div className="p-3.5 px-6 border-b border-gray-200 bg-gray-50/90 rounded-t-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 print:hidden">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-gray-900 tracking-tight flex items-center gap-2">
                  <span>{previewPractice.title}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    Phiếu học tập chuyên đề
                  </span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Khổ A4 • Chuẩn trang in bài tập • Tiêu đề: Tên bài học
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Toggle Hiển thị Đáp án */}
                <button
                  type="button"
                  onClick={() => setPreviewShowAnswers(!previewShowAnswers)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                    previewShowAnswers
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                  title="Chuyển đổi giữa đề thi cho học sinh và bản có đáp án/lời giải cho giáo viên"
                >
                  <Check size={13} />
                  <span>{previewShowAnswers ? 'Bản giáo viên (Kèm đáp án)' : 'Bản học sinh (Đề làm bài)'}</span>
                </button>

                {/* Chuyển đổi định dạng đánh số câu hỏi */}
                <button
                  type="button"
                  onClick={() => setPreviewNumberingMode(prev => prev === 'per_section' ? 'continuous' : 'per_section')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  title="Chuyển đổi kiểu đánh số: Chuẩn theo từng phần (Câu 1, 2... mỗi phần) hoặc Đánh số liên tục (Câu 1 đến Câu N)"
                >
                  <ListOrdered size={13} />
                  <span>{previewNumberingMode === 'per_section' ? 'Số câu: Chuẩn từng phần' : 'Số câu: Liên tục (1..N)'}</span>
                </button>

                {/* Sắp xếp lại câu hỏi chuẩn định dạng GDPT 2018 */}
                <button
                  type="button"
                  onClick={() => handleSortPracticeQuestions(previewPractice)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                  title="Tự động sắp xếp lại câu hỏi theo đúng định dạng chuẩn GDPT 2018: Phần I (Trắc nghiệm A, B, C, D) -> Phần II (Đúng/Sai) -> Phần III (Trả lời ngắn) -> Phần IV (Tự luận)"
                >
                  <ListOrdered size={13} />
                  <span>Sắp xếp lại câu hỏi</span>
                </button>

                {/* In trực tiếp */}
                <button
                  type="button"
                  onClick={handleNativePrint}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  title="In trực tiếp bằng máy in hoặc lưu PDF qua trình duyệt"
                >
                  <Printer size={13} />
                  <span>In bài ôn luyện</span>
                </button>

                {/* Tải Word (.doc) */}
                <button
                  type="button"
                  onClick={() => exportPracticeToWord(previewPractice, { includeAnswers: previewShowAnswers })}
                  className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  title="Tải tệp Word (.doc) mở bằng Microsoft Word hoặc WPS Office"
                >
                  <Download size={13} />
                  <span>Tải Word (.doc)</span>
                </button>

                {/* Tải PDF */}
                <button
                  type="button"
                  disabled={isExportingPdf}
                  onClick={() => handleExportPdf(previewPractice, previewShowAnswers)}
                  className="px-3 py-1.5 bg-white hover:bg-purple-50 text-purple-800 border border-purple-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                  title="Tải tệp PDF chất lượng cao"
                >
                  <FileText size={13} />
                  <span>{isExportingPdf ? (pdfProgressText || 'Đang tạo PDF...') : 'Tải PDF'}</span>
                </button>

                {/* Xóa phiếu */}
                <button
                  type="button"
                  onClick={() => {
                    if (previewPractice) {
                      promptDeletePractice(previewPractice.id, previewPractice.title);
                    }
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  title="Xóa phiếu ôn luyện này"
                >
                  <Trash2 size={13} />
                  <span>Xóa phiếu</span>
                </button>

                {/* Đóng */}
                <button
                  type="button"
                  onClick={() => setPreviewPractice(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Print paper container - Đồng bộ hiển thị chuẩn khổ A4 và xuất PDF */}
            <div className="p-4 sm:p-8 overflow-y-auto flex-1 flex justify-center bg-gray-200/80 print:bg-white print:p-0">
              <div 
                id="topic-practice-print-content"
                ref={printableRef} 
                className="w-full max-w-[210mm] print:w-full print:max-w-none print:m-0 shadow-lg print:shadow-none"
              >
                <PracticeExamPaperContent
                  practice={previewPractice}
                  showAnswers={previewShowAnswers}
                  numberingMode={previewNumberingMode}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. MODAL XÁC NHẬN XÓA PHIẾU ÔN LUYỆN (IN-APP CONFIRMATION)   */}
      {/* ============================================================ */}
      {deleteConfirmPractice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Xác nhận xóa phiếu ôn luyện
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Phiếu học tập này sẽ bị xóa khỏi danh sách
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-red-50/70 border border-red-200/60 rounded-xl text-xs text-gray-800 leading-relaxed">
              Bạn có chắc chắn muốn xóa bài ôn luyện: <br />
              <strong className="text-red-950 font-bold break-words">{deleteConfirmPractice.title}</strong>?
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmPractice(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Xác nhận xóa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. CSS CHO IN ẤN TRỰC TIẾP (@media print)                    */}
      {/* ============================================================ */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #topic-practice-print-content, #topic-practice-print-content * {
            visibility: visible;
          }
          #topic-practice-print-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 8mm 10mm !important;
            background: #ffffff !important;
            box-shadow: none !important;
            border: none !important;
          }
          .export-avoid-break {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          header, nav, button, .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
