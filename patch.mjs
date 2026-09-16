import fs from 'fs';
let code = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');

code = code.replace(
  "setSysError('Lỗi máy chủ khi tách đề.');",
  "const errData = await splitRes.json().catch(() => ({})); setSysError('Lỗi máy chủ khi tách đề: ' + (errData.details || errData.error || splitRes.statusText));"
);

fs.writeFileSync('src/pages/teacher/ManageTests.tsx', code);
console.log("Patched ManageTests.tsx");
