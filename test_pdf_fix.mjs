import fs from 'fs';
let content = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');

// The issue might be that autoTable isn't attached to jsPDF in some module environments
// Let's change the import style slightly and ensure jsPDF instance is used correctly

const targetImports = `import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';`;

const replacementImports = `import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';`;

content = content.replace(targetImports, replacementImports);

fs.writeFileSync('src/pages/teacher/ManageTests.tsx', content);
