import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, CheckCircle, AlertCircle, Settings, Plus } from 'lucide-react';
import { googleSheetsService } from '../services/googleSheetsService';

interface GoogleSheetsIntegrationProps {
  formId: string;
  formTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

interface IntegrationConfig {
  id: string;
  spreadsheetId: string;
  sheetName: string;
  isActive: boolean;
  createdAt: Date;
}

const GoogleSheetsIntegration: React.FC<GoogleSheetsIntegrationProps> = ({
  formId,
  formTitle,
  isOpen,
  onClose
}) => {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchIntegrations();
    }
  }, [isOpen, formId]);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      // In a real implementation, you would fetch from your API
      // For now, we'll simulate with empty array
      setIntegrations([]);
    } catch (error) {
      console.error('Error fetching integrations:', error);
      setError('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const connectToGoogleSheets = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      // Get Google Sheets auth URL
      const authUrl = await googleSheetsService.getGoogleSheetsAuthUrl();
      
      // Open Google OAuth in a popup
      const popup = window.open(
        authUrl,
        'google-sheets-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for the popup to close or receive a message
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setIsConnecting(false);
        }
      }, 1000);

      // Listen for auth success message
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'GOOGLE_SHEETS_AUTH_SUCCESS') {
          clearInterval(checkClosed);
          popup?.close();
          window.removeEventListener('message', handleMessage);
          
          const { accessToken, refreshToken, spreadsheetId } = event.data;
          
          // Setup the integration
          setupIntegration(accessToken, refreshToken, spreadsheetId);
        }
      };

      window.addEventListener('message', handleMessage);
    } catch (error) {
      console.error('Error connecting to Google Sheets:', error);
      setError('Failed to connect to Google Sheets');
      setIsConnecting(false);
    }
  };

  const setupIntegration = async (accessToken: string, refreshToken: string, spreadsheetId?: string) => {
    try {
      setLoading(true);
      setError(null);

      let finalSpreadsheetId = spreadsheetId;
      
      // If no spreadsheet ID provided, create a new one
      if (!finalSpreadsheetId) {
        const result = await googleSheetsService.createSpreadsheetForForm({
          id: formId,
          title: formTitle,
          blocks: []
        });
        finalSpreadsheetId = result.spreadsheetId;
      }

      // Setup the integration
      await googleSheetsService.setupGoogleSheetsIntegration(formId, {
        spreadsheetId: finalSpreadsheetId,
        sheetName: 'Form Responses',
        accessToken,
        refreshToken,
        clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET || ''
      });

      setSuccess('Google Sheets integration setup successfully!');
      fetchIntegrations();
    } catch (error) {
      console.error('Error setting up integration:', error);
      setError('Failed to setup Google Sheets integration');
    } finally {
      setLoading(false);
      setIsConnecting(false);
    }
  };

  const toggleIntegration = async (integrationId: string, isActive: boolean) => {
    try {
      setLoading(true);
      // In a real implementation, you would update the integration status
      console.log('Toggling integration:', integrationId, isActive);
      fetchIntegrations();
    } catch (error) {
      console.error('Error toggling integration:', error);
      setError('Failed to update integration');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <ExternalLink className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Google Sheets Integration
              </h2>
              <p className="text-sm text-gray-600">
                Sync form responses to Google Sheets automatically
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Success/Error Messages */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
            >
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-800">{success}</span>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </motion.div>
          )}

          {/* Integration List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Connected Spreadsheets
              </h3>
              <button
                onClick={connectToGoogleSheets}
                disabled={isConnecting || loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4" />
                {isConnecting ? 'Connecting...' : 'Connect New Sheet'}
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : integrations.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ExternalLink className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  No Google Sheets connected
                </h4>
                <p className="text-gray-600 mb-4">
                  Connect a Google Sheet to automatically sync form responses
                </p>
                <button
                  onClick={connectToGoogleSheets}
                  disabled={isConnecting}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isConnecting ? 'Connecting...' : 'Connect Google Sheets'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {integrations.map((integration) => (
                  <div
                    key={integration.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <ExternalLink className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {integration.sheetName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            ID: {integration.spreadsheetId}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleIntegration(integration.id, !integration.isActive)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            integration.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {integration.isActive ? 'Active' : 'Inactive'}
                        </button>
                        <button
                          onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${integration.spreadsheetId}`, '_blank')}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Open in Google Sheets"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Features */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">Features</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Real-time sync of form responses
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Automatic column headers with question labels
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                File upload information included
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Submission metadata (date, device, IP)
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default GoogleSheetsIntegration;
