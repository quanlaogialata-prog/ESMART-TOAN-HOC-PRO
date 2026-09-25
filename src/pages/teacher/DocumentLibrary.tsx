import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, addDoc, updateDoc, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  BookOpen, Plus, FileText, X, ExternalLink, Download, 
  UploadCloud, Trash2, Pencil, AlertTriangle, Sparkles, Loader2,
  CheckCircle2, ArrowRight, Copy, Check, Eye, Edit3,
  Layers, Search, FileCode, RefreshCw, Filter, Printer, HelpCircle,
  FileCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import MathText from '../../components/MathText';
import LessonPrintExportModal from '../../components/teacher/LessonPrintExportModal';
import DocumentEditorWorkspace from '../../components/teacher/DocumentEditorWorkspace';
import { 
  convertTcvn3ToUnicode, 
  formatMathExpressions, 
  repairVietnameseDocument,
  smartFormatLessonLayout,
  autoDetectLessonTitle 
} from '../../lib/vietnameseFont';
import { extractTextFromPdfInBrowser, cleanPdfWhiteSpaces } from '../../lib/pdfProcessingEngine';
import { saveFileToIDB, getFileFromIDB } from '../../lib/idbStorage';
import { ensureAttachmentDataUrl } from '../../lib/fileUtils';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface LessonAttachment {
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
  fileId?: string;
  fileUrl?: string;
}

interface DocumentFormState {
  title: string;
  knowledge: string;
  videoUrl: string;
  attachment: LessonAttachment | null;
}

interface DocumentLibraryProps {
  onNavigateToTests?: (referenceData?: any) => void;
  onNavigateToOfflineTests?: (referenceData?: any) => void;
}

export default function DocumentLibrary({ onNavigateToTests, onNavigateToOfflineTests }: DocumentLibraryProps) {
  const { user } = useAuth();
  const [grade, setGrade] = useState<number>(9);
  const [topics, setTopics] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<any | null>(null);
  const [printingLesson, setPrintingLesson] = useState<any | null>(null);
  
  // Search & Filter
  const [searchDocQuery, setSearchDocQuery] = useState('');
  const [topicSearchQuery, setTopicSearchQuery] = useState('');

  // Alerts
  const [sysError, setSysError] = useState('');
  const [sysMsg, setSysMsg] = useState('');
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);
  const [reExtractingDocId, setReExtractingDocId] = useState<string | null>(null);

  // Topic modals
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<any | null>(null);
  const [topicFormName, setTopicFormName] = useState('');
  const [topicFormSpecial, setTopicFormSpecial] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<any | null>(null);
  const [isDeletingTopic, setIsDeletingTopic] = useState(false);

  // Document (Lesson) modal state
  const [showDocModal, setShowDocModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [docForm, setDocForm] = useState<DocumentFormState>({
    title: '',
    knowledge: '',
    videoUrl: '',
    attachment: null
  });
  const [modalDocError, setModalDocError] = useState('');
  const [isSavingDoc, setIsSavingDoc] = useState(false);
  const [modalTargetTopicId, setModalTargetTopicId] = useState<string>('');
  const [modalNewTopicName, setModalNewTopicName] = useState<string>('');

  // AI Generation & Extraction state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState('');
  const [isFixingLesson, setIsFixingLesson] = useState(false);
  const [copied, setCopied] = useState(false);
  const [modalViewTab, setModalViewTab] = useState<'edit' | 'preview' | 'split'>('edit');
  const [inputMethod, setInputMethod] = useState<'paste' | 'file' | 'studio'>('studio');

  // Delete Document modal state
  const [docToDeleteObj, setDocToDeleteObj] = useState<any | null>(null);
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);

  // Clear / Reset All Data Modal state (Theo yêu cầu: Xóa bỏ toàn bộ nội dung cũ và thiết lập lại)
  const [showResetAllModal, setShowResetAllModal] = useState(false);
  const [isResettingAll, setIsResettingAll] = useState(false);

  // Quick Seed Modal
  const [isSeeding, setIsSeeding] = useState(false);

  // Scroll ref
  const modalBodyScrollRef = useRef<HTMLFormElement>(null);

  const handleKnowledgeChange = (val: string) => {
    const container = modalBodyScrollRef.current;
    const currentScrollTop = container ? container.scrollTop : 0;
    setDocForm(prev => ({ ...prev, knowledge: val }));
    if (container && container.scrollTop !== currentScrollTop) {
      requestAnimationFrame(() => {
        if (container) container.scrollTop = currentScrollTop;
      });
    }
  };

  useEffect(() => {
    loadTopics();
    setSelectedTopicId(null);
    setSelectedLesson(null);
    setLessons([]);
  }, [grade]);

  const loadTopics = async () => {
    try {
      const q = query(collection(db, 'topics'), where('grade', '==', grade));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTopics(data);
      if (data.length > 0 && !selectedTopicId) {
        loadLessons(data[0].id);
      }
    } catch (e: any) {
      console.error(e);
      setSysError('Lỗi tải danh sách chuyên đề: ' + e.message);
      setTimeout(() => setSysError(''), 3000);
    }
  };

  const loadLessons = async (topicId: string) => {
    try {
      setSelectedTopicId(topicId);
      const q = query(collection(db, 'lessons'), where('topicId', '==', topicId));
      const snap = await getDocs(q);
      const lessonData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setLessons(lessonData);
      if (lessonData.length > 0) {
        setSelectedLesson(lessonData[0]);
      } else {
        setSelectedLesson(null);
      }
    } catch (e: any) {
      console.error(e);
      setSysError('Lỗi tải danh sách tài liệu: ' + e.message);
      setTimeout(() => setSysError(''), 3000);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Helper auto extract document when file uploaded
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setModalDocError('');
    const cleanFileName = file.name.replace(/\.[^/.]+$/, "");
    if (!docForm.title.trim()) {
      setDocForm(prev => ({ ...prev, title: cleanFileName }));
    }

    setIsGenerating(true);
    setGeneratingStatus(`Đang đọc tệp "${file.name}"...`);

    // Read TXT
    if (file.name.toLowerCase().endsWith('.txt') || file.type.startsWith('text/')) {
      const textReader = new FileReader();
      textReader.onload = async (re) => {
        const text = re.target?.result as string;
        if (text) {
          const cleanedText = smartFormatLessonLayout(text);
          const fileId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const dataUrl = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
          await saveFileToIDB(fileId, dataUrl).catch(() => {});

          setDocForm(prev => ({
            ...prev,
            knowledge: cleanedText,
            title: prev.title.trim() ? prev.title : cleanFileName,
            attachment: {
              name: file.name,
              size: file.size,
              type: file.type || 'text/plain',
              dataUrl: dataUrl,
              fileId: fileId
            }
          }));
          setIsGenerating(false);
          setGeneratingStatus('');
        }
      };
      textReader.onerror = () => {
        setIsGenerating(false);
        setGeneratingStatus('');
        setModalDocError('Không thể đọc file văn bản.');
      };
      textReader.readAsText(file);
      return;
    }

    // Read PDF / Docx / Images
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const fileId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // Immediate browser cache in IndexedDB
      await saveFileToIDB(fileId, dataUrl).catch(() => {});

      setDocForm(prev => ({
        ...prev,
        title: prev.title.trim() ? prev.title : cleanFileName,
        attachment: {
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          dataUrl: dataUrl,
          fileId: fileId
        }
      }));

      // Server AI extraction for PDF/Word
      try {
        setGeneratingStatus(`Đang trích xuất nội dung và công thức từ "${file.name}"...`);
        const apiKey = localStorage.getItem('gemini_api_key') || localStorage.getItem('custom_gemini_api_key') || '';
        const res = await fetch('/api/extract-document', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { 'x-gemini-api-key': apiKey } : {})
          },
          body: JSON.stringify({
            fileDataUrl: dataUrl,
            mimeType: file.type,
            fileName: file.name,
            title: docForm.title || cleanFileName
          })
        });

        if (res.ok) {
          const resData = await res.json();
          if (resData.content) {
            setDocForm(prev => ({
              ...prev,
              title: prev.title && prev.title !== cleanFileName ? prev.title : (resData.title || prev.title || cleanFileName),
              knowledge: resData.content
            }));
          }
        }
      } catch (err) {
        console.warn("Server extraction error:", err);
      } finally {
        setIsGenerating(false);
        setGeneratingStatus('');
        setInputMethod('studio');
      }
    };
    reader.onerror = () => {
      setIsGenerating(false);
      setGeneratingStatus('');
      setModalDocError('Không thể đọc tệp đã chọn từ thiết bị.');
    };
    reader.readAsDataURL(file);
  };

  // Save Document
  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalDocError('');

    if (!docForm.title.trim()) {
      setModalDocError('Vui lòng nhập tiêu đề tài liệu / tên bài học');
      return;
    }

    setIsSavingDoc(true);

    try {
      // 1. Determine target topic
      let targetTopicId = modalTargetTopicId || selectedTopicId;

      if (!targetTopicId) {
        if (modalNewTopicName.trim()) {
          const newTopicRef = await addDoc(collection(db, 'topics'), {
            name: modalNewTopicName.trim(),
            grade: grade,
            isSpecial: false,
            createdAt: new Date().toISOString()
          });
          targetTopicId = newTopicRef.id;
          const newTopicObj = { id: targetTopicId, name: modalNewTopicName.trim(), grade, isSpecial: false };
          setTopics(prev => [...prev, newTopicObj]);
          setSelectedTopicId(targetTopicId);
        } else if (topics.length > 0) {
          targetTopicId = topics[0].id;
          setSelectedTopicId(targetTopicId);
        } else {
          // Auto-create standard topic for this grade
          const defaultTopicName = `Chuyên đề 1: Tài liệu học tập & Đề thi Khối ${grade}`;
          const newTopicRef = await addDoc(collection(db, 'topics'), {
            name: defaultTopicName,
            grade: grade,
            isSpecial: false,
            createdAt: new Date().toISOString()
          });
          targetTopicId = newTopicRef.id;
          const newTopicObj = { id: targetTopicId, name: defaultTopicName, grade, isSpecial: false };
          setTopics(prev => [...prev, newTopicObj]);
          setSelectedTopicId(targetTopicId);
        }
      }

      // 2. Handle attachment upload (circumvents Firestore 1MB document limit)
      let finalAttachment: any = null;
      if (docForm.attachment) {
        let fileId = docForm.attachment.fileId || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        let fileUrl = docForm.attachment.fileUrl || '';

        // If attachment has dataUrl, store to IDB & server
        if (docForm.attachment.dataUrl) {
          await saveFileToIDB(fileId, docForm.attachment.dataUrl).catch(() => {});

          if (!fileUrl) {
            try {
              const uploadRes = await fetch('/api/upload-document-file', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  fileDataUrl: docForm.attachment.dataUrl,
                  fileName: docForm.attachment.name,
                  mimeType: docForm.attachment.type
                })
              });
              if (uploadRes.ok) {
                const uploadData = await uploadRes.json();
                fileId = uploadData.fileId || fileId;
                fileUrl = uploadData.fileUrl || `/api/document-file/${fileId}`;
              }
            } catch (errUpload) {
              console.warn("Upload to server warning:", errUpload);
            }
          }
        }

        // Only store dataUrl in Firestore if it is very small (< 250KB) to ensure Firestore never exceeds 1MB!
        const isDataUrlSmall = (docForm.attachment.dataUrl?.length || 0) < 250 * 1024;
        finalAttachment = {
          name: docForm.attachment.name,
          size: docForm.attachment.size,
          type: docForm.attachment.type,
          fileId: fileId,
          ...(fileUrl ? { fileUrl } : {}),
          ...(isDataUrlSmall && docForm.attachment.dataUrl ? { dataUrl: docForm.attachment.dataUrl } : {})
        };
      }

      const docData: any = {
        topicId: targetTopicId,
        title: docForm.title.trim(),
        knowledge: docForm.knowledge || '',
        videoUrl: docForm.videoUrl ? docForm.videoUrl.trim() : '',
        grade: grade,
        updatedAt: new Date().toISOString()
      };

      if (finalAttachment) {
        docData.attachment = finalAttachment;
      }

      if (editingLesson) {
        await updateDoc(doc(db, 'lessons', editingLesson.id), docData);
        const updated = { id: editingLesson.id, ...docData };
        setLessons(prev => prev.map(l => l.id === editingLesson.id ? updated : l));
        if (selectedLesson?.id === editingLesson.id) {
          setSelectedLesson(updated);
        }
        setSysMsg(`Đã cập nhật tài liệu "${docForm.title}" thành công!`);
      } else {
        docData.createdAt = new Date().toISOString();
        const docRef = await addDoc(collection(db, 'lessons'), docData);
        const newDocObj = { id: docRef.id, ...docData };
        setLessons(prev => [newDocObj, ...prev]);
        setSelectedLesson(newDocObj);
        setSysMsg(`Đã lưu tài liệu "${docForm.title}" vào thư viện thành công!`);
      }

      setTimeout(() => setSysMsg(''), 4000);
      setShowDocModal(false);
      setEditingLesson(null);
      setModalDocError('');
    } catch (err: any) {
      console.error("Save doc error:", err);
      setModalDocError('Lỗi khi lưu tài liệu: ' + (err?.message || 'Có lỗi xảy ra khi kết nối máy chủ'));
    } finally {
      setIsSavingDoc(false);
    }
  };

  // Delete Document
  const handleConfirmDeleteDoc = async () => {
    if (!docToDeleteObj) return;
    setIsDeletingDoc(true);
    try {
      await deleteDoc(doc(db, 'lessons', docToDeleteObj.id));
      setLessons(prev => prev.filter(l => l.id !== docToDeleteObj.id));
      if (selectedLesson?.id === docToDeleteObj.id) {
        setSelectedLesson(null);
      }
      setSysMsg(`Đã xóa tài liệu "${docToDeleteObj.title}" khỏi thư viện!`);
      setTimeout(() => setSysMsg(''), 3000);
      setDocToDeleteObj(null);
    } catch (err: any) {
      console.error(err);
      setSysError('Lỗi khi xóa tài liệu: ' + err.message);
      setTimeout(() => setSysError(''), 3000);
    } finally {
      setIsDeletingDoc(false);
    }
  };

  // Topic Save
  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicFormName.trim()) {
      setSysError('Vui lòng nhập tên chuyên đề');
      setTimeout(() => setSysError(''), 3000);
      return;
    }

    try {
      if (editingTopic) {
        await updateDoc(doc(db, 'topics', editingTopic.id), {
          name: topicFormName.trim(),
          isSpecial: topicFormSpecial,
          updatedAt: new Date().toISOString()
        });
        setTopics(prev => prev.map(t => t.id === editingTopic.id ? { ...t, name: topicFormName.trim(), isSpecial: topicFormSpecial } : t));
        setSysMsg(`Đã cập nhật chuyên đề "${topicFormName}" thành công!`);
      } else {
        const newTopic = {
          name: topicFormName.trim(),
          grade: grade,
          isSpecial: topicFormSpecial,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const ref = await addDoc(collection(db, 'topics'), newTopic);
        setTopics(prev => [...prev, { id: ref.id, ...newTopic }]);
        setSelectedTopicId(ref.id);
        setLessons([]);
        setSysMsg(`Đã tạo chuyên đề mới "${topicFormName}" thành công!`);
      }
      setTimeout(() => setSysMsg(''), 3000);
      setShowTopicModal(false);
      setEditingTopic(null);
    } catch (err: any) {
      console.error(err);
      setSysError('Lỗi lưu chuyên đề: ' + err.message);
      setTimeout(() => setSysError(''), 3000);
    }
  };

  // Delete Topic
  const handleConfirmDeleteTopic = async () => {
    if (!topicToDelete) return;
    setIsDeletingTopic(true);
    try {
      // Delete all lessons in topic
      const qLessons = query(collection(db, 'lessons'), where('topicId', '==', topicToDelete.id));
      const snap = await getDocs(qLessons);
      const delPromises = snap.docs.map(d => deleteDoc(doc(db, 'lessons', d.id)));
      await Promise.all(delPromises);

      // Delete topic
      await deleteDoc(doc(db, 'topics', topicToDelete.id));
      setTopics(prev => prev.filter(t => t.id !== topicToDelete.id));
      if (selectedTopicId === topicToDelete.id) {
        setSelectedTopicId(null);
        setLessons([]);
        setSelectedLesson(null);
      }
      setSysMsg(`Đã xóa chuyên đề "${topicToDelete.name}" và toàn bộ tài liệu bên trong!`);
      setTimeout(() => setSysMsg(''), 3000);
      setTopicToDelete(null);
    } catch (err: any) {
      console.error(err);
      setSysError('Lỗi xóa chuyên đề: ' + err.message);
      setTimeout(() => setSysError(''), 3000);
    } finally {
      setIsDeletingTopic(false);
    }
  };

  // XÓA TOÀN BỘ NỘI DUNG VÀ THIẾT LẬP LẠI THƯ VIỆN TÀI LIỆU
  const handleResetAllData = async () => {
    setIsResettingAll(true);
    try {
      // 1. Delete all topics
      const topicsSnap = await getDocs(collection(db, 'topics'));
      const topicDel = topicsSnap.docs.map(d => deleteDoc(doc(db, 'topics', d.id)));

      // 2. Delete all lessons
      const lessonsSnap = await getDocs(collection(db, 'lessons'));
      const lessonDel = lessonsSnap.docs.map(d => deleteDoc(doc(db, 'lessons', d.id)));

      await Promise.all([...topicDel, ...lessonDel]);

      setTopics([]);
      setLessons([]);
      setSelectedTopicId(null);
      setSelectedLesson(null);
      setShowResetAllModal(false);
      setSysMsg('Đã xóa toàn bộ nội dung cũ thành công! Thư viện tài liệu đã sẵn sàng để thiết lập mới.');
      setTimeout(() => setSysMsg(''), 5000);
    } catch (err: any) {
      console.error(err);
      setSysError('Lỗi khi xóa dữ liệu cũ: ' + err.message);
      setTimeout(() => setSysError(''), 4000);
    } finally {
      setIsResettingAll(false);
    }
  };

  // Khởi tạo nhanh cấu trúc Chuyên đề mẫu chuẩn môn Toán
  const handleSeedStandardTopics = async () => {
    setIsSeeding(true);
    try {
      const standardTopicsByGrade: Record<number, string[]> = {
        6: [
          'Chuyên đề 1: Số tự nhiên và các phép tính',
          'Chuyên đề 2: Tính chia hết trong tập hợp số tự nhiên',
          'Chuyên đề 3: Số nguyên và các quy tắc tính',
          'Chuyên đề 4: Phân số và số thập phân',
          'Chuyên đề 5: Hình học trực quan và đo lường'
        ],
        7: [
          'Chuyên đề 1: Số hữu tỉ và số thực',
          'Chuyên đề 2: Tỉ lệ thức và dãy tỉ số bằng nhau',
          'Chuyên đề 3: Biểu thức đại số và đa thức một biến',
          'Chuyên đề 4: Góc và đường thẳng song song',
          'Chuyên đề 5: Tam giác bằng nhau và hình học tam giác'
        ],
        8: [
          'Chuyên đề 1: Đa thức nhiều biến và hằng đẳng thức',
          'Chuyên đề 2: Phân thức đại số và phương trình bậc nhất',
          'Chuyên đề 3: Hàm số và đồ thị bậc nhất',
          'Chuyên đề 4: Định lí Thalès và tam giác đồng dạng',
          'Chuyên đề 5: Hình khối trong thực tiễn'
        ],
        9: [
          'Chuyên đề 1: Căn bậc hai, căn bậc ba và rút gọn biểu thức',
          'Chuyên đề 2: Hàm số y = ax² và phương trình bậc hai một ẩn',
          'Chuyên đề 3: Hệ phương trình bậc nhất hai ẩn và ứng dụng',
          'Chuyên đề 4: Hệ thức lượng trong tam giác vuông',
          'Chuyên đề 5: Đường tròn, tiếp tuyến và góc với đường tròn',
          'Chuyên đề 6: Hình trụ, hình nón, hình cầu',
          'Chuyên đề 7: Ôn thi tuyển sinh vào lớp 10 THPT'
        ],
        10: [
          'Chuyên đề 1: Mệnh đề và tập hợp',
          'Chuyên đề 2: Bất phương trình và hệ bất phương trình bậc nhất hai ẩn',
          'Chuyên đề 3: Hàm số bậc hai và đồ thị',
          'Chuyên đề 4: Hệ thức lượng trong tam giác và Vectơ',
          'Chuyên đề 5: Phương pháp tọa độ trong mặt phẳng Oxy',
          'Chuyên đề 6: Thống kê và xác suất cổ điển'
        ],
        11: [
          'Chuyên đề 1: Hàm số lượng giác và phương trình lượng giác',
          'Chuyên đề 2: Dãy số, cấp số cộng và cấp số nhân',
          'Chuyên đề 3: Giới hạn hàm số và hàm số liên tục',
          'Chuyên đề 4: Đạo hàm và ứng dụng tính đạo hàm',
          'Chuyên đề 5: Quan hệ song song và quan hệ vuông góc trong không gian',
          'Chuyên đề 6: Xác suất có điều kiện và công thức xác suất'
        ],
        12: [
          'Chuyên đề 1: Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số',
          'Chuyên đề 2: Hàm số lũy thừa, hàm số mũ và lôgarit',
          'Chuyên đề 3: Nguyên hàm, tích phân và ứng dụng thực tiễn',
          'Chuyên đề 4: Phương pháp tọa độ trong không gian Oxyz',
          'Chuyên đề 5: Số phức và các dạng toán điển hình',
          'Chuyên đề 6: Ôn thi tốt nghiệp THPT & Đánh giá năng lực Quốc gia'
        ]
      };

      const topicsToAdd = standardTopicsByGrade[grade] || [];
      const addPromises = topicsToAdd.map(name => {
        return addDoc(collection(db, 'topics'), {
          name,
          grade,
          isSpecial: name.includes('Ôn thi'),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });

      await Promise.all(addPromises);
      await loadTopics();
      setSysMsg(`Đã tạo ${topicsToAdd.length} chuyên đề mẫu cho Khối ${grade} thành công!`);
      setTimeout(() => setSysMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      setSysError('Lỗi khởi tạo chuyên đề mẫu: ' + err.message);
      setTimeout(() => setSysError(''), 4000);
    } finally {
      setIsSeeding(false);
    }
  };

  // Open Add Document
  const handleOpenAddDoc = () => {
    setModalDocError('');
    setEditingLesson(null);
    setDocForm({
      title: '',
      knowledge: '',
      videoUrl: '',
      attachment: null
    });
    setModalTargetTopicId(selectedTopicId || (topics[0]?.id || ''));
    setModalNewTopicName(topics.length === 0 ? `Chuyên đề 1: Tài liệu học tập & Đề thi Khối ${grade}` : '');
    setInputMethod('studio');
    setShowDocModal(true);
  };

  // Open Edit Document
  const handleOpenEditDoc = (docItem: any) => {
    setModalDocError('');
    setEditingLesson(docItem);
    setDocForm({
      title: docItem.title || '',
      knowledge: docItem.knowledge || '',
      videoUrl: docItem.videoUrl || '',
      attachment: docItem.attachment || null
    });
    setModalTargetTopicId(docItem.topicId || selectedTopicId || (topics[0]?.id || ''));
    setInputMethod('studio');
    setShowDocModal(true);
  };

  // Download attachment helper (Tải tệp gốc đính kèm nguyên bản)
  const handleDownloadAttachment = async (attachment: any, customTitle?: string) => {
    if (!attachment) return;
    try {
      const dataUrl = await ensureAttachmentDataUrl(attachment);
      if (dataUrl) {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = attachment.name || `${customTitle || 'tai_lieu_goc'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setSysMsg(`Đã tải về tệp gốc nguyên bản: ${attachment.name}`);
        setTimeout(() => setSysMsg(''), 4000);
      } else if (attachment.fileUrl) {
        window.open(attachment.fileUrl, '_blank');
      } else {
        alert('Không tìm thấy dữ liệu tệp gốc trên máy chủ.');
      }
    } catch (err: any) {
      console.error('Download error:', err);
      alert('Lỗi tải tệp gốc: ' + (err?.message || 'Có lỗi xảy ra'));
    }
  };

  const handleDirectDownloadOriginal = async (lessonItem: any) => {
    if (!lessonItem?.attachment) return;
    setDownloadingDocId(lessonItem.id);
    try {
      await handleDownloadAttachment(lessonItem.attachment, lessonItem.title);
    } finally {
      setDownloadingDocId(null);
    }
  };

  // Trích xuất lại đầy đủ 100% nội dung & công thức từ tệp gốc (khi cần làm mới học liệu cũ)
  const handleReExtractLesson = async (lessonItem: any) => {
    if (!lessonItem?.attachment) {
      alert('Tài liệu này không có tệp đính kèm để trích xuất lại.');
      return;
    }
    const confirmRe = window.confirm(`Thầy/Cô có muốn trích xuất lại 100% nội dung và bảng biểu, công thức từ tệp gốc "${lessonItem.attachment.name}" không?`);
    if (!confirmRe) return;

    setReExtractingDocId(lessonItem.id);
    try {
      const dataUrl = await ensureAttachmentDataUrl(lessonItem.attachment);
      if (!dataUrl) {
        alert('Không thể đọc dữ liệu tệp đính kèm.');
        return;
      }

      const apiKey = localStorage.getItem('gemini_api_key') || localStorage.getItem('custom_gemini_api_key') || '';
      const res = await fetch('/api/extract-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-gemini-api-key': apiKey } : {})
        },
        body: JSON.stringify({
          fileDataUrl: dataUrl,
          fileName: lessonItem.attachment.name,
          mimeType: lessonItem.attachment.type,
          title: lessonItem.title
        })
      });

      if (res.ok) {
        const resData = await res.json();
        if (resData.content) {
          const lessonRef = doc(db, 'lessons', lessonItem.id);
          await updateDoc(lessonRef, {
            knowledge: resData.content,
            title: resData.title || lessonItem.title,
            updatedAt: new Date().toISOString()
          });

          setLessons(prev => prev.map(l => l.id === lessonItem.id ? {
            ...l,
            knowledge: resData.content,
            title: resData.title || l.title
          } : l));

          if (selectedLesson?.id === lessonItem.id) {
            setSelectedLesson((prev: any) => prev ? {
              ...prev,
              knowledge: resData.content,
              title: resData.title || prev.title
            } : null);
          }

          if (editingLesson?.id === lessonItem.id) {
            setDocForm(prev => ({
              ...prev,
              knowledge: resData.content,
              title: resData.title || prev.title
            }));
          }

          setSysMsg(`Đã trích xuất lại thành công 100% nội dung bài học từ tệp "${lessonItem.attachment.name}"!`);
          setTimeout(() => setSysMsg(''), 5000);
        }
      } else {
        alert('Không thể trích xuất lại nội dung từ máy chủ.');
      }
    } catch (err: any) {
      alert('Lỗi trích xuất lại: ' + (err?.message || 'Có lỗi xảy ra'));
    } finally {
      setReExtractingDocId(null);
    }
  };

  // Trigger Online Test Creation using this Document as Reference
  const handleCreateOnlineTestWithDoc = async (docItem: any) => {
    const curTopic = topics.find(t => t.id === docItem.topicId);
    let fullAttachment = docItem.attachment ? { ...docItem.attachment } : null;
    if (fullAttachment && !fullAttachment.dataUrl) {
      try {
        const resolved = await ensureAttachmentDataUrl(fullAttachment);
        if (resolved) fullAttachment.dataUrl = resolved;
      } catch (e) {
        console.warn('Could not resolve dataUrl for online test:', e);
      }
    }
    const refPayload = {
      docId: docItem.id,
      topicId: docItem.topicId,
      topicName: curTopic?.name || 'Chuyên đề',
      lessonId: docItem.id,
      lessonTitle: docItem.title,
      grade: grade,
      attachment: fullAttachment,
      knowledge: docItem.knowledge
    };

    // Always store in session storage so ManageTests can pick it up
    sessionStorage.setItem('pendingTestReference', JSON.stringify(refPayload));
    window.dispatchEvent(new CustomEvent('switch-dashboard-tab', { detail: { tab: 'tests', refPayload } }));
    setSysMsg(`Đã chọn tài liệu "${docItem.title}" làm tham chiếu. Đang chuyển sang trang Đề thi online...`);
    setTimeout(() => setSysMsg(''), 3000);

    if (onNavigateToTests) {
      onNavigateToTests(refPayload);
    }
  };

  // Trigger Offline Test Creation using this Document as Reference
  const handleCreateOfflineTestWithDoc = async (docItem: any) => {
    const curTopic = topics.find(t => t.id === docItem.topicId);
    let fullAttachment = docItem.attachment ? { ...docItem.attachment } : null;
    if (fullAttachment && !fullAttachment.dataUrl) {
      try {
        const resolved = await ensureAttachmentDataUrl(fullAttachment);
        if (resolved) fullAttachment.dataUrl = resolved;
      } catch (e) {
        console.warn('Could not resolve dataUrl for offline test:', e);
      }
    }
    const refPayload = {
      docId: docItem.id,
      topicId: docItem.topicId,
      topicName: curTopic?.name || 'Chuyên đề',
      lessonId: docItem.id,
      lessonTitle: docItem.title,
      grade: grade,
      attachment: fullAttachment,
      knowledge: docItem.knowledge
    };

    // Always store in session storage so ManageOfflineTests can pick it up
    sessionStorage.setItem('pendingOfflineReference', JSON.stringify(refPayload));
    window.dispatchEvent(new CustomEvent('switch-dashboard-tab', { detail: { tab: 'offline-tests', refPayload } }));
    setSysMsg(`Đã chọn tài liệu "${docItem.title}" làm đề gốc. Đang chuyển sang trang Đề thi offline...`);
    setTimeout(() => setSysMsg(''), 3000);

    if (onNavigateToOfflineTests) {
      onNavigateToOfflineTests(refPayload);
    }
  };

  // Filter topics
  const filteredTopics = topics.filter(t => 
    !topicSearchQuery.trim() || t.name.toLowerCase().includes(topicSearchQuery.toLowerCase())
  );

  // Filter lessons
  const filteredLessons = lessons.filter(l => 
    !searchDocQuery.trim() || 
    l.title.toLowerCase().includes(searchDocQuery.toLowerCase()) || 
    l.attachment?.name?.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
    l.knowledge?.toLowerCase().includes(searchDocQuery.toLowerCase())
  );

  const currentTopic = topics.find(t => t.id === selectedTopicId);

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      
      {/* ============================================================== */}
      {/* 1. TOP HEADER BANNER: THƯ VIỆN TÀI LIỆU THAM CHIẾU            */}
      {/* ============================================================== */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-white/5 backdrop-blur-3xl transform skew-x-12 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md text-white shadow-inner">
                <BookOpen size={24} />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                  THƯ VIỆN TÀI LIỆU THAM CHIẾU
                </h1>
                <p className="text-xs sm:text-sm text-blue-100/90 font-medium">
                  Kho lưu trữ chuyên đề, bài học và tài liệu gốc làm chuẩn đối sánh & tham chiếu khi tạo bài kiểm tra, đề thi
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            {/* Nút Xóa toàn bộ nội dung cũ & Thiết lập lại */}
            <button
              type="button"
              onClick={() => setShowResetAllModal(true)}
              className="px-3.5 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-white border border-red-400/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
              title="Dọn dẹp và xóa bỏ toàn bộ nội dung cũ trong thư viện để thiết lập mới từ đầu"
            >
              <Trash2 size={14} />
              <span>Dọn dẹp & Thiết lập lại</span>
            </button>

            {/* Nút Khởi tạo Chuyên đề chuẩn */}
            <button
              type="button"
              onClick={handleSeedStandardTopics}
              disabled={isSeeding}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-xs disabled:opacity-50"
              title="Khởi tạo nhanh các chuyên đề chuẩn Toán học của Bộ GD&ĐT cho khối này"
            >
              <Sparkles size={14} className="text-amber-300" />
              <span>{isSeeding ? 'Đang tạo...' : 'Tạo chuyên đề mẫu'}</span>
            </button>
          </div>
        </div>

        {/* STATS STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
            <span className="text-[11px] text-blue-200 uppercase font-bold tracking-wider block">Khối lớp hiện tại</span>
            <span className="text-xl font-extrabold text-white">Khối {grade}</span>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
            <span className="text-[11px] text-blue-200 uppercase font-bold tracking-wider block">Tổng số chuyên đề</span>
            <span className="text-xl font-extrabold text-white">{topics.length}</span>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
            <span className="text-[11px] text-blue-200 uppercase font-bold tracking-wider block">Tài liệu đã lưu trữ</span>
            <span className="text-xl font-extrabold text-white">{lessons.length}</span>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
            <span className="text-[11px] text-blue-200 uppercase font-bold tracking-wider block">Tệp gốc đính kèm</span>
            <span className="text-xl font-extrabold text-white">
              {lessons.filter(l => Boolean(l.attachment?.name)).length}
            </span>
          </div>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      {sysError && (
        <div className="p-3.5 bg-red-50 text-red-700 rounded-2xl text-xs font-semibold border border-red-200 flex items-center justify-between shadow-xs">
          <span>{sysError}</span>
          <button onClick={() => setSysError('')} className="text-red-500 hover:text-red-700">✕</button>
        </div>
      )}
      {sysMsg && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-semibold border border-emerald-200 flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            {sysMsg}
          </span>
          <button onClick={() => setSysMsg('')} className="text-emerald-500 hover:text-emerald-700">✕</button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. GRADE SELECTOR BAR (KHỐI 6 -> KHỐI 12)                       */}
      {/* ============================================================== */}
      <div className="bg-white p-2.5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider px-2">Khối lớp:</span>
          {[6, 7, 8, 9, 10, 11, 12].map(g => (
            <button
              key={g}
              type="button"
              onClick={() => setGrade(g)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                grade === g
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-100'
              }`}
            >
              Khối {g}
            </button>
          ))}
        </div>

        <div className="text-xs font-medium text-gray-500 hidden sm:block pr-3">
          Đang xem thư viện tài liệu môn Toán <strong>Khối {grade}</strong>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. MAIN WORKSPACE: TOPICS COLUMN (LEFT) & DOCUMENTS (RIGHT)   */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ------------------------------------------------------------ */}
        {/* LEFT COLUMN: CHUYÊN ĐỀ (TOPICS)                              */}
        {/* ------------------------------------------------------------ */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-blue-600" />
              <h2 className="font-bold text-sm text-gray-900">Chuyên đề Khối {grade}</h2>
              <span className="text-[11px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                {topics.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingTopic(null);
                setTopicFormName('');
                setTopicFormSpecial(false);
                setShowTopicModal(true);
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Thêm</span>
            </button>
          </div>

          {/* Search topic */}
          <div className="p-3 border-b border-gray-100 bg-white">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={topicSearchQuery}
                onChange={(e) => setTopicSearchQuery(e.target.value)}
                placeholder="Tìm tên chuyên đề..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-xl outline-none focus:border-blue-500 bg-gray-50/50"
              />
            </div>
          </div>

          {/* Topic list */}
          <div className="p-2 space-y-1.5 max-h-[560px] overflow-y-auto">
            {topics.length === 0 ? (
              <div className="p-8 text-center text-gray-400 space-y-2">
                <Layers size={32} className="mx-auto text-gray-300" />
                <p className="text-xs font-medium">Chưa có chuyên đề nào cho Khối {grade}</p>
                <button
                  type="button"
                  onClick={handleSeedStandardTopics}
                  className="text-xs font-bold text-blue-600 hover:underline inline-block pt-1"
                >
                  + Khởi tạo chuyên đề chuẩn
                </button>
              </div>
            ) : filteredTopics.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400">
                Không tìm thấy chuyên đề phù hợp
              </div>
            ) : (
              filteredTopics.map((topic) => {
                const isSelected = selectedTopicId === topic.id;
                return (
                  <div
                    key={topic.id}
                    onClick={() => loadLessons(topic.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-400 shadow-2xs'
                        : 'bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50/60'
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-blue-600' : 'bg-gray-300'}`} />
                        <h3 className={`text-xs font-bold truncate ${isSelected ? 'text-blue-950 font-extrabold' : 'text-gray-800'}`}>
                          {topic.name}
                        </h3>
                      </div>
                      {topic.isSpecial && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.2 rounded-full inline-block">
                          ★ Ôn thi trọng tâm
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTopic(topic);
                          setTopicFormName(topic.name);
                          setTopicFormSpecial(Boolean(topic.isSpecial));
                          setShowTopicModal(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100/50 rounded-lg transition-colors"
                        title="Đổi tên chuyên đề"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTopicToDelete(topic);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa chuyên đề"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* RIGHT COLUMN: TÀI LIỆU LƯU TRỮ TRONG CHUYÊN ĐỀ (DOCUMENTS)   */}
        {/* ------------------------------------------------------------ */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                <h2 className="font-bold text-sm text-gray-900">
                  {currentTopic ? currentTopic.name : 'Tài liệu tham chiếu'}
                </h2>
                <span className="text-[11px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                  {lessons.length} tài liệu
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Các tài liệu, bài học, đề bài gốc được lưu trữ trong chuyên đề này
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenAddDoc}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus size={15} />
                <span>Tải lên tài liệu mới</span>
              </button>
            </div>
          </div>

          {/* Search document */}
          <div className="p-3 border-b border-gray-100 bg-white flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchDocQuery}
                onChange={(e) => setSearchDocQuery(e.target.value)}
                placeholder="Tìm kiếm tài liệu, tên file, bài học..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-xl outline-none focus:border-blue-500 bg-gray-50/50"
              />
            </div>
            <span className="text-xs text-gray-400 shrink-0">
              {filteredLessons.length} / {lessons.length} tài liệu
            </span>
          </div>

          {/* Documents list */}
          <div className="p-4 space-y-3.5 min-h-[380px]">
            {!selectedTopicId ? (
              <div className="py-20 text-center text-gray-400 space-y-2">
                <Layers size={40} className="mx-auto text-gray-300" />
                <p className="text-sm font-bold text-gray-600">Vui lòng chọn một chuyên đề ở cột bên trái</p>
                <p className="text-xs text-gray-400">Chọn chuyên đề để xem hoặc tải lên tài liệu tham chiếu</p>
              </div>
            ) : lessons.length === 0 ? (
              <div className="py-16 text-center text-gray-400 space-y-3 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <UploadCloud size={40} className="mx-auto text-blue-400" />
                <h3 className="text-sm font-bold text-gray-700">Chưa có tài liệu nào trong chuyên đề này</h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  Thầy/Cô hãy tải lên tài liệu (PDF, Word, Ảnh) hoặc soạn tóm tắt lý thuyết để lưu vào thư viện tham chiếu.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddDoc}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Tải lên tài liệu đầu tiên</span>
                </button>
              </div>
            ) : filteredLessons.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                Không tìm thấy tài liệu nào khớp với từ khóa "{searchDocQuery}"
              </div>
            ) : (
              filteredLessons.map((item) => {
                const hasAttachment = Boolean(item.attachment?.name);
                const ext = item.attachment?.name?.split('.').pop()?.toLowerCase();
                const isPdf = ext === 'pdf';
                const isWord = ext === 'docx' || ext === 'doc';

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-gray-200 hover:border-blue-400 bg-white hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div>
                      {/* Top status */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                            {isPdf ? (
                              <FileCode size={18} className="text-red-600" />
                            ) : isWord ? (
                              <FileCode size={18} className="text-blue-600" />
                            ) : (
                              <FileText size={18} />
                            )}
                          </span>
                          <div>
                            <h3 className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-colors">
                              {item.title}
                            </h3>
                            <span className="text-[11px] text-gray-400">
                              Cập nhật: {new Date(item.updatedAt || item.createdAt || Date.now()).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </div>

                        {/* File badge */}
                        {hasAttachment && (
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                            isPdf 
                              ? 'bg-red-50 text-red-700 border-red-200' 
                              : (isWord ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-700 border-gray-200')
                          }`}>
                            {item.attachment.name.split('.').pop()?.toUpperCase()} • {formatFileSize(item.attachment.size)}
                          </span>
                        )}
                      </div>

                      {/* Attached File Name */}
                      {hasAttachment && (
                        <div className="flex items-center justify-between gap-2 text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-semibold text-gray-700 truncate">
                              📎 Tệp lưu trữ: {item.attachment.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDownloadAttachment(item.attachment)}
                            className="px-2.5 py-1 bg-white border border-gray-200 hover:bg-gray-50 text-blue-600 font-bold rounded-lg text-[11px] flex items-center gap-1 shrink-0 cursor-pointer"
                            title="Tải tệp này về máy"
                          >
                            <Download size={12} />
                            <span>Tải về</span>
                          </button>
                        </div>
                      )}

                      {/* Content summary */}
                      {item.knowledge && (
                        <div className="mt-2.5 p-3 bg-slate-50/70 rounded-xl border border-slate-100 text-xs text-gray-700 max-h-24 overflow-y-auto leading-relaxed">
                          <MathText content={item.knowledge.substring(0, 200) + (item.knowledge.length > 200 ? '...' : '')} />
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Nút Tạo bài thi Online từ tài liệu này */}
                        <button
                          type="button"
                          onClick={() => handleCreateOnlineTestWithDoc(item)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Tạo bài kiểm tra online có tham chiếu tài liệu này"
                        >
                          <Sparkles size={13} />
                          <span>Tạo thi Online</span>
                        </button>

                        {/* Nút Tạo đề thi Offline từ tài liệu này */}
                        <button
                          type="button"
                          onClick={() => handleCreateOfflineTestWithDoc(item)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Tạo đề thi offline lấy tài liệu này làm đề gốc"
                        >
                          <FileCode size={13} />
                          <span>Tạo thi Offline</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Nút Tải trực tiếp tệp gốc nguyên bản nếu có */}
                        {item.attachment && (
                          <button
                            type="button"
                            onClick={() => handleDirectDownloadOriginal(item)}
                            disabled={downloadingDocId === item.id}
                            className="px-2.5 py-1 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                            title={`Tải tệp gốc ban đầu (${item.attachment.name}) - Giữ nguyên 100% định dạng, phông chữ và công thức`}
                          >
                            {downloadingDocId === item.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <FileCheck size={13} className="text-emerald-600" />
                            )}
                            <span>Tệp gốc ({item.attachment.name.split('.').pop()?.toUpperCase()})</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setPrintingLesson(item)}
                          className="px-2.5 py-1 text-gray-700 hover:text-blue-700 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Xuất file bài học (Tải file Word, Tải PDF chuẩn A4, In trực tiếp hoặc Tải tệp gốc)"
                        >
                          <Printer size={13} className="text-blue-600" />
                          <span>Xuất file / In</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditDoc(item)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Chỉnh sửa tài liệu"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDocToDeleteObj(item)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa tài liệu"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* 4. MODAL THÊM / CHỈNH SỬA TÀI LIỆU TRONG THƯ VIỆN              */}
      {/* ============================================================== */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-base font-black text-gray-900">
                    {editingLesson ? 'Chỉnh sửa tài liệu tham chiếu' : 'Tải lên & Thêm tài liệu mới vào thư viện'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    Chuyên đề: <strong>{currentTopic?.name}</strong> (Khối {grade})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDocModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveDoc} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5" ref={modalBodyScrollRef}>
              {/* Thông báo lỗi bên trong modal */}
              {modalDocError && (
                <div className="p-3.5 bg-red-50 text-red-700 rounded-xl text-xs sm:text-sm border border-red-200 font-medium flex items-center gap-2.5 animate-in fade-in">
                  <AlertTriangle size={18} className="shrink-0 text-red-600" />
                  <span className="flex-1">{modalDocError}</span>
                  <button
                    type="button"
                    onClick={() => setModalDocError('')}
                    className="text-red-400 hover:text-red-700 p-1"
                  >
                    <X size={15} />
                  </button>
                </div>
              )}

              {/* Lựa chọn Khối lớp và Chuyên đề */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200/80">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Khối lớp *
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => {
                      const newG = Number(e.target.value);
                      setGrade(newG);
                    }}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white font-medium outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  >
                    {[6, 7, 8, 9, 10, 11, 12].map(g => (
                      <option key={g} value={g}>Khối {g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Chuyên đề lưu trữ *
                  </label>
                  {topics.length > 0 ? (
                    <select
                      value={modalTargetTopicId || selectedTopicId || (topics[0]?.id || '')}
                      onChange={(e) => setModalTargetTopicId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white font-medium outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    >
                      {topics.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={modalNewTopicName}
                        onChange={(e) => setModalNewTopicName(e.target.value)}
                        placeholder="Nhập tên chuyên đề (vd: Chuyên đề 1...)"
                        className="w-full px-3 py-2 text-xs border border-blue-400 rounded-xl bg-white font-medium outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                      />
                      <p className="text-[10px] text-blue-700 font-medium">Khối này chưa có chuyên đề. Hệ thống sẽ tự tạo khi lưu.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tiêu đề tài liệu */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Tiêu đề tài liệu / Tên bài học *
                </label>
                <input
                  type="text"
                  required
                  value={docForm.title}
                  onChange={(e) => setDocForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ví dụ: Tài liệu chuyên đề Đạo hàm & Khảo sát đồ thị hàm số..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                />
              </div>

              {/* Tải lên tệp tài liệu lưu trữ */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-300 space-y-3 text-center">
                <UploadCloud size={32} className="mx-auto text-blue-500" />
                <div>
                  <h4 className="font-bold text-xs text-gray-800">
                    {docForm.attachment ? `Tệp đã chọn: ${docForm.attachment.name} (${formatFileSize(docForm.attachment.size)})` : 'Tải lên file tài liệu gốc (PDF, Word, Ảnh)'}
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Hệ thống sẽ lưu trữ an toàn và tự động nạp nội dung để tham chiếu khi tạo đề thi
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5 transition-colors">
                    <FileCode size={14} />
                    <span>{docForm.attachment ? 'Chọn tệp khác' : 'Chọn tệp từ máy tính'}</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {docForm.attachment && (
                    <div className="flex items-center gap-2">
                      {editingLesson && editingLesson.attachment && (
                        <button
                          type="button"
                          onClick={() => handleReExtractLesson(editingLesson)}
                          disabled={Boolean(reExtractingDocId)}
                          className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold border border-amber-300 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                          title="Trích xuất lại 100% nội dung và bảng biểu, công thức từ tệp này bằng bộ giải mã mới"
                        >
                          {reExtractingDocId ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Sparkles size={13} className="text-amber-600" />
                          )}
                          <span>Trích xuất lại đầy đủ</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDocForm(prev => ({ ...prev, attachment: null }))}
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold border border-red-200 cursor-pointer"
                      >
                        Gỡ tệp
                      </button>
                    </div>
                  )}
                </div>

                {isGenerating && (
                  <div className="flex items-center justify-center gap-2 text-blue-700 text-xs font-semibold pt-1">
                    <Loader2 size={16} className="animate-spin" />
                    <span>{generatingStatus || 'Đang xử lý tài liệu...'}</span>
                  </div>
                )}
              </div>

              {/* Studio biên tập nội dung / Tóm tắt kiến thức */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-700">
                    Nội dung tóm tắt kiến thức & Công thức toán (KaTeX):
                  </label>
                  <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setModalViewTab('edit')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md cursor-pointer ${modalViewTab === 'edit' ? 'bg-white text-blue-600 shadow-2xs' : 'text-gray-600'}`}
                    >
                      Soạn thảo
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalViewTab('preview')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md cursor-pointer ${modalViewTab === 'preview' ? 'bg-white text-blue-600 shadow-2xs' : 'text-gray-600'}`}
                    >
                      Xem trước KaTeX
                    </button>
                  </div>
                </div>

                {modalViewTab === 'edit' ? (
                  <textarea
                    rows={8}
                    value={docForm.knowledge}
                    onChange={(e) => handleKnowledgeChange(e.target.value)}
                    placeholder="Nhập nội dung tóm tắt bài học, công thức toán học $...$, bài tập mẫu..."
                    className="w-full p-3 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed font-mono resize-y"
                  />
                ) : (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl min-h-[180px] max-h-[300px] overflow-y-auto text-xs leading-relaxed">
                    <MathText content={docForm.knowledge || 'Chưa có nội dung để xem trước.'} />
                  </div>
                )}
              </div>

              {/* Link video tham chiếu */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Đường dẫn video bài giảng tham chiếu (YouTube - tùy chọn)
                </label>
                <input
                  type="url"
                  value={docForm.videoUrl}
                  onChange={(e) => setDocForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  disabled={isSavingDoc}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingDoc}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-2"
                >
                  {isSavingDoc ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Đang lưu vào Thư viện...</span>
                    </>
                  ) : (
                    <>
                      <Check size={15} />
                      <span>{editingLesson ? 'Cập nhật tài liệu' : 'Lưu vào Thư viện'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. MODAL THÊM / SỬA CHUYÊN ĐỀ                                  */}
      {/* ============================================================== */}
      {showTopicModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900">
                {editingTopic ? 'Đổi tên chuyên đề' : `Thêm chuyên đề mới (Khối ${grade})`}
              </h3>
              <button onClick={() => setShowTopicModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleSaveTopic} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tên chuyên đề *</label>
                <input
                  type="text"
                  required
                  value={topicFormName}
                  onChange={(e) => setTopicFormName(e.target.value)}
                  placeholder="Ví dụ: Chuyên đề Đồ thị hàm số & Ứng dụng..."
                  className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="topicSpecial"
                  checked={topicFormSpecial}
                  onChange={(e) => setTopicFormSpecial(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300"
                />
                <label htmlFor="topicSpecial" className="text-xs font-semibold text-gray-700 cursor-pointer">
                  Đánh dấu chuyên đề trọng tâm ôn thi
                </label>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTopicModal(false)}
                  className="px-3.5 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  {editingTopic ? 'Cập nhật' : 'Thêm chuyên đề'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. MODAL XÁC NHẬN XÓA TÀI LIỆU                                */}
      {/* ============================================================== */}
      {docToDeleteObj && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-5 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900">Xóa tài liệu khỏi Thư viện?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Bạn có chắc chắn muốn xóa tài liệu <strong>"{docToDeleteObj.title}"</strong>?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDocToDeleteObj(null)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDoc}
                disabled={isDeletingDoc}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
              >
                {isDeletingDoc ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. MODAL XÁC NHẬN XÓA CHUYÊN ĐỀ                               */}
      {/* ============================================================== */}
      {topicToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-5 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900">Xóa toàn bộ chuyên đề?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Xóa chuyên đề <strong>"{topicToDelete.name}"</strong> sẽ xóa luôn tất cả tài liệu và bài học lưu trữ bên trong!
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTopicToDelete(null)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTopic}
                disabled={isDeletingTopic}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
              >
                {isDeletingTopic ? 'Đang xóa...' : 'Xóa chuyên đề'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. MODAL DỌN DẸP / XÓA TOÀN BỘ NỘI DUNG CŨ VÀ THIẾT LẬP LẠI    */}
      {/* ============================================================== */}
      {showResetAllModal && (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 text-center border border-red-200">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle size={28} />
            </div>
            <div>
              <h3 className="font-black text-base text-gray-900">
                Xóa toàn bộ nội dung & Thiết lập lại Thư viện?
              </h3>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                Theo yêu cầu quản trị, hành động này sẽ <strong>xóa sạch toàn bộ chuyên đề và tài liệu cũ</strong> trong hệ thống để Thầy/Cô thiết lập mới Thư viện tài liệu tham chiếu từ đầu.
              </p>
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-800 text-left">
                ⚠️ Dữ liệu sau khi xóa sẽ không thể phục hồi. Sau khi xóa, Thầy/Cô có thể tạo mới các chuyên đề hoặc bấm "Tạo chuyên đề mẫu" để có sẵn khung chương trình.
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowResetAllModal(false)}
                disabled={isResettingAll}
                className="px-4 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleResetAllData}
                disabled={isResettingAll}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isResettingAll ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Đang dọn dẹp...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    <span>Xác nhận xóa sạch toàn bộ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 9. MODAL IN / XUẤT PDF TÀI LIỆU                               */}
      {/* ============================================================== */}
      {printingLesson && (
        <LessonPrintExportModal
          isOpen={Boolean(printingLesson)}
          lesson={printingLesson}
          topicName={topics.find(t => t.id === printingLesson.topicId)?.name || 'Chuyên đề'}
          grade={grade}
          onClose={() => setPrintingLesson(null)}
        />
      )}

    </div>
  );
}
