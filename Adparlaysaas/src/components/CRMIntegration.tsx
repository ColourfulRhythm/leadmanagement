import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, CheckCircle, AlertCircle, Settings, Plus, Users, Building2, Zap } from 'lucide-react';
import { crmService } from '../services/crmService';

interface CRMIntegrationProps {
  formId: string;
  formTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

interface IntegrationConfig {
  id: string;
  type: 'hubspot' | 'zoho' | 'salesforce';
  isActive: boolean;
  createdAt: Date;
  accountId?: string;
  portalId?: string;
}

const CRMIntegration: React.FC<CRMIntegrationProps> = ({
  formId,
  formTitle,
  isOpen,
  onClose
}) => {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

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

  const connectToCRM = async (crmType: 'hubspot' | 'zoho' | 'salesforce') => {
    try {
      setIsConnecting(crmType);
      setError(null);
      
      // Get CRM auth URL
      const authUrl = await crmService.getCRMAuthUrl(crmType);
      
      // Open OAuth in a popup
      const popup = window.open(
        authUrl,
        `${crmType}-auth`,
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for the popup to close or receive a message
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setIsConnecting(null);
        }
      }, 1000);

      // Listen for auth success message
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'CRM_AUTH_SUCCESS') {
          clearInterval(checkClosed);
          popup?.close();
          window.removeEventListener('message', handleMessage);
          
          const { accessToken, refreshToken, accountId, portalId } = event.data;
          
          // Setup the integration
          setupIntegration(crmType, accessToken, refreshToken, accountId, portalId);
        }
      };

      window.addEventListener('message', handleMessage);
    } catch (error) {
      console.error(`Error connecting to ${crmType}:`, error);
      setError(`Failed to connect to ${crmType}`);
      setIsConnecting(null);
    }
  };

  const setupIntegration = async (
    crmType: 'hubspot' | 'zoho' | 'salesforce',
    accessToken: string,
    refreshToken: string,
    accountId?: string,
    portalId?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Setup the integration
      await crmService.setupCRMIntegration(formId, {
        type: crmType,
        accessToken,
        refreshToken,
        clientId: process.env.REACT_APP_CRM_CLIENT_ID || '',
        clientSecret: process.env.REACT_APP_CRM_CLIENT_SECRET || '',
        accountId,
        portalId
      });

      setSuccess(`${crmType.charAt(0).toUpperCase() + crmType.slice(1)} integration setup successfully!`);
      fetchIntegrations();
    } catch (error) {
      console.error('Error setting up integration:', error);
      setError(`Failed to setup ${crmType} integration`);
    } finally {
      setLoading(false);
      setIsConnecting(null);
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

  const getCRMInfo = (type: 'hubspot' | 'zoho' | 'salesforce') => {
    const info = {
      hubspot: {
        name: 'HubSpot',
        description: 'Popular CRM with free tier',
        icon: Building2,
        color: 'bg-orange-500',
        features: ['Free tier available', 'Lead scoring', 'Email marketing', 'Sales pipeline']
      },
      zoho: {
        name: 'Zoho CRM',
        description: 'Widely used in Nigeria',
        icon: Users,
        color: 'bg-blue-500',
        features: ['Local support', 'Affordable pricing', 'Custom fields', 'Mobile app']
      },
      salesforce: {
        name: 'Salesforce',
        description: 'Enterprise-grade CRM',
        icon: Zap,
        color: 'bg-blue-600',
        features: ['Enterprise features', 'Advanced analytics', 'Custom objects', 'API access']
      }
    };
    return info[type];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                CRM Integrations
              </h2>
              <p className="text-sm text-gray-600">
                Push leads directly into your sales pipeline
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

          {/* CRM Options */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Available CRM Systems
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['hubspot', 'zoho', 'salesforce'] as const).map((crmType) => {
                  const info = getCRMInfo(crmType);
                  const Icon = info.icon;
                  const isConnectingToThis = isConnecting === crmType;
                  
                  return (
                    <div
                      key={crmType}
                      className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 ${info.color} rounded-lg flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{info.name}</h4>
                          <p className="text-sm text-gray-600">{info.description}</p>
                        </div>
                      </div>
                      
                      <ul className="space-y-2 mb-4">
                        {info.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      
                      <button
                        onClick={() => connectToCRM(crmType)}
                        disabled={isConnectingToThis || loading}
                        className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                          crmType === 'hubspot'
                            ? 'bg-orange-600 hover:bg-orange-700 text-white'
                            : crmType === 'zoho'
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-blue-700 hover:bg-blue-800 text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isConnectingToThis ? 'Connecting...' : `Connect ${info.name}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Connected Integrations */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Connected CRM Systems
              </h3>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : integrations.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    No CRM systems connected
                  </h4>
                  <p className="text-gray-600">
                    Connect a CRM system to automatically push leads into your sales pipeline
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {integrations.map((integration) => {
                    const info = getCRMInfo(integration.type);
                    const Icon = info.icon;
                    
                    return (
                      <div
                        key={integration.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 ${info.color} rounded-lg flex items-center justify-center`}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {info.name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Connected on {integration.createdAt.toLocaleDateString()}
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
                              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Manage integration"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Features */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">CRM Integration Features</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Automatic lead creation in your CRM
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Smart field mapping from form responses
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Lead source tracking
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Custom field support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Real-time sync with form submissions
                </li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CRMIntegration;
