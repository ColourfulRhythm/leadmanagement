interface EmailNotificationData {
  to: string;
  subject: string;
  html: string;
  formId: string;
  formTitle: string;
  submissionId: string;
}

interface FormSubmission {
  id: string;
  formId: string;
  formTitle: string;
  formData: Record<string, any>;
  submittedAt: Date;
  userAgent?: string;
  ipAddress?: string;
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

class EmailService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'https://us-central1-adparlaysaas.cloudfunctions.net/api';
  }

  async sendLeadNotification(
    userEmail: string,
    submission: FormSubmission,
    form: Form
  ): Promise<void> {
    try {
      const subject = `New lead from ${submission.formTitle} - click to view details`;
      const html = this.generateLeadEmailHTML(submission, form);

      const emailData: EmailNotificationData = {
        to: userEmail,
        subject,
        html,
        formId: submission.formId,
        formTitle: submission.formTitle,
        submissionId: submission.id
      };

      const response = await fetch(`${this.baseUrl}/notifications/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        throw new Error(`Email notification failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Email notification sent successfully:', result);
    } catch (error) {
      console.error('Error sending email notification:', error);
      throw error;
    }
  }

  private generateLeadEmailHTML(submission: FormSubmission, form: Form): string {
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
          return `📎 ${value.fileName} (${value.fileType})`;
        }
        return JSON.stringify(value);
      }
      return String(value);
    };

    const responsesHTML = Object.entries(submission.formData)
      .map(([key, value]) => {
        const questionLabel = getQuestionLabel(key);
        const formattedValue = formatValue(value);
        return `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600; color: #374151;">
              ${questionLabel}
            </td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; color: #6b7280;">
              ${formattedValue}
            </td>
          </tr>
        `;
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Lead Notification</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
              🎉 New Lead Received!
            </h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">
              You have a new lead from your form: <strong>${submission.formTitle}</strong>
            </p>
          </div>

          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #374151; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
              Lead Details
            </h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 14px;">
              <div>
                <strong style="color: #374151;">Form:</strong><br>
                <span style="color: #6b7280;">${submission.formTitle}</span>
              </div>
              <div>
                <strong style="color: #374151;">Submitted:</strong><br>
                <span style="color: #6b7280;">${submission.submittedAt.toLocaleDateString()} at ${submission.submittedAt.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            <h3 style="background: #f3f4f6; margin: 0; padding: 16px; font-size: 16px; font-weight: 600; color: #374151;">
              Form Responses
            </h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f9fafb;">
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">
                    Question
                  </th>
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">
                    Answer
                  </th>
                </tr>
              </thead>
              <tbody>
                ${responsesHTML}
              </tbody>
            </table>
          </div>

          <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f0f9ff; border-radius: 8px;">
            <p style="margin: 0 0 16px 0; color: #1e40af; font-weight: 600;">
              View this lead in your dashboard
            </p>
            <a href="${window.location.origin}/responses" 
               style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; transition: background-color 0.2s;">
              View All Leads
            </a>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0;">
              This email was sent because you have email notifications enabled for your forms.
              <br>
              <a href="${window.location.origin}/settings" style="color: #3b82f6;">Manage notification settings</a>
            </p>
          </div>
        </body>
      </html>
    `;
  }

  async sendWelcomeEmail(userEmail: string, userName: string): Promise<void> {
    try {
      const subject = 'Welcome to AdParlay - Start Building Your Forms!';
      const html = this.generateWelcomeEmailHTML(userName);

      const emailData: EmailNotificationData = {
        to: userEmail,
        subject,
        html,
        formId: 'welcome',
        formTitle: 'Welcome Email',
        submissionId: 'welcome-' + Date.now()
      };

      const response = await fetch(`${this.baseUrl}/notifications/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        throw new Error(`Welcome email failed: ${response.statusText}`);
      }

      console.log('Welcome email sent successfully');
    } catch (error) {
      console.error('Error sending welcome email:', error);
      // Don't throw error for welcome email as it's not critical
    }
  }

  private generateWelcomeEmailHTML(userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to AdParlay</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">
              Welcome to AdParlay! 🎉
            </h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 12px 0 0 0; font-size: 18px;">
              Hi ${userName}, you're all set to start building amazing forms!
            </p>
          </div>

          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
            <h2 style="color: #374151; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">
              What's Next?
            </h2>
            <div style="space-y: 16px;">
              <div style="margin-bottom: 16px;">
                <h3 style="color: #3b82f6; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">
                  1. Create Your First Form
                </h3>
                <p style="margin: 0; color: #6b7280;">
                  Use our drag-and-drop builder to create professional forms in minutes.
                </p>
              </div>
              <div style="margin-bottom: 16px;">
                <h3 style="color: #3b82f6; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">
                  2. Customize & Brand
                </h3>
                <p style="margin: 0; color: #6b7280;">
                  Match your brand colors, fonts, and styling to create a seamless experience.
                </p>
              </div>
              <div style="margin-bottom: 16px;">
                <h3 style="color: #3b82f6; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">
                  3. Share & Collect Leads
                </h3>
                <p style="margin: 0; color: #6b7280;">
                  Get a shareable link and start collecting leads immediately.
                </p>
              </div>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${window.location.origin}/builder" 
               style="display: inline-block; background: #3b82f6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background-color 0.2s;">
              Start Building Your First Form
            </a>
          </div>

          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin-top: 30px;">
            <h3 style="color: #1e40af; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">
              Need Help?
            </h3>
            <p style="margin: 0 0 12px 0; color: #1e40af;">
              Check out our documentation or reach out to our support team.
            </p>
            <a href="${window.location.origin}/help" style="color: #3b82f6; text-decoration: none;">
              Visit Help Center →
            </a>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0;">
              You're receiving this email because you signed up for AdParlay.
              <br>
              <a href="${window.location.origin}/settings" style="color: #3b82f6;">Manage your email preferences</a>
            </p>
          </div>
        </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();
export default emailService;
