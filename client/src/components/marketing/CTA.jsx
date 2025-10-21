import React from 'react';
import { ArrowRight, Check } from 'lucide-react';

export default function CTA() {
  const benefits = [
    '30-day free trial',
    'No setup fees',
    'Cancel anytime',
    '24/7 support',
  ];

  return (
    <section className="bg-indigo-600 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to transform your club?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-indigo-100">
            Join thousands of clubs already using our platform to streamline operations and delight their members.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a
              href="/app"
              className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors duration-200 flex items-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/app"
              className="text-sm font-semibold leading-6 text-white hover:text-indigo-100 transition-colors duration-200"
            >
              Try Demo <span aria-hidden="true">→</span>
            </a>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center justify-center gap-2 text-sm text-indigo-100">
                <Check className="h-4 w-4 text-indigo-300" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}