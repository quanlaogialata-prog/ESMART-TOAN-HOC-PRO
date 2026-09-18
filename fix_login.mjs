import fs from 'fs';

let content = fs.readFileSync('src/pages/Login.tsx', 'utf8');

content = content.replace("import { PWAInstallButton } from '../components/PWAInstallButton';\n", "");
content = content.replace(/<div className="flex flex-col h-screen items-center justify-center bg-gray-50 p-4 gap-4">\s*<PWAInstallButton \/>/, '<div className="flex h-screen items-center justify-center bg-gray-50">');

fs.writeFileSync('src/pages/Login.tsx', content);
