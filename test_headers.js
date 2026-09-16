fetch('http://localhost:3000/api/extract-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-gemini-api-key': 'TEST_KEY' },
    body: JSON.stringify({ fileDataUrl: 'data:image/png;base64,', mimeType: 'image/png' })
}).then(res => {
    console.log(res.status);
    return res.text();
}).then(console.log).catch(console.error);
