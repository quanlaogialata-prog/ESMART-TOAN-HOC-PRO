import fs from 'fs';
let code = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

const originalActions2 = `                            <button 
                              onClick={() => {
                                setAssigningTeacher(u);
                                setAssignedClasses(u.permissions?.assignedClasses || []);
                                setShowAssignModal(true);
                              }}
                              className="text-xs px-2 py-1 rounded border bg-blue-50 border-blue-200 text-blue-700 flex items-center gap-1"
                            >
                              Giao Lớp
                            </button>`;

const newActions2 = originalActions2 + `
                            <button onClick={() => { setEditingUserPass(u); setNewPass(''); setSysError(''); }} className="text-xs px-2 py-1 rounded border bg-blue-50 border-blue-200 text-blue-700">Đổi MK</button>
                            <button onClick={() => handleDeleteUser(u)} className="text-xs px-2 py-1 rounded border bg-red-50 border-red-200 text-red-700">Xóa</button>
`;

code = code.replace(originalActions2, newActions2);
fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', code);
console.log("Patched UI 2");
