require('dotenv').config();

const config = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
  },
  shopify: {
    webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET,
  },
  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  phone: {
    defaultCountryCode: process.env.DEFAULT_COUNTRY_CODE || '91',
  },
};

function validateConfig() {
  const required = [
    { key: 'TELEGRAM_BOT_TOKEN', value: config.telegram.botToken },
    { key: 'TELEGRAM_CHAT_ID', value: config.telegram.chatId },
    { key: 'SHOPIFY_WEBHOOK_SECRET', value: config.shopify.webhookSecret },
  ];

  const missing = required.filter((item) => !item.value);

  if (missing.length > 0) {
    const missingKeys = missing.map((item) => item.key).join(', ');
    throw new Error(`Missing required environment variables: ${missingKeys}`);
  }
}

module.exports = { config, validateConfig };
