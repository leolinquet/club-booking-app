import React from 'react';
import { ArrowLeft, MapPin, Clock, Users, Code, Zap, Heart, Globe } from 'lucide-react';
import Footer from '../../components/marketing/Footer.jsx';

export default function CareersPage() {
  const values = [
    {
      icon: Users,
      title: 'Community Impact',
      description: 'Build tools that bring sports communities together and help them thrive.'
    },
    {
      icon: Code,
      title: 'Technical Excellence',
      description: 'Work with modern technologies and best practices in a quality-focused environment.'
    },
    {
      icon: Zap,
      title: 'Fast-Paced Growth',
      description: 'Join a rapidly growing startup where your contributions make an immediate impact.'
    },
    {
      icon: Heart,
      title: 'Work-Life Balance',
      description: 'We believe great work comes from rested, happy people who have time for their passions.'
    }
  ];

  const futureRoles = [
    {
      title: 'Senior Full-Stack Developer',
      department: 'Engineering',
      location: 'Remote / Lincoln, NE',
      type: 'Full-time',
      description: 'Lead development of new features for our React/Node.js platform serving thousands of sports clubs.',
      requirements: [
        '5+ years experience with React and Node.js',
        'Experience with PostgreSQL and Redis',
        'Strong understanding of web performance and scalability',
        'Previous startup or fast-paced environment experience'
      ]
    },
    {
      title: 'Product Manager',
      department: 'Product',
      location: 'Remote / Lincoln, NE',
      type: 'Full-time',
      description: 'Drive product strategy and roadmap for club management tools, working directly with customers and engineering.',
      requirements: [
        '3+ years product management experience',
        'Experience with B2B SaaS products',
        'Strong analytical and communication skills',
        'Background in sports or community management preferred'
      ]
    },
    {
      title: 'Customer Success Manager',
      department: 'Customer Success',
      location: 'Remote',
      type: 'Full-time',
      description: 'Help sports clubs succeed with our platform, providing onboarding, training, and ongoing support.',
      requirements: [
        '2+ years customer success or account management experience',
        'Excellent communication and problem-solving skills',
        'Experience with SaaS platforms',
        'Sports club or community management background a plus'
      ]
    },
    {
      title: 'Marketing Manager',
      department: 'Marketing',
      location: 'Remote / Lincoln, NE',
      type: 'Full-time',
      description: 'Lead our marketing efforts to reach sports clubs worldwide, from content marketing to paid acquisition.',
      requirements: [
        '3+ years marketing experience, preferably B2B SaaS',
        'Content creation and campaign management skills',
        'Experience with marketing automation tools',
        'Understanding of sports industry dynamics preferred'
      ]
    }
  ];

  const benefits = [
    'Competitive salary and equity package',
    'Comprehensive health, dental, and vision insurance',
    'Flexible remote work options',
    'Professional development budget',
    'Top-tier equipment and workspace setup',
    'Unlimited PTO policy',
    'Team retreats and sports events',
    'Free SportsClubNet platform access for personal use'
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
              Join Our Team
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Help us build the future of sports club management. Work with passionate people 
              on meaningful technology that connects communities worldwide.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Why Work With Us
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              More than just a job—join a mission to transform how sports communities connect
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {values.map((value, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <value.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-gray-900">
                    {value.title}
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Current Status */}
      <section className="bg-blue-600 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              We're Hiring Soon!
            </h2>
            <p className="mt-6 text-lg leading-8 text-blue-100">
              SportsClubNet is growing rapidly, and we're preparing to expand our team. 
              While we don't have open positions right now, we're actively planning for several key roles.
            </p>
            <div className="mt-10">
              <a
                href="mailto:careers@sportsclubnet.com?subject=Interest%20in%20Future%20Opportunities"
                className="rounded-md bg-white px-6 py-3 text-base font-semibold text-blue-600 shadow-sm hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Get Notified About Openings
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Future Roles */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Roles We're Planning
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Here are the positions we expect to open in the coming months
            </p>
          </div>

          <div className="space-y-8">
            {futureRoles.map((role, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-8">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {role.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                        {role.department}
                      </span>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{role.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{role.type}</span>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-6">
                      {role.description}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Key Requirements:</h4>
                  <ul className="space-y-2">
                    {role.requirements.map((req, reqIndex) => (
                      <li key={reqIndex} className="flex items-start gap-2 text-gray-600">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Benefits & Perks
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              We believe in taking great care of our team members
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 bg-white p-4 rounded-lg">
                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                <span className="text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Apply Section */}
      <section className="bg-gray-900 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Interested in Joining?
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Even if we don't have the perfect role open right now, we'd love to hear from you. 
              We're always looking for exceptional talent to join our mission.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="mailto:careers@sportsclubnet.com?subject=Career%20Opportunity%20Interest"
                className="rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Send Us Your Resume
              </a>
              <a 
                href="/about"
                className="text-base font-semibold leading-6 text-white hover:text-gray-300"
              >
                Learn More About Us <span aria-hidden="true">→</span>
              </a>
            </div>
            
            <div className="mt-12 text-sm text-gray-400">
              <p>Questions about working with us?</p>
              <p>Email us at <a href="mailto:careers@sportsclubnet.com" className="text-blue-400 hover:text-blue-300">careers@sportsclubnet.com</a></p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}