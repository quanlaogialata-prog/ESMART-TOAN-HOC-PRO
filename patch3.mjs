import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes('function formatError')) {
  code = code.replace(
    'async function startServer() {',
    `function formatError(error: any) {
  const msg = String(error);
  if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
    return 'API Key đã vượt quá giới hạn lượt dùng miễn phí (Quá tải). Vui lòng đợi khoảng 1 phút rồi thử lại, hoặc thêm API Key của bạn trong phần Cài đặt.';
  }
  if (msg.includes('PERMISSION_DENIED') || msg.includes('403')) {
    return 'API Key không có quyền truy cập hoặc đã bị vô hiệu hóa. Vui lòng kiểm tra lại API Key.';
  }
  return msg;
}

async function startServer() {`
  );

  code = code.replace(/details: String\(error\)/g, 'details: formatError(error)');
  code = code.replace(/res.status\(500\).json\(\{ error: "Failed to grade essay" \}\);/g, 'res.status(500).json({ error: "Failed to grade essay", details: formatError(error) });');
  code = code.replace(/res.status\(500\).json\(\{ error: "Failed to generate test" \}\);/g, 'res.status(500).json({ error: "Failed to generate test", details: formatError(error) });');

  fs.writeFileSync('server.ts', code);
  console.log("Patched server.ts error messages");
}
