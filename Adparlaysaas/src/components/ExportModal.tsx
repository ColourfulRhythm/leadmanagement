import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface Form {
  id: string;
  title: string;
  description: string;
  submissions: number;
  createdAt: Date;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  isProUser: boolean;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, userId, isProUser }) => {
  const [forms, setForms] = useState<Form[]>([]);
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [exportType, setExportType] = useState<'excel' | 'pdf'>('excel');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchForms();
    }
  }, [isOpen, userId]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const formsQuery = query(
        collection(db, 'forms'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const formsSnapshot = await getDocs(formsQuery);
      const formsData = formsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Form[];
      setForms(formsData);
      
      // Select all forms by default
      setSelectedForms(formsData.map(form => form.id));
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedForms.length === forms.length) {
      setSelectedForms([]);
    } else {
      setSelectedForms(forms.map(form => form.id));
    }
  };

  const handleFormToggle = (formId: string) => {
    if (selectedForms.includes(formId)) {
      setSelectedForms(selectedForms.filter(id => id !== formId));
    } else {
      setSelectedForms([...selectedForms, formId]);
    }
  };

  const handleExport = async () => {
    if (selectedForms.length === 0) {
      alert('Please select at least one form to export.');
      return;
    }

    if (exportType === 'pdf' && !isProUser) {
      alert('PDF export is a Pro feature. Please upgrade to access this functionality.');
      return;
    }

    setExporting(true);
    try {
      if (exportType === 'excel') {
        await exportToExcel();
      } else {
        await exportToPDF();
      }
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const exportToExcel = async () => {
    // Fetch responses for selected forms
    const responsesQuery = query(collection(db, 'formSubmissions'));
    const responsesSnapshot = await getDocs(responsesQuery);
    
    const selectedFormResponses = responsesSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate() || new Date()
      }))
      .filter((response: any) => selectedForms.includes(response.formId));

    if (selectedFormResponses.length === 0) {
      alert('No responses found for the selected forms.');
      return;
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Group responses by form
    const formGroups = selectedFormResponses.reduce((groups: any, response: any) => {
      if (!groups[response.formTitle]) {
        groups[response.formTitle] = [];
      }
      groups[response.formTitle].push(response);
      return groups;
    }, {});

    // Create worksheet for each form
    Object.entries(formGroups).forEach(([formTitle, responses]: [string, any]) => {
      const worksheetData = responses.map((response: any) => {
        const row: any = {
          'Form Title': response.formTitle,
          'Submission Date': response.submittedAt.toLocaleDateString(),
          'Submission Time': response.submittedAt.toLocaleTimeString(),
          'User Agent': response.userAgent,
          'IP Address': response.ipAddress
        };

        // Add form responses
        Object.entries(response.formData).forEach(([key, value]) => {
          row[`Question: ${key}`] = Array.isArray(value) ? value.join(', ') : String(value);
        });

        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, formTitle.substring(0, 31)); // Excel sheet names limited to 31 chars
    });

    // Export
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `adparlay-export-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const exportToPDF = async () => {
    // For now, use window.print() - can be enhanced with jsPDF later
    const printContent = document.createElement('div');
    printContent.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #1f2937; margin-bottom: 20px;">AdParlay Forms Export</h1>
        <p style="color: #6b7280; margin-bottom: 30px;">Generated on ${new Date().toLocaleDateString()}</p>
        
        <h2 style="color: #374151; margin-bottom: 15px;">Selected Forms</h2>
        <ul style="margin-bottom: 20px;">
          ${forms.filter(form => selectedForms.includes(form.id)).map(form => 
            `<li style="margin-bottom: 10px;">
              <strong>${form.title}</strong> - ${form.submissions} submissions
              <br><span style="color: #6b7280; font-size: 14px;">${form.description}</span>
            </li>`
          ).join('')}
        </ul>
        
        <p style="color: #6b7280; font-size: 14px;">
          This report contains data for ${selectedForms.length} form(s) with a total of 
          ${forms.filter(form => selectedForms.includes(form.id)).reduce((sum, form) => sum + form.submissions, 0)} submissions.
        </p>
      </div>
    `;
    
    document.body.appendChild(printContent);
    window.print();
    document.body.removeChild(printContent);
  };

  const format = (date: Date, formatStr: string) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return formatStr
      .replace('yyyy', String(year))
      .replace('MM', month)
      .replace('dd', day);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Export Data</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Export Type Selection */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Export Format</h3>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="excel"
                      checked={exportType === 'excel'}
                      onChange={(e) => setExportType(e.target.value as 'excel' | 'pdf')}
                      className="mr-2"
                    />
                    <span className="text-gray-700">Excel (.xlsx)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="pdf"
                      checked={exportType === 'pdf'}
                      onChange={(e) => setExportType(e.target.value as 'excel' | 'pdf')}
                      className="mr-2"
                    />
                    <span className="text-gray-700">
                      PDF 
                      {!isProUser && <span className="text-red-500 ml-1">(Pro Only)</span>}
                    </span>
                  </label>
                </div>
              </div>

              {/* Form Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Select Forms</h3>
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {selectedForms.length === forms.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
                  {forms.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No forms found</p>
                  ) : (
                    <div className="space-y-2">
                      {forms.map((form) => (
                        <label key={form.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedForms.includes(form.id)}
                            onChange={() => handleFormToggle(form.id)}
                            className="mr-3"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{form.title}</div>
                            <div className="text-sm text-gray-600">{form.description}</div>
                            <div className="text-xs text-gray-500">
                              {form.submissions} submissions • Created {form.createdAt.toLocaleDateString()}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Export Summary</h4>
                <div className="text-sm text-gray-600">
                  <p>• {selectedForms.length} form(s) selected</p>
                  <p>• {forms.filter(form => selectedForms.includes(form.id)).reduce((sum, form) => sum + form.submissions, 0)} total submissions</p>
                  <p>• Format: {exportType.toUpperCase()}</p>
                  {exportType === 'pdf' && !isProUser && (
                    <p className="text-red-600 font-medium">⚠️ PDF export requires Pro subscription</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {selectedForms.length > 0 
                ? `Ready to export ${selectedForms.length} form(s)`
                : 'Please select forms to export'
              }
            </p>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={selectedForms.length === 0 || exporting || (exportType === 'pdf' && !isProUser)}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  selectedForms.length === 0 || exporting || (exportType === 'pdf' && !isProUser)
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : exportType === 'excel'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {exporting ? 'Exporting...' : `Export to ${exportType.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ExportModal;
