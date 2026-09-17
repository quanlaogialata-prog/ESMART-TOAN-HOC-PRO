import fs from 'fs';

// Fix Gradebook.tsx
let gradebook = fs.readFileSync('src/pages/teacher/Gradebook.tsx', 'utf8');

// Fix buttons wrapper
gradebook = gradebook.replace(
  '<div className="flex gap-4 mb-4">',
  '<div className="flex flex-col sm:flex-row gap-4 mb-4">'
);

// Fix table overflow
gradebook = gradebook.replace(
  '<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">\\n        <table className="w-full text-left border-collapse">',
  '<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">\\n        <table className="w-full min-w-[600px] text-left border-collapse">'
);

// Fix PDF modal max height and scroll
gradebook = gradebook.replace(
  '<div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">\\n            <div className="p-6">',
  '<div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] shadow-xl overflow-y-auto flex flex-col">\\n            <div className="p-6">'
);

fs.writeFileSync('src/pages/teacher/Gradebook.tsx', gradebook);

// Fix ManageSubmissions.tsx
let manageSubmissions = fs.readFileSync('src/pages/teacher/ManageSubmissions.tsx', 'utf8');

// Fix table overflow
manageSubmissions = manageSubmissions.replace(
  '<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">\\n        <table className="w-full text-left border-collapse">',
  '<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">\\n        <table className="w-full min-w-[600px] text-left border-collapse">'
);

fs.writeFileSync('src/pages/teacher/ManageSubmissions.tsx', manageSubmissions);

// Fix ManageTests.tsx (Just in case)
let manageTests = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');
manageTests = manageTests.replace(
  '<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">\\n        <table className="w-full text-left border-collapse">',
  '<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">\\n        <table className="w-full min-w-[600px] text-left border-collapse">'
);
fs.writeFileSync('src/pages/teacher/ManageTests.tsx', manageTests);


console.log("Fixed layouts");
