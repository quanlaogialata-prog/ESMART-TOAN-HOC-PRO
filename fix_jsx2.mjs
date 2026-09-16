import fs from 'fs';

let content = fs.readFileSync('src/pages/student/DoAssignment.tsx', 'utf8');

const target = `            </div>
          )}

            </div>
          )}

        </div>
      </main>`;

const replacement = `            </div>
          )}
        </div>
      </main>`;

content = content.replace(target, replacement);
fs.writeFileSync('src/pages/student/DoAssignment.tsx', content);
console.log('done');
