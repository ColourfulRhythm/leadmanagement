import React, { useRef } from "react";
import { useFormContext } from "./FormContext";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";

const interestOptions = [
  "2 Seasons Residential",
  "True Vine Lakefront Villas",
  "True Vine Lake Front Plots",
  "Hygge Town",
  "The Wellness Hub",
];

const stepVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

const MultiStepForm: React.FC = () => {
  const { step, formData, updateForm, nextStep, prevStep, resetForm } = useFormContext();
  const summaryCardRef = useRef<HTMLDivElement>(null);

  const downloadAsImage = async () => {
    if (summaryCardRef.current) {
      try {
        const canvas = await html2canvas(summaryCardRef.current, {
          backgroundColor: "#ffffff",
          scale: 2,
          useCORS: true,
          allowTaint: true,
        });
        
        const link = document.createElement('a');
        link.download = `2-seasons-response-${formData.name.replace(/\s+/g, '-').toLowerCase()}.png`;
        link.href = canvas.toDataURL();
        link.click();
      } catch (error) {
        console.error('Error generating image:', error);
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(formData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "responses.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      }
    }
  };

  const renderBackButton = () => {
    if (step > 1 && step < 6) {
      return (
        <button
          onClick={prevStep}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Go back"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      );
    }
    return null;
  };

  return (
    <>
      <div 
        ref={summaryCardRef}
        className="fixed top-0 left-0 w-[800px] h-[600px] bg-white p-8 -translate-x-full pointer-events-none"
        style={{ zIndex: -1 }}
      >
        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-blue-700 mb-2">2 SEASONS</div>
          <div className="text-lg text-gray-600">Residential Development</div>
          <div className="text-sm text-gray-500 mt-1">Phase 1 — The City of the 1%</div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-blue-800 mb-4 text-center">Your Interest Summary</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-blue-200 pb-2">
              <span className="font-semibold text-gray-700">Name:</span>
              <span className="text-blue-800">{formData.name}</span>
            </div>
            
            <div className="flex justify-between items-center border-b border-blue-200 pb-2">
              <span className="font-semibold text-gray-700">Email:</span>
              <span className="text-blue-800">{formData.email}</span>
            </div>
            
            <div className="flex justify-between items-center border-b border-blue-200 pb-2">
              <span className="font-semibold text-gray-700">Phone:</span>
              <span className="text-blue-800">{formData.phone}</span>
            </div>
            
            <div className="flex justify-between items-center border-b border-blue-200 pb-2">
              <span className="font-semibold text-gray-700">Interest:</span>
              <span className="text-blue-800">{formData.interest}</span>
            </div>
            
            {formData.plotSize && (
              <div className="flex justify-between items-center border-b border-blue-200 pb-2">
                <span className="font-semibold text-gray-700">Plot Size:</span>
                <span className="text-blue-800">{formData.plotSize}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">Selection:</span>
              <span className="text-blue-800">{formData.description}</span>
            </div>
          </div>
        </div>
        
        <div className="text-center text-sm text-gray-500 mt-6">
          <div>Generated on {new Date().toLocaleDateString()}</div>
          <div className="mt-2">Thank you for your interest in 2 Seasons Residential</div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.form
            key="step1"
            className="space-y-6 md:space-y-8 bg-white rounded-xl shadow-2xl p-4 md:p-8 animate-fade-in"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={stepVariants}
            transition={{ duration: 0.5, type: "spring" }}
            onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              nextStep();
            }}
          >
            <h2 className="text-xl md:text-2xl font-bold text-blue-700 mb-4 md:mb-6 text-center drop-shadow">Let's get to know you</h2>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
              <input
                type="text"
                className="w-full px-3 md:px-4 py-2 md:py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 text-base md:text-lg transition"
                value={formData.name}
                onChange={e => updateForm({ name: e.target.value })}
                required
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input
                type="email"
                className="w-full px-3 md:px-4 py-2 md:py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 text-base md:text-lg transition"
                value={formData.email}
                onChange={e => updateForm({ email: e.target.value })}
                required
                placeholder="you@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                className="w-full px-3 md:px-4 py-2 md:py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 text-base md:text-lg transition"
                value={formData.phone}
                onChange={e => updateForm({ phone: e.target.value })}
                required
                placeholder="e.g. +1 234 567 8900"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 md:py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-lg font-semibold text-base md:text-lg shadow-lg hover:from-blue-700 hover:to-blue-500 transition"
            >
              Next
            </button>
          </motion.form>
        )}
        {step === 2 && (
          <motion.div
            key="step2"
            className="relative space-y-6 md:space-y-8 bg-white rounded-xl shadow-2xl p-4 md:p-8 animate-fade-in"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={stepVariants}
            transition={{ duration: 0.5, type: "spring" }}
          >
            {renderBackButton()}
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-2 drop-shadow">What interests you most?</h2>
              <p className="text-gray-600 text-base md:text-lg">Select your primary area of interest</p>
            </div>
            <div className="space-y-3 md:space-y-4">
              {interestOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => updateForm({ interest: option })}
                  className={`w-full p-3 md:p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                    formData.interest === option
                      ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span className="font-semibold text-base md:text-lg">{option}</span>
                </button>
              ))}
            </div>
            <button
              onClick={nextStep}
              disabled={!formData.interest}
              className="w-full py-2 md:py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-lg font-semibold text-base md:text-lg shadow-lg hover:from-blue-700 hover:to-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </motion.div>
        )}
        {step === 3 && (
          <motion.div
            key="step3"
            className="relative space-y-6 md:space-y-8 bg-white rounded-xl shadow-2xl p-4 md:p-8 animate-fade-in"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={stepVariants}
            transition={{ duration: 0.5, type: "spring" }}
          >
            {renderBackButton()}
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-2 drop-shadow">
                {formData.interest === "True Vine Lake Front Plots" 
                  ? "Select a plot size" 
                  : "Choose your option"}
              </h2>
              <p className="text-gray-600 text-base md:text-lg">
                {formData.interest === "True Vine Lake Front Plots" 
                  ? "Select your preferred plot size" 
                  : "Select what you'd like to do"}
              </p>
            </div>
            <div className="space-y-3 md:space-y-4">
              {(() => {
                let options: string[] = [];
                switch (formData.interest) {
                  case "2 Seasons Residential":
                    options = [
                      "Claim ownership now",
                      "Make a deposit",
                      "Claim ownership later",
                      "Show my interest",
                    ];
                    break;
                  case "True Vine Lakefront Villas":
                    options = [
                      "Buy now and start building",
                      "Buy now and build later",
                      "Note my interest",
                    ];
                    break;
                  case "True Vine Lake Front Plots":
                    options = [
                      "500 sqm",
                      "1000 sqm",
                      "1500 sqm",
                    ];
                    break;
                  case "Hygge Town":
                    options = [
                      "I run a startup",
                      "I own a VC",
                      "I want to partner in building",
                      "I want to build a head office",
                    ];
                    break;
                  case "The Wellness Hub":
                    options = [
                      "Fitness coach",
                      "Fitness enthusiast",
                      "Herbal remedies enthusiast",
                      "Masseuse",
                      "Meditation and Prayer Therapy enthusiast",
                    ];
                    break;
                  default:
                    options = [];
                }
                return options.map(option => (
                  <button
                    key={option}
                    onClick={() => {
                      if (formData.interest === "True Vine Lake Front Plots") {
                        updateForm({ plotSize: option });
                      } else {
                        updateForm({ description: option });
                      }
                    }}
                    className={`w-full p-3 md:p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                      (formData.interest === "True Vine Lake Front Plots" ? formData.plotSize : formData.description) === option
                        ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <span className="font-semibold text-base md:text-lg">{option}</span>
                  </button>
                ));
              })()}
            </div>
            <button
              onClick={nextStep}
              disabled={!(formData.interest === "True Vine Lake Front Plots" ? formData.plotSize : formData.description)}
              className="w-full py-2 md:py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-lg font-semibold text-base md:text-lg shadow-lg hover:from-blue-700 hover:to-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </motion.div>
        )}
        {step === 4 && (
          <motion.div
            key="step4"
            className="relative space-y-6 md:space-y-8 bg-white rounded-xl shadow-2xl p-4 md:p-8 animate-fade-in"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={stepVariants}
            transition={{ duration: 0.5, type: "spring" }}
          >
            {renderBackButton()}
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-2 drop-shadow">
                {formData.interest === "True Vine Lake Front Plots" 
                  ? `What would you like to do with your ${formData.plotSize} plot?` 
                  : "Your Information"}
              </h2>
              <p className="text-gray-600 text-base md:text-lg">
                {formData.interest === "True Vine Lake Front Plots" 
                  ? "Select your preference" 
                  : "Please provide your contact details"}
              </p>
            </div>
            
            {formData.interest === "True Vine Lake Front Plots" ? (
              <div className="space-y-3 md:space-y-4">
                {[
                  "Buy now and build",
                  "Buy now and build later",
                  "Buy now and sell later",
                  "Note my interest",
                ].map(option => (
                  <button
                    key={option}
                    onClick={() => updateForm({ description: option })}
                    className={`w-full p-3 md:p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                      formData.description === option
                        ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <span className="font-semibold text-base md:text-lg">{option}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4 md:space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateForm({ name: e.target.value })}
                    className="w-full p-3 md:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base md:text-lg"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => updateForm({ email: e.target.value })}
                    className="w-full p-3 md:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base md:text-lg"
                    placeholder="Enter your email address"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => updateForm({ phone: e.target.value })}
                    className="w-full p-3 md:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base md:text-lg"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>
            )}
            
            <button
              onClick={nextStep}
              disabled={
                formData.interest === "True Vine Lake Front Plots" 
                  ? !formData.description 
                  : (!formData.name || !formData.email || !formData.phone)
              }
              className="w-full py-2 md:py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-lg font-semibold text-base md:text-lg shadow-lg hover:from-blue-700 hover:to-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {formData.interest === "True Vine Lake Front Plots" ? "Next" : "Submit"}
            </button>
          </motion.div>
        )}
        {step === 5 && (
          <motion.div
            key="step5"
            className="relative space-y-6 md:space-y-8 bg-white rounded-xl shadow-2xl p-4 md:p-8 animate-fade-in"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={stepVariants}
            transition={{ duration: 0.5, type: "spring" }}
          >
            {renderBackButton()}
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-2 drop-shadow">Your Information</h2>
              <p className="text-gray-600 text-base md:text-lg">Please provide your contact details</p>
            </div>
            <div className="space-y-4 md:space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateForm({ name: e.target.value })}
                  className="w-full p-3 md:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base md:text-lg"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => updateForm({ email: e.target.value })}
                  className="w-full p-3 md:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base md:text-lg"
                  placeholder="Enter your email address"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateForm({ phone: e.target.value })}
                  className="w-full p-3 md:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base md:text-lg"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
            <button
              onClick={nextStep}
              disabled={!formData.name || !formData.email || !formData.phone}
              className="w-full py-2 md:py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-lg font-semibold text-base md:text-lg shadow-lg hover:from-blue-700 hover:to-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit
            </button>
          </motion.div>
        )}
        {step === 6 && (
          <motion.div
            key="step6"
            className="space-y-6 md:space-y-8 text-center bg-white rounded-xl shadow-2xl p-4 md:p-8 animate-fade-in"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={stepVariants}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-green-700 mb-2 drop-shadow">Thank you!</h2>
              <p className="text-gray-700 text-base md:text-lg">Your responses have been recorded.</p>
            </div>
            <button
              onClick={downloadAsImage}
              className="w-full py-2 md:py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-lg font-semibold text-base md:text-lg shadow-lg hover:from-blue-700 hover:to-blue-500 transition"
            >
              Download Your Summary (PNG)
            </button>
            <button
              onClick={resetForm}
              className="w-full py-2 md:py-3 px-4 bg-gray-500 text-white rounded-lg font-semibold text-base md:text-lg shadow-lg hover:bg-gray-600 transition"
            >
              Start Over
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MultiStepForm; 