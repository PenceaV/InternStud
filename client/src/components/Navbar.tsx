import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';

const logo = './logo-cropped.svg';

const Navbar: React.FC = () => {
  const location = useLocation();
  const isHomepage = location.pathname === '/';
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Redirecționează către pagina principală sau de login după deconectare
      navigate('/'); 
    } catch (error) {
      console.error("Eroare la deconectare:", error);
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white shadow-md px-6 md:px-12 py-4 flex justify-between items-center">
      <div className="flex items-center space-x-3">
        <Link to="/" className="hover:opacity-80 transition-opacity duration-300">
          <img src={logo} alt="InternStud Logo" className="h-12 w-auto" />
        </Link>
      </div>

      {/* Homepage Navigation */}
      {isHomepage && (
        <nav className="hidden md:flex items-center space-x-8">
          <Link 
            to="#features"
            onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}
            className="text-[#1B263B]  transition-colors duration-300 relative group"
          >
            Funcționalități
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#F2542D] transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <div className="h-6 w-px bg-gray-300"></div>
          <Link 
            to="#about"
            onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}
            className="text-[#1B263B]  transition-colors duration-300 relative group"
          >
            Despre
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#F2542D] transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <div className="h-6 w-px bg-gray-300"></div>
          <Link 
            to="#contact"
            onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}
            className="text-[#1B263B]  transition-colors duration-300 relative group"
          >
            Contact
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#F2542D] transition-all duration-300 group-hover:w-full"></span>
          </Link>
        </nav>
      )}

      {/* Desktop Buttons */}
      <div className="space-x-4 flex">
        {user ? (
          // Utilizatorul este logat: afișează butonul Deconectare
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0px 0px 12px rgba(0,0,0,0.2)" }} // Ajustează boxShadow dacă este necesar
            whileTap={{ scale: 0.97 }}
            onClick={handleLogout}
            className="px-5 py-2 rounded-lg bg-[#1B263B] text-white font-semibold transition duration-300 hover:bg-[#222]"
          >
            Deconectare
          </motion.button>
        ) : (
          // Utilizatorul nu este logat: afișează butoanele Autentificare și Înregistrare
          <>
            <Link to="/login">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0px 0px 12px #0056a0" }}
                whileTap={{ scale: 0.97 }}
                className="px-5 py-2 rounded-lg bg-[#1B263B] text-white font-semibold transition duration-300"
              >
                Autentificare
              </motion.button>
            </Link>

            <Link to="/register">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0px 0px 12px #ff7043" }}
                whileTap={{ scale: 0.97 }}
                className="px-5 py-2 rounded-lg bg-[#1B263B] text-white font-semibold transition duration-300">
                Înregistrare
              </motion.button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar; 