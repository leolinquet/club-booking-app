import React from 'react';
import { ArrowLeft, Shield, Eye, Lock, Users } from 'lucide-react';
import Footer from '../../components/marketing/Footer.jsx';

export default function PrivacyPage() {
  const lastUpdated = "October 19, 2024";

  const sections = [
    {
      id: "information-we-collect",
      title: "Information We Collect",
      icon: Eye,
      content: [
        {
          subtitle: "Personal Information",
          text: "When you create an account, we collect your name, email address, and club affiliation. If you're a club manager, we may collect additional business information such as club name and contact details."
        },
        {
          subtitle: "Usage Data",
          text: "We automatically collect information about how you use our service, including booking patterns, feature usage, and system interactions. This helps us improve our platform and provide better service."
        },
        {
          subtitle: "Device and Technical Information",
          text: "We collect information about your device, browser type, IP address, and operating system to ensure compatibility and security."
        }
      ]
    },
    {
      id: "how-we-use-information",
      title: "How We Use Your Information",
      icon: Users,
      content: [
        {
          subtitle: "Service Delivery",
          text: "We use your information to provide club booking services, manage your account, process reservations, and facilitate communication between club members."
        },
        {
          subtitle: "Communication",
          text: "We may send you important updates about your bookings, account changes, or service announcements. You can opt out of promotional communications at any time."
        },
        {
          subtitle: "Improvement and Analytics",
          text: "We analyze usage patterns to improve our platform, develop new features, and ensure optimal performance for all users."
        }
      ]
    },
    {
      id: "information-sharing",
      title: "Information Sharing",
      icon: Shield,
      content: [
        {
          subtitle: "Within Your Club",
          text: "Your name and basic contact information may be visible to other members of your club to facilitate bookings and communication."
        },
        {
          subtitle: "Service Providers",
          text: "We may share information with trusted third-party service providers who help us operate our platform, such as hosting services and email providers."
        },
        {
          subtitle: "Legal Requirements",
          text: "We may disclose information when required by law or to protect our rights, users' safety, or comply with legal processes."
        }
      ]
    },
    {
      id: "data-security",
      title: "Data Security",
      icon: Lock,
      content: [
        {
          subtitle: "Encryption",
          text: "All data transmission is encrypted using industry-standard SSL/TLS protocols. Your sensitive information is protected both in transit and at rest."
        },
        {
          subtitle: "Access Controls",
          text: "We implement strict access controls and authentication measures to ensure only authorized personnel can access your information."
        },
        {
          subtitle: "Regular Security Audits",
          text: "We conduct regular security assessments and updates to maintain the highest level of protection for your data."
        }
      ]
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
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex items-center justify-center mb-6">
              <Shield className="h-12 w-12 text-blue-600 mr-4" />
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                Privacy Policy
              </h1>
            </div>
            <p className="text-xl leading-8 text-gray-600">
              Your privacy is important to us. This policy explains how we collect, 
              use, and protect your information when you use SportsClubNet.
            </p>
            <p className="mt-4 text-sm text-gray-500">
              Last updated: {lastUpdated}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            
            {/* Quick Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-12">
              <h2 className="text-xl font-semibold text-blue-900 mb-3">Privacy Summary</h2>
              <ul className="text-blue-800 space-y-2">
                <li>• We collect only the information necessary to provide our service</li>
                <li>• Your data is encrypted and securely stored</li>
                <li>• We never sell your personal information to third parties</li>
                <li>• You have control over your data and can request deletion at any time</li>
                <li>• We're transparent about how we use your information</li>
              </ul>
            </div>

            {/* Detailed Sections */}
            <div className="space-y-12">
              {sections.map((section, index) => (
                <div key={section.id} id={section.id} className="scroll-mt-20">
                  <div className="flex items-center mb-6">
                    <section.icon className="h-8 w-8 text-blue-600 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-900">
                      {section.title}
                    </h2>
                  </div>
                  
                  <div className="space-y-6">
                    {section.content.map((item, itemIndex) => (
                      <div key={itemIndex} className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          {item.subtitle}
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Rights */}
            <div className="mt-16 bg-gray-50 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Rights</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Access & Portability</h3>
                  <p className="text-gray-700 text-sm">Request a copy of your personal data in a portable format.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Correction</h3>
                  <p className="text-gray-700 text-sm">Update or correct inaccurate personal information.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Deletion</h3>
                  <p className="text-gray-700 text-sm">Request deletion of your personal data, subject to legal requirements.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Opt-Out</h3>
                  <p className="text-gray-700 text-sm">Unsubscribe from promotional communications at any time.</p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="mt-16 text-center bg-white border border-gray-200 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Questions About Privacy?
              </h2>
              <p className="text-gray-600 mb-6">
                If you have any questions about this Privacy Policy or how we handle your data, 
                please don't hesitate to contact us.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/contact"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Contact Us
                </a>
                <a
                  href="mailto:privacy@sportsclubnet.com"
                  className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Email Privacy Team
                </a>
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