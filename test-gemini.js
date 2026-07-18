const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY; // I will need to pass it or read from .env

const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

async function testGemini(modelName) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: "Hello" }] }] })
  });
  const data = await res.json();
  console.log(modelName, data.error ? data.error.message : 'OK');
}

async function run() {
  await testGemini('gemini-1.5-flash');
  await testGemini('gemini-1.5-flash-latest');
  await testGemini('gemini-1.5-pro');
}
run();
