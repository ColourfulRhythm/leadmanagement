import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Privacy: React.FC = () => {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-lg text-gray-600">Effective Date: January 1, 2025</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-8">
              At AdParlay, we respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information.
            </p>

            <hr className="my-8 border-gray-300" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Personal Information:</strong> Name, email, phone number, payment details, and account login credentials.</li>
                <li><strong>Usage Information:</strong> Device type, browser, IP address, and activity on the platform.</li>
                <li><strong>Content Information:</strong> Ads, campaigns, and media files you upload.</li>
              </ul>
            </section>

            <hr className="my-8 border-gray-300" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">We use your data to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Provide and improve our services.</li>
                <li>Process transactions and payouts.</li>
                <li>Verify user activity and prevent fraud.</li>
                <li>Communicate updates, promotions, and support information.</li>
                <li>Enhance system performance, including through data analysis and model improvements.</li>
              </ul>
              <p className="text-gray-700 mt-4 italic">
                (Some anonymized data may also be used to improve automated systems and enhance service functionality.)
              </p>
            </section>

            <hr className="my-8 border-gray-300" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Data Sharing</h2>
              <p className="text-gray-700 mb-4">We do not sell personal data. However, we may share information with:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Service providers (e.g., payment processors, cloud hosting).</li>
                <li>Legal authorities if required by law in Nigeria.</li>
                <li>Business partners to deliver platform services.</li>
              </ul>
            </section>

            <hr className="my-8 border-gray-300" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Retention</h2>
              <p className="text-gray-700">
                We retain user data as long as your account is active or as necessary to comply with legal and regulatory obligations in Nigeria.
              </p>
            </section>

            <hr className="my-8 border-gray-300" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Security</h2>
              <p className="text-gray-700">
                We apply reasonable technical and organizational measures to protect your information, but no system is fully secure. Users are encouraged to safeguard their login details.
              </p>
            </section>

            <hr className="my-8 border-gray-300" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. User Rights</h2>
              <p className="text-gray-700 mb-4">You have the right to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Access, update, or delete your personal data.</li>
                <li>Withdraw consent for marketing communications.</li>
                <li>Request clarification on how your data is used.</li>
              </ul>
              <p className="text-gray-700 mt-4">
                Requests can be made by contacting us at{' '}
                <a href="mailto:support@adparlay.com" className="text-blue-600 hover:text-blue-800 underline">
                  support@adparlay.com
                </a>
                .
              </p>
            </section>

            <hr className="my-8 border-gray-300" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Jurisdiction</h2>
              <p className="text-gray-700">
                This Privacy Policy is governed by the laws of the Federal Republic of Nigeria.
              </p>
            </section>

            <hr className="my-8 border-gray-300" />

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Updates</h2>
              <p className="text-gray-700">
                We may revise this Privacy Policy from time to time. Updates will be posted on the platform, and continued use indicates acceptance of the changes.
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

export default Privacy;
