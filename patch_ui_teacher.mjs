import fs from 'fs';
let code = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

const targetStr = `                            <button 
                              onClick={() => {
                                setAssigningTeacher(u);
                                setAssignedClasses(u.permissions?.assignedClasses || []);
                                setShowAssignModal(true);
                              }}
                              className="text-xs px-2 py-1 rounded border bg-blue-50 border-blue-200 text-blue-700 flex items-center gap-1"
                            >
                              Giao lớp ({u.permissions?.assignedClasses?.length || 0})
                            </button>`;

const newStr = targetStr + `
                            <button onClick={() => { setEditingUserPass(u); setNewPass(''); setSysError(''); }} className="text-xs px-2 py-1 rounded border bg-blue-50 border-blue-200 text-blue-700">Đổi MK</button>
                            <button onClick={() => handleDeleteUser(u)} className="text-xs px-2 py-1 rounded border bg-red-50 border-red-200 text-red-700">Xóa</button>
`;

code = code.replace(targetStr, newStr);
fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', code);
console.log("Patched Teacher Actions");
