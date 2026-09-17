import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

// The file should end properly. Let's see what is right after 843
// 842-        </div>
// 843-      )}
// 844-
// 845-
// (junk)
// 868-      )}
// 869-
// 870-      {/* Add User Modal */}

const regex = /      \}\)\}\n\n      \n[\s\S]*?      \}\)\}\n\n      \{\/\* Add User Modal \*\/\}/;

// Wait, I can just slice the file by splitting at `      {/* Add User Modal */}` and taking the top part, but I need to make sure I don't lose anything.
// Let's just find `        </div>\n      )}\n` corresponding to line 842-843. Then from there to `      {/* Add User Modal */}` is junk.

const splitPoint = content.indexOf('      {/* Add User Modal */}');
const beforeAddModal = content.substring(0, splitPoint);
const afterAddModal = content.substring(splitPoint);

// Inside `beforeAddModal`, let's find the LAST `        </div>\n      )}\n`
const lastGoodEnd = beforeAddModal.lastIndexOf('      )}\n');
const cleanBefore = beforeAddModal.substring(0, lastGoodEnd + 8);

content = cleanBefore + "\n" + afterAddModal;
fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);
