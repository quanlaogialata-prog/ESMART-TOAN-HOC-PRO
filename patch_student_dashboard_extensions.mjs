import fs from 'fs';

let content = fs.readFileSync('src/pages/student/StudentDashboard.tsx', 'utf8');

// The dashboard has `user?.uid`. We can use this to resolve due date.

// First, sorting logic
const sortRegex = /validAssignments\.sort\(\(a, b\) => new Date\(a\.dueDate\)\.getTime\(\) - new Date\(b\.dueDate\)\.getTime\(\)\);/;
const newSort = `validAssignments.sort((a, b) => {
      const aDue = a.extensions && user?.uid && a.extensions[user.uid] ? a.extensions[user.uid] : a.dueDate;
      const bDue = b.extensions && user?.uid && b.extensions[user.uid] ? b.extensions[user.uid] : b.dueDate;
      return new Date(aDue).getTime() - new Date(bDue).getTime();
    });`;
content = content.replace(sortRegex, newSort);

// Group logic
const groupRegex = /const dateStr = \(\(a\.isSubmitted && a\.submittedAt \? 'Nộp bài: ' : 'Hạn nộp: '\) \+ new Date\(a\.isSubmitted && a\.submittedAt \? a\.submittedAt : a\.dueDate\)\.toLocaleDateString\('vi-VN', \{\n\s*weekday: 'long', \n\s*year: 'numeric', \n\s*month: 'long', \n\s*day: 'numeric'\n\s*\}\)\);/g;

// Actually wait, let's just create a helper inside the component: `const getDueDate = (a) => a.extensions?.[user?.uid] || a.dueDate;`
// Then replace `a.dueDate` with `getDueDate(a)`.

const helperCode = `const getDueDate = (a: any) => (a.extensions && user?.uid && a.extensions[user.uid]) ? a.extensions[user.uid] : a.dueDate;`;

// Inject helper before `const groupedAssignments:`
content = content.replace(/const groupedAssignments: \{ \[date: string\]: any\[\] \} = \{\};/, `${helperCode}\n  const groupedAssignments: { [date: string]: any[] } = {};`);

// Replace in grouping:
content = content.replace(/a\.isSubmitted && a\.submittedAt \? a\.submittedAt : a\.dueDate/g, "a.isSubmitted && a.submittedAt ? a.submittedAt : getDueDate(a)");

// Replace in Card render:
// Clock icon format
content = content.replace(/Hạn nộp: \{\(\(dateStr\) => \{ const d = new Date\(dateStr\); return `\$\{d\.getHours\(\)\.toString\(\)\.padStart\(2, '0'\)\}:\$\{d\.getMinutes\(\)\.toString\(\)\.padStart\(2, '0'\)\} \$\{d\.toLocaleDateString\('vi-VN'\)\}` \}\)\(a\.dueDate\)\}/g, 
"Hạn nộp: {((dateStr) => { const d = new Date(dateStr); return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ${d.toLocaleDateString('vi-VN')}` })(getDueDate(a))}");

// Past due condition
content = content.replace(/new Date\(\) > new Date\(a\.dueDate\)/g, "new Date() > new Date(getDueDate(a))");

fs.writeFileSync('src/pages/student/StudentDashboard.tsx', content);
console.log("Patched extensions in StudentDashboard.tsx");
