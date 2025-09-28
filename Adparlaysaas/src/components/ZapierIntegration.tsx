import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, CheckCircle, AlertCircle, Settings, Plus, Zap, Link, Copy } from 'lucide-react';
import { zapierService } from '../services/zapierService';

interface ZapierIntegrationProps {
  formId: string;
  formTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

interface IntegrationConfig {
  id: string;
  webhookUrl: string;
  isActive: boolean;
  createdAt: Date;
  customFields?: Record<string, any>;
}

const ZapierIntegration: React.FC<ZapierIntegrationProps> = ({
  formId,
  formTitle,
  isOpen,
  onClose
}) => {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [showAddField, setShowAddField] = useState(false);
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');

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

  const addIntegration = async () => {
    if (!webhookUrl.trim()) {
      setError('Please enter a webhook URL');
      return;
    }

    if (!zapierService.validateWebhookUrl(webhookUrl)) {
      setError('Please enter a valid webhook URL (Zapier, Make, or n8n)');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await zapierService.setupZapierIntegration(formId, {
        webhookUrl: webhookUrl.trim(),
        isActive: true,
        customFields: Object.keys(customFields).length > 0 ? customFields : undefined
      });

      setSuccess('Zapier integration added successfully!');
      setWebhookUrl('');
      setCustomFields({});
      fetchIntegrations();
    } catch (error) {
      console.error('Error adding integration:', error);
      setError('Failed to add Zapier integration');
    } finally {
      setLoading(false);
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

  const addCustomField = () => {
    if (newFieldKey.trim() && newFieldValue.trim()) {
      setCustomFields(prev => ({
        ...prev,
        [newFieldKey.trim()]: newFieldValue.trim()
      }));
      setNewFieldKey('');
      setNewFieldValue('');
      setShowAddField(false);
    }
  };

  const removeCustomField = (key: string) => {
    setCustomFields(prev => {
      const newFields = { ...prev };
      delete newFields[key];
      return newFields;
    });
  };

  const copyWebhookUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setSuccess('Webhook URL copied to clipboard!');
    setTimeout(() => setSuccess(null), 2000);
  };

  const popularIntegrations = zapierService.getPopularIntegrations();

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
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Zapier Integration
              </h2>
              <p className="text-sm text-gray-600">
                Connect to 5000+ apps with Zapier and Make
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add Integration */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Add Webhook Integration
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Webhook URL
                    </label>
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://hooks.zapier.com/hooks/catch/..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Supports Zapier, Make (Integromat), and n8n webhooks
                    </p>
                  </div>

                  {/* Custom Fields */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Custom Fields (Optional)
                      </label>
                      <button
                        onClick={() => setShowAddField(true)}
                        className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add Field
                      </button>
                    </div>
                    
                    {Object.keys(customFields).length > 0 && (
                      <div className="space-y-2 mb-2">
                        {Object.entries(customFields).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                            <span className="text-sm font-medium text-gray-700">{key}:</span>
                            <span className="text-sm text-gray-600">{value}</span>
                            <button
                              onClick={() => removeCustomField(key)}
                              className="text-red-600 hover:text-red-700 ml-auto"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {showAddField && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newFieldKey}
                          onChange={(e) => setNewFieldKey(e.target.value)}
                          placeholder="Field name"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          value={newFieldValue}
                          onChange={(e) => setNewFieldValue(e.target.value)}
                          placeholder="Field value"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                        <button
                          onClick={addCustomField}
                          className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setShowAddField(false);
                            setNewFieldKey('');
                            setNewFieldValue('');
                          }}
                          className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={addIntegration}
                    disabled={loading || !webhookUrl.trim()}
                    className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Adding...' : 'Add Integration'}
                  </button>
                </div>
              </div>

              {/* Connected Integrations */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Connected Integrations
                </h3>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                  </div>
                ) : integrations.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Link className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      No integrations connected
                    </h4>
                    <p className="text-gray-600">
                      Add a webhook URL to start connecting to external apps
                    </p>
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
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                              <Zap className="w-4 h-4 text-orange-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">
                                {integration.webhookUrl}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Connected on {integration.createdAt.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyWebhookUrl(integration.webhookUrl)}
                              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Copy webhook URL"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
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
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Popular Integrations */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Popular Integrations
                </h3>
                
                <div className="grid grid-cols-1 gap-3">
                  {popularIntegrations.map((integration, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{integration.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{integration.name}</h4>
                          <p className="text-sm text-gray-600">{integration.description}</p>
                          <span className="inline-block mt-1 px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                            {integration.category}
                          </span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Zapier Features</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Connect to 5000+ apps
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Real-time webhook triggers
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Custom field mapping
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Conditional logic support
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Multi-step workflows
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ZapierIntegration;
