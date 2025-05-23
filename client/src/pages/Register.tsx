import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { FaArrowLeft, FaUserGraduate, FaBuilding } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

const Register: React.FC = () => {
  const [userType, setUserType] = useState<'student' | 'company' | null>(null);
  const [formData, setFormData] = useState({
    // Student fields
    firstName: '',
    lastName: '',
    institutionalEmail: '',
    password: '',
    confirmPassword: '',
    // Company fields
    email: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const firebaseAuthErrors: { [key: string]: string } = {
    'auth/email-already-in-use': 'Adresa de email este deja utilizată.',
    'auth/invalid-email': 'Adresa de email este invalidă.',
    'auth/operation-not-allowed': 'Operația nu este permisă.',
    'auth/weak-password': 'Parola este prea slabă.',
    'auth/configuration-not-found': 'Configurarea autentificării Firebase nu a fost găsită.',
    'auth/network-request-failed': 'Cererea de rețea a eșuat. Verifică-ți conexiunea.',
    'auth/internal-error': 'A apărut o eroare internă a serverului de autentificare.',
    // Adaugă aici alte coduri de eroare comune Firebase Authentication
  };

  const translateFirebaseAuthError = (errorCode: string): string => {
    return firebaseAuthErrors[errorCode] || `A apărut o eroare Firebase: ${errorCode}.`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

    if (formData.password !== formData.confirmPassword) {
      setError('Parolele nu coincid!');
      setLoading(false);
      return;
    }

    try {
      // Creare utilizator in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userType === 'student' ? formData.institutionalEmail : formData.email,
        formData.password
      );
      const user = userCredential.user;

      // Salvare detalii suplimentare in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userData: any = {
        userType: userType,
        email: user.email,
        profileCompleted: false,
        status: 'pending', // Set status to pending immediately for all new users
      };

      if (userType === 'student') {
        userData.firstName = formData.firstName;
        userData.lastName = formData.lastName;
        userData.institutionalEmail = formData.institutionalEmail;
      } else {
        // Removed companyName and website from userData
        // userData.companyName = formData.companyName;
        // userData.website = formData.website;
      }

      await setDoc(userDocRef, userData);

      // Redirectionare dupa inregistrare catre pagina de creare profil
      navigate('/create-profile');

    } catch (err: any) {
      // Gestionarea erorilor Firebase Auth si Firestore
      console.error("Firebase Error:", err.message);
      setError(translateFirebaseAuthError(err.code) || 'A apărut o eroare la înregistrare');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0056a0] to-[#1B263B]">
      <Navbar />
      
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          {!userType ? (
            // User Type Selection
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center bg-white py-8 px-6 shadow-lg rounded-lg"
            >
              <h2 className="text-3xl font-bold text-[#1B263B] mb-8">Alege tipul de cont</h2>
              <div className="space-y-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setUserType('student')}
                  className="w-full py-4 px-6 bg-[#1B263B] text-white rounded-lg font-semibold text-lg hover:bg-[#1B263B] transition-colors shadow-md flex items-center justify-center gap-3"
                >
                  <FaUserGraduate size={24} />
                  Student
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setUserType('company')}
                  className="w-full py-4 px-6 bg-[#1B263B] text-white rounded-lg font-semibold text-lg hover:bg-[#1B263B] transition-colors shadow-md flex items-center justify-center gap-3"
                >
                  <FaBuilding size={24} />
                  Companie
                </motion.button>
              </div>
            </motion.div>
          ) : (
            // Registration Form
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white py-8 px-6 shadow-lg rounded-lg"
            >
              <h2 className="text-2xl font-bold text-[#1B263B] mb-6">
                {userType === 'student' ? 'Înregistrare Student' : 'Înregistrare Companie'}
              </h2>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-center">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                {userType === 'student' ? (
                  // Student Form
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-[#1B263B]">Prenume</label>
                        <input
                          type="text"
                          name="firstName"
                          id="firstName"
                          required
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-black placeholder-gray-400 bg-white"
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-[#1B263B]">Nume</label>
                        <input
                          type="text"
                          name="lastName"
                          id="lastName"
                          required
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-black placeholder-gray-400 bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="institutionalEmail" className="block text-sm font-medium text-[#1B263B]">Email Instituțional</label>
                      <input
                        type="email"
                        name="institutionalEmail"
                        id="institutionalEmail"
                        required
                        value={formData.institutionalEmail}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-black placeholder-gray-400 bg-white"
                      />
                    </div>
                  </>
                ) : (
                  // Company Form
                  <>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-[#1B263B]">Email</label>
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
                  </>
                )}
                
                {/* Common fields for both forms */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-[#1B263B]">Parolă</label>
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
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#1B263B]">Confirmă Parola</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      id="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-black placeholder-gray-400 bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: '#003f7a', boxShadow: '0px 0px 15px rgba(0,0,0,0.3)' }}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => setUserType(null)}
                    className="w-auto h-auto px-3 py-2 bg-[#0056a0] text-white rounded-full transition duration-300 font-bold text-xl shadow-lg flex items-center justify-center gap-2"
                  >
                    <FaArrowLeft size={20} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: '#003f7a', boxShadow: '0px 0px 15px rgba(0,0,0,0.3)' }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    className="w-auto h-auto px-3 py-2 bg-[#0056a0] text-white rounded-full transition duration-300 font-bold shadow-lg"
                    disabled={loading}
                  >
                    {loading ? 'Se procesează...' : 'Înregistrare'}
                  </motion.button>
                </div>
              </form>
              <p className="mt-6 text-center text-sm text-gray-600">
                Ai deja cont?{' '}
                <Link to="/login" className="font-medium text-[#0056a0] hover:text-[#003f7a]">
                  Autentifică-te
                </Link>
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register; 