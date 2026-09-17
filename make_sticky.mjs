import fs from 'fs';

// 1. ManageSubmissions.tsx
let manageSubmissions = fs.readFileSync('src/pages/teacher/ManageSubmissions.tsx', 'utf8');

// Header
manageSubmissions = manageSubmissions.replace(
  '<th className="p-4 font-semibold text-center">Thao tác</th>',
  '<th className="p-4 font-semibold text-center sticky right-0 bg-gray-100 z-10 shadow-[-12px_0_15px_-5px_rgba(0,0,0,0.05)] border-l border-gray-200">Thao tác</th>'
);

// Cell
manageSubmissions = manageSubmissions.replace(
  '<td className="p-4 text-center">',
  '<td className="p-4 text-center sticky right-0 bg-white z-10 shadow-[-12px_0_15px_-5px_rgba(0,0,0,0.05)] border-l border-gray-100 group-hover:bg-gray-50">'
);
// In case hover style doesn't inherit to sticky cells, I added group-hover:bg-gray-50
manageSubmissions = manageSubmissions.replace(
  '<tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50">',
  '<tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50 group">'
);

fs.writeFileSync('src/pages/teacher/ManageSubmissions.tsx', manageSubmissions);

// 2. ManageTests.tsx (Lịch sử giao bài has actions too)
let manageTests = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');

manageTests = manageTests.replace(
  '<th className="p-4 font-semibold text-right">Thao tác</th>',
  '<th className="p-4 font-semibold text-right sticky right-0 bg-gray-100 z-10 shadow-[-12px_0_15px_-5px_rgba(0,0,0,0.05)] border-l border-gray-200">Thao tác</th>'
);
manageTests = manageTests.replace(
  '<td className="p-4 text-right">',
  '<td className="p-4 text-right sticky right-0 bg-white z-10 shadow-[-12px_0_15px_-5px_rgba(0,0,0,0.05)] border-l border-gray-100 group-hover:bg-gray-50">'
);
manageTests = manageTests.replace(
  '<tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">',
  '<tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50 group">'
);

fs.writeFileSync('src/pages/teacher/ManageTests.tsx', manageTests);


// 3. Gradebook.tsx (Sổ điểm doesn't have actions, but maybe we should make it scrollable nicely with a visual hint)
let gradebook = fs.readFileSync('src/pages/teacher/Gradebook.tsx', 'utf8');

// For gradebook, the last column is "Điểm TB" maybe we can just add a message below the table for mobile
if (!gradebook.includes("Vuốt ngang để xem thêm")) {
  gradebook = gradebook.replace(
    '</table>\\n        </div>\\n      </div>',
    '</table>\\n        </div>\\n      </div>\\n      <div className="mt-2 text-center text-xs text-gray-500 sm:hidden">👈 Vuốt ngang bảng để xem thêm dữ liệu 👉</div>'
  );
}

fs.writeFileSync('src/pages/teacher/Gradebook.tsx', gradebook);

console.log("Made actions sticky");
