import React from 'react';
import { UserPlus, Settings, Zap } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      name: 'Sign Up Your Club',
      description: 'Create your account and add your courts, facilities, and basic club information in minutes.',
      icon: UserPlus,
      step: '01',
    },
    {
      name: 'Configure Settings',
      description: 'Set up booking rules, pricing, member tiers, and customize the platform to match your club.',
      icon: Settings,
      step: '02',
    },
    {
      name: 'Launch & Grow',
      description: 'Invite members, start taking bookings, and watch your club operations become effortless.',
      icon: Zap,
      step: '03',
    },
  ];

  return (
    <section className="bg-white py-24 sm:py-32" id="how-it-works">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">
            Simple setup
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Get started in 3 easy steps
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            No technical expertise required. We'll have your club up and running in no time.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-0">
            {steps.map((step, stepIdx) => (
              <div key={step.name} className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600">
                  <step.icon className="h-8 w-8 text-white" aria-hidden="true" />
                </div>
                <div className="mb-4">
                  <span className="text-sm font-semibold text-indigo-600">
                    Step {step.step}
                  </span>
                  <h3 className="mt-2 text-xl font-bold text-gray-900">
                    {step.name}
                  </h3>
                </div>
                <p className="text-base leading-7 text-gray-600">
                  {step.description}
                </p>
                {stepIdx < steps.length - 1 && (
                  <div className="mt-8 hidden lg:block">
                    <div className="h-0.5 w-16 bg-gray-200"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}