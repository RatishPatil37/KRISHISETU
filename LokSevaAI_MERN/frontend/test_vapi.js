const axios = require('axios');

const testCombination = (publicKey, assistantId) => {
  return axios.post('https://api.vapi.ai/call/web', 
    { assistantId }, 
    { headers: { 'Authorization': `Bearer ${publicKey}`, 'Content-Type': 'application/json' } }
  ).then(res => console.log(`SUCCESS | Public: ${publicKey} | Assistant: ${assistantId}`))
   .catch(err => console.error(`FAILED | Public: ${publicKey} | Assistant: ${assistantId} | Msg: ${err.response?.data?.message || err.message}`));
};

const keys = [
  '77ae3d95-2311-432d-b601-85f52a568ded',
  'f71004a5-4cfe-49f6-a1e1-de500c7b9f75',
  '332d2014-a377-4efd-9787-3daaca164acf'
];

async function runTests() {
  for (const pub of keys) {
    for (const ast of keys) {
      if (pub === ast) continue;
      await testCombination(pub, ast);
    }
  }
}

runTests();
