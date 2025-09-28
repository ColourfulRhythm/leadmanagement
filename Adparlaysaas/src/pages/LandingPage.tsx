import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="bg-black/95 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-black font-bold text-xl">A</span>
              </div>
              <span className="text-2xl font-bold text-white">AdParlay</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-all duration-300 font-medium">Features</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-all duration-300 font-medium">Pricing</a>
              <a href="#about" className="text-gray-300 hover:text-white transition-all duration-300 font-medium">About</a>
            </div>
            
            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-300 hover:text-white transition-all duration-300 font-medium px-4 py-2 rounded-lg hover:bg-gray-800"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-6 py-2 bg-white text-black rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-all duration-300"
                aria-label="Toggle mobile menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden border-t border-gray-800 py-4"
            >
              <div className="flex flex-col space-y-4">
                <a href="#features" className="text-gray-300 hover:text-white transition-colors font-medium px-4 py-2 rounded-lg hover:bg-gray-800">Features</a>
                <a href="#pricing" className="text-gray-300 hover:text-white transition-colors font-medium px-4 py-2 rounded-lg hover:bg-gray-800">Pricing</a>
                <a href="#about" className="text-gray-300 hover:text-white transition-colors font-medium px-4 py-2 rounded-lg hover:bg-gray-800">About</a>
                <div className="border-t border-gray-800 pt-4 mt-4">
                  <Link
                    to="/login"
                    className="block text-gray-300 hover:text-white transition-colors font-medium px-4 py-2 rounded-lg hover:bg-gray-800 mb-2"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="block px-4 py-2 bg-white text-black rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300 text-center shadow-lg"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Hero Section - Black and White Design */}
      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-black">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 via-transparent to-gray-800/50"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.h1 
              className="text-6xl md:text-8xl font-black text-white mb-8 leading-[0.9] tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Business Intelligence
              <br />
              <span className="text-gray-300">
                built around
              </span>
              <br />
              <span className="text-white">
                lead capture
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-gray-300 mb-16 max-w-5xl mx-auto leading-relaxed font-medium"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              AdParlay is the central hub for your organization's lead generation, uniting marketing teams and business teams around data to drive business outcomes.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Link
                to="/register"
                className="group px-12 py-6 bg-white text-black rounded-2xl font-bold text-xl hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-3xl"
              >
                <span className="flex items-center space-x-2">
                  <span>Try for free</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
              <button className="px-12 py-6 border-2 border-gray-600 text-gray-300 rounded-2xl font-bold text-xl hover:border-white hover:text-white transition-all duration-300 transform hover:scale-105">
                Request demo
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Capabilities Section - Black and White Design */}
      <section id="features" className="py-32 px-4 sm:px-6 lg:px-8 bg-black relative">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-24"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-black text-white mb-8 leading-tight">
              Capabilities you can count on
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed font-medium">
              From simple contact forms to complex multi-step surveys, we've got you covered with enterprise-grade features.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                ),
                title: 'Split-Screen Builder',
                description: 'See your form come to life in real-time with our intuitive split-screen interface.'
              },
              {
                icon: (
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                ),
                title: 'Mobile-First Design',
                description: 'Responsive forms that look great on any device, automatically adapting to screen size.'
              },
              {
                icon: (
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                ),
                title: 'Conditional Logic',
                description: 'Create smart forms that show different questions based on previous answers.'
              },
              {
                icon: (
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                title: 'Instant Analytics',
                description: 'Track form performance, conversion rates, and lead quality in real-time.'
              },
              {
                icon: (
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
                title: 'PNG Summaries',
                description: 'Leads automatically receive beautiful PNG summaries of their completed forms.'
              },
              {
                icon: (
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                ),
                title: 'One-Click Sharing',
                description: 'Share your forms with beautiful previews that look like professional websites.'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group bg-gray-900 rounded-3xl p-10 hover:shadow-2xl transition-all duration-500 border border-gray-800 hover:border-gray-600 hover:-translate-y-2"
              >
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-gray-300 transition-colors duration-300">{feature.title}</h3>
                <p className="text-gray-400 text-lg leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Proposition Section - Black and White Design */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-black relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-gray-900/30 via-transparent to-gray-800/30"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            className="text-center mb-24"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-black text-white mb-8 leading-tight">
              Clear the path from data to insights, together
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 max-w-5xl mx-auto leading-relaxed font-medium">
              Perform complex, ad hoc analysis and empower simple self-service reporting, all on the same platform.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h3 className="text-4xl font-black text-white mb-8">Made for your marketing team</h3>
              <p className="text-xl text-gray-300 mb-12 leading-relaxed">
                In AdParlay, form building, analytics, and lead management are all connected to help you deliver results, faster than ever. No rigid data model should stand in the way of the insights needed to support business decisions, big and small.
              </p>
              
              <h3 className="text-4xl font-black text-white mb-8">And the teams you work with</h3>
              <p className="text-xl text-gray-300 leading-relaxed">
                Deliver tools for easy, trusted self-service, in record time. Because everyone's analytical tools can live in one place, AdParlay becomes a central hub full of easy-to-understand data, curated by the marketing team, without long implementation times or tedious maintenance.
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-white rounded-3xl p-12 text-center shadow-2xl"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="w-24 h-24 bg-black/10 rounded-full flex items-center justify-center mx-auto mb-8 backdrop-blur-sm">
                <svg className="w-14 h-14 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="text-3xl font-black text-black mb-6">The intelligence layer for your modern marketing stack</h4>
              <p className="text-black/80 text-lg leading-relaxed">
                AdParlay amplifies the investment you've made in every layer of the stack, by getting data you've made meaningful into everyone's hands.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Black and White Design */}
      <section id="pricing" className="py-32 px-4 sm:px-6 lg:px-8 bg-black relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-900/20 via-transparent to-gray-800/20"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            className="text-center mb-24"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-black text-white mb-8 leading-tight">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 font-medium">
              Start free, upgrade when you need more power.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="group bg-gray-900 rounded-3xl p-12 border-2 border-gray-800 hover:border-gray-600 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2"
            >
              <div className="text-center mb-10">
                <h3 className="text-4xl font-black text-white mb-4">Free</h3>
                <p className="text-gray-400 text-xl font-medium">Perfect for getting started</p>
              </div>
              
              <div className="text-center mb-10">
                <span className="text-7xl font-black text-white">$0</span>
                <span className="text-gray-400 text-2xl font-medium">/month</span>
              </div>
              
              <ul className="space-y-6 mb-12 text-xl">
                <li className="flex items-center">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white text-lg font-bold">✓</span>
                  </div>
                  <span className="font-medium text-gray-300">Up to 3 forms</span>
                </li>
                <li className="flex items-center">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white text-lg font-bold">✓</span>
                  </div>
                  <span className="font-medium text-gray-300">Up to 100 leads</span>
                </li>
                <li className="flex items-center">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white text-lg font-bold">✓</span>
                  </div>
                  <span className="font-medium text-gray-300">Basic analytics</span>
                </li>
                <li className="flex items-center">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white text-lg font-bold">✓</span>
                  </div>
                  <span className="font-medium text-gray-300">PNG summaries</span>
                </li>
              </ul>
              
              <Link
                to="/register"
                className="w-full block text-center px-8 py-6 bg-white text-black rounded-2xl font-bold text-xl hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
              >
                Get Started Free
              </Link>
            </motion.div>

            {/* Premium Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="group bg-white rounded-3xl p-12 text-black relative shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2"
            >
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                <span className="bg-black text-white px-6 py-3 rounded-full text-lg font-bold shadow-lg">
                  Most Popular
                </span>
              </div>
              
              <div className="text-center mb-10">
                <h3 className="text-4xl font-black mb-4">Premium</h3>
                <p className="text-black/80 text-xl font-medium">For growing businesses</p>
              </div>
              
              <div className="text-center mb-10">
                <span className="text-7xl font-black">₦2,099</span>
                <span className="text-black/80 text-2xl font-medium">/month</span>
              </div>
              
              <ul className="space-y-6 mb-12 text-xl">
                <li className="flex items-center">
                  <div className="w-8 h-8 bg-black/10 rounded-full flex items-center justify-center mr-4">
                    <span className="text-black text-lg font-bold">✓</span>
                  </div>
                  <span className="font-medium text-gray-700">Unlimited forms</span>
                </li>
                <li className="flex items-center">
                  <div className="w-8 h-8 bg-black/10 rounded-full flex items-center justify-center mr-4">
                    <span className="text-black text-lg font-bold">✓</span>
                  </div>
                  <span className="font-medium text-gray-700">Unlimited leads</span>
                </li>
                <li className="flex items-center">
                  <div className="w-8 h-8 bg-black/10 rounded-full flex items-center justify-center mr-4">
                    <span className="text-black text-lg font-bold">✓</span>
                  </div>
                  <span className="font-medium text-gray-700">Advanced analytics</span>
                </li>
                <li className="flex items-center">
                  <div className="w-8 h-8 bg-black/10 rounded-full flex items-center justify-center mr-4">
                    <span className="text-black text-lg font-bold">✓</span>
                  </div>
                  <span className="font-medium text-gray-700">AI-powered form builder</span>
                </li>
                <li className="flex items-center">
                  <div className="w-8 h-8 bg-black/10 rounded-full flex items-center justify-center mr-4">
                    <span className="text-black text-lg font-bold">✓</span>
                  </div>
                  <span className="font-medium text-gray-700">Priority support</span>
                </li>
              </ul>
              
              <Link
                to="/register"
                className="w-full block text-center px-8 py-6 bg-black text-white rounded-2xl font-bold text-xl hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Start Premium Trial
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section - Black and White Design */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-black relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 to-gray-800/90"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 via-transparent to-white/2"></div>
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight">
            Ready to Start Capturing Leads?
          </h2>
            <p className="text-xl md:text-2xl text-gray-300 mb-16 max-w-4xl mx-auto leading-relaxed font-medium">
            Join thousands of businesses already using AdParlay to grow their customer base.
          </p>
          <Link
            to="/register"
              className="group inline-flex items-center px-16 py-8 bg-white text-black rounded-2xl font-black text-2xl hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-3xl"
          >
              <span>Start Building Today</span>
              <svg className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
          </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer - Black and White Design */}
      <footer className="bg-black text-white py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
            <div className="md:col-span-1">
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-black font-bold text-xl">A</span>
                </div>
                <span className="text-2xl font-black">AdParlay</span>
              </div>
              <p className="text-gray-400 text-lg leading-relaxed font-medium">
                Building the future of lead capture, one form at a time.
              </p>
            </div>
            
            <div>
              <h4 className="font-black mb-8 text-xl">Product</h4>
              <ul className="space-y-4 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors duration-300 font-medium">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors duration-300 font-medium">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300 font-medium">Templates</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-black mb-8 text-xl">Company</h4>
              <ul className="space-y-4 text-gray-400">
                <li><a href="#about" className="hover:text-white transition-colors duration-300 font-medium">About</a></li>
                <li><Link to="/blog" className="hover:text-white transition-colors duration-300 font-medium">Blog</Link></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300 font-medium">Careers</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-black mb-8 text-xl">Support</h4>
              <ul className="space-y-4 text-gray-400">
                <li><Link to="/helpcenter" className="hover:text-white transition-colors duration-300 font-medium">Help Center</Link></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300 font-medium">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300 font-medium">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-black mb-8 text-xl">Legal</h4>
              <ul className="space-y-4 text-gray-400">
                <li><Link to="/terms" className="hover:text-white transition-colors duration-300 font-medium">Terms & Conditions</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors duration-300 font-medium">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-16 pt-8 text-center">
            <p className="text-gray-400 text-lg font-medium">&copy; 2024 AdParlay. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
