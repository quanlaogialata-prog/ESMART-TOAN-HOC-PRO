import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, where, deleteDoc, doc, updateDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { FileText, Plus, Upload, Clock, List, Calendar, X, Trash2, Eye, Pencil, ArrowLeft, Folder, FolderCheck, Layers, Shuffle, CheckCircle, Copy, Sparkles, Printer, FileCheck, ShieldCheck, LayoutGrid, FileSpreadsheet, Check, ChevronRight, BookOpen, Sliders, HelpCircle, Info, Users, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import MathText from '../../components/MathText';
import { generateTestVariants, TestVariant } from '../../utils/variantGenerator';
import { CreateOnlineTestModal } from '../../components/teacher/CreateOnlineTestModal';
import QuestionVisualRenderer from '../../components/common/QuestionVisualRenderer';
import QuestionReferenceBadge from '../../components/common/QuestionReferenceBadge';
import EditQuestionsModal from '../../components/teacher/EditQuestionsModal';
import CancelAssignmentModal from '../../components/teacher/CancelAssignmentModal';
import { QuestionItem } from '../../types/test';
import { stripOptionPrefix, checkMcqAnswer, detectAnswerDiscrepancy, autoReconcileQuestion } from '../../utils/gradeEngine';
import { exportGradebookPdf, exportGradebookExcel } from '../../utils/gradebookExport';

export default function ManageTests() {
  const { user, role } = useAuth();
  const [tests, setTests] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [schoolClasses, setSchoolClasses] = useState<any[]>([]);
  const [assignedClasses, setAssignedClasses] = useState<string[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [assignmentsList, setAssignmentsList] = useState<any[]>([]);
  const [submissionsList, setSubmissionsList] = useState<any[]>([]);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');

  // Topic folder state: maps topicId -> 'single' | 'multi'
  const [topicFolderTab, setTopicFolderTab] = useState<{ [topicId: string]: 'single' | 'multi' }>({});
  const [selectedTopicTab, setSelectedTopicTab] = useState<string>('all');

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningTest, setAssigningTest] = useState<any>(null);
  const [assignDate, setAssignDate] = useState('');
  const [assignedStudentVariants, setAssignedStudentVariants] = useState<{ [studentId: string]: string }>({});

  useEffect(() => {
    if (user) {
      loadData();
      
      const unsubscribeAssignments = onSnapshot(collection(db, 'assignments'), (snap) => {
        setAssignmentsList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      const unsubscribeSubmissions = onSnapshot(collection(db, 'submissions'), (snap) => {
        setSubmissionsList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      return () => {
        unsubscribeAssignments();
        unsubscribeSubmissions();
      };
    }
  }, [user]);

  const loadData = async () => {
    try {
    const clsSnap = await getDocs(collection(db, 'classes'));
    const clsData = clsSnap.docs.map(d => ({id: d.id, ...d.data()}));
    setSchoolClasses(clsData);
    if (user) {
      const uDoc = await getDoc(doc(db, 'users', user.uid));
      if (uDoc.exists()) {
        setAssignedClasses(uDoc.data().permissions?.assignedClasses || []);
      }
    }
    const topicsSnap = await getDocs(collection(db, 'topics'));
    const topicsData = topicsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    setTopics(topicsData);

    const lessonsSnap = await getDocs(collection(db, 'lessons'));
    const lessonsData = lessonsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    setLessons(lessonsData);

    const testsSnap = await getDocs(collection(db, 'tests'));
    const testsData = testsSnap.docs.map(d => {
      const data = d.data();
      const topic = topicsData.find(t => t.id === data.topicId);
      return { 
        id: d.id, 
        ...data, 
        grade: data.grade || (topic ? topic.grade : null) 
      };
    });
    setTests(testsData);



    const stuSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
    setStudentsList(stuSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingType, setCreatingType] = useState<'mcq' | 'essay' | 'mixed'>('mcq');
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState('45');
  const [newGrade, setNewGrade] = useState('9');
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [newTopicId, setNewTopicId] = useState('');
  
  // Multi-variant creation in showCreateModal
  const [createMultiVariant, setCreateMultiVariant] = useState(false);
  const [createVariantMethod, setCreateVariantMethod] = useState<'shuffle' | 'isomorphic'>('shuffle');
  const [variantCount, setVariantCount] = useState('4');
  const [customVariantCodes, setCustomVariantCodes] = useState('101, 102, 103, 104');
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);

  // Multi-variant manage / answer key modal
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [variantModalTest, setVariantModalTest] = useState<any | null>(null);
  const [activePreviewVariantCode, setActivePreviewVariantCode] = useState<string>('');
  const [variantModalTab, setVariantModalTab] = useState<'matrix' | 'isomorphic' | 'shuffle' | 'compare'>('matrix');
  const [manageVariantCount, setManageVariantCount] = useState('4');
  const [manageVariantCodes, setManageVariantCodes] = useState('101, 102, 103, 104');
  const [manageShuffleQ, setManageShuffleQ] = useState(true);
  const [manageShuffleOpt, setManageShuffleOpt] = useState(true);
  const [isSavingVariants, setIsSavingVariants] = useState(false);
  const [newMultiVariantTitle, setNewMultiVariantTitle] = useState('');

  // Isomorphic AI variant generation states
  const [isGeneratingIsomorphic, setIsGeneratingIsomorphic] = useState(false);
  const [isomorphicProgressText, setIsomorphicProgressText] = useState('');
  const [isomorphicStep, setIsomorphicStep] = useState(0);
  const [isomorphicTotal, setIsomorphicTotal] = useState(0);
  const [isomorphicError, setIsomorphicError] = useState('');
  const [selectedCompareQIndex, setSelectedCompareQIndex] = useState(0);

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [deletingTestId, setDeletingTestId] = useState<string | null>(null);
  const [previewTest, setPreviewTest] = useState<any>(null);
  const [editingQuestionsTest, setEditingQuestionsTest] = useState<any>(null);
  const [editingQuestionsList, setEditingQuestionsList] = useState<QuestionItem[]>([]);
  const [isSavingQuestions, setIsSavingQuestions] = useState(false);

  const openEditQuestions = (test: any) => {
    setEditingQuestionsTest(test);
    try {
      setEditingQuestionsList(JSON.parse(test.questionsData || "[]"));
    } catch {
      setEditingQuestionsList([]);
    }
  };

  const handleSaveQuestionsFromModal = async (updatedQuestions: QuestionItem[]) => {
    if (!editingQuestionsTest) return;
    setIsSavingQuestions(true);
    setSysMsg('Đang lưu thay đổi câu hỏi & tham chiếu...');
    try {
      await updateDoc(doc(db, 'tests', editingQuestionsTest.id), {
        questionsData: JSON.stringify(updatedQuestions)
      });
      setSysMsg('Lưu câu hỏi thành công!');
      setEditingQuestionsTest(null);
      await loadData();
    } catch (error) {
      console.error(error);
      setSysError('Có lỗi khi lưu câu hỏi.');
    } finally {
      setIsSavingQuestions(false);
    }
  };

  const [assignmentToCancel, setAssignmentToCancel] = useState<any | null>(null);
  const [isCancellingAssignment, setIsCancellingAssignment] = useState<boolean>(false);

  const handleCancelAssignment = async (assignmentId: string) => {
    if (!assignmentId) return;
    setIsCancellingAssignment(true);
    setSysMsg('Đang hủy giao bài...');
    try {
      // 1. Delete all submissions associated with this assignment
      const qSub = query(collection(db, 'submissions'), where('assignmentId', '==', assignmentId));
      const subSnap = await getDocs(qSub);
      const deletePromises = subSnap.docs.map(sDoc => deleteDoc(doc(db, 'submissions', sDoc.id)));

      // 2. Delete the assignment document
      deletePromises.push(deleteDoc(doc(db, 'assignments', assignmentId)));
      await Promise.all(deletePromises);

      const clsName = assignmentToCancel?.className || '';
      setSysMsg(`Đã hủy giao bài cho lớp ${clsName} thành công!`);
      setTimeout(() => setSysMsg(''), 4000);
      setAssignmentToCancel(null);
    } catch (err: any) {
      console.error(err);
      setSysError('Lỗi khi hủy giao bài: ' + (err?.message || 'Không thể xóa dữ liệu'));
    } finally {
      setIsCancellingAssignment(false);
    }
  };

  const handlePreview = (test: any) => {
    setPreviewTest(test);
    setShowPreviewModal(true);
  };

  const handleOpenPreview = async (fileUrl: string) => {
    try {
      const res = await fetch(fileUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (error) {
      console.error("Lỗi khi mở file:", error);
    }
  };

  const [newFile, setNewFile] = useState<File | null>(null);
  const [newAnswerFile, setNewAnswerFile] = useState<File | null>(null);
  const [splitAnswers, setSplitAnswers] = useState(false);

  // 3 Phương thức tạo đề online:
  // 1. 'auto': Tạo đề thi tự động (AI & Ngân hàng đề)
  // 2. 'upload': Tạo đề từ đề tải lên (PDF, DOCX, Ảnh -> Trích xuất trực tuyến)
  // 3. 'matrix': Tạo đề theo ma trận có sẵn (Tải file hoặc chọn khung chuẩn)
  const [onlineCreationMode, setOnlineCreationMode] = useState<'auto' | 'upload' | 'matrix'>('auto');

  // 4 Hình thức đề thi trong mỗi phương thức:
  // 1. 'mcq_3part': Trắc nghiệm 3 phần (Chuẩn Bộ GD&ĐT)
  // 2. 'mcq_custom': Trắc nghiệm tùy biến (Chọn 1 hoặc 2 phần)
  // 3. 'essay': Tự luận
  // 4. 'mixed': Tổng hợp (Trắc nghiệm + Tự luận)
  const [examFormat, setExamFormat] = useState<'mcq_3part' | 'mcq_custom' | 'essay' | 'mixed'>('mcq_3part');

  // Ma trận có sẵn:
  const [matrixSourceType, setMatrixSourceType] = useState<'preset' | 'file'>('preset');
  const [selectedMatrixPreset, setSelectedMatrixPreset] = useState<string>('matrix_4321');
  const [matrixConfig, setMatrixConfig] = useState<{
    name: string;
    levels: { recognize: number; understand: number; apply: number; highApply: number };
    notes?: string;
  }>({
    name: 'Ma trận chuẩn GDPT (40% NB - 30% TH - 20% VD - 10% VDC)',
    levels: { recognize: 40, understand: 30, apply: 20, highApply: 10 },
    notes: 'Đảm bảo bao quát kiến thức và phân hóa học sinh theo chuẩn Bộ GD&ĐT'
  });

  // Mẫu gợi ý (Presets) đi kèm cho từng hình thức thi
  const [activePresetId, setActivePresetId] = useState<string>('preset_3p_standard');

  const formatPresets = {
    mcq_3part: [
      {
        id: 'preset_3p_standard',
        name: 'Chuẩn tốt nghiệp THPT (12 - 4 - 6)',
        badge: 'Chuẩn Bộ GD&ĐT',
        duration: '90',
        p1: '12',
        p2: '4',
        p3: '6',
        totalQuestions: 22,
        points: '10 điểm (P.I: 3.0đ, P.II: 4.0đ, P.III: 3.0đ)',
        desc: 'Cấu trúc định dạng mới nhất của Bộ GD&ĐT dành cho thi tốt nghiệp và khảo sát chất lượng'
      },
      {
        id: 'preset_3p_period',
        name: 'Kiểm tra định kỳ 45 phút (8 - 2 - 4)',
        badge: 'Định kỳ',
        duration: '45',
        p1: '8',
        p2: '2',
        p3: '4',
        totalQuestions: 14,
        points: '10 điểm (P.I: 2.0đ, P.II: 4.0đ, P.III: 4.0đ)',
        desc: 'Thiết kế cân đối cho 1 tiết học kiểm tra giữa kỳ hoặc cuối chương'
      },
      {
        id: 'preset_3p_short',
        name: 'Kiểm tra nhanh 15-20 phút (6 - 1 - 2)',
        badge: '15 phút',
        duration: '20',
        p1: '6',
        p2: '1',
        p3: '2',
        totalQuestions: 9,
        points: '10 điểm (P.I: 3.0đ, P.II: 4.0đ, P.III: 3.0đ)',
        desc: 'Kiểm tra đánh giá thường xuyên trên lớp nhanh chóng và hiệu quả'
      },
      {
        id: 'preset_3p_review',
        name: 'Ôn tập chuyên đề (10 - 2 - 3)',
        badge: 'Chuyên đề',
        duration: '35',
        p1: '10',
        p2: '2',
        p3: '3',
        totalQuestions: 15,
        points: '10 điểm',
        desc: 'Luyện tập củng cố tổng hợp theo từng chuyên đề kiến thức'
      }
    ],
    mcq_custom: [
      {
        id: 'preset_custom_mcq20',
        name: 'Chỉ Nhiều phương án (20 câu)',
        badge: '1 Phần',
        duration: '45',
        enableP1: true, p1: '20',
        enableP2: false, p2: '4',
        enableP3: false, p3: '4',
        totalQuestions: 20,
        points: '10 điểm (0.5đ/câu)',
        desc: '1 phần: 20 câu trắc nghiệm truyền thống 4 lựa chọn A, B, C, D'
      },
      {
        id: 'preset_custom_mcq40',
        name: 'Chỉ Nhiều phương án (40 câu)',
        badge: '1 Phần',
        duration: '50',
        enableP1: true, p1: '40',
        enableP2: false, p2: '4',
        enableP3: false, p3: '4',
        totalQuestions: 40,
        points: '10 điểm (0.25đ/câu)',
        desc: '1 phần: 40 câu trắc nghiệm 4 lựa chọn kiểm tra diện rộng'
      },
      {
        id: 'preset_custom_p1_p2',
        name: 'Nhiều PA + Đúng sai (12 + 4)',
        badge: '2 Phần',
        duration: '45',
        enableP1: true, p1: '12',
        enableP2: true, p2: '4',
        enableP3: false, p3: '4',
        totalQuestions: 16,
        points: '10 điểm (Nhiều PA: 3.0đ + Đúng/Sai: 4.0đ + 3.0đ)',
        desc: '2 phần: Kết hợp trắc nghiệm lựa chọn và trắc nghiệm Đúng/Sai 4 ý'
      },
      {
        id: 'preset_custom_p1_p3',
        name: 'Nhiều PA + Trả lời ngắn (12 + 6)',
        badge: '2 Phần',
        duration: '45',
        enableP1: true, p1: '12',
        enableP2: false, p2: '4',
        enableP3: true, p3: '6',
        totalQuestions: 18,
        points: '10 điểm (Nhiều PA: 5.0đ + Trả lời ngắn: 5.0đ)',
        desc: '2 phần: Kết hợp trắc nghiệm lựa chọn và trắc nghiệm điền kết quả'
      },
      {
        id: 'preset_custom_p2_p3',
        name: 'Đúng sai + Trả lời ngắn (4 + 6)',
        badge: '2 Phần',
        duration: '45',
        enableP1: false, p1: '10',
        enableP2: true, p2: '4',
        enableP3: true, p3: '6',
        totalQuestions: 10,
        points: '10 điểm (Đúng/Sai: 4.0đ + Trả lời ngắn: 6.0đ)',
        desc: '2 phần: Đòi hỏi tư duy lập luận và tính toán chính xác số học'
      },
      {
        id: 'preset_custom_p3_only',
        name: 'Chỉ Trả lời ngắn (10 câu)',
        badge: '1 Phần',
        duration: '45',
        enableP1: false, p1: '10',
        enableP2: false, p2: '4',
        enableP3: true, p3: '10',
        totalQuestions: 10,
        points: '10 điểm (1.0đ/câu)',
        desc: '1 phần: Học sinh tự giải và điền đáp số, chống hoàn toàn khoanh bừa'
      }
    ],
    essay: [
      {
        id: 'preset_essay_period',
        name: 'Kiểm tra định kỳ 1 tiết (3 bài)',
        badge: '1 Tiết',
        duration: '45',
        essayCount: '3',
        totalQuestions: 3,
        points: '10 điểm (Bài 1: 3.0đ, Bài 2: 4.0đ, Bài 3: 3.0đ)',
        desc: '3 bài toán tự luận: 1 bài cơ bản, 1 bài thông hiểu, 1 bài vận dụng có barem lời giải'
      },
      {
        id: 'preset_essay_term',
        name: 'Kiểm tra học kỳ (5 bài)',
        badge: 'Học kỳ',
        duration: '90',
        essayCount: '5',
        totalQuestions: 5,
        points: '10 điểm (2.0đ/bài)',
        desc: '5 bài toán tự luận bao quát toàn bộ nội dung chương trình học kỳ'
      },
      {
        id: 'preset_essay_15m',
        name: 'Kiểm tra nhanh 15 phút (2 bài)',
        badge: '15 phút',
        duration: '15',
        essayCount: '2',
        totalQuestions: 2,
        points: '10 điểm (5.0đ/bài)',
        desc: '2 bài tập rèn luyện kỹ năng biến đổi và trình bày lời giải toán'
      },
      {
        id: 'preset_essay_advanced',
        name: 'Khảo sát nâng cao / HSG (4 bài)',
        badge: 'Nâng cao',
        duration: '90',
        essayCount: '4',
        totalQuestions: 4,
        points: '10 điểm (2.5đ/bài)',
        desc: '4 bài toán tư duy phân hóa sâu, bài toán thực tế và bất đẳng thức/hình học'
      }
    ],
    mixed: [
      {
        id: 'preset_mixed_70_30',
        name: 'Chuẩn 70% TN + 30% Tự luận (14 TN + 2 TL)',
        badge: '70% - 30%',
        duration: '45',
        mcqCount: '14',
        essayCount: '2',
        totalQuestions: 16,
        points: '10 điểm (TN: 7.0đ - 0.5đ/câu + TL: 3.0đ - 1.5đ/bài)',
        desc: 'Tỷ lệ vàng phổ biến nhất cho đề kiểm tra định kỳ 45-60 phút'
      },
      {
        id: 'preset_mixed_50_50',
        name: 'Chuẩn 50% TN + 50% Tự luận (10 TN + 3 TL)',
        badge: '50% - 50%',
        duration: '45',
        mcqCount: '10',
        essayCount: '3',
        totalQuestions: 13,
        points: '10 điểm (TN: 5.0đ - 0.5đ/câu + TL: 5.0đ)',
        desc: 'Cân bằng giữa trắc nghiệm kiến thức và năng lực trình bày lập luận'
      },
      {
        id: 'preset_mixed_60_40',
        name: 'Chuẩn 60% TN + 40% Tự luận (12 TN + 2 TL)',
        badge: '60% - 40%',
        duration: '60',
        mcqCount: '12',
        essayCount: '2',
        totalQuestions: 14,
        points: '10 điểm (TN: 6.0đ + TL: 4.0đ)',
        desc: 'Được nhiều trường sử dụng cho bài kiểm tra giữa học kỳ'
      },
      {
        id: 'preset_mixed_80_20',
        name: 'Chuẩn 80% TN + 20% Tự luận (16 TN + 1 TL)',
        badge: '80% - 20%',
        duration: '45',
        mcqCount: '16',
        essayCount: '1',
        totalQuestions: 17,
        points: '10 điểm (TN: 8.0đ - 0.5đ/câu + TL: 2.0đ bài phân hóa cao)',
        desc: 'Kiểm tra diện rộng với 1 bài toán phân loại học sinh giỏi'
      }
    ]
  };

  const matrixPresets = [
    {
      id: 'matrix_4321',
      name: 'Ma trận chuẩn GDPT (40% NB - 30% TH - 20% VD - 10% VDC)',
      badge: 'Chuẩn 4-3-2-1',
      recognize: 40,
      understand: 30,
      apply: 20,
      highApply: 10,
      desc: 'Phổ biến nhất cho đề kiểm tra định kỳ, giữa kỳ và thi học kỳ'
    },
    {
      id: 'matrix_3331',
      name: 'Ma trận đồng đều (30% NB - 30% TH - 30% VD - 10% VDC)',
      badge: 'Đồng đều 3-3-3-1',
      recognize: 30,
      understand: 30,
      apply: 30,
      highApply: 10,
      desc: 'Tăng cường câu hỏi vận dụng toán học vào đời sống thực tế'
    },
    {
      id: 'matrix_5320',
      name: 'Ma trận cơ bản (50% NB - 30% TH - 20% VD - 0% VDC)',
      badge: 'Cơ bản 5-3-2-0',
      recognize: 50,
      understand: 30,
      apply: 20,
      highApply: 0,
      desc: 'Phù hợp ôn tập đầu năm, củng cố kiến thức cho học sinh đại trà'
    },
    {
      id: 'matrix_2332',
      name: 'Ma trận nâng cao (20% NB - 30% TH - 30% VD - 20% VDC)',
      badge: 'Phân hóa 2-3-3-2',
      recognize: 20,
      understand: 30,
      apply: 30,
      highApply: 20,
      desc: 'Dành cho bài kiểm tra lớp chọn, khảo sát đánh giá phân hóa cao'
    }
  ];

  const applyPreset = (p: any, format: 'mcq_3part' | 'mcq_custom' | 'essay' | 'mixed') => {
    setActivePresetId(p.id);
    setNewDuration(p.duration);
    if (!newTitle || newTitle.startsWith('Đề ') || newTitle === '') {
      setNewTitle(`Đề Toán Lớp ${newGrade} - ${p.name}`);
    }

    if (format === 'mcq_3part') {
      setPart1Count(p.p1);
      setPart2Count(p.p2);
      setPart3Count(p.p3);
    } else if (format === 'mcq_custom') {
      setCustomPart1Enabled(Boolean(p.enableP1));
      setCustomPart1Count(p.p1);
      setCustomPart2Enabled(Boolean(p.enableP2));
      setCustomPart2Count(p.p2);
      setCustomPart3Enabled(Boolean(p.enableP3));
      setCustomPart3Count(p.p3);
    } else if (format === 'essay') {
      setEssayCount(p.essayCount);
    } else if (format === 'mixed') {
      setMcqCount(p.mcqCount);
      setEssayCount(p.essayCount);
    }
  };

  const applyMatrixPreset = (mp: any) => {
    setSelectedMatrixPreset(mp.id);
    setMatrixConfig({
      name: mp.name,
      levels: {
        recognize: mp.recognize,
        understand: mp.understand,
        apply: mp.apply,
        highApply: mp.highApply
      },
      notes: mp.desc
    });
  };

  const openCreateModal = (
    mode: 'auto' | 'upload' | 'matrix' = 'auto', 
    format: 'mcq_3part' | 'mcq_custom' | 'essay' | 'mixed' = 'mcq_3part',
    presetId?: string
  ) => {
    setEditingTestId(null);
    setOnlineCreationMode(mode);
    setExamFormat(format);
    setCreatingType(format === 'essay' ? 'essay' : (format === 'mixed' ? 'mixed' : 'mcq'));
    setAutoGenType(mode === 'matrix' ? 'matrix' : format);
    setNewFile(null);
    setNewAnswerFile(null);
    setMatrixFile(null);
    setSplitAnswers(false);
    setMatrixSourceType('preset');
    setNewGrade(selectedGrade ? selectedGrade.toString() : '9');
    setNewTopicId(selectedTopicId || '');
    setCreateMultiVariant(false);
    setVariantCount('4');
    setCustomVariantCodes('101, 102, 103, 104');
    setShuffleQuestions(true);
    setShuffleOptions(true);

    const presets = formatPresets[format] || [];
    const selectedP = presetId ? presets.find(p => p.id === presetId) : presets[0];
    if (selectedP) {
      applyPreset(selectedP, format);
    }
    setShowCreateModal(true);
  };

  const [autoGenType, setAutoGenType] = useState<'mcq_3part' | 'mcq_custom' | 'mcq' | 'essay' | 'mixed' | 'matrix'>('mcq_3part');
  const [matrixFile, setMatrixFile] = useState<File | null>(null);
  const [mcqCount, setMcqCount] = useState('10');
  const [essayCount, setEssayCount] = useState('2');

  // Trắc nghiệm 3 phần (Chuẩn Bộ GD&ĐT)
  const [part1Count, setPart1Count] = useState('12'); // Nhiều phương án A, B, C, D
  const [part2Count, setPart2Count] = useState('4');  // Đúng / Sai (ý a, b, c, d)
  const [part3Count, setPart3Count] = useState('6');  // Trả lời ngắn

  // Trắc nghiệm tùy biến (Chọn 1 hoặc 2 của trắc nghiệm 3 phần)
  const [customPart1Enabled, setCustomPart1Enabled] = useState(true);
  const [customPart1Count, setCustomPart1Count] = useState('10');
  const [customPart2Enabled, setCustomPart2Enabled] = useState(false);
  const [customPart2Count, setCustomPart2Count] = useState('4');
  const [customPart3Enabled, setCustomPart3Enabled] = useState(false);
  const [customPart3Count, setCustomPart3Count] = useState('4');

  const [showMakeOnlineModal, setShowMakeOnlineModal] = useState(false);
  const [makeOnlineTest, setMakeOnlineTest] = useState<any>(null);
  const [makeOnlineFile, setMakeOnlineFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const createTest = async (type: 'mcq' | 'essay', subType?: 'mcq_3part' | 'mcq_custom' | 'essay' | 'mixed' | 'matrix') => {
    let mode: 'auto' | 'upload' | 'matrix' = 'auto';
    let format: 'mcq_3part' | 'mcq_custom' | 'essay' | 'mixed' = 'mcq_3part';
    
    if (type === 'essay' && !subType) {
      mode = 'upload';
      format = 'essay';
    } else if (subType === 'matrix') {
      mode = 'matrix';
      format = 'mcq_3part';
    } else if (subType === 'essay') {
      mode = 'auto';
      format = 'essay';
    } else if (subType === 'mixed') {
      mode = 'auto';
      format = 'mixed';
    } else if (subType === 'mcq_custom') {
      mode = 'auto';
      format = 'mcq_custom';
    } else {
      mode = 'auto';
      format = 'mcq_3part';
    }
    
    openCreateModal(mode, format);
  };

  const handleEditTest = (test: any) => {
    setEditingTestId(test.id);
    setCreatingType(test.type);
    setNewTitle(test.title);
    setNewDuration(test.durationMinutes.toString());
    setNewGrade(test.grade ? test.grade.toString() : '9');
    setNewTopicId(test.topicId || '');
    setCreateMultiVariant(test.isMultiVariant || (test.variants && test.variants.length > 1));
    setCustomVariantCodes(test.variantCodes?.join(', ') || '101, 102, 103, 104');
    setNewFile(null); // Require re-uploading file if they want to change it
    setShowCreateModal(true);
  };

  const handleOpenVariantManager = (t: any, initialTab: 'matrix' | 'isomorphic' | 'shuffle' | 'compare' = 'matrix') => {
    setVariantModalTest(t);
    setShowVariantModal(true);
    setIsomorphicError('');
    setIsomorphicProgressText('');
    const isSingle = !t.isMultiVariant && (!t.variants || t.variants.length <= 1);
    if (isSingle) {
      setNewMultiVariantTitle(`${t.title} (Nhiều mã đề)`);
    } else {
      setNewMultiVariantTitle(t.title);
    }
    const hasVariants = t.variants && t.variants.length > 0;
    if (hasVariants) {
      setActivePreviewVariantCode(t.variants[0].code);
      setVariantModalTab(initialTab);
      const codesStr = t.variantCodes?.join(', ') || t.variants.map((v: any) => v.code).join(', ');
      setManageVariantCodes(codesStr);
      setCustomVariantCodes(codesStr);
      setManageVariantCount(t.variants.length.toString());
    } else {
      setActivePreviewVariantCode('');
      setVariantModalTab(initialTab === 'matrix' ? 'isomorphic' : initialTab);
      setManageVariantCodes('101, 102, 103, 104');
      setCustomVariantCodes('101, 102, 103, 104');
      setManageVariantCount('4');
    }
  };

  const handleGenerateIsomorphicVariants = async () => {
    if (!variantModalTest) return;
    setIsGeneratingIsomorphic(true);
    setIsomorphicError('');
    setSysError('');
    
    try {
      let baseQuestions: any[] = [];
      if (variantModalTest.variants && variantModalTest.variants.length > 0) {
        baseQuestions = variantModalTest.variants[0].questions || [];
      }
      if (baseQuestions.length === 0 && variantModalTest.questionsData) {
        baseQuestions = getParsedQuestions(variantModalTest.questionsData);
      }
      if (baseQuestions.length === 0) {
        setIsomorphicError('Không tìm thấy dữ liệu câu hỏi trong đề thi này để tạo mã đề.');
        setIsGeneratingIsomorphic(false);
        return;
      }

      const rawCodes = customVariantCodes.split(',').map(s => s.trim()).filter(Boolean);
      const validCodes = rawCodes.length > 0 ? rawCodes : ['101', '102', '103', '104'];
      
      const baseCode = validCodes[0];
      const targetCodes = validCodes.slice(1);

      if (targetCodes.length === 0) {
        setIsomorphicError('Vui lòng nhập ít nhất 2 mã đề (ví dụ: 101, 102, 103, 104) để tạo các mã đề tương tự.');
        setIsGeneratingIsomorphic(false);
        return;
      }

      setIsomorphicTotal(targetCodes.length);
      setIsomorphicStep(0);

      // Prepare array of all variants, starting with the base test (variant 0)
      const allVariants: any[] = [
        {
          code: baseCode,
          questions: baseQuestions,
          questionsData: JSON.stringify(baseQuestions)
        }
      ];

      for (let i = 0; i < targetCodes.length; i++) {
        const code = targetCodes[i];
        setIsomorphicStep(i + 1);
        setIsomorphicProgressText(`Đang dùng AI tạo mã đề ${code} (${i + 1}/${targetCodes.length}) bằng cách đổi số liệu...`);

        const res = await fetch('/api/generate-isomorphic-variant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-gemini-api-key': localStorage.getItem('gemini_api_key') || ''
          },
          body: JSON.stringify({
            baseQuestions,
            sourceCode: baseCode,
            targetCode: code,
            testTitle: variantModalTest.title,
            grade: variantModalTest.grade
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.details || errData.error || `Lỗi khi sinh mã đề ${code}`);
        }

        const generatedVariant = await res.json();
        allVariants.push(generatedVariant);
      }

      // Check if the current test is an original single-variant test
      const isOriginalSingleVariant = !variantModalTest.isMultiVariant && (!variantModalTest.variants || variantModalTest.variants.length <= 1);
      const allCodes = allVariants.map(v => v.code);
      const targetTitle = (newMultiVariantTitle && newMultiVariantTitle.trim())
        ? newMultiVariantTitle.trim()
        : `${variantModalTest.title} (Nhiều mã đề)`;

      if (isOriginalSingleVariant) {
        // Create a new independent multi-variant test document, leaving the original test untouched in "Đề thi có 1 mã đề"!
        const newTestData = {
          title: targetTitle,
          grade: variantModalTest.grade || 10,
          subject: variantModalTest.subject || 'Toán học',
          topic: variantModalTest.topic || 'Chưa phân loại',
          topicId: variantModalTest.topicId || '',
          durationMinutes: variantModalTest.durationMinutes || 45,
          type: variantModalTest.type || 'mcq',
          mcqCount: variantModalTest.mcqCount || baseQuestions.length,
          essayCount: variantModalTest.essayCount || 0,
          fileUrl: variantModalTest.fileUrl || '',
          fileName: variantModalTest.fileName || '',
          answerFileUrl: variantModalTest.answerFileUrl || '',
          answerFileName: variantModalTest.answerFileName || '',
          isCustom: true,
          rubricUrl: variantModalTest.rubricUrl || '',
          createdAt: new Date().toISOString(),
          createdBy: variantModalTest.createdBy || user?.displayName || user?.email || 'Giáo viên',
          isMultiVariant: true,
          variantCodes: allCodes,
          variants: allVariants,
          questionsData: allVariants[0]?.questionsData || JSON.stringify(baseQuestions),
          originalTestId: variantModalTest.id,
          originalTestTitle: variantModalTest.title
        };

        const docRef = await addDoc(collection(db, 'tests'), newTestData);
        const createdTest = { ...newTestData, id: docRef.id };

        // Keep the original test in state, add newly created multi-variant test
        setTests(prev => [createdTest, ...prev]);
        setVariantModalTest(createdTest);
        setActivePreviewVariantCode(allCodes[0]);
        setVariantModalTab('matrix');
        setSysMsg(`Đã tạo thành công đề nhiều mã đề mới: "${createdTest.title}". Đề gốc "${variantModalTest.title}" vẫn được giữ nguyên vẹn trong thư mục Đề thi 1 mã đề!`);
        setTimeout(() => setSysMsg(''), 6000);
      } else {
        // Already a multi-variant test, update in-place
        await updateDoc(doc(db, 'tests', variantModalTest.id), {
          isMultiVariant: true,
          variantCodes: allCodes,
          variants: allVariants,
          questionsData: allVariants[0]?.questionsData || JSON.stringify(baseQuestions)
        });

        const updatedTest = {
          ...variantModalTest,
          isMultiVariant: true,
          variantCodes: allCodes,
          variants: allVariants,
          questionsData: allVariants[0]?.questionsData || JSON.stringify(baseQuestions)
        };
        setVariantModalTest(updatedTest);
        setTests(prev => prev.map(item => item.id === updatedTest.id ? updatedTest : item));
        setActivePreviewVariantCode(allCodes[0]);
        setVariantModalTab('matrix');
        setSysMsg(`Đã tạo thành công ${allVariants.length} mã đề tương tự bằng cách đổi số liệu (${allCodes.join(', ')})!`);
        setTimeout(() => setSysMsg(''), 5000);
      }
    } catch (err: any) {
      console.error(err);
      setIsomorphicError(err?.message || 'Không thể tạo mã đề đổi số liệu.');
    } finally {
      setIsGeneratingIsomorphic(false);
      setIsomorphicProgressText('');
    }
  };

  const handleGenerateAndSaveVariants = async () => {
    if (!variantModalTest) return;
    setIsSavingVariants(true);
    setSysError('');
    try {
      let baseQuestions: any[] = [];
      if (variantModalTest.variants && variantModalTest.variants.length > 0) {
        baseQuestions = variantModalTest.variants[0].questions || [];
      }
      if (baseQuestions.length === 0 && variantModalTest.questionsData) {
        baseQuestions = getParsedQuestions(variantModalTest.questionsData);
      }
      if (baseQuestions.length === 0) {
        setSysError('Không tìm thấy dữ liệu câu hỏi trong đề thi này để tạo mã đề.');
        setIsSavingVariants(false);
        return;
      }

      const codes = customVariantCodes.split(',').map(s => s.trim()).filter(Boolean);
      const validCodes = codes.length > 0 ? codes : ['101', '102', '103', '104'];

      const variants = generateTestVariants(baseQuestions, validCodes, {
        shuffleQuestions: shuffleQuestions,
        shuffleOptions: shuffleOptions
      });

      // Check if the current test is an original single-variant test
      const isOriginalSingleVariant = !variantModalTest.isMultiVariant && (!variantModalTest.variants || variantModalTest.variants.length <= 1);
      const targetTitle = (newMultiVariantTitle && newMultiVariantTitle.trim())
        ? newMultiVariantTitle.trim()
        : `${variantModalTest.title} (Nhiều mã đề)`;

      if (isOriginalSingleVariant) {
        // Create a new independent multi-variant test document, leaving the original test untouched in "Đề thi có 1 mã đề"!
        const newTestData = {
          title: targetTitle,
          grade: variantModalTest.grade || 10,
          subject: variantModalTest.subject || 'Toán học',
          topic: variantModalTest.topic || 'Chưa phân loại',
          topicId: variantModalTest.topicId || '',
          durationMinutes: variantModalTest.durationMinutes || 45,
          type: variantModalTest.type || 'mcq',
          mcqCount: variantModalTest.mcqCount || baseQuestions.length,
          essayCount: variantModalTest.essayCount || 0,
          fileUrl: variantModalTest.fileUrl || '',
          fileName: variantModalTest.fileName || '',
          answerFileUrl: variantModalTest.answerFileUrl || '',
          answerFileName: variantModalTest.answerFileName || '',
          isCustom: true,
          rubricUrl: variantModalTest.rubricUrl || '',
          createdAt: new Date().toISOString(),
          createdBy: variantModalTest.createdBy || user?.displayName || user?.email || 'Giáo viên',
          isMultiVariant: true,
          variantCodes: validCodes,
          variants: variants,
          questionsData: variants[0]?.questionsData || JSON.stringify(baseQuestions),
          originalTestId: variantModalTest.id,
          originalTestTitle: variantModalTest.title
        };

        const docRef = await addDoc(collection(db, 'tests'), newTestData);
        const createdTest = { ...newTestData, id: docRef.id };

        // Keep the original test in state, add newly created multi-variant test
        setTests(prev => [createdTest, ...prev]);
        setVariantModalTest(createdTest);
        setActivePreviewVariantCode(validCodes[0]);
        setVariantModalTab('matrix');
        setSysMsg(`Đã tạo thành công đề nhiều mã đề mới: "${createdTest.title}". Đề gốc "${variantModalTest.title}" vẫn được giữ nguyên vẹn trong thư mục Đề thi 1 mã đề!`);
        setTimeout(() => setSysMsg(''), 6000);
      } else {
        await updateDoc(doc(db, 'tests', variantModalTest.id), {
          isMultiVariant: true,
          variantCodes: validCodes,
          variants: variants,
          questionsData: variants[0]?.questionsData || JSON.stringify(baseQuestions)
        });

        const updatedTest = {
          ...variantModalTest,
          isMultiVariant: true,
          variantCodes: validCodes,
          variants: variants,
          questionsData: variants[0]?.questionsData || JSON.stringify(baseQuestions)
        };
        setVariantModalTest(updatedTest);
        setTests(prev => prev.map(item => item.id === updatedTest.id ? updatedTest : item));
        setActivePreviewVariantCode(validCodes[0]);
        setVariantModalTab('matrix');
        setSysMsg(`Đã cập nhật ${validCodes.length} mã đề xáo trộn (${validCodes.join(', ')})!`);
        setTimeout(() => setSysMsg(''), 4000);
      }
    } catch (err: any) {
      console.error(err);
      setSysError('Lỗi khi tạo mã đề: ' + (err?.message || 'Không thể lưu.'));
    } finally {
      setIsSavingVariants(false);
    }
  };

  
  const handleDeleteTest = async (testId: string) => {
    try {
      // Find all assignments associated with this test
      const qAssign = query(collection(db, 'assignments'), where('testId', '==', testId));
      const assignSnap = await getDocs(qAssign);
      
      const deletePromises: Promise<void>[] = [];
      
      for (const aDoc of assignSnap.docs) {
        // Find all submissions for this assignment
        const qSub = query(collection(db, 'submissions'), where('assignmentId', '==', aDoc.id));
        const subSnap = await getDocs(qSub);
        subSnap.docs.forEach(sDoc => {
          deletePromises.push(deleteDoc(doc(db, 'submissions', sDoc.id)));
        });
        
        // Delete the assignment
        deletePromises.push(deleteDoc(doc(db, 'assignments', aDoc.id)));
      }
      
      // Execute assignment and submission deletions
      if (deletePromises.length > 0) {
        await Promise.all(deletePromises);
      }

      // Delete the test itself
      await deleteDoc(doc(db, 'tests', testId));
      setDeletingTestId(null);
      loadData();
    } catch (err: any) {
      console.error(err);
    }
  };

  const [sysError, setSysError] = useState('');
  const [sysMsg, setSysMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  
    const removeVietnameseTones = (str: string) => {
    if (!str) return '';
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a"); 
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e"); 
    str = str.replace(/ì|í|ị|ỉ|ĩ/g,"i"); 
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o"); 
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u"); 
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y"); 
    str = str.replace(/đ/g,"d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    return str;
  }

  
  
  
  const [exportingAssignId, setExportingAssignId] = useState<string | null>(null);

  const exportGradebookForAssignment = async (a: any, format: 'pdf' | 'excel' = 'pdf') => {
    const classStudents = studentsList.filter(s => s.className === a.className);
    if (classStudents.length === 0) {
      alert('Lớp này chưa có học sinh!');
      return;
    }

    const teacherName = user?.displayName || user?.email || 'Giáo viên';

    if (format === 'excel') {
      try {
        exportGradebookExcel(classStudents, submissionsList, a, teacherName);
        setSysMsg(`Đã xuất bảng điểm Excel lớp ${a.className} thành công!`);
        setTimeout(() => setSysMsg(''), 4000);
      } catch (err: any) {
        console.error('Excel export error:', err);
        setSysError('Lỗi xuất Excel: ' + (err?.message || 'Không thể tạo file'));
      }
      return;
    }

    // PDF format
    setExportingAssignId(a.id);
    setSysMsg('Đang tạo bảng điểm PDF chuẩn A4 (chống cắt dòng)...');
    try {
      await exportGradebookPdf(
        classStudents,
        submissionsList,
        a,
        teacherName,
        (msg) => setSysMsg(msg)
      );
      setSysMsg(`Đã xuất bảng điểm PDF lớp ${a.className} thành công!`);
      setTimeout(() => setSysMsg(''), 4000);
    } catch (err: any) {
      console.error('PDF export error:', err);
      setSysError('Lỗi xuất PDF: ' + (err?.message || 'Không thể tạo file PDF'));
    } finally {
      setExportingAssignId(null);
    }
  };




  const renderTestAssignments = (testId: string) => {
    const tAssigns = assignmentsList.filter(a => a.testId === testId);
    if (tAssigns.length === 0) return null;
    
    return (
      <div className="mt-4 pt-4 border-t border-gray-100 text-sm">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-700 text-xs uppercase tracking-wider">Đang giao cho {tAssigns.length} lớp:</h4>
        </div>
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {tAssigns.map(a => {
            const classStudentsCount = studentsList.filter(s => s.className === a.className).length;
            const submittedCount = submissionsList.filter(s => s.assignmentId === a.id).length;
            const isOverdue = a.dueDate ? new Date(a.dueDate).getTime() < Date.now() : false;
            const canCancel = role === 'admin' || !a.classId || assignedClasses.includes(a.classId) || a.assignedBy === user?.uid;

            return (
              <div key={a.id} className="flex flex-col gap-1.5 bg-gray-50/80 p-2.5 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-blue-700 truncate">Lớp {a.className}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border shrink-0 ${
                      isOverdue 
                        ? 'bg-rose-50 text-rose-700 border-rose-200' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {isOverdue ? 'Hết hạn' : 'Đang mở'}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-gray-600 bg-white px-2 py-0.5 rounded-full border border-gray-200 shrink-0">
                    Đã nộp: {submittedCount}/{classStudentsCount}
                  </span>
                </div>

                <div className="text-[11px] text-gray-500 space-y-0.5">
                  <span className="block">Giao lúc: {new Date(a.assignedDate || a.createdAt).toLocaleString('vi-VN')}</span>
                  <span className={`block font-medium ${isOverdue ? 'text-rose-600' : 'text-gray-600'}`}>
                    Hạn: {new Date(a.dueDate).toLocaleString('vi-VN')}
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-1.5 pt-1 border-t border-gray-200/60">
                  <button 
                    disabled={exportingAssignId === a.id}
                    onClick={() => exportGradebookForAssignment(a, 'pdf')}
                    className="flex-1 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 py-1.5 px-2 rounded-lg transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                    title="Xuất bảng điểm PDF (chuẩn A4, không cắt dòng)"
                  >
                    <FileText size={13} />
                    <span>{exportingAssignId === a.id ? 'Đang tạo...' : 'PDF'}</span>
                  </button>

                  <button 
                    onClick={() => exportGradebookForAssignment(a, 'excel')}
                    className="text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 py-1.5 px-2.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                    title="Xuất bảng điểm Excel (.xlsx)"
                  >
                    <FileSpreadsheet size={13} />
                    <span>Excel</span>
                  </button>

                  {canCancel && (
                    <button 
                      type="button"
                      onClick={() => setAssignmentToCancel(a)}
                      className="text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 py-1.5 px-2.5 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      title="Hủy giao bài kiểm tra này cho lớp"
                    >
                      <Trash2 size={13} />
                      <span>Hủy giao</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSysError('');
    if (!newTitle || !newDuration) {
      setSysError('Vui lòng điền đầy đủ Tên đề kiểm tra và Thời gian.');
      return;
    }
    
    setIsSaving(true);
    
    // Find a valid topic for the selected grade to associate the test with
    const gradeNum = parseInt(newGrade, 10);
    const validTopics = topics.filter(t => t.grade === gradeNum);
    let targetTopicId = newTopicId || (validTopics.length > 0 ? validTopics[0].id : `topic-fake-${gradeNum}`);

    // Validation based on creation mode
    if (onlineCreationMode === 'upload' && !newFile && !editingTestId) {
      setSysError('Vui lòng chọn tệp đề bài tải lên từ máy tính (PDF, Word, Ảnh).');
      setIsSaving(false);
      return;
    }

    if (onlineCreationMode === 'matrix' && matrixSourceType === 'file' && !matrixFile && !editingTestId) {
      setSysError('Vui lòng chọn tệp ma trận đề thi (Excel, Word, PDF hoặc Ảnh).');
      setIsSaving(false);
      return;
    }

    if (examFormat === 'mcq_custom') {
      const selectedPartsCount = [customPart1Enabled, customPart2Enabled, customPart3Enabled].filter(Boolean).length;
      if (selectedPartsCount === 0) {
        setSysError('Vui lòng chọn ít nhất 1 phần trong cấu trúc trắc nghiệm tùy biến.');
        setIsSaving(false);
        return;
      }
      if (selectedPartsCount > 2) {
        setSysError('Dạng trắc nghiệm tùy biến chỉ cho phép chọn 1 hoặc 2 phần. Nếu muốn tạo cả 3 phần, vui lòng chuyển sang dạng "Trắc nghiệm 3 phần (Chuẩn Bộ GD&ĐT)"!');
        setIsSaving(false);
        return;
      }
    }

    try {
      let finalFileUrl = "";
      let extractionFileUrl = "";
      
      if (newFile) {
        extractionFileUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(newFile);
        });

        if (newFile.size > 800000) {
          setSysError('Tệp tải lên quá lớn (giới hạn ~800KB). Hệ thống sẽ trích xuất nhưng không lưu được gốc.'); setTimeout(() => setSysError(''), 5000);
        } else {
          finalFileUrl = extractionFileUrl;
        }
      }

      let resolvedType = 'mcq';
      if (examFormat === 'essay') {
        resolvedType = 'essay';
      } else if (examFormat === 'mixed' || onlineCreationMode === 'matrix') {
        resolvedType = 'mixed';
      } else {
        resolvedType = 'mcq';
      }
      
      const testData: any = {
        title: newTitle,
        type: resolvedType,
        durationMinutes: parseInt(newDuration, 10),
        topicId: targetTopicId,
        grade: gradeNum,
        creationMode: onlineCreationMode,
        examFormat: examFormat,
        autoGenType: (onlineCreationMode === 'matrix' ? 'matrix' : examFormat),
        formatType: examFormat,
        activePresetId
      };

      if (onlineCreationMode === 'matrix') {
        testData.matrixSourceType = matrixSourceType;
        if (matrixSourceType === 'preset') {
          testData.matrixConfig = matrixConfig;
        }
      }
      
      if (onlineCreationMode !== 'upload') {
        let computedMcqCount = 0;
        if (examFormat === 'mcq_3part') {
          const p1 = parseInt(part1Count, 10) || 12;
          const p2 = parseInt(part2Count, 10) || 4;
          const p3 = parseInt(part3Count, 10) || 6;
          computedMcqCount = p1 + p2 + p3;
          testData.part1Count = p1;
          testData.part2Count = p2;
          testData.part3Count = p3;
        } else if (examFormat === 'mcq_custom') {
          const p1 = customPart1Enabled ? (parseInt(customPart1Count, 10) || 0) : 0;
          const p2 = customPart2Enabled ? (parseInt(customPart2Count, 10) || 0) : 0;
          const p3 = customPart3Enabled ? (parseInt(customPart3Count, 10) || 0) : 0;
          computedMcqCount = p1 + p2 + p3;
          testData.customPartsConfig = {
            enablePart1: customPart1Enabled,
            part1Count: customPart1Count,
            enablePart2: customPart2Enabled,
            part2Count: customPart2Count,
            enablePart3: customPart3Enabled,
            part3Count: customPart3Count
          };
        } else if (examFormat === 'mixed') {
          computedMcqCount = parseInt(mcqCount, 10) || 14;
        } else {
          computedMcqCount = parseInt(mcqCount, 10) || 0;
        }

        testData.mcqCount = computedMcqCount;
        testData.essayCount = parseInt(essayCount, 10) || (examFormat === 'essay' ? 3 : (examFormat === 'mixed' ? 2 : 0));
        testData.isAutoGenerated = true;
        if (onlineCreationMode === 'matrix' && matrixFile) {
          testData.matrixFileName = matrixFile.name;
        }

        if (!editingTestId) {
          setSysMsg(onlineCreationMode === 'matrix' ? 'Đang dùng AI tạo đề theo ma trận... Vui lòng chờ...' : 'Đang dùng AI tạo đề tự động... Vui lòng chờ...');
          
          let matrixFileDataUrl = "";
          let mimeType = "";
          if (onlineCreationMode === 'matrix' && matrixFile) {
            matrixFileDataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(matrixFile);
            });
            mimeType = matrixFile.type;
          }

          try {
            const res = await fetch('/api/generate-test', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-gemini-api-key': localStorage.getItem('gemini_api_key') || '' },
              body: JSON.stringify({
                title: newTitle,
                grade: gradeNum,
                autoGenType: (onlineCreationMode === 'matrix' ? 'matrix' : examFormat),
                formatType: examFormat,
                matrixConfig: (onlineCreationMode === 'matrix' && matrixSourceType === 'preset' ? matrixConfig : undefined),
                mcqCount: testData.mcqCount,
                essayCount: testData.essayCount,
                part1Count,
                part2Count,
                part3Count,
                customPartsConfig: {
                  enablePart1: customPart1Enabled,
                  part1Count: customPart1Count,
                  enablePart2: customPart2Enabled,
                  part2Count: customPart2Count,
                  enablePart3: customPart3Enabled,
                  part3Count: customPart3Count
                },
                matrixFileDataUrl,
                mimeType
              })
            });
            if (res.ok) {
              const generated = await res.json();
              if (Array.isArray(generated) && generated.length > 0) {
                if (createMultiVariant) {
                  const codes = customVariantCodes.split(',').map(s => s.trim()).filter(Boolean);
                  const validCodes = codes.length > 0 ? codes : ['101', '102', '103', '104'];

                  if (createVariantMethod === 'isomorphic') {
                    setSysMsg(`Đang tạo mã đề tương tự bằng cách đổi số liệu toán học...`);
                    const baseCode = validCodes[0];
                    const targetCodes = validCodes.slice(1);
                    const allVariants: any[] = [
                      {
                        code: baseCode,
                        questions: generated,
                        questionsData: JSON.stringify(generated)
                      }
                    ];

                    for (let i = 0; i < targetCodes.length; i++) {
                      const code = targetCodes[i];
                      setSysMsg(`Đang dùng AI tạo mã đề ${code} (${i + 1}/${targetCodes.length}) bằng cách đổi số liệu...`);
                      try {
                        const isoRes = await fetch('/api/generate-isomorphic-variant', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'x-gemini-api-key': localStorage.getItem('gemini_api_key') || ''
                          },
                          body: JSON.stringify({
                            baseQuestions: generated,
                            sourceCode: baseCode,
                            targetCode: code,
                            testTitle: newTitle,
                            grade: gradeNum
                          })
                        });
                        if (isoRes.ok) {
                          const isoVariant = await isoRes.json();
                          allVariants.push(isoVariant);
                        }
                      } catch (isoErr) {
                        console.error('Error generating isomorphic variant on create', code, isoErr);
                      }
                    }

                    const allCodes = allVariants.map(v => v.code);
                    testData.isMultiVariant = true;
                    testData.variantCodes = allCodes;
                    testData.variants = allVariants;
                    testData.questionsData = allVariants[0]?.questionsData || JSON.stringify(generated);
                  } else {
                    const variants = generateTestVariants(generated, validCodes, {
                      shuffleQuestions,
                      shuffleOptions
                    });
                    testData.isMultiVariant = true;
                    testData.variantCodes = validCodes;
                    testData.variants = variants;
                    testData.questionsData = variants[0]?.questionsData || JSON.stringify(generated);
                  }
                } else {
                  testData.isMultiVariant = false;
                  testData.variantCodes = ['101'];
                  testData.variants = [];
                  testData.questionsData = JSON.stringify(generated);
                }
              } else {
                setSysMsg('');
                setSysError('AI trả về kết quả rỗng. Hãy thử lại với câu lệnh rõ ràng hơn.');
                setIsSaving(false);
                return;
              }
            } else {
              setSysMsg('');
              const errData = await res.json().catch(() => ({}));
              setSysError('Lỗi máy chủ khi tạo đề bằng AI: ' + (errData.details || errData.error || res.statusText));
              setIsSaving(false);
              return;
            }
          } catch(e: any) {
            console.error("Generate error", e);
            setSysMsg('');
            setSysError('Lỗi kết nối khi tạo đề bằng AI: ' + (e?.message || 'Không nhận được phản hồi từ máy chủ'));
            setIsSaving(false);
            return;
          }
        }
      }
      
      if (newFile) {
        testData.fileUrl = finalFileUrl || "";
        testData.fileName = newFile.name;

        if (splitAnswers && extractionFileUrl) {
           setSysMsg('Đang dùng AI để phân tích và tách riêng Đề bài / Đáp án... Vui lòng chờ (có thể mất 15-30s)...');
           try {
              const splitRes = await fetch('/api/split-document', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json', 'x-gemini-api-key': localStorage.getItem('gemini_api_key') || '' },
                 body: JSON.stringify({ fileDataUrl: extractionFileUrl, mimeType: newFile.type })
              });
              if (splitRes.ok) {
                 const splitData = await splitRes.json();
                 if (splitData.cleanTestHtml && splitData.answersHtml) {
                    const encodeBase64 = (str: string) => btoa(unescape(encodeURIComponent(str)));
                    testData.fileUrl = "data:text/html;base64," + encodeBase64("<!DOCTYPE html><html><head><meta charset='utf-8'><title>Đề thi</title><script type='text/x-mathjax-config'>MathJax.Hub.Config({tex2jax: {inlineMath: [['$','$'], ['\\\\(','\\\\)']], displayMath: [['$$$$','$$$$'], ['\\\\[','\\\\]']], processEscapes: true}});</script><script type='text/javascript' async src='https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js?config=TeX-MML-AM_CHTML'></script></head><body style='font-family: Arial; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto;'>" + splitData.cleanTestHtml + "</body></html>");
                    testData.fileName = "de_thi_sach.html";
                    testData.answerFileUrl = "data:text/html;base64," + encodeBase64("<!DOCTYPE html><html><head><meta charset='utf-8'><title>Đáp án</title><script type='text/x-mathjax-config'>MathJax.Hub.Config({tex2jax: {inlineMath: [['$','$'], ['\\\\(','\\\\)']], displayMath: [['$$$$','$$$$'], ['\\\\[','\\\\]']], processEscapes: true}});</script><script type='text/javascript' async src='https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js?config=TeX-MML-AM_CHTML'></script></head><body style='font-family: Arial; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto;'>" + splitData.answersHtml + "</body></html>");
                    testData.answerFileName = "dap_an_chi_tiet.html";
                 } else {
                    setSysMsg('');
                    setSysError('AI không thể tự động tách được Đề và Đáp án từ file này. Vui lòng bỏ tích chọn tách tự động, hoặc tự tách thành 2 file riêng biệt trên máy của bạn rồi tải lên.');
                    setIsSaving(false);
                    return;
                 }
              } else {
                 setSysMsg('');
                 const errData = await splitRes.json().catch(() => ({})); setSysError('Lỗi máy chủ khi tách đề: ' + (errData.details || errData.error || splitRes.statusText));
                 setIsSaving(false);
                 return;
              }
           } catch(e) {
              console.error("Split error", e);
              setSysMsg('');
              setSysError('Lỗi kết nối khi tách đề.');
              setIsSaving(false);
              return;
           }
        } else if (newAnswerFile) {
            const answerFileDataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(newAnswerFile);
            });
            if (newAnswerFile.size <= 800000) {
               testData.answerFileUrl = answerFileDataUrl;
               testData.answerFileName = newAnswerFile.name;
            } else {
               setSysError('Tệp đáp án quá lớn. Vui lòng dùng tệp nhỏ hơn (dưới 800KB).'); setTimeout(() => setSysError(''), 4000);
            }
        }

        if (extractionFileUrl) {
          setSysMsg('Đang dùng AI trích xuất câu hỏi từ tài liệu... Vui lòng chờ...');
          try {
            const res = await fetch('/api/extract-questions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-gemini-api-key': localStorage.getItem('gemini_api_key') || '' },
              body: JSON.stringify({ fileDataUrl: extractionFileUrl, mimeType: newFile.type })
            });
            if (res.ok) {
              const extracted = await res.json();
              if (Array.isArray(extracted) && extracted.length > 0) {
                testData.questionsData = JSON.stringify(extracted);
                if (testData.type === 'essay') {
                  testData.type = 'mixed';
                }
              } else {
                setSysMsg('');
                setSysError('AI trả về kết quả rỗng. Vui lòng kiểm tra lại tài liệu.');
                setIsSaving(false);
                return;
              }
            } else {
              setSysMsg('');
              const errData = await res.json().catch(() => ({}));
              setSysError('Lỗi máy chủ khi trích xuất bằng AI: ' + (errData.details || errData.error || res.statusText));
              setIsSaving(false);
              return;
            }
          } catch(e) {
             console.error("Extraction error", e);
             setSysMsg('');
             setSysError('Lỗi kết nối khi trích xuất tài liệu.');
             setIsSaving(false);
             return;
          }
        }
      }
      
      if (editingTestId) {
        await updateDoc(doc(db, 'tests', editingTestId), testData);
        setSysMsg('Cập nhật đề thành công!');
      } else {
        if (!testData.questionsData) testData.questionsData = "[]";
        testData.isCustom = true;
        testData.rubricUrl = "";
        testData.createdAt = new Date().toISOString();
        testData.createdBy = user?.displayName || user?.email || 'Giáo viên';
        await addDoc(collection(db, 'tests'), testData);
        setSysMsg('Tạo đề thành công!');
      }

      // Success
      setTimeout(() => setSysMsg(''), 3000);
      setShowCreateModal(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      setSysError('Lỗi khi lưu đề: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignDate || !assigningTest || !selectedClassId) {
      setSysError("Vui lòng chọn lớp và ngày hạn nộp!");
      setTimeout(()=>setSysError(''), 3000);
      return;
    }
    const cls = schoolClasses.find(c => c.id === selectedClassId);
    if (!cls) return;

    const isMulti = assigningTest.isMultiVariant || (assigningTest.variants && assigningTest.variants.length > 1);
    const codes: string[] = assigningTest.variantCodes || (assigningTest.variants ? assigningTest.variants.map((v: any) => v.code) : []);

    const classStudents = studentsList.filter(s => s.className === cls.name);
    let studentVariantsToSave: { [studentId: string]: string } = {};

    if (isMulti && codes.length > 0) {
      classStudents.forEach((st, idx) => {
        const assignedCode = assignedStudentVariants[st.id] || codes[idx % codes.length];
        studentVariantsToSave[st.id] = assignedCode;
        if (st.email) {
          studentVariantsToSave[st.email] = assignedCode;
        }
      });
    }

    try {
      await addDoc(collection(db, 'assignments'), {
        testId: assigningTest.id,
        testTitle: assigningTest.title,
        testType: assigningTest.type,
        testDuration: assigningTest.durationMinutes,
        grade: cls.grade,
        classId: cls.id,
        className: cls.name,
        assignedDate: new Date().toISOString(),
        dueDate: assignDate,
        assignedBy: user?.uid,
        createdAt: new Date().toISOString(),
        isMultiVariant: !!isMulti,
        variantCodes: codes,
        studentVariants: studentVariantsToSave,
        variants: assigningTest.variants || []
      });
      // Success
      setShowAssignModal(false);
      setAssignDate('');
      setSelectedClassId('');
      setAssignedStudentVariants({});
      setSysMsg(`Đã giao bài tập thành công cho lớp ${cls.name}!${isMulti ? ` (Đã tự động chia ${codes.length} mã đề cho ${classStudents.length} học sinh)` : ''}`);
      setTimeout(() => setSysMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      setSysError("Lỗi khi giao bài tập: " + (err?.message || 'Không thể lưu.'));
    }
  };

  const handleMakeOnlineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!makeOnlineFile || !makeOnlineTest) return;
    
    setIsExtracting(true);
    setSysError('');
    try {
      const fileDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(makeOnlineFile);
      });

      const res = await fetch('/api/extract-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-gemini-api-key': localStorage.getItem('gemini_api_key') || '' },
        body: JSON.stringify({ fileDataUrl, mimeType: makeOnlineFile.type })
      });
      
      if (res.ok) {
        const extracted = await res.json();
        if (Array.isArray(extracted) && extracted.length > 0) {
          const fileUrlToSave = makeOnlineFile.size > 800000 ? makeOnlineTest.fileUrl : fileDataUrl;
          await updateDoc(doc(db, 'tests', makeOnlineTest.id), {
             questionsData: JSON.stringify(extracted),
             type: 'mixed',
             fileUrl: fileUrlToSave || "",
             fileName: makeOnlineFile.name
          });
          setSysMsg('Chuyển đề thi thành dạng online thành công!');
          setShowMakeOnlineModal(false);
          loadData();
          setTimeout(() => setSysMsg(''), 4000);
        } else {
          setSysError('Không tìm thấy câu hỏi nào trong tài liệu.');
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setSysError('Lỗi trích xuất từ máy chủ: ' + (errData.details || errData.error || res.statusText));
      }
    } catch (err: any) {
      setSysError('Lỗi hệ thống: ' + err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  if (loading) return <div>Đang tải đề kiểm tra...</div>;

  
  const getParsedQuestions = (data: string) => {
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  };

  const handleAutoHealQuestionInPreview = async (qId: string, newAns: string) => {
    if (!previewTest) return;
    const currentQuestions = getParsedQuestions(previewTest.questionsData);
    const updated = currentQuestions.map((q: any) => {
      if (q.id === qId) {
        return { ...q, correctAnswer: newAns };
      }
      return q;
    });

    const updatedTest = {
      ...previewTest,
      questions: updated,
      questionsData: JSON.stringify(updated)
    };
    setPreviewTest(updatedTest);
    setTests(prev => prev.map(t => t.id === previewTest.id ? updatedTest : t));

    try {
      await updateDoc(doc(db, 'tests', previewTest.id), {
        questions: updated,
        questionsData: JSON.stringify(updated)
      });
      setSysMsg(`Đã cập nhật đáp án câu hỏi thành "${newAns}" thành công!`);
      setTimeout(() => setSysMsg(''), 4000);
    } catch (err: any) {
      console.error('Error updating question:', err);
      setSysError('Lỗi cập nhật đáp án: ' + err.message);
    }
  };

  const handleReconcileCurrentOnlineTest = async () => {
    if (!previewTest) return;
    const currentQuestions = getParsedQuestions(previewTest.questionsData);
    let changedCount = 0;
    const updated = currentQuestions.map((q: any) => {
      const res = autoReconcileQuestion(q);
      if (res.changed) {
        changedCount++;
        return res.question;
      }
      return q;
    });

    if (changedCount === 0) {
      setSysMsg('Toàn bộ đáp án trong đề thi đã hoàn toàn khớp chính xác với lời giải chi tiết!');
      setTimeout(() => setSysMsg(''), 4000);
      return;
    }

    const updatedTest = {
      ...previewTest,
      questions: updated,
      questionsData: JSON.stringify(updated)
    };
    setPreviewTest(updatedTest);
    setTests(prev => prev.map(t => t.id === previewTest.id ? updatedTest : t));

    try {
      await updateDoc(doc(db, 'tests', previewTest.id), {
        questions: updated,
        questionsData: JSON.stringify(updated)
      });
      setSysMsg(`Đã đối soát và tự động đồng bộ ${changedCount} đáp án khớp chuẩn xác với lời giải chi tiết!`);
      setTimeout(() => setSysMsg(''), 5000);
    } catch (err: any) {
      console.error('Error reconciling online test:', err);
      setSysError('Lỗi khi lưu kết quả đối soát: ' + err.message);
    }
  };

  const grades = [6, 7, 8, 9, 10, 11, 12];
  const filteredTopics = topics.filter(t => t.grade === selectedGrade);
  
  
  
  
  
  const renderTestCard = (t: any) => {
    const isMulti = t.isMultiVariant || (t.variants && t.variants.length > 1);
    const variantCodesList = t.variantCodes || (t.variants ? t.variants.map((v: any) => v.code) : []);

    return (
      <div key={t.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow">
        <div className="mb-3 mt-1">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Tên đề kiểm tra</span>
            {isMulti ? (
              <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-[11px] font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                <Layers size={12} className="text-indigo-600" />
                {variantCodesList.length} mã đề
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-[11px] font-medium px-2 py-0.5 rounded-full border border-gray-200">
                1 mã đề
              </span>
            )}
          </div>
          <div className="font-bold text-gray-800 text-base leading-snug">{t.title}</div>
          {t.originalTestTitle && (
            <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-800 font-medium bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md w-fit">
              <ShieldCheck size={12} className="text-emerald-600 shrink-0" />
              <span>Tạo từ đề gốc: <strong>{t.originalTestTitle}</strong></span>
            </div>
          )}
          
          {/* Variant tags & Quick Matrix */}
          {isMulti ? (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 bg-indigo-50/50 p-2 rounded-lg border border-indigo-100/70">
              <span className="text-[11px] text-indigo-900 font-bold">Mã đề:</span>
              {variantCodesList.map((c: string) => (
                <span key={c} className="text-[10px] font-black bg-white text-indigo-800 px-1.5 py-0.5 rounded border border-indigo-200 shadow-2xs">
                  {c}
                </span>
              ))}
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenVariantManager(t, 'isomorphic')}
                  className="text-[11px] font-bold text-amber-700 hover:text-amber-900 hover:underline flex items-center gap-0.5"
                  title="Tạo thêm mã đề tương tự bằng cách đổi số liệu"
                >
                  <Sparkles size={11} className="text-amber-600" /> + Đổi số liệu
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenVariantManager(t, 'matrix')}
                  className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 hover:underline flex items-center gap-0.5"
                  title="Xem ma trận đáp án các mã đề"
                >
                  <FileCheck size={11} /> Bảng đáp án
                </button>
              </div>
            </div>
          ) : (
            t.questionsData && getParsedQuestions(t.questionsData).length > 0 && (
              <div className="mt-2.5 flex flex-col sm:flex-row gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenVariantManager(t, 'isomorphic')}
                  className="flex-1 text-xs font-bold text-amber-900 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-300/80 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  title="Tạo các mã đề tương tự bằng cách thay đổi số liệu nhưng giữ nguyên cấu trúc đề và dạng câu hỏi"
                >
                  <Sparkles size={13} className="text-amber-600 shrink-0" />
                  <span>Đổi số liệu (Tạo mã đề tương tự)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenVariantManager(t, 'shuffle')}
                  className="text-xs font-medium text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 border border-indigo-100"
                  title="Xáo trộn thứ tự câu hỏi và phương án A, B, C, D"
                >
                  <Shuffle size={12} className="shrink-0" />
                  <span>Đảo câu/đáp án</span>
                </button>
              </div>
            )
          )}
        </div>

        <div className="mb-3">
          <div className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Người ra đề</div>
          <div className="font-medium text-gray-800 text-sm">{t.createdBy || 'Giáo viên'}</div>
        </div>

        <p className="text-xs text-gray-500 flex items-center gap-1 mt-auto pt-2">
          <Clock size={14} /> {t.durationMinutes} phút
        </p>

        {(role === 'admin' || role === 'teacher') && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2">
            {/* Hàng 1: Các nút cũ (Xem, Sửa câu hỏi, Giao bài) */}
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => handlePreview(t)}
                className="flex-1 text-center text-xs font-medium text-gray-700 hover:text-gray-900 bg-gray-100 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                title="Xem đề"
              >
                <Eye size={15} /> Xem
              </button>

              {t.questionsData && getParsedQuestions(t.questionsData).length > 0 && (
                 <button 
                    onClick={(e) => { e.stopPropagation(); openEditQuestions(t); }}
                   className="flex-1 text-center text-xs font-medium text-purple-600 hover:text-purple-700 bg-purple-50 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                   title="Sửa câu hỏi"
                 >
                   <Pencil size={15} /> Sửa
                 </button>
              )}

              {t.type === 'essay' && (
                 <button 
                    onClick={() => {
                     setMakeOnlineTest(t);
                     setMakeOnlineFile(null);
                     setShowMakeOnlineModal(true);
                   }}
                   className="flex-1 text-center text-xs font-medium text-orange-600 hover:text-orange-700 bg-orange-50 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                   title="Tạo đề thi online từ file tải lên"
                 >
                   Thi online
                 </button>
              )}

              <button 
                onClick={() => {
                  setAssigningTest(t);
                  setShowAssignModal(true);
                }}
                className="flex-[2] text-center text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                Giao bài
              </button>
            </div>

            {/* Hàng 2: File và Xóa */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleOpenVariantManager(t, isMulti ? 'matrix' : 'isomorphic')}
                className={`flex-1 text-center text-xs font-bold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                  isMulti 
                    ? 'text-indigo-700 hover:text-indigo-800 bg-indigo-50' 
                    : 'text-amber-800 hover:text-amber-900 bg-amber-50 border border-amber-200'
                }`}
                title={isMulti ? "Quản lý các mã đề & xem bảng đáp án" : "Tạo nhiều mã đề tương tự (Đổi số liệu) hoặc xáo trộn"}
              >
                {isMulti ? <Layers size={14} /> : <Sparkles size={14} className="text-amber-600" />}
                <span>{isMulti ? 'Mã đề' : 'Tạo mã đề'}</span>
              </button>

              {t.fileUrl || t.answerFileUrl ? (
                <a 
                  href={t.fileUrl || t.answerFileUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex-1 text-center text-xs font-medium text-teal-600 hover:text-teal-700 bg-teal-50 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                  title="Tài liệu đính kèm"
                >
                  <FileText size={15} /> Đính kèm
                </a>
              ) : null}

              <button 
                onClick={() => handleEditTest(t)}
                className="flex-1 text-center text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                title="Sửa thông tin đề"
              >
                <Pencil size={15} /> Thông tin
              </button>

              {deletingTestId === t.id ? (
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleDeleteTest(t.id)}
                      className="flex-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold py-1.5 shadow-2xs"
                    >
                      Xác nhận xóa
                    </button>
                    <button 
                      onClick={() => setDeletingTestId(null)}
                      className="flex-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 py-1.5 font-medium"
                    >
                      Hủy
                    </button>
                  </div>
                  {t.originalTestTitle && (
                    <span className="text-[10px] text-emerald-700 font-medium text-center">
                      ✓ Đề gốc "{t.originalTestTitle}" vẫn được giữ nguyên vẹn
                    </span>
                  )}
                </div>
              ) : (
                <button 
                  onClick={() => setDeletingTestId(t.id)}
                  className="flex-1 text-center text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                  title="Xóa đề này"
                >
                  <Trash2 size={15} /> Xóa
                </button>
              )}
            </div>
          </div>
        )}
        {renderTestAssignments(t.id)}
      </div>
    );
  };

  const filteredLessons = lessons.filter(l => l.topicId === selectedTopicId);

  const displayedTests = tests.filter(t => {
    if (selectedGrade && t.grade !== selectedGrade) return false;
    if (selectedTopicId && t.topicId !== selectedTopicId) return false;
    if (selectedLessonId && t.lessonId !== selectedLessonId) return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {sysError && !showCreateModal && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">{sysError}</div>}
      {sysMsg && !showCreateModal && <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl">{sysMsg}</div>}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Bài kiểm tra và thi online</h2>
          <p className="text-sm text-gray-500 mt-1">Quản lý và giao đề trắc nghiệm, tự luận theo khối lớp</p>
        </div>
        {(role === 'admin' || role === 'teacher') && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button 
              type="button"
              onClick={() => openCreateModal('auto', 'mcq_3part')}
              className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2.5 rounded-xl font-semibold shadow-sm shadow-blue-200 transition-all text-sm"
              title="Tạo đề thi tự động bằng AI & Ngân hàng đề: Trắc nghiệm 3 phần, tùy biến, tự luận hoặc tổng hợp"
            >
              <Sparkles size={17} />
              <span>Tạo đề thi tự động</span>
            </button>
            <button 
              type="button"
              onClick={() => openCreateModal('upload', 'mcq_3part')}
              className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-4 py-2.5 rounded-xl font-semibold transition-all text-sm"
              title="Tạo đề online từ tệp đề tải lên (PDF, Word, Ảnh): AI tự động trích xuất thành đề tương tác"
            >
              <Upload size={17} className="text-indigo-600" />
              <span>Tạo đề từ đề tải lên</span>
            </button>
            <button 
              type="button"
              onClick={() => openCreateModal('matrix', 'mcq_3part')}
              className="flex items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2.5 rounded-xl font-semibold transition-all text-sm"
              title="Tạo đề theo ma trận có sẵn: Khung ma trận chuẩn Bộ GD&ĐT hoặc tệp ma trận của trường"
            >
              <LayoutGrid size={17} className="text-emerald-600" />
              <span>Tạo đề theo ma trận</span>
            </button>
          </div>
        )}
      </div>

      {/* Grade Selection */}
      <div className="flex gap-4">
        {grades.map(grade => (
          <button
            key={grade}
            onClick={() => {
              setSelectedGrade(grade);
              setSelectedTopicId('');
              setSelectedLessonId('');
            }}
            className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all border ${
              selectedGrade === grade 
                ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            Khối {grade}
          </button>
        ))}
      </div>

      {/* Filters (show only if a grade is selected) */}
      {selectedGrade && (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Chủ đề / Chương</label>
            <select
              value={selectedTopicId}
              onChange={(e) => {
                setSelectedTopicId(e.target.value);
                setSelectedLessonId('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">-- Tất cả chủ đề --</option>
              {filteredTopics.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Bài học (Tùy chọn)</label>
            <select
              value={selectedLessonId}
              onChange={(e) => setSelectedLessonId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              disabled={!selectedTopicId}
            >
              <option value="">-- Tất cả bài học --</option>
              {filteredLessons.map(l => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Test List organized by Topic with 2 Folders per Topic */}
      {selectedGrade ? (
        <div className="space-y-8">
          {/* Topic filter bar */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Xem nhanh theo chủ đề khối {selectedGrade}:
              </div>
              <span className="text-xs text-gray-400 font-medium">
                {displayedTests.length} đề thi
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedTopicTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedTopicTab === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tất cả chủ đề ({tests.filter(t => t.grade === selectedGrade).length})
              </button>
              {filteredTopics.map(tp => {
                const count = tests.filter(t => t.grade === selectedGrade && t.topicId === tp.id).length;
                return (
                  <button
                    key={tp.id}
                    type="button"
                    onClick={() => setSelectedTopicTab(tp.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      selectedTopicTab === tp.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>{tp.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      selectedTopicTab === tp.id ? 'bg-blue-800 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Render each topic section */}
          {(() => {
            let topicsToDisplay = filteredTopics;
            if (selectedTopicId) {
              topicsToDisplay = filteredTopics.filter(tp => tp.id === selectedTopicId);
            } else if (selectedTopicTab !== 'all') {
              topicsToDisplay = filteredTopics.filter(tp => tp.id === selectedTopicTab);
            }

            const unassignedTests = tests.filter(t => t.grade === selectedGrade && (!t.topicId || !filteredTopics.some(tp => tp.id === t.topicId)));
            const allSections = [...topicsToDisplay];
            if (unassignedTests.length > 0 && (selectedTopicTab === 'all' || selectedTopicTab === 'general') && !selectedTopicId) {
              allSections.push({ id: 'general', name: 'Chủ đề chung / Khác', grade: selectedGrade } as any);
            }

            if (allSections.length === 0) {
              return (
                <div className="py-12 text-center text-gray-400 bg-white rounded-xl border border-gray-100 border-dashed">
                  <p>Không có chủ đề nào phù hợp với bộ lọc.</p>
                </div>
              );
            }

            return allSections.map(topic => {
              const topicTests = tests.filter(t => {
                if (t.grade !== selectedGrade) return false;
                if (selectedLessonId && t.lessonId !== selectedLessonId) return false;
                if (topic.id === 'general') {
                  return !t.topicId || !filteredTopics.some(tp => tp.id === t.topicId);
                }
                return t.topicId === topic.id;
              });

              const singleVariantTests = topicTests.filter(t => !t.isMultiVariant && (!t.variants || t.variants.length <= 1));
              const multiVariantTests = topicTests.filter(t => t.isMultiVariant || (t.variants && t.variants.length > 1));
              const currentFolder = topicFolderTab[topic.id] || 'single';

              return (
                <div key={topic.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                  {/* Topic Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <Folder size={22} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{topic.name}</h3>
                        <p className="text-xs text-gray-500">Khối {selectedGrade} • Tổng cộng {topicTests.length} đề kiểm tra</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setNewGrade(selectedGrade.toString());
                          setNewTopicId(topic.id === 'general' ? '' : topic.id);
                          createTest('mcq', 'mcq_3part');
                        }}
                        className="flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors"
                        title="Tạo đề trắc nghiệm 3 phần cho chủ đề này"
                      >
                        <Sparkles size={14} className="text-blue-600" /> + Đề TN 3 phần
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewGrade(selectedGrade.toString());
                          setNewTopicId(topic.id === 'general' ? '' : topic.id);
                          createTest('mcq', 'mcq_custom');
                        }}
                        className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg transition-colors"
                        title="Tạo đề trắc nghiệm tùy biến (1 hoặc 2 phần) cho chủ đề này"
                      >
                        <List size={14} className="text-indigo-600" /> + Đề TN tùy biến
                      </button>
                    </div>
                  </div>

                  {/* 2 Folders per Topic */}
                  <div className="flex flex-col sm:flex-row gap-3 p-1.5 bg-gray-50 rounded-xl border border-gray-200/60">
                    <button
                      type="button"
                      onClick={() => setTopicFolderTab(prev => ({ ...prev, [topic.id]: 'single' }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs sm:text-sm transition-all ${
                        currentFolder === 'single'
                          ? 'bg-white text-blue-700 shadow-xs border border-blue-100'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                      }`}
                    >
                      <Folder size={17} className={currentFolder === 'single' ? 'text-blue-600' : 'text-gray-400'} />
                      <span>Thư mục: Đề thi có 1 mã đề</span>
                      <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold border border-blue-200">
                        {singleVariantTests.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTopicFolderTab(prev => ({ ...prev, [topic.id]: 'multi' }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs sm:text-sm transition-all ${
                        currentFolder === 'multi'
                          ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                      }`}
                    >
                      <FolderCheck size={17} className={currentFolder === 'multi' ? 'text-indigo-600' : 'text-gray-400'} />
                      <span>Thư mục: Đề thi có nhiều mã đề</span>
                      <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-extrabold border border-indigo-200">
                        {multiVariantTests.length}
                      </span>
                    </button>
                  </div>

                  {/* Folder Content */}
                  <div>
                    {currentFolder === 'single' ? (
                      singleVariantTests.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {singleVariantTests.map(t => renderTestCard(t))}
                        </div>
                      ) : (
                        <div className="py-10 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                          <Folder className="mx-auto text-gray-300 mb-2" size={32} />
                          <p className="text-sm font-medium text-gray-600">Thư mục "Đề thi có 1 mã đề" của chủ đề này hiện đang trống.</p>
                        </div>
                      )
                    ) : (
                      multiVariantTests.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {multiVariantTests.map(t => renderTestCard(t))}
                        </div>
                      ) : (
                        <div className="py-10 text-center bg-indigo-50/30 rounded-xl border border-dashed border-indigo-200 p-6">
                          <FolderCheck className="mx-auto text-indigo-300 mb-2" size={32} />
                          <p className="text-sm font-bold text-indigo-900 mb-1">Thư mục "Đề thi có nhiều mã đề" chưa có đề nào.</p>
                          <p className="text-xs text-gray-500 max-w-md mx-auto">
                            Bạn có thể chuyển sang thư mục "Đề thi có 1 mã đề" và bấm nút <strong>"Tạo nhiều mã đề"</strong> trên bất kỳ đề nào để xáo trộn câu hỏi và phương án!
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      ) : (
        <div className="py-12 text-center text-gray-400 bg-white rounded-xl border border-gray-100 border-dashed">
          <p>Vui lòng chọn một khối lớp ở trên để xem kho đề kiểm tra theo từng chủ đề.</p>
        </div>
      )}

            {/* Assign Test Modal */}
      {showAssignModal && assigningTest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowAssignModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-gray-50 shrink-0 rounded-t-2xl">
              <button type="button" onClick={() => setShowAssignModal(false)} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 font-medium bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm transition-colors">
                <ArrowLeft size={18} /> Trở lại
              </button>
              <h2 className="text-lg font-bold text-gray-800 flex-1 truncate">Giao bài tập</h2>
            </div>
            <form onSubmit={handleAssignTest} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đề kiểm tra</label>
                <div className="px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-800 font-medium">
                  {assigningTest.title}
                </div>
              </div>

              {/* Classes already assigned this test */}
              {(() => {
                const assignedToClasses = assignmentsList.filter(a => a.testId === assigningTest.id);
                if (assignedToClasses.length === 0) return null;
                return (
                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <Users size={14} className="text-amber-700" />
                        Đã giao cho {assignedToClasses.length} lớp:
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                      {assignedToClasses.map(a => {
                        const classStudentsCount = studentsList.filter(s => s.className === a.className).length;
                        const submittedCount = submissionsList.filter(s => s.assignmentId === a.id).length;
                        return (
                          <div key={a.id} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-amber-200 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-bold text-blue-700">Lớp {a.className}</span>
                              <span className="text-[11px] text-gray-500">({submittedCount}/{classStudentsCount} đã nộp)</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setAssignmentToCancel(a)}
                              className="text-rose-600 hover:text-rose-800 font-bold hover:underline flex items-center gap-1 py-0.5 px-1.5 rounded hover:bg-rose-50 transition-colors"
                              title="Hủy giao cho lớp này"
                            >
                              <Trash2 size={12} /> Hủy giao
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giao thêm cho lớp</label>
                <select 
                  required
                  value={selectedClassId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedClassId(val);
                    if (val && assigningTest && (assigningTest.isMultiVariant || (assigningTest.variants && assigningTest.variants.length > 1))) {
                      const cls = schoolClasses.find(c => c.id === val);
                      const students = studentsList.filter(s => s.className === cls?.name);
                      const codes = assigningTest.variantCodes || assigningTest.variants?.map((v: any) => v.code) || ['101', '102', '103', '104'];
                      const newDist: { [studentId: string]: string } = {};
                      students.forEach((st, idx) => {
                        newDist[st.id] = codes[idx % codes.length];
                      });
                      setAssignedStudentVariants(newDist);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">-- Chọn lớp --</option>
                  {(role === 'admin' 
                    ? schoolClasses.filter(c => Number(c.grade) === Number(assigningTest.grade || selectedGrade))
                    : schoolClasses.filter(c => Number(c.grade) === Number(assigningTest.grade || selectedGrade) && assignedClasses.includes(c.id))
                  ).map(c => (
                    <option key={c.id} value={c.id}>Khối {c.grade} - Lớp {c.name}</option>
                  ))}
                </select>
                {(role === 'admin' 
                    ? schoolClasses.filter(c => Number(c.grade) === Number(assigningTest.grade || selectedGrade))
                    : schoolClasses.filter(c => Number(c.grade) === Number(assigningTest.grade || selectedGrade) && assignedClasses.includes(c.id))
                  ).length === 0 && <p className="text-red-500 text-xs mt-1">Bạn chưa được phân quyền phụ trách lớp nào ở khối này.</p>}
              </div>

              {/* Multi-variant auto-assignment preview */}
              {assigningTest && (assigningTest.isMultiVariant || (assigningTest.variants && assigningTest.variants.length > 1)) && (
                <div className="bg-indigo-50/70 border border-indigo-100 p-3.5 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <Shuffle size={14} className="text-indigo-600" />
                      Phân chia mã đề tự động ({assigningTest.variantCodes?.length || assigningTest.variants?.length} mã: {(assigningTest.variantCodes || assigningTest.variants?.map((v: any) => v.code) || []).join(', ')})
                    </span>
                    <span className="text-[11px] bg-indigo-200 text-indigo-800 font-bold px-2 py-0.5 rounded-md">
                      Tự động gán
                    </span>
                  </div>
                  <p className="text-xs text-indigo-700">
                    Hệ thống tự động gán luân phiên các mã đề khác nhau cho từng học sinh để đảm bảo tính khách quan khi làm bài.
                  </p>
                  {selectedClassId ? (
                    <div className="max-h-40 overflow-y-auto border border-indigo-200/60 rounded-lg bg-white p-2 divide-y divide-gray-100 text-xs">
                      {(() => {
                        const cls = schoolClasses.find(c => c.id === selectedClassId);
                        const students = studentsList.filter(s => s.className === cls?.name);
                        const codes = assigningTest.variantCodes || assigningTest.variants?.map((v: any) => v.code) || ['101', '102'];
                        if (students.length === 0) {
                          return <div className="text-gray-400 py-1 text-center">Chưa có học sinh nào trong lớp {cls?.name}</div>;
                        }
                        return students.map((st, sIdx) => {
                          const code = assignedStudentVariants[st.id] || codes[sIdx % codes.length];
                          return (
                            <div key={st.id} className="py-1.5 flex items-center justify-between px-1">
                              <span className="font-medium text-gray-800">{sIdx + 1}. {st.name}</span>
                              <div className="flex items-center gap-1">
                                <span className="text-gray-400 text-[11px]">Mã đề:</span>
                                <select
                                  value={code}
                                  onChange={(e) => {
                                    setAssignedStudentVariants(prev => ({
                                      ...prev,
                                      [st.id]: e.target.value
                                    }));
                                  }}
                                  className="text-xs font-bold bg-indigo-50 border border-indigo-200 rounded px-1.5 py-0.5 text-indigo-800 outline-none"
                                >
                                  {codes.map((c: string) => (
                                    <option key={c} value={c}>{c}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Vui lòng chọn lớp ở trên để xem danh sách phân chia mã đề cho từng học sinh.</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hạn nộp bài</label>
                <input
                  type="datetime-local"
                  required
                  value={assignDate}
                  onChange={(e) => setAssignDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                >
                  Giao bài ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Make Online Modal */}
      {showMakeOnlineModal && makeOnlineTest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowMakeOnlineModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-gray-50 shrink-0 rounded-t-2xl">
              <button type="button" onClick={() => setShowMakeOnlineModal(false)} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 font-medium bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm transition-colors">
                <ArrowLeft size={18} /> Trở lại
              </button>
              <h2 className="text-lg font-bold text-gray-800 flex-1 truncate">Tạo đề thi online</h2>
            </div>
            <form onSubmit={handleMakeOnlineSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-sm text-orange-800">
                <p className="font-bold mb-1">Chuyển đổi: {makeOnlineTest.title}</p>
                <p>Hệ thống sẽ sử dụng AI để tự động đọc tài liệu của bạn và trích xuất thành các câu hỏi trắc nghiệm/điền khuyết tương tác trực tuyến.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tải lên tài liệu đề bài (PDF/Ảnh)</label>
                <input
                  type="file"
                  required
                  accept=".pdf,image/*"
                  onChange={(e) => setMakeOnlineFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer border border-gray-200 rounded-lg"
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setShowMakeOnlineModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                  disabled={isExtracting}
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={!makeOnlineFile || isExtracting}
                  className="px-4 py-2 text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {isExtracting ? 'Đang trích xuất...' : 'Bắt đầu chuyển đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Online Test Modal */}
      <CreateOnlineTestModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTest}
        editingTestId={editingTestId}
        onlineCreationMode={onlineCreationMode}
        setOnlineCreationMode={setOnlineCreationMode}
        examFormat={examFormat}
        setExamFormat={setExamFormat}
        autoGenType={autoGenType}
        setAutoGenType={setAutoGenType}
        matrixSourceType={matrixSourceType}
        setMatrixSourceType={setMatrixSourceType}
        matrixConfig={matrixConfig}
        setMatrixConfig={setMatrixConfig}
        selectedMatrixPreset={selectedMatrixPreset}
        setSelectedMatrixPreset={setSelectedMatrixPreset}
        matrixFile={matrixFile}
        setMatrixFile={setMatrixFile}
        activePresetId={activePresetId}
        setActivePresetId={setActivePresetId}
        formatPresets={formatPresets}
        matrixPresets={matrixPresets}
        applyPreset={applyPreset}
        applyMatrixPreset={applyMatrixPreset}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
        newDuration={newDuration}
        setNewDuration={setNewDuration}
        newGrade={newGrade}
        setNewGrade={setNewGrade}
        newTopicId={newTopicId}
        setNewTopicId={setNewTopicId}
        topics={topics}
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
        mcqCount={mcqCount}
        setMcqCount={setMcqCount}
        essayCount={essayCount}
        setEssayCount={setEssayCount}
        newFile={newFile}
        setNewFile={setNewFile}
        newAnswerFile={newAnswerFile}
        setNewAnswerFile={setNewAnswerFile}
        splitAnswers={splitAnswers}
        setSplitAnswers={setSplitAnswers}
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
        isSaving={isSaving}
        sysError={sysError}
        setSysError={setSysError}
        sysMsg={sysMsg}
      />

      {/* Comprehensive Edit Questions Modal with Visuals & Reference Content */}
      {editingQuestionsTest && (
        <EditQuestionsModal
          testTitle={editingQuestionsTest.title || 'Đề kiểm tra'}
          initialQuestions={editingQuestionsList}
          isOpen={Boolean(editingQuestionsTest)}
          onClose={() => setEditingQuestionsTest(null)}
          onSave={handleSaveQuestionsFromModal}
          isSaving={isSavingQuestions}
        />
      )}

      {/* Cancel Assignment Modal */}
      {assignmentToCancel && (
        <CancelAssignmentModal
          isOpen={Boolean(assignmentToCancel)}
          onClose={() => setAssignmentToCancel(null)}
          assignment={assignmentToCancel}
          submissionCount={submissionsList.filter(s => s.assignmentId === assignmentToCancel.id).length}
          studentCount={studentsList.filter(s => s.className === assignmentToCancel.className).length}
          onConfirmCancel={handleCancelAssignment}
          isProcessing={isCancellingAssignment}
        />
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewTest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 sm:p-5 border-b border-gray-100 bg-gray-50 shrink-0">
              <div className="min-w-0 flex-1 pr-3">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 truncate">
                  <FileText size={20} className="text-blue-500 shrink-0" />
                  Xem trước: {previewTest.title}
                </h2>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                {previewTest.questionsData && getParsedQuestions(previewTest.questionsData).length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={handleReconcileCurrentOnlineTest}
                      className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      title="Tự động kiểm tra và đồng bộ đáp án khớp với kết luận của lời giải chi tiết"
                    >
                      <ShieldCheck size={14} className="text-amber-600" />
                      <span>Đối soát đáp án</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPreviewModal(false);
                        openEditQuestions(previewTest);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Pencil size={13} /> Chỉnh sửa đề này
                    </button>
                  </>
                )}
                <button onClick={() => setShowPreviewModal(false)} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg cursor-pointer">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto bg-gray-50/50 flex-1">
              <div className="mb-6 flex gap-4 text-sm text-gray-600 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <span className="flex items-center gap-1 font-medium bg-gray-100 px-3 py-1 rounded-lg">
                  <Clock size={16} /> Thời gian: {previewTest.durationMinutes} phút
                </span>
                <span className="flex items-center gap-1 font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-lg">
                  Loại đề: {previewTest.type === 'mcq' ? 'Trắc nghiệm' : previewTest.type === 'mixed' ? 'Tổng hợp (Thi Online)' : 'Tự luận'}
                </span>
              </div>
              
              {(previewTest.type === 'essay' || previewTest.type === 'mixed') && previewTest.fileUrl && previewTest.fileUrl.startsWith('data:image/') && (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 text-center overflow-auto">
                  <h4 className="font-bold text-gray-700 mb-4 text-left">Hình ảnh tài liệu gốc (Xem hình vẽ/đồ thị):</h4>
                  <img src={previewTest.fileUrl} alt="Bản gốc" className="max-w-full h-auto mx-auto rounded-lg border border-gray-100" />
                </div>
              )}

              {(previewTest.type === 'mcq' || previewTest.type === 'mixed') && (
                <div className="space-y-6">
                  {getParsedQuestions(previewTest.questionsData).length > 0 ? (
                    getParsedQuestions(previewTest.questionsData).map((q: any, idx: number) => (
                      <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-bold text-gray-800 leading-snug flex-1">
                            Câu {idx + 1}: <span className="font-normal"><MathText content={q.question} /></span>
                          </p>
                          {q.type === 'tf' && (
                            <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full shrink-0">
                              Đúng / Sai
                            </span>
                          )}
                          {q.type === 'short' && (
                            <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full shrink-0">
                              Trả lời ngắn
                            </span>
                          )}
                          {(!q.type || q.type === 'mcq') && (
                            <span className="text-[11px] font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full shrink-0">
                              Nhiều lựa chọn
                            </span>
                          )}
                        </div>

                        {/* Visual Figure / Diagram / Table / Image */}
                        <QuestionVisualRenderer
                          figureType={q.figureType}
                          figureSvg={q.figureSvg}
                          figureTable={q.figureTable}
                          figureDescription={q.figureDescription}
                          imageUrl={q.imageUrl}
                        />

                        {/* Pedagogical Reference & Teacher Variation Guide */}
                        {q.reference && (
                          <QuestionReferenceBadge reference={q.reference} />
                        )}

                        {q.type === 'tf' ? (
                          <div className="space-y-2 pl-4">
                            {q.options?.map((opt: string, optIdx: number) => {
                              const label = ['a', 'b', 'c', 'd'][optIdx] || String.fromCharCode(97 + optIdx);
                              const cleanText = stripOptionPrefix(opt);
                              return (
                                <div key={optIdx} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 border border-gray-200">
                                  <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center text-xs font-bold shrink-0">
                                    {label})
                                  </div>
                                  <span className="text-gray-700 flex-1"><MathText content={cleanText} /></span>
                                </div>
                              );
                            })}
                            {q.correctAnswer && (
                              <div className="mt-2 text-xs font-semibold text-amber-900 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                                Đáp án đúng: {q.correctAnswer}
                              </div>
                            )}
                          </div>
                        ) : q.type === 'short' ? (
                          <div className="pl-4 space-y-2">
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-900">
                              Đáp số / Kết quả: <span className="font-bold underline">{q.correctAnswer || '(Chưa có)'}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 pl-4">
                            {q.options?.map((opt: string, optIdx: number) => (
                              <div key={optIdx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
                                <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                                  {String.fromCharCode(65 + optIdx)}
                                </div>
                                <span className="text-gray-700 flex-1"><MathText content={stripOptionPrefix(opt)} /></span>
                              </div>
                            ))}
                            {q.correctAnswer && (
                              <div className="mt-2 text-xs font-semibold text-blue-900 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                                Đáp án: {q.correctAnswer}
                              </div>
                            )}
                          </div>
                        )}

                        {q.explanation && (
                          <div className="mt-3 pl-4 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                            <span className="font-bold text-gray-700">Lời giải chi tiết:</span> <MathText content={q.explanation} />
                          </div>
                        )}

                        {(() => {
                          const discrepancy = detectAnswerDiscrepancy(q);
                          if (!discrepancy.hasDiscrepancy) return null;
                          return (
                            <div className="mt-2 ml-4 p-2.5 bg-amber-50 border border-amber-300 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-1.5 text-amber-950">
                                <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                                <span><strong>Phát hiện lệch đáp án và lời giải:</strong> {discrepancy.reason}</span>
                              </div>
                              {discrepancy.suggestedAnswer && (
                                <button
                                  type="button"
                                  onClick={() => handleAutoHealQuestionInPreview(q.id, discrepancy.suggestedAnswer!)}
                                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-xs transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                                >
                                  <Check size={12} />
                                  <span>Đồng bộ thành "{discrepancy.suggestedAnswer}"</span>
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
                      Chưa có câu hỏi trắc nghiệm nào trong đề này.
                    </div>
                  )}
                </div>
              )}

              {previewTest.type === 'essay' && (
                <div className="space-y-4">
                  {previewTest.fileUrl ? (
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <h4 className="font-bold text-gray-700 mb-2">Tệp đính kèm:</h4>
                      <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-100 rounded-lg text-orange-800">
                        <div className="flex items-center gap-3">
                          <FileText size={24} />
                          <span className="font-medium">{previewTest.fileName || "Tài liệu đính kèm"}</span>
                        </div>
                        {previewTest.fileUrl.startsWith('data:') ? (
                           <div className="flex gap-2">
                             <a 
                               href={previewTest.fileUrl} 
                               download={previewTest.fileName || "tai_lieu"}
                               className="px-4 py-2 bg-white border border-orange-200 text-orange-700 hover:bg-orange-100 text-sm font-medium rounded-lg transition-colors flex items-center justify-center"
                             >
                               Tải xuống
                             </a>
                             <button 
                               onClick={() => handleOpenPreview(previewTest.fileUrl)}
                               className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center"
                             >
                               Mở xem
                             </button>
                           </div>
                        ) : (
                          <span className="text-sm italic text-gray-500">Chỉ có tên file (bản nháp)</span>
                        )}
                      </div>
                    </div>
                  ) : previewTest.essayPrompt ? (
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <h4 className="font-bold text-gray-700 mb-2">Đề bài:</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{previewTest.essayPrompt}</p>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
                      Nội dung đề tự luận đang trống.
                    </div>
                  )}
                  
                  {previewTest.rubricUrl && (
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mt-4">
                      <h4 className="font-bold text-gray-700 mb-2">Hướng dẫn chấm / Bareme:</h4>
                      <p className="text-gray-600 text-sm whitespace-pre-wrap">{previewTest.rubricUrl}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-white shrink-0 flex justify-end">
              <button 
                onClick={() => setShowPreviewModal(false)}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Variant Management & Answer Key Matrix Modal */}
      {showVariantModal && variantModalTest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowVariantModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-linear-to-r from-amber-50/70 via-indigo-50/50 to-blue-50/40 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-sm">
                  <Sparkles size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    Quản lý & Sinh mã đề kiểm tra
                    <span className="text-xs bg-amber-100 text-amber-900 font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200">
                      {variantModalTest.title}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500">
                    Tạo mã đề tương tự (đổi số liệu toán học), xáo trộn câu hỏi và đối chiếu bảng đáp án
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowVariantModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50/80 px-6 gap-2 pt-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setVariantModalTab('isomorphic')}
                className={`py-2.5 px-4 text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 border-t-2 shrink-0 ${
                  variantModalTab === 'isomorphic'
                    ? 'bg-white text-amber-800 border-amber-500 shadow-2xs font-extrabold'
                    : 'text-gray-600 hover:text-gray-900 border-transparent hover:bg-gray-100/70'
                }`}
              >
                <Sparkles size={14} className={variantModalTab === 'isomorphic' ? 'text-amber-600' : 'text-gray-400'} />
                ✨ Đổi số liệu (Mã đề tương tự)
              </button>

              <button
                type="button"
                onClick={() => setVariantModalTab('shuffle')}
                className={`py-2.5 px-4 text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 border-t-2 shrink-0 ${
                  variantModalTab === 'shuffle'
                    ? 'bg-white text-indigo-800 border-indigo-500 shadow-2xs font-extrabold'
                    : 'text-gray-600 hover:text-gray-900 border-transparent hover:bg-gray-100/70'
                }`}
              >
                <Shuffle size={14} className={variantModalTab === 'shuffle' ? 'text-indigo-600' : 'text-gray-400'} />
                🔀 Đảo câu hỏi & đáp án
              </button>

              {variantModalTest.variants && variantModalTest.variants.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setVariantModalTab('matrix')}
                    className={`py-2.5 px-4 text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 border-t-2 shrink-0 ${
                      variantModalTab === 'matrix'
                        ? 'bg-white text-blue-800 border-blue-500 shadow-2xs font-extrabold'
                        : 'text-gray-600 hover:text-gray-900 border-transparent hover:bg-gray-100/70'
                    }`}
                  >
                    <FileCheck size={14} className={variantModalTab === 'matrix' ? 'text-blue-600' : 'text-gray-400'} />
                    📊 Bảng ma trận đáp án ({variantModalTest.variants.length} mã)
                  </button>

                  <button
                    type="button"
                    onClick={() => setVariantModalTab('compare')}
                    className={`py-2.5 px-4 text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 border-t-2 shrink-0 ${
                      variantModalTab === 'compare'
                        ? 'bg-white text-emerald-800 border-emerald-500 shadow-2xs font-extrabold'
                        : 'text-gray-600 hover:text-gray-900 border-transparent hover:bg-gray-100/70'
                    }`}
                  >
                    <Eye size={14} className={variantModalTab === 'compare' ? 'text-emerald-600' : 'text-gray-400'} />
                    🔍 So sánh câu hỏi các mã đề
                  </button>
                </>
              )}
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* TAB 1: ISOMORPHIC VARIANT GENERATION (ĐỔI SỐ LIỆU) */}
              {variantModalTab === 'isomorphic' && (
                <div className="space-y-5">
                  <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                          Tạo nhiều mã đề tương tự bằng cách thay đổi số liệu
                        </h4>
                        <p className="text-xs text-amber-900/80 mt-1 leading-relaxed">
                          Hệ thống AI sẽ giữ nguyên 100% cấu trúc ma trận, các dạng toán và kiểu câu hỏi, đồng thời tự động thay đổi các số liệu toán học (hệ số, thông số, độ dài, tọa độ...) để học sinh không thể chép bài nhau. Toàn bộ đáp án đúng và lời giải chi tiết sẽ được tự động giải và tính toán lại chính xác.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
                      <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-2xs flex flex-col gap-1">
                        <span className="font-bold text-amber-900 flex items-center gap-1">
                          <CheckCircle size={13} className="text-amber-600" /> Giữ nguyên cấu trúc đề
                        </span>
                        <span className="text-gray-600">
                          Thứ tự dạng bài, mức độ nhận biết - thông hiểu - vận dụng hoàn toàn tương đồng.
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-2xs flex flex-col gap-1">
                        <span className="font-bold text-amber-900 flex items-center gap-1">
                          <Sparkles size={13} className="text-amber-600" /> Đổi số liệu thông minh
                        </span>
                        <span className="text-gray-600">
                          Số liệu thay đổi hợp lý, kết quả toán học đẹp, chuẩn mực sư phạm.
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-2xs flex flex-col gap-1">
                        <span className="font-bold text-amber-900 flex items-center gap-1">
                          <FileCheck size={13} className="text-amber-600" /> Tự giải lại đáp án
                        </span>
                        <span className="text-gray-600">
                          Tự động tính lại đáp án đúng, phương án gây nhiễu và lời giải từng bước.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bảo lưu đề gốc */}
                  {(!variantModalTest.isMultiVariant && (!variantModalTest.variants || variantModalTest.variants.length <= 1)) && (
                    <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex items-start gap-3 shadow-2xs">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldCheck size={18} />
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <div className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                          Bảo lưu nguyên vẹn đề gốc trong thư mục "Đề thi 1 mã đề"
                        </div>
                        <p className="text-xs text-emerald-900 leading-relaxed">
                          Hệ thống sẽ tạo một bản sao đề thi nhiều mã đề độc lập trong thư mục <strong>"Đề thi nhiều mã đề"</strong>. Đề gốc hiện tại (<strong>{variantModalTest.title}</strong>) sẽ vẫn được lưu an toàn tuyệt đối. Sau này nếu bạn xóa đề nhiều mã đề, đề gốc vẫn còn nguyên vẹn.
                        </p>
                        <div className="pt-1.5">
                          <label className="block text-xs font-bold text-emerald-950 mb-1">
                            Tên bài kiểm tra nhiều mã đề mới:
                          </label>
                          <input
                            type="text"
                            value={newMultiVariantTitle}
                            onChange={(e) => setNewMultiVariantTitle(e.target.value)}
                            placeholder={`${variantModalTest.title} (Nhiều mã đề)`}
                            disabled={isGeneratingIsomorphic}
                            className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Input Configuration */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                      <div>
                        <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Cấu hình danh sách mã đề</span>
                        <p className="text-xs text-gray-500">Mã đầu tiên sẽ giữ nguyên làm đề gốc, các mã sau sẽ được sinh số liệu mới tương tự</p>
                      </div>
                      <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full border border-gray-200">
                        Đề gốc có {getParsedQuestions(variantModalTest.questionsData).length} câu hỏi
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Nhập các mã đề cần sinh (cách nhau bằng dấu phẩy):
                      </label>
                      <div className="flex flex-wrap sm:flex-nowrap gap-2">
                        <input
                          type="text"
                          value={customVariantCodes}
                          onChange={(e) => setCustomVariantCodes(e.target.value)}
                          disabled={isGeneratingIsomorphic}
                          placeholder="101, 102, 103, 104"
                          className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-amber-950 outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setCustomVariantCodes('101, 102, 103, 104')}
                          disabled={isGeneratingIsomorphic}
                          className="px-3 py-2 text-xs font-bold bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 text-amber-900 whitespace-nowrap"
                        >
                          4 mã (101-104)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomVariantCodes('201, 202, 203, 204, 205, 206')}
                          disabled={isGeneratingIsomorphic}
                          className="px-3 py-2 text-xs font-bold bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 text-amber-900 whitespace-nowrap"
                        >
                          6 mã (201-206)
                        </button>
                      </div>
                    </div>

                    {/* Progress Indicator */}
                    {isGeneratingIsomorphic && (
                      <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-xl space-y-2.5 animate-pulse">
                        <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                          <span className="flex items-center gap-2">
                            <Sparkles size={15} className="animate-spin text-amber-600" />
                            {isomorphicProgressText || 'Đang dùng AI đổi số liệu toán học...'}
                          </span>
                          <span>{isomorphicStep}/{isomorphicTotal} mã đề</span>
                        </div>
                        <div className="w-full bg-amber-200/70 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-amber-600 h-full transition-all duration-500 rounded-full"
                            style={{ width: `${isomorphicTotal > 0 ? (isomorphicStep / isomorphicTotal) * 100 : 20}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-amber-800/80 italic text-center">
                          Vui lòng giữ nguyên màn hình, AI đang giải toán và tính toán lại đáp án chi tiết cho từng câu hỏi...
                        </p>
                      </div>
                    )}

                    {/* Error Banner */}
                    {isomorphicError && (
                      <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between gap-2">
                        <span>{isomorphicError}</span>
                        <button 
                          type="button" 
                          onClick={() => setIsomorphicError('')}
                          className="font-bold underline text-red-800 hover:text-red-950"
                        >
                          Đóng
                        </button>
                      </div>
                    )}

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleGenerateIsomorphicVariants}
                        disabled={isGeneratingIsomorphic}
                        className="py-2.5 px-6 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Sparkles size={16} />
                        {isGeneratingIsomorphic ? 'Đang tạo mã đề đổi số liệu...' : 'Bắt đầu tạo mã đề đổi số liệu (AI)'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SHUFFLE GENERATOR (ĐẢO THỨ TỰ & PHƯƠNG ÁN) */}
              {variantModalTab === 'shuffle' && (
                <div className="space-y-4">
                  <div className="bg-indigo-50/70 border border-indigo-200/70 rounded-2xl p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Shuffle size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-indigo-950">
                          Xáo trộn thứ tự câu hỏi và phương án A, B, C, D
                        </h4>
                        <p className="text-xs text-indigo-900/80 mt-1 leading-relaxed">
                          Phương thức xáo trộn nhanh giữ nguyên 100% nội dung câu hỏi gốc, chỉ đảo ngẫu nhiên vị trí các câu hỏi và các phương án trả lời để tạo các mã đề khác nhau tức thì.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bảo lưu đề gốc */}
                  {(!variantModalTest.isMultiVariant && (!variantModalTest.variants || variantModalTest.variants.length <= 1)) && (
                    <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex items-start gap-3 shadow-2xs">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldCheck size={18} />
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <div className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                          Bảo lưu nguyên vẹn đề gốc trong thư mục "Đề thi 1 mã đề"
                        </div>
                        <p className="text-xs text-emerald-900 leading-relaxed">
                          Hệ thống sẽ tạo một bản sao đề thi nhiều mã đề độc lập trong thư mục <strong>"Đề thi nhiều mã đề"</strong>. Đề gốc hiện tại (<strong>{variantModalTest.title}</strong>) sẽ vẫn được lưu an toàn tuyệt đối. Sau này nếu bạn xóa đề nhiều mã đề, đề gốc vẫn còn nguyên vẹn.
                        </p>
                        <div className="pt-1.5">
                          <label className="block text-xs font-bold text-emerald-950 mb-1">
                            Tên bài kiểm tra nhiều mã đề mới:
                          </label>
                          <input
                            type="text"
                            value={newMultiVariantTitle}
                            onChange={(e) => setNewMultiVariantTitle(e.target.value)}
                            placeholder={`${variantModalTest.title} (Nhiều mã đề)`}
                            disabled={isSavingVariants}
                            className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-2xs">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Danh sách mã đề cần sinh:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customVariantCodes}
                          onChange={(e) => setCustomVariantCodes(e.target.value)}
                          placeholder="101, 102, 103, 104"
                          className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setCustomVariantCodes('101, 102, 103, 104')}
                          className="px-3 py-2 text-xs font-bold bg-white border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-700"
                        >
                          4 mã
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomVariantCodes('201, 202, 203, 204, 205, 206')}
                          className="px-3 py-2 text-xs font-bold bg-white border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-700"
                        >
                          6 mã
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-5 pt-2 border-t border-gray-100">
                      <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={shuffleQuestions}
                          onChange={(e) => setShuffleQuestions(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded border-gray-300"
                        />
                        <span>Xáo trộn thứ tự câu hỏi</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={shuffleOptions}
                          onChange={(e) => setShuffleOptions(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded border-gray-300"
                        />
                        <span>Xáo trộn phương án A, B, C, D</span>
                      </label>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleGenerateAndSaveVariants}
                        disabled={isSavingVariants}
                        className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                      >
                        <Shuffle size={14} />
                        {isSavingVariants ? 'Đang lưu mã đề...' : 'Tạo & Lưu mã đề xáo trộn'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ANSWER KEY MATRIX */}
              {variantModalTab === 'matrix' && (
                <div className="space-y-4">
                  {variantModalTest.variants && variantModalTest.variants.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                            <FileCheck size={16} className="text-teal-600" />
                            Bảng ma trận đối chiếu đáp án theo từng mã đề ({variantModalTest.variants.length} mã đề)
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Dùng để chấm bài thi giấy, đối soát nhanh hoặc kiểm tra độ phân tán đáp án
                          </p>
                        </div>
                        <span className="text-xs font-bold bg-blue-50 text-blue-800 px-3 py-1 rounded-full border border-blue-200">
                          {Math.max(...variantModalTest.variants.map((v: any) => v.questions?.length || 0))} câu hỏi
                        </span>
                      </div>

                      <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-2xs max-h-[60vh]">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-gray-50 text-gray-700 uppercase font-bold border-b border-gray-200 sticky top-0 z-10">
                            <tr>
                              <th className="px-3 py-3 border-r border-gray-200 text-center w-20 bg-gray-100">Câu #</th>
                              {variantModalTest.variants.map((v: any, vIdx: number) => (
                                <th key={v.code} className="px-4 py-3 text-center border-r border-gray-200 last:border-r-0 bg-indigo-50/70">
                                  <div className="flex flex-col items-center">
                                    <span className="text-indigo-950 font-black text-sm">Mã {v.code}</span>
                                    <span className="text-[10px] text-indigo-700 font-medium lowercase">
                                      {vIdx === 0 ? '(Đề gốc)' : '(Biến thể)'}
                                    </span>
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {Array.from({ length: Math.max(...variantModalTest.variants.map((v: any) => v.questions?.length || 0)) }).map((_, qIdx) => (
                              <tr key={qIdx} className={qIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                                <td className="px-3 py-2 border-r border-gray-200 font-bold text-gray-700 text-center bg-gray-50/50">
                                  Câu {qIdx + 1}
                                </td>
                                {variantModalTest.variants.map((v: any) => {
                                  const q = v.questions?.[qIdx];
                                  let ansLetter = '-';
                                  if (q) {
                                    if (typeof q.correctAnswer === 'number') {
                                      ansLetter = String.fromCharCode(65 + q.correctAnswer);
                                    } else if (typeof q.correctAnswer === 'string') {
                                      const num = parseInt(q.correctAnswer, 10);
                                      if (!isNaN(num)) {
                                        ansLetter = String.fromCharCode(65 + num);
                                      } else {
                                        ansLetter = q.correctAnswer.toUpperCase();
                                      }
                                    }
                                  }

                                  return (
                                    <td key={v.code} className="px-4 py-2 text-center border-r border-gray-200 last:border-r-0 font-black">
                                      <span className="inline-block w-6 h-6 leading-6 rounded-full bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs font-extrabold text-xs">
                                        {ansLetter}
                                      </span>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-gray-500 space-y-3">
                      <p className="font-semibold text-gray-700">Đề này hiện chỉ có 1 mã đề gốc.</p>
                      <p className="text-xs text-gray-500 max-w-md mx-auto">
                        Hãy chuyển qua tab <strong>"✨ Đổi số liệu (Mã đề tương tự)"</strong> hoặc <strong>"🔀 Đảo câu hỏi & đáp án"</strong> ở trên để tạo các mã đề mới.
                      </p>
                      <button
                        type="button"
                        onClick={() => setVariantModalTab('isomorphic')}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5"
                      >
                        <Sparkles size={14} /> Chuyển sang Tạo mã đề đổi số liệu
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: COMPARE QUESTIONS ACROSS VARIANTS */}
              {variantModalTab === 'compare' && (
                <div className="space-y-4">
                  {variantModalTest.variants && variantModalTest.variants.length > 0 ? (
                    <div className="space-y-4">
                      {/* Question selector pills */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Chọn câu hỏi để so sánh số liệu giữa các mã đề:
                          </label>
                          <span className="text-xs text-emerald-800 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            Đang xem Câu {selectedCompareQIndex + 1}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-gray-50 rounded-xl border border-gray-200">
                          {Array.from({ length: Math.max(...variantModalTest.variants.map((v: any) => v.questions?.length || 0)) }).map((_, qIdx) => (
                            <button
                              key={qIdx}
                              type="button"
                              onClick={() => setSelectedCompareQIndex(qIdx)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                selectedCompareQIndex === qIdx
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                              }`}
                            >
                              Câu {qIdx + 1}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Question comparison cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {variantModalTest.variants.map((v: any, vIdx: number) => {
                          const q = v.questions?.[selectedCompareQIndex];
                          if (!q) return null;

                          return (
                            <div key={v.code} className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs flex flex-col h-full">
                              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-sm text-indigo-900 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                                    Mã đề {v.code}
                                  </span>
                                  {vIdx === 0 ? (
                                    <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                      Đề gốc
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded flex items-center gap-1">
                                      <Sparkles size={10} /> Số liệu tương tự
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs font-bold text-gray-500">
                                  {q.points || 1} điểm
                                </span>
                              </div>

                              <div className="text-sm font-semibold text-gray-800 mb-3 leading-relaxed">
                                <span className="font-bold text-blue-600 mr-1.5">Câu {selectedCompareQIndex + 1}:</span>
                                <MathText content={q.question || ''} />
                              </div>

                              {/* Visual Figure or Table */}
                              <QuestionVisualRenderer
                                figureType={q.figureType}
                                figureSvg={q.figureSvg}
                                figureTable={q.figureTable}
                                figureDescription={q.figureDescription}
                                imageUrl={q.imageUrl}
                              />

                              {/* Reference & Variation Guide */}
                              {q.reference && (
                                <div className="mb-3">
                                  <QuestionReferenceBadge reference={q.reference} />
                                </div>
                              )}

                              {Array.isArray(q.options) && q.options.length > 0 && (
                                <div className="space-y-1.5 mb-3">
                                  {q.options.map((opt: string, optIdx: number) => {
                                    const optLetter = String.fromCharCode(65 + optIdx);
                                    const isCorrect = checkMcqAnswer(optLetter, q.correctAnswer, q.options).isCorrect;

                                    return (
                                      <div 
                                        key={optIdx}
                                        className={`p-2 rounded-lg text-xs flex items-start gap-2 border ${
                                          isCorrect
                                            ? 'bg-emerald-50 text-emerald-950 border-emerald-300 font-bold'
                                            : 'bg-gray-50/70 text-gray-700 border-gray-200'
                                        }`}
                                      >
                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px] font-black ${
                                          isCorrect ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-300 text-gray-600'
                                        }`}>
                                          {optLetter}
                                        </span>
                                        <div className="flex-1 pt-0.5">
                                          <MathText content={stripOptionPrefix(opt)} />
                                        </div>
                                        {isCorrect && (
                                          <CheckCircle size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {q.explanation && (
                                <div className="mt-auto pt-2.5 border-t border-gray-100 bg-gray-50/60 p-2.5 rounded-lg text-xs text-gray-700">
                                  <span className="font-bold text-gray-900 block mb-1">Lời giải chi tiết (Mã {v.code}):</span>
                                  <div className="leading-relaxed">
                                    <MathText content={q.explanation || ''} />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-between items-center">
              <span className="text-xs text-gray-500 italic">
                Các mã đề sau khi sinh sẽ tự động được phân bổ cho học sinh khi giáo viên giao bài
              </span>
              <button
                type="button"
                onClick={() => setShowVariantModal(false)}
                className="px-5 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-lg shadow-sm transition-colors"
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
