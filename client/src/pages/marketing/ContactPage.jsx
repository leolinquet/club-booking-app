import React, { useState } from 'react';
import { ArrowLeft, Mail, MessageCircle, Phone, MapPin, Clock, Send, CheckCircle } from 'lucide-react';
import Footer from '../../components/marketing/Footer.jsx';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  });
  
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Create mailto link with form data
    const subject = encodeURIComponent(`[${formData.category.toUpperCase()}] ${formData.subject}`);
    const body = encodeURIComponent(
      `Name: ${formData.name}\n` +
      `Email: ${formData.email}\n` +
      `Category: ${formData.category}\n\n` +
      `Message:\n${formData.message}`
    );
    
    window.location.href = `mailto:support@sportsclubnet.com?subject=${subject}&body=${body}`;
    setIsSubmitted(true);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Get help with your account, billing, or technical issues.',
      contact: 'support@sportsclubnet.com',
      action: 'mailto:support@sportsclubnet.com',
      responseTime: 'Usually responds within 24 hours'
    },
    {
      icon: MessageCircle,
      title: 'Sales Inquiries',
      description: 'Questions about pricing, features, or setting up your club.',
      contact: 'sales@sportsclubnet.com',
      action: 'mailto:sales@sportsclubnet.com',
      responseTime: 'Usually responds within 4 hours'
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: 'Urgent issues or prefer to talk? We\'re here to help.',
      contact: '+1 267 824 1391',
      action: 'tel:+12678241391',
      responseTime: 'Available Mon-Fri, 9AM-6PM PST'
    }
  ];

  const faqs = [
    {
      question: 'How quickly can I get my club set up?',
      answer: 'Most clubs are up and running within 24 hours. Our team helps with initial setup, data import, and training to ensure a smooth transition.'
    },
    {
      question: 'Do you offer training for club managers?',
      answer: 'Yes! We provide comprehensive onboarding training, video tutorials, and ongoing support to help you make the most of the platform.'
    },
    {
      question: 'Can I import my existing member data?',
      answer: 'Absolutely. We support importing from spreadsheets, other club management systems, and can help with custom data migration if needed.'
    },
    {
      question: 'What if my club has unique requirements?',
      answer: 'We work with clubs of all types and sizes. Contact our team to discuss your specific needs—we often have solutions or can develop custom features.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gray-50 border-b">
        <nav className="mx-auto max-w-7xl px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center text-blue-600 hover:text-blue-800">
              <ArrowLeft className="mr-2 h-5 w-5" />
              <span className="font-medium">Back to Home</span>
            </a>
            <a href="/app" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Try the App
            </a>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Get in Touch
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Have questions about SportsClubNet? Need help getting started? 
              Our team is here to support you every step of the way.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              How Can We Help?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Choose the best way to reach us based on your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {contactMethods.map((method, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-center">
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <method.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {method.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {method.description}
                  </p>
                  <a
                    href={method.action}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    {method.contact}
                  </a>
                  <p className="text-sm text-gray-500 mt-2">
                    {method.responseTime}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Send Us a Message
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Fill out the form below and we'll get back to you as soon as possible
              </p>
            </div>

            {isSubmitted ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-900 mb-2">
                  Message Sent!
                </h3>
                <p className="text-green-700">
                  Your email client should have opened with your message. 
                  If not, you can email us directly at support@sportsclubnet.com
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="sales">Sales & Pricing</option>
                    <option value="support">Technical Support</option>
                    <option value="billing">Billing Question</option>
                    <option value="feature">Feature Request</option>
                    <option value="partnership">Partnership Opportunity</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief description of your inquiry"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Please provide as much detail as possible about your question or request..."
                  />
                </div>

                <div className="text-center">
                  <button
                    type="submit"
                    className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Send className="mr-2 h-5 w-5" />
                    Send Message
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Quick answers to common questions about SportsClubNet
            </p>
          </div>

          <div className="mx-auto max-w-3xl space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Don't see your question here?
            </p>
            <a
              href="mailto:support@sportsclubnet.com"
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              Ask us directly →
            </a>
          </div>
        </div>
      </section>

      {/* Office Info */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-8">
              Visit Our Office
            </h2>
            
            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-blue-600 mr-2" />
                <span className="text-lg font-semibold text-gray-900">Lincoln, Nebraska</span>
              </div>
              <p className="text-gray-600 mb-6">
                We're based in Lincoln, Nebraska, the heart of the Midwest. 
                While we work primarily remotely, we'd love to meet in person if you're in the area.
              </p>
              
              <div className="flex items-center justify-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-2" />
                <span>Business Hours: Monday - Friday, 9:00 AM - 6:00 PM PST</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}