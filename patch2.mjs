import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
`      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash", // use pro for better reasoning and parsing
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || "application/pdf",
                  data: base64Data
                }
              },
              { text: prompt }
            ]
          }
        ]
      });`,
`      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: [{ role: "user", parts: [{ inlineData: { mimeType: mimeType || "application/pdf", data: base64Data } }, { text: prompt }] }]
        });
      } catch (e) {
        response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: [{ role: "user", parts: [{ inlineData: { mimeType: mimeType || "application/pdf", data: base64Data } }, { text: prompt }] }]
        });
      }`
);

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts split-document");
