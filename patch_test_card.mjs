import fs from 'fs';
let content = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');

const regex = /<div className="mb-4">\s*<span className=\{\`text-xs font-bold px-2 py-1 rounded uppercase \$\{\s*t\.type === 'mcq'\s*\? \(t\.isCustom \? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'\)\s*: \(t\.isCustom \? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'\)\s*\}\`\}>\s*\{t\.type === 'mcq' \? 'Trắc nghiệm' : 'Tự luận'\}\s*<\/span>\s*<\/div>\s*<div className="mb-2">\s*<div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Người ra đề<\/div>\s*<div className="font-medium text-gray-800">\{t\.createdBy \|\| 'Giáo viên'\}<\/div>\s*<\/div>\s*<div className="mb-4">\s*<div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Tên đề kiểm tra<\/div>\s*<div className="font-bold text-gray-800 text-lg leading-tight">\{t\.title\}<\/div>\s*<\/div>/g;

const replacement = `<div className="mb-4 mt-2">
          <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Tên đề kiểm tra</div>
          <div className="font-bold text-gray-800 text-lg leading-tight">{t.title}</div>
        </div>
        <div className="mb-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Người ra đề</div>
          <div className="font-medium text-gray-800">{t.createdBy || 'Giáo viên'}</div>
        </div>`;

if (!content.match(regex)) {
  console.log("Could not find the target code to replace");
} else {
  content = content.replace(regex, replacement);
  fs.writeFileSync('src/pages/teacher/ManageTests.tsx', content);
  console.log("Updated test card successfully");
}
