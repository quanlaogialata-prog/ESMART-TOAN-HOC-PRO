import fs from 'fs';

const questions = [
  { id: "q1", type: "mcq", question: "1 + 1 = ?", options: ["1", "2", "3"], correctAnswer: "2" }
];

fetch('http://localhost:3000/api/generate-explanations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questions })
}).then(res => res.text()).then(console.log).catch(console.error);
