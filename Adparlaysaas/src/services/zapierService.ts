interface ZapierConfig {
  webhookUrl: string;
  isActive: boolean;
  customFields?: Record<string, any>;
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

class ZapierService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'https://us-central1-adparlaysaas.cloudfunctions.net/api';
  }

  async setupZapierIntegration(
    formId: string,
    config: ZapierConfig
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/integrations/zapier/setup`, {
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
        throw new Error(`Zapier integration setup failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Zapier integration setup successfully:', result);
    } catch (error) {
      console.error('Error setting up Zapier integration:', error);
      throw error;
    }
  }

  async triggerZapierWebhook(
    submission: FormSubmission,
    form: Form,
    config: ZapierConfig
  ): Promise<void> {
    try {
      const webhookData = this.prepareWebhookData(submission, form, config);
      
      const response = await fetch(`${this.baseUrl}/integrations/zapier/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config,
          webhookData
        }),
      });

      if (!response.ok) {
        throw new Error(`Zapier webhook trigger failed: ${response.statusText}`);
      }

      console.log('Zapier webhook triggered successfully');
    } catch (error) {
      console.error('Error triggering Zapier webhook:', error);
      throw error;
    }
  }

  private prepareWebhookData(
    submission: FormSubmission,
    form: Form,
    config: ZapierConfig
  ): Record<string, any> {
    const getQuestionLabel = (questionId: string): string => {
      if (!form.blocks) return questionId;
      
      for (const block of form.blocks) {
        const question = block.questions?.find(q => q.id === questionId);
        if (question) return question.label;
      }
      return questionId;
    };

    const formatValue = (value: any): string => {
      if (typeof value === 'object' && value !== null) {
        if (value.isFile) {
          return `${value.fileName} (${value.fileType})`;
        }
        return JSON.stringify(value);
      }
      return String(value);
    };

    // Prepare webhook data
    const webhookData = {
      // Standard fields
      submission_id: submission.id,
      form_id: submission.formId,
      form_title: submission.formTitle,
      submitted_at: submission.submittedAt.toISOString(),
      device: this.getDeviceInfo(submission.userAgent),
      ip_address: submission.ipAddress,
      
      // Form responses with question labels
      responses: Object.fromEntries(
        Object.entries(submission.formData).map(([key, value]) => [
          getQuestionLabel(key),
          formatValue(value)
        ])
      ),
      
      // Raw form data for advanced users
      raw_responses: submission.formData,
      
      // Custom fields if configured
      ...(config.customFields || {})
    };

    return webhookData;
  }

  private getDeviceInfo(userAgent: string): string {
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'Mac';
    if (userAgent.includes('Linux')) return 'Linux';
    return 'Unknown';
  }

  // Generate a sample webhook URL for testing
  generateSampleWebhookUrl(): string {
    return 'https://hooks.zapier.com/hooks/catch/123456/abcdef/';
  }

  // Validate webhook URL format
  validateWebhookUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:' && 
             (urlObj.hostname.includes('zapier.com') || 
              urlObj.hostname.includes('make.com') ||
              urlObj.hostname.includes('n8n.io'));
    } catch {
      return false;
    }
  }

  // Get popular Zapier integrations
  getPopularIntegrations(): Array<{
    name: string;
    description: string;
    icon: string;
    category: string;
  }> {
    return [
      {
        name: 'Slack',
        description: 'Send notifications to Slack channels',
        icon: '💬',
        category: 'Communication'
      },
      {
        name: 'Mailchimp',
        description: 'Add subscribers to email lists',
        icon: '📧',
        category: 'Email Marketing'
      },
      {
        name: 'Airtable',
        description: 'Create records in Airtable bases',
        icon: '🗃️',
        category: 'Database'
      },
      {
        name: 'Trello',
        description: 'Create cards in Trello boards',
        icon: '📋',
        category: 'Project Management'
      },
      {
        name: 'Google Drive',
        description: 'Save files to Google Drive',
        icon: '📁',
        category: 'Storage'
      },
      {
        name: 'WhatsApp',
        description: 'Send WhatsApp messages',
        icon: '📱',
        category: 'Communication'
      },
      {
        name: 'Discord',
        description: 'Send messages to Discord channels',
        icon: '🎮',
        category: 'Communication'
      },
      {
        name: 'Notion',
        description: 'Create pages in Notion',
        icon: '📝',
        category: 'Productivity'
      }
    ];
  }
}

export const zapierService = new ZapierService();
export default zapierService;
