const aiService = require('./services/aiService');

// Test local summarization
async function testSummarization() {
  try {
    console.log('Testing local summarization...');
    console.log('AI Provider:', process.env.AI_PROVIDER);
    
    const testText = "Machine learning is a subset of artificial intelligence that uses algorithms to learn from data and make predictions. It involves training models on datasets to recognize patterns and make decisions without explicit programming.";
    
    console.log('Input text:', testText);
    
    const summary = await aiService.summarize(testText);
    
    console.log('Generated summary:', summary);
    console.log('Test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testSummarization();
