import React, { useState } from 'react';

interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'checkbox' | 'radio';
  label: string;
  required: boolean;
  options?: string[];
  conditional?: {
    dependsOn: string;
    value: string;
  };
}

interface FieldModalProps {
  field?: FormField | null;
  onSave: (fieldId: string, field: FormField) => void;
  onCancel: () => void;
  existingFields: FormField[];
}

const FieldModal: React.FC<FieldModalProps> = ({ field, onSave, onCancel, existingFields }) => {
  const [fieldData, setFieldData] = useState<FormField>(
    field || {
      id: '',
      type: 'text',
      label: '',
      required: false,
      options: []
    }
  );

  const [showConditional, setShowConditional] = useState(!!field?.conditional);

  const fieldTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'email', label: 'Email Input' },
    { value: 'phone', label: 'Phone Number' },
    { value: 'select', label: 'Dropdown' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'radio', label: 'Radio Buttons' }
  ];

  const handleSave = () => {
    const fieldId = field?.id || `field_${Date.now()}`;
    onSave(fieldId, fieldData);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Field Label
        </label>
        <input
          type="text"
          value={fieldData.label}
          onChange={(e) => setFieldData(prev => ({ ...prev, label: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter field label"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Field Type
        </label>
        <select
          value={fieldData.type}
          onChange={(e) => setFieldData(prev => ({ ...prev, type: e.target.value as any }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {fieldTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {(fieldData.type === 'select' || fieldData.type === 'radio') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Options (one per line)
          </label>
          <textarea
            value={fieldData.options?.join('\n') || ''}
            onChange={(e) => setFieldData(prev => ({ 
              ...prev, 
              options: e.target.value.split('\n').filter(option => option.trim()) 
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Option 1&#10;Option 2&#10;Option 3"
          />
        </div>
      )}

      <div className="flex items-center">
        <input
          type="checkbox"
          id="required"
          checked={fieldData.required}
          onChange={(e) => setFieldData(prev => ({ ...prev, required: e.target.checked }))}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="required" className="ml-2 block text-sm text-gray-900">
          Required field
        </label>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="conditional"
          checked={showConditional}
          onChange={(e) => setShowConditional(e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="conditional" className="ml-2 block text-sm text-gray-900">
          Show conditionally (branching logic)
        </label>
      </div>

      {showConditional && (
        <div className="space-y-3 p-3 bg-gray-50 rounded-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Depends on field
            </label>
            <select
              value={fieldData.conditional?.dependsOn || ''}
              onChange={(e) => setFieldData(prev => ({ 
                ...prev, 
                conditional: { 
                  dependsOn: e.target.value,
                  value: prev.conditional?.value || ''
                } 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a field</option>
              {existingFields
                .filter(f => f.id !== fieldData.id)
                .map(f => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              When value equals
            </label>
            <input
              type="text"
              value={fieldData.conditional?.value || ''}
              onChange={(e) => setFieldData(prev => ({ 
                ...prev, 
                conditional: { 
                  dependsOn: prev.conditional?.dependsOn || '',
                  value: e.target.value 
                } 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter value"
            />
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {field ? 'Update' : 'Add'} Field
        </button>
      </div>
    </div>
  );
};

export default FieldModal; 