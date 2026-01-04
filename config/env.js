require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  userId: process.env.USER_ID,
  customerApiUrl: `https://contactapi.static.fyi/lead/receive/fake/${process.env.USER_ID}/`,
  apiToken: process.env.FAKE_CUSTOMER_TOKEN,
  openaiKey: process.env.OPENAI_API_KEY,
};
