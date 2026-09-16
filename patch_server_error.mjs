import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

// The replacement logic:
const oldLogic = `      if (errStr.includes("403") || errStr.includes("denied access") || errStr.includes("permission_denied")) {
          errMsg = "Khóa API đã hết hạn hoặc bị từ chối truy cập (Lỗi 403). Hãy cập nhật hoặc sử dụng API Key cá nhân trong phần Settings.";
      }
      res.status(500).json({ error: errMsg, details: errStr });`;

const newLogic = `      if (errStr.includes("403") || errStr.includes("denied access") || errStr.includes("permission_denied")) {
          errMsg = "Khóa API đã hết hạn hoặc bị từ chối truy cập (Lỗi 403). Hãy cập nhật hoặc sử dụng API Key cá nhân trong phần Settings.";
      } else if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("Quota exceeded") || errStr.includes("429")) {
          errMsg = "Hệ thống AI đang quá tải (Hết lượt sử dụng). Vui lòng thử lại sau 1 phút, hoặc nhập API Key cá nhân của bạn trong mục Cài đặt.";
      }
      res.status(500).json({ error: errMsg });`; // omit details to prevent huge ugly string in UI

content = content.replace(new RegExp(oldLogic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newLogic);

const oldLogic2 = `      res.status(500).json({ error: "Failed to recognize handwriting", details: error.message });`;
const newLogic2 = `      let errMsg = "Failed to recognize handwriting";
      const errStr = error.message || String(error);
      if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("Quota exceeded") || errStr.includes("429")) {
          errMsg = "Hệ thống AI đang quá tải (Hết lượt sử dụng). Vui lòng thử lại sau 1 phút, hoặc nhập API Key cá nhân của bạn trong mục Cài đặt.";
      }
      res.status(500).json({ error: errMsg });`;
content = content.replace(oldLogic2, newLogic2);

const oldLogic3 = `      res.status(500).json({ error: "Failed to generate explanations", details: error.message });`;
const newLogic3 = `      let errMsg = "Failed to generate explanations";
      const errStr = error.message || String(error);
      if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("Quota exceeded") || errStr.includes("429")) {
          errMsg = "Hệ thống AI đang quá tải (Hết lượt sử dụng). Vui lòng thử lại sau 1 phút, hoặc nhập API Key cá nhân của bạn trong mục Cài đặt.";
      }
      res.status(500).json({ error: errMsg });`;
content = content.replace(oldLogic3, newLogic3);


fs.writeFileSync('server.ts', content);
console.log("Patched server.ts");
