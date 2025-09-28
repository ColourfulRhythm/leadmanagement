import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">AdParlay</span>
            </Link>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow-lg p-8"
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms and Conditions</h1>
            <p className="text-lg text-gray-600">Effective Date: January 1, 2025</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-8">
              Welcome to AdParlay. By accessing or using our platform, you agree to comply with the following Terms and Conditions. Please read carefully before using our services.
            </p>

            <hr className="my-8 border-gray-300" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700">
                By registering, accessing, or using AdParlay, you confirm that you are at least 18 years old and legally capable of entering into a binding contract under the laws of the Federal Republic of Nigeria.
              </p>
            </section>

            <hr className="my-8 border-gray-300" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Services</h2>
              <p className="text-gray-700">
                AdParlay provides a digital platform where businesses ("Placers") can create and publish ads, and individuals or groups ("Promoters") can share and promote those ads in exchange for rewards. We may modify or discontinue certain features at our discretion.
              </p>
            </section>

            <hr className="my-8 border-gray-300" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Responsibilities</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>You agree to provide accurate and truthful information when registering and using our platform.</li>
                <li>You agree not to misuse the platform for fraudulent, illegal, or harmful purposes.</li>
                <li>You are responsible for maintaining the confidentiality of your account details.</li>
              </ul>
            </section>

            <hr className="my-8 border-gray-300" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Payments and Rewards</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Placers must fund campaigns before promotion begins.</li>
                <li>Promoters earn rewards for valid, completed actions as defined in the campaign.</li>
                <li>AdParlay reserves the right to withhold or revoke payments if fraudulent activity is detected.</li>
              </ul>
            </section>

            <hr className="my-8 border-gray-300" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Intellectual Property</h2>
              <p className="text-gray-700">
                All content, trademarks, and materials on AdParlay remain the property of their respective owners. Users may not copy, reproduce, or exploit any content without proper authorization.
              </p>
            </section>

            <hr className="my-8 border-gray-300" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Limitation of Liability</h2>
              <p className="text-gray-700">
                AdParlay provides its services "as is" and does not guarantee uninterrupted access or error-free operation. We are not liable for losses, damages, or claims arising from your use of the platform.
              </p>
            </section>

            <hr className="my-8 border-gray-300" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Termination</h2>
              <p className="text-gray-700">
                We may suspend or terminate your account if you breach these Terms, engage in fraudulent activity, or misuse the platform.
              </p>
            </section>

            <hr className="my-8 border-gray-300" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Governing Law</h2>
              <p className="text-gray-700">
                These Terms are governed by and construed in accordance with the laws of the Federal Republic of Nigeria, and any disputes shall be subject to the exclusive jurisdiction of Nigerian courts.
              </p>
            </section>

            <hr className="my-8 border-gray-300" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Amendments</h2>
              <p className="text-gray-700">
                We may update these Terms from time to time. Continued use of the platform after such updates constitutes acceptance of the new Terms.
              </p>
            </section>
          </div>

          <div className="text-center mt-12">
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Terms;
