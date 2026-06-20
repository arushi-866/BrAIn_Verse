import React, { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const [animatedItems, setAnimatedItems] = useState(false);
  
  useEffect(() => {
    setAnimatedItems(true);
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1 }
    );
    
    document.querySelectorAll('.scroll-animate').forEach(item => {
      observer.observe(item);
    });
    
    return () => observer.disconnect();
  }, []);

  return (
    <footer className="relative bg-gradient-to-b from-blue-950 to-slate-900 text-white py-10 overflow-hidden border-t border-blue-900/40">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-full h-full">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i}
              className="absolute rounded-full bg-blue-400/10"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 30 + 10}px`,
                height: `${Math.random() * 30 + 10}px`,
                filter: 'blur(8px)',
                opacity: Math.random() * 0.4,
                transform: 'translate(-50%, -50%)',
                animation: `pulse ${Math.random() * 8 + 4}s infinite alternate ${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Main content */}
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          {/* Brand & About */}
          <div className={`max-w-md transform transition duration-1000 ${animatedItems ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">BrainVerse</h2>
            <p className="mt-2 text-blue-200/80 leading-relaxed text-sm">
              AI-powered study assistant that revolutionizes learning through neural mapping and personalized study paths.
            </p>
          </div>
          
          {/* Quick Links */}
          <div className={`transform transition duration-1000 delay-200 ${animatedItems ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-cyan-400 mb-3">
              Navigation
            </h3>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <li className="group">
                <Link 
                  to="/" 
                  className="flex items-center text-blue-200 hover:text-cyan-300 transition-all duration-300"
                >
                  Home
                </Link>
              </li>
              <li className="group">
                <Link 
                  to="/about" 
                  className="flex items-center text-blue-200 hover:text-cyan-300 transition-all duration-300"
                >
                  About
                </Link>
              </li>
              <li className="group">
                <Link 
                  to="/PrivacyPolicy" 
                  className="flex items-center text-blue-200 hover:text-cyan-300 transition-all duration-300"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-600/20 to-transparent my-6" />
        
        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center text-blue-300/60 text-xs gap-4">
          <div className="scroll-animate opacity-0 transform translate-y-4 transition duration-700 delay-100">
            © {new Date().getFullYear()} BrainVerse. All rights reserved.
          </div>
          <div className="flex space-x-6 scroll-animate opacity-0 transform translate-y-4 transition duration-700 delay-300">
            <Link to="/terms" className="hover:text-cyan-300 transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-cyan-300 transition-colors">Privacy Policy</Link>
            <Link to="/cookies" className="hover:text-cyan-300 transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
      
      {/* Custom keyframes for animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.1; transform: scale(1) translate(-50%, -50%); }
          50% { opacity: 0.4; transform: scale(1.2) translate(-50%, -50%); }
        }
        
        .animate-in {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `}</style>
    </footer>
  );
};

export default Footer;