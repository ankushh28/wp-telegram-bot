# Shopify Order Notifier

Instant Telegram notifications for Shopify orders with one-click WhatsApp customer messaging.

## Overview

When a customer places an order on your Shopify store, you receive a Telegram message with order details and a clickable WhatsApp link. Click the link, WhatsApp opens with a pre-written message, and you press Send. No automation, no bots—just fast manual outreach.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│   Shopify   │────▶│  Your Server │────▶│  Telegram   │────▶│   WhatsApp   │
│   Store     │     │  (Node.js)   │     │   Bot API   │     │  Click Link  │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
      │                    │                    │                    │
   Order placed       Webhook received     Notification sent    You click & send
```

## How It Works

```
1. Customer places order on Shopify
                ↓
2. Shopify sends webhook to your server
                ↓
3. Server verifies webhook signature (security)
                ↓
4. Server extracts: customer name, phone, order total
                ↓
5. Server validates phone number, adds country code if missing
                ↓
6. Server generates WhatsApp click-to-chat URL with pre-filled message
                ↓
7. Server sends Telegram message to you with order details + WhatsApp link
                ↓
8. You receive notification on phone, click link, send message manually
```

## Project Structure

```
wp-telegram-bot/
├── src/
│   ├── index.js              # Express server, routes, startup
│   ├── config/
│   │   └── index.js          # Environment variables loader
│   ├── routes/
│   │   └── webhook.js        # POST /webhook/orders/create handler
│   ├── services/
│   │   ├── shopify.js        # Webhook verification, order data extraction
│   │   ├── telegram.js       # Send messages via Telegram Bot API
│   │   └── whatsapp.js       # Generate wa.me links with pre-filled text
│   └── utils/
│       ├── phone.js          # Phone number validation using libphonenumber
│       └── logger.js         # Simple timestamped logging
├── .env.example              # Template for environment variables
├── .gitignore
├── package.json
└── README.md
```

## Setup

### 1. Create Telegram Bot

1. Open Telegram, search for `@BotFather`
2. Send `/newbot`, follow prompts, get your bot token
3. Send any message to your new bot
4. Visit `https://api.telegram.org/bot<TOKEN>/getUpdates`
5. Find `chat.id` in the response—that's your Chat ID

### 2. Install

```bash
git clone https://github.com/ankushh28/wp-telegram-bot.git
cd wp-telegram-bot
npm install
```

### 3. Configure

Copy `.env.example` to `.env` and fill in:

```env
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
SHOPIFY_WEBHOOK_SECRET=from_shopify_admin
PORT=3000
DEFAULT_COUNTRY_CODE=91
```

### 4. Run

```bash
npm start
```

### 5. Expose to Internet

For local testing, use ngrok:

```bash
ngrok http 3000
```

### 6. Configure Shopify Webhook

1. Shopify Admin → Settings → Notifications → Webhooks
2. Create webhook:
   - Event: `Order creation`
   - URL: `https://your-domain.com/webhook/orders/create`
   - Format: JSON
3. Copy the signing secret to your `.env`

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Server health check |
| `/test-telegram` | GET | Send test message to Telegram |
| `/test-order` | GET | Simulate order notification |
| `/webhook/orders/create` | POST | Shopify webhook receiver |
| `/webhook/verify` | GET | Check webhook endpoint accessibility |

## Telegram Message Format

```
🛒 New Order Received

Order: #1234
Customer: Rahul Kumar
Amount: ₹1,299
Items: 2
Payment: ✅ Paid

📱 Phone: +91 98765 43210

👉 Send WhatsApp Message:
[Click to open WhatsApp]
```

## WhatsApp Message

When you click the link, WhatsApp opens with:

```
Hi Rahul,

Your order has been successfully received at Sorah Perfume ✨
We're preparing it with care and will update you once it's shipped.

🌐 https://www.sorahperfume.in

📸 Follow us: https://instagram.com/sorahperfume.in

Appreciate your trust in us 🤍
```

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Duplicate webhook | Ignored using order ID tracking |
| Missing phone number | Telegram notification shows warning |
| Invalid phone format | Notification sent, WhatsApp link omitted |
| Telegram API failure | Retries once, then logs error |

## Deployment

### Railway / Render

1. Push code to GitHub
2. Connect repo to Railway or Render
3. Set environment variables in dashboard
4. Deploy

### VPS with PM2

```bash
npm install -g pm2
pm2 start src/index.js --name shopify-notifier
pm2 save
pm2 startup
```

## Security

- Webhook signature verification using HMAC-SHA256
- Environment variables for all secrets
- No customer data stored permanently

## Customization

To change the WhatsApp message, edit `src/services/whatsapp.js`:

```javascript
function generateMessage(orderData) {
  const { customerName } = orderData;
  return `Hi ${customerName}, your message here...`;
}
```

## Troubleshooting

**Telegram not receiving messages**
- Verify bot token is correct
- Ensure you've messaged the bot at least once
- Check chat ID matches your conversation

**Invalid webhook signature**
- Re-copy the webhook secret from Shopify
- Check for extra spaces or newlines in `.env`

**Phone numbers not working**
- Set correct `DEFAULT_COUNTRY_CODE` in `.env`
- Indian numbers should be 10 digits (without 0 prefix)

## License

MIT