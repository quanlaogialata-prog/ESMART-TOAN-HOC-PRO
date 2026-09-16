import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const regex = /(if\s*\([^\{]*RESOURCE_EXHAUSTED[\s\S]*?\)\s*\{)([\s\S]*?errMsg\s*=\s*"Hệ thống AI đang quá tải[\s\S]*?;)(\s*\})/g;

content = content.replace(regex, `$1
          if (req.headers['x-gemini-api-key']) {
              errMsg = "API Key CÁ NHÂN của bạn đã hết lượt dùng miễn phí. Vui lòng thử lại sau 1 phút (Google giới hạn 15 lần/phút).";
          } else {
$2
          }
$3`);

fs.writeFileSync('server.ts', content);
console.log("Patched all errors");
