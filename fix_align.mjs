import fs from 'fs';

let content = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf-8');

// We just need to make sure the gap is consistent and the buttons are aligned neatly.
const oldHtml = `
            {/* Hàng 2: File và Xóa (chuyển xuống cạnh) */}
            <div className="flex flex-wrap gap-2">
`;

const newHtml = `
            {/* Hàng 2: File và Xóa (chuyển xuống cạnh) */}
            <div className="flex flex-wrap gap-2 mt-1">
`;

content = content.replace(oldHtml, newHtml);

fs.writeFileSync('src/pages/teacher/ManageTests.tsx', content);
