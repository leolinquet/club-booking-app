import React from 'react';
import { ArrowLeft, FileText, Users, Shield, AlertTriangle } from 'lucide-react';
import Footer from '../../components/marketing/Footer.jsx';

export default function TermsPage() {
  const lastUpdated = "October 19, 2024";

  const sections = [
    {
      id: "acceptance",
      title: "Acceptance of Terms",
      icon: FileText,
      content: [
        {
          subtitle: "Agreement to Terms",
          text: "By accessing and using Club Booking, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service."
        },
        {
          subtitle: "Service Description",
          text: "Club Booking is a web-based platform that provides sports club management tools, including court booking, member management, tournaments, and communication features."
        }
      ]
    },
    {
      id: "user-accounts",
      title: "User Accounts",
      icon: Users,
      content: [
        {
          subtitle: "Account Registration",
          text: "To use our service, you must register for an account by providing accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials."
        },
        {
          subtitle: "Account Responsibilities",
          text: "You are responsible for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account or any other breach of security."
        },
        {
          subtitle: "Account Termination",
          text: "We reserve the right to terminate or suspend your account at any time for violations of these terms or for any other reason at our sole discretion."
        }
      ]
    },
    {
      id: "acceptable-use",
      title: "Acceptable Use Policy",
      icon: Shield,
      content: [
        {
          subtitle: "Permitted Uses",
          text: "You may use Club Booking for lawful purposes related to sports club management, booking facilities, and connecting with other club members."
        },
        {
          subtitle: "Prohibited Activities",
          text: "You may not use our service for any illegal activities, to harass other users, spam, distribute malware, or attempt to gain unauthorized access to our systems."
        },
        {
          subtitle: "Content Guidelines",
          text: "Any content you post must be appropriate, respectful, and relevant to sports club activities. We reserve the right to remove content that violates our community standards."
        }
      ]
    },
    {
      id: "service-terms",
      title: "Service Terms",
      icon: AlertTriangle,
      content: [
        {
          subtitle: "Service Availability",
          text: "We strive to maintain high service availability, but we do not guarantee uninterrupted access. We may perform maintenance or updates that temporarily affect service availability."
        },
        {
          subtitle: "Booking Policies",
          text: "Court bookings are subject to club-specific policies and availability. Bookings may be modified or cancelled according to club rules and our platform policies."
        },
        {
          subtitle: "Payment Terms",
          text: "If your club uses paid features, payment terms will be clearly specified. Fees are generally non-refundable except as required by law or specified in our refund policy."
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
              <FileText className="h-12 w-12 text-blue-600 mr-4" />
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                Terms of Service
              </h1>
            </div>
            <p className="text-xl leading-8 text-gray-600">
              These terms govern your use of Club Booking. By using our service, 
              you agree to be bound by these terms and conditions.
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
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-12">
              <h2 className="text-xl font-semibold text-yellow-900 mb-3">Terms Summary</h2>
              <ul className="text-yellow-800 space-y-2">
                <li>• You must be authorized to use Club Booking on behalf of your club</li>
                <li>• You're responsible for maintaining account security and appropriate use</li>
                <li>• Bookings are subject to club policies and platform availability</li>
                <li>• We provide the service "as is" with reasonable effort for reliability</li>
                <li>• These terms may be updated with notice to users</li>
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

            {/* Liability and Disclaimers */}
            <div className="mt-16 bg-gray-50 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Liability and Disclaimers</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>Service "As Is":</strong> Club Booking is provided on an "as is" basis. 
                  We make no warranties, expressed or implied, and hereby disclaim all other warranties.
                </p>
                <p>
                  <strong>Limitation of Liability:</strong> In no event shall Club Booking be liable 
                  for any indirect, incidental, special, consequential, or punitive damages arising 
                  out of your use of the service.
                </p>
                <p>
                  <strong>Indemnification:</strong> You agree to indemnify and hold harmless Club Booking 
                  from any claims, damages, or expenses arising from your use of the service or violation 
                  of these terms.
                </p>
              </div>
            </div>

            {/* Changes to Terms */}
            <div className="mt-16 bg-blue-50 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to These Terms</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to modify these terms at any time. When we make changes, 
                we will notify users through the platform and update the "Last updated" date above.
              </p>
              <p className="text-gray-700">
                Your continued use of Club Booking after any changes constitutes acceptance 
                of the updated terms.
              </p>
            </div>

            {/* Contact Information */}
            <div className="mt-16 text-center bg-white border border-gray-200 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Questions About These Terms?
              </h2>
              <p className="text-gray-600 mb-6">
                If you have any questions about these Terms of Service, please contact us.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/contact"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Contact Us
                </a>
                <a
                  href="mailto:legal@clubbooking.app"
                  className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Email Legal Team
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