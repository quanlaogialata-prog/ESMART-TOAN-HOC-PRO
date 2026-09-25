import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  X, BookOpen, Search, FileText, CheckCircle2, ChevronRight, 
  Layers, Sparkles, Filter, Download, Eye, AlertCircle, FileCode, Check
} from 'lucide-react';
import MathText from '../MathText';
import { ensureAttachmentDataUrl } from '../../lib/fileUtils';

export interface SelectedDocumentReference {
  docId: string;
  topicId: string;
  topicName: string;
  lessonId: string;
  lessonTitle: string;
  grade: number;
  attachment?: {
    name: string;
    size: number;
    type: string;
    dataUrl?: string;
  } | null;
  knowledge?: string;
  videoUrl?: string;
}

interface DocumentReferenceSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (refData: SelectedDocumentReference) => void;
  initialGrade?: number;
  title?: string;
}

export default function DocumentReferenceSelectorModal({
  isOpen,
  onClose,
  onSelect,
  initialGrade = 9,
  title = "Chọn tài liệu tham chiếu từ Thư viện"
}: DocumentReferenceSelectorModalProps) {
  const [selectedGrade, setSelectedGrade] = useState<number>(initialGrade);
  const [topics, setTopics] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData(selectedGrade);
    }
  }, [isOpen, selectedGrade]);

  const loadData = async (grade: number) => {
    setLoading(true);
    try {
      // 1. Load topics for grade
      const qTopics = query(collection(db, 'topics'), where('grade', '==', grade));
      const topicsSnap = await getDocs(qTopics);
      const topicsList = topicsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTopics(topicsList);

      // 2. Load all lessons for these topics
      const topicIds = topicsList.map(t => t.id);
      if (topicIds.length > 0) {
        // Fetch lessons
        const allLessonsSnap = await getDocs(collection(db, 'lessons'));
        const gradeLessons = allLessonsSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter((l: any) => topicIds.includes(l.topicId) || l.grade === grade);
        setLessons(gradeLessons);
      } else {
        setLessons([]);
      }
    } catch (err) {
      console.error("Error loading library data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Filter lessons
  const filteredLessons = lessons.filter(l => {
    if (selectedTopicId !== 'all' && l.topicId !== selectedTopicId) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = l.title?.toLowerCase().includes(q);
      const matchKnowledge = l.knowledge?.toLowerCase().includes(q);
      const matchFile = l.attachment?.name?.toLowerCase().includes(q);
      const topic = topics.find(t => t.id === l.topicId);
      const matchTopic = topic?.name?.toLowerCase().includes(q);
      return matchTitle || matchKnowledge || matchFile || matchTopic;
    }
    return true;
  });

  const handleSelectLesson = async (lesson: any) => {
    const topic = topics.find(t => t.id === lesson.topicId);
    let fullAttachment = lesson.attachment ? { ...lesson.attachment } : null;
    if (fullAttachment && !fullAttachment.dataUrl) {
      try {
        const resolved = await ensureAttachmentDataUrl(fullAttachment);
        if (resolved) {
          fullAttachment.dataUrl = resolved;
        }
      } catch (e) {
        console.warn('Could not resolve attachment dataUrl:', e);
      }
    }
    const refData: SelectedDocumentReference = {
      docId: lesson.id,
      topicId: lesson.topicId || '',
      topicName: topic ? topic.name : 'Chuyên đề chung',
      lessonId: lesson.id,
      lessonTitle: lesson.title || 'Tài liệu tham chiếu',
      grade: selectedGrade,
      attachment: fullAttachment,
      knowledge: lesson.knowledge || '',
      videoUrl: lesson.videoUrl || ''
    };
    onSelect(refData);
    onClose();
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileBadge = (fileName?: string) => {
    if (!fileName) return null;
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">PDF</span>;
    }
    if (ext === 'docx' || ext === 'doc') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">Word</span>;
    }
    if (['jpg', 'jpeg', 'png'].includes(ext || '')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">Ảnh</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200">Tệp</span>;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">
        
        {/* HEADER */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 via-indigo-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>{title}</span>
                <span className="text-xs px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full font-semibold">
                  Thư viện tài liệu
                </span>
              </h2>
              <p className="text-xs text-gray-500">
                Chọn tài liệu, chuyên đề hoặc bài học đã lưu trữ trong thư viện làm cơ sở tham chiếu và tạo đề thi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTROLS BAR: GRADES & TOPIC FILTER & SEARCH */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/70 space-y-3">
          {/* Grade selection pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-gray-700 mr-1 shrink-0">Khối lớp:</span>
            {[6, 7, 8, 9, 10, 11, 12].map(g => (
              <button
                key={g}
                type="button"
                onClick={() => setSelectedGrade(g)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer ${
                  selectedGrade === g
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                Khối {g}
              </button>
            ))}
          </div>

          {/* Search and Topic dropdown */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tài liệu, bài học, tên tệp hoặc nội dung..."
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="sm:w-64">
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full py-2 px-3 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              >
                <option value="all">-- Tất cả chuyên đề ({topics.length}) --</option>
                {topics.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* BODY: DOCUMENT LIST */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 min-h-[320px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-2">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-medium">Đang tải tài liệu thư viện Khối {selectedGrade}...</p>
            </div>
          ) : filteredLessons.length === 0 ? (
            <div className="text-center py-16 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <BookOpen size={36} className="mx-auto text-gray-300 mb-2" />
              <h4 className="text-sm font-bold text-gray-700">Chưa có tài liệu nào trong Khối {selectedGrade}</h4>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                {searchQuery 
                  ? 'Không tìm thấy tài liệu phù hợp với từ khóa tìm kiếm.' 
                  : 'Chưa có tài liệu nào được lưu trữ cho khối này. Thầy/Cô có thể vào tab "Thư viện tài liệu" để tải lên tài liệu mới.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredLessons.map(lesson => {
                const topic = topics.find(t => t.id === lesson.topicId);
                const hasAttachment = Boolean(lesson.attachment?.name);

                return (
                  <div
                    key={lesson.id}
                    className="p-4 rounded-xl border border-gray-200 hover:border-blue-400 bg-white hover:shadow-md transition-all flex flex-col justify-between group space-y-3"
                  >
                    <div>
                      {/* Topic & Tag header */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md truncate max-w-[200px]">
                          {topic ? topic.name : `Khối ${selectedGrade}`}
                        </span>
                        {hasAttachment && getFileBadge(lesson.attachment?.name)}
                      </div>

                      {/* Title */}
                      <h4 className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {lesson.title || 'Tài liệu không tên'}
                      </h4>

                      {/* Attachment file info */}
                      {hasAttachment && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1.5 bg-gray-50 p-2 rounded-lg border border-gray-100">
                          <FileCode size={14} className="text-blue-600 shrink-0" />
                          <span className="truncate flex-1 font-medium text-gray-700">
                            {lesson.attachment.name}
                          </span>
                          <span className="text-[10px] text-gray-400 shrink-0">
                            ({formatFileSize(lesson.attachment.size)})
                          </span>
                        </div>
                      )}

                      {/* Brief knowledge / summary */}
                      {lesson.knowledge && (
                        <div className="mt-2 text-xs text-gray-600 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <MathText content={lesson.knowledge.substring(0, 150) + (lesson.knowledge.length > 150 ? '...' : '')} />
                        </div>
                      )}
                    </div>

                    {/* Actions footer */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(lesson)}
                        className="text-xs font-semibold text-gray-600 hover:text-blue-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                      >
                        <Eye size={13} />
                        <span>Xem chi tiết</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectLesson(lesson)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Check size={14} />
                        <span>Chọn tham chiếu</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <span>Tìm thấy <strong>{filteredLessons.length}</strong> tài liệu trong thư viện Khối {selectedGrade}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 font-semibold rounded-xl text-gray-700 transition-colors"
          >
            Đóng
          </button>
        </div>

      </div>

      {/* MODAL XEM TRƯỚC TÀI LIỆU CHI TIẾT */}
      {previewDoc && (
        <div className="fixed inset-0 z-[110] bg-black/70 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/50">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                <h3 className="font-bold text-sm text-gray-900 truncate max-w-md">
                  {previewDoc.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
              {previewDoc.attachment?.name && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode size={16} className="text-blue-600" />
                    <div>
                      <p className="font-bold text-gray-900">{previewDoc.attachment.name}</p>
                      <p className="text-[11px] text-gray-500">{formatFileSize(previewDoc.attachment.size)}</p>
                    </div>
                  </div>
                  {previewDoc.attachment.dataUrl && (
                    <a
                      href={previewDoc.attachment.dataUrl}
                      download={previewDoc.attachment.name}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold text-xs flex items-center gap-1 hover:bg-blue-700 transition-colors"
                    >
                      <Download size={13} />
                      <span>Tải về</span>
                    </a>
                  )}
                </div>
              )}

              <div>
                <h4 className="font-bold text-gray-800 mb-2">Tóm tắt kiến thức / Nội dung tham chiếu:</h4>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 leading-relaxed font-sans text-gray-800 max-h-[350px] overflow-y-auto">
                  <MathText content={previewDoc.knowledge || 'Không có nội dung tóm tắt.'} />
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-3.5 py-1.5 bg-white border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-100"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSelectLesson(previewDoc);
                  setPreviewDoc(null);
                }}
                className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 flex items-center gap-1.5"
              >
                <Check size={14} />
                <span>Chọn tài liệu này</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
