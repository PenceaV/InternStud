import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const firebaseAuthErrors: { [key: string]: string } = {
    'auth/invalid-email': 'Adresa de email este invalidă.',
    'auth/user-disabled': 'Contul utilizatorului a fost dezactivat.',
    'auth/user-not-found': 'Nu există utilizator cu această adresă de email.',
    'auth/wrong-password': 'Parolă incorectă.',
    'auth/invalid-credential': 'Email sau parolă incorectă.',
    'auth/configuration-not-found': 'Configurarea autentificării Firebase nu a fost găsită.',
    'auth/network-request-failed': 'Cererea de rețea a eșuat. Verifică-ți conexiunea.',
    'auth/internal-error': 'A apărut o eroare internă a serverului de autentificare.',
    // Adaugă aici alte coduri de eroare comune Firebase Authentication
  };

  const translateFirebaseAuthError = (errorCode: string): string => {
    return firebaseAuthErrors[errorCode] || `A apărut o eroare Firebase: ${errorCode}.`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      // Autentificare reușită, redirecționează către pagina de creare profil (sau dashboard dacă profilul există)
      navigate('/create-profile'); // Aici poți adăuga logica pentru a verifica dacă profilul există și redirecționa corespunzător
    } catch (err: any) {
      // Gestionarea erorilor Firebase Auth
      console.error("Firebase Auth Error:", err.message);
      setError(translateFirebaseAuthError(err.code) || 'A apărut o eroare la autentificare');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0056a0] to-[#1B263B]">
      <Navbar />
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white py-8 px-6 shadow-lg rounded-lg"
          >
            <h2 className="text-2xl font-bold text-[#1B263B] mb-6">Autentificare</h2>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-center">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#1B263B]">Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-black placeholder-gray-400 bg-white"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#1B263B]">Parolă <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-black placeholder-gray-400 bg-white"
                />
              </div>
              <div className="flex justify-end pt-4">
              <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: '#003f7a', boxShadow: '0px 0px 15px rgba(0,0,0,0.3)' }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    className="w-auto h-auto px-3 py-2 bg-[#0056a0] text-white rounded-full transition duration-300 font-bold shadow-lg"
                    disabled={loading}
                  >
                    {loading ? 'Se procesează...' : 'Autentificare'}
              </motion.button>
              </div>
            </form>
            <p className="mt-6 text-center text-sm text-gray-600">
              Nu ai cont?{' '}
              <Link to="/register" className="font-medium text-[#0056a0] hover:text-[#003f7a]">
                Înregistrează-te
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login; 