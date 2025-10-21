import React from 'react';
import { Star } from 'lucide-react';

export default function Testimonials() {
  const testimonials = [
    {
      content: "This platform transformed how we manage our tennis club. Booking conflicts are a thing of the past, and our members love the simplicity.",
      author: "Sarah Johnson",
      role: "Club Manager",
      club: "Riverside Tennis Club",
      rating: 5,
    },
    {
      content: "The tournament management feature is incredible. What used to take us weeks to organize now happens in hours. Game changer!",
      author: "Mike Chen",
      role: "Tournament Director",
      club: "Metro Sports Complex",
      rating: 5,
    },
    {
      content: "Our member engagement has increased 40% since switching. The mobile app makes everything so accessible for our players.",
      author: "Lisa Rodriguez",
      role: "Operations Manager",
      club: "Oakwood Racquet Club",
      rating: 5,
    },
  ];

  return (
    <section className="bg-gray-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Loved by club managers everywhere
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            See what sports clubs are saying about their experience with our platform.
          </p>
        </div>
        <div className="mx-auto mt-16 flow-root max-w-2xl sm:mt-20 lg:mx-0 lg:max-w-none">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, testimonialIdx) => (
              <div
                key={testimonialIdx}
                className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-gray-900/5"
              >
                <div className="flex items-center gap-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <blockquote className="text-gray-900">
                  <p className="text-sm leading-6">"{testimonial.content}"</p>
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-x-4">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-sm font-semibold text-gray-600">
                      {testimonial.author.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">
                      {testimonial.author}
                    </div>
                    <div className="text-xs text-gray-600">
                      {testimonial.role}, {testimonial.club}
                    </div>
                  </div>
                </figcaption>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}