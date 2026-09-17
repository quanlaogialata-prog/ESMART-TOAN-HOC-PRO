import fs from 'fs';
let content = fs.readFileSync('src/pages/teacher/Gradebook.tsx', 'utf8');

// Fix import
content = content.replace("import jsPDF from 'jspdf';", "import { jsPDF } from 'jspdf';");

// Make sure removeVietnameseTones exists inside Gradebook component, or outside.
// The previous implementation used it, let's see where it's defined.
