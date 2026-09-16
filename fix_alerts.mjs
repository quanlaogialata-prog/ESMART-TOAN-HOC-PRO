import fs from 'fs';

// Fix ManageTests.tsx
let tests = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');
tests = tests.replace(/alert\('Tệp đáp án quá lớn\. Vui lòng dùng tệp nhỏ hơn\.'\);/g, "setSysError('Tệp đáp án quá lớn. Vui lòng dùng tệp nhỏ hơn (dưới 800KB).'); setTimeout(() => setSysError(''), 4000);");
tests = tests.replace(/alert\('Tệp tải lên quá lớn \(giới hạn hệ thống ~800KB\)\. Hệ thống sẽ trích xuất câu hỏi nhưng không lưu trữ được tệp gốc\.'\);/g, "setSysError('Tệp tải lên quá lớn (giới hạn ~800KB). Hệ thống sẽ trích xuất nhưng không lưu được gốc.'); setTimeout(() => setSysError(''), 5000);");
fs.writeFileSync('src/pages/teacher/ManageTests.tsx', tests);

// Fix DoAssignment.tsx
let doAssign = fs.readFileSync('src/pages/student/DoAssignment.tsx', 'utf8');
doAssign = doAssign.replace(/alert\("Có lỗi xảy ra khi lưu bài \(file ảnh có thể quá lớn\)\. Vui lòng thử lại\."\);/g, "setErrorMsg('Có lỗi xảy ra khi nộp bài (file ảnh đính kèm có thể quá lớn). Vui lòng thử lại.');");
fs.writeFileSync('src/pages/student/DoAssignment.tsx', doAssign);

// Fix DrawingPad.tsx
let draw = fs.readFileSync('src/components/DrawingPad.tsx', 'utf8');
draw = draw.replace(/alert\("Đã xảy ra lỗi khi lưu bảng vẽ\."\);/g, "console.error('Lỗi khi lưu bảng vẽ.');");
fs.writeFileSync('src/components/DrawingPad.tsx', draw);

console.log("Fixed alerts");
