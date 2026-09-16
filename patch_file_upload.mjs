import fs from 'fs';
let code = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

const oldTextarea = `<textarea 
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Nguyễn Văn A\\nTrần Thị B\\nLê Văn C"
                ></textarea>`;

const newTextarea = `<div className="flex justify-between items-center mb-2">
                  <p className="text-xs text-gray-500">Nhập tên học sinh (hoặc chọn file Text/CSV/Excel copy), mỗi học sinh trên một dòng.</p>
                  <label className="cursor-pointer text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded border border-gray-300">
                    Tải file lên (.txt, .csv)
                    <input 
                      type="file" 
                      accept=".txt,.csv" 
                      className="hidden" 
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setImportText(ev.target?.result as string);
                          };
                          reader.readAsText(file);
                        }
                      }} 
                    />
                  </label>
                </div>
                <textarea 
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Nguyễn Văn A\\nTrần Thị B\\nLê Văn C"
                ></textarea>`;

code = code.replace(
  `<p className="text-xs text-gray-500 mb-2">Nhập tên học sinh (hoặc copy từ file Excel/Text), mỗi học sinh trên một dòng.</p>\n                <textarea \n                  value={importText}\n                  onChange={e => setImportText(e.target.value)}\n                  rows={8}\n                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"\n                  placeholder="Nguyễn Văn A\\nTrần Thị B\\nLê Văn C"\n                ></textarea>`,
  newTextarea
);

fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', code);
console.log("Patched file upload UI");
