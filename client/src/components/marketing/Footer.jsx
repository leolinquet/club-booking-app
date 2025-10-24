import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const navigation = {
    product: [
      { name: 'Features', href: '#features', type: 'anchor' },
      { name: 'How It Works', href: '#how-it-works', type: 'anchor' },
      { name: 'Pricing', href: '/app', type: 'app' },
      { name: 'Demo', href: '/app', type: 'app' },
    ],
    company: [
      { name: 'About', href: '/about', type: 'page' },
      { name: 'Blog', href: '/blog', type: 'page' },
      { name: 'Contact', href: 'mailto:support@sportsclubnet.com', type: 'external' },
    ],
    resources: [
      { name: 'Help Center', href: '/help-center', type: 'page' },
      { name: 'System Status', href: '/status', type: 'page' },
      { name: 'Community', href: '/community', type: 'page' },
    ],
    legal: [
      { name: 'Privacy', href: '/privacy', type: 'page' },
      { name: 'Terms', href: '/terms', type: 'page' },
      { name: 'Security', href: '/security', type: 'page' },
      { name: 'Cookies', href: '/cookies', type: 'page' },
    ],
  };

  const handleClick = (e, item) => {
    if (item.type === 'anchor') {
      // Anchor links on same page - allow default behavior
      return;
    }
    
    if (item.type === 'external') {
      // External links (mailto, etc.) - allow default behavior
      return;
    }
    
    if (item.type === 'app') {
      // Navigate to app
      e.preventDefault();
      window.history.pushState({}, '', '/app');
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }
    
    if (item.type === 'page') {
      // Navigate to the page
      e.preventDefault();
      window.location.href = item.href;
      return;
    }
  };

  return (
    <footer className="bg-gray-900" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8">
            <div>
              <span className="text-2xl font-bold text-white">
                SportsClubNet
              </span>
              <p className="text-sm leading-6 text-gray-300 mt-4">
                The all-in-one platform for sports club management. 
                Simple for managers, fast for players.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <Mail className="h-4 w-4" />
                <span>support@sportsclubnet.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <Phone className="h-4 w-4" />
                <span>+1 267 824 1391</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <MapPin className="h-4 w-4" />
                <span>Lincoln, Nebraska</span>
              </div>
            </div>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-white">Product</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.product.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        onClick={(e) => handleClick(e, item)}
                        className="text-sm leading-6 text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-white">Company</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.company.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        onClick={(e) => handleClick(e, item)}
                        className="text-sm leading-6 text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-white">Resources</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.resources.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        onClick={(e) => handleClick(e, item)}
                        className="text-sm leading-6 text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-white">Legal</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.legal.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        onClick={(e) => handleClick(e, item)}
                        className="text-sm leading-6 text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-white/10 pt-8 sm:mt-20 lg:mt-24">
          <p className="text-xs leading-5 text-gray-400">
            &copy; 2024 SportsClubNet. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}