import { useState, useEffect } from 'react';
import { User, LogOut, Menu, X } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';
import { isAuthenticated, clearAuth } from '../utils/auth';

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const syncAuthState = () => setIsLoggedIn(isAuthenticated());
    syncAuthState();
    window.addEventListener('auth-change', syncAuthState);
    return () => window.removeEventListener('auth-change', syncAuthState);
  }, [location]);

  const handleLogout = () => {
    clearAuth();
    setIsLoggedIn(false);
    setIsOpen(false);
    navigate('/login');
  };

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-gray-900/95 backdrop-blur-sm shadow-lg py-1.5' 
          : 'bg-gray-900 py-3 shadow-md shadow-black/20'
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <img src={logo} alt="BrainVerse Logo" width="48" height="48" className='rounded-full'/>
          <span className="text-xl font-semibold text-white">
            Br<span className="text-blue-400">ai</span>n<span className="text-blue-400">Verse</span>
          </span>
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          {isLoggedIn && (
            <Link to="/dashboard" className="text-gray-300 hover:text-blue-400 font-medium">Dashboard</Link>
          )}
          
          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                {/* Profile Page Button */}
                <Link 
                  to="/profile" 
                  className="text-gray-300 hover:text-blue-400 font-medium px-4 py-2 flex items-center"
                >
                  <User className="h-4 w-4 mr-2" /> Profile
                </Link>
                
                {/* Logout Button */}
                <button 
                  onClick={handleLogout} 
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-2" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-300 hover:text-blue-400 font-medium px-4 py-2">Log In</Link>
                <Link to="/signup" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium">Get Started</Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden p-2 rounded-md hover:bg-gray-800" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-6 w-6 text-gray-300" /> : <Menu className="h-6 w-6 text-gray-300" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-gray-800 p-4">
          {isLoggedIn ? (
            <>
              <Link to="/dashboard" className="block py-2 text-gray-300 hover:text-blue-400">Dashboard</Link>
              <Link to="/profile" className="block py-2 text-gray-300 hover:text-blue-400 flex items-center">
                <User className="h-4 w-4 mr-2" /> Profile Page
              </Link>
              <button onClick={handleLogout} className="block w-full text-left py-2 text-red-400 hover:text-red-300 flex items-center">
                <LogOut className="h-4 w-4 mr-2" /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="block py-2 text-gray-300 hover:text-blue-400" onClick={() => setIsOpen(false)}>Log In</Link>
              <Link to="/signup" className="block py-2 text-gray-300 hover:text-blue-400" onClick={() => setIsOpen(false)}>Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;