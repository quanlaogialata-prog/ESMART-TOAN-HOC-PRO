import fs from 'fs';
let code = fs.readFileSync('src/pages/teacher/ManageSubmissions.tsx', 'utf8');

if (code.includes('Number(s.grade) === Number(asm.grade)')) {
  // already using Number which is fine, or we can use String
  console.log("Already using Number");
} else {
  // Let's check how it filters
}
