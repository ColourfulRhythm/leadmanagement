import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FormData {
  name: string;
  email: string;
  phone: string;
  interest: string;
  option: string;
  plotSize?: string;
  finalOption?: string;
}

interface FormContextType {
  formData: FormData;
  currentStep: number;
  prevStep: number;
  plotSize: string;
  updateFormData: (data: Partial<FormData>) => void;
  nextStep: () => void;
  goToPrevStep: () => void;
  goToStep: (step: number) => void;
  resetForm: () => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (context === undefined) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
};

interface FormProviderProps {
  children: ReactNode;
}

export const FormProvider: React.FC<FormProviderProps> = ({ children }) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    interest: '',
    option: '',
    plotSize: '',
    finalOption: ''
  });
  
  const [currentStep, setCurrentStep] = useState(1);
  const [prevStep, setPrevStep] = useState(0);
  const [plotSize, setPlotSize] = useState('');

  const updateFormData = (data: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    setPrevStep(currentStep);
    setCurrentStep(prev => prev + 1);
  };

  const goToPrevStep = () => {
    setPrevStep(currentStep);
    setCurrentStep(prev => prev - 1);
  };

  const goToStep = (step: number) => {
    setPrevStep(currentStep);
    setCurrentStep(step);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      interest: '',
      option: '',
      plotSize: '',
      finalOption: ''
    });
    setCurrentStep(1);
    setPrevStep(0);
    setPlotSize('');
  };

  const value = {
    formData,
    currentStep,
    prevStep,
    plotSize,
    updateFormData,
    nextStep,
    goToPrevStep,
    goToStep,
    resetForm
  };

  return (
    <FormContext.Provider value={value}>
      {children}
    </FormContext.Provider>
  );
}; 