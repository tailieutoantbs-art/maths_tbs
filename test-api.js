

async function testApi() {
  try {
    const res = await fetch('http://localhost:3000/api/plan-assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planType: 'APPENDIX3',
        inputData: 'Test topic: Hàm số bậc hai',
        referenceSource: 'SGK',
        locale: 'en',
      }),
    });
    
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
  } catch (err) {
    console.error('Error:', err);
  }
}

testApi();
