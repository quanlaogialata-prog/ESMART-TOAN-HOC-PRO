import fs from 'fs';

let content = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');

const effectRegex = /useEffect\(\(\) => \{\n\s*loadData\(\);\n\s*\}, \[\]\);/g;
const effectReplace = `useEffect(() => {
    if (user) loadData();
  }, [user]);`;

content = content.replace(effectRegex, effectReplace);

const loadRegex = /const loadData = async \(\) => \{/g;
const loadReplace = `const loadData = async () => {
    try {`;

content = content.replace(loadRegex, loadReplace);

const loadEndRegex = /setLoading\(false\);\n  \};/g;
const loadEndReplace = `setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };`;
content = content.replace(loadEndRegex, loadEndReplace);

fs.writeFileSync('src/pages/teacher/ManageTests.tsx', content);

let contentSub = fs.readFileSync('src/pages/teacher/ManageSubmissions.tsx', 'utf8');
const effectRegexSub = /useEffect\(\(\) => \{\n\s*fetchData\(\);\n\s*\}, \[\]\);/g;
const effectReplaceSub = `useEffect(() => {
    if (user) fetchData();
  }, [user]);`;
contentSub = contentSub.replace(effectRegexSub, effectReplaceSub);

fs.writeFileSync('src/pages/teacher/ManageSubmissions.tsx', contentSub);

console.log("Fixed useEffect and try-catch");
