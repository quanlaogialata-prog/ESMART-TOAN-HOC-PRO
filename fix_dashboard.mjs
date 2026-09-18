import fs from 'fs';

let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

content = content.replace("import { PWAInstallButton } from '../components/PWAInstallButton';\n", "");
content = content.replace("          <PWAInstallButton />\n", "");

fs.writeFileSync('src/pages/Dashboard.tsx', content);
