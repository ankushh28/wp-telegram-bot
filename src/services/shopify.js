const crypto = require('crypto');
const { config } = require('../config');

const processedOrders = new Set();

setInterval(() => {
  if (processedOrders.size > 1000) {
    const ordersArray = Array.from(processedOrders);
    const toRemove = ordersArray.slice(0, ordersArray.length - 1000);
    toRemove.forEach((id) => processedOrders.delete(id));
  }
}, 60 * 60 * 1000);

function verifyWebhookSignature(rawBody, hmacHeader) {
  if (!hmacHeader) return false;

  const generatedHash = crypto
    .createHmac('sha256', config.shopify.webhookSecret)
    .update(rawBody, 'utf8')
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(generatedHash),
    Buffer.from(hmacHeader)
  );
}

function isTestOrder(order) {
  return order.test === true || (order.source_name === 'web' && order.test);
}

function isOrderAlreadyProcessed(orderId) {
  return processedOrders.has(String(orderId));
}

function markOrderAsProcessed(orderId) {
  processedOrders.add(String(orderId));
}

function getCurrencySymbol(currency) {
  const symbols = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    AUD: 'A$',
    CAD: 'C$',
  };
  return symbols[currency] || currency + ' ';
}

function extractOrderData(order) {
  const customer = order.customer || {};
  const shippingAddress = order.shipping_address || order.billing_address || {};
  
  const phone = 
    shippingAddress.phone || 
    order.phone || 
    customer.phone || 
    order.billing_address?.phone || 
    null;

  const firstName = shippingAddress.first_name || customer.first_name || '';
  const lastName = shippingAddress.last_name || customer.last_name || '';
  const customerName = `${firstName} ${lastName}`.trim() || 'Customer';

  const currency = order.currency || 'INR';
  const currencySymbol = getCurrencySymbol(currency);
  const total = order.total_price || '0';

  return {
    orderId: order.order_number || order.id,
    orderName: order.name || `#${order.order_number}`,
    customerName,
    phone,
    email: order.email || customer.email || null,
    total: `${currencySymbol}${parseFloat(total).toLocaleString('en-IN')}`,
    currency,
    itemCount: order.line_items?.length || 0,
    createdAt: order.created_at,
    financialStatus: order.financial_status,
    fulfillmentStatus: order.fulfillment_status || 'unfulfilled',
  };
}

module.exports = {
  verifyWebhookSignature,
  isTestOrder,
  isOrderAlreadyProcessed,
  markOrderAsProcessed,
  extractOrderData,
};
