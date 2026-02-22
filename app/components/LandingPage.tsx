"use client";

import { useEffect, useRef } from "react";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

interface LandingPageProps {
  onEnter: () => void;
  isEntering: boolean;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  theme: {
    textMain: string;
    textMuted: string;
    button: string;
  };
}

export default function LandingPage({ onEnter, isEntering, isDarkMode, onToggleTheme, theme }: LandingPageProps) {
  // Refs for parallax leaves
  const leftLeaf1Ref = useRef<HTMLDivElement>(null);
  const leftLeaf2Ref = useRef<HTMLDivElement>(null);
  const leftLeaf3Ref = useRef<HTMLDivElement>(null);
  const rightLeaf1Ref = useRef<HTMLDivElement>(null);
  const rightLeaf2Ref = useRef<HTMLDivElement>(null);
  const rightLeaf3Ref = useRef<HTMLDivElement>(null);

  // Parallax effect using requestAnimationFrame for smooth performance
  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      
      requestAnimationFrame(() => {
        const y = window.scrollY || 0;
        
        // Left leaves - different speeds for depth effect
        if (leftLeaf1Ref.current) {
          leftLeaf1Ref.current.style.transform = `translateY(${-y * 0.15}px) translateX(-4rem) rotate(-45deg)`;
        }
        if (leftLeaf2Ref.current) {
          leftLeaf2Ref.current.style.transform = `translateY(${-y * 0.1}px) translateX(-5rem) rotate(-20deg)`;
        }
        if (leftLeaf3Ref.current) {
          leftLeaf3Ref.current.style.transform = `translateY(${-y * 0.05}px) translateX(-6rem) rotate(0deg)`;
        }
        
        // Right leaves - mirrored speeds
        if (rightLeaf1Ref.current) {
          rightLeaf1Ref.current.style.transform = `translateY(${-y * 0.15}px) translateX(4rem) rotate(135deg)`;
        }
        if (rightLeaf2Ref.current) {
          rightLeaf2Ref.current.style.transform = `translateY(${-y * 0.1}px) translateX(5rem) rotate(160deg)`;
        }
        if (rightLeaf3Ref.current) {
          rightLeaf3Ref.current.style.transform = `translateY(${-y * 0.05}px) translateX(6rem) rotate(180deg)`;
        }
        
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    // Initialize position on mount
    onScroll();
    
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          <circle cx="12" cy="16" r="1" />
        </svg>
      ),
      title: "Private & Encrypted",
      description: "Every conversation is fully encrypted and locked behind your personal PIN. Your data stays safe, secure, and visible only to you—always."
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 1 1-9-9" />
          <path d="M12 7v5l3 3" />
          <path d="M17 3v4h4" />
        </svg>
      ),
      title: "Persistent Memory",
      description: "Remembers your story across sessions—your goals, challenges, and growth—so every conversation builds on the last."
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20v-6M6 20V10M18 20V4" />
        </svg>
      ),
      title: "Track Progress",
      description: "Monitor your emotional journey with session summaries and intensity scores that reveal your growth over time."
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      ),
      title: "Gentle Support",
      description: "Offers practical techniques—breathing exercises, grounding, reframing—with your consent, when you need them most."
    },
  ];

  const benefits = [
    "Build healthier habits through consistent self-reflection",
    "Understand your triggers and develop better coping strategies",
    "Track emotional patterns that influence your personal & professional life",
    "Access support anytime, anywhere—judgment-free",
  ];

  return (
    <div className="relative z-10 flex flex-1 flex-col">
      {/* Top Right Controls - User Profile & Theme Toggle */}
      <div className="fixed top-6 right-6 flex items-center gap-3 z-50">
        {/* User Button (Profile) - Only shown when signed in */}
        <SignedIn>
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "w-10 h-10",
                userButtonPopoverCard: isDarkMode ? "bg-[#0f1a14] border-[#1F3326]" : "bg-white border-[#D8E6DB]",
                userButtonPopoverActionButton: isDarkMode ? "text-[#E8F3EE] hover:bg-[#1F3326]" : "text-[#2F3E33] hover:bg-[#E6F5E9]",
              }
            }}
          />
        </SignedIn>
        
        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className={`p-3 rounded-full transition-all duration-300 hover:scale-110 ${isDarkMode ? 'bg-[#1F3326] text-[#E8F3EE] hover:bg-[#2C4A3B]' : 'bg-[#E6F5E9] text-[#2F3E33] hover:bg-[#D4E7D9]'} hover:cursor-pointer`}
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 py-20 overflow-hidden">
        {/* Decorative Leaves - Left Side */}
        <div 
          ref={leftLeaf1Ref}
          className={`absolute bottom-8 left-0 pointer-events-none z-0 will-change-transform transition-opacity duration-700 ${isEntering ? 'opacity-0' : 'opacity-100'}`}
          style={{ transform: 'translateX(-4rem) rotate(-45deg)' }}
        >
          <img 
            src="https://images.vexels.com/media/users/3/291929/isolated/preview/fc74823e1467a7dc172d8ec012c78b00-leaves-flat-delicate-green.png"
            alt=""
            className="w-48 md:w-64 opacity-70"
          />
        </div>
        <div 
          ref={leftLeaf2Ref}
          className={`absolute bottom-32 left-0 pointer-events-none z-0 will-change-transform transition-opacity duration-700 ${isEntering ? 'opacity-0' : 'opacity-100'}`}
          style={{ transform: 'translateX(-5rem) rotate(-20deg)' }}
        >
          <img 
            src="https://images.vexels.com/media/users/3/291929/isolated/preview/fc74823e1467a7dc172d8ec012c78b00-leaves-flat-delicate-green.png"
            alt=""
            className="w-40 md:w-56 opacity-50"
          />
        </div>
        <div 
          ref={leftLeaf3Ref}
          className={`absolute bottom-56 left-0 pointer-events-none z-0 will-change-transform transition-opacity duration-700 ${isEntering ? 'opacity-0' : 'opacity-100'}`}
          style={{ transform: 'translateX(-6rem) rotate(0deg)' }}
        >
          <img 
            src="https://images.vexels.com/media/users/3/291929/isolated/preview/fc74823e1467a7dc172d8ec012c78b00-leaves-flat-delicate-green.png"
            alt=""
            className="w-36 md:w-48 opacity-35"
          />
        </div>

        {/* Decorative Leaves - Right Side */}
        <div 
          ref={rightLeaf1Ref}
          className={`absolute bottom-8 right-0 pointer-events-none z-0 will-change-transform transition-opacity duration-700 ${isEntering ? 'opacity-0' : 'opacity-100'}`}
          style={{ transform: 'translateX(4rem) rotate(135deg)' }}
        >
          <img 
            src="https://images.vexels.com/media/users/3/291929/isolated/preview/fc74823e1467a7dc172d8ec012c78b00-leaves-flat-delicate-green.png"
            alt=""
            className="w-48 md:w-64 opacity-70"
          />
        </div>
        <div 
          ref={rightLeaf2Ref}
          className={`absolute bottom-32 right-0 pointer-events-none z-0 will-change-transform transition-opacity duration-700 ${isEntering ? 'opacity-0' : 'opacity-100'}`}
          style={{ transform: 'translateX(5rem) rotate(160deg)' }}
        >
          <img 
            src="https://images.vexels.com/media/users/3/291929/isolated/preview/fc74823e1467a7dc172d8ec012c78b00-leaves-flat-delicate-green.png"
            alt=""
            className="w-40 md:w-56 opacity-50"
          />
        </div>
        <div 
          ref={rightLeaf3Ref}
          className={`absolute bottom-56 right-0 pointer-events-none z-0 will-change-transform transition-opacity duration-700 ${isEntering ? 'opacity-0' : 'opacity-100'}`}
          style={{ transform: 'translateX(6rem) rotate(180deg)' }}
        >
          <img 
            src="https://images.vexels.com/media/users/3/291929/isolated/preview/fc74823e1467a7dc172d8ec012c78b00-leaves-flat-delicate-green.png"
            alt=""
            className="w-36 md:w-48 opacity-35"
          />
        </div>

        <div
          className={`max-w-3xl text-center space-y-8 transition-all duration-700 z-10 ${
            isEntering ? "opacity-0 scale-95" : "opacity-100 scale-100"
          }`}
        >
          <div className="space-y-4">
            <p className={`text-sm font-medium tracking-widest uppercase ${isDarkMode ? 'text-[#6B9B7A]' : 'text-[#4A7C5A]'}`}>
              Your Personal Growth Companion
            </p>
            <h1
              className={`text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight transition-colors duration-1000 font-[family-name:var(--font-playfair)] ${theme.textMain} animate-shine`}
              style={{ color: isDarkMode ? '#E8F3EE' : '#2F3E33' }}
            >
              Healith
            </h1>
            <p className={`text-xl md:text-2xl leading-relaxed transition-colors duration-1000 max-w-2xl mx-auto ${theme.textMuted}`}>
               The AI wellness companion that <strong>actually remembers you</strong>. Reflect, grow, and track your emotional journey over time.
            </p>
          </div>

          <div className="relative pt-4">
            {/* Show SignIn button when not authenticated, otherwise show Enter button */}
            <SignedOut>
              <SignInButton mode="modal">
                <button
                  disabled={isEntering}
                  className={`relative z-20 group inline-flex items-center justify-center overflow-hidden rounded-full px-12 py-5 transition-all duration-500 hover:scale-105 active:scale-95 shadow-xl disabled:cursor-not-allowed hover:cursor-pointer ${theme.button}`}
                >
                  <span className="relative text-base font-medium tracking-wide uppercase">
                    Begin Your Journey
                  </span>
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <button
                onClick={onEnter}
                disabled={isEntering}
                className={`relative z-20 group inline-flex items-center justify-center overflow-hidden rounded-full px-12 py-5 transition-all duration-500 hover:scale-105 active:scale-95 shadow-xl disabled:cursor-not-allowed ${theme.button} hover:cursor-pointer`}
              >
                <span className="relative text-base font-medium tracking-wide uppercase">
                  Begin Your Journey
                </span>
              </button>
            </SignedIn>
            {isEntering && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-[#2C4A3B] rounded-full z-10 animate-ripple pointer-events-none" />
            )}
          </div>

          <p className={`text-sm ${theme.textMuted} opacity-60`}>
            Free to start • Private & secure
          </p>
        </div>

        {/* Scroll indicator */}
        <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce ${theme.textMuted} opacity-50`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </section>

      {/* How It Works Section */}
      <section className={`px-6 py-24 ${isDarkMode ? 'bg-[#0a120d]/50' : 'bg-[#F5FAF7]/50'}`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className={`text-sm font-medium tracking-widest uppercase mb-4 ${isDarkMode ? 'text-[#6B9B7A]' : 'text-[#4A7C5A]'}`}>
              How It Works
            </p>
            <h2 className={`text-3xl md:text-4xl font-semibold font-[family-name:var(--font-playfair)] ${theme.textMain}`}>
              A Companion That Grows With You
            </h2>
            <p className={`mt-4 text-lg max-w-2xl mx-auto ${theme.textMuted}`}>
              Unlike traditional apps, Healith learns from every conversation, building a deep understanding of who you are.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`p-8 rounded-2xl transition-all duration-300 hover:scale-[1.02] ${isDarkMode ? 'bg-[#0f1a14] border border-[#1F3326]/50' : 'bg-white border border-[#D8E6DB]'} shadow-lg`}
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl mb-5 ${isDarkMode ? 'bg-[#1F3326] text-[#9ECDB8]' : 'bg-[#E6F5E9] text-[#2C4A3B]'}`}>
                  {feature.icon}
                </div>
                <h3 className={`text-xl font-semibold mb-3 ${theme.textMain}`}>
                  {feature.title}
                </h3>
                <p className={`leading-relaxed ${theme.textMuted}`}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className={`text-sm font-medium tracking-widest uppercase mb-4 ${isDarkMode ? 'text-[#6B9B7A]' : 'text-[#4A7C5A]'}`}>
                Why Healith
              </p>
              <h2 className={`text-3xl md:text-4xl font-semibold font-[family-name:var(--font-playfair)] mb-6 ${theme.textMain}`}>
                Transform Your Inner Life
              </h2>
              <p className={`text-lg mb-8 ${theme.textMuted}`}>
                Whether you're navigating career challenges, building better relationships, or simply trying to understand yourself better—Healith provides the consistent, intelligent support you need.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${isDarkMode ? 'bg-[#1F3326] text-[#9ECDB8]' : 'bg-[#E6F5E9] text-[#2C4A3B]'}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span className={`${theme.textMuted}`}>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className={`p-8 rounded-2xl ${isDarkMode ? 'bg-[#0f1a14] border border-[#1F3326]/50' : 'bg-[#F5FAF7] border border-[#D8E6DB]'}`}>
              <div className={`text-sm font-medium mb-4 ${isDarkMode ? 'text-[#6B9B7A]' : 'text-[#4A7C5A]'}`}>
                How a session feels
              </div>
              <div className="space-y-4">
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-[#1a2920]' : 'bg-white'}`}>
                  <p className={`text-sm ${theme.textMuted} italic`}>"I've been feeling overwhelmed at work lately..."</p>
                </div>
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-[#13241C]' : 'bg-[#E6F5E9]'}`}>
                  <p className={`text-sm ${theme.textMuted}`}>I hear you. That sounds really challenging. You mentioned similar feelings last week around your project deadline. Would you like to explore what might be triggering this pattern, or would a brief grounding exercise help right now?</p>
                </div>
              </div>
              <p className={`text-xs mt-4 ${theme.textMuted} opacity-60`}>
                Healith connects the dots between sessions, offering support that's actually relevant to your life.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`px-6 py-24 ${isDarkMode ? 'bg-[#0a120d]/50' : 'bg-[#F5FAF7]/50'}`}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className={`text-3xl md:text-4xl font-semibold font-[family-name:var(--font-playfair)] mb-6 ${theme.textMain}`}>
            Ready to Start Your Journey?
          </h2>
          <p className={`text-lg mb-10 ${theme.textMuted}`}>
            Take the first step toward understanding yourself better. Your story deserves to be heard—and remembered.
          </p>
          <SignedOut>
            <SignInButton mode="modal">
              <button
                disabled={isEntering}
                className={`relative z-20 group inline-flex items-center justify-center overflow-hidden rounded-full px-12 py-5 transition-all duration-500 hover:scale-105 active:scale-95 shadow-xl disabled:cursor-not-allowed ${theme.button}`}
              >
                <span className="relative text-base font-medium tracking-wide uppercase hover:cursor-pointer">
                  Enter Your Space
                </span>
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <button
              onClick={onEnter}
              disabled={isEntering}
              className={`relative z-20 group inline-flex items-center justify-center overflow-hidden rounded-full px-12 py-5 transition-all duration-500 hover:scale-105 active:scale-95 shadow-xl disabled:cursor-not-allowed ${theme.button} hover:cursor-pointer`}
            >
              <span className="relative text-base font-medium tracking-wide uppercase">
                Enter Your Space
              </span>
            </button>
          </SignedIn>
        </div>
      </section>

      {/* Footer */}
      <footer className={`px-6 py-12 border-t ${isDarkMode ? 'border-[#1F3326]/50 bg-[#050a07]' : 'border-[#D8E6DB] bg-[#FDFCF8]'}`}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-left">
              <h3 className={`text-2xl font-semibold font-[family-name:var(--font-playfair)] ${theme.textMain}`}>
                Healith
              </h3>
              <p className={`text-sm mt-2 ${theme.textMuted}`}>
                A quiet space for growth and self-discovery.
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-8">
              <a href="/privacy" className={`text-sm ${theme.textMuted} hover:${theme.textMain} transition-colors`}>Privacy Policy</a>
              <a href="/terms" className={`text-sm ${theme.textMuted} hover:${theme.textMain} transition-colors`}>Terms of Service</a>
              <a href="mailto:utkarshjha.4009@gmail.com" className={`text-sm ${theme.textMuted} hover:${theme.textMain} transition-colors`}>Contact</a>
            </div>
          </div>
          
          <div className={`mt-10 pt-8 border-t ${isDarkMode ? 'border-[#1F3326]/30' : 'border-[#D8E6DB]'} flex flex-col md:flex-row justify-between items-center gap-4`}>
            <p className={`text-sm ${theme.textMuted} opacity-60`}>
              © {new Date().getFullYear()} Healith. All rights reserved.
            </p>
            <p className={`text-sm ${theme.textMuted} opacity-60`}>
              Built with care for your wellbeing.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
