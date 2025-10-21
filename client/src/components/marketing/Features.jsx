import React from 'react';
import { Calendar, Users, Trophy, CreditCard, BarChart3, Shield } from 'lucide-react';

export default function Features() {
  const features = [
    {
      name: 'Court Booking System',
      description: 'Simple scheduling with real-time availability. Members can book courts instantly.',
      icon: Calendar,
    },
    {
      name: 'Member Management',
      description: 'Complete member profiles, subscriptions, and communication tools in one place.',
      icon: Users,
    },
    {
      name: 'Tournament Organization',
      description: 'Create brackets, track scores, and manage competitions effortlessly.',
      icon: Trophy,
    },
    {
      name: 'Payment Processing',
      description: 'Integrated payments for bookings, memberships, and tournament fees.',
      icon: CreditCard,
    },
    {
      name: 'Analytics Dashboard',
      description: 'Track usage, revenue, and member engagement with detailed insights.',
      icon: BarChart3,
    },
    {
      name: 'Security & Privacy',
      description: 'Enterprise-grade security with data privacy compliance built-in.',
      icon: Shield,
    },
  ];

  return (
    <section className="py-24 sm:py-32" id="features">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">
            Everything you need
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            All-in-one club management
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            From court bookings to tournament management, we've got every aspect of your sports club covered.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <feature.icon className="h-5 w-5 flex-none text-indigo-600" aria-hidden="true" />
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}