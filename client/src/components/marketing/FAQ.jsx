import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function FAQ() {
  const [openItems, setOpenItems] = useState(new Set());

  const toggleItem = (index) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  const faqs = [
    {
      question: "How quickly can we get set up?",
      answer: "Most clubs are up and running within 24 hours. Our onboarding team will guide you through the initial setup, including importing your member data, configuring courts, and setting up booking rules."
    },
    {
      question: "Do we need technical expertise to use the platform?",
      answer: "Not at all! Our platform is designed to be user-friendly for club managers of all technical backgrounds. We provide comprehensive training and 24/7 support to ensure you're comfortable with all features."
    },
    {
      question: "Can members book courts through their mobile phones?",
      answer: "Yes! Our platform is fully responsive and works seamlessly on mobile devices. Members can book courts, view schedules, and manage their accounts from any device, anywhere."
    },
    {
      question: "What happens to our existing member data?",
      answer: "We'll help you migrate all your existing member data, booking history, and preferences. Our migration process is secure and typically completed within a few hours with zero data loss."
    },
    {
      question: "Is there a contract or can we cancel anytime?",
      answer: "We offer flexible month-to-month plans with no long-term contracts. You can upgrade, downgrade, or cancel your subscription at any time. We're confident you'll love the platform!"
    },
    {
      question: "How does pricing work for different sized clubs?",
      answer: "Our pricing scales with your club size and needs. We offer plans based on the number of courts and members, starting from $49/month for small clubs. Contact us for custom enterprise pricing for larger facilities."
    },
  ];

  return (
    <section className="bg-white py-24 sm:py-32" id="faq">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Have questions? We've got answers. Can't find what you're looking for? Contact our support team.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-3xl">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors duration-200"
                  onClick={() => toggleItem(index)}
                >
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </h3>
                  {openItems.has(index) ? (
                    <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  )}
                </button>
                {openItems.has(index) && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 leading-7">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Still have questions?{' '}
            <a
              href="mailto:support@sportsclubnet.com"
              className="font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}