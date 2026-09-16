import fs from 'fs';
fetch('http://localhost:3000/api/grade-essay', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    essayPrompt: 'Explain gravity',
    submissionText: 'Gravity pulls things down.',
  })
}).then(res => res.json()).then(console.log).catch(console.error);
