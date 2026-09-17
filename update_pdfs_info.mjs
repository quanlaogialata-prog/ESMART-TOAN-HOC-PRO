import fs from 'fs';

// Update Gradebook.tsx
let gradebookContent = fs.readFileSync('src/pages/teacher/Gradebook.tsx', 'utf8');

const g_replacement = `    const title = removeVietnameseTones(\`Ten bai kiem tra: \${asm.testTitle || 'Khong ten'}\`);
    const classNameStr = removeVietnameseTones(\`Lop: \${cls.name}\`);
    const teacherStr = removeVietnameseTones(\`Giao vien giao bai: \${teacherName}\`);
    const assignedDateStr = removeVietnameseTones(\`Thoi gian giao bai: \${new Date(asm.assignedDate).toLocaleString('vi-VN')}\`);
    const dueDateStr = asm.dueDate ? removeVietnameseTones(\`Thoi han nop bai: \${new Date(asm.dueDate).toLocaleString('vi-VN')}\`) : 'Thoi han nop bai: Khong co';
    
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(12);
    doc.text(classNameStr, 14, 30);
    doc.text(teacherStr, 14, 38);
    doc.text(assignedDateStr, 14, 46);
    doc.text(dueDateStr, 14, 54);`;

gradebookContent = gradebookContent.replace(
  `    const title = removeVietnameseTones(\`Ten bai kiem tra: \${asm.testTitle || 'Khong ten'}\`);
    const teacherStr = removeVietnameseTones(\`Giao vien giao bai: \${teacherName}\`);
    const assignedDateStr = removeVietnameseTones(\`Thoi gian giao bai: \${new Date(asm.assignedDate).toLocaleString('vi-VN')}\`);
    
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(12);
    doc.text(teacherStr, 14, 30);
    doc.text(assignedDateStr, 14, 38);`,
  g_replacement
);

gradebookContent = gradebookContent.replace("startY: 48,", "startY: 64,");

fs.writeFileSync('src/pages/teacher/Gradebook.tsx', gradebookContent);

// Update ManageTests.tsx
let manageTestsContent = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');

const mt_replacement = `    const title = removeVietnameseTones(\`Ten bai kiem tra: \${a.testTitle || 'Khong ten'}\`);
    const classNameStr = removeVietnameseTones(\`Lop: \${a.className}\`);
    const teacherStr = removeVietnameseTones(\`Giao vien giao bai: \${user?.displayName || user?.email || 'Giao vien'}\`);
    const assignedDateStr = removeVietnameseTones(\`Thoi gian giao bai: \${new Date(a.assignedDate).toLocaleString('vi-VN')}\`);
    const dueDateStr = a.dueDate ? removeVietnameseTones(\`Thoi han nop bai: \${new Date(a.dueDate).toLocaleString('vi-VN')}\`) : 'Thoi han nop bai: Khong co';
    
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(12);
    doc.text(classNameStr, 14, 30);
    doc.text(teacherStr, 14, 38);
    doc.text(assignedDateStr, 14, 46);
    doc.text(dueDateStr, 14, 54);`;

manageTestsContent = manageTestsContent.replace(
  `    const title = removeVietnameseTones(\`Ten bai kiem tra: \${a.testTitle || 'Khong ten'}\`);
    const teacherStr = removeVietnameseTones(\`Giao vien giao bai: \${user?.displayName || user?.email || 'Giao vien'}\`);
    const assignedDateStr = removeVietnameseTones(\`Thoi gian giao bai: \${new Date(a.assignedDate).toLocaleString('vi-VN')}\`);
    
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(12);
    doc.text(teacherStr, 14, 30);
    doc.text(assignedDateStr, 14, 38);`,
  mt_replacement
);

manageTestsContent = manageTestsContent.replace("startY: 48,", "startY: 64,");

fs.writeFileSync('src/pages/teacher/ManageTests.tsx', manageTestsContent);

console.log("Done");
