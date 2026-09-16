import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

// For handleImportStudents
const oldImportGen = `        const cleanPhone = phone ? phone.trim() : '';
        const safeName = cleanName.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]/g, '');
        const email = \`\${safeName}@toanhoc.pro\`;
        const password = \`\${safeName}123456\`;`;

const newImportGen = `        const cleanPhone = phone ? phone.trim() : '';
        const baseSafeName = cleanName.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]/g, '');
        
        let finalSafeName = baseSafeName;
        let counter = 1;
        while (
          users.some(u => u.email === \`\${finalSafeName}@toanhoc.pro\`) || 
          processedEmailsInCurrentBatch.has(\`\${finalSafeName}@toanhoc.pro\`)
        ) {
          finalSafeName = \`\${baseSafeName}\${counter}\`;
          counter++;
        }
        
        const email = \`\${finalSafeName}@toanhoc.pro\`;
        processedEmailsInCurrentBatch.add(email);
        const password = \`\${finalSafeName}123456\`;`;

// Add the Set before the loop
const oldImportInit = `      const secondAuth = getAuth(secondApp);

      for (const name of lines) {`;

const newImportInit = `      const secondAuth = getAuth(secondApp);
      const processedEmailsInCurrentBatch = new Set<string>();

      for (const name of lines) {`;

content = content.replace(oldImportInit, newImportInit);
content = content.replace(oldImportGen, newImportGen);

// For handleCreateUser (likely single add)
const oldCreateGen = `      const secondAuth = getAuth(secondApp);
      const safeUsername = newFullName.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]/g, '');
      const email = \`\${safeUsername}@toanhoc.pro\`;
      const generatedPassword = \`\${safeUsername}123456\`;`;

const newCreateGen = `      const secondAuth = getAuth(secondApp);
      const baseSafeName = newFullName.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]/g, '');
      
      let finalSafeName = baseSafeName;
      let counter = 1;
      while (users.some(u => u.email === \`\${finalSafeName}@toanhoc.pro\`)) {
        finalSafeName = \`\${baseSafeName}\${counter}\`;
        counter++;
      }
      
      const email = \`\${finalSafeName}@toanhoc.pro\`;
      const generatedPassword = \`\${finalSafeName}123456\`;`;

content = content.replace(oldCreateGen, newCreateGen);

fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);
