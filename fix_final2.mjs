import fs from 'fs';

function fixFile(path) {
    let content = fs.readFileSync(path, 'utf8');
    
    // There was a literal "\n" strings added somewhere? Let's check
    content = content.replace(/\\n/g, '\n');
    
    // Find the last ");" which is the end of the return statement
    let lastParenSemi = content.lastIndexOf(');');
    if (lastParenSemi !== -1) {
        // Cut everything after ); and replace with just one }
        let clean = content.substring(0, lastParenSemi + 2) + '\n}\n';
        fs.writeFileSync(path, clean);
    }
}

fixFile('src/pages/teacher/ManageSubmissions.tsx');
fixFile('src/pages/teacher/ManageTests.tsx');
fixFile('src/pages/teacher/Gradebook.tsx');
console.log("Fixed files again");
