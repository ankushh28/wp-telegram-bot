const { validateAndFormatPhone } = require('../utils/phone');

function generateMessage(orderData) {
  const { customerName } = orderData;
  
  return `Hi ${customerName},

Your order has been successfully received at Sorah Perfume ✨
We're preparing it with care and will update you once it's shipped.

🌐 https://www.sorahperfume.in

📸 Follow us: https://instagram.com/sorahperfume.in

Appreciate your trust in us 🤍`;
}

function generateWhatsAppLink(phone, orderData) {
  const phoneResult = validateAndFormatPhone(phone);

  if (!phoneResult.isValid) {
    return {
      success: false,
      link: null,
      error: phoneResult.error || 'Invalid phone number',
      phoneDisplay: phoneResult.display,
    };
  }

  const message = generateMessage(orderData);
  const encodedMessage = encodeURIComponent(message);
  const link = `https://wa.me/${phoneResult.formatted}?text=${encodedMessage}`;

  if (link.length > 2000) {
    const shortMessage = `Hi ${orderData.customerName}, thanks for your order at Sorah Perfume!`;
    const shortLink = `https://wa.me/${phoneResult.formatted}?text=${encodeURIComponent(shortMessage)}`;
    
    return {
      success: true,
      link: shortLink,
      error: null,
      phoneDisplay: phoneResult.display,
      isMobile: phoneResult.isMobile,
    };
  }

  return {
    success: true,
    link: link,
    error: null,
    phoneDisplay: phoneResult.display,
    isMobile: phoneResult.isMobile,
  };
}

function generateWhatsAppBaseLink(phone) {
  const phoneResult = validateAndFormatPhone(phone);

  if (!phoneResult.isValid) {
    return {
      success: false,
      link: null,
      error: phoneResult.error || 'Invalid phone number',
      phoneDisplay: phoneResult.display,
    };
  }

  return {
    success: true,
    link: `https://wa.me/${phoneResult.formatted}`,
    error: null,
    phoneDisplay: phoneResult.display,
    isMobile: phoneResult.isMobile,
  };
}

module.exports = {
  generateWhatsAppLink,
  generateWhatsAppBaseLink,
  generateMessage,
};
