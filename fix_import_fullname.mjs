import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

const oldBulkUserCreate = `        const userData: any = {
          role: 'student',
          email: email,
          displayName: cleanName,
          rawPassword: password, // Store password so admin can view/edit it later
          grade: importGrade,
          className: importClassName,
          permissions: { lessons: true, tests: true },
          createdAt: new Date().toISOString()
        };`;

const newBulkUserCreate = `        const userData: any = {
          role: 'student',
          fullName: cleanName,
          email: email,
          displayName: email,
          rawPassword: password, // Store password so admin can view/edit it later
          grade: importGrade,
          className: importClassName,
          permissions: { lessons: true, tests: true },
          createdAt: new Date().toISOString()
        };`;

content = content.replace(oldBulkUserCreate, newBulkUserCreate);

fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);
