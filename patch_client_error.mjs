import fs from 'fs';

let content = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');
content = content.replace(/errData\.details \|\| errData\.error/g, 'errData.error || errData.details');
fs.writeFileSync('src/pages/teacher/ManageTests.tsx', content);

let content2 = fs.readFileSync('src/pages/teacher/DoTestDetail.tsx', 'utf8');
if(content2.includes('errData.details || errData.error')){
    content2 = content2.replace(/errData\.details \|\| errData\.error/g, 'errData.error || errData.details');
    fs.writeFileSync('src/pages/teacher/DoTestDetail.tsx', content2);
}
let content3 = fs.readFileSync('src/pages/teacher/TestDetail.tsx', 'utf8');
if(content3.includes('errData.details || errData.error')){
    content3 = content3.replace(/errData\.details \|\| errData\.error/g, 'errData.error || errData.details');
    fs.writeFileSync('src/pages/teacher/TestDetail.tsx', content3);
}

console.log("Patched client errors");
