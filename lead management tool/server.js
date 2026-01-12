import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const LEADS_FILE = path.join(__dirname, 'leads.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure leads file exists
if (!fs.existsSync(LEADS_FILE)) {
  fs.writeFileSync(LEADS_FILE, JSON.stringify([]));
}

// Helper functions
const readLeads = () => {
  try {
    const data = fs.readFileSync(LEADS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading leads:', error);
    return [];
  }
};

const writeLeads = (leads) => {
  try {
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing leads:', error);
    return false;
  }
};

const addLead = (leadData) => {
  const leads = readLeads();
  
  // Check if lead already exists (by phone number)
  const existingLead = leads.find(l => l.phone === leadData.phone);
  if (existingLead) {
    console.log('Lead already exists:', leadData.phone);
    return existingLead;
  }

  const newLead = {
    id: Date.now() + Math.random(),
    ...leadData,
    dateAdded: new Date().toISOString(),
    status: 'new',
    lastContact: null,
    nextFollowUp: new Date().toISOString(),
    notes: []
  };

  leads.unshift(newLead); // Add to beginning
  writeLeads(leads);
  console.log('New lead added:', newLead.name);
  return newLead;
};

// Facebook Lead Ads Webhook Endpoint
app.post('/webhook/facebook', (req, res) => {
  console.log('Facebook webhook received:', JSON.stringify(req.body, null, 2));

  // Facebook Lead Ads sends data in different formats
  // Handle both webhook verification and actual lead data
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Webhook verification (Facebook requires this)
  if (mode === 'subscribe' && token === process.env.FACEBOOK_VERIFY_TOKEN) {
    console.log('Webhook verified');
    return res.status(200).send(challenge);
  }

  // Process lead data
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (value && value.leadgen_id) {
      // This is a Facebook Lead Ad submission
      // Extract lead data from Facebook's format
      const leadData = {
        name: extractField(value, ['full_name', 'first_name', 'name']),
        phone: extractField(value, ['phone_number', 'phone', 'mobile_number']),
        email: extractField(value, ['email', 'email_address']),
        units: extractField(value, ['units', 'number_of_units', 'quantity']),
        source: 'Facebook Lead Ad'
      };

      // Add lead to system
      const lead = addLead(leadData);
      
      res.status(200).json({ 
        success: true, 
        message: 'Lead added successfully',
        lead 
      });
    } else {
      console.log('No lead data found in webhook');
      res.status(200).json({ success: true, message: 'Webhook received but no lead data' });
    }
  } catch (error) {
    console.error('Error processing Facebook webhook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper to extract field values from Facebook lead data
function extractField(value, possibleKeys) {
  if (!value || !value.field_data) return '';
  
  for (const key of possibleKeys) {
    const field = value.field_data.find(f => 
      f.name === key || 
      f.name.toLowerCase().includes(key.toLowerCase())
    );
    if (field && field.values && field.values[0]) {
      return field.values[0];
    }
  }
  return '';
}

// API endpoint to get all leads (for frontend sync)
app.get('/api/leads', (req, res) => {
  const leads = readLeads();
  res.json(leads);
});

// API endpoint to add a lead manually (for testing)
app.post('/api/leads', (req, res) => {
  const { name, phone, email, units, source } = req.body;
  
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }

  const lead = addLead({ name, phone, email: email || '', units: units || '', source: source || 'Manual' });
  res.json({ success: true, lead });
});

// API endpoint to update lead status
app.patch('/api/leads/:id', (req, res) => {
  const leads = readLeads();
  const leadId = req.params.id;
  const updates = req.body;

  const leadIndex = leads.findIndex(l => l.id == leadId);
  if (leadIndex === -1) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  leads[leadIndex] = {
    ...leads[leadIndex],
    ...updates,
    lastContact: updates.status ? new Date().toISOString() : leads[leadIndex].lastContact
  };

  writeLeads(leads);
  res.json({ success: true, lead: leads[leadIndex] });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Lead Management Server running on http://localhost:${PORT}`);
  console.log(`📥 Facebook Webhook: http://localhost:${PORT}/webhook/facebook`);
  console.log(`📊 API Endpoint: http://localhost:${PORT}/api/leads`);
  console.log(`\n💡 Set FACEBOOK_VERIFY_TOKEN environment variable for webhook security`);
});

