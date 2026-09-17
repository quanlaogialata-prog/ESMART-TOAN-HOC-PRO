import fs from 'fs';

let manageSubmissions = fs.readFileSync('src/pages/teacher/ManageSubmissions.tsx', 'utf8');
manageSubmissions = manageSubmissions.replace('}\\n\\n        </div>', '}');
manageSubmissions = manageSubmissions.replace(');\\n}\\n        </div>', ');\\n}');
fs.writeFileSync('src/pages/teacher/ManageSubmissions.tsx', manageSubmissions);


let manageTests = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');
manageTests = manageTests.replace('}\\n\\n        </div>', '}');
manageTests = manageTests.replace(');\\n}\\n        </div>', ');\\n}');
fs.writeFileSync('src/pages/teacher/ManageTests.tsx', manageTests);

let gradebook = fs.readFileSync('src/pages/teacher/Gradebook.tsx', 'utf8');
gradebook = gradebook.replace('}\\n\\n        </div>', '}');
gradebook = gradebook.replace(');\\n}\\n        </div>', ');\\n}');
fs.writeFileSync('src/pages/teacher/Gradebook.tsx', gradebook);

console.log("Fixed end tags");
