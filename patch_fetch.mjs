import fs from 'fs';

// Patch ManageTests.tsx
let mt = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');
mt = mt.replace(/headers: { 'Content-Type': 'application\/json' }/g, "headers: { 'Content-Type': 'application/json', 'x-gemini-api-key': localStorage.getItem('gemini_api_key') || '' }");
fs.writeFileSync('src/pages/teacher/ManageTests.tsx', mt);

// Patch DoAssignment.tsx
let da = fs.readFileSync('src/pages/student/DoAssignment.tsx', 'utf8');
da = da.replace(/headers: {\s*'Content-Type': 'application\/json'\s*}/g, "headers: { 'Content-Type': 'application/json', 'x-gemini-api-key': localStorage.getItem('gemini_api_key') || '' }");
fs.writeFileSync('src/pages/student/DoAssignment.tsx', da);

console.log("Patched fetch headers");
