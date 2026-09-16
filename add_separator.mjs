import fs from 'fs';
let code = fs.readFileSync('src/pages/student/DoAssignment.tsx', 'utf8');

const target = "          )}\n          {questions.map((q, index) => (";
const replacement = `          )}

          {questions.length > 0 && (
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-gray-300"></div>
              <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">BÀI LÀM</h2>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>
          )}

          {questions.map((q, index) => (`

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/pages/student/DoAssignment.tsx', code);
  console.log("Separator added.");
} else {
  console.log("Target not found.");
}
