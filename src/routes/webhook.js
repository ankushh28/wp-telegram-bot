const express = require('express');
const router = express.Router();

const {
  verifyWebhookSignature,
  isTestOrder,
  isOrderAlreadyProcessed,
  markOrderAsProcessed,
  extractOrderData,
} = require('../services/shopify');
const { generateWhatsAppLink } = require('../services/whatsapp');
const { sendOrderNotification } = require('../services/telegram');
const logger = require('../utils/logger');

router.post('/orders/create', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const hmacHeader = req.headers['x-shopify-hmac-sha256'];
    
    if (!verifyWebhookSignature(req.rawBody, hmacHeader)) {
      logger.warn('Invalid webhook signature received');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const order = req.body;
    const orderId = order.id || order.order_number;

    logger.info(`Received order webhook: ${orderId}`);

    if (isOrderAlreadyProcessed(orderId)) {
      logger.info(`Duplicate webhook ignored: ${orderId}`);
      return res.status(200).json({ status: 'ignored', reason: 'duplicate' });
    }

    markOrderAsProcessed(orderId);

    const orderData = extractOrderData(order);
    const whatsappResult = generateWhatsAppLink(orderData.phone, orderData);

    res.status(200).json({ 
      status: 'received',
      orderId: orderData.orderId,
    });

    const telegramSuccess = await sendOrderNotification(orderData, whatsappResult);
    
    const duration = Date.now() - startTime;
    logger.info(`Order ${orderId} processed in ${duration}ms, Telegram: ${telegramSuccess ? 'sent' : 'failed'}`);

  } catch (error) {
    logger.error('Error processing order webhook', { error: error.message });
    return res.status(200).json({ status: 'error_logged' });
  }
});

router.get('/verify', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Webhook endpoint is accessible',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
