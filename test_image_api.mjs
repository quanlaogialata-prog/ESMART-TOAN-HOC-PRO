import fs from 'fs';
fetch('http://localhost:3000/api/grade-essay', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    essayPrompt: 'Solve 2x = 4',
    submissionText: '',
    submissionImageDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', // 1x1 black pixel
    mimeType: 'image/png',
    maxScore: 10
  })
}).then(res => res.text()).then(console.log).catch(console.error);
