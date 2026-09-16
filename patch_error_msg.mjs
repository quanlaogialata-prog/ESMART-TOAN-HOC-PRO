import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const searchExt = `      if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("Quota exceeded") || errStr.includes("429")) {
          errMsg = "Hệ thống AI đang quá tải (Hết lượt sử dụng). Vui lòng thử lại sau 1 phút, hoặc nhập API Key cá nhân của bạn trong mục Cài đặt.";
      }`;
const replaceExt = `      if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("Quota exceeded") || errStr.includes("429")) {
          if (req.headers['x-gemini-api-key']) {
              errMsg = "API Key CÁ NHÂN của bạn đã hết lượt dùng miễn phí. Vui lòng thử lại sau 1 phút (Google giới hạn 15 lần/phút).";
          } else {
              errMsg = "Hệ thống AI đang quá tải (Hết lượt sử dụng). Vui lòng thử lại sau 1 phút, hoặc nhập API Key cá nhân của bạn trong mục Cài đặt.";
          }
      }`;

content = content.replace(searchExt, replaceExt); // extract-questions

// Also replace the other two occurrences (recognize-handwriting, generate-explanations)
content = content.replace(searchExt, replaceExt);
content = content.replace(searchExt, replaceExt);

fs.writeFileSync('server.ts', content);
console.log("Patched error messages to distinguish custom key");
