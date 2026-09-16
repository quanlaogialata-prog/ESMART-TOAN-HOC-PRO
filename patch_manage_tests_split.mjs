import fs from 'fs';

let content = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');

const regex = /if \(splitAnswers && extractionFileUrl\) \{[\s\S]*?\} else if \(newAnswerFile\) \{/;

const replacement = `if (splitAnswers && extractionFileUrl) {
           setSysMsg('Đang dùng AI để phân tích và tách riêng Đề bài / Đáp án... Vui lòng chờ (có thể mất 15-30s)...');
           try {
              const splitRes = await fetch('/api/split-document', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json', 'x-gemini-api-key': localStorage.getItem('gemini_api_key') || '' },
                 body: JSON.stringify({ fileDataUrl: extractionFileUrl, mimeType: newFile.type })
              });
              if (splitRes.ok) {
                 const splitData = await splitRes.json();
                 if (splitData.cleanTestHtml && splitData.answersHtml) {
                    // Convert HTML string to Base64 to store as data URL
                    const encodeBase64 = (str: string) => btoa(unescape(encodeURIComponent(str)));
                    testData.fileUrl = "data:text/html;base64," + encodeBase64("<!DOCTYPE html><html><head><meta charset='utf-8'><title>Đề thi</title><script type='text/javascript' async src='https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js?config=TeX-MML-AM_CHTML'></script></head><body style='font-family: Arial; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto;'>" + splitData.cleanTestHtml + "</body></html>");
                    testData.fileName = "de_thi_sach.html";
                    testData.answerFileUrl = "data:text/html;base64," + encodeBase64("<!DOCTYPE html><html><head><meta charset='utf-8'><title>Đáp án</title><script type='text/javascript' async src='https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js?config=TeX-MML-AM_CHTML'></script></head><body style='font-family: Arial; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto;'>" + splitData.answersHtml + "</body></html>");
                    testData.answerFileName = "dap_an_chi_tiet.html";
                 } else {
                    setSysError('AI không thể tự động tách được Đề và Đáp án từ file này. Vui lòng bỏ tích chọn tách tự động, hoặc tự tách thành 2 file riêng biệt trên máy của bạn rồi tải lên.');
                    setIsSaving(false);
                    return;
                 }
              } else {
                 setSysError('Lỗi máy chủ khi tách đề.');
                 setIsSaving(false);
                 return;
              }
           } catch(e) {
              console.error("Split error", e);
              setSysError('Lỗi kết nối khi tách đề.');
              setIsSaving(false);
              return;
           }
        } else if (newAnswerFile) {`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/pages/teacher/ManageTests.tsx', content);
console.log("Patched ManageTests");
