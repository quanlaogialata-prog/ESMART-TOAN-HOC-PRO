let content = "a) Đồ thị hàm số y = ax + b đi qua điểm A(1; -1) và B(4; 5) nên ta có hệ phương trình: \\begin{cases} a(1) + b = -1 \\\\ a(4) + b = 5 \\end{cases} \\Leftrightarrow $$\\begin{cases} a + b = -1 \\\\ 4a + b = 5 \\end{cases} Trừ từng vế";

let safeContent = content || "";

// 1. Remove $ around \begin and \end
safeContent = safeContent.replace(/\$*\\begin\{([a-zA-Z*]+)\}([\s\S]*?)\\end\{\1\}\$*/g, (match, p1, p2) => {
  return `$$\\begin{${p1}}${p2}\\end{${p1}}$$`;
});

console.log("safeContent:", safeContent);
