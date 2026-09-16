const fs = require('fs');
let content = fs.readFileSync('src/pages/teacher/Curriculum.tsx', 'utf-8');

const downloadFunc = `
  const downloadPDF = () => {
    if (!selectedLesson) return;
    const element = document.createElement('div');
    element.innerHTML = \`
      <div style="padding: 40px; font-family: Arial, sans-serif;">
        <h1 style="color: #1a56db; margin-bottom: 20px;">\${selectedLesson.title}</h1>
        <h3 style="color: #374151;">Kiến thức trọng tâm:</h3>
        <p style="color: #4b5563; line-height: 1.6; white-space: pre-wrap;">\${selectedLesson.knowledge}</p>
        \${selectedLesson.videoUrl ? \`<p style="margin-top: 20px;"><strong>Link Video:</strong> <a href="\${selectedLesson.videoUrl}">\${selectedLesson.videoUrl}</a></p>\` : ''}
      </div>
    \`;
    const opt = {
      margin:       0.5,
      filename:     \`Tai_lieu_\${selectedLesson.title.replace(/\\s+/g, '_')}.pdf\`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };
`;

content = content.replace(
  /const createTopic = \(\) => setShowTopicModal\(true\);/,
  downloadFunc + '\n  const createTopic = () => setShowTopicModal(true);'
);

// also remove the dangling `    html2pdf().set(opt).from(element).save();  };` if it still exists
content = content.replace(/html2pdf\(\)\.set\(opt\)\.from\(element\)\.save\(\);\s*\};/, '');

fs.writeFileSync('src/pages/teacher/Curriculum.tsx', content);
