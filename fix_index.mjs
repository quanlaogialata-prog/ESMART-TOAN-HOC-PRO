import fs from 'fs';

let content = fs.readFileSync('index.html', 'utf8');

content = content.replace(
  '<head>',
  '<head>\n    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />\n    <meta http-equiv="Pragma" content="no-cache" />\n    <meta http-equiv="Expires" content="0" />'
);

fs.writeFileSync('index.html', content);
