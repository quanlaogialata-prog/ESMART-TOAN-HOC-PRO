import fs from 'fs';
let content = fs.readFileSync('src/pages/teacher/Gradebook.tsx', 'utf8');

// replace import
content = content.replace(
  "import 'jspdf-autotable';",
  "import autoTable from 'jspdf-autotable';"
);

// replace handleDownloadTestPdf autoTable
content = content.replace(
  /\(doc as any\)\.autoTable\(\{\n\s*startY: 45,\n\s*head: \[\['STT', removeVietnameseTones\('Ho ten'\), 'Email', removeVietnameseTones\('Diem'\)\]\],\n\s*body: tableData,\n\s*\}\);/g,
  "autoTable(doc, {\n      startY: 45,\n      head: [['STT', removeVietnameseTones('Ho ten'), 'Email', removeVietnameseTones('Diem')]],\n      body: tableData,\n    });"
);

// replace handleDownloadPeriodPdf autoTable
content = content.replace(
  /\(doc as any\)\.autoTable\(\{\n\s*startY: 55,\n\s*head: \[\['STT', removeVietnameseTones\('Ho ten'\), removeVietnameseTones\('So bai da lam'\), removeVietnameseTones\('Diem trung binh'\)\]\],\n\s*body: tableData,\n\s*\}\);/g,
  "autoTable(doc, {\n      startY: 55,\n      head: [['STT', removeVietnameseTones('Ho ten'), removeVietnameseTones('So bai da lam'), removeVietnameseTones('Diem trung binh')]],\n      body: tableData,\n    });"
);

fs.writeFileSync('src/pages/teacher/Gradebook.tsx', content);
console.log("Replaced!");
