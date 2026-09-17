import fs from 'fs';

// Update Gradebook.tsx
let gradebookContent = fs.readFileSync('src/pages/teacher/Gradebook.tsx', 'utf8');
gradebookContent = gradebookContent.replace(
  "doc.save(`Ket_qua_bai_kiem_tra_${removeVietnameseTones(asm.testTitle || 'Kiem_tra')}.pdf`);",
  "doc.save(`Bang_diem_${removeVietnameseTones(cls.name).replace(/[^a-zA-Z0-9]/g, '_')}_${removeVietnameseTones(asm.testTitle || 'Kiem_tra').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);"
);
fs.writeFileSync('src/pages/teacher/Gradebook.tsx', gradebookContent);

// Update ManageTests.tsx
let manageTestsContent = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');
manageTestsContent = manageTestsContent.replace(
  "doc.save(`Diem_${a.className}_${removeVietnameseTones(a.testTitle).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);",
  "doc.save(`Bang_diem_${removeVietnameseTones(a.className).replace(/[^a-zA-Z0-9]/g, '_')}_${removeVietnameseTones(a.testTitle || 'Kiem_tra').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);"
);
fs.writeFileSync('src/pages/teacher/ManageTests.tsx', manageTestsContent);

console.log("Done");
