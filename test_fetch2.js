fetch('http://localhost:3000/api/extract-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-gemini-api-key': 'TEST_KEY_FROM_CLIENT' },
    body: JSON.stringify({ fileDataUrl: 'data:image/png;base64,', mimeType: 'image/png' })
}).then(res => res.text()).then(console.log).catch(console.error);
