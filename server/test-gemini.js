const axios = require('axios');

// Test Gemini API directly
async function testGemini() {
  try {
    console.log('Testing Gemini API...');
    
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      {
        contents: [{
          parts: [{
            text: 'Summarize the following study note into 3-5 concise bullet points focusing only on key concepts:\n\nMachine learning is a subset of artificial intelligence that uses algorithms to learn from data and make predictions.'
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': 'AIzaSyAvXleiRtfwv8cEm4m6S8jmk3KRKB9Cs2k'
        },
        timeout: 30000
      }
    );

    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.log('Summary:', response.data.candidates[0].content.parts[0].text);
    } else {
      console.log('No summary found in response');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testGemini();
