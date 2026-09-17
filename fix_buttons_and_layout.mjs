import fs from 'fs';

// 1. Gradebook.tsx: Make buttons full width on mobile, keep flex-row on sm
let gradebook = fs.readFileSync('src/pages/teacher/Gradebook.tsx', 'utf8');
gradebook = gradebook.replace(
  '<div className="flex flex-col sm:flex-row gap-4 mb-4">',
  '<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">'
);
gradebook = gradebook.replace(
  'className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors"',
  'className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors w-full"'
);
gradebook = gradebook.replace(
  'className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg font-medium hover:bg-green-100 transition-colors"',
  'className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg font-medium hover:bg-green-100 transition-colors w-full"'
);

// Fix table wrapper to use standard standard tailwind scrollbar hiding (if any) or just ensure it's scrollable
gradebook = gradebook.replace(
  '<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">',
  '<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full">\\n        <div className="overflow-x-auto w-full">'
);
// Make sure to close the div
gradebook = gradebook.replace(
  '</table>\\n      </div>',
  '</table>\\n        </div>\\n      </div>'
);
fs.writeFileSync('src/pages/teacher/Gradebook.tsx', gradebook);


// 2. ManageSubmissions.tsx: Ensure table scrolling works
let manageSubmissions = fs.readFileSync('src/pages/teacher/ManageSubmissions.tsx', 'utf8');
manageSubmissions = manageSubmissions.replace(
  '<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">',
  '<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full">\\n        <div className="overflow-x-auto w-full">'
);

// Make sure to close the div
manageSubmissions = manageSubmissions.replace(
  '</table>\\n      </div>',
  '</table>\\n        </div>\\n      </div>'
);

// Fix buttons layout on mobile for modal
manageSubmissions = manageSubmissions.replace(
  '<div className="flex gap-3 justify-end mt-4">',
  '<div className="flex flex-col sm:flex-row gap-3 sm:justify-end mt-4">'
);
manageSubmissions = manageSubmissions.replace(
  '<div className="flex gap-3">\\n                <button',
  '<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-4 sm:mt-0">\\n                <button'
);

fs.writeFileSync('src/pages/teacher/ManageSubmissions.tsx', manageSubmissions);


console.log("Applied layout fixes");
