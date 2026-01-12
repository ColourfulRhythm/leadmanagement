<script>
  import { onMount } from 'svelte';
  import { Plus, MessageCircle, Phone, Mail, AlertCircle, Upload } from 'lucide-svelte';

  let leads = [];
  let showAddForm = false;
  let filter = 'all';
  let isUploading = false;
  let uploadStatus = '';
  let apiUrl = 'http://localhost:3001'; // Backend API URL
  let isSyncing = false;
  let lastSyncTime = null;
  let newLead = {
    name: '',
    phone: '',
    email: '',
    units: '',
    source: ''
  };

  // Load leads from storage on mount
  onMount(async () => {
    await loadLeads();
    // Start syncing with backend every 30 seconds
    syncWithBackend();
    setInterval(syncWithBackend, 30000);
  });

  // Reactive statement to save leads whenever they change
  $: if (leads.length > 0) {
    saveLeads();
  }

  const loadLeads = async () => {
    try {
      // Try custom storage API first, fallback to localStorage
      if (window.storage && window.storage.get) {
        const result = await window.storage.get('hidden-leaf-leads');
        if (result && result.value) {
          leads = JSON.parse(result.value);
          return;
        }
      }
      // Fallback to localStorage
      const saved = localStorage.getItem('hidden-leaf-leads');
      if (saved) {
        leads = JSON.parse(saved);
      }
    } catch (error) {
      console.log('No saved leads found, starting fresh');
    }
  };

  const syncWithBackend = async () => {
    if (isSyncing) return;
    
    try {
      isSyncing = true;
      const response = await fetch(`${apiUrl}/api/leads`);
      
      if (response.ok) {
        const backendLeads = await response.json();
        
        // Merge with local leads (backend takes priority for duplicates)
        const localLeads = leads;
        const mergedLeads = [...backendLeads];
        
        // Add local-only leads that don't exist in backend
        localLeads.forEach(localLead => {
          const exists = mergedLeads.find(b => b.phone === localLead.phone);
          if (!exists) {
            mergedLeads.push(localLead);
          }
        });
        
        // Sort by date (newest first)
        mergedLeads.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
        
        leads = mergedLeads;
        lastSyncTime = new Date();
        await saveLeads();
      }
    } catch (error) {
      // Backend not available, continue with local storage
      console.log('Backend not available, using local storage only');
    } finally {
      isSyncing = false;
    }
  };

  const saveLeads = async () => {
    try {
      // Try custom storage API first, fallback to localStorage
      if (window.storage && window.storage.set) {
        await window.storage.set('hidden-leaf-leads', JSON.stringify(leads));
      } else {
        // Fallback to localStorage
        localStorage.setItem('hidden-leaf-leads', JSON.stringify(leads));
      }
    } catch (error) {
      console.error('Error saving leads:', error);
    }
  };

  const addLead = async () => {
    if (!newLead.name || !newLead.phone) {
      alert('Name and phone number are required');
      return;
    }

    const lead = {
      id: Date.now(),
      ...newLead,
      dateAdded: new Date().toISOString(),
      status: 'new',
      lastContact: null,
      nextFollowUp: new Date().toISOString(), // Contact immediately
      notes: []
    };

    // Try to sync with backend
    try {
      await fetch(`${apiUrl}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLead)
      });
    } catch (error) {
      console.log('Backend not available, saving locally only');
    }

    leads = [lead, ...leads];
    newLead = { name: '', phone: '', email: '', units: '', source: '' };
    showAddForm = false;
  };

  const normalizeColumnName = (name) => {
    if (!name) return '';
    return name.toLowerCase().trim().replace(/\s+/g, '');
  };

  const mapRowToLead = (row, headers) => {
    const getValue = (possibleNames) => {
      for (const name of possibleNames) {
        const normalized = normalizeColumnName(name);
        for (const header of headers) {
          if (normalizeColumnName(header) === normalized) {
            return row[header] || '';
          }
        }
      }
      return '';
    };

    const name = getValue(['name', 'full name', 'fullname', 'contact name', 'customer name']);
    const phone = getValue(['phone', 'phone number', 'phonenumber', 'mobile', 'tel', 'telephone', 'contact']);
    const email = getValue(['email', 'e-mail', 'email address']);
    const units = getValue(['units', 'unit', 'quantity', 'qty', 'number of units']);
    const source = getValue(['source', 'lead source', 'referral source', 'origin']);

    return {
      name: String(name || '').trim(),
      phone: String(phone || '').trim(),
      email: String(email || '').trim(),
      units: String(units || '').trim(),
      source: String(source || '').trim()
    };
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    isUploading = true;
    uploadStatus = 'Processing file...';

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      let rows = [];

      if (fileExtension === 'csv') {
        // Handle CSV
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length === 0) {
          throw new Error('CSV file is empty');
        }

        // Parse CSV (simple parser - handles basic cases)
        const parseCSVLine = (line) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const headers = parseCSVLine(lines[0]);
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          rows.push(row);
        }
      } else if (['xlsx', 'xls'].includes(fileExtension)) {
        // Handle Excel - dynamically import xlsx
        try {
          const XLSX = await import('xlsx');
          const arrayBuffer = await file.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length === 0) {
            throw new Error('Excel file is empty');
          }

          const headers = jsonData[0];
          for (let i = 1; i < jsonData.length; i++) {
            const row = {};
            headers.forEach((header, index) => {
              row[header] = jsonData[i][index] || '';
            });
            rows.push(row);
          }
        } catch (importError) {
          if (importError.message && importError.message.includes('Failed to fetch')) {
            throw new Error('Excel support requires the xlsx package. Please run: npm install xlsx');
          }
          throw importError;
        }
      } else {
        throw new Error('Unsupported file format. Please upload CSV or Excel files (.csv, .xlsx, .xls)');
      }

      if (rows.length === 0) {
        throw new Error('No data rows found in file');
      }

      // Map rows to leads
      const headers = Object.keys(rows[0]);
      const newLeads = [];
      let skipped = 0;

      for (const row of rows) {
        const leadData = mapRowToLead(row, headers);
        
        // Skip if name or phone is missing
        if (!leadData.name || !leadData.phone) {
          skipped++;
          continue;
        }

        const lead = {
          id: Date.now() + Math.random(), // Unique ID
          ...leadData,
          dateAdded: new Date().toISOString(),
          status: 'new',
          lastContact: null,
          nextFollowUp: new Date().toISOString(),
          notes: []
        };

        newLeads.push(lead);
      }

      if (newLeads.length === 0) {
        throw new Error('No valid leads found. Make sure your file has "name" and "phone" columns.');
      }

      // Add all new leads
      leads = [...newLeads, ...leads];
      uploadStatus = `Successfully imported ${newLeads.length} lead${newLeads.length !== 1 ? 's' : ''}${skipped > 0 ? ` (${skipped} skipped)` : ''}`;
      
      // Clear status after 5 seconds
      setTimeout(() => {
        uploadStatus = '';
      }, 5000);

    } catch (error) {
      console.error('Error processing file:', error);
      uploadStatus = `Error: ${error.message}`;
      alert(`Error processing file: ${error.message}`);
    } finally {
      isUploading = false;
      // Reset file input
      event.target.value = '';
    }
  };

  const updateLeadStatus = async (id, status) => {
    const updatedLead = leads.find(l => l.id === id);
    if (!updatedLead) return;

    const newStatus = {
      status,
      lastContact: new Date().toISOString(),
      nextFollowUp: getNextFollowUpDate(status)
    };

    // Try to sync with backend
    try {
      await fetch(`${apiUrl}/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStatus)
      });
    } catch (error) {
      console.log('Backend not available, updating locally only');
    }

    leads = leads.map(lead => 
      lead.id === id ? { 
        ...lead, 
        ...newStatus
      } : lead
    );
  };

  const getNextFollowUpDate = (status) => {
    const now = new Date();
    switch(status) {
      case 'contacted':
        now.setDate(now.getDate() + 1); // Follow up next day
        return now.toISOString();
      case 'responded':
        now.setDate(now.getDate() + 3); // Follow up in 3 days
        return now.toISOString();
      case 'qualified':
        now.setDate(now.getDate() + 2); // Follow up in 2 days
        return now.toISOString();
      default:
        return now.toISOString();
    }
  };

  const getWhatsAppMessage = (lead, stage = 'initial') => {
    const messages = {
      initial: `Hi ${lead.name}!

Thank you for your interest in Hidden Leaf Village. I saw you're interested in ${lead.units} unit${lead.units !== '1' ? 's' : ''}.

I want to be completely transparent with you:
- Land is already secured in Kobape
- Built by Focal Point (2 Seasons, True Vine)
- Full legal documentation provided
- Starting with 1 pod to prove the model first

What specific questions can I answer for you?

Best,
[Your Name]
Focal Point Property Development`,

      followup: `Hi ${lead.name},

Just following up on Hidden Leaf Village. I know you expressed interest in co-owning ${lead.units} unit${lead.units !== '1' ? 's' : ''}.

Are you still interested in learning more? Happy to:
- Answer any questions
- Send detailed investment brief
- Arrange site visit this Saturday

What would be most helpful?

- [Your Name]`,

      qualified: `Hi ${lead.name},

Based on our conversation, it sounds like Hidden Leaf Village could be a great fit for you.

Next steps:

Option 1: Visit the site this Saturday (transport arranged)
Option 2: I send you the investment brief, then we schedule a 15-min call
Option 3: Share any final concerns and I'll address them

Which feels right to you?

- [Your Name]`,

      closing: `Hi ${lead.name},

Great! Let me help you reserve your ${lead.units} unit${lead.units !== '1' ? 's' : ''}.

Investment: ₦${parseInt(lead.units) * 35000 || 35000}

Payment options:
1. Full payment: ₦${parseInt(lead.units) * 35000 || 35000}
2. Deposit: ₦${parseInt(lead.units) * 15000 || 15000}, balance before construction

I'll send you:
- Payment details
- Co-ownership agreement
- Welcome package

Ready to move forward?

- [Your Name]`
    };

    return messages[stage] || messages.initial;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Message copied! Paste it in WhatsApp.');
  };

  const openWhatsApp = (phone, message) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
  };

  const getDaysAgo = (date) => {
    const days = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`;
  };

  const isOverdue = (lead) => {
    return new Date(lead.nextFollowUp) < new Date();
  };

  $: filteredLeads = leads.filter(lead => {
    if (filter === 'all') return true;
    if (filter === 'overdue') return isOverdue(lead);
    return lead.status === filter;
  });

  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      responded: 'bg-purple-100 text-purple-800',
      qualified: 'bg-green-100 text-green-800',
      closed: 'bg-emerald-100 text-emerald-800',
      cold: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStageForLead = (lead) => {
    if (lead.status === 'new') return 'initial';
    if (lead.status === 'contacted') return 'followup';
    if (lead.status === 'responded' || lead.status === 'qualified') return 'qualified';
    return 'followup';
  };

  const filterOptions = ['all', 'new', 'contacted', 'responded', 'qualified', 'overdue', 'cold'];
</script>

<div class="min-h-screen bg-gray-50 p-6">
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Lead Follow-Up Manager</h1>
          <p class="text-gray-600 text-sm mt-1">Hidden Leaf Village - Automated Response System</p>
          {#if lastSyncTime}
            <p class="text-xs text-gray-500 mt-1">
              Last synced: {new Date(lastSyncTime).toLocaleTimeString()}
              {#if isSyncing}<span class="text-blue-600"> (Syncing...)</span>{/if}
            </p>
          {/if}
        </div>
        <div class="flex items-center gap-3">
          <label
            class="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 cursor-pointer {isUploading ? 'opacity-50 cursor-not-allowed' : ''}"
          >
            <Upload size={20} />
            {isUploading ? 'Uploading...' : 'Upload Excel/CSV'}
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              on:change={handleFileUpload}
              disabled={isUploading}
              class="hidden"
            />
          </label>
          <button
            on:click={() => showAddForm = !showAddForm}
            class="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
          >
            <Plus size={20} />
            Add Lead
          </button>
        </div>
      </div>
      {#if uploadStatus}
        <div class="mt-4 p-3 rounded-lg {uploadStatus.includes('Error') ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}">
          {uploadStatus}
        </div>
      {/if}

      <!-- Stats -->
      <div class="grid grid-cols-5 gap-4 mt-6">
        <div class="bg-blue-50 p-4 rounded-lg">
          <div class="text-2xl font-bold text-blue-600">{leads.length}</div>
          <div class="text-sm text-gray-600">Total Leads</div>
        </div>
        <div class="bg-yellow-50 p-4 rounded-lg">
          <div class="text-2xl font-bold text-yellow-600">
            {leads.filter(l => l.status === 'new').length}
          </div>
          <div class="text-sm text-gray-600">New</div>
        </div>
        <div class="bg-purple-50 p-4 rounded-lg">
          <div class="text-2xl font-bold text-purple-600">
            {leads.filter(l => l.status === 'responded').length}
          </div>
          <div class="text-sm text-gray-600">Responded</div>
        </div>
        <div class="bg-green-50 p-4 rounded-lg">
          <div class="text-2xl font-bold text-green-600">
            {leads.filter(l => l.status === 'qualified').length}
          </div>
          <div class="text-sm text-gray-600">Qualified</div>
        </div>
        <div class="bg-red-50 p-4 rounded-lg">
          <div class="text-2xl font-bold text-red-600">
            {leads.filter(l => isOverdue(l) && l.status !== 'closed').length}
          </div>
          <div class="text-sm text-gray-600">Overdue</div>
        </div>
      </div>
    </div>

    <!-- Add Lead Form -->
    {#if showAddForm}
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 class="text-lg font-semibold mb-4">Add New Lead</h2>
        <div class="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Full Name *"
            bind:value={newLead.name}
            class="border border-gray-300 rounded-lg px-4 py-2"
          />
          <input
            type="tel"
            placeholder="Phone Number *"
            bind:value={newLead.phone}
            class="border border-gray-300 rounded-lg px-4 py-2"
          />
          <input
            type="email"
            placeholder="Email"
            bind:value={newLead.email}
            class="border border-gray-300 rounded-lg px-4 py-2"
          />
          <input
            type="text"
            placeholder="Units Interested In"
            bind:value={newLead.units}
            class="border border-gray-300 rounded-lg px-4 py-2"
          />
          <input
            type="text"
            placeholder="Source (e.g., Facebook, Referral)"
            bind:value={newLead.source}
            class="border border-gray-300 rounded-lg px-4 py-2 col-span-2"
          />
        </div>
        <div class="flex gap-3 mt-4">
          <button
            on:click={addLead}
            class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Add Lead
          </button>
          <button
            on:click={() => showAddForm = false}
            class="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    {/if}

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div class="flex gap-2 flex-wrap">
        {#each filterOptions as f}
          <button
            on:click={() => filter = f}
            class="px-4 py-2 rounded-lg text-sm font-medium {filter === f 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        {/each}
      </div>
    </div>

    <!-- Leads List -->
    <div class="space-y-4">
      {#if filteredLeads.length === 0}
        <div class="bg-white rounded-lg shadow-sm p-12 text-center">
          <AlertCircle class="mx-auto text-gray-400 mb-4" size={48} />
          <p class="text-gray-600">No leads found. Add your first lead to get started!</p>
        </div>
      {:else}
        {#each filteredLeads as lead (lead.id)}
          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <h3 class="text-lg font-semibold text-gray-900">{lead.name}</h3>
                  <span class="px-3 py-1 rounded-full text-xs font-medium {getStatusColor(lead.status)}">
                    {lead.status}
                  </span>
                  {#if isOverdue(lead) && lead.status !== 'closed'}
                    <span class="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      OVERDUE
                    </span>
                  {/if}
                </div>
                <div class="flex items-center gap-6 text-sm text-gray-600">
                  <span class="flex items-center gap-1">
                    <Phone size={14} />
                    {lead.phone}
                  </span>
                  {#if lead.email}
                    <span class="flex items-center gap-1">
                      <Mail size={14} />
                      {lead.email}
                    </span>
                  {/if}
                  <span class="font-medium text-green-600">
                    {lead.units} unit{lead.units !== '1' ? 's' : ''}
                  </span>
                  {#if lead.source}
                    <span class="text-gray-500">Source: {lead.source}</span>
                  {/if}
                </div>
                <div class="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>Added: {getDaysAgo(lead.dateAdded)}</span>
                  {#if lead.lastContact}
                    <span>Last contact: {getDaysAgo(lead.lastContact)}</span>
                  {/if}
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2 mb-4">
              <button
                on:click={() => updateLeadStatus(lead.id, 'contacted')}
                class="bg-yellow-100 text-yellow-700 px-3 py-1 rounded text-sm hover:bg-yellow-200"
              >
                Mark Contacted
              </button>
              <button
                on:click={() => updateLeadStatus(lead.id, 'responded')}
                class="bg-purple-100 text-purple-700 px-3 py-1 rounded text-sm hover:bg-purple-200"
              >
                Mark Responded
              </button>
              <button
                on:click={() => updateLeadStatus(lead.id, 'qualified')}
                class="bg-green-100 text-green-700 px-3 py-1 rounded text-sm hover:bg-green-200"
              >
                Mark Qualified
              </button>
              <button
                on:click={() => updateLeadStatus(lead.id, 'closed')}
                class="bg-emerald-100 text-emerald-700 px-3 py-1 rounded text-sm hover:bg-emerald-200"
              >
                Mark Closed
              </button>
              <button
                on:click={() => updateLeadStatus(lead.id, 'cold')}
                class="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200"
              >
                Mark Cold
              </button>
            </div>

            <!-- Message Template -->
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-700">
                  Suggested Message ({lead.status === 'new' ? 'Initial Contact' : 'Follow-up'})
                </span>
                <div class="flex gap-2">
                  <button
                    on:click={() => copyToClipboard(getWhatsAppMessage(lead, getStageForLead(lead)))}
                    class="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    Copy Message
                  </button>
                  <button
                    on:click={() => openWhatsApp(lead.phone, getWhatsAppMessage(lead, getStageForLead(lead)))}
                    class="bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700 flex items-center gap-1"
                  >
                    <MessageCircle size={14} />
                    Send WhatsApp
                  </button>
                </div>
              </div>
              <pre class="text-xs text-gray-600 whitespace-pre-wrap font-sans">
                {getWhatsAppMessage(lead, getStageForLead(lead))}
              </pre>
            </div>
          </div>
        {/each}
      {/if}
    </div>

    <!-- Instructions -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
      <h3 class="font-semibold text-blue-900 mb-3 flex items-center gap-2">
        <AlertCircle size={20} />
        How to Use This Tool
      </h3>
      <ol class="list-decimal list-inside space-y-2 text-sm text-blue-800">
        <li><strong>Bulk Import:</strong> Click "Upload Excel/CSV" to import multiple leads at once. Your file should have columns for: Name, Phone (required), Email, Units, Source</li>
        <li>Add new leads manually or paste from your form submissions</li>
        <li>System automatically generates personalized WhatsApp messages</li>
        <li>Click "Send WhatsApp" to open WhatsApp with pre-filled message</li>
        <li>Update lead status after each interaction</li>
        <li>System tracks follow-up schedule automatically</li>
        <li>Red "OVERDUE" badge shows leads needing immediate attention</li>
        <li>All data saved in your browser - accessible anytime</li>
      </ol>
      <div class="mt-4 p-4 bg-white rounded-lg border border-blue-300">
        <h4 class="font-semibold text-blue-900 mb-2">File Upload Format:</h4>
        <p class="text-xs text-blue-800 mb-2">Supported formats: CSV (.csv), Excel (.xlsx, .xls)</p>
        <p class="text-xs text-blue-800 mb-2"><strong>Required columns:</strong> Name, Phone</p>
        <p class="text-xs text-blue-800"><strong>Optional columns:</strong> Email, Units, Source</p>
        <p class="text-xs text-blue-700 mt-2 italic">Column names are case-insensitive and flexible (e.g., "Phone Number", "phone", "Phone" all work)</p>
      </div>
    </div>
  </div>
</div>

