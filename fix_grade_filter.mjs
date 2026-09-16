import fs from 'fs';
let code = fs.readFileSync('src/pages/teacher/Gradebook.tsx', 'utf8');

const target = `  const filteredStudents = students.filter(s => 
    s.grade === selectedGrade && 
    (selectedClass ? s.className === selectedClass : true)
  );`;

const replacement = `  const filteredStudents = students.filter(s => 
    String(s.grade) === String(selectedGrade) && 
    (selectedClass ? s.className === selectedClass : true)
  );`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/pages/teacher/Gradebook.tsx', code);
  console.log('Fixed multiline exact');
} else {
  // try regex
  const regex = /const filteredStudents = students\.filter\(s => \s+s\.grade === selectedGrade && \s+\(selectedClass \? s\.className === selectedClass : true\)\s+\);/g;
  if (regex.test(code)) {
     code = code.replace(regex, replacement);
     fs.writeFileSync('src/pages/teacher/Gradebook.tsx', code);
     console.log('Fixed with regex');
  } else {
     // manual replace
     code = code.replace("s.grade === selectedGrade &&", "String(s.grade) === String(selectedGrade) &&");
     fs.writeFileSync('src/pages/teacher/Gradebook.tsx', code);
     console.log('Fixed single line');
  }
}
