import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  X, CheckCircle, AlertCircle, FileText, Clock, Calendar, 
  Award, ExternalLink, HelpCircle, ChevronRight
} from 'lucide-react';
import MathText from '../MathText';
import QuestionVisualRenderer from '../common/QuestionVisualRenderer';
import { 
  resolveMcqLetter, 
  stripOptionPrefix, 
  autoReconcileQuestion, 
  checkShortAnswer, 
  checkMcqAnswer 
} from '../../utils/gradeEngine';
import { Link } from 'react-router';

interface StudentResultModalProps {
  assignment: any;
  submission: any;
  onClose: () => void;
}

export default function StudentResultModal({
  assignment,
  submission,
  onClose
}: StudentResultModalProps) {
  const [testData, setTestData] = useState<any>(null);
  const [loadingTest, setLoadingTest] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadTest() {
      if (assignment?.testId) {
        try {
          const tSnap = await getDoc(doc(db, 'tests', assignment.testId));
          if (tSnap.exists() && isMounted) {
            setTestData(tSnap.data());
          }
        } catch (e) {
          console.error("Error loading test details for review:", e);
        } finally {
          if (isMounted) setLoadingTest(false);
        }
      } else {
        if (isMounted) setLoadingTest(false);
      }
    }
    loadTest();
    return () => {
      isMounted = false;
    };
  }, [assignment?.testId]);

  if (!assignment || !submission) return null;

  const rawFeedbackList: any[] = Array.isArray(submission?.feedback) ? submission.feedback : [];
  let scoreDiff = 0;
  let hasChanges = false;
  const feedbackList = rawFeedbackList.map((fb: any) => {
    const rec = autoReconcileQuestion(fb);
    if (!rec.changed) return fb;

    hasChanges = true;
    const qType = (fb.type || 'mcq').toString().toLowerCase().trim();
    const qMaxScore = Number(fb.maxScore) || (qType === 'mcq' ? 0.25 : qType === 'tf' ? 1.0 : qType === 'short' ? 0.5 : 1.0);
    const oldScore = Number(fb.score || 0);
    let newScore = oldScore;
    let newFeedback = fb.feedback;

    if (qType === 'short') {
      const shortRes = checkShortAnswer(fb.studentAnswer, rec.question.correctAnswer);
      newScore = shortRes.isCorrect ? qMaxScore : 0;
      scoreDiff += (newScore - oldScore);
      newFeedback = shortRes.isCorrect
        ? `Chính xác (+ ${qMaxScore}đ)`
        : `Sai. Bạn nhập: "${fb.studentAnswer || 'Trống'}" — Đáp án đúng là: "${rec.question.correctAnswer}"`;
    } else if (qType === 'mcq') {
      const mcqRes = checkMcqAnswer(fb.studentAnswer, rec.question.correctAnswer, fb.options);
      newScore = mcqRes.isCorrect ? qMaxScore : 0;
      scoreDiff += (newScore - oldScore);
      newFeedback = mcqRes.isCorrect
        ? `Chính xác (+ ${qMaxScore}đ)`
        : `Sai. Bạn chọn: ${mcqRes.studentLetter || 'Chưa chọn'} — Đáp án đúng là: ${mcqRes.correctLetter}`;
    }

    return {
      ...fb,
      correctAnswer: rec.question.correctAnswer,
      score: newScore,
      feedback: newFeedback
    };
  });

  const result = submission;
  const maxScore = Number(result.maxScore || 10);
  const score = Math.max(0, Math.round((Number(result.score || 0) + scoreDiff) * 100) / 100);
  const score10 = maxScore > 0 ? (score / maxScore) * 10 : score;
  const assignedVariant = result.variantCode || assignment.variantCode;

  // Auto-sync reconciled submission back to Firestore if changes were detected
  useEffect(() => {
    if (hasChanges && submission?.id) {
      updateDoc(doc(db, 'submissions', submission.id), {
        score,
        feedback: feedbackList
      }).catch(err => console.warn('Could not auto-sync reconciled submission:', err));
    }
  }, [hasChanges, submission?.id, score]);

  // Format time spent
  const formatTimeSpent = (seconds: number) => {
    if (!seconds && seconds !== 0) return '--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) return `${m} phút ${s} giây`;
    return `${s} giây`;
  };

  // Format date
  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ngày ${d.toLocaleDateString('vi-VN')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 shrink-0">
          <div className="min-w-0 flex-1 pr-4">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Đã nộp bài
              </span>
              {assignedVariant && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Mã đề: {assignedVariant}
                </span>
              )}
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock size={12} /> Làm trong: {formatTimeSpent(result.timeSpent)}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
              {assignment.testTitle}
            </h2>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to={`/assignment/${assignment.id}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Mở toàn màn hình"
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors"
            >
              <ExternalLink size={14} /> Toàn màn hình
            </Link>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
              title="Đóng cửa sổ"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 bg-gray-50">
          
          {/* Main Score Board */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-emerald-100 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle size={36} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Bảng Kết Quả Chấm Bài</h3>
            <p className="text-xs text-gray-500 mb-4">
              Nộp lúc: {formatDateTime(result.submittedAt)}
            </p>

            <div className="w-full max-w-lg bg-slate-50 rounded-xl p-5 border border-slate-200">
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-200">
                <span className="text-gray-700 font-semibold text-base">Tổng điểm đạt được</span>
                <div className="text-right">
                  <div className="text-3xl sm:text-4xl font-black text-blue-600">
                    {score.toFixed(2).replace(/\.00$/, '')} 
                    <span className="text-xl text-gray-400 font-medium"> / {maxScore}</span>
                  </div>
                  {maxScore !== 10 && (
                    <div className="text-xs text-indigo-700 font-bold mt-0.5">
                      (Quy đổi hệ 10: {score10.toFixed(2).replace(/\.00$/, '')}/10)
                    </div>
                  )}
                </div>
              </div>

              {(result.mcqMax > 0 || result.essayMax > 0) && (result.mcqMax !== maxScore && result.essayMax !== maxScore) ? (
                <div className="space-y-2.5 text-xs sm:text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Điểm trắc nghiệm (Hệ thống chấm):</span>
                    <span className="font-bold text-gray-800">
                      {Number(result.mcqScore || 0).toFixed(2).replace(/\.00$/, '')} / {result.mcqMax}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Điểm tự luận (AI / GV chấm):</span>
                    <span className="font-bold text-gray-800">
                      {Number(result.essayScore || 0).toFixed(2).replace(/\.00$/, '')} / {result.essayMax}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center">
                  Hệ thống đã tự động chấm điểm và đánh giá chi tiết từng câu hỏi.
                </p>
              )}
            </div>
          </div>

          {/* Attached Answer File (if any) */}
          {testData?.answerFileUrl && (
            <div className="bg-white p-5 rounded-2xl shadow-xs border border-purple-200 flex items-center justify-between">
              <div className="flex items-center gap-3 text-purple-900 min-w-0">
                <FileText size={28} className="shrink-0 text-purple-600" />
                <div className="min-w-0">
                  <h4 className="font-bold text-sm sm:text-base truncate">Tài liệu ĐÁP ÁN (Biểu điểm/Lời giải)</h4>
                  <p className="text-xs text-purple-700 truncate">{testData.answerFileName || "dap_an_dinh_kem"}</p>
                </div>
              </div>
              <a 
                href={testData.answerFileUrl} 
                target="_blank" 
                rel="noreferrer"
                className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 font-semibold text-xs rounded-lg transition-colors shrink-0"
              >
                Mở tài liệu
              </a>
            </div>
          )}

          {/* Attached Test File (if any) */}
          {testData?.fileUrl && (
            <div className="bg-white p-5 rounded-2xl shadow-xs border border-orange-200 flex items-center justify-between">
              <div className="flex items-center gap-3 text-orange-900 min-w-0">
                <FileText size={28} className="shrink-0 text-orange-600" />
                <div className="min-w-0">
                  <h4 className="font-bold text-sm sm:text-base truncate">Tài liệu ĐỀ THI gốc đính kèm</h4>
                  <p className="text-xs text-orange-700 truncate">{testData.fileName || "tai_lieu_de_thi"}</p>
                </div>
              </div>
              <a 
                href={testData.fileUrl} 
                target="_blank" 
                rel="noreferrer"
                className="px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-800 font-semibold text-xs rounded-lg transition-colors shrink-0"
              >
                Mở đề thi
              </a>
            </div>
          )}

          {/* Question List with student responses & detailed grading */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pt-2">
              <div className="flex-1 h-px bg-gray-200"></div>
              <h4 className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-gray-200 shadow-2xs">
                CHI TIẾT BÀI LÀM & ĐÁP ÁN TỪNG CÂU ({feedbackList.length} CÂU)
              </h4>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {feedbackList.length === 0 && (
              <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500 text-sm">
                Không có dữ liệu câu hỏi chi tiết.
              </div>
            )}

            {feedbackList.map((fb: any, index: number) => {
              const qScore = Number(fb.score || 0);
              const qMaxScore = Number(fb.maxScore || 1);
              const isFullScore = qScore === qMaxScore && qMaxScore > 0;
              const isPartial = qScore > 0 && qScore < qMaxScore;

              return (
                <div 
                  key={fb.questionId || index}
                  className={`bg-white p-5 sm:p-6 rounded-2xl shadow-xs border ${
                    isFullScore 
                      ? 'border-emerald-200' 
                      : isPartial 
                        ? 'border-amber-200' 
                        : 'border-rose-200'
                  }`}
                >
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <h5 className="font-bold text-gray-900 text-base leading-snug">
                      Câu {index + 1}: <span className="font-normal"><MathText content={fb.question || ''} /></span>
                    </h5>
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded shrink-0">
                      {qScore} / {qMaxScore} đ
                    </span>
                  </div>

                  {/* Figure/Diagram if available */}
                  <QuestionVisualRenderer
                    figureType={fb.figureType}
                    figureSvg={fb.figureSvg}
                    figureTable={fb.figureTable}
                    figureDescription={fb.figureDescription}
                    imageUrl={fb.imageUrl}
                  />

                  {/* MCQ Options (if type is mcq) */}
                  {fb.type === 'mcq' && Array.isArray(fb.options) && fb.options.length > 0 && (
                    <div className="space-y-2 mt-3.5">
                      {fb.options.map((opt: string, i: number) => {
                        const optLetter = String.fromCharCode(65 + i);
                        const cleanText = stripOptionPrefix(opt);
                        const isStudentPicked = 
                          fb.studentAnswer === optLetter || 
                          fb.studentAnswer === opt || 
                          resolveMcqLetter(fb.studentAnswer, fb.options).letter === optLetter;
                        
                        const isCorrectOption = 
                          fb.correctAnswer === optLetter ||
                          fb.correctAnswer === opt ||
                          resolveMcqLetter(fb.correctAnswer, fb.options).letter === optLetter;

                        let optClasses = 'border-gray-200 bg-gray-50/50 text-gray-700';
                        if (isCorrectOption) {
                          optClasses = 'border-emerald-300 bg-emerald-50/90 text-emerald-900 font-semibold ring-1 ring-emerald-300';
                        } else if (isStudentPicked && !isCorrectOption) {
                          optClasses = 'border-rose-300 bg-rose-50/90 text-rose-900 ring-1 ring-rose-300';
                        }

                        return (
                          <div 
                            key={i} 
                            className={`flex items-start gap-3 p-3 rounded-xl border text-sm transition-all ${optClasses}`}
                          >
                            <span className={`font-bold text-xs px-2 py-0.5 rounded shrink-0 ${
                              isCorrectOption 
                                ? 'bg-emerald-600 text-white' 
                                : isStudentPicked 
                                  ? 'bg-rose-600 text-white' 
                                  : 'bg-gray-200 text-gray-700'
                            }`}>
                              {optLetter}
                            </span>
                            <div className="flex-1 leading-relaxed pt-0.5">
                              <MathText content={cleanText || opt} />
                            </div>
                            {isStudentPicked && (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 shrink-0">
                                Bạn chọn
                              </span>
                            )}
                            {isCorrectOption && (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 shrink-0">
                                Đáp án đúng
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Student Answer for Short Answer or Essay */}
                  {fb.type !== 'mcq' && (
                    <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                      <span className="font-semibold text-gray-600">Câu trả lời của bạn: </span>
                      <span className="font-bold text-gray-800">
                        {fb.studentAnswer ? <MathText content={String(fb.studentAnswer)} /> : <em className="text-gray-400">Không trả lời</em>}
                      </span>
                      {fb.fileDataUrl && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">Ảnh bài làm tự luận đính kèm:</p>
                          <img src={fb.fileDataUrl} alt="Bài làm" className="max-w-xs max-h-48 rounded border border-gray-200" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Evaluation Feedback Banner */}
                  <div className={`mt-4 p-4 rounded-xl flex gap-3 border ${
                    isFullScore 
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
                      : isPartial 
                        ? 'bg-amber-50/80 border-amber-200 text-amber-900' 
                        : 'bg-rose-50/80 border-rose-200 text-rose-900'
                  }`}>
                    {isFullScore ? (
                      <CheckCircle size={20} className="mt-0.5 shrink-0 text-emerald-600" />
                    ) : isPartial ? (
                      <CheckCircle size={20} className="mt-0.5 shrink-0 text-amber-600" />
                    ) : (
                      <AlertCircle size={20} className="mt-0.5 shrink-0 text-rose-600" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                        <span className="font-bold text-sm">
                          Điểm: {qScore} / {qMaxScore} đ
                        </span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          isFullScore 
                            ? 'bg-emerald-200 text-emerald-900' 
                            : isPartial 
                              ? 'bg-amber-200 text-amber-900' 
                              : 'bg-rose-200 text-rose-900'
                        }`}>
                          {isFullScore ? 'Chính xác' : isPartial ? 'Đúng một phần' : 'Chưa đúng'}
                        </span>
                      </div>

                      {fb.feedback && (
                        <div className="text-xs sm:text-sm font-medium leading-relaxed mt-1">
                          <MathText content={fb.feedback} />
                        </div>
                      )}

                      {fb.correctAnswer && (
                        <div className="mt-2 text-xs font-semibold bg-white/90 p-2 rounded-lg border border-gray-200 text-gray-800">
                          <span className="text-gray-500">Đáp án chuẩn: </span>
                          <span className="text-blue-700 font-bold">
                            <MathText content={String(fb.correctAnswer)} />
                          </span>
                        </div>
                      )}

                      {fb.explanation && (
                        <div className="mt-2.5 p-2.5 bg-white/95 border border-blue-200 rounded-lg text-blue-950 text-xs sm:text-sm">
                          <p className="font-bold mb-1 text-blue-800">Lời giải chi tiết:</p>
                          <MathText content={fb.explanation} />
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-gray-100 bg-white flex items-center justify-between shrink-0">
          <Link
            to={`/assignment/${assignment.id}`}
            className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            Mở bài làm toàn màn hình <ChevronRight size={14} />
          </Link>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
