import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { doc, getDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Clock, CheckCircle, AlertCircle, FileText, Upload, ArrowLeft, PenTool, Image, X } from 'lucide-react';
import DrawingPad from '../../components/DrawingPad';
import MathText from '../../components/MathText';

export default function DoAssignment() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<any>(null);
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [fileAnswers, setFileAnswers] = useState<{ [key: string]: File }>({});
  const [drawingQId, setDrawingQId] = useState<string | null>(null);

  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  

  useEffect(() => {
    loadData();
  }, [assignmentId]);

  useEffect(() => {
    if (timeLeft > 0 && !submitted) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !loading && !submitted) {
      handleSubmit(); // Auto submit when time is up
    }
  }, [timeLeft, loading, submitted]);

  const loadData = async () => {
    try {
      if (!assignmentId) return;

      // Check existing submission
      if (user?.email) {
        const subQ = query(collection(db, 'submissions'), where('assignmentId', '==', assignmentId), where('studentEmail', '==', user.email));
        const subSnap = await getDocs(subQ);
        if (!subSnap.empty) {
          const subData = subSnap.docs[0].data();
          setSubmitted(true);
          setResult(subData);
          
          // Pre-fill answers from submission
          const prevAnswers: any = {};
          if (subData.feedback) {
            subData.feedback.forEach((fb: any) => {
              if (fb.studentAnswer) {
                prevAnswers[fb.questionId] = fb.studentAnswer;
              }
            });
          }
          setAnswers(prevAnswers);
        }
      }

      const assignSnap = await getDoc(doc(db, 'assignments', assignmentId));
      if (!assignSnap.exists()) {
        setErrorMsg("Không tìm thấy bài tập!");
        setLoading(false);
        return;
      }
      const assignData = assignSnap.data();
      setAssignment(assignData);

      const testSnap = await getDoc(doc(db, 'tests', assignData.testId));
      if (testSnap.exists()) {
        const testData = testSnap.data();
        setTest(testData);
        setTimeLeft(testData.durationMinutes * 60);

        let parsedQuestions: any = [];
        try {
          parsedQuestions = JSON.parse(testData.questionsData || "[]");
          // Handle cases where AI returns an object like { "questions": [...] }
          if (parsedQuestions && typeof parsedQuestions === 'object' && !Array.isArray(parsedQuestions)) {
            if (Array.isArray(parsedQuestions.questions)) {
              parsedQuestions = parsedQuestions.questions;
            } else if (Array.isArray(parsedQuestions.data)) {
              parsedQuestions = parsedQuestions.data;
            } else {
              parsedQuestions = [];
            }
          }
        } catch (e) {
          // ignore
        }

        // ensure IDs exist and types are normalized
        if (!Array.isArray(parsedQuestions)) parsedQuestions = [];
        parsedQuestions = parsedQuestions.map((q: any, i: number) => ({ 
          ...q, 
          id: q.id || `q${i}`,
          type: (q.type || 'mcq').toString().toLowerCase().trim()
        }));
        setQuestions(parsedQuestions);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleAnswerChange = (qId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleFileChange = (qId: string, file: File | null) => {
    if (file) {
      setFileAnswers(prev => ({ ...prev, [qId]: file }));
    } else {
      const newFiles = { ...fileAnswers };
      delete newFiles[qId];
      setFileAnswers(newFiles);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
        return;
      }

      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800; // compress image to avoid 1MB Firestore limit
        
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height *= maxDim / width));
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width *= maxDim / height));
            height = maxDim;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // compress
      };
      img.onerror = (e) => reject(e);
      img.src = URL.createObjectURL(file);
    });
  };

  const handleSubmit = async () => {
    if (submitted) return;
    setLoading(true);
    setSubmitted(true);
    
    
    
    
    let totalScore = 0;
    let maxScore = 0;
    let mcqScore = 0;
    let essayScore = 0;
    let mcqMax = 0;
    let essayMax = 0;
    const feedback: any[] = [];

    for (const q of questions) {
      const pts = Number(q.points) || 1;
      maxScore += pts;
      let qScore = 0;
      let qFeedback = '';
      let fileDataUrl = '';
      
      const studentAns = answers[q.id] || '';

      if (q.type === 'mcq' || q.type === 'tf') {
        mcqMax += pts;
        if (studentAns === q.correctAnswer) {
          qScore = pts;
          qFeedback = 'Chính xác';
        } else {
          qFeedback = `Sai. Đáp án đúng là: ${q.correctAnswer}`;
        }
      } else if (q.type === 'short') {
        mcqMax += pts;
        if (studentAns.toLowerCase().trim() === (q.correctAnswer || '').toLowerCase().trim()) {
          qScore = pts;
          qFeedback = 'Chính xác';
        } else {
          qFeedback = `Sai. Đáp án đúng là: ${q.correctAnswer}`;
        }
      } else if (q.type === 'essay') {
        essayMax += pts;
        // AI Auto-grading
        if (studentAns.length > 0 || fileAnswers[q.id]) {
          try {
             let mimeType = '';
             if (fileAnswers[q.id]) {
                 fileDataUrl = await fileToBase64(fileAnswers[q.id]);
                 mimeType = fileAnswers[q.id].type;
             }
             
             const res = await fetch('/api/grade-essay', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json', 'x-gemini-api-key': localStorage.getItem('gemini_api_key') || '' },
               body: JSON.stringify({
                 essayPrompt: q.question,
                 submissionText: studentAns,
                 submissionImageDataUrl: fileDataUrl,
                 mimeType,
                 maxScore: pts,
                 rubric: q.correctAnswer || ''
               })
             });
             const gradeData = await res.json();
             if (gradeData && gradeData.score !== undefined) {
                const parsedScore = Number(gradeData.score);
                if (!isNaN(parsedScore)) {
                  qScore = parsedScore;
                  qFeedback = gradeData.feedback || 'AI đã chấm bài tự luận này.';
                } else {
                  qScore = pts * 0.5;
                  qFeedback = 'Hệ thống AI trả về điểm không hợp lệ. Cần giáo viên xem lại. Nhận xét: ' + (gradeData.feedback || '');
                }
             } else if (gradeData && gradeData.error) {
                qScore = 0;
                qFeedback = gradeData.error;
             } else {
                qScore = pts * 0.5;
                qFeedback = 'Hệ thống AI không phản hồi điểm số. Cần giáo viên chấm lại.';
             }
          } catch (e) {
             console.error('Error auto grading:', e);
             qScore = 0;
             qFeedback = 'Lỗi kết nối AI: ' + (e.message || e);
          }
        } else {
          qFeedback = 'Không có bài làm.';
        }
      }

      if (q.type === 'essay') {
        essayScore += qScore;
      } else {
        mcqScore += qScore;
      }
      totalScore += qScore;
      feedback.push({
        questionId: q.id,
        question: q.question || "",
        studentAnswer: studentAns,
        hasFile: !!fileAnswers[q.id],
        fileDataUrl,
        score: qScore,
        maxScore: q.points || 1,
        feedback: qFeedback,
        explanation: q.explanation || ""
      });
    }



    

    const submissionData = {
      assignmentId,
      studentId: user?.uid || "",
      studentEmail: user?.email || "",
      submittedAt: new Date().toISOString(),
      score: totalScore,
      maxScore,
      mcqScore,
      mcqMax,
      essayScore,
      essayMax,
      feedback,
      timeSpent: test.durationMinutes * 60 - timeLeft
    };

    try {
      await addDoc(collection(db, 'submissions'), submissionData);
      setResult(submissionData);
    } catch (err) {
      console.error("Lỗi lưu bài", err);
      setErrorMsg('Có lỗi xảy ra khi nộp bài (file ảnh đính kèm có thể quá lớn). Vui lòng thử lại.');
    }
    setLoading(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="flex flex-col h-screen items-center justify-center space-y-4"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div><p className="text-gray-600 font-medium">{submitted ? "Hệ thống đang chấm bài và tạo lời giải chi tiết (vui lòng đợi khoảng 10-15s)..." : "Đang tải đề thi..."}</p></div>;
  if (errorMsg) return <div className="p-8 text-center text-red-500 font-bold">{errorMsg}</div>;
  if (!test) return <div className="p-8 text-center text-red-500 font-bold">Lỗi: Không tìm thấy đề thi.</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-800">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-800">{assignment.testTitle}</h1>
            <p className="text-sm text-gray-500">Khối {assignment.grade}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {!submitted && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold ${timeLeft < 300 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-700'}`}>
              <Clock size={20} />
              {formatTime(timeLeft)}
            </div>
          )}
          {!submitted && (
            <button 
              onClick={() => setShowConfirm(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
            >
              Nộp bài
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {submitted && result && (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-green-100 flex flex-col items-center mb-8">
              <CheckCircle size={64} className="text-green-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Đã nộp bài thành công!</h2>
              <div className="w-full max-w-md bg-gray-50 rounded-xl p-6 mt-4">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                  <span className="text-gray-600 font-medium text-lg">Tổng điểm</span>
                  <div className="text-4xl font-black text-blue-600">
                    {Number(result.score).toFixed(2).replace(/\.00$/, '')} <span className="text-2xl text-gray-400 font-medium">/ {result.maxScore}</span>
                  </div>
                </div>
                
                {(result.mcqMax > 0 || result.essayMax > 0) && (result.mcqMax !== result.maxScore && result.essayMax !== result.maxScore) ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Điểm trắc nghiệm (Hệ thống chấm)</span>
                      <span className="font-bold text-gray-700 text-base">{Number(result.mcqScore).toFixed(2).replace(/\.00$/, '')} / {result.mcqMax}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Điểm tự luận (AI chấm)</span>
                      <span className="font-bold text-gray-700 text-base">{Number(result.essayScore).toFixed(2).replace(/\.00$/, '')} / {result.essayMax}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-sm text-gray-500">
                    Hệ thống đã chấm điểm bài làm của bạn.
                  </div>
                )}
              </div>
            </div>
          )}

          
          {submitted && test.answerFileUrl && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-200 flex items-center justify-between mb-6 mt-4">
               <div className="flex items-center gap-4 text-purple-800">
                  <FileText size={32} />
                  <div>
                    <h4 className="font-bold text-lg">Tài liệu ĐÁP ÁN (Biểu điểm/Lời giải)</h4>
                    <p className="text-sm opacity-80">{test.answerFileName || "dap_an_dinh_kem"}</p>
                  </div>
               </div>
               <div className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                  Chỉ xem
               </div>
            </div>
          )}
          
          {submitted && test.answerFileUrl && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 text-center overflow-auto" onContextMenu={(e) => e.preventDefault()}>
              <h4 className="font-bold text-gray-700 mb-4 text-left">Nội dung đáp án gốc:</h4>
              {test.answerFileUrl.startsWith('data:image/') ? (
                <img src={test.answerFileUrl} alt="Đáp án gốc" className="max-w-full h-auto mx-auto rounded-lg border border-gray-100 select-none pointer-events-none" />
              ) : (
                <iframe src={test.answerFileUrl + '#toolbar=0'} className="w-full h-[600px] rounded-lg border border-gray-200" title="Đáp án" />
              )}
            </div>
          )}

          
          {test.fileUrl && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-200 flex items-center justify-between mb-6">
               <div className="flex items-center gap-4 text-orange-800">
                  <FileText size={32} />
                  <div>
                    <h4 className="font-bold text-lg">Tài liệu đề thi đính kèm</h4>
                    <p className="text-sm opacity-80">{test.fileName || "tai_lieu_dinh_kem"}</p>
                  </div>
               </div>
               <div className="text-sm font-medium text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                  Chỉ xem
               </div>
            </div>
          )}
          
          {test.fileUrl && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 text-center overflow-auto" onContextMenu={(e) => e.preventDefault()}>
              <h4 className="font-bold text-gray-700 mb-4 text-left">Nội dung tài liệu gốc:</h4>
              {test.fileUrl.startsWith('data:image/') ? (
                <img src={test.fileUrl} alt="Bản gốc" className="max-w-full h-auto mx-auto rounded-lg border border-gray-100 select-none pointer-events-none" />
              ) : (
                <iframe src={test.fileUrl + '#toolbar=0'} className="w-full h-[600px] rounded-lg border border-gray-200" title="Tài liệu" />
              )}
            </div>
          )}

          {questions.length > 0 && (
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-gray-300"></div>
              <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">BÀI LÀM</h2>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>
          )}

          {questions.map((q, index) => (
            <div key={q.id} className={`bg-white p-6 rounded-2xl shadow-sm border ${submitted ? (result?.feedback?.[index]?.score === result?.feedback?.[index]?.maxScore ? 'border-green-200' : 'border-red-200') : 'border-gray-200'}`}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-gray-800 text-lg">Câu {index + 1}: <span className="font-normal"><MathText content={q.question} /></span></h3>
                <span className="text-sm font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">
                  {q.points || 1} điểm
                </span>
              </div>
              
              {q.imageUrl && (
                <div className="mb-6 mt-2">
                  <img src={q.imageUrl} alt={`Hình vẽ câu ${index + 1}`} className="max-w-full h-auto max-h-96 rounded-lg border border-gray-200" />
                </div>
              )}

              {/* Trắc nghiệm 4 lựa chọn */}
              {q.type === 'mcq' && (
                <div className="space-y-3 mt-4">
                  {(Array.isArray(q.options) ? q.options : ['A', 'B', 'C', 'D']).map((opt: string, i: number) => (
                    <label key={i} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      answers[q.id] === opt 
                        ? 'bg-blue-50 border-blue-300' 
                        : 'border-gray-200 hover:bg-gray-50'
                    } ${submitted ? 'pointer-events-none' : ''}`}>
                      <input 
                        type="radio" 
                        name={`q-${q.id}`} 
                        value={opt}
                        checked={answers[q.id] === opt}
                        onChange={() => handleAnswerChange(q.id, opt)}
                        className="w-4 h-4 text-blue-600"
                        disabled={submitted}
                      />
                      <span className="font-medium text-gray-700"><MathText content={opt} /></span>
                    </label>
                  ))}
                </div>
              )}

              {/* Trắc nghiệm đúng/sai */}
              {q.type === 'tf' && (
                <div className="flex gap-4 mt-4">
                  {['Đúng', 'Sai'].map((opt) => (
                    <label key={opt} className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border cursor-pointer transition-colors ${
                      answers[q.id] === opt 
                        ? 'bg-blue-50 border-blue-300' 
                        : 'border-gray-200 hover:bg-gray-50'
                    } ${submitted ? 'pointer-events-none' : ''}`}>
                      <input 
                        type="radio" 
                        name={`q-${q.id}`} 
                        value={opt}
                        checked={answers[q.id] === opt}
                        onChange={() => handleAnswerChange(q.id, opt)}
                        className="w-4 h-4 text-blue-600"
                        disabled={submitted}
                      />
                      <span className="font-bold text-gray-700"><MathText content={opt} /></span>
                    </label>
                  ))}
                </div>
              )}

              {/* Trả lời ngắn */}
              {q.type === 'short' && (
                <div className="mt-4">
                  <input 
                    type="text" 
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    placeholder="Nhập câu trả lời của bạn..."
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    disabled={submitted}
                  />
                </div>
              )}

              {/* Tự luận */}
              {q.type === 'essay' && (
                <div className="mt-4 space-y-4">
                  {/* Result Display Screen */}
                  <div className="w-full min-h-[200px] border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 flex flex-col items-center justify-center relative overflow-hidden group">
                    {fileAnswers[q.id] ? (
                      fileAnswers[q.id].type.startsWith('image/') ? (
                        <div className="relative w-full h-full flex items-center justify-center bg-gray-100 p-2 rounded-xl">
                           <img 
                             src={URL.createObjectURL(fileAnswers[q.id])} 
                             alt="Câu trả lời" 
                             className="max-w-full max-h-[400px] object-contain rounded shadow-sm bg-white"
                           />
                           {!submitted && (
                             <button onClick={() => {
                               const newFiles = {...fileAnswers};
                               delete newFiles[q.id];
                               setFileAnswers(newFiles);
                             }} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow">
                               <X size={16} />
                             </button>
                           )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-gray-600">
                           <FileText size={48} className="text-blue-500" />
                           <span className="font-medium text-sm text-center max-w-xs truncate">{fileAnswers[q.id].name}</span>
                           {!submitted && (
                             <button onClick={() => {
                               const newFiles = {...fileAnswers};
                               delete newFiles[q.id];
                               setFileAnswers(newFiles);
                             }} className="text-red-500 text-xs hover:underline mt-1">Xóa file</button>
                           )}
                        </div>
                      )
                    ) : (
                      <div className="text-gray-400 flex flex-col items-center gap-3 text-center p-6">
                         <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 mb-2">
                           <Image size={28} />
                         </div>
                         <p className="font-medium text-gray-600">Chưa có câu trả lời</p>
                         <p className="text-xs text-gray-400 max-w-[250px]">Sử dụng bảng nhập để làm bài hoặc đính kèm ảnh/file bài làm của bạn.</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 mt-4">
                    <button 
                      onClick={() => setDrawingQId(q.id)}
                      disabled={submitted}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl cursor-pointer hover:bg-blue-700 transition-colors text-sm font-bold shadow-sm ${submitted ? 'pointer-events-none opacity-50' : ''}`}
                    >
                      <PenTool size={18} />
                      Bảng nhập câu trả lời
                    </button>
                    <label className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors text-sm font-medium ${submitted ? 'pointer-events-none opacity-50' : ''}`}>
                      <Upload size={18} className="text-gray-600" />
                      <span className="text-gray-700">Tải ảnh/file lên</span>
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={(e) => handleFileChange(q.id, e.target.files ? e.target.files[0] : null)}
                        disabled={submitted}
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Feedback after submission */}
              {submitted && result?.feedback?.[index] && (
                <div className={`mt-4 p-4 rounded-xl flex gap-3 ${result.feedback[index].score === result.feedback[index].maxScore ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  {result.feedback[index].score === result.feedback[index].maxScore ? (
                    <CheckCircle size={20} className="mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle size={20} className="mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className="font-bold">Điểm: {result.feedback[index].score} / {result.feedback[index].maxScore}</p>
                    <div className="text-sm mt-1"><MathText content={result.feedback[index].feedback} /></div>
                    {result.feedback[index].explanation && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900">
                        <p className="font-bold mb-1">Lời giải chi tiết:</p>
                        <MathText content={result.feedback[index].explanation} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {questions.length === 0 && !(test.fileUrl || test.fileName) && (
            <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-gray-200">
              <p className="text-gray-500 font-medium">Đề kiểm tra này chưa có câu hỏi nào.</p>
            </div>
          )}


        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Xác nhận nộp bài</h3>
            <p className="text-gray-600 mb-6">Bạn có chắc chắn muốn nộp bài không? (Bạn không thể sửa lại sau khi nộp).</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={() => {
                  setShowConfirm(false);
                  handleSubmit();
                }}
                className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Nộp bài ngay
              </button>
            </div>
          </div>
        </div>
      )}
      {drawingQId && (
        <DrawingPad
          onSave={(dataUrl) => {
            // Save as image
            const arr = dataUrl.split(',');
            const match = arr[0].match(/:(.*?);/);
            const mime = match ? match[1] : 'image/jpeg';
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while(n--) {
              u8arr[n] = bstr.charCodeAt(n);
            }
            const file = new File([u8arr], `hinh_ve_${drawingQId}.jpg`, { type: mime });
            setFileAnswers(prev => ({ ...prev, [drawingQId]: file }));
            setDrawingQId(null);
          }}
          onCancel={() => setDrawingQId(null)}
        />
      )}
    </div>
  );
}
