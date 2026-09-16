import fs from 'fs';
let code = fs.readFileSync('src/pages/teacher/Gradebook.tsx', 'utf8');

if (!code.includes('import jsPDF')) {
  code = code.replace("import { LineChart,", "import jsPDF from 'jspdf';\nimport 'jspdf-autotable';\nimport { LineChart,");
  fs.writeFileSync('src/pages/teacher/Gradebook.tsx', code);
}
