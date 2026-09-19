import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { doc, getDoc, collection, addDoc, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Clock, CheckCircle, AlertCircle, FileText, Upload, ArrowLeft, PenTool, Image, X, Check } from 'lucide-react';
import DrawingPad from '../../components/DrawingPad';
import MathText from '../../components/MathText';
import QuestionVisualRenderer from '../../components/common/QuestionVisualRenderer';
import { gradeQuestion, resolveMcqLetter, parseTfSubAnswers, cleanOptionText, stripOptionPrefix } from '../../utils/gradeEngine';

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
  

  const [assignedVariantCode, setAssignedVariantCode] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [assignmentId, user?.email, user?.uid]);

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

      let existingSub: any = null;
      let existingSubId: string | null = null;

      // Check existing submission
      if (user?.email) {
        const subQ = query(collection(db, 'submissions'), where('assignmentId', '==', assignmentId), where('studentEmail', '==', user.email));
        const subSnap = await getDocs(subQ);
        if (!subSnap.empty) {
          existingSub = subSnap.docs[0].data();
          existingSubId = subSnap.docs[0].id;
          setSubmitted(true);
          setResult(existingSub);
          if (existingSub.variantCode) {
            setAssignedVariantCode(existingSub.variantCode);
          }
          
          // Pre-fill answers from submission
          const prevAnswers: any = {};
          if (existingSub.answers) {
            Object.assign(prevAnswers, existingSub.answers);
          }
          if (existingSub.feedback) {
            existingSub.feedback.forEach((fb: any) => {
              if (fb.studentAnswer && !prevAnswers[fb.questionId]) {
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
        let studentVariantCode: string | null = existingSub?.variantCode || null;

        // Determine variant for multi-variant tests
        const isMulti = assignData.isMultiVariant || testData.isMultiVariant || (testData.variants && testData.variants.length > 1);
        if (isMulti) {
          const vCodes: string[] = assignData.variantCodes || testData.variantCodes || (testData.variants ? testData.variants.map((v: any) => v.code) : []);
          
          if (!studentVariantCode) {
            if (assignData.studentVariants) {
              if (user?.uid && assignData.studentVariants[user.uid]) {
                studentVariantCode = assignData.studentVariants[user.uid];
              } else if (user?.email && assignData.studentVariants[user.email]) {
                studentVariantCode = assignData.studentVariants[user.email];
              }
            }
            if (!studentVariantCode && vCodes.length > 0) {
              const hash = (user?.uid || user?.email || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
              studentVariantCode = vCodes[hash % vCodes.length];
            }
          }

          const variantsList: any[] = assignData.variants || testData.variants || [];
          const matchedVariant = variantsList.find((v: any) => v.code === studentVariantCode);
          if (matchedVariant && Array.isArray(matchedVariant.questions) && matchedVariant.questions.length > 0) {
            parsedQuestions = matchedVariant.questions;
          }
        }

        if (studentVariantCode) {
          setAssignedVariantCode(studentVariantCode);
        }

        if (!parsedQuestions || parsedQuestions.length === 0) {
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
        }

        // ensure IDs exist and types are normalized
        if (!Array.isArray(parsedQuestions)) parsedQuestions = [];
        parsedQuestions = parsedQuestions.map((q: any, i: number) => ({ 
          ...q, 
          id: q.id || `q${i}`,
          type: (q.type || 'mcq').toString().toLowerCase().trim()
        }));
        setQuestions(parsedQuestions);

        // Auto-correct any legacy grading mismatches for existing submission
        if (existingSub && existingSubId && Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
          let needsUpdate = false;
          let newTotalScore = 0;
          let newMcqScore = 0;
          let newEssayScore = 0;
          const updatedFeedback = [...(existingSub.feedback || [])];

          parsedQuestions.forEach((q: any, idx: number) => {
            const oldFb = updatedFeedback[idx] || {};
            const stAns = oldFb.studentAnswer ?? existingSub.answers?.[q.id] ?? '';

            if (q.type !== 'essay') {
              const freshGrade = gradeQuestion(q, stAns);
              if (oldFb.score !== freshGrade.score || oldFb.feedback !== freshGrade.feedback) {
                needsUpdate = true;
              }
              updatedFeedback[idx] = {
                ...oldFb,
                questionId: q.id,
                question: q.question || '',
                type: q.type,
                options: q.options || [],
                studentAnswer: stAns,
                score: freshGrade.score,
                maxScore: freshGrade.maxScore,
                feedback: freshGrade.feedback,
                correctAnswer: freshGrade.correctAnswerDisplay || q.correctAnswer || '',
                explanation: q.explanation || oldFb.explanation || ''
              };
              newMcqScore += freshGrade.score;
              newTotalScore += freshGrade.score;
            } else {
              const eScore = Number(oldFb.score || 0);
              newEssayScore += eScore;
              newTotalScore += eScore;
            }
          });

          if (needsUpdate) {
            existingSub = {
              ...existingSub,
              score: Math.round(newTotalScore * 100) / 100,
              mcqScore: Math.round(newMcqScore * 100) / 100,
              essayScore: Math.round(newEssayScore * 100) / 100,
              feedback: updatedFeedback
            };
            setResult(existingSub);
            try {
              await updateDoc(doc(db, 'submissions', existingSubId), {
                score: existingSub.score,
                mcqScore: existingSub.mcqScore,
                essayScore: existingSub.essayScore,
                feedback: existingSub.feedback
              });
              console.log('Submission score auto-corrected with test key.');
            } catch (errSync) {
              console.warn('Sync existing submission error:', errSync);
            }
          }
        }
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

  const handleTfSubAnswerChange = (qId: string, subKey: string, val: 'Đ' | 'S') => {
    setAnswers(prev => {
      const current = parseTfSubAnswers(prev[qId] || '');
      current[subKey.toLowerCase()] = val;
      const strVal = ['a', 'b', 'c', 'd']
        .filter(k => current[k])
        .map(k => `${k}-${current[k]}`)
        .join(', ');
      return { ...prev, [qId]: strVal };
    });
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
      const qType = (q.type || 'mcq').toString().toLowerCase().trim();
      const pts = Number(q.points) || (qType === 'mcq' ? 0.25 : qType === 'tf' ? 1.0 : qType === 'short' ? 0.5 : 1.0);
      maxScore += pts;
      let qScore = 0;
      let qFeedback = '';
      let fileDataUrl = '';
      let evaluatedDetails: any = null;
      let correctAnswerDisplay = (q.correctAnswer || '').toString().trim();
      
      const studentAns = answers[q.id] || '';

      if (qType === 'mcq' || qType === 'tf' || qType === 'short') {
        mcqMax += pts;
        const res = gradeQuestion(q, studentAns);
        qScore = res.score;
        qFeedback = res.feedback;
        evaluatedDetails = res.details || null;
        correctAnswerDisplay = res.correctAnswerDisplay || correctAnswerDisplay;
      } else if (qType === 'essay') {
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
          } catch (e: any) {
             console.error('Error auto grading:', e);
             qScore = 0;
             qFeedback = 'Lỗi kết nối AI: ' + (e?.message || e);
          }
        } else {
          qFeedback = 'Không có bài làm.';
        }
      }

      if (qType === 'essay') {
        essayScore += qScore;
      } else {
        mcqScore += qScore;
      }
      totalScore += qScore;
      feedback.push({
        questionId: q.id,
        question: q.question || "",
        type: qType,
        options: q.options || [],
        studentAnswer: studentAns,
        correctAnswer: correctAnswerDisplay,
        hasFile: !!fileAnswers[q.id],
        fileDataUrl,
        score: Math.round(qScore * 100) / 100,
        maxScore: pts,
        feedback: qFeedback,
        explanation: q.explanation || "",
        details: evaluatedDetails
      });
    }

    const submissionData = {
      assignmentId,
      studentId: user?.uid || "",
      studentEmail: user?.email || "",
      variantCode: assignedVariantCode || "",
      submittedAt: new Date().toISOString(),
      score: Math.round(totalScore * 100) / 100,
      maxScore: Math.round(maxScore * 100) / 100,
      mcqScore: Math.round(mcqScore * 100) / 100,
      mcqMax: Math.round(mcqMax * 100) / 100,
      essayScore: Math.round(essayScore * 100) / 100,
      essayMax: Math.round(essayMax * 100) / 100,
      feedback,
      answers,
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
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-800">{assignment.testTitle}</h1>
              {assignedVariantCode && (
                <span className="bg-indigo-100 text-indigo-800 text-xs font-black px-2.5 py-0.5 rounded-full border border-indigo-200 shadow-xs">
                  Mã đề: {assignedVariantCode}
                </span>
              )}
            </div>
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
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Đã nộp bài thành công!</h2>
              {assignedVariantCode && (
                <div className="mb-2 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-lg text-sm font-semibold">
                  Mã đề làm bài: <span className="font-extrabold text-blue-700">{assignedVariantCode}</span>
                </div>
              )}
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
              
              {/* Visual Figure / Diagram / Table / Image */}
              <QuestionVisualRenderer
                figureType={q.figureType}
                figureSvg={q.figureSvg}
                figureTable={q.figureTable}
                figureDescription={q.figureDescription}
                imageUrl={q.imageUrl}
              />

              {/* Trắc nghiệm 4 lựa chọn */}
              {q.type === 'mcq' && (
                <div className="space-y-3 mt-4">
                  {(Array.isArray(q.options) ? q.options : ['A', 'B', 'C', 'D']).map((opt: string, i: number) => {
                    const optLetter = String.fromCharCode(65 + i);
                    const currentLetter = resolveMcqLetter(answers[q.id], q.options).letter;
                    const isChecked = currentLetter === optLetter || answers[q.id] === optLetter || answers[q.id] === opt;
                    const cleanText = stripOptionPrefix(opt);

                    return (
                      <label 
                        key={i} 
                        className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isChecked 
                            ? 'bg-blue-50/80 border-blue-400 shadow-xs' 
                            : 'border-gray-200 hover:bg-gray-50/80'
                        } ${submitted ? 'pointer-events-none' : ''}`}
                      >
                        <input 
                          type="radio" 
                          name={`q-${q.id}`} 
                          value={optLetter}
                          checked={isChecked}
                          onChange={() => handleAnswerChange(q.id, optLetter)}
                          className="mt-1 w-4 h-4 text-blue-600 shrink-0"
                          disabled={submitted}
                        />
                        <div className="flex items-start gap-2.5 flex-1">
                          <span className={`font-bold text-xs px-2 py-0.5 rounded shrink-0 ${isChecked ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                            {optLetter}
                          </span>
                          <div className="font-medium text-gray-800 leading-relaxed text-sm pt-0.5">
                            <MathText content={cleanText || opt} />
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Trắc nghiệm đúng/sai */}
              {q.type === 'tf' && (
                <div className="mt-4 space-y-3">
                  {Array.isArray(q.options) && q.options.length > 1 ? (
                    <div className="space-y-2.5">
                      <p className="text-xs text-gray-500 font-medium italic mb-2">
                        Chọn Đúng (Đ) hoặc Sai (S) cho từng ý dưới đây:
                      </p>
                      {q.options.slice(0, 4).map((opt: string, optIdx: number) => {
                        const subKey = ['a', 'b', 'c', 'd'][optIdx];
                        const subMap = parseTfSubAnswers(answers[q.id] || '');
                        const curVal = subMap[subKey];
                        const cleanSub = stripOptionPrefix(opt);

                        return (
                          <div 
                            key={optIdx} 
                            className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/40 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-start gap-2.5 flex-1">
                              <span className="font-bold text-blue-700 uppercase bg-blue-100/90 px-2 py-0.5 rounded text-xs shrink-0 mt-0.5">
                                {subKey})
                              </span>
                              <div className="text-gray-800 text-sm font-medium leading-relaxed">
                                <MathText content={cleanSub || opt} />
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              <button
                                type="button"
                                disabled={submitted}
                                onClick={() => handleTfSubAnswerChange(q.id, subKey, 'Đ')}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                                  curVal === 'Đ'
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-emerald-50 hover:text-emerald-700'
                                } ${submitted ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
                              >
                                <Check size={14} /> Đúng
                              </button>
                              <button
                                type="button"
                                disabled={submitted}
                                onClick={() => handleTfSubAnswerChange(q.id, subKey, 'S')}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                                  curVal === 'S'
                                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-rose-50 hover:text-rose-700'
                                } ${submitted ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
                              >
                                <X size={14} /> Sai
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex gap-4">
                      {['Đúng', 'Sai'].map((opt) => {
                        const optVal = opt === 'Đúng' ? 'Đ' : 'S';
                        const isChecked = answers[q.id] === opt || answers[q.id] === optVal;
                        return (
                          <label key={opt} className={`flex-1 flex items-center justify-center gap-2 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                            isChecked 
                              ? 'bg-blue-50 border-blue-400 font-bold text-blue-700' 
                              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                          } ${submitted ? 'pointer-events-none' : ''}`}>
                            <input 
                              type="radio" 
                              name={`q-${q.id}`} 
                              value={opt}
                              checked={isChecked}
                              onChange={() => handleAnswerChange(q.id, opt)}
                              className="w-4 h-4 text-blue-600"
                              disabled={submitted}
                            />
                            <span className="font-bold"><MathText content={opt} /></span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Trả lời ngắn */}
              {q.type === 'short' && (
                <div className="mt-4">
                  <input 
                    type="text" 
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    placeholder="Nhập kết quả hoặc đáp số (ví dụ: 3.5, 3,5 hoặc -1/2)..."
                    className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-800 font-medium text-sm"
                    disabled={submitted}
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    * Định dạng số thập phân có thể dùng dấu phẩy (,) hoặc chấm (.), phân số dạng a/b.
                  </p>
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
                <div className={`mt-4 p-4 rounded-xl flex gap-3.5 border ${
                  result.feedback[index].score === result.feedback[index].maxScore 
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
                    : result.feedback[index].score > 0 
                      ? 'bg-amber-50/80 border-amber-200 text-amber-900' 
                      : 'bg-rose-50/80 border-rose-200 text-rose-900'
                }`}>
                  {result.feedback[index].score === result.feedback[index].maxScore ? (
                    <CheckCircle size={22} className="mt-0.5 shrink-0 text-emerald-600" />
                  ) : result.feedback[index].score > 0 ? (
                    <CheckCircle size={22} className="mt-0.5 shrink-0 text-amber-600" />
                  ) : (
                    <AlertCircle size={22} className="mt-0.5 shrink-0 text-rose-600" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="font-bold text-sm">
                        Điểm: <span className="text-base">{result.feedback[index].score}</span> / {result.feedback[index].maxScore}
                      </p>
                      {result.feedback[index].score === result.feedback[index].maxScore ? (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Chính xác
                        </span>
                      ) : result.feedback[index].score > 0 ? (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          Đúng một phần
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          Chưa đúng
                        </span>
                      )}
                    </div>

                    <div className="text-sm mt-1.5 leading-relaxed font-medium">
                      <MathText content={result.feedback[index].feedback} />
                    </div>

                    {result.feedback[index].correctAnswer && (
                      <div className="mt-2 text-xs font-semibold text-gray-700 bg-white/80 p-2 rounded-lg border border-gray-200">
                        <span className="text-gray-500">Đáp án chuẩn: </span>
                        <span className="text-blue-700 font-bold">
                          <MathText content={result.feedback[index].correctAnswer} />
                        </span>
                      </div>
                    )}

                    {result.feedback[index].explanation && (
                      <div className="mt-3 p-3 bg-white/90 border border-blue-200 rounded-lg text-blue-950 text-xs sm:text-sm">
                        <p className="font-bold mb-1 text-blue-800">Lời giải chi tiết:</p>
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
