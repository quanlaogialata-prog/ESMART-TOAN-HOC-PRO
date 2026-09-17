import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');

// Remove showDeleteDataModal and related states
content = content.replace("  const [showDeleteDataModal, setShowDeleteDataModal] = useState(false);\n  const [deleteDataGrade, setDeleteDataGrade] = useState('9');", "");

// Remove seedSystemData
content = content.replace(/  const seedSystemData = async \(\) => \{[\s\S]*?  \};\n/, "");

// Remove handleDeleteDataByGrade
content = content.replace(/  const \[isDeletingData, setIsDeletingData\] = useState\(false\);\n  const handleDeleteDataByGrade = async \(\) => \{[\s\S]*?  \};\n/, "");

// Remove importCustomLessonData
content = content.replace(/  const importCustomLessonData = async \(\) => \{[\s\S]*?  \};\n/, "");

// Remove Delete Data Modal UI
content = content.replace(/      \{\/\* Delete Data Modal \*\/\}[\s\S]*?      \}\)\}/, "");

// Remove seed data imports
content = content.replace(/import \{ topicsData, lessonsData, testsData \} from '\.\.\/\.\.\/data\/seedData';\nimport \{ chapter1Data \} from '\.\.\/\.\.\/data\/chapter1';\n/, "");

fs.writeFileSync('src/pages/admin/ManageTeachers.tsx', content);
