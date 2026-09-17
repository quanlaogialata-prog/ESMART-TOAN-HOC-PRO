import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, query, where, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Book, Plus, Video, FileText, X, ExternalLink, PlayCircle, Download, UploadCloud, Trash2, Database } from 'lucide-react';
import { topicsData, lessonsData, testsData } from '../../data/seedData';
import { chapter1Data } from '../../data/chapter1';
// @ts-ignore
import html2pdf from 'html2pdf.js';

export default function TeacherDashboard() {
  const [topics, setTopics] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [grade, setGrade] = useState(9);
  const [selectedLesson, setSelectedLesson] = useState<any | null>(null);
  const [sysError, setSysError] = useState('');
  const [sysMsg, setSysMsg] = useState('');
  const [lessonToDelete, setLessonToDelete] = useState<string | null>(null);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicSpecial, setNewTopicSpecial] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState({ title: '', knowledge: '', videoUrl: '' });
  const [showDeleteDataModal, setShowDeleteDataModal] = useState(false);
  const [deleteDataGrade, setDeleteDataGrade] = useState('9');
  const [isDeletingData, setIsDeletingData] = useState(false);

  useEffect(() => {
    loadTopics();
  }, [grade]);


  const seedSystemData = async () => {
    try {
      for (const t of topicsData) {
        await setDoc(doc(db, 'topics', t.id), t);
      }
      for (const l of lessonsData) {
        await setDoc(doc(db, 'lessons', l.id), l);
      }
      for (const ts of testsData) {
        await setDoc(doc(db, 'tests', ts.id), ts);
      }
      setSysMsg('Đã tạo dữ liệu bài học từ hệ thống thành công!'); setTimeout(() => setSysMsg(''), 3000);
      loadTopics();
    } catch(e: any) {
      setSysError('Lỗi: ' + e.message); setTimeout(() => setSysError(''), 3000);
    }
  };

  const importCustomLessonData = async () => {
    try {
      const topicRef = await addDoc(collection(db, 'topics'), {
        ...chapter1Data.topic,
        createdAt: new Date().toISOString()
      });
      for (const lesson of chapter1Data.lessons) {
        await addDoc(collection(db, 'lessons'), {
          topicId: topicRef.id,
          title: lesson.title,
          knowledge: lesson.knowledge,
          videoUrl: ''
        });
      }
      for (const test of chapter1Data.tests) {
        await addDoc(collection(db, 'tests'), {
          topicId: topicRef.id,
          grade: 9,
          ...test,
          createdAt: new Date().toISOString()
        });
      }
      setSysMsg('Đã nhập dữ liệu thành công!'); setTimeout(() => setSysMsg(''), 3000);
      loadTopics();
    } catch (e: any) {
      setSysError('Lỗi nhập dữ liệu: ' + e.message); setTimeout(() => setSysError(''), 3000);
    }
  };

  const handleDeleteDataByGrade = async () => {
    setIsDeletingData(true);
    setSysMsg(''); setSysError('');
    try {
      const isAll = deleteDataGrade === 'all';
      let topicsSnap;
      if (isAll) {
        topicsSnap = await getDocs(collection(db, 'topics'));
      } else {
        topicsSnap = await getDocs(query(collection(db, 'topics'), where('grade', '==', Number(deleteDataGrade))));
      }
      
      let deletedCount = 0;
      let totalLessons = 0;
      for (const t of topicsSnap.docs) {
        const topicId = t.id;
        await deleteDoc(doc(db, 'topics', topicId));
        deletedCount++;
        const lessonsSnap = await getDocs(query(collection(db, 'lessons'), where('topicId', '==', topicId)));
        for (const l of lessonsSnap.docs) {
          await deleteDoc(doc(db, 'lessons', l.id));
          totalLessons++;
        }
        const testsSnap = await getDocs(query(collection(db, 'tests'), where('topicId', '==', topicId)));
        for (const ts of testsSnap.docs) {
          await deleteDoc(doc(db, 'tests', ts.id));
        }
      }
      if (isAll) {
        const allLessons = await getDocs(collection(db, 'lessons'));
        for (const l of allLessons.docs) await deleteDoc(doc(db, 'lessons', l.id));
        const allTests = await getDocs(collection(db, 'tests'));
        for (const ts of allTests.docs) await deleteDoc(doc(db, 'tests', ts.id));
      }
      setSysMsg(`Thành công! Đã xóa ${deletedCount} chủ đề và ${totalLessons} bài học.`);
      setTimeout(() => setShowDeleteDataModal(false), 2000);
      loadTopics();
    } catch (err: any) {
      console.error("Delete Error:", err);
      setSysError("Lỗi khi xóa: " + err.message);
    } finally {
      setIsDeletingData(false);
    }
  };

  const loadTopics = async () => {
    try {
      const q = query(collection(db, 'topics'), where('grade', '==', grade));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTopics(data);
    } catch (e: any) {
      console.error(e);
      setSysError('Lỗi tải chủ đề: ' + e.message); setTimeout(()=>setSysError(''),3000);
    }
  };

  const loadLessons = async (topicId: string) => {
    try {
      setSelectedTopicId(topicId);
      const q = query(collection(db, 'lessons'), where('topicId', '==', topicId));
      const snap = await getDocs(q);
      setLessons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e: any) {
      console.error(e);
      setSysError('Lỗi tải bài học: ' + e.message); setTimeout(()=>setSysError(''),3000);
    }
  };

  const deleteLesson = async (lessonId: string) => {
    if (lessonToDelete !== lessonId) {
      setLessonToDelete(lessonId);
      setTimeout(() => setLessonToDelete(null), 3000);
      return;
    }
    try {
      // 1. Find all tests associated with this lesson
      const qTests = query(collection(db, 'tests'), where('lessonId', '==', lessonId));
      const testsSnap = await getDocs(qTests);
      
      const deletePromises: Promise<void>[] = [];
      
      for (const tDoc of testsSnap.docs) {
        // 2. For each test, find and delete its assignments
        const qAssign = query(collection(db, 'assignments'), where('testId', '==', tDoc.id));
        const assignSnap = await getDocs(qAssign);
        
        for (const aDoc of assignSnap.docs) {
          // Find all submissions for this assignment
          const qSub = query(collection(db, 'submissions'), where('assignmentId', '==', aDoc.id));
          const subSnap = await getDocs(qSub);
          subSnap.docs.forEach(sDoc => {
            deletePromises.push(deleteDoc(doc(db, 'submissions', sDoc.id)));
          });
          
          deletePromises.push(deleteDoc(doc(db, 'assignments', aDoc.id)));
        }
        
        // 3. Delete the test itself
        deletePromises.push(deleteDoc(doc(db, 'tests', tDoc.id)));
      }
      
      // Execute all test, assignment, and submission deletions
      if (deletePromises.length > 0) {
        await Promise.all(deletePromises);
      }

      // 4. Delete the lesson
      await deleteDoc(doc(db, 'lessons', lessonId));
      setLessons(prev => prev.filter(l => l.id !== lessonId));
      setLessonToDelete(null);
    } catch (err: any) {
      setSysError("Lỗi: " + err.message);
      setTimeout(() => setSysError(''), 3000);
    }
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopicId || !lessonForm.title.trim() || !lessonForm.knowledge.trim()) return;
    
    try {
      const lessonData = {
        title: lessonForm.title,
        knowledge: lessonForm.knowledge,
        videoUrl: lessonForm.videoUrl,
        topicId: selectedTopicId,
        grade,
        updatedAt: new Date().toISOString()
      };

      if (editingLesson) {
        await updateDoc(doc(db, 'lessons', editingLesson.id), lessonData);
        setSysMsg('Cập nhật bài học thành công!');
      } else {
        await addDoc(collection(db, 'lessons'), {
          ...lessonData,
          createdAt: new Date().toISOString()
        });
        setSysMsg('Thêm bài học thành công!');
      }
      
      setTimeout(() => setSysMsg(''), 3000);
      setShowLessonModal(false);
      setEditingLesson(null);
      setLessonForm({ title: '', knowledge: '', videoUrl: '' });
      loadLessons(selectedTopicId);
    } catch (err: any) {
      setSysError("Lỗi: " + err.message);
      setTimeout(() => setSysError(''), 3000);
    }
  };

  const openAddLesson = () => {
    if (!selectedTopicId) {
      setSysError('Vui lòng chọn một chủ đề trước khi thêm bài học!');
      setTimeout(() => setSysError(''), 3000);
      return;
    }
    setEditingLesson(null);
    setLessonForm({ title: '', knowledge: '', videoUrl: '' });
    setShowLessonModal(true);
  };

  const openEditLesson = (lesson: any) => {
    setEditingLesson(lesson);
    setLessonForm({ title: lesson.title, knowledge: lesson.knowledge, videoUrl: lesson.videoUrl || '' });
    setShowLessonModal(true);
  };

  
  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    try {
      await addDoc(collection(db, 'topics'), {
        name: newTopicName,
        grade,
        isSpecial: grade === 9 && newTopicSpecial,
        createdAt: new Date().toISOString()
      });
      setShowTopicModal(false);
      setNewTopicName('');
      setNewTopicSpecial(false);
      loadTopics();
      setSysMsg('Thêm chủ đề thành công!');
      setTimeout(() => setSysMsg(''), 3000);
    } catch(err: any) {
      setSysError("Lỗi: " + err.message);
      setTimeout(() => setSysError(''), 3000);
    }
  };
  
  const downloadPDF = () => {
    if (!selectedLesson) return;
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="padding: 40px; font-family: Arial, sans-serif;">
        <h1 style="color: #1a56db; margin-bottom: 20px;">${selectedLesson.title}</h1>
        <h3 style="color: #374151;">Kiến thức trọng tâm:</h3>
        <p style="color: #4b5563; line-height: 1.6; white-space: pre-wrap;">${selectedLesson.knowledge}</p>
        ${selectedLesson.videoUrl ? `<p style="margin-top: 20px;"><strong>Link Video:</strong> <a href="${selectedLesson.videoUrl}">${selectedLesson.videoUrl}</a></p>` : ''}
      </div>
    `;
    const opt: any = {
      margin:       0.5,
      filename:     `Tai_lieu_${selectedLesson.title.replace(/\s+/g, '_')}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  const createTopic = () => setShowTopicModal(true);

  return (
    <>
   {sysMsg && <div className="max-w-6xl mx-auto mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">{sysMsg}</div>}
   {sysError && <div className="max-w-6xl mx-auto mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{sysError}</div>}
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-4">
      <h2 className="text-xl font-bold text-gray-800">Quản lý Chương trình học</h2>
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setShowDeleteDataModal(true)}
          className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-red-100 transition-colors"
        >
          <Trash2 size={16} /> Xóa dữ liệu
        </button>
        <div className="relative group">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-green-700">
            <Database size={16} /> Tạo dữ liệu
          </button>
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <button onClick={seedSystemData} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 border-b border-gray-50 transition-colors">
              Từ hệ thống
            </button>
            <label className="block w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 cursor-pointer transition-colors">
              <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => {
                if(e.target.files && e.target.files.length > 0) {
                  importCustomLessonData();
                  e.target.value = '';
                }
              }} />
              Nhập file mẫu
            </label>
          </div>
        </div>
      </div>
   </div>
   <div className="max-w-6xl mx-auto flex gap-6 h-[calc(100vh-160px)]">
      {/* Sidebar: Grades & Topics */}
      <div className="w-80 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden shrink-0">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center gap-2">
          <select 
            value={grade} 
            onChange={e => setGrade(Number(e.target.value))}
            className="font-bold text-gray-800 bg-transparent border-none focus:ring-0 p-0 cursor-pointer shrink-0"
          >
            {[6, 7, 8, 9, 10, 11, 12].map(g => (
              <option key={g} value={g}>Lớp {g}</option>
            ))}
          </select>
          
          <div className="flex items-center gap-1">
            
            <button onClick={createTopic} title="Thêm chủ đề" className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-md">
              <Plus size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {topics.map(t => (
            <button 
              key={t.id}
              onClick={() => loadLessons(t.id)}
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium text-sm flex items-center gap-3 transition-colors"
            >
              <Book size={18} className="text-gray-400" />
              <span className="flex-1 truncate">{t.name}</span>
              {t.isSpecial && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">Lên 10</span>}
            </button>
          ))}
          {topics.length === 0 && <div className="p-4 text-center text-sm text-gray-400">Chưa có chủ đề nào</div>}
        </div>
      </div>

      {/* Main Content: Lessons */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">Danh sách Bài học</h2>
          <button 
            onClick={openAddLesson}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={16} /> Thêm bài học
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {lessons.map(l => (
            <div key={l.id} className="border border-gray-100 rounded-xl p-5 hover:border-blue-100 transition-colors">
              <h3 className="font-bold text-gray-800 text-lg mb-2">{l.title}</h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{l.knowledge}</p>
              <div className="flex justify-between items-center">
                <div className="flex gap-3">
                  <button 
                    onClick={() => setSelectedLesson(l)}
                    className="flex items-center gap-1.5 text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100"
                  >
                    <PlayCircle size={16} /> Vào học
                  </button>
                  <button 
                    onClick={() => openEditLesson(l)}
                    className="flex items-center gap-1.5 text-sm font-medium text-green-600 bg-green-50 px-3 py-1.5 rounded-md hover:bg-green-100"
                  >
                    <FileText size={16} /> Sửa nội dung
                  </button>
                </div>
                <button onClick={() => deleteLesson(l.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors" title="Xóa bài học">
                  {lessonToDelete === l.id ? <span className="text-xs font-bold text-red-600">Xóa?</span> : <Trash2 size={18} />}
                </button>
              </div>
            </div>
          ))}
          {lessons.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <Book size={48} className="mb-4 opacity-20" />
              <p>Chọn một chủ đề để xem bài học</p>
            </div>
          )}
        </div>
      </div>

      {/* Lesson Details Modal */}
      {selectedLesson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">{selectedLesson.title}</h2>
              <button 
                onClick={() => setSelectedLesson(null)} 
                className="text-gray-400 hover:text-gray-700 bg-white p-1 rounded-full shadow-sm"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Nội dung trọng tâm</h3>
                <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{selectedLesson.knowledge}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Tài liệu đính kèm</h3>
                <div className="flex flex-col gap-3">
                  {selectedLesson.videoUrl && selectedLesson.videoUrl !== '' && (
                    <a 
                      href={selectedLesson.videoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                    >
                      <div className="bg-red-100 text-red-600 p-3 rounded-lg group-hover:scale-105 transition-transform">
                        <Video size={24} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 group-hover:text-blue-700">Video bài giảng</h4>
                        <p className="text-sm text-gray-500 truncate">{selectedLesson.videoUrl}</p>
                      </div>
                      <ExternalLink size={20} className="text-gray-400 group-hover:text-blue-600" />
                    </a>
                  )}
                  
                  <button 
                    onClick={downloadPDF}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-colors group text-left"
                  >
                    <div className="bg-green-100 text-green-600 p-3 rounded-lg group-hover:scale-105 transition-transform">
                      <Download size={24} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 group-hover:text-green-700">Tài liệu bài học (PDF)</h4>
                      <p className="text-sm text-gray-500">Tải xuống tóm tắt nội dung bài học</p>
                    </div>
                    <Download size={20} className="text-gray-400 group-hover:text-green-600" />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setSelectedLesson(null)}
                className="bg-gray-200 text-gray-800 px-5 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Topic Modal */}
      {showTopicModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Thêm Chủ Đề Mới (Lớp {grade})</h2>
            </div>
            <form onSubmit={handleCreateTopic} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên chủ đề/chuyên đề</label>
                <input 
                  type="text" 
                  required
                  value={newTopicName}
                  onChange={e => setNewTopicName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="VD: Chương 1: Đại số"
                />
              </div>
              {grade === 9 && (
                <div className="flex items-center gap-2 mt-2">
                  <input 
                    type="checkbox" 
                    id="isSpecial"
                    checked={newTopicSpecial}
                    onChange={e => setNewTopicSpecial(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="isSpecial" className="text-sm text-gray-700">Đây là chuyên đề ôn thi vào 10</label>
                </div>
              )}
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowTopicModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Thêm mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add/Edit Lesson Modal */}
      {showLessonModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">
                {editingLesson ? 'Chỉnh sửa bài học' : 'Thêm bài học mới'}
              </h2>
              <button 
                onClick={() => {
                  setShowLessonModal(false);
                  setEditingLesson(null);
                }} 
                className="text-gray-400 hover:text-gray-700 bg-white p-1 rounded-full shadow-sm"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form id="lesson-form" onSubmit={handleSaveLesson} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tên bài học <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    value={lessonForm.title}
                    onChange={e => setLessonForm({...lessonForm, title: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="VD: Bài 1: Phương trình bậc nhất"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nội dung trọng tâm <span className="text-red-500">*</span></label>
                  <textarea 
                    required
                    rows={8}
                    value={lessonForm.knowledge}
                    onChange={e => setLessonForm({...lessonForm, knowledge: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                    placeholder="Nhập nội dung bài học..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Link Video bài giảng</label>
                  <input 
                    type="url" 
                    value={lessonForm.videoUrl}
                    onChange={e => setLessonForm({...lessonForm, videoUrl: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="VD: https://youtube.com/watch?v=..."
                  />
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => {
                  setShowLessonModal(false);
                  setEditingLesson(null);
                }}
                className="bg-gray-200 text-gray-800 px-5 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Hủy
              </button>
              <button 
                form="lesson-form"
                type="submit"
                className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Lưu bài học
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

      {/* Delete Data Modal */}
      {showDeleteDataModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-red-50">
              <h2 className="text-lg font-bold text-red-800">Xóa dữ liệu bài học theo khối</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Chọn khối lớp mà bạn muốn xóa toàn bộ dữ liệu (chủ đề, bài học, bài kiểm tra).</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Khối Lớp</label>
                <select 
                  value={deleteDataGrade}
                  onChange={e => setDeleteDataGrade(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="all">Tất cả các khối (Xóa sạch)</option>
                  <option value="6">Khối 6</option>
                  <option value="7">Khối 7</option>
                  <option value="8">Khối 8</option>
                  <option value="9">Khối 9</option>
                  <option value="10">Khối 10</option>
                  <option value="11">Khối 11</option>
                  <option value="12">Khối 12</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowDeleteDataModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleDeleteDataByGrade}
                  disabled={isDeletingData}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Trash2 size={18} /> {isDeletingData ? 'Đang xóa...' : 'Xác nhận xóa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
