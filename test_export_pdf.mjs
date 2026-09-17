import fs from 'fs';
let content = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');

const targetFunc = `  const exportGradebookForAssignment = (assignmentId: string, className: string, testTitle: string) => {`;
if (content.includes(targetFunc)) {
  console.log("Function found");
} else {
  console.log("Not found");
}
