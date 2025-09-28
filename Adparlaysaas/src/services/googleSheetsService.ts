interface GoogleSheetsConfig {
  spreadsheetId: string;
  sheetName: string;
  accessToken: string;
  refreshToken?: string;
  clientId: string;
  clientSecret: string;
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

class GoogleSheetsService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'https://us-central1-adparlaysaas.cloudfunctions.net/api';
  }

  async setupGoogleSheetsIntegration(
    formId: string,
    config: GoogleSheetsConfig
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/integrations/google-sheets/setup`, {
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
        throw new Error(`Google Sheets setup failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Google Sheets integration setup successfully:', result);
    } catch (error) {
      console.error('Error setting up Google Sheets integration:', error);
      throw error;
    }
  }

  async syncSubmissionToSheets(
    submission: FormSubmission,
    form: Form,
    config: GoogleSheetsConfig
  ): Promise<void> {
    try {
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

      // Prepare row data
      const rowData = {
        'Submission ID': submission.id,
        'Form Title': submission.formTitle,
        'Submitted Date': submission.submittedAt.toLocaleDateString(),
        'Submitted Time': submission.submittedAt.toLocaleTimeString(),
        'Device': this.getDeviceInfo(submission.userAgent),
        'IP Address': submission.ipAddress,
        ...Object.fromEntries(
          Object.entries(submission.formData).map(([key, value]) => [
            getQuestionLabel(key),
            formatValue(value)
          ])
        )
      };

      const response = await fetch(`${this.baseUrl}/integrations/google-sheets/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config,
          rowData
        }),
      });

      if (!response.ok) {
        throw new Error(`Google Sheets sync failed: ${response.statusText}`);
      }

      console.log('Submission synced to Google Sheets successfully');
    } catch (error) {
      console.error('Error syncing to Google Sheets:', error);
      throw error;
    }
  }

  async getGoogleSheetsAuthUrl(): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/integrations/google-sheets/auth-url`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Failed to get auth URL: ${response.statusText}`);
      }

      const result = await response.json();
      return result.authUrl;
    } catch (error) {
      console.error('Error getting Google Sheets auth URL:', error);
      throw new Error('Google Sheets integration is temporarily unavailable. Please try again later or contact support.');
    }
  }

  async handleGoogleSheetsCallback(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    spreadsheetId?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/integrations/google-sheets/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error(`Google Sheets callback failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error handling Google Sheets callback:', error);
      throw error;
    }
  }

  private getDeviceInfo(userAgent: string): string {
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'Mac';
    if (userAgent.includes('Linux')) return 'Linux';
    return 'Unknown';
  }

  // Create a new spreadsheet for the form
  async createSpreadsheetForForm(form: Form): Promise<{
    spreadsheetId: string;
    spreadsheetUrl: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/integrations/google-sheets/create-spreadsheet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId: form.id,
          formTitle: form.title,
          headers: this.generateHeaders(form)
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create spreadsheet: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating spreadsheet:', error);
      throw error;
    }
  }

  private generateHeaders(form: Form): string[] {
    const baseHeaders = [
      'Submission ID',
      'Form Title',
      'Submitted Date',
      'Submitted Time',
      'Device',
      'IP Address'
    ];

    if (!form.blocks) return baseHeaders;

    const questionHeaders: string[] = [];
    for (const block of form.blocks) {
      if (block.questions) {
        for (const question of block.questions) {
          questionHeaders.push(question.label);
        }
      }
    }

    return [...baseHeaders, ...questionHeaders];
  }
}

export const googleSheetsService = new GoogleSheetsService();
export default googleSheetsService;
