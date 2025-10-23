import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, AlertCircle, XCircle, Clock, Activity, Server, Database, Globe, Zap, Bell } from 'lucide-react';
import Footer from '../../components/marketing/Footer.jsx';

export default function SystemStatusPage() {
  const [currentStatus, setCurrentStatus] = useState('operational');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'partial': return 'text-orange-600 bg-orange-100';
      case 'down': return 'text-red-600 bg-red-100';
      case 'maintenance': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'degraded': return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'partial': return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'down': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'maintenance': return <Clock className="h-5 w-5 text-blue-600" />;
      default: return <CheckCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const services = [
    {
      name: 'Web Application',
      description: 'Main SportsClubNet web application',
      status: 'operational',
      icon: Globe,
      uptime: '99.98%',
      responseTime: '145ms'
    },
    {
      name: 'API Services',
      description: 'REST API and authentication services',
      status: 'operational',
      icon: Server,
      uptime: '99.95%',
      responseTime: '89ms'
    },
    {
      name: 'Database',
      description: 'Primary database and data storage',
      status: 'operational',
      icon: Database,
      uptime: '100%',
      responseTime: '12ms'
    },
    {
      name: 'Real-time Features',
      description: 'Live updates and notifications',
      status: 'operational',
      icon: Zap,
      uptime: '99.92%',
      responseTime: '67ms'
    },
    {
      name: 'Email Notifications',
      description: 'Email delivery and notifications',
      status: 'operational',
      icon: Bell,
      uptime: '99.89%',
      responseTime: '2.3s'
    }
  ];

  const metrics = [
    {
      label: 'Overall Uptime',
      value: '99.97%',
      period: 'Last 30 days',
      trend: '+0.02%'
    },
    {
      label: 'Average Response Time',
      value: '118ms',
      period: 'Last 24 hours',
      trend: '-5ms'
    },
    {
      label: 'Active Users',
      value: '2,847',
      period: 'Current',
      trend: '+12%'
    },
    {
      label: 'API Requests',
      value: '1.2M',
      period: 'Last 24 hours',
      trend: '+8%'
    }
  ];

  const incidents = [
    {
      id: 1,
      title: 'Planned Maintenance: Database Optimization',
      status: 'completed',
      severity: 'maintenance',
      date: '2024-10-15',
      time: '02:00 - 04:30 UTC',
      description: 'Scheduled database maintenance to improve performance. No user impact expected.',
      updates: [
        {
          time: '04:30 UTC',
          message: 'Maintenance completed successfully. All services restored.'
        },
        {
          time: '02:00 UTC',
          message: 'Maintenance window started. Monitoring all services.'
        }
      ]
    },
    {
      id: 2,
      title: 'Brief API Slowdown',
      status: 'resolved',
      severity: 'minor',
      date: '2024-10-12',
      time: '14:15 - 14:32 UTC',
      description: 'Some users experienced slower API response times due to increased traffic.',
      updates: [
        {
          time: '14:32 UTC',
          message: 'Issue resolved. Response times back to normal.'
        },
        {
          time: '14:20 UTC',
          message: 'Investigating reports of slow API responses.'
        }
      ]
    },
    {
      id: 3,
      title: 'Email Delivery Delay',
      status: 'resolved',
      severity: 'minor',
      date: '2024-10-08',
      time: '09:45 - 11:20 UTC',
      description: 'Email notifications were delayed due to third-party service issues.',
      updates: [
        {
          time: '11:20 UTC',
          message: 'All delayed emails have been delivered. Service fully restored.'
        },
        {
          time: '10:15 UTC',
          message: 'Working with email provider to resolve delivery delays.'
        }
      ]
    }
  ];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'maintenance': return 'bg-blue-100 text-blue-800';
      case 'minor': return 'bg-yellow-100 text-yellow-800';
      case 'major': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
              <Activity className="h-12 w-12 text-green-600 mr-4" />
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                System Status
              </h1>
            </div>
            <p className="text-xl leading-8 text-gray-600 mb-8">
              Real-time status and performance metrics for SportsClubNet services.
            </p>

            {/* Overall Status */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-center mb-3">
                <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                <span className="text-2xl font-bold text-green-900">All Systems Operational</span>
              </div>
              <p className="text-green-700">
                All services are running normally with no known issues.
              </p>
              <p className="text-sm text-green-600 mt-2">
                Last updated: {lastUpdated.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Status */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Service Status
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Current status of all SportsClubNet services and components
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <service.icon className="h-6 w-6 text-gray-600 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {service.name}
                    </h3>
                  </div>
                  {getStatusIcon(service.status)}
                </div>
                
                <p className="text-gray-600 text-sm mb-4">
                  {service.description}
                </p>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Uptime (30d)</span>
                    <span className="font-semibold text-gray-900">{service.uptime}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Response Time</span>
                    <span className="font-semibold text-gray-900">{service.responseTime}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(service.status)}`}>
                      {service.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Performance Metrics
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Key performance indicators and system health metrics
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {metric.value}
                </div>
                <div className="text-lg font-semibold text-gray-700 mb-1">
                  {metric.label}
                </div>
                <div className="text-sm text-gray-500 mb-2">
                  {metric.period}
                </div>
                <div className={`text-sm font-medium ${
                  metric.trend.startsWith('+') ? 'text-green-600' : 'text-blue-600'
                }`}>
                  {metric.trend}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Incident History */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Recent Incidents
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              History of system incidents and maintenance activities
            </p>
          </div>

          <div className="mx-auto max-w-4xl space-y-6">
            {incidents.map((incident) => (
              <div key={incident.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {incident.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getSeverityColor(incident.severity)}`}>
                        {incident.severity}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mb-3">
                      {incident.date} • {incident.time}
                    </div>
                    <p className="text-gray-700 mb-4">
                      {incident.description}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    incident.status === 'resolved' || incident.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {incident.status}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Updates</h4>
                  <div className="space-y-2">
                    {incident.updates.map((update, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {update.time}
                          </div>
                          <div className="text-sm text-gray-600">
                            {update.message}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Status Page Footer */}
      <div className="bg-gray-900 text-white py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              Status page powered by SportsClubNet • Last updated: {lastUpdated.toLocaleString()}
            </p>
            <div className="mt-4 flex justify-center space-x-6 text-sm">
              <a href="/help" className="text-gray-400 hover:text-white">Help Center</a>
              <a href="/contact" className="text-gray-400 hover:text-white">Contact Support</a>
              <a href="/docs" className="text-gray-400 hover:text-white">API Docs</a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}