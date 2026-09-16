import fs from 'fs';
let code = fs.readFileSync('src/pages/teacher/Gradebook.tsx', 'utf8');

code = code.replace(
  "const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'semester'>('week');",
  "const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'semester' | 'year'>('week');"
);

const oldGetFilteredDate = `  const getFilteredDate = () => {
    const now = new Date();
    if (timeFilter === 'week') {
      return new Date(now.setDate(now.getDate() - 7));
    } else if (timeFilter === 'month') {
      return new Date(now.setMonth(now.getMonth() - 1));
    } else {
      return new Date(now.setMonth(now.getMonth() - 4));
    }
  };`;

const newGetFilteredDate = `  const getFilteredDate = () => {
    const now = new Date();
    if (timeFilter === 'week') {
      return new Date(now.setDate(now.getDate() - 7));
    } else if (timeFilter === 'month') {
      return new Date(now.setMonth(now.getMonth() - 1));
    } else if (timeFilter === 'semester') {
      return new Date(now.setMonth(now.getMonth() - 4));
    } else {
      // Year
      return new Date(now.setFullYear(now.getFullYear() - 1));
    }
  };`;

code = code.replace(oldGetFilteredDate, newGetFilteredDate);

code = code.replace(
  `<option value="semester">Theo Học Kỳ</option>`,
  `<option value="semester">Theo Học Kỳ</option>\n            <option value="year">Cả Năm</option>`
);

code = code.replace(
  /timeFilter === 'week' \? 'Tuần' : timeFilter === 'month' \? 'Tháng' : 'Học kỳ'/g,
  "timeFilter === 'week' ? 'Tuần' : timeFilter === 'month' ? 'Tháng' : timeFilter === 'semester' ? 'Học kỳ' : 'Cả năm'"
);

code = code.replace(
  /timeFilter === 'week' \? 'Tuần này' : timeFilter === 'month' \? 'Tháng này' : 'Học kỳ'/g,
  "timeFilter === 'week' ? 'Tuần này' : timeFilter === 'month' ? 'Tháng này' : timeFilter === 'semester' ? 'Học kỳ này' : 'Cả năm'"
);

fs.writeFileSync('src/pages/teacher/Gradebook.tsx', code);
console.log("Patched Gradebook.tsx for year filter");
