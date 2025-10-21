import React from 'react';
import { ArrowLeft, Shield, Lock, Eye, Server, CheckCircle, AlertTriangle } from 'lucide-react';
import Footer from '../../components/marketing/Footer.jsx';

export default function SecurityPage() {
  const lastUpdated = "October 19, 2024";

  const securityMeasures = [
    {
      icon: Lock,
      title: "Data Encryption",
      description: "All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption.",
      details: [
        "SSL/TLS certificates for all communications",
        "End-to-end encryption for sensitive data",
        "Encrypted database storage",
        "Secure key management practices"
      ]
    },
    {
      icon: Shield,
      title: "Access Controls",
      description: "Multi-layered access controls ensure only authorized users can access your data.",
      details: [
        "Role-based access control (RBAC)",
        "Multi-factor authentication options",
        "Session management and timeout",
        "Regular access reviews and audits"
      ]
    },
    {
      icon: Server,
      title: "Infrastructure Security",
      description: "Our infrastructure is hosted on secure, compliant cloud platforms with industry-leading security.",
      details: [
        "SOC 2 Type II compliant hosting",
        "Regular security updates and patches",
        "Network monitoring and intrusion detection",
        "Automated backup and disaster recovery"
      ]
    },
    {
      icon: Eye,
      title: "Monitoring & Auditing",
      description: "Continuous monitoring and comprehensive auditing help us detect and respond to security events.",
      details: [
        "24/7 security monitoring",
        "Comprehensive audit logging",
        "Real-time threat detection",
        "Incident response procedures"
      ]
    }
  ];

  const certifications = [
    {
      name: "SOC 2 Type II",
      description: "Certified for security, availability, and confidentiality",
      status: "Compliant"
    },
    {
      name: "GDPR",
      description: "General Data Protection Regulation compliance",
      status: "Compliant"
    },
    {
      name: "CCPA",
      description: "California Consumer Privacy Act compliance",
      status: "Compliant"
    },
    {
      name: "ISO 27001",
      description: "Information security management system certification",
      status: "In Progress"
    }
  ];

  const bestPractices = [
    {
      title: "For Club Managers",
      practices: [
        "Use strong, unique passwords for your account",
        "Enable two-factor authentication if available",
        "Regularly review club member access",
        "Report suspicious activity immediately",
        "Keep your contact information up to date"
      ]
    },
    {
      title: "For Club Members",
      practices: [
        "Choose a secure password for your account",
        "Log out when using shared computers",
        "Verify booking confirmations via email",
        "Be cautious about sharing personal information",
        "Report any security concerns to your club manager"
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
              <Shield className="h-12 w-12 text-green-600 mr-4" />
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                Security
              </h1>
            </div>
            <p className="text-xl leading-8 text-gray-600">
              Your security is our top priority. Learn about the comprehensive measures we take 
              to protect your data and ensure the safety of our platform.
            </p>
            <p className="mt-4 text-sm text-gray-500">
              Last updated: {lastUpdated}
            </p>
          </div>
        </div>
      </section>

      {/* Security Overview */}
      <section className="bg-green-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Our Security Commitment
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              We implement multiple layers of security to protect your club's data
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {securityMeasures.map((measure, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <measure.icon className="h-8 w-8 text-green-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {measure.title}
                  </h3>
                </div>
                <p className="text-gray-600 mb-4 text-sm">
                  {measure.description}
                </p>
                <ul className="space-y-1">
                  {measure.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-start text-xs text-gray-500">
                      <CheckCircle className="h-3 w-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance and Certifications */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Compliance & Certifications
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              We maintain compliance with industry standards and regulations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certifications.map((cert, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {cert.name}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    cert.status === 'Compliant' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {cert.status}
                  </span>
                </div>
                <p className="text-gray-600 text-sm">
                  {cert.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Best Practices */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Security Best Practices
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Simple steps you can take to keep your account secure
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {bestPractices.map((category, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  {category.title}
                </h3>
                <ul className="space-y-3">
                  {category.practices.map((practice, practiceIndex) => (
                    <li key={practiceIndex} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{practice}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Incident Response */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-8">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-8 w-8 text-orange-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Security Incident Response
                </h2>
              </div>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>If you suspect a security issue:</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Change your password immediately</li>
                  <li>Contact us at <a href="mailto:security@clubbooking.app" className="text-orange-600 hover:text-orange-800 underline">security@clubbooking.app</a></li>
                  <li>Document any suspicious activity</li>
                  <li>Inform your club manager if you're a member</li>
                </ul>
                <p className="mt-4">
                  <strong>Our Response:</strong> We take all security reports seriously and will investigate 
                  promptly. We'll keep you informed throughout the process and take appropriate action 
                  to protect all users.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vulnerability Disclosure */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-8">
              Responsible Disclosure
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <p className="text-gray-700 mb-6 text-left">
                We welcome security researchers and encourage responsible disclosure of security vulnerabilities. 
                If you believe you've found a security issue in our platform:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Please Do:</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Email us at security@clubbooking.app</li>
                    <li>• Provide detailed steps to reproduce</li>
                    <li>• Allow reasonable time for us to respond</li>
                    <li>• Avoid accessing or modifying user data</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Please Don't:</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Publicly disclose before we've had a chance to fix</li>
                    <li>• Access or modify other users' data</li>
                    <li>• Perform actions that could harm our service</li>
                    <li>• Request compensation for findings</li>
                  </ul>
                </div>
              </div>
              <div className="mt-8">
                <a
                  href="mailto:security@clubbooking.app"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Report Security Issue
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