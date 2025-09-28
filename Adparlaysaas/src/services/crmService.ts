interface CRMConfig {
  type: 'hubspot' | 'zoho' | 'salesforce';
  accessToken: string;
  refreshToken?: string;
  clientId: string;
  clientSecret: string;
  accountId?: string; // For Salesforce
  portalId?: string; // For HubSpot
}

interface FormSubmission {
  id: string;
  formId: string;
  formTitle: string;
  formData: Record<string, any>;
  submittedAt: Date;
  userAgent: string;
  ipAddress: string;
}

interface Form {
  id: string;
  title: string;
  blocks?: Array<{
    title: string;
    questions: Array<{
      id: string;
      label: string;
      type: string;
    }>;
  }>;
}

interface CRMContact {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  leadSource: string;
  customFields: Record<string, any>;
}

class CRMService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'https://us-central1-adparlaysaas.cloudfunctions.net/api';
  }

  async setupCRMIntegration(
    formId: string,
    config: CRMConfig
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/integrations/crm/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId,
          ...config
        }),
      });

      if (!response.ok) {
        throw new Error(`CRM integration setup failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('CRM integration setup successfully:', result);
    } catch (error) {
      console.error('Error setting up CRM integration:', error);
      throw error;
    }
  }

  async syncSubmissionToCRM(
    submission: FormSubmission,
    form: Form,
    config: CRMConfig
  ): Promise<void> {
    try {
      const contact = this.extractContactFromSubmission(submission, form);
      
      const response = await fetch(`${this.baseUrl}/integrations/crm/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config,
          contact,
          submission
        }),
      });

      if (!response.ok) {
        throw new Error(`CRM sync failed: ${response.statusText}`);
      }

      console.log('Submission synced to CRM successfully');
    } catch (error) {
      console.error('Error syncing to CRM:', error);
      throw error;
    }
  }

  async getCRMAuthUrl(crmType: 'hubspot' | 'zoho' | 'salesforce'): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/integrations/crm/auth-url?type=${crmType}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Failed to get ${crmType} auth URL: ${response.statusText}`);
      }

      const result = await response.json();
      return result.authUrl;
    } catch (error) {
      console.error(`Error getting ${crmType} auth URL:`, error);
      throw new Error(`${crmType.charAt(0).toUpperCase() + crmType.slice(1)} integration is temporarily unavailable. Please try again later or contact support.`);
    }
  }

  async handleCRMCallback(
    crmType: 'hubspot' | 'zoho' | 'salesforce',
    code: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    accountId?: string;
    portalId?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/integrations/crm/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          type: crmType,
          code 
        }),
      });

      if (!response.ok) {
        throw new Error(`${crmType} callback failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`Error handling ${crmType} callback:`, error);
      throw error;
    }
  }

  private extractContactFromSubmission(submission: FormSubmission, form: Form): CRMContact {
    const contact: CRMContact = {
      leadSource: `AdParlay Form: ${submission.formTitle}`,
      customFields: {}
    };

    if (!form.blocks) return contact;

    // Extract contact information from form responses
    for (const block of form.blocks) {
      if (!block.questions) continue;

      for (const question of block.questions) {
        const value = submission.formData[question.id];
        if (!value) continue;

        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

        // Map common field types to CRM fields
        switch (question.type) {
          case 'email':
            contact.email = stringValue;
            break;
          case 'text':
            if (question.label.toLowerCase().includes('first name') || 
                question.label.toLowerCase().includes('firstname')) {
              contact.firstName = stringValue;
            } else if (question.label.toLowerCase().includes('last name') || 
                       question.label.toLowerCase().includes('lastname')) {
              contact.lastName = stringValue;
            } else if (question.label.toLowerCase().includes('company')) {
              contact.company = stringValue;
            } else {
              contact.customFields[question.label] = stringValue;
            }
            break;
          case 'phone':
            contact.phone = stringValue;
            break;
          default:
            contact.customFields[question.label] = stringValue;
        }
      }
    }

    return contact;
  }

  // Get CRM-specific field mappings
  getCRMFieldMappings(crmType: 'hubspot' | 'zoho' | 'salesforce'): Record<string, string> {
    const mappings = {
      hubspot: {
        email: 'email',
        firstName: 'firstname',
        lastName: 'lastname',
        phone: 'phone',
        company: 'company',
        leadSource: 'hs_lead_source'
      },
      zoho: {
        email: 'Email',
        firstName: 'First_Name',
        lastName: 'Last_Name',
        phone: 'Phone',
        company: 'Account_Name',
        leadSource: 'Lead_Source'
      },
      salesforce: {
        email: 'Email',
        firstName: 'FirstName',
        lastName: 'LastName',
        phone: 'Phone',
        company: 'Company',
        leadSource: 'LeadSource'
      }
    };

    return mappings[crmType] || {};
  }
}

export const crmService = new CRMService();
export default crmService;
