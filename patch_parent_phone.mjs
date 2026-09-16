import fs from 'fs';
let code = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

if (!code.includes('newParentPhone')) {
  // Add state
  code = code.replace(
    "const [newClassName, setNewClassName] = useState('');",
    "const [newClassName, setNewClassName] = useState('');\n  const [newParentPhone, setNewParentPhone] = useState('');"
  );
  
  // Add to userData
  code = code.replace(
    "className: newClassName,",
    "className: newClassName,\n        parentPhone: newParentPhone,"
  );
  
  // Reset state
  code = code.replace(
    "setNewClassName('');",
    "setNewClassName('');\n      setNewParentPhone('');"
  );
  
  // Add UI for it
  const classUI = `<div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lớp</label>
                        <select 
                          value={newClassName}
                          onChange={e => setNewClassName(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="">-- Chọn lớp --</option>
                          {schoolClasses.filter(c => c.grade === newGrade).map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>`;
                    
  const newClassUI = classUI + `
                    {newRole === 'student' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SĐT Phụ huynh</label>
                        <input 
                          type="text"
                          value={newParentPhone}
                          onChange={e => setNewParentPhone(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Nhập số điện thoại Zalo của phụ huynh..."
                        />
                      </div>
                    )}`;
  code = code.replace(classUI, newClassUI);
}

// Modify import logic to support phone numbers like "Name,09123..."
if (!code.includes("const [name, phone] = line.split(',')")) {
  code = code.replace(
    "const safeName = name.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]/g, '');",
    `const [rawName, phone] = name.split(',');
        const cleanName = rawName ? rawName.trim() : 'Unknown';
        const cleanPhone = phone ? phone.trim() : '';
        const safeName = cleanName.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]/g, '');`
  );
  
  code = code.replace(
    "displayName: name,",
    "displayName: cleanName,\n          parentPhone: cleanPhone,"
  );
  
  code = code.replace(
    `Nguyễn Văn A\\nTrần Thị B\\nLê Văn C`,
    `Nguyễn Văn A, 0912345678\\nTrần Thị B, 0987654321`
  );
  
  code = code.replace(
    `Nhập tên học sinh (hoặc chọn file Text/CSV/Excel copy), mỗi học sinh trên một dòng.`,
    `Nhập "Tên học sinh, SĐT phụ huynh" (hoặc chọn file Text/CSV/Excel copy), mỗi học sinh trên 1 dòng.`
  );
}

fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', code);
console.log("Patched parent phone fields");
