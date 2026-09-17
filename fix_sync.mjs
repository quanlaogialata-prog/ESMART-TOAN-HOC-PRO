import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

const oldSync = `      let secondApp = null;
      try {
        secondApp = initializeApp(firebaseConfig, 'SecondaryAppSync' + Date.now());
      } catch (e) {
        secondApp = getApp('SecondaryAppSync' + Date.now());
      }
      const secondAuth = getAuth(secondApp);`;

const newSync = `      const appName = 'SecondaryAppSync_' + Date.now();
      const secondApp = initializeApp(firebaseConfig, appName);
      const secondAuth = getAuth(secondApp);`;

content = content.replace(oldSync, newSync);

const cleanupRegex = /setSysMsg\(\`Đồng bộ hoàn tất! Cập nhật thành công: \$\{successCount\}, Lỗi\/Bỏ qua: \$\{failCount\}\`\);\s*loadData\(\);\s*\} catch \(err: any\) \{/;
const cleanupReplacement = `setSysMsg(\`Đồng bộ hoàn tất! Cập nhật thành công: \${successCount}, Bỏ qua/Lỗi: \${failCount}\`);
      loadData();
      try { await deleteApp(secondApp); } catch(e) {}
    } catch (err: any) {`;

content = content.replace(cleanupRegex, cleanupReplacement);

fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);
console.log('Fixed sync initialization and cleanup');
