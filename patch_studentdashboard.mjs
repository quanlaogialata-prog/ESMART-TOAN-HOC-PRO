import fs from 'fs';

let content = fs.readFileSync('src/pages/student/StudentDashboard.tsx', 'utf8');

const regex1 = /const validAssignments: any\[\] = \[\];\n    for \(const d of snap\.docs\) \{/;
const replace1 = `const subQ = query(collection(db, 'submissions'), where('studentEmail', '==', user?.email));
    const subSnap = await getDocs(subQ);
    const submittedAssignIds = new Set();
    subSnap.docs.forEach(doc => {
      submittedAssignIds.add(doc.data().assignmentId);
    });

    const validAssignments: any[] = [];
    for (const d of snap.docs) {`;

content = content.replace(regex1, replace1);

const regex2 = /validAssignments\.push\(\{ id: d\.id, \.\.\.assignData \}\);/;
const replace2 = `validAssignments.push({ id: d.id, ...assignData, isSubmitted: submittedAssignIds.has(d.id) });`;
content = content.replace(regex2, replace2);

const regex3 = /<Link to=\{\`\/assignment\/\$\{a\.id\}\`\} className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors">\s*Làm bài ngay\s*<\/Link>/;
const replace3 = `{a.isSubmitted ? (
                        <div className="block w-full text-center bg-gray-200 text-gray-500 font-medium py-2 rounded-lg cursor-not-allowed">
                          Đã làm bài
                        </div>
                      ) : (
                        <Link to={\`/assignment/\$\{a.id\}\`} className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors">
                          Làm bài ngay
                        </Link>
                      )}`;
content = content.replace(regex3, replace3);

fs.writeFileSync('src/pages/student/StudentDashboard.tsx', content);
console.log("Patched StudentDashboard.tsx");
