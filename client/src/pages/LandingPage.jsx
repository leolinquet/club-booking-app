import React, { useEffect } from 'react';
import Hero from '../components/marketing/Hero';
import Logos from '../components/marketing/Logos';
import Features from '../components/marketing/Features';
import HowItWorks from '../components/marketing/HowItWorks';
import Testimonials from '../components/marketing/Testimonials';
import CTA from '../components/marketing/CTA';
import FAQ from '../components/marketing/FAQ';
import Footer from '../components/marketing/Footer';

export default function LandingPage() {
  useEffect(() => {
    // Set meta tags for SEO
    document.title = "Club Booking – Club bookings, members & tournaments in one platform";
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Streamline your sports club with flexible bookings, member management, and automated tournaments.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Streamline your sports club with flexible bookings, member management, and automated tournaments.';
      document.head.appendChild(meta);
    }

    // Add Open Graph tags
    const ogTags = [
      { property: 'og:title', content: 'Club Booking – All-in-one club management' },
      { property: 'og:description', content: 'Streamline your sports club with flexible bookings, member management, and automated tournaments.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: '/icons/icon-512.png' },
    ];

    ogTags.forEach(tag => {
      const existing = document.querySelector(`meta[property="${tag.property}"]`);
      if (existing) {
        existing.setAttribute('content', tag.content);
      } else {
        const meta = document.createElement('meta');
        meta.setAttribute('property', tag.property);
        meta.setAttribute('content', tag.content);
        document.head.appendChild(meta);
      }
    });

    // Smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';

    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div className="bg-white">
      <Hero />
      <Logos />
      <Features />
      <HowItWorks />
      <Testimonials />
      <CTA />
      <FAQ />
      <Footer />
      
      {/* TODO: Add analytics script */}
      {/* Analytics placeholder for future implementation */}
    </div>
  );
}