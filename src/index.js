const express = require('express');
const { config, validateConfig } = require('./config');
const webhookRoutes = require('./routes/webhook');
const { sendTestMessage, sendOrderNotification } = require('./services/telegram');
const { generateWhatsAppLink } = require('./services/whatsapp');
const logger = require('./utils/logger');

try {
  validateConfig();
} catch (error) {
  console.error('Configuration error:', error.message);
  process.exit(1);
}

const app = express();

app.use('/webhook', express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  },
  limit: '10mb',
}));

app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/test-telegram', async (req, res) => {
  try {
    const success = await sendTestMessage();
    if (success) {
      res.json({ status: 'success', message: 'Test message sent to Telegram' });
    } else {
      res.status(500).json({ status: 'error', message: 'Failed to send test message' });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.get('/test-order', async (req, res) => {
  const sampleOrder = {
    orderId: '12345',
    orderName: '#1234',
    customerName: 'Rahul Kumar',
    phone: '+919876543210',
    email: 'rahul@example.com',
    total: '₹1,299',
    itemCount: 2,
    financialStatus: 'paid',
  };

  try {
    const whatsappResult = generateWhatsAppLink(sampleOrder.phone, sampleOrder);
    const success = await sendOrderNotification(sampleOrder, whatsappResult);
    
    if (success) {
      res.json({ 
        status: 'success', 
        message: 'Test order notification sent',
        whatsappLink: whatsappResult.link,
      });
    } else {
      res.status(500).json({ status: 'error', message: 'Failed to send notification' });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.use('/webhook', webhookRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

app.use((error, req, res, next) => {
  logger.error('Unhandled error', { error: error.message });
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = config.server.port;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Webhook: http://localhost:${PORT}/webhook/orders/create`);
  console.log(`Health: http://localhost:${PORT}/health`);
});

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));
