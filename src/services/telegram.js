const TelegramBot = require('node-telegram-bot-api');
const { config } = require('../config');

let bot = null;

function initializeBot() {
  if (!bot) {
    bot = new TelegramBot(config.telegram.botToken, { polling: false });
  }
  return bot;
}

async function sendMessageWithRetry(message, options = {}, retries = 1) {
  const telegramBot = initializeBot();
  
  const defaultOptions = {
    parse_mode: 'HTML',
    disable_web_page_preview: false,
  };

  const messageOptions = { ...defaultOptions, ...options };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await telegramBot.sendMessage(
        config.telegram.chatId,
        message,
        messageOptions
      );
      return true;
    } catch (error) {
      console.error(`Telegram send attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt === retries) {
        console.error('All Telegram send attempts failed');
        return false;
      }
      
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  
  return false;
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatStatus(status) {
  const statusMap = {
    pending: '⏳ Pending',
    authorized: '✅ Authorized',
    partially_paid: '💰 Partially Paid',
    paid: '✅ Paid',
    partially_refunded: '↩️ Partially Refunded',
    refunded: '↩️ Refunded',
    voided: '❌ Voided',
  };
  return statusMap[status] || status || 'Unknown';
}

function formatOrderNotification(orderData, whatsappResult) {
  const { orderName, orderId, customerName, total, itemCount, financialStatus } = orderData;

  let message = `🛒 <b>New Order Received</b>\n\n`;
  message += `<b>Order:</b> ${orderName || '#' + orderId}\n`;
  message += `<b>Customer:</b> ${escapeHtml(customerName)}\n`;
  message += `<b>Amount:</b> ${total}\n`;
  message += `<b>Items:</b> ${itemCount}\n`;
  message += `<b>Payment:</b> ${formatStatus(financialStatus)}\n`;
  message += `\n`;

  if (whatsappResult.success) {
    message += `📱 <b>Phone:</b> ${whatsappResult.phoneDisplay}\n\n`;
    message += `👉 <b>Send WhatsApp Message:</b>\n`;
    message += `<a href="${whatsappResult.link}">Click to open WhatsApp</a>\n`;
    
    if (whatsappResult.isMobile === false) {
      message += `\n⚠️ <i>Note: Number may be a landline</i>`;
    }
  } else {
    message += `\n⚠️ <b>WhatsApp not available</b>\n`;
    message += `<i>${whatsappResult.error || 'Phone number missing or invalid'}</i>\n`;
    
    if (orderData.email) {
      message += `\n📧 <b>Email:</b> ${escapeHtml(orderData.email)}`;
    }
  }

  return message;
}

async function sendOrderNotification(orderData, whatsappResult) {
  const message = formatOrderNotification(orderData, whatsappResult);
  console.log(`Sending Telegram notification for order ${orderData.orderId}...`);
  
  const success = await sendMessageWithRetry(message);
  
  if (success) {
    console.log(`Telegram notification sent for order ${orderData.orderId}`);
  } else {
    console.error(`Failed to send Telegram notification for order ${orderData.orderId}`);
  }
  
  return success;
}

async function sendTestMessage() {
  const message = `🤖 <b>Bot Test</b>\n\nYour Shopify-Telegram notifier is working correctly!\n\nTimestamp: ${new Date().toISOString()}`;
  return sendMessageWithRetry(message);
}

module.exports = {
  initializeBot,
  sendOrderNotification,
  sendTestMessage,
  formatOrderNotification,
};
