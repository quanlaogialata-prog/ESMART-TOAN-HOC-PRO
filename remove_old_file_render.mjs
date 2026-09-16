import fs from 'fs';
let code = fs.readFileSync('src/pages/student/DoAssignment.tsx', 'utf8');

// The block to remove is:
/*
          {test.fileUrl && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-200 flex items-center justify-between mb-6">
...
            </div>
          )}
          
          {test.fileUrl && test.fileUrl.startsWith('data:image/') && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 text-center overflow-auto">
...
            </div>
          )}
*/

const blockStart = "          {test.fileUrl && (";
const blockEndImg = "          )}";

// We can just use a regex to replace everything from the first {test.fileUrl && ( to the one right before {questions.map
const index1 = code.indexOf("{test.fileUrl && (");
const index2 = code.indexOf("{questions.map((q, index)");

if (index1 !== -1 && index2 !== -1) {
    const toReplace = code.substring(index1, index2);
    code = code.replace(toReplace, "");
    fs.writeFileSync('src/pages/student/DoAssignment.tsx', code);
    console.log("Removed old file url render");
} else {
    console.log("Could not find boundaries");
}

