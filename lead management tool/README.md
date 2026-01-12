# Lead Follow-Up Manager

Automated lead management system for Hidden Leaf Village with Facebook Lead Ads integration.

## Features

- ✅ **Manual Lead Entry** - Add leads one by one
- ✅ **Bulk Import** - Upload Excel/CSV files to import multiple leads
- ✅ **Facebook Lead Ads Integration** - Automatically receive leads from Facebook ads
- ✅ **WhatsApp Integration** - Generate and send personalized WhatsApp messages
- ✅ **Follow-up Tracking** - Automatic follow-up scheduling based on lead status
- ✅ **Status Management** - Track leads through: New → Contacted → Responded → Qualified → Closed
- ✅ **Overdue Alerts** - Visual indicators for leads needing immediate attention

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend (for Facebook integration):**
```bash
npm run server
```

The app will be available at `http://localhost:5173`

## Facebook Lead Ads Setup

See [FACEBOOK_SETUP.md](./FACEBOOK_SETUP.md) for detailed instructions on connecting Facebook Lead Ads.

**Quick Summary:**
1. Start the backend server: `npm run server`
2. Expose your webhook (use ngrok for testing)
3. Configure Facebook Lead Ads webhook
4. Leads will automatically appear in your app!

## Usage

### Adding Leads Manually

1. Click **"Add Lead"** button
2. Fill in the form (Name and Phone are required)
3. Click **"Add Lead"** to save

### Bulk Import from Excel/CSV

1. Click **"Upload Excel/CSV"** button
2. Select your file (CSV, XLSX, or XLS)
3. The system will automatically:
   - Detect column names (flexible matching)
   - Map to lead fields
   - Import all valid leads

**Required columns:** Name, Phone  
**Optional columns:** Email, Units, Source

### Managing Leads

- **Update Status**: Click status buttons (Mark Contacted, Mark Responded, etc.)
- **Send WhatsApp**: Click "Send WhatsApp" to open WhatsApp with a pre-filled message
- **Filter Leads**: Use filter buttons to view specific lead categories
- **Track Follow-ups**: System automatically schedules follow-ups based on status

## File Structure

```
lead-management-tool/
├── src/
│   ├── LeadFollowUpManager.svelte  # Main component
│   ├── App.svelte                   # App wrapper
│   └── main.js                      # Entry point
├── server.js                        # Backend API & webhook server
├── package.json
└── FACEBOOK_SETUP.md               # Facebook integration guide
```

## API Endpoints

When the backend server is running:

- `GET /api/leads` - Get all leads
- `POST /api/leads` - Add a new lead
- `PATCH /api/leads/:id` - Update lead status
- `POST /webhook/facebook` - Facebook Lead Ads webhook

## Environment Variables

Create a `.env` file (optional):

```env
FACEBOOK_VERIFY_TOKEN=your_secret_token_here
PORT=3001
```

## Production Deployment

1. **Frontend**: Deploy to Vercel, Netlify, or similar
2. **Backend**: Deploy to Railway, Render, Heroku, or similar
3. Update `apiUrl` in `src/LeadFollowUpManager.svelte` to match your backend URL
4. Set up environment variables on your hosting platform

## Support

For Facebook integration issues, see [FACEBOOK_SETUP.md](./FACEBOOK_SETUP.md)

