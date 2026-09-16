import fetch from "node-fetch";
import fs from "fs";

async function run() {
  const fileDataUrl = "data:text/plain;base64," + Buffer.from("Test exam question 1: 1+1=2. Option A: 2, Option B: 3. Correct is A.").toString("base64");
  const res = await fetch("http://localhost:3000/api/extract-questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      fileDataUrl, 
      mimeType: "text/plain" 
    })
  });
  console.log(res.status);
  const text = await res.text();
  console.log(text);
}
run();
