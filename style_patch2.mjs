import fs from 'fs';
let code = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');

// The user pointed directly to the first badge in the default system section. 
// They literally asked: "Thay chữ này bằng tên giáo viên tạo đề" pointing to the first badge which originally said "GV: Hệ thống" or just "Trắc nghiệm".
// Since it's a default test, maybe they want it to just say the teacher's name?
// Let's replace "{t.type === 'mcq' ? 'Trắc nghiệm' : 'Tự luận'} - GV: {t.createdBy || 'Hệ thống'}" with "{t.createdBy || 'Hệ thống'}" just to match exactly what they might want, or perhaps they just want "GV: {t.createdBy}" instead of "Hệ thống" for ALL tests.
// Let's make both sections just say "GV: {t.createdBy || 'Tên giáo viên'}" for custom tests and "GV: {t.createdBy || 'Tên giáo viên'}" for default tests too, as the user might have created it but it fell into the first category.

code = code.replace(
  "{t.type === 'mcq' ? 'Trắc nghiệm' : 'Tự luận'} - GV: {t.createdBy || 'Hệ thống'}",
  "GV: {t.createdBy || 'Tên giáo viên'}"
);

code = code.replace(
  "{t.type === 'mcq' ? 'Trắc nghiệm' : 'Tự luận'} - GV: {t.createdBy || 'Giáo viên'}",
  "GV: {t.createdBy || 'Tên giáo viên'}"
);

fs.writeFileSync('src/pages/teacher/ManageTests.tsx', code);
console.log("Patched to just say GV: Tên giáo viên");
