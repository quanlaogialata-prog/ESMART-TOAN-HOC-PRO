import fs from 'fs';

function fixScroll(filename, minWidth) {
    let content = fs.readFileSync(filename, 'utf8');
    
    // Replace the problematic wrappers
    content = content.replace(
        /<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full">\s*<div className="overflow-x-auto w-full">/g,
        '<div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full relative">\n        <div className="overflow-x-auto w-full" style={{ WebkitOverflowScrolling: "touch" }}>'
    );
    // Gradebook has a different inner div maybe
    content = content.replace(
        /<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full">\s*<div className="overflow-x-auto">/g,
        '<div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full relative">\n        <div className="overflow-x-auto w-full" style={{ WebkitOverflowScrolling: "touch" }}>'
    );
    
    // Also change table layout to fixed or whitespace-nowrap if needed, but min-w is usually enough
    content = content.replace(
        /<table className="w-full min-w-\[\d+px\] text-left border-collapse">/g,
        `<table className="w-full min-w-[${minWidth}px] text-left border-collapse whitespace-nowrap">`
    );
    
    fs.writeFileSync(filename, content);
}

fixScroll('src/pages/teacher/ManageSubmissions.tsx', 800);
fixScroll('src/pages/teacher/ManageTests.tsx', 800);
fixScroll('src/pages/teacher/Gradebook.tsx', 800);

console.log("Fixed scroll containers");
