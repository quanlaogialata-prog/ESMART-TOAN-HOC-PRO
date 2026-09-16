let str = "a(1) + b = -1 \\\\ a(4) + b = 5 \\end{cases} Leftrightarrow \\begin{cases} a+b=-1";
let str2 = "2x + 2 /= 0\\Leftrightarrowx /= -1";
let str3 = "1\\Rightarrow-4a+3";
let str4 = "x \\ne 0";

let safeContent = str + "\n" + str2 + "\n" + str3 + "\n" + str4;

// 1. Fix missing backslashes on arrows
safeContent = safeContent.replace(/(?<!\\)\b(Leftrightarrow|Rightarrow|Leftarrow|rightarrow|leftarrow)\b/g, '\\$1');

// 2. Fix arrows glued to text/numbers
safeContent = safeContent.replace(/\\(Leftrightarrow|Rightarrow|Leftarrow|rightarrow|leftarrow)([a-zA-Z0-9\-])/g, '\\$1 $2');
safeContent = safeContent.replace(/([a-zA-Z0-9\-])\\(Leftrightarrow|Rightarrow|Leftarrow|rightarrow|leftarrow)/g, '$1 \\$2');

// 3. Convert /= to \neq
safeContent = safeContent.replace(/\/\=/g, '\\neq ');

console.log(safeContent);
