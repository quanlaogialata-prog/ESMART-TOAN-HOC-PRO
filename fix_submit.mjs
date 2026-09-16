import fs from 'fs';

let content = fs.readFileSync('src/pages/student/DoAssignment.tsx', 'utf8');

const targetRegex = /  const handleSubmit = async \(\) => \{[\s\S]*?  const formatTime = \(seconds: number\) => \{/;

const replacement = `  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async () => {
    if (submitted) return;
    setLoading(true);
    setSubmitted(true);
    
    let totalScore = 0;
    let maxScore = 0;
    const feedback: any[] = [];

    for (const q of questions) {
      const pts = Number(q.points) || 1;
      maxScore += pts;
      let qScore = 0;
      let qFeedback = '';
      
      const studentAns = answers[q.id] || '';

      if (q.type === 'mcq' || q.type === 'tf') {
        if (studentAns === q.correctAnswer) {
          qScore = pts;
          qFeedback = 'Chính xác';
        } else {
          qFeedback = \`Sai. Đáp án đúng là: \${q.correctAnswer}\`;
        }
      } else if (q.type === 'short') {
        if (studentAns.toLowerCase().trim() === (q.correctAnswer || '').toLowerCase().trim()) {
          qScore = pts;
          qFeedback = 'Chính xác';
        } else {
          qFeedback = \`Sai. Đáp án đúng là: \${q.correctAnswer}\`;
        }
      } else if (q.type === 'essay') {
        // AI Auto-grading
        if (studentAns.length > 0 || fileAnswers[q.id]) {
          try {
             let fileDataUrl = '';
             let mimeType = '';
             if (fileAnswers[q.id]) {
                 fileDataUrl = await fileToBase64(fileAnswers[q.id]);
                 mimeType = fileAnswers[q.id].type;
             }
             
             const res = await fetch('/api/grade-essay', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
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
             if (gradeData && typeof gradeData.score === 'number') {
                qScore = gradeData.score;
                qFeedback = gradeData.feedback || 'AI đã chấm bài tự luận này.';
             } else {
                qScore = pts * 0.5;
                qFeedback = 'Hệ thống AI không phản hồi điểm số. Cần giáo viên chấm lại.';
             }
          } catch (e) {
             console.error('Error auto grading:', e);
             qScore = 0;
             qFeedback = 'Lỗi kết nối AI khi chấm bài.';
          }
        } else {
          qFeedback = 'Không có bài làm.';
        }
      }

      totalScore += qScore;
      feedback.push({
        questionId: q.id,
        question: q.question,
        studentAnswer: studentAns,
        hasFile: !!fileAnswers[q.id],
        score: qScore,
        maxScore: q.points || 1,
        feedback: qFeedback
      });
    }

    // Add points for global essay if applicable (outside the loop!)
    if ((test.type === 'essay' || test.type === 'mixed') && (test.fileUrl || test.fileName)) { 
       let gScore = 0;
       let gFeedback = '';
       if (globalEssayAnswer.length > 0 || globalEssayFile) {
          try {
             let fileDataUrl = '';
             let mimeType = '';
             if (globalEssayFile) {
                 fileDataUrl = await fileToBase64(globalEssayFile);
                 mimeType = globalEssayFile.type;
             }
             const res = await fetch('/api/grade-essay', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                 essayPrompt: 'Phần nộp bài tự luận chung (toàn đề). Yêu cầu chấm dựa trên bài làm trong ảnh.',
                 submissionText: globalEssayAnswer,
                 submissionImageDataUrl: fileDataUrl,
                 mimeType,
                 maxScore: 10
               })
             });
             const gradeData = await res.json();
             if (gradeData && typeof gradeData.score === 'number') {
                gScore = gradeData.score;
                gFeedback = gradeData.feedback || 'AI đã chấm bài tự luận chung.';
             } else {
                gScore = 5;
                gFeedback = 'Hệ thống AI không phản hồi điểm số. Cần giáo viên chấm lại.';
             }
          } catch (e) {
             gFeedback = 'Lỗi kết nối AI khi chấm bài.';
          }
       } else {
          gFeedback = 'Không có bài làm tự luận chung.';
       }
       
       totalScore += gScore; // Adding global essay score to total
       maxScore += 10;       // Adding 10 max points for global essay
       
       feedback.push({
          questionId: 'global_essay',
          question: 'Phần nộp bài tự luận (Toàn đề)',
          studentAnswer: globalEssayAnswer,
          hasFile: !!globalEssayFile,
          score: gScore,
          maxScore: 10,
          feedback: gFeedback
       });
    }

    const submissionData = {
      assignmentId,
      studentId: user?.uid,
      studentEmail: user?.email,
      submittedAt: new Date().toISOString(),
      score: totalScore,
      maxScore,
      feedback,
      timeSpent: test.durationMinutes * 60 - timeLeft
    };

    setResult(submissionData);
    try {
      await addDoc(collection(db, 'submissions'), submissionData);
    } catch (err) {
      console.error("Lỗi lưu bài", err);
    }
    setLoading(false);
  };

  const formatTime = (seconds: number) => {`;

if (targetRegex.test(content)) {
  content = content.replace(targetRegex, replacement);
  fs.writeFileSync('src/pages/student/DoAssignment.tsx', content);
  console.log('done');
} else {
  console.log('target not found');
}
