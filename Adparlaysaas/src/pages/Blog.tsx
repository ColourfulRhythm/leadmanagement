import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Blog: React.FC = () => {
  // Scroll to top when component mounts
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* SEO Meta Tags - These would be handled by React Helmet in production */}
      <head>
        <title>AdParlay Blog - Lead Capture, Sales, HR Solutions | Interactive Form Systems</title>
        <meta name="description" content="Discover how AdParlay's interactive lead capture system outperforms traditional forms. Learn about sales optimization, HR solutions, and modern lead generation strategies." />
        <meta name="keywords" content="lead capture, interactive forms, sales optimization, HR solutions, lead generation, form builder, business intelligence, conversion optimization" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.adparlay.com/blog" />
        
        {/* Open Graph Tags */}
        <meta property="og:title" content="AdParlay Blog - Lead Capture, Sales, HR Solutions" />
        <meta property="og:description" content="Discover how AdParlay's interactive lead capture system outperforms traditional forms. Learn about sales optimization, HR solutions, and modern lead generation strategies." />
        <meta property="og:url" content="https://www.adparlay.com/blog" />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AdParlay Blog - Lead Capture, Sales, HR Solutions" />
        <meta name="twitter:description" content="Discover how AdParlay's interactive lead capture system outperforms traditional forms." />
      </head>

      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <Link to="/" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                AdParlay
              </Link>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-600 hover:text-gray-900 transition-colors">Home</Link>
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all transform hover:scale-105"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8 leading-tight">
              AdParlay
              <br />
              <span className="text-blue-600">Blog</span>
            </h1>
            <p className="text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Insights, strategies, and expert advice on modern lead capture, sales optimization, and business growth.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link
                to="/register"
                className="px-10 py-5 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg"
              >
                Start Building Forms
              </Link>
              <a
                href="#latest-posts"
                className="px-10 py-5 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold text-lg hover:border-blue-400 hover:text-blue-600 transition-all"
              >
                Read Latest Posts
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Blog Posts Section */}
      <section id="latest-posts" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Latest Insights & Strategies
            </h2>
            <p className="text-xl text-gray-600">
              Discover how modern businesses are transforming their lead capture and conversion strategies.
            </p>
          </div>

          {/* Blog Post 1 */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl p-8 mb-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all cursor-pointer"
            onClick={() => window.open('/blog/why-reminders-cost-conversions', '_blank')}
          >
            <div className="mb-6">
              <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
                Lead Generation
              </span>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 hover:text-blue-600 transition-colors">
                Why Relying on Reminders for Online Leads is Costing You Conversions
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                When businesses run online ads or collect leads through traditional forms, one of the biggest challenges is follow-up. A prospect fills a form today, and you have to keep reminding them through calls, emails, or messages. Often, this constant chase leads to frustration—for you and the customer.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">5 min read</span>
                <span className="text-blue-600 font-medium">Read full article →</span>
              </div>
            </div>
          </motion.article>

          {/* Blog Post 2 */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white rounded-2xl p-8 mb-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all cursor-pointer"
            onClick={() => window.open('/blog/interactive-forms-outperform-traditional', '_blank')}
          >
            <div className="mb-6">
              <span className="inline-block bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
                Interactive Forms
              </span>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 hover:text-blue-600 transition-colors">
                Why Interactive Lead Capturing Systems Outperform Traditional Forms
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Most businesses still use static lead forms—simple boxes that ask for names, emails, or phone numbers. While they get the job done, they fall short in today's competitive digital landscape. Customers expect more engagement and instant value.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">4 min read</span>
                <span className="text-blue-600 font-medium">Read full article →</span>
              </div>
            </div>
          </motion.article>

          {/* Blog Post 3 */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl p-8 mb-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all cursor-pointer"
            onClick={() => window.open('/blog/hidden-cost-traditional-lead-forms', '_blank')}
          >
            <div className="mb-6">
              <span className="inline-block bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
                Cost Analysis
              </span>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 hover:text-blue-600 transition-colors">
                The Hidden Cost of Traditional Lead Forms (And How to Avoid It)
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Many businesses don't realize how much money they lose with traditional lead capturing methods. You spend money on ads, people click, they fill a form, and… nothing. Leads go cold. Sales teams waste time chasing them. Conversion rates remain low.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">6 min read</span>
                <span className="text-blue-600 font-medium">Read full article →</span>
              </div>
            </div>
          </motion.article>

          {/* Blog Post 4 */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-2xl p-8 mb-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all cursor-pointer"
            onClick={() => window.open('/blog/adparlay-solves-sales-hr-challenges', '_blank')}
          >
            <div className="mb-6">
              <span className="inline-block bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
                Business Solutions
              </span>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 hover:text-blue-600 transition-colors">
                How AdParlay Solves Sales, HR, and Lead Collection Challenges in One Smart System
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                In today's fast-paced business environment, sales teams, HR managers, and marketing professionals face one recurring challenge: capturing, tracking, and converting leads effectively. Traditional lead collection methods often fall short—leads are lost, follow-ups are forgotten, and engagement is weak.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">8 min read</span>
                <span className="text-blue-600 font-medium">Read full article →</span>
              </div>
            </div>
          </motion.article>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Lead Capture?
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Join the businesses already using AdParlay to create engaging, interactive forms that convert.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link
              to="/register"
              className="px-10 py-5 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all transform hover:scale-105 shadow-lg"
            >
              Start Building Today
            </Link>
            <Link
              to="/"
              className="px-10 py-5 border-2 border-white text-white rounded-xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <Link to="/" className="text-xl font-bold hover:text-blue-400 transition-colors">
                  AdParlay
                </Link>
              </div>
              <p className="text-gray-400 text-lg">
                Building the future of lead capture, one form at a time.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-lg">Product</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Templates</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-lg">Company</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-lg">Support</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 AdParlay. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Blog;
