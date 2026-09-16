import fs from "fs";
import fetch from "node-fetch";

async function run() {
  const res = await fetch("http://localhost:3000/api/extract-questions", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ fileDataUrl: "data:application/pdf;base64,YWJj", mimeType: "application/pdf" })
  });
  console.log(res.status);
  const text = await res.text();
  console.log(text);
}
run();
