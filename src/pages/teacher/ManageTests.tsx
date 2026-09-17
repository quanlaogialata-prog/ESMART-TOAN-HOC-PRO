import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, where, deleteDoc, doc, updateDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { FileText, Plus, Upload, Clock, List, Calendar, X, Trash2, Eye, Pencil, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import MathText from '../../components/MathText';
import html2pdf from 'html2pdf.js';

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

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningTest, setAssigningTest] = useState<any>(null);
  const [assignDate, setAssignDate] = useState('');

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
  const [creatingType, setCreatingType] = useState<'mcq' | 'essay'>('mcq');
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState('45');
  const [newGrade, setNewGrade] = useState('9');
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [deletingTestId, setDeletingTestId] = useState<string | null>(null);
  const [previewTest, setPreviewTest] = useState<any>(null);
  const [editingQuestionsTest, setEditingQuestionsTest] = useState<any>(null);
  const [editingQuestionsList, setEditingQuestionsList] = useState<any[]>([]);

  const openEditQuestions = (test: any) => {
    setEditingQuestionsTest(test);
    try {
      setEditingQuestionsList(JSON.parse(test.questionsData || "[]"));
    } catch {
      setEditingQuestionsList([]);
    }
  };

  const handleImageUploadForQuestion = (e: React.ChangeEvent<HTMLInputElement>, qIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const newList = [...editingQuestionsList];
      newList[qIndex] = { ...newList[qIndex], imageUrl: reader.result as string };
      setEditingQuestionsList(newList);
    };
    reader.readAsDataURL(file);
  };

  const saveEditedQuestions = async () => {
    if (!editingQuestionsTest) return;
    setSysMsg('Đang lưu thay đổi câu hỏi...');
    try {
      await updateDoc(doc(db, 'tests', editingQuestionsTest.id), {
        questionsData: JSON.stringify(editingQuestionsList)
      });
      setSysMsg('Lưu câu hỏi thành công!');
      setEditingQuestionsTest(null);
      loadData();
    } catch (error) {
      console.error(error);
      setSysError('Có lỗi khi lưu câu hỏi.');
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

  const [autoGenType, setAutoGenType] = useState<'mcq' | 'essay' | 'mixed' | 'matrix'>('mcq');
  const [matrixFile, setMatrixFile] = useState<File | null>(null);
  const [mcqCount, setMcqCount] = useState('10');
  const [essayCount, setEssayCount] = useState('2');

  const [showMakeOnlineModal, setShowMakeOnlineModal] = useState(false);
  const [makeOnlineTest, setMakeOnlineTest] = useState<any>(null);
  const [makeOnlineFile, setMakeOnlineFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const createTest = async (type: 'mcq' | 'essay') => {
    setEditingTestId(null);
    setCreatingType(type);
    setNewTitle('');
    setNewDuration('45');
    setNewGrade('9');
    setNewFile(null);
    setAutoGenType('mcq');
    setMcqCount('10');
    setEssayCount('2');
    setShowCreateModal(true);
  };

  const handleEditTest = (test: any) => {
    setEditingTestId(test.id);
    setCreatingType(test.type);
    setNewTitle(test.title);
    setNewDuration(test.durationMinutes.toString());
    setNewGrade(test.grade ? test.grade.toString() : '9');
    setNewFile(null); // Require re-uploading file if they want to change it
    setShowCreateModal(true);
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

  
  
  
  const exportGradebookForAssignment = (a: any) => {
    const classStudents = studentsList.filter(s => s.className === a.className);
    if (classStudents.length === 0) {
      alert('Lớp này chưa có học sinh!');
      return;
    }

    const container = document.createElement('div');
    container.style.padding = '20px';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.color = '#333';
    
    let html = `
      <h2 style="text-align: center; margin-bottom: 20px; font-size: 24px; color: #1f2937;">BẢNG ĐIỂM BÀI KIỂM TRA</h2>
      <div style="margin-bottom: 20px; font-size: 14px;">
        <p><b>Tên bài kiểm tra:</b> ${a.testTitle || 'Không tên'}</p>
        <p><b>Lớp:</b> ${a.className}</p>
        <p><b>Giáo viên:</b> ${user?.displayName || user?.email || 'Giáo viên'}</p>
        <p><b>Giao lúc:</b> ${new Date(a.assignedDate).toLocaleString('vi-VN')}</p>
        <p><b>Hạn nộp:</b> ${a.dueDate ? new Date(a.dueDate).toLocaleString('vi-VN') : 'Không có'}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #e5e7eb; padding: 8px;">STT</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Họ và Tên</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px;">Bắt đầu làm</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px;">Nộp bài</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px;">Thời gian</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px;">Trắc nghiệm</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px;">Tự luận</th>
            <th style="border: 1px solid #e5e7eb; padding: 8px;">Tổng điểm</th>
          </tr>
        </thead>
        <tbody>
    `;

    classStudents.forEach((stu, idx) => {
      const sub = submissionsList.find(s => s.studentId === stu.id && s.assignmentId === a.id);
      
      let startTimeStr = 'Chưa làm';
      let submitTimeStr = 'Chưa nộp';
      let durationStr = '-';
      let scoreStr = 'Chưa nộp';
      let mcqStr = '-';
      let essayStr = '-';

      if (sub && sub.submittedAt) {
        submitTimeStr = new Date(sub.submittedAt).toLocaleString('vi-VN');
        
        if (sub.timeSpent) {
           const durationMins = Math.floor(sub.timeSpent / 60);
           const durationSecs = sub.timeSpent % 60;
           durationStr = `${durationMins}p ${durationSecs}s`;
           
           const startTime = new Date(new Date(sub.submittedAt).getTime() - sub.timeSpent * 1000);
           startTimeStr = startTime.toLocaleString('vi-VN');
        } else {
           startTimeStr = new Date(sub.submittedAt).toLocaleString('vi-VN');
        }

        if (typeof sub.score === 'number') {
          scoreStr = sub.score.toString();
        } else {
          scoreStr = 'Chờ chấm';
        }

        if (sub.mcqMax > 0) {
           mcqStr = `${Number(sub.mcqScore || 0).toFixed(1)}/${sub.mcqMax}`;
        }
        if (sub.essayMax > 0) {
           essayStr = `${Number(sub.essayScore || 0).toFixed(1)}/${sub.essayMax}`;
        }
      }
      
      html += `
        <tr>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${idx + 1}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${stu.displayName || 'Không tên'}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${startTimeStr}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${submitTimeStr}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${durationStr}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${mcqStr}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${essayStr}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center; font-weight: bold; color: #2563eb;">${scoreStr}</td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;
    
    container.innerHTML = html;
    
    const opt = {
      margin:       0.4,
      filename:     `Bang_diem_${a.className}_${Date.now()}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'landscape' }
    };
    
    html2pdf().set(opt).from(container).save();
  };




  const renderTestAssignments = (testId: string) => {
    const tAssigns = assignmentsList.filter(a => a.testId === testId);
    if (tAssigns.length === 0) return null;
    
    return (
      <div className="mt-4 pt-4 border-t border-gray-100 text-sm">
        <h4 className="font-semibold text-gray-700 mb-2">Lịch sử giao bài:</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {tAssigns.map(a => {
            const classStudentsCount = studentsList.filter(s => s.className === a.className).length;
            const submittedCount = submissionsList.filter(s => s.assignmentId === a.id).length;
            return (
              <div key={a.id} className="flex flex-col gap-1 bg-gray-50 p-2 rounded-lg border border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-blue-700">Lớp {a.className}</span>
                  <span className="text-xs font-medium text-gray-600 bg-white px-2 py-0.5 rounded-full border">Đã nộp: {submittedCount}/{classStudentsCount}</span>
                </div>
                <div className="text-xs text-gray-500">
                  <span className="block">Giao lúc: {new Date(a.assignedDate).toLocaleString('vi-VN')}</span>
                  <span className="block text-red-600">Hạn: {new Date(a.dueDate).toLocaleString('vi-VN')}</span>
                </div>
                <button 
                  onClick={() => exportGradebookForAssignment(a)}
                  className="mt-1 w-full text-xs font-semibold bg-green-100 text-green-700 py-1.5 rounded hover:bg-green-200 transition-colors"
                >
                  Xuất PDF bảng điểm lớp {a.className}
                </button>
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
    let targetTopicId = validTopics.length > 0 ? validTopics[0].id : `topic-fake-${gradeNum}`;

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

      
      const testData: any = {
        title: newTitle,
        type: creatingType === 'mcq' ? (autoGenType === 'matrix' ? 'mixed' : autoGenType) : 'essay',
        durationMinutes: parseInt(newDuration, 10),
        topicId: targetTopicId,
        grade: gradeNum
      };
      
      if (creatingType === 'mcq') {
        testData.mcqCount = parseInt(mcqCount, 10) || 0;
        testData.essayCount = parseInt(essayCount, 10) || 0;
        testData.isAutoGenerated = true;
        if (autoGenType === 'matrix' && matrixFile) {
          testData.matrixFileName = matrixFile.name;
        }

        if (!editingTestId) {
          setSysMsg('Đang dùng AI tạo đề tự động... Vui lòng chờ...');
          
          let matrixFileDataUrl = "";
          let mimeType = "";
          if (autoGenType === 'matrix' && matrixFile) {
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
                autoGenType,
                mcqCount: testData.mcqCount,
                essayCount: testData.essayCount,
                matrixFileDataUrl,
                mimeType
              })
            });
            if (res.ok) {
              const generated = await res.json();
              if (Array.isArray(generated) && generated.length > 0) {
                testData.questionsData = JSON.stringify(generated);
              } else {
                setSysError('AI trả về kết quả rỗng. Hãy thử lại với câu lệnh rõ ràng hơn.');
                setIsSaving(false);
                return;
              }
            } else {
              const errData = await res.json().catch(() => ({}));
              setSysError('Lỗi máy chủ khi tạo đề bằng AI: ' + (errData.details || errData.error || res.statusText));
              setIsSaving(false);
              return;
            }
          } catch(e) {
            console.error("Generate error", e);
            setSysError('Lỗi kết nối khi tạo đề bằng AI.');
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
                    setSysError('AI không thể tự động tách được Đề và Đáp án từ file này. Vui lòng bỏ tích chọn tách tự động, hoặc tự tách thành 2 file riêng biệt trên máy của bạn rồi tải lên.');
                    setIsSaving(false);
                    return;
                 }
              } else {
                 const errData = await splitRes.json().catch(() => ({})); setSysError('Lỗi máy chủ khi tách đề: ' + (errData.details || errData.error || splitRes.statusText));
                 setIsSaving(false);
                 return;
              }
           } catch(e) {
              console.error("Split error", e);
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
                setSysError('AI trả về kết quả rỗng. Vui lòng kiểm tra lại tài liệu.');
                setIsSaving(false);
                return;
              }
            } else {
              const errData = await res.json().catch(() => ({}));
              setSysError('Lỗi máy chủ khi trích xuất bằng AI: ' + (errData.details || errData.error || res.statusText));
              setIsSaving(false);
              return;
            }
          } catch(e) {
             console.error("Extraction error", e);
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
        createdAt: new Date().toISOString()
      });
      // Success
      setShowAssignModal(false);
      setAssignDate('');
      setSelectedClassId('');
    } catch (err: any) {
      console.error(err);
      console.error(err);
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

  const grades = [6, 7, 8, 9, 10, 11, 12];
  const filteredTopics = topics.filter(t => t.grade === selectedGrade);
  
  
  
  
  
  const renderTestCard = (t: any) => {
    return (
      <div key={t.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
        <div className="mb-4 mt-2">
          <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Tên đề kiểm tra</div>
          <div className="font-bold text-gray-800 text-lg leading-tight">{t.title}</div>
        </div>
        <div className="mb-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Người ra đề</div>
          <div className="font-medium text-gray-800">{t.createdBy || 'Giáo viên'}</div>
        </div>

        <p className="text-sm text-gray-500 flex items-center gap-1 mt-auto pt-2">
          <Clock size={14} /> {t.durationMinutes} phút
        </p>

        {(role === 'admin' || role === 'teacher') && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
            {/* Hàng 1: Các nút cũ giữ nguyên (Xem, Sửa câu hỏi, Giao bài) */}
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => handlePreview(t)}
                className="flex-1 text-center text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                title="Xem đề"
              >
                <Eye size={16} /> Xem
              </button>

              {t.questionsData && getParsedQuestions(t.questionsData).length > 0 && (
                 <button 
                    onClick={(e) => { e.stopPropagation(); openEditQuestions(t); }}
                   className="flex-1 text-center text-sm font-medium text-purple-600 hover:text-purple-700 bg-purple-50 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                   title="Sửa câu hỏi"
                 >
                   <Pencil size={16} /> Sửa
                 </button>
              )}

              {t.type === 'essay' && (
                 <button 
                    onClick={() => {
                     setMakeOnlineTest(t);
                     setMakeOnlineFile(null);
                     setShowMakeOnlineModal(true);
                   }}
                   className="flex-1 text-center text-sm font-medium text-orange-600 hover:text-orange-700 bg-orange-50 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
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
                className="flex-[2] text-center text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                Giao bài
              </button>
            </div>

            {/* Hàng 2: File và Xóa (chuyển xuống cạnh) */}
            <div className="flex flex-wrap gap-2 mt-1">
              {t.fileUrl || t.answerFileUrl ? (
                <a 
                  href={t.fileUrl || t.answerFileUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex-1 text-center text-sm font-medium text-teal-600 hover:text-teal-700 bg-teal-50 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                  title="Tài liệu đính kèm"
                >
                  <FileText size={16} /> Đính kèm
                </a>
              ) : null}

              <button 
                onClick={() => handleEditTest(t)}
                className="flex-1 text-center text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                title="Sửa thông tin đề"
              >
                <Pencil size={16} /> Thông tin
              </button>

              {deletingTestId === t.id ? (
                <div className="flex-1 flex gap-1">
                  <button 
                    onClick={() => handleDeleteTest(t.id)}
                    className="flex-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-bold"
                  >
                    Xác nhận
                  </button>
                  <button 
                    onClick={() => setDeletingTestId(null)}
                    className="flex-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setDeletingTestId(t.id)}
                  className="flex-1 text-center text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                  title="Xóa đề này"
                >
                  <Trash2 size={16} /> Xóa
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
          <h2 className="text-xl font-bold text-gray-800">Kho đề kiểm tra & Giao bài</h2>
          <p className="text-sm text-gray-500 mt-1">Quản lý và giao đề trắc nghiệm, tự luận theo khối lớp</p>
        </div>
        {(role === 'admin' || role === 'teacher') && (
          <div className="flex gap-3">
            <button 
              onClick={() => createTest('mcq')}
              className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors"
            >
              <List size={18} /> Tạo đề tự động
            </button>
            <button 
              onClick={() => createTest('essay')}
              className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-lg font-medium hover:bg-purple-100 transition-colors"
            >
              <Upload size={18} /> Tải đề lên
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

      {/* Test List */}
      {selectedGrade ? (
                <div className="space-y-8">
          {displayedTests.filter(t => !t.isCustom).length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">Đề mặc định của hệ thống</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedTests.filter(t => !t.isCustom).map(t => renderTestCard(t))}
              </div>
            </div>
          )}

          {displayedTests.filter(t => t.isCustom).length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">Đề tự tạo & tải lên</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedTests.filter(t => t.isCustom).map(t => renderTestCard(t))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-12 text-center text-gray-400 bg-white rounded-xl border border-gray-100 border-dashed">
          <p>Vui lòng chọn một khối lớp ở trên để xem kho đề kiểm tra.</p>
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lớp nhận bài</label>
                <select 
                  required
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
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

      {/* Create Test Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-gray-50 shrink-0 rounded-t-2xl">
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 font-medium bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm transition-colors">
                <ArrowLeft size={18} /> Trở lại
              </button>
              <h2 className="text-lg font-bold text-gray-800 flex-1 truncate">
                {editingTestId ? 'Chỉnh sửa đề kiểm tra' : (creatingType === 'mcq' ? 'Tạo đề tự động' : 'Tải đề lên')}
              </h2>
            </div>
            <form onSubmit={handleCreateTest} className="p-6 space-y-4 overflow-y-auto">
              {sysError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{sysError}</div>}
              {sysMsg && <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm">{sysMsg}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên đề kiểm tra</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="VD: Đề kiểm tra 1 tiết chương 1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian (phút)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Khối lớp</label>
                  <select
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
              </div>

              
              {creatingType === 'mcq' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dạng đề</label>
                    <select
                      value={autoGenType}
                      onChange={(e) => setAutoGenType(e.target.value as any)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="mcq">Trắc nghiệm</option>
                      <option value="essay">Tự luận</option>
                      <option value="mixed">Tổng hợp (Trắc nghiệm & Tự luận)</option>
                      <option value="matrix">Soạn theo ma trận có sẵn</option>
                    </select>
                  </div>
                  
                  <div className="flex gap-4">
                    {(autoGenType === 'mcq' || autoGenType === 'mixed') && (
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Số câu trắc nghiệm</label>
                        <input
                          type="number"
                          min="1"
                          value={mcqCount}
                          onChange={(e) => setMcqCount(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    )}
                    {(autoGenType === 'essay' || autoGenType === 'mixed') && (
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Số câu tự luận</label>
                        <input
                          type="number"
                          min="1"
                          value={essayCount}
                          onChange={(e) => setEssayCount(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    )}
                  </div>
                  
                  {autoGenType === 'matrix' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tải lên ma trận đề thi (Excel, PDF, Word, Ảnh...)</label>
                      <input
                        type="file"
                        onChange={(e) => setMatrixFile(e.target.files ? e.target.files[0] : null)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        accept=".xlsx,.xls,.pdf,.doc,.docx,.png,.jpg,.jpeg"
                        required
                      />
                    </div>
                  )}
                </div>
              )}

              
              {creatingType === 'essay' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tệp ĐỀ BÀI (PDF, Word, Ảnh...)</label>
                    <input
                      type="file"
                      onChange={(e) => setNewFile(e.target.files ? e.target.files[0] : null)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    />
                    <p className="text-xs text-gray-500 mt-1">Chọn tệp đề bài từ máy tính của bạn.</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="splitAnswers"
                      checked={splitAnswers}
                      onChange={(e) => setSplitAnswers(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300"
                    />
                    <label htmlFor="splitAnswers" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Tệp này chứa CẢ ĐỀ VÀ ĐÁP ÁN (Hệ thống tự động tách)
                    </label>
                  </div>

                  {!splitAnswers && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tệp ĐÁP ÁN (Biểu điểm/lời giải) - Không bắt buộc</label>
                      <input
                        type="file"
                        onChange={(e) => setNewAnswerFile(e.target.files ? e.target.files[0] : null)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      />
                      <p className="text-xs text-gray-500 mt-1">Học sinh chỉ thấy file này SAU KHI nộp bài. Nếu bỏ trống, hệ thống sẽ dùng AI để sinh đáp án từ đề bài.</p>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 flex gap-3 justify-end border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isSaving}
                  className={`px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-colors shadow-sm ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Đóng
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className={`px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors ${isSaving ? 'opacity-50 cursor-not-allowed flex items-center gap-2' : ''}`}
                >
                  {isSaving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Đang xử lý...
                    </>
                  ) : editingTestId ? 'Lưu thay đổi' : 'Xác nhận tạo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Questions Modal */}
      {editingQuestionsTest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]" onClick={() => setEditingQuestionsTest(null)}>
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-gray-50 shrink-0 rounded-t-2xl">
              <button onClick={() => setEditingQuestionsTest(null)} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 font-medium bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm transition-colors">
                <ArrowLeft size={18} /> Trở lại
              </button>
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 flex-1 truncate">
                <Pencil size={20} className="text-blue-500" />
                Chỉnh sửa câu hỏi: {editingQuestionsTest.title}
              </h2>
            </div>
            
            <div className="p-6 overflow-y-auto bg-gray-50/50 flex-1 space-y-6">
              {editingQuestionsList.length > 0 ? (
                editingQuestionsList.map((q: any, idx: number) => (
                  <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <p className="font-bold text-gray-800 mb-3">Câu {idx + 1}: <span className="font-normal"><MathText content={q.question} /></span></p>
                    
                    {/* Image display and upload */}
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Hình vẽ đính kèm cho câu này (Tuỳ chọn)</label>
                      {q.imageUrl && (
                        <div className="mb-3 relative inline-block">
                          <img src={q.imageUrl} alt={`Hình vẽ câu ${idx + 1}`} className="max-h-40 rounded border border-gray-300" />
                          <button 
                            onClick={() => {
                              const newList = [...editingQuestionsList];
                              delete newList[idx].imageUrl;
                              setEditingQuestionsList(newList);
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                            title="Xóa ảnh"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                      <div>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handleImageUploadForQuestion(e, idx)}
                          className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
                    </div>

                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">Không có dữ liệu câu hỏi.</div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setEditingQuestionsTest(null)}
                className="px-6 py-2 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={saveEditedQuestions}
                className="px-6 py-2 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
              >
                Lưu câu hỏi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewTest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50 shrink-0">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FileText size={24} className="text-blue-500" />
                Xem trước: {previewTest.title}
              </h2>
              <button onClick={() => setShowPreviewModal(false)} className="text-gray-400 hover:text-gray-700">
                <X size={24} />
              </button>
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
                      <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <p className="font-bold text-gray-800 mb-3">Câu {idx + 1}: <span className="font-normal"><MathText content={q.question} /></span></p>
                        {q.imageUrl && (
                          <div className="mb-4 pl-4">
                            <img src={q.imageUrl} alt={`Hình vẽ câu ${idx + 1}`} className="max-w-full h-auto max-h-64 rounded-lg border border-gray-200" />
                          </div>
                        )}
                        <div className="space-y-2 pl-4">
                          {q.options?.map((opt: string, optIdx: number) => (
                            <div key={optIdx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
                              <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs font-bold text-gray-500">
                                {String.fromCharCode(65 + optIdx)}
                              </div>
                              <span className="text-gray-700"><MathText content={opt} /></span>
                            </div>
                          ))}
                        </div>
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
    </div>
  );
}
