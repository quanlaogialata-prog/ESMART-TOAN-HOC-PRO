import fs from 'fs';

function fixFile(path) {
    let content = fs.readFileSync(path, 'utf8');
    
    // Remove all trailing } on their own line after a return ); } block
    let lines = content.split('\\n');
    let newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        // If we found the final closing brace for the component
        if (lines[i] === '}') {
            if (i < lines.length - 1 && (lines[i+1] === '' || lines[i+1] === '}' || lines[i+1] === '  }')) {
                // Ignore extra stuff at end
            } else if (i === lines.length - 1) {
                newLines.push(lines[i]);
            } else {
                newLines.push(lines[i]);
            }
        } else {
            newLines.push(lines[i]);
        }
    }
    
    // Simplest fix: Just find the last ");", then the last "}", and truncate there.
    let code = content.trim();
    while (code.endsWith('}')) {
        code = code.substring(0, code.length - 1).trim();
    }
    
    // Put exactly one } at the end
    code = code + '\\n}';
    
    fs.writeFileSync(path, code);
}

fixFile('src/pages/teacher/ManageSubmissions.tsx');
fixFile('src/pages/teacher/ManageTests.tsx');
fixFile('src/pages/teacher/Gradebook.tsx');
console.log("Fixed files");
