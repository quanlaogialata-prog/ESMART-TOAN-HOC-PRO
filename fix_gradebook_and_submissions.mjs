import fs from 'fs';

let gradebook = fs.readFileSync('src/pages/teacher/Gradebook.tsx', 'utf8');

// The previous replace accidentally messed up the closing tags. Let's fix it manually.
gradebook = gradebook.replace(
  '<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">',
  '<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full">\\n        <div className="overflow-x-auto w-full">'
);

// We need to add a closing </div> for the inner overflow-x-auto div
// Find the exact closing </table> line and insert the div after it.
const lines = gradebook.split('\\n');
const fixedLines = [];
let foundTableEnd = false;

for (let i = 0; i < lines.length; i++) {
    fixedLines.push(lines[i]);
    if (lines[i].includes('</table>')) {
        fixedLines.push('        </div>'); // Add the closing inner div
    }
}

gradebook = fixedLines.join('\\n');
fs.writeFileSync('src/pages/teacher/Gradebook.tsx', gradebook);


let manageSubmissions = fs.readFileSync('src/pages/teacher/ManageSubmissions.tsx', 'utf8');

manageSubmissions = manageSubmissions.replace(
  '<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">',
  '<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full">\\n        <div className="overflow-x-auto w-full">'
);

const subLines = manageSubmissions.split('\\n');
const subFixedLines = [];
for (let i = 0; i < subLines.length; i++) {
    subFixedLines.push(subLines[i]);
    if (subLines[i].includes('</table>')) {
        subFixedLines.push('        </div>');
    }
}

manageSubmissions = subFixedLines.join('\\n');
fs.writeFileSync('src/pages/teacher/ManageSubmissions.tsx', manageSubmissions);


// Fix ManageTests table too
let manageTests = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');
manageTests = manageTests.replace(
  '<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">',
  '<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full">\\n        <div className="overflow-x-auto w-full">'
);

const testsLines = manageTests.split('\\n');
const testsFixedLines = [];
for (let i = 0; i < testsLines.length; i++) {
    testsFixedLines.push(testsLines[i]);
    if (testsLines[i].includes('</table>')) {
        testsFixedLines.push('        </div>');
    }
}

manageTests = testsFixedLines.join('\\n');
fs.writeFileSync('src/pages/teacher/ManageTests.tsx', manageTests);

console.log("Fixed files properly");
