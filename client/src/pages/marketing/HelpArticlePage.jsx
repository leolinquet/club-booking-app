import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, Clock, User, ThumbsUp, ThumbsDown, MessageCircle, ChevronRight, Users, HelpCircle } from 'lucide-react';
import Footer from '../../components/marketing/Footer.jsx';

// Article content database
const articleContent = {
  1: {
    title: 'Getting Started with SportsClubNet',
    category: 'getting-started',
    readTime: '5 min read',
    lastUpdated: 'October 20, 2025',
    author: 'SportsClubNet Team',
    content: `
      <div style="background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%); padding: 2rem; border-radius: 1rem; margin-bottom: 2rem; border-left: 4px solid #3b82f6;">
        <h2 style="margin-top: 0; color: #1e40af;">👋 Welcome to SportsClubNet!</h2>
        <p>SportsClubNet is designed to make managing your sports club simple and efficient. Whether you're a club manager or a member looking to book courts, this comprehensive guide will help you get started quickly and confidently.</p>
      </div>
      
      <h2>🏆 What is SportsClubNet?</h2>
      <p>SportsClubNet is your all-in-one platform that transforms how sports clubs operate. Here's what makes us special:</p>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin: 1.5rem 0;">
        <div style="background: #f9fafb; padding: 1.5rem; border-radius: 0.75rem; border: 1px solid #e5e7eb;">
          <h4 style="color: #059669; margin-top: 0;">📅 Smart Scheduling</h4>
          <p style="margin-bottom: 0; font-size: 1rem;">Intuitive court booking system with real-time availability</p>
        </div>
        <div style="background: #f9fafb; padding: 1.5rem; border-radius: 0.75rem; border: 1px solid #e5e7eb;">
          <h4 style="color: #7c3aed; margin-top: 0;">👥 Member Management</h4>
          <p style="margin-bottom: 0; font-size: 1rem;">Easy member invitations and role management</p>
        </div>
        <div style="background: #f9fafb; padding: 1.5rem; border-radius: 0.75rem; border: 1px solid #e5e7eb;">
          <h4 style="color: #dc2626; margin-top: 0;">🏅 Tournament Tools</h4>
          <p style="margin-bottom: 0; font-size: 1rem;">Automated tournament brackets and scoring</p>
        </div>
        <div style="background: #f9fafb; padding: 1.5rem; border-radius: 0.75rem; border: 1px solid #e5e7eb;">
          <h4 style="color: #ea580c; margin-top: 0;">💬 Communication Hub</h4>
          <p style="margin-bottom: 0; font-size: 1rem;">Club announcements and member messaging</p>
        </div>
      </div>
      
      <h2>🚀 Quick Setup Guide</h2>
      <p>Get up and running in just 3 simple steps:</p>
      
      <div style="counter-reset: step-counter;">
        <div style="display: flex; align-items: flex-start; margin: 1.5rem 0; padding: 1.5rem; background: #fefce8; border-radius: 0.75rem; border-left: 4px solid #eab308; counter-increment: step-counter;">
          <div style="background: #eab308; color: white; width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 1rem; flex-shrink: 0;">1</div>
          <div>
            <h4 style="margin: 0 0 0.5rem 0; color: #92400e;">Create Your Account</h4>
            <p style="margin: 0; color: #92400e;">Visit our <a href="/app" style="color: #2563eb; font-weight: 600;">sign-up page</a> and create your account with your email address. It takes less than 30 seconds!</p>
          </div>
        </div>
        
        <div style="display: flex; align-items: flex-start; margin: 1.5rem 0; padding: 1.5rem; background: #ecfdf5; border-radius: 0.75rem; border-left: 4px solid #10b981; counter-increment: step-counter;">
          <div style="background: #10b981; color: white; width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 1rem; flex-shrink: 0;">2</div>
          <div>
            <h4 style="margin: 0 0 0.5rem 0; color: #047857;">Join or Create a Club</h4>
            <p style="margin: 0; color: #047857;">Use an invitation code to join an existing club, or create a new club if you're a manager setting up for the first time.</p>
          </div>
        </div>
        
        <div style="display: flex; align-items: flex-start; margin: 1.5rem 0; padding: 1.5rem; background: #eff6ff; border-radius: 0.75rem; border-left: 4px solid #3b82f6; counter-increment: step-counter;">
          <div style="background: #3b82f6; color: white; width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 1rem; flex-shrink: 0;">3</div>
          <div>
            <h4 style="margin: 0 0 0.5rem 0; color: #1e40af;">Complete Your Profile</h4>
            <p style="margin: 0; color: #1e40af;">Add your name, profile picture, and contact information to help other members connect with you.</p>
          </div>
        </div>
      </div>
      
      <h2>🎭 Understanding User Roles</h2>
      <p>SportsClubNet has two main user types, each with specific capabilities:</p>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin: 2rem 0;">
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 2rem; border-radius: 1rem; border: 1px solid #f59e0b;">
          <h3 style="margin-top: 0; color: #92400e; display: flex; align-items: center;">👑 Club Managers</h3>
          <ul style="color: #92400e; margin: 0;">
            <li>Manage club settings and policies</li>
            <li>Invite and manage members</li>
            <li>Set up courts and sports</li>
            <li>Oversee all bookings</li>
            <li>Create tournaments and events</li>
            <li>Send club-wide announcements</li>
          </ul>
        </div>
        
        <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 2rem; border-radius: 1rem; border: 1px solid #3b82f6;">
          <h3 style="margin-top: 0; color: #1e40af; display: flex; align-items: center;">🎾 Club Members</h3>
          <ul style="color: #1e40af; margin: 0;">
            <li>Book courts and facilities</li>
            <li>Join tournaments and events</li>
            <li>Find playing partners</li>
            <li>Communicate with other members</li>
            <li>View club announcements</li>
            <li>Manage personal bookings</li>
          </ul>
        </div>
      </div>
      
      <h2>📚 What's Next?</h2>
      <p>Now that you understand the basics, here are your recommended next steps:</p>
      
      <div style="background: #f8fafc; padding: 2rem; border-radius: 1rem; border: 1px solid #cbd5e1; margin: 2rem 0;">
        <h3 style="margin-top: 0; color: #475569;">📖 Recommended Reading</h3>
        <div style="display: grid; gap: 1rem;">
          <a href="/help-center/article/3" style="display: flex; align-items: center; padding: 1rem; background: white; border-radius: 0.5rem; text-decoration: none; border: 1px solid #e2e8f0; transition: all 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
            <span style="background: #dbeafe; padding: 0.5rem; border-radius: 0.5rem; margin-right: 1rem;">📅</span>
            <div>
              <h4 style="margin: 0; color: #1e40af;">Making Your First Court Booking</h4>
              <p style="margin: 0; color: #64748b; font-size: 0.9rem;">Complete guide to reserving courts and managing bookings</p>
            </div>
          </a>
          
          <a href="/help-center/article/9" style="display: flex; align-items: center; padding: 1rem; background: white; border-radius: 0.5rem; text-decoration: none; border: 1px solid #e2e8f0; transition: all 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
            <span style="background: #dcfce7; padding: 0.5rem; border-radius: 0.5rem; margin-right: 1rem;">👥</span>
            <div>
              <h4 style="margin: 0; color: #059669;">Finding Partners and Connecting</h4>
              <p style="margin: 0; color: #64748b; font-size: 0.9rem;">Use our social features to find playing partners</p>
            </div>
          </a>
          
          <a href="/help-center/article/6" style="display: flex; align-items: center; padding: 1rem; background: white; border-radius: 0.5rem; text-decoration: none; border: 1px solid #e2e8f0; transition: all 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
            <span style="background: #fef3c7; padding: 0.5rem; border-radius: 0.5rem; margin-right: 1rem;">⚙️</span>
            <div>
              <h4 style="margin: 0; color: #92400e;">Setting Up Courts (Managers Only)</h4>
              <p style="margin: 0; color: #64748b; font-size: 0.9rem;">Configure your club's courts and settings</p>
            </div>
          </a>
        </div>
      </div>
      
      <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 2rem; border-radius: 1rem; border-left: 4px solid #10b981; margin: 2rem 0;">
        <h3 style="margin-top: 0; color: #047857;">🎉 Welcome to the SportsClubNet Community!</h3>
        <p style="margin-bottom: 0; color: #047857;">We're excited to have you on board! Our team is here to help make your club management experience as smooth and enjoyable as possible. Don't hesitate to reach out if you need any assistance.</p>
      </div>
    `
  },
  2: {
    title: 'How to Create and Join a Club',
    category: 'getting-started',
    readTime: '3 min read',
    lastUpdated: 'October 20, 2025',
    author: 'SportsClubNet Team',
    content: `
      <h2>Creating or Joining a Club</h2>
      <p>Once you have a SportsClubNet account, you'll need to either join an existing club or create a new one. Here's how to do both.</p>
      
      <h3>Joining an Existing Club</h3>
      <p>If your club is already using SportsClubNet, you can join with an invitation:</p>
      <ol>
        <li><strong>Get an invitation:</strong> Ask your club manager for an invitation code or link.</li>
        <li><strong>Use the invitation:</strong> Click the invitation link or enter the code when prompted.</li>
        <li><strong>Accept the invitation:</strong> Review the club details and accept to join.</li>
      </ol>
      
      <h3>Creating a New Club</h3>
      <p>If you're a club manager setting up SportsClubNet for the first time:</p>
      <ol>
        <li><strong>Choose "Create a Club":</strong> From your dashboard, select the option to create a new club.</li>
        <li><strong>Enter club details:</strong> Provide your club name, location, and description.</li>
        <li><strong>Set up sports and courts:</strong> Add the sports your club offers and configure your courts.</li>
        <li><strong>Invite members:</strong> Send invitations to your existing members via email or invitation codes.</li>
      </ol>
      
      <h3>Club Settings and Configuration</h3>
      <p>As a club manager, you can configure:</p>
      <ul>
        <li><strong>Operating hours:</strong> Set when courts are available for booking</li>
        <li><strong>Booking rules:</strong> Define how far in advance members can book, cancellation policies, etc.</li>
        <li><strong>Court types:</strong> Set up different court types (tennis, pickleball, basketball, etc.)</li>
        <li><strong>Member permissions:</strong> Control what members can and cannot do</li>
      </ul>
      
      <h3>Managing Multiple Clubs</h3>
      <p>You can be a member of multiple clubs with the same account. Simply switch between clubs using the club selector in your dashboard.</p>
      
      <h3>Troubleshooting</h3>
      <p><strong>Can't find your club?</strong> Make sure you have the correct invitation code or ask your club manager to resend the invitation.</p>
      <p><strong>Having trouble creating a club?</strong> Ensure all required fields are filled out and contact support if you continue to experience issues.</p>
    `
  },
  3: {
    title: 'Making Your First Court Booking',
    category: 'bookings',
    readTime: '4 min read',
    lastUpdated: 'October 20, 2025',
    author: 'SportsClubNet Team',
    content: `
      <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 2rem; border-radius: 1rem; margin-bottom: 2rem; border-left: 4px solid #10b981;">
        <h2 style="margin-top: 0; color: #047857;">🎾 Making Your First Court Booking</h2>
        <p style="color: #047857;">Ready to reserve a court? Our intuitive booking system makes it simple to find and book the perfect time slot. This complete guide will walk you through every step of the process.</p>
      </div>
      
      <h2>🔍 Step 1: Finding Available Courts</h2>
      <p>Let's start by finding the perfect court and time for your game:</p>
      
      <div style="background: #f8fafc; padding: 2rem; border-radius: 1rem; border: 1px solid #cbd5e1; margin: 1.5rem 0;">
        <div style="counter-reset: step;">
          <div style="display: flex; align-items: flex-start; margin-bottom: 1.5rem; counter-increment: step;">
            <div style="background: #3b82f6; color: white; width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 1rem; flex-shrink: 0; font-size: 0.9rem;">1</div>
            <div>
              <h4 style="margin: 0 0 0.5rem 0; color: #1e40af;">Navigate to Bookings</h4>
              <p style="margin: 0; color: #475569;">From your dashboard, click on <strong>"book"</strong> or look for the calendar icon 📅</p>
            </div>
          </div>
          
          <div style="display: flex; align-items: flex-start; margin-bottom: 1.5rem; counter-increment: step;">
            <div style="background: #3b82f6; color: white; width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 1rem; flex-shrink: 0; font-size: 0.9rem;">2</div>
            <div>
              <h4 style="margin: 0 0 0.5rem 0; color: #1e40af;">Select Your Sport</h4>
              <p style="margin: 0; color: #475569;">Choose from available sports: Tennis 🎾, Pickleball 🏓, Basketball 🏀, etc.</p>
            </div>
          </div>
          
          <div style="display: flex; align-items: flex-start; margin-bottom: 1.5rem; counter-increment: step;">
            <div style="background: #3b82f6; color: white; width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 1rem; flex-shrink: 0; font-size: 0.9rem;">3</div>
            <div>
              <h4 style="margin: 0 0 0.5rem 0; color: #1e40af;">Pick Your Date</h4>
              <p style="margin: 0; color: #475569;">Use the calendar picker to select your preferred playing date</p>
            </div>
          </div>
          
          <div style="display: flex; align-items: flex-start; counter-increment: step;">
            <div style="background: #3b82f6; color: white; width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 1rem; flex-shrink: 0; font-size: 0.9rem;">4</div>
            <div>
              <h4 style="margin: 0 0 0.5rem 0; color: #1e40af;">View Available Time Slots</h4>
              <p style="margin: 0; color: #475569;">Look for the color-coded time slots:</p>
              <div style="display: flex; gap: 1rem; margin-top: 0.5rem; flex-wrap: wrap;">
                <span style="background: #10b981; color: white; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.8rem;">🟢 Available</span>
                <span style="background: #ef4444; color: white; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.8rem;">🔴 Booked</span>
                <span style="background: #ea580c; color: white; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.8rem;">🟠 Yours</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <h2>✅ Step 2: Making Your Reservation</h2>
      <p>Found the perfect slot? Here's how to secure your booking:</p>
      
      <div style="display: grid; gap: 1.5rem; margin: 2rem 0;">
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 1.5rem; border-radius: 0.75rem; border-left: 4px solid #f59e0b;">
          <h4 style="margin-top: 0; color: #92400e; display: flex; align-items: center;">
            <span style="margin-right: 0.5rem;">👆</span> Click Your Preferred Slot
          </h4>
          <p style="margin: 0; color: #92400e;">Simply click on any green (available) time slot to start your booking</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 1.5rem; border-radius: 0.75rem; border-left: 4px solid #3b82f6;">
          <h4 style="margin-top: 0; color: #1e40af; display: flex; align-items: center;">
            <span style="margin-right: 0.5rem;">📋</span> Review Booking Details
          </h4>
          <p style="margin: 0; color: #1e40af;">Double-check the date, time, court number, and sport before confirming</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 1.5rem; border-radius: 0.75rem; border-left: 4px solid #10b981;">
          <h4 style="margin-top: 0; color: #047857; display: flex; align-items: center;">
            <span style="margin-right: 0.5rem;">🎯</span> Confirm Your Booking
          </h4>
          <p style="margin: 0; color: #047857;">Click <strong>"Book Court"</strong> to secure your reservation - you'll get instant confirmation!</p>
        </div>
      </div>
      
      <h2> Finding Playing Partners</h2>
      <p>Make your games more social with our partner-finding features:</p>
      
      <div style="background: #f1f5f9; padding: 2rem; border-radius: 1rem; margin: 2rem 0; border: 1px solid #cbd5e1;">
        <h3 style="margin-top: 0; color: #475569;">🔍 Partner-Finding Options</h3>
        <div style="display: grid; gap: 1rem;">
          <div style="display: flex; align-items: center; padding: 1rem; background: white; border-radius: 0.5rem; border: 1px solid #e2e8f0;">
            <span style="font-size: 1.5rem; margin-right: 1rem;">🚩</span>
            <div>
              <h4 style="margin: 0; color: #1e40af;">Mark as "Looking for Partners"</h4>
              <p style="margin: 0; color: #64748b; font-size: 0.9rem;">Other members can see your booking and request to join</p>
            </div>
          </div>
          
          <div style="display: flex; align-items: center; padding: 1rem; background: white; border-radius: 0.5rem; border: 1px solid #e2e8f0;">
            <span style="font-size: 1.5rem; margin-right: 1rem;">👀</span>
            <div>
              <h4 style="margin: 0; color: #059669;">Browse Partner Requests</h4>
              <p style="margin: 0; color: #64748b; font-size: 0.9rem;">See who else is looking for playing partners at your skill level</p>
            </div>
          </div>
          
          <div style="display: flex; align-items: center; padding: 1rem; background: white; border-radius: 0.5rem; border: 1px solid #e2e8f0;">
            <span style="font-size: 1.5rem; margin-right: 1rem;">✉️</span>
            <div>
              <h4 style="margin: 0; color: #7c3aed;">Send Direct Invitations</h4>
              <p style="margin: 0; color: #64748b; font-size: 0.9rem;">Invite specific members you know to join your booking</p>
            </div>
          </div>
        </div>
      </div>
      
      <h2>📱 Managing Your Bookings <span style="background: #fbbf24; color: #92400e; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.75rem; font-weight: 500; margin-left: 1rem;">🚧 Coming Soon</span></h2>
      <p>We're working on advanced booking management features to help you keep track of all your court reservations effortlessly:</p>
      
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 2rem; border-radius: 1rem; border: 1px solid #f59e0b; margin: 2rem 0; opacity: 0.8;">
        <h3 style="margin-top: 0; color: #92400e; display: flex; align-items: center;">
          <span style="margin-right: 0.5rem;">�</span> 
          Features In Development
        </h3>
        <p style="color: #92400e; margin-bottom: 1rem; font-style: italic;">These exciting features will be available in a future update:</p>
        <ul style="color: #92400e; margin: 0; list-style: none; padding: 0;">
          <li style="display: flex; align-items: center; margin-bottom: 0.75rem; opacity: 0.7;">
            <span style="background: #f59e0b; color: white; width: 1.5rem; height: 1.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 0.75rem; font-size: 0.8rem;">📅</span>
            View all upcoming reservations in "My Bookings" dashboard
          </li>
          <li style="display: flex; align-items: center; margin-bottom: 0.75rem; opacity: 0.7;">
            <span style="background: #f59e0b; color: white; width: 1.5rem; height: 1.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 0.75rem; font-size: 0.8rem;">✏️</span>
            Modify or cancel bookings with one click
          </li>
          <li style="display: flex; align-items: center; margin-bottom: 0.75rem; opacity: 0.7;">
            <span style="background: #f59e0b; color: white; width: 1.5rem; height: 1.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 0.75rem; font-size: 0.8rem;">🔔</span>
            Automatic reminders and notifications before game time
          </li>
          <li style="display: flex; align-items: center; opacity: 0.7;">
            <span style="background: #f59e0b; color: white; width: 1.5rem; height: 1.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 0.75rem; font-size: 0.8rem;">📱</span>
            Full mobile app with offline access
          </li>
        </ul>
        <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #f59e0b;">
          <p style="margin: 0; color: #92400e; font-weight: 500;">
            💡 <strong>Stay tuned!</strong> We're actively developing these features and will notify all users when they become available.
          </p>
        </div>
      </div>
      
      <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 2rem; border-radius: 1rem; border-left: 4px solid #10b981; margin: 2rem 0;">
        <h3 style="margin-top: 0; color: #047857;">🎉 You're All Set!</h3>
        <p style="margin-bottom: 1rem; color: #047857;">Congratulations! You now know everything you need to start booking courts and enjoying your club's facilities. The system is designed to be intuitive, so don't hesitate to explore and try different features.</p>
        <p style="margin-bottom: 0; color: #047857;"><strong>Pro tip:</strong> Book popular time slots (evenings and weekends) as early as possible - they fill up quickly!</p>
      </div>
    `
  },
  4: {
    title: 'Understanding Time Slots and Availability',
    category: 'bookings',
    readTime: '3 min read',
    lastUpdated: 'October 20, 2025',
    author: 'SportsClubNet Team',
    content: `
      <h2>How Time Slots and Availability Work</h2>
      <p>Understanding how our booking system organizes time slots will help you find the perfect court times for your games.</p>
      
      <h3>Time Slot Structure</h3>
      <p>Our booking system divides the day into time slots:</p>
      <ul>
        <li><strong>Standard slots:</strong> Most clubs use 30-minute or 1-hour slots</li>
        <li><strong>Flexible duration:</strong> You can book multiple consecutive slots if you don't have any existing booking or once your current booking is done</li>
        <li><strong>Buffer time:</strong> Some clubs include setup/cleanup time between bookings</li>
      </ul>
      
      <h3>Availability Colors</h3>
      <p>Time slots are color-coded for easy understanding:</p>
      <ul>
        <li><strong>Green:</strong> Available for booking</li>
        <li><strong>Red:</strong> Already booked</li>
        <li><strong>Orange:</strong> When it's your booking</li>
        <li><strong>Gray:</strong> Outside operating hours or blocked by management</li>
      </ul>
      
      <h3>Peak and Off-Peak Times</h3>
      <p>Most clubs have different availability patterns:</p>
      <ul>
        <li><strong>Peak times:</strong> Evenings (5-9 PM) and weekends tend to book quickly</li>
        <li><strong>Off-peak times:</strong> Mornings and weekday afternoons often have better availability</li>
        <li><strong>Prime slots:</strong> The most popular times (6-8 PM) may have waiting lists</li>
      </ul>
      
      <h3>Tips for Finding Good Time Slots</h3>
      <ol>
        <li><strong>Book early:</strong> Popular times fill up quickly, so book as soon as slots become available</li>
        <li><strong>Be flexible:</strong> Consider off-peak times for better availability</li>
        <li><strong>Use notifications:</strong> Set up alerts for when prime slots become available</li>
        <li><strong>Check cancellations:</strong> Prime slots sometimes open up due to last-minute cancellations</li>
      </ol>
      
      <h3>Recurring Bookings</h3>
      <p>For regular games:</p>
      <ul>
        <li><strong>Weekly bookings:</strong> Some clubs allow recurring weekly reservations</li>
        <li><strong>Priority systems:</strong> Regular players may get priority for their usual slots</li>
        <li><strong>League reservations:</strong> Clubs may block certain times for leagues or tournaments</li>
      </ul>
      
      <p>Understanding these patterns will help you secure the court times you want!</p>
    `
  },
  5: {
    title: 'Canceling and Modifying Bookings',
    category: 'bookings',
    readTime: '2 min read',
    lastUpdated: 'October 20, 2025',
    author: 'SportsClubNet Team',
    content: `
      <h2>Managing Your Bookings</h2>
      <p>Plans change, and we make it easy to modify or cancel your court reservations when needed.</p>
      
      <h3>Canceling a Booking</h3>
      <p>To cancel a reservation:</p>
      <ol>
        <li><strong>Go to "book":</strong> Find your reservation in your booking list</li>
        <li><strong>Select the booking:</strong> Click on the booking you want to cancel</li>
        <li><strong>Choose "Cancel":</strong> Click the cancel button and confirm your choice</li>
        <li><strong>Confirmation:</strong> You'll receive a confirmation that your booking has been canceled</li>
      </ol>
      
      <h3>Cancellation Policies</h3>
      <p>Each club sets its own cancellation rules:</p>
      <ul>
        <li><strong>Free cancellation period:</strong> Usually 2-24 hours before the booking</li>
        <li><strong>Late cancellation:</strong> May result in fees or lost booking privileges</li>
        <li><strong>No-show policy:</strong> Missing a booking without canceling may have penalties</li>
      </ul>
      
      <h3>Modifying Bookings</h3>
      <p>To change your booking time or court:</p>
      <ol>
        <li><strong>Cancel and rebook:</strong> Currently, you'll need to cancel your existing booking and make a new one</li>
        <li><strong>Check availability:</strong> Make sure your preferred new time is available before canceling</li>
        <li><strong>Quick rebooking:</strong> Our system remembers your preferences to make rebooking faster</li>
      </ol>
      
      <h3>Emergency Cancellations</h3>
      <p>For last-minute emergencies:</p>
      <ul>
        <li><strong>Contact your club:</strong> Many clubs make exceptions for genuine emergencies</li>
        <li><strong>Medical exemptions:</strong> Some clubs waive fees for medical reasons with documentation</li>
        <li><strong>Weather cancellations:</strong> Outdoor courts may have automatic weather-related cancellations</li>
      </ul>
      
      <h3>Best Practices</h3>
      <ul>
        <li><strong>Cancel early:</strong> Give other members a chance to book the slot</li>
        <li><strong>Set reminders:</strong> Use calendar reminders to avoid forgetting about bookings</li>
        <li><strong>Check weather:</strong> For outdoor courts, check weather forecasts in advance</li>
      </ul>
      
      <p>Being considerate with cancellations helps ensure everyone gets fair access to court time!</p>
    `
  },
  6: {
    title: 'Setting Up Courts and Sports',
    category: 'club-management',
    readTime: '6 min read',
    lastUpdated: 'October 20, 2025',
    author: 'SportsClubNet Team',
    content: `
      <h2>Manager Guide: Setting Up Courts and Sports</h2>
      <p>As a club manager, properly configuring your courts and sports is essential for smooth operations. This guide will walk you through the setup process.</p>
      
      <h3>Adding Sports to Your Club</h3>
      <p>To add sports that your club offers:</p>
      <ol>
        <li><strong>Navigate through manager home:</strong> Go to your manager dashboard and access the home section</li>
        <li><strong>Add New Sport:</strong> Click "Add Sport" and select from our list of supported activities</li>
        <li><strong>Edit sports if you need to:</strong> Make modifications to existing sports (but make sure that when you do there's no current active bookings)</li>
        <li><strong>Save the changes:</strong> Confirm and save all your sport configurations</li>
      </ol>
      
      <h3>Operating Hours</h3>
      <p>Set your club's operating schedule:</p>
      <ul>
        <li><strong>Daily Hours:</strong> Set opening and closing times for each day</li>
        <li><strong>Seasonal Changes:</strong> Adjust hours for different seasons</li>
        <li><strong>Holiday Schedule:</strong> Set special hours or closures for holidays</li>
        <li><strong>Maintenance Windows:</strong> Block time for court maintenance (the only way of doing it right now is by assigning whatever court you need to block to your username)</li>
      </ul>
      
      <h3>Pricing and Fees</h3>
      <p>If your club charges for court time:</p>
      <ul>
        <li><strong>Court Rates:</strong> Set hourly rates for different courts</li>
        <li><strong>Peak vs Off-Peak:</strong> Different rates for busy times</li>
        <li><strong>Member Discounts:</strong> Special rates for different membership levels</li>
        <li><strong>Guest Fees:</strong> Additional charges for non-members</li>
      </ul>
      
      <h3>Testing Your Setup</h3>
      <p>Before going live:</p>
      <ol>
        <li><strong>Test Bookings:</strong> Make test reservations to ensure everything works</li>
        <li><strong>Check Member View:</strong> See how your setup looks to members</li>
        <li><strong>Verify Notifications:</strong> Ensure booking confirmations are being sent</li>
        <li><strong>Review Policies:</strong> Make sure all rules are clearly communicated</li>
      </ol>
      
      <p>A well-configured club setup makes management easier and provides a better experience for your members!</p>
    `
  },
  9: {
    title: 'Finding Partners and Connecting with Members',
    category: 'members',
    readTime: '4 min read',
    lastUpdated: 'October 20, 2025',
    author: 'SportsClubNet Team',
    content: `
      <h2>Connecting with Fellow Club Members</h2>
      <p>One of the best features of SportsClubNet is our ability to help you find playing partners and connect with other members. Here's how to make the most of our social features.</p>
      
      <h3>The "Looking for Partners" Feature</h3>
      <p>When making a booking, you can mark it as "Looking for Partners":</p>
      <ol>
        <li><strong>Make a Booking:</strong> Reserve your preferred court and time</li>
        <li><strong>Check "Looking for Partners":</strong> Mark this option during booking</li>
        <li><strong>Add Details:</strong> Specify your skill level and what type of game you want</li>
        <li><strong>Wait for Responses:</strong> Other members will see your request and can join</li>
      </ol>
      
      <h3>Browsing Partner Requests</h3>
      <p>To find others looking for partners:</p>
      <ul>
        <li><strong>Visit "Find Partners":</strong> Check the partner-finding section of your dashboard</li>
        <li><strong>Filter by Sport:</strong> See requests for your preferred activities</li>
        <li><strong>Check Skill Levels:</strong> Find players at your level</li>
        <li><strong>Review Time Slots:</strong> See what times work for you</li>
      </ul>
      
      <h3>Skill Level Guidelines</h3>
      <p>Help others find appropriate partners by being honest about your skill level:</p>
      <ul>
        <li><strong>Beginner:</strong> New to the sport, learning basics</li>
        <li><strong>Intermediate:</strong> Comfortable with rules, developing technique</li>
        <li><strong>Advanced:</strong> Experienced player with good technique</li>
        <li><strong>Competitive:</strong> Tournament-level player</li>
      </ul>
      
      <h3>Club Messaging</h3>
      <p>Once you connect with someone:</p>
      <ul>
        <li><strong>In-App Messaging:</strong> Chat directly through SportsClubNet</li>
        <li><strong>Share Contact Info:</strong> Exchange phone numbers or emails if desired</li>
        <li><strong>Coordinate Details:</strong> Discuss game format, equipment, etc.</li>
        <li><strong>Set Expectations:</strong> Agree on skill level and game intensity</li>
      </ul>
      
      <h3>Creating Regular Groups</h3>
      <p>For ongoing games:</p>
      <ul>
        <li><strong>Weekly Games:</strong> Set up recurring matches with the same group</li>
        <li><strong>Round Robin:</strong> Organize rotating partnerships</li>
        <li><strong>Skill Development:</strong> Form practice groups for improvement</li>
        <li><strong>Social Events:</strong> Plan tournaments or social gatherings</li>
      </ul>
      
      <h3>Etiquette for Partner Finding</h3>
      <p>Be a good club member:</p>
      <ul>
        <li><strong>Be Reliable:</strong> Show up on time for arranged games</li>
        <li><strong>Communicate Clearly:</strong> Be upfront about your skill level and expectations</li>
        <li><strong>Be Inclusive:</strong> Welcome players of different backgrounds and abilities</li>
        <li><strong>Give Feedback:</strong> Let others know if you had a good experience</li>
        <li><strong>Cancel Responsibly:</strong> Give advance notice if you can't make it</li>
      </ul>
      
      <h3>Safety and Privacy</h3>
      <p>Stay safe when meeting new players:</p>
      <ul>
        <li><strong>Meet at the Club:</strong> Always meet at your club for initial games</li>
        <li><strong>Share Appropriately:</strong> Only share personal info when comfortable</li>
        <li><strong>Report Issues:</strong> Contact club management if you have concerns</li>
        <li><strong>Trust Your Instincts:</strong> Don't feel obligated to play with someone if uncomfortable</li>
      </ul>
      
      <h3>Building Your Network</h3>
      <p>Over time, you'll build relationships with fellow members:</p>
      <ul>
        <li><strong>Regular Partners:</strong> Develop a core group of regular playing partners</li>
        <li><strong>Backup Options:</strong> Have alternatives when your usual partners aren't available</li>
        <li><strong>Skill Mentorship:</strong> Help newer players or learn from more experienced ones</li>
        <li><strong>Social Connections:</strong> Many playing partnerships develop into friendships</li>
      </ul>
      
      <p>The club community is what makes sports truly enjoyable - dive in and start connecting!</p>
    `
  },
  14: {
    title: 'Troubleshooting Common Issues',
    category: 'getting-started',
    readTime: '6 min read',
    lastUpdated: 'October 20, 2025',
    author: 'SportsClubNet Team',
    content: `
      <h2>Common Issues and Solutions</h2>
      <p>Running into problems? Here are solutions to the most frequently encountered issues with SportsClubNet.</p>
      
      <h3>Login and Account Issues</h3>
      
      <h4>Can't Log In</h4>
      <ul>
        <li><strong>Check your email and password:</strong> Make sure you're using the correct credentials</li>
        <li><strong>Try password reset:</strong> Click "Forgot Password" to reset your password</li>
        <li><strong>Clear browser cache:</strong> Clear cookies and cache, then try again</li>
        <li><strong>Check for typos:</strong> Ensure there are no extra spaces in your email</li>
      </ul>
      
      <h4>Not Receiving Emails</h4>
      <ul>
        <li><strong>Check spam folder:</strong> Our emails might be filtered as spam</li>
        <li><strong>Add to contacts:</strong> Add noreply@sportsclubnet.com to your contacts</li>
        <li><strong>Check email address:</strong> Verify your email address is correct in settings</li>
        <li><strong>Corporate firewalls:</strong> Work emails may block external messages</li>
      </ul>
      
      <h3>Booking Problems</h3>
      
      <h4>Can't See Available Time Slots</h4>
      <ul>
        <li><strong>Check the date:</strong> Make sure you're looking at a future date</li>
        <li><strong>Verify club hours:</strong> Courts may not be available outside operating hours</li>
        <li><strong>Booking window:</strong> You may be looking too far in advance</li>
        <li><strong>Refresh the page:</strong> Sometimes slots don't load immediately</li>
      </ul>
      
      <h4>Booking Keeps Failing</h4>
      <ul>
        <li><strong>Someone else booked first:</strong> The slot may have been taken by another member</li>
        <li><strong>Daily booking limit:</strong> You may have reached your daily booking limit</li>
        <li><strong>Club restrictions:</strong> Check if there are special rules for that time/court</li>
        <li><strong>Technical issue:</strong> Try refreshing and booking again</li>
      </ul>
      
      <h3>Mobile App Issues</h3>
      
      <h4>App Running Slowly</h4>
      <ul>
        <li><strong>Close other apps:</strong> Free up memory by closing unused apps</li>
        <li><strong>Restart the app:</strong> Close SportsClubNet completely and reopen</li>
        <li><strong>Check internet connection:</strong> Ensure you have a stable connection</li>
        <li><strong>Update the app:</strong> Make sure you have the latest version</li>
      </ul>
      
      <h4>Features Not Working on Mobile</h4>
      <ul>
        <li><strong>Enable JavaScript:</strong> Ensure JavaScript is enabled in your mobile browser</li>
        <li><strong>Try desktop version:</strong> Some features work better on desktop</li>
        <li><strong>Clear mobile browser cache:</strong> Clear cached data</li>
        <li><strong>Use supported browser:</strong> Chrome, Safari, or Firefox work best</li>
      </ul>
      
      <h3>Club and Member Issues</h3>
      
      <h4>Can't Join a Club</h4>
      <ul>
        <li><strong>Check invitation code:</strong> Make sure you have the correct code</li>
        <li><strong>Code expired:</strong> Ask your club manager for a new invitation</li>
        <li><strong>Already a member:</strong> You might already be a member of the club</li>
        <li><strong>Club at capacity:</strong> The club may have reached its member limit</li>
      </ul>
      
      <h4>Missing Club Features</h4>
      <ul>
        <li><strong>Check your role:</strong> Some features are only available to managers</li>
        <li><strong>Club settings:</strong> The feature may be disabled by your club</li>
        <li><strong>Subscription level:</strong> Some features require premium club subscriptions</li>
        <li><strong>Beta features:</strong> New features may not be available to all clubs yet</li>
      </ul>
      
      <h3>Payment and Billing Issues</h3>
      
      <h4>Payment Failed</h4>
      <ul>
        <li><strong>Check card details:</strong> Verify card number, expiry, and CVV</li>
        <li><strong>Sufficient funds:</strong> Ensure your account has enough balance</li>
        <li><strong>Contact bank:</strong> Your bank may be blocking the transaction</li>
        <li><strong>Try different card:</strong> Use an alternative payment method</li>
      </ul>
      
      <h4>Billing Questions</h4>
      <ul>
        <li><strong>Check billing history:</strong> Review past charges in your account settings</li>
        <li><strong>Understand pricing:</strong> Review our pricing page for current rates</li>
        <li><strong>Proration:</strong> Mid-cycle changes are prorated automatically</li>
        <li><strong>Contact support:</strong> Reach out for billing disputes or questions</li>
      </ul>
      
      <h3>Technical Problems</h3>
      
      <h4>Page Won't Load</h4>
      <ul>
        <li><strong>Check internet connection:</strong> Ensure you're connected to the internet</li>
        <li><strong>Try incognito mode:</strong> This bypasses cache and extension issues</li>
        <li><strong>Disable browser extensions:</strong> Ad blockers can interfere with functionality</li>
        <li><strong>Try different browser:</strong> Test with Chrome, Firefox, or Safari</li>
      </ul>
      
      <h4>Features Not Working</h4>
      <ul>
        <li><strong>Enable cookies:</strong> Our app requires cookies to function properly</li>
        <li><strong>Allow pop-ups:</strong> Some features use pop-up windows</li>
        <li><strong>Update browser:</strong> Ensure you're using a recent browser version</li>
        <li><strong>Check device compatibility:</strong> We support devices from the last 5 years</li>
      </ul>
      
      <h3>When to Contact Support</h3>
      <p>Contact our support team if:</p>
      <ul>
        <li>You've tried the above solutions and still have issues</li>
        <li>You're experiencing a bug or error message</li>
        <li>You need help with club setup or configuration</li>
        <li>You have billing or account questions</li>
        <li>You need to report inappropriate behavior</li>
      </ul>
      
      <p>Our support team is here to help! Don't hesitate to reach out at <a href="/contact">support@sportsclubnet.com</a>.</p>
    `
  },
  7: {
    title: 'Managing Club Members and Permissions',
    category: 'club-management',
    readTime: '5 min read',
    lastUpdated: 'October 20, 2025',
    author: 'SportsClubNet Team',
    content: `
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 2rem; border-radius: 1rem; margin-bottom: 2rem; border-left: 4px solid #f59e0b;">
        <h2 style="margin-top: 0; color: #92400e;">👥 Managing Club Members and Permissions</h2>
        <p style="color: #92400e;">As a club manager, effectively managing your members and their permissions is crucial for smooth operations. This guide covers everything you need to know about member management.</p>
      </div>
      
      <h2>📧 Inviting New Members</h2>
      <p>Adding new members to your club is simple and secure:</p>
      
      <div style="background: #f8fafc; padding: 2rem; border-radius: 1rem; border: 1px solid #cbd5e1; margin: 1.5rem 0;">
        <div style="counter-reset: step;">
          <div style="display: flex; align-items: flex-start; margin-bottom: 1.5rem; counter-increment: step;">
            <div style="background: #3b82f6; color: white; width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 1rem; flex-shrink: 0; font-size: 0.9rem;">1</div>
            <div>
              <h4 style="margin: 0 0 0.5rem 0; color: #1e40af;">Navigate to Member Management</h4>
              <p style="margin: 0; color: #475569;">Go to your clubs and find the member management section</p>
            </div>
          </div>
          
          <div style="display: flex; align-items: flex-start; margin-bottom: 1.5rem; counter-increment: step;">
            <div style="background: #3b82f6; color: white; width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 1rem; flex-shrink: 0; font-size: 0.9rem;">2</div>
            <div>
              <h4 style="margin: 0 0 0.5rem 0; color: #1e40af;">Send Invitations</h4>
              <p style="margin: 0; color: #475569;">Enter member username and send invitation links</p>
            </div>
          </div>
          
          <div style="display: flex; align-items: flex-start; counter-increment: step;">
            <div style="background: #3b82f6; color: white; width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 1rem; flex-shrink: 0; font-size: 0.9rem;">3</div>
            <div>
              <h4 style="margin: 0 0 0.5rem 0; color: #1e40af;">Track Invitations</h4>
              <p style="margin: 0; color: #475569;">Monitor which invitations have been sent and accepted</p>
            </div>
          </div>
        </div>
      </div>
      
      <h2>🔐 Understanding Member Permissions</h2>
      <p>SportsClubNet has a simple but effective permission system:</p>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin: 2rem 0;">
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 2rem; border-radius: 1rem; border: 1px solid #f59e0b;">
          <h3 style="margin-top: 0; color: #92400e; display: flex; align-items: center;">👑 Manager Permissions</h3>
          <ul style="color: #92400e; margin: 0;">
            <li>Full access to all club settings</li>
            <li>Invite and remove members</li>
            <li>Manage sports and schedules</li>
            <li>View all bookings and member activity</li>
            <li>Send club-wide announcements</li>
          </ul>
        </div>
        
        <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 2rem; border-radius: 1rem; border: 1px solid #3b82f6;">
          <h3 style="margin-top: 0; color: #1e40af; display: flex; align-items: center;">🎾 Member Permissions</h3>
          <ul style="color: #1e40af; margin: 0;">
            <li>Book available court times</li>
            <li>Cancel own bookings</li>
            <li>Find and connect with partners</li>
            <li>View club announcements</li>
            <li>Update personal profile</li>
          </ul>
        </div>
      </div>
      
      <h2>👤 Managing Member Profiles</h2>
      <p>Keep your member roster organized and up-to-date:</p>
      
      <div style="background: #f1f5f9; padding: 2rem; border-radius: 1rem; margin: 2rem 0; border: 1px solid #cbd5e1;">
        <h3 style="margin-top: 0; color: #475569;">📋 Member Management Tasks</h3>
        <div style="display: grid; gap: 1rem;">
          <div style="display: flex; align-items: center; padding: 1rem; background: white; border-radius: 0.5rem; border: 1px solid #e2e8f0;">
            <span style="font-size: 1.5rem; margin-right: 1rem;">👁️</span>
            <div>
              <h4 style="margin: 0; color: #1e40af;">View Member List</h4>
              <p style="margin: 0; color: #64748b; font-size: 0.9rem;">See all active members and their basic information</p>
            </div>
          </div>
          
          <div style="display: flex; align-items: center; padding: 1rem; background: white; border-radius: 0.5rem; border: 1px solid #e2e8f0;">
            <span style="font-size: 1.5rem; margin-right: 1rem;">✏️</span>
            <div>
              <h4 style="margin: 0; color: #059669;">Update Member Details</h4>
              <p style="margin: 0; color: #64748b; font-size: 0.9rem;">Edit contact information and membership status</p>
            </div>
          </div>
          
          <div style="display: flex; align-items: center; padding: 1rem; background: white; border-radius: 0.5rem; border: 1px solid #e2e8f0;">
            <span style="font-size: 1.5rem; margin-right: 1rem;">🚫</span>
            <div>
              <h4 style="margin: 0; color: #dc2626;">Remove Members</h4>
              <p style="margin: 0; color: #64748b; font-size: 0.9rem;">Remove inactive or problematic members when necessary</p>
            </div>
          </div>
        </div>
      </div>
      
      <h2>📢 Communication with Members</h2>
      <p>Keep your club community informed and engaged:</p>
      
      <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 2rem; border-radius: 1rem; border: 1px solid #10b981; margin: 2rem 0;">
        <h3 style="margin-top: 0; color: #047857;">💬 Communication Options</h3>
        <ul style="color: #047857; margin: 0; list-style: none; padding: 0;">
          <li style="display: flex; align-items: center; margin-bottom: 0.75rem;">
            <span style="background: #10b981; color: white; width: 1.5rem; height: 1.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 0.75rem; font-size: 0.8rem;">📢</span>
            Send club-wide announcements for important updates
          </li>
          <li style="display: flex; align-items: center; margin-bottom: 0.75rem;">
            <span style="background: #10b981; color: white; width: 1.5rem; height: 1.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 0.75rem; font-size: 0.8rem;">✉️</span>
            Send targeted messages to specific members
          </li>
          <li style="display: flex; align-items: center;">
            <span style="background: #10b981; color: white; width: 1.5rem; height: 1.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 0.75rem; font-size: 0.8rem;">🔔</span>
            Automatic notifications for booking confirmations and reminders
          </li>
        </ul>
      </div>
      
      <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 2rem; border-radius: 1rem; border-left: 4px solid #10b981; margin: 2rem 0;">
        <h3 style="margin-top: 0; color: #047857;">✅ Best Practices for Member Management</h3>
        <p style="margin-bottom: 1rem; color: #047857;">Follow these guidelines to maintain a healthy club community:</p>
        <ul style="margin-bottom: 0; color: #047857;">
          <li><strong>Regular Communication:</strong> Keep members informed about club updates and events</li>
          <li><strong>Fair Access:</strong> Ensure all members have equal opportunity to book courts</li>
          <li><strong>Quick Response:</strong> Address member concerns and questions promptly</li>
          <li><strong>Clear Policies:</strong> Establish and communicate clear booking and cancellation policies</li>
        </ul>
      </div>
    `
  },
  8: {
    title: 'Club Announcements and Communications',
    category: 'club-management',
    readTime: '3 min read',
    lastUpdated: 'October 20, 2025',
    author: 'SportsClubNet Team',
    content: `
      <div style="background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); padding: 2rem; border-radius: 1rem; margin-bottom: 2rem; border-left: 4px solid #6366f1;">
        <h2 style="margin-top: 0; color: #3730a3;">📢 Club Announcements and Communications</h2>
        <p style="color: #3730a3;">Effective communication is key to running a successful club. Learn how to keep your members informed and engaged with our announcement and messaging features.</p>
      </div>
      
      <h2>📣 Creating Announcements</h2>
      <p>Share important information with all your club members:</p>
      
      <div style="background: #f8fafc; padding: 2rem; border-radius: 1rem; border: 1px solid #cbd5e1; margin: 1.5rem 0;">
        <div style="counter-reset: step;">
          <div style="display: flex; align-items: flex-start; margin-bottom: 1.5rem; counter-increment: step;">
            <div style="background: #6366f1; color: white; width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 1rem; flex-shrink: 0; font-size: 0.9rem;">1</div>
            <div>
              <h4 style="margin: 0 0 0.5rem 0; color: #3730a3;">Access Announcements</h4>
              <p style="margin: 0; color: #475569;">Go to your manager dashboard and find the announcements section</p>
            </div>
          </div>
          
          <div style="display: flex; align-items: flex-start; margin-bottom: 1.5rem; counter-increment: step;">
            <div style="background: #6366f1; color: white; width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 1rem; flex-shrink: 0; font-size: 0.9rem;">2</div>
            <div>
              <h4 style="margin: 0 0 0.5rem 0; color: #3730a3;">Write Your Message</h4>
              <p style="margin: 0; color: #475569;">Create clear, concise announcements with all necessary details</p>
            </div>
          </div>
          
          <div style="display: flex; align-items: flex-start; counter-increment: step;">
            <div style="background: #6366f1; color: white; width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 1rem; flex-shrink: 0; font-size: 0.9rem;">3</div>
            <div>
              <h4 style="margin: 0 0 0.5rem 0; color: #3730a3;">Publish to Members</h4>
              <p style="margin: 0; color: #475569;">Send the announcement to all club members instantly</p>
            </div>
          </div>
        </div>
      </div>
      
      <h2>📝 Types of Announcements</h2>
      <p>Different situations call for different types of communication:</p>
      
      <div style="display: grid; gap: 1.5rem; margin: 2rem 0;">
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 1.5rem; border-radius: 0.75rem; border-left: 4px solid #f59e0b;">
          <h4 style="margin-top: 0; color: #92400e; display: flex; align-items: center;">
            <span style="margin-right: 0.5rem;">⚠️</span> Important Updates
          </h4>
          <p style="margin: 0; color: #92400e;">Schedule changes, facility closures, policy updates</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 1.5rem; border-radius: 0.75rem; border-left: 4px solid #3b82f6;">
          <h4 style="margin-top: 0; color: #1e40af; display: flex; align-items: center;">
            <span style="margin-right: 0.5rem;">🎉</span> Events & Tournaments
          </h4>
          <p style="margin: 0; color: #1e40af;">Upcoming tournaments, social events, special activities</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 1.5rem; border-radius: 0.75rem; border-left: 4px solid #10b981;">
          <h4 style="margin-top: 0; color: #047857; display: flex; align-items: center;">
            <span style="margin-right: 0.5rem;">💡</span> Tips & Reminders
          </h4>
          <p style="margin: 0; color: #047857;">Booking reminders, club etiquette, helpful tips</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); padding: 1.5rem; border-radius: 0.75rem; border-left: 4px solid #ec4899;">
          <h4 style="margin-top: 0; color: #be185d; display: flex; align-items: center;">
            <span style="margin-right: 0.5rem;">🏆</span> Achievements & Recognition
          </h4>
          <p style="margin: 0; color: #be185d;">Member achievements, tournament results, club milestones</p>
        </div>
      </div>
      
      <h2>✍️ Writing Effective Announcements</h2>
      <p>Make your communications clear and engaging:</p>
      
      <div style="background: #f1f5f9; padding: 2rem; border-radius: 1rem; margin: 2rem 0; border: 1px solid #cbd5e1;">
        <h3 style="margin-top: 0; color: #475569;">📝 Best Practices</h3>
        <div style="display: grid; gap: 1rem;">
          <div style="display: flex; align-items: center; padding: 1rem; background: white; border-radius: 0.5rem; border: 1px solid #e2e8f0;">
            <span style="font-size: 1.5rem; margin-right: 1rem;">🎯</span>
            <div>
              <h4 style="margin: 0; color: #1e40af;">Be Clear and Concise</h4>
              <p style="margin: 0; color: #64748b; font-size: 0.9rem;">Get to the point quickly with all essential information</p>
            </div>
          </div>
          
          <div style="display: flex; align-items: center; padding: 1rem; background: white; border-radius: 0.5rem; border: 1px solid #e2e8f0;">
            <span style="font-size: 1.5rem; margin-right: 1rem;">📅</span>
            <div>
              <h4 style="margin: 0; color: #059669;">Include Important Dates</h4>
              <p style="margin: 0; color: #64748b; font-size: 0.9rem;">Always specify when something takes effect or expires</p>
            </div>
          </div>
          
          <div style="display: flex; align-items: center; padding: 1rem; background: white; border-radius: 0.5rem; border: 1px solid #e2e8f0;">
            <span style="font-size: 1.5rem; margin-right: 1rem;">🎨</span>
            <div>
              <h4 style="margin: 0; color: #7c3aed;">Use Friendly Tone</h4>
              <p style="margin: 0; color: #64748b; font-size: 0.9rem;">Keep communications positive and welcoming</p>
            </div>
          </div>
        </div>
      </div>
      
      <h2>📱 Managing Communications <span style="background: #fbbf24; color: #92400e; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.75rem; font-weight: 500; margin-left: 1rem;">🚧 Enhanced Features Coming Soon</span></h2>
      <p>We're working on advanced communication features:</p>
      
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 2rem; border-radius: 1rem; border: 1px solid #f59e0b; margin: 2rem 0; opacity: 0.8;">
        <h3 style="margin-top: 0; color: #92400e;">🚧 Coming Soon</h3>
        <ul style="color: #92400e; margin: 0; opacity: 0.7;">
          <li>Scheduled announcements</li>
          <li>Member-specific messaging</li>
          <li>Announcement categories and filtering</li>
          <li>Read receipts and engagement tracking</li>
        </ul>
      </div>
      
      <div style="background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); padding: 2rem; border-radius: 1rem; border-left: 4px solid #6366f1; margin: 2rem 0;">
        <h3 style="margin-top: 0; color: #3730a3;">🎯 Communication Success Tips</h3>
        <p style="margin-bottom: 1rem; color: #3730a3;">Keep your club community engaged with regular, valuable communication:</p>
        <ul style="margin-bottom: 0; color: #3730a3;">
          <li><strong>Regular Updates:</strong> Share news consistently but don't overwhelm members</li>
          <li><strong>Timely Information:</strong> Send announcements with enough advance notice</li>
          <li><strong>Two-Way Communication:</strong> Encourage member feedback and questions</li>
          <li><strong>Celebrate Community:</strong> Recognize member achievements and milestones</li>
        </ul>
      </div>
    `
  },
  10: {
    title: 'Club Messaging and Chat Features',
    category: 'members',
    readTime: '3 min read',
    lastUpdated: 'October 20, 2025',
    author: 'SportsClubNet Team',
    content: `
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 2rem; border-radius: 1rem; margin-bottom: 2rem; border-left: 4px solid #f59e0b;">
        <h2 style="margin-top: 0; color: #92400e;">💬 Club Messaging and Chat Features</h2>
        <p style="color: #92400e;">Stay connected with your club members through our messaging features. Connect, coordinate games, and build your tennis community!</p>
      </div>
      
      <h2>🎯 Current Communication Options</h2>
      <p>Here's how you can currently connect with club members:</p>
      
      <div style="display: grid; gap: 1.5rem; margin: 2rem 0;">
        <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 1.5rem; border-radius: 0.75rem; border-left: 4px solid #3b82f6;">
          <h4 style="margin-top: 0; color: #1e40af; display: flex; align-items: center;">
            <span style="margin-right: 0.5rem;">�</span> Direct Messaging
          </h4>
          <p style="margin: 0; color: #1e40af;">Send private messages to other club members for game coordination and social interaction</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 1.5rem; border-radius: 0.75rem; border-left: 4px solid #3b82f6;">
          <h4 style="margin-top: 0; color: #1e40af; display: flex; align-items: center;">
            <span style="margin-right: 0.5rem;">🎾</span> Partner Finding
          </h4>
          <p style="margin: 0; color: #1e40af;">Use the "Looking for Partners" feature when making bookings to connect with other players</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 1.5rem; border-radius: 0.75rem; border-left: 4px solid #10b981;">
          <h4 style="margin-top: 0; color: #047857; display: flex; align-items: center;">
            <span style="margin-right: 0.5rem;">�</span> Club Announcements
          </h4>
          <p style="margin: 0; color: #047857;">Stay updated with club news and communicate through manager announcements</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); padding: 1.5rem; border-radius: 0.75rem; border-left: 4px solid #ec4899;">
          <h4 style="margin-top: 0; color: #be185d; display: flex; align-items: center;">
            <span style="margin-right: 0.5rem;">�</span> Profile Information
          </h4>
          <p style="margin: 0; color: #be185d;">Share contact information through your profile for direct communication outside the app</p>
        </div>
      </div>
      
      <h2>🚧 Additional Features in Development</h2>
      <p>Our team is working on additional communication tools to enhance your club experience:</p>
      
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 2rem; border-radius: 1rem; border: 1px solid #f59e0b; margin: 2rem 0; opacity: 0.8;">
        <h3 style="margin-top: 0; color: #92400e; display: flex; align-items: center;">
          <span style="margin-right: 0.5rem;">�️</span> 
          Features In Development
        </h3>
        <p style="color: #92400e; margin-bottom: 1.5rem; font-style: italic;">These exciting features will be available in future updates:</p>
        
        <div style="display: grid; gap: 1.5rem;">
          <div style="background: white; padding: 1.5rem; border-radius: 0.75rem; border: 1px solid #f59e0b; opacity: 0.7;">
            <h4 style="margin-top: 0; color: #92400e; display: flex; align-items: center;">
              <span style="margin-right: 0.5rem;">👥</span> Group Chats
            </h4>
            <p style="margin: 0; color: #92400e;">Create group conversations for tournaments, regular playing groups, or club committees</p>
          </div>
          
          <div style="background: white; padding: 1.5rem; border-radius: 0.75rem; border: 1px solid #f59e0b; opacity: 0.7;">
            <h4 style="margin-top: 0; color: #92400e; display: flex; align-items: center;">
              <span style="margin-right: 0.5rem;">�</span> Booking-Integrated Chat
            </h4>
            <p style="margin: 0; color: #92400e;">Automatic chat creation for court bookings to coordinate with playing partners</p>
          </div>
          
          <div style="background: white; padding: 1.5rem; border-radius: 0.75rem; border: 1px solid #f59e0b; opacity: 0.7;">
            <h4 style="margin-top: 0; color: #92400e; display: flex; align-items: center;">
              <span style="margin-right: 0.5rem;">�</span> Smart Notifications
            </h4>
            <p style="margin: 0; color: #92400e;">Customizable notifications for messages, mentions, and important club communications</p>
          </div>
        </div>
      </div>
      
      <h2>📱 What's Coming Next</h2>
      <p>Our messaging system will include these powerful features:</p>
      
      <div style="background: #f1f5f9; padding: 2rem; border-radius: 1rem; margin: 2rem 0; border: 1px solid #cbd5e1;">
        <h3 style="margin-top: 0; color: #475569;">⭐ Future Features Preview</h3>
        <div style="display: grid; gap: 1rem;">
          <div style="display: flex; align-items: center; padding: 1rem; background: white; border-radius: 0.5rem; border: 1px solid #e2e8f0; opacity: 0.7;">
            <span style="font-size: 1.5rem; margin-right: 1rem;">💨</span>
            <div>
              <h4 style="margin: 0; color: #1e40af;">Real-time Messaging</h4>
              <p style="margin: 0; color: #64748b; font-size: 0.9rem;">Instant message delivery with read receipts and typing indicators</p>
            </div>
          </div>
          
          <div style="display: flex; align-items: center; padding: 1rem; background: white; border-radius: 0.5rem; border: 1px solid #e2e8f0; opacity: 0.7;">
            <span style="font-size: 1.5rem; margin-right: 1rem;">�</span>
            <div>
              <h4 style="margin: 0; color: #059669;">Media Sharing</h4>
              <p style="margin: 0; color: #64748b; font-size: 0.9rem;">Share photos, videos, and documents within your conversations</p>
            </div>
          </div>
          
          <div style="display: flex; align-items: center; padding: 1rem; background: white; border-radius: 0.5rem; border: 1px solid #e2e8f0; opacity: 0.7;">
            <span style="font-size: 1.5rem; margin-right: 1rem;">🔍</span>
            <div>
              <h4 style="margin: 0; color: #7c3aed;">Message Search</h4>
              <p style="margin: 0; color: #64748b; font-size: 0.9rem;">Find past conversations and shared information quickly</p>
            </div>
          </div>
          
          <div style="display: flex; align-items: center; padding: 1rem; background: white; border-radius: 0.5rem; border: 1px solid #e2e8f0; opacity: 0.7;">
            <span style="font-size: 1.5rem; margin-right: 1rem;">�️</span>
            <div>
              <h4 style="margin: 0; color: #dc2626;">Privacy Controls</h4>
              <p style="margin: 0; color: #64748b; font-size: 0.9rem;">Control who can message you and manage your communication preferences</p>
            </div>
          </div>
        </div>
      </div>
      
    `
  },
  11: {
    title: 'Tournament Management System',
    category: 'club-management',
    readTime: '6 min read',
    lastUpdated: 'October 20, 2025',
    author: 'SportsClubNet Team',
    content: `
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 2rem; border-radius: 1rem; margin-bottom: 2rem; border-left: 4px solid #f59e0b;">
        <h2 style="margin-top: 0; color: #92400e;">🏆 Tournament Management System</h2>
        <p style="color: #92400e;">Organize and run professional tournaments in your club with our comprehensive tournament management features. From registration to results tracking, we've got you covered!</p>
      </div>
      
      <h2>🎾 Creating Your First Tournament</h2>
      <p>Setting up a tournament in SportsClubNet is straightforward and powerful:</p>
      
      <div style="background: #f8fafc; padding: 2rem; border-radius: 1rem; border: 1px solid #cbd5e1; margin: 1.5rem 0;">
        <div style="counter-reset: step;">
          <div style="display: flex; align-items: flex-start; margin-bottom: 1.5rem; counter-increment: step;">
            <div style="background: #f59e0b; color: white; width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 1rem; flex-shrink: 0; font-size: 0.9rem;">1</div>
            <div>
              <h4 style="margin: 0 0 0.5rem 0; color: #92400e;">Access Tournament Management</h4>
              <p style="margin: 0; color: #475569;">Go to tournaments and find the tournament management section</p>
            </div>
          </div>
          
          <div style="display: flex; align-items: flex-start; margin-bottom: 1.5rem; counter-increment: step;">
            <div style="background: #f59e0b; color: white; width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 1rem; flex-shrink: 0; font-size: 0.9rem;">2</div>
            <div>
              <h4 style="margin: 0 0 0.5rem 0; color: #92400e;">Tournament Setup</h4>
              <p style="margin: 0; color: #475569;">Define name, draw size, point per round, number of seeds and sport</p>
            </div>
          </div>
          
          <div style="display: flex; align-items: flex-start; margin-bottom: 1.5rem; counter-increment: step;">
            <div style="background: #f59e0b; color: white; width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 1rem; flex-shrink: 0; font-size: 0.9rem;">3</div>
            <div>
              <h4 style="margin: 0 0 0.5rem 0; color: #92400e;">Open Registration</h4>
              <p style="margin: 0; color: #475569;">Allow members to register and manage tournament participants</p>
            </div>
          </div>
          
          <div style="display: flex; align-items: flex-start; counter-increment: step;">
            <div style="background: #f59e0b; color: white; width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 1rem; flex-shrink: 0; font-size: 0.9rem;">4</div>
            <div>
              <h4 style="margin: 0 0 0.5rem 0; color: #92400e;">Generate Brackets</h4>
              <p style="margin: 0; color: #475569;">Automatically create tournament brackets and schedule matches</p>
            </div>
          </div>
        </div>
      </div>
      
      <h2>📊 Registration Management</h2>
      <p>Efficiently manage tournament participants and registrations:</p>
      
      <div style="background: #f1f5f9; padding: 2rem; border-radius: 1rem; margin: 2rem 0; border: 1px solid #cbd5e1;">
        <h3 style="margin-top: 0; color: #475569;">🎯 Registration Features</h3>
        <div style="display: grid; gap: 1rem;">
          <div style="display: flex; align-items: center; padding: 1rem; background: white; border-radius: 0.5rem; border: 1px solid #e2e8f0;">
            <span style="font-size: 1.5rem; margin-right: 1rem;">✅</span>
            <div>
              <h4 style="margin: 0; color: #1e40af;">Open/Close Registration</h4>
              <p style="margin: 0; color: #64748b; font-size: 0.9rem;">Control when members can register for tournaments</p>
            </div>
          </div>
          
          <div style="display: flex; align-items: center; padding: 1rem; background: white; border-radius: 0.5rem; border: 1px solid #e2e8f0;">
            <span style="font-size: 1.5rem; margin-right: 1rem;">👤</span>
            <div>
              <h4 style="margin: 0; color: #059669;">Player Limits</h4>
              <p style="margin: 0; color: #64748b; font-size: 0.9rem;">Set maximum number of participants and waitlists</p>
            </div>
          </div>
          
          <div style="display: flex; align-items: center; padding: 1rem; background: white; border-radius: 0.5rem; border: 1px solid #e2e8f0;">
            <span style="font-size: 1.5rem; margin-right: 1rem;">🏅</span>
            <div>
              <h4 style="margin: 0; color: #7c3aed;">Skill Level Requirements</h4>
              <p style="margin: 0; color: #64748b; font-size: 0.9rem;">Set skill level requirements for fair competition</p>
            </div>
          </div>
          
          <div style="display: flex; align-items: center; padding: 1rem; background: white; border-radius: 0.5rem; border: 1px solid #e2e8f0;">
            <span style="font-size: 1.5rem; margin-right: 1rem;">💰</span>
            <div>
              <h4 style="margin: 0; color: #dc2626;">Entry Fees</h4>
              <p style="margin: 0; color: #64748b; font-size: 0.9rem;">Collect entry fees and manage tournament finances</p>
            </div>
          </div>
        </div>
      </div>
      
      <h2>🏆 Results and Brackets</h2>
      <p>Track tournament progress and manage results:</p>
      
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 2rem; border-radius: 1rem; border: 1px solid #f59e0b; margin: 2rem 0;">
        <h3 style="margin-top: 0; color: #92400e;">📈 Tournament Progress</h3>
        <ul style="color: #92400e; margin: 0; list-style: none; padding: 0;">
          <li style="display: flex; align-items: center; margin-bottom: 0.75rem;">
            <span style="background: #f59e0b; color: white; width: 1.5rem; height: 1.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 0.75rem; font-size: 0.8rem;">📊</span>
            Live bracket updates and real-time progress tracking
          </li>
          <li style="display: flex; align-items: center; margin-bottom: 0.75rem;">
            <span style="background: #f59e0b; color: white; width: 1.5rem; height: 1.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 0.75rem; font-size: 0.8rem;">🏅</span>
            Automatic winner advancement and ranking updates
          </li>
          <li style="display: flex; align-items: center; margin-bottom: 0.75rem;">
            <span style="background: #f59e0b; color: white; width: 1.5rem; height: 1.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 0.75rem; font-size: 0.8rem;">📱</span>
            Player notifications for upcoming matches
          </li>
          <li style="display: flex; align-items: center;">
            <span style="background: #f59e0b; color: white; width: 1.5rem; height: 1.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 0.75rem; font-size: 0.8rem;">🏆</span>
            Championship ceremony and awards tracking
          </li>
        </ul>
      </div>
      
      <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 2rem; border-radius: 1rem; border-left: 4px solid #0ea5e9; margin: 2rem 0;">
        <h3 style="margin-top: 0; color: #0c4a6e;">🎯 Tournament Success Tips</h3>
        <p style="margin-bottom: 1rem; color: #0c4a6e;">Make your tournaments engaging and professional:</p>
        <ul style="margin-bottom: 0; color: #0c4a6e;">
          <li><strong>Clear Communication:</strong> Send regular updates about schedules and results</li>
          <li><strong>Fair Play:</strong> Establish and enforce consistent rules and regulations</li>
          <li><strong>Engaging Format:</strong> Choose formats that keep players motivated throughout</li>
          <li><strong>Recognition:</strong> Celebrate winners and acknowledge all participants</li>
          <li><strong>Feedback Collection:</strong> Gather input to improve future tournaments</li>
        </ul>
      </div>
    `
  },
  12: {
    title: 'Advanced Booking Analytics',
    category: 'club-management',
    readTime: '4 min read',
    lastUpdated: 'Coming Soon',
    author: 'SportsClubNet Team',
    comingSoon: true,
    content: `
      <div style="background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); padding: 2rem; border-radius: 1rem; margin-bottom: 2rem; border-left: 4px solid #6366f1; opacity: 0.8;">
        <h2 style="margin-top: 0; color: #3730a3;">📊 Advanced Booking Analytics <span style="background: #6366f1; color: white; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.75rem; font-weight: 500; margin-left: 1rem;">🚧 Coming Soon</span></h2>
        <p style="color: #3730a3;">Get detailed insights into your club's booking patterns, member activity, and court utilization with advanced analytics and reporting features.</p>
      </div>
      
      <div style="text-align: center; padding: 3rem; opacity: 0.6;">
        <h3 style="color: #6b7280;">📈 Analytics features in development!</h3>
        <p style="color: #9ca3af;">Comprehensive reporting and analytics tools are being developed to help you make data-driven decisions.</p>
      </div>
    `
  },
  13: {
    title: 'Mobile App Features Guide',
    category: 'getting-started',
    readTime: '5 min read',
    lastUpdated: 'Coming Soon',
    author: 'SportsClubNet Team',
    comingSoon: true,
    content: `
      <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 2rem; border-radius: 1rem; margin-bottom: 2rem; border-left: 4px solid #10b981; opacity: 0.8;">
        <h2 style="margin-top: 0; color: #047857;">📱 Mobile App Features Guide <span style="background: #10b981; color: white; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.75rem; font-weight: 500; margin-left: 1rem;">🚧 Coming Soon</span></h2>
        <p style="color: #047857;">Learn about our upcoming mobile app features and how to make the most of SportsClubNet on your smartphone or tablet.</p>
      </div>
      
      <div style="text-align: center; padding: 3rem; opacity: 0.6;">
        <h3 style="color: #6b7280;">📲 Mobile guide coming soon!</h3>
        <p style="color: #9ca3af;">We're preparing comprehensive documentation for our mobile app features and functionality.</p>
      </div>
    `
  }
};

export default function HelpArticlePage() {
  const { articleId } = useParams();
  const article = articleContent[parseInt(articleId)];

  if (!article) {
    return <Navigate to="/help-center" replace />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <nav className="mx-auto max-w-4xl px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <a href="/help-center" className="flex items-center text-blue-600 hover:text-blue-800">
              <ArrowLeft className="mr-2 h-5 w-5" />
              <span className="font-medium">Back to Help Center</span>
            </a>
            <a href="/app" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Try the App
            </a>
          </div>
        </nav>
      </header>

      {/* Article Content */}
      <article className="mx-auto max-w-4xl px-6 lg:px-8 py-16">
        {/* Article Header */}
        <header className="mb-12">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
              {article.category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </span>
            <div className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
              <Clock className="h-4 w-4 mr-2 text-gray-500" />
              <span className="font-medium">{article.readTime}</span>
            </div>
            <div className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
              <User className="h-4 w-4 mr-2 text-gray-500" />
              <span className="font-medium">{article.author}</span>
            </div>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-6 leading-tight">
            {article.title}
          </h1>
          
          <div className="flex items-center justify-between py-4 px-6 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-gray-600 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Last updated: {article.lastUpdated}
            </p>
            <div className="flex items-center text-sm text-gray-500">
              <span>Table of contents</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </div>
          </div>
        </header>

        {/* Article Body */}
        <div className="bg-white">
          <div className="max-w-none">
            <div 
              className="article-content"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>
        </div>

        <style jsx>{`
          .article-content h2 {
            font-size: 2rem;
            font-weight: 700;
            color: #1f2937;
            margin-top: 3rem;
            margin-bottom: 1.5rem;
            padding-bottom: 0.75rem;
            border-bottom: 2px solid #e5e7eb;
            line-height: 1.2;
          }

          .article-content h3 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1e40af;
            margin-top: 2.5rem;
            margin-bottom: 1rem;
            line-height: 1.3;
          }

          .article-content h4 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #374151;
            margin-top: 2rem;
            margin-bottom: 0.75rem;
            line-height: 1.3;
          }

          .article-content p {
            font-size: 1.125rem;
            line-height: 1.8;
            color: #4b5563;
            margin-bottom: 1.5rem;
          }

          .article-content ul, .article-content ol {
            margin-bottom: 1.5rem;
            padding-left: 1.5rem;
          }

          .article-content li {
            font-size: 1.125rem;
            line-height: 1.7;
            color: #4b5563;
            margin-bottom: 0.5rem;
          }

          .article-content li strong {
            color: #1f2937;
            font-weight: 600;
          }

          .article-content strong {
            color: #1f2937;
            font-weight: 600;
          }

          .article-content a {
            color: #2563eb;
            font-weight: 500;
            text-decoration: none;
            border-bottom: 1px solid transparent;
            transition: all 0.2s;
          }

          .article-content a:hover {
            border-bottom-color: #2563eb;
          }

          .article-content ul {
            list-style: none;
            position: relative;
          }

          .article-content ul li {
            position: relative;
            padding-left: 1.5rem;
          }

          .article-content ul li::before {
            content: "•";
            color: #3b82f6;
            font-weight: bold;
            position: absolute;
            left: 0;
            font-size: 1.2rem;
          }

          .article-content ol {
            counter-reset: item;
          }

          .article-content ol li {
            position: relative;
            padding-left: 2rem;
            counter-increment: item;
          }

          .article-content ol li::before {
            content: counter(item) ".";
            color: #3b82f6;
            font-weight: 600;
            position: absolute;
            left: 0;
            font-size: 1.1rem;
          }

          .article-content code {
            background-color: #f3f4f6;
            padding: 0.25rem 0.5rem;
            border-radius: 0.375rem;
            font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
            font-size: 0.9rem;
            color: #1f2937;
          }
        `}</style>

        {/* Article Footer */}
        <footer className="mt-16 pt-12 border-t border-gray-200">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Was this article helpful?
                </h3>
                <p className="text-gray-600 mb-4">
                  Let us know how we can improve our documentation
                </p>
                <div className="flex items-center gap-3 justify-center md:justify-start">
                  <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-xl hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all">
                    <ThumbsUp className="h-4 w-4" />
                    <span className="font-medium">Helpful</span>
                  </button>
                  <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-xl hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all">
                    <ThumbsDown className="h-4 w-4" />
                    <span className="font-medium">Not helpful</span>
                  </button>
                </div>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <MessageCircle className="h-8 w-8 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Still need help?</h4>
                <p className="text-gray-600 mb-4">Our support team is here to help</p>
                <a
                  href="/contact"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </footer>
      </article>

      {/* Related Articles */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Continue learning</h2>
            <p className="text-lg text-gray-600">Explore related articles to deepen your understanding</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <a href="/help-center/article/2" className="group">
              <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:border-blue-200 transition-all duration-300 group-hover:-translate-y-1 h-full">
                <div className="flex items-center mb-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-600">Getting Started</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 group-hover:text-blue-900 transition-colors">
                  How to Create and Join a Club
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Step-by-step guide to creating a new club or joining an existing one.
                </p>
                <div className="flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-700">
                  Read article
                  <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </a>

            <a href="/help-center/article/9" className="group">
              <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:border-blue-200 transition-all duration-300 group-hover:-translate-y-1 h-full">
                <div className="flex items-center mb-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-600">Members</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 group-hover:text-blue-900 transition-colors">
                  Finding Partners and Connecting
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Use our partner-finding features to connect with other players.
                </p>
                <div className="flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-700">
                  Read article
                  <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </a>

            <a href="/help-center/article/14" className="group">
              <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:border-blue-200 transition-all duration-300 group-hover:-translate-y-1 h-full">
                <div className="flex items-center mb-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                    <HelpCircle className="h-5 w-5 text-orange-600" />
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-600">Support</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 group-hover:text-blue-900 transition-colors">
                  Troubleshooting Common Issues
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Solutions to frequently encountered problems and error messages.
                </p>
                <div className="flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-700">
                  Read article
                  <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </a>
          </div>

          <div className="text-center mt-12">
            <a
              href="/help-center"
              className="inline-flex items-center px-8 py-4 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Browse all articles
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}