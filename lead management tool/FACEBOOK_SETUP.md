# Facebook Lead Ads Integration Setup

This guide will help you connect your Facebook Lead Ads to automatically import leads into your Lead Management System.

## Prerequisites

1. A Facebook Business account
2. A Facebook Page
3. A Facebook Ad account
4. A public URL for your webhook (see options below)

## Step 1: Start Your Backend Server

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up your webhook verification token (optional but recommended):
   ```bash
   export FACEBOOK_VERIFY_TOKEN=your_secret_token_here
   ```

3. Start the server:
   ```bash
   npm run server
   ```

   The server will run on `http://localhost:3001`

## Step 2: Expose Your Webhook to the Internet

Facebook needs to reach your webhook from the internet. You have several options:

### Option A: Use ngrok (Recommended for Testing)

1. Install ngrok: https://ngrok.com/download
2. In a new terminal, run:
   ```bash
   ngrok http 3001
   ```
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. Your webhook URL will be: `https://abc123.ngrok.io/webhook/facebook`

### Option B: Deploy to a Cloud Service

Deploy your server to:
- **Vercel** (serverless functions)
- **Heroku**
- **Railway**
- **Render**
- **DigitalOcean App Platform**

Update the `apiUrl` in `src/LeadFollowUpManager.svelte` to match your deployed URL.

### Option C: Use a Webhook Proxy Service

Services like:
- **Zapier** (can forward Facebook webhooks)
- **Make.com** (formerly Integromat)
- **n8n**

## Step 3: Configure Facebook Lead Ads Webhook

1. Go to [Facebook Events Manager](https://business.facebook.com/events_manager2)
2. Select your Pixel or Data Source
3. Go to **Settings** → **Webhooks**
4. Click **Add Webhook**
5. Enter your webhook URL: `https://your-domain.com/webhook/facebook`
6. Set the verification token (if you set `FACEBOOK_VERIFY_TOKEN`)
7. Subscribe to **Lead** events
8. Click **Verify and Save**

## Step 4: Create a Facebook Lead Ad

1. Go to [Facebook Ads Manager](https://business.facebook.com/adsmanager)
2. Click **Create** → **Lead Generation**
3. Set up your ad campaign
4. In the Lead Form, include these fields:
   - **Full Name** (required)
   - **Phone Number** (required)
   - **Email** (optional but recommended)
   - **Custom Question**: "How many units are you interested in?" (optional)
5. Publish your ad

## Step 5: Test the Integration

1. Submit a test lead through your Facebook Lead Ad
2. Check your server logs - you should see the webhook being received
3. Open your Lead Management app - the lead should appear automatically within 30 seconds

## Field Mapping

The system automatically maps Facebook Lead Ad fields:

| Facebook Field | Maps To | Required |
|---------------|---------|----------|
| Full Name / First Name | Name | ✅ Yes |
| Phone Number / Phone | Phone | ✅ Yes |
| Email / Email Address | Email | ❌ No |
| Custom: Units | Units | ❌ No |
| Source | Always set to "Facebook Lead Ad" | - |

## Troubleshooting

### Webhook Not Receiving Data

1. **Check webhook URL**: Make sure it's publicly accessible
2. **Check verification**: Facebook must be able to verify your webhook
3. **Check server logs**: Look for incoming requests
4. **Test manually**: Use curl to test your endpoint:
   ```bash
   curl -X POST http://localhost:3001/webhook/facebook \
     -H "Content-Type: application/json" \
     -d '{"entry":[{"changes":[{"value":{"leadgen_id":"123","field_data":[]}}]}]}'
   ```

### Leads Not Appearing in Frontend

1. **Check backend is running**: `npm run server`
2. **Check API URL**: Make sure `apiUrl` in `LeadFollowUpManager.svelte` matches your server
3. **Check browser console**: Look for sync errors
4. **Manual sync**: Refresh the page to trigger a sync

### Facebook Webhook Verification Fails

1. Make sure `FACEBOOK_VERIFY_TOKEN` matches what you entered in Facebook
2. Your server must respond with the challenge token during verification
3. Check server logs for verification attempts

## Production Deployment

For production, consider:

1. **Use HTTPS**: Facebook requires HTTPS for webhooks
2. **Set environment variables**: Use `.env` file or your hosting platform's env vars
3. **Add authentication**: Protect your API endpoints
4. **Add rate limiting**: Prevent abuse
5. **Add logging**: Use a proper logging service
6. **Database**: Consider using a database instead of JSON file for production

## Alternative: Manual Export Method

If webhooks are too complex, you can:

1. Export leads from Facebook Lead Ads (CSV/Excel)
2. Use the "Upload Excel/CSV" feature in the app
3. This works but requires manual steps

## Support

For issues or questions, check:
- Facebook Lead Ads Documentation: https://www.facebook.com/business/help/952354392644690
- Facebook Webhooks Guide: https://developers.facebook.com/docs/graph-api/webhooks

