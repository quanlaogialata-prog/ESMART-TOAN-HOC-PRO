import fetch from "node-fetch";

async function run() {
  const res = await fetch("http://localhost:3000/api/generate-test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      title: "Test Math", 
      grade: 10, 
      autoGenType: "mcq", 
      mcqCount: 2, 
      essayCount: 0 
    })
  });
  console.log(res.status);
  const text = await res.text();
  console.log(text);
}
run();
