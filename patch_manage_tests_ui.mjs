import fs from 'fs';

let content = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');

const uiInjection = `
              {creatingType === 'essay' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tệp ĐỀ BÀI (PDF, Word, Ảnh...)</label>
                    <input
                      type="file"
                      onChange={(e) => setNewFile(e.target.files ? e.target.files[0] : null)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    />
                    <p className="text-xs text-gray-500 mt-1">Chọn tệp đề bài từ máy tính của bạn.</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="splitAnswers"
                      checked={splitAnswers}
                      onChange={(e) => setSplitAnswers(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300"
                    />
                    <label htmlFor="splitAnswers" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Tệp này chứa CẢ ĐỀ VÀ ĐÁP ÁN (Hệ thống tự động tách)
                    </label>
                  </div>

                  {!splitAnswers && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tệp ĐÁP ÁN (Biểu điểm/lời giải) - Không bắt buộc</label>
                      <input
                        type="file"
                        onChange={(e) => setNewAnswerFile(e.target.files ? e.target.files[0] : null)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      />
                      <p className="text-xs text-gray-500 mt-1">Học sinh chỉ thấy file này SAU KHI nộp bài. Nếu bỏ trống, hệ thống sẽ dùng AI để sinh đáp án từ đề bài.</p>
                    </div>
                  )}
                </div>
              )}`;

const blockToReplaceRegex = /\{creatingType === 'essay' && \([\s\S]*?<\p className="text-xs text-gray-500 mt-1">Chọn tệp từ máy tính hoặc điện thoại của bạn\.<\/p>\s*<\/div>\s*\)\}/;

content = content.replace(blockToReplaceRegex, uiInjection);
fs.writeFileSync('src/pages/teacher/ManageTests.tsx', content);
console.log("UI added");
