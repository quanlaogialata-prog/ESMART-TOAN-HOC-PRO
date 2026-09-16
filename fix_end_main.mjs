import fs from 'fs';
let code = fs.readFileSync('src/pages/student/DoAssignment.tsx', 'utf8');

code = code.replace(
  '        </div>\n      </main>',
  '        </div>\n        </div>\n      </main>'
);

fs.writeFileSync('src/pages/student/DoAssignment.tsx', code);
