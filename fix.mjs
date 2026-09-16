import fs from 'fs';
const top = fs.readFileSync('top.tsx', 'utf8');
const bottom = fs.readFileSync('bottom.tsx', 'utf8');

// We know top ends at `          )}` which is right after `              </div>\n            </div>\n          )}`
// We need to add the block for custom tests, then the else case for selectedGrade, then grab the rest from bottom starting at `{/* Assign Test Modal */}`

const bottomLines = bottom.split('\n');
let assignModalIndex = -1;
for (let i = 0; i < bottomLines.length; i++) {
  if (bottomLines[i].includes('{/* Assign Test Modal */}')) {
    assignModalIndex = i;
    break;
  }
}

if (assignModalIndex === -1) {
  console.log('Could not find assign modal');
  process.exit(1);
}

const restOfBottom = bottomLines.slice(assignModalIndex).join('\n');

const middle = `
          {displayedTests.filter(t => t.isCustom).length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">Đề tự tạo & tải lên</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedTests.filter(t => t.isCustom).map(t => renderTestCard(t))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-12 text-center text-gray-400 bg-white rounded-xl border border-gray-100 border-dashed">
          <p>Vui lòng chọn một khối lớp ở trên để xem kho đề kiểm tra.</p>
        </div>
      )}

      `;

const finalFile = top + middle + restOfBottom;
fs.writeFileSync('src/pages/teacher/ManageTests.tsx', finalFile);
console.log('Fixed file');
