import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ManageTeachers.tsx', 'utf8');
const topicsDataMatch = content.match(/import \{ topicsData, lessonsData, testsData \} from '..\/..\/data\/seedData';/);
console.log("Has seed data import:", topicsDataMatch !== null);
