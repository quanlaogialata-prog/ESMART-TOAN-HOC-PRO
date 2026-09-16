const fs = require('fs');
let content = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf-8');
console.log(content.match(/lucide-react/));
