import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { FaArrowLeft, FaUserGraduate, FaBuilding } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Register: React.FC = () => {
  const [userType, setUserType] = useState<'student' | 'company' | null>(null);
  const [formData, setFormData] = useState({
    // Student fields
    firstName: '',
    lastName: '',
    institutionalEmail: '',
    password: '',
    confirmPassword: '',
    faculty: '',
    // Company fields
    companyName: '',
    email: '',
    website: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission logic
    console.log('Form submitted:', formData);
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
                  className="w-full py-4 px-6 bg-[#1B1B1B] text-white rounded-lg font-semibold text-lg hover:bg-[#222] transition-colors shadow-md flex items-center justify-center gap-3"
                >
                  <FaUserGraduate className="text-2xl" />
                  Student
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setUserType('company')}
                  className="w-full py-4 px-6 bg-[#1B1B1B] text-white rounded-lg font-semibold text-lg hover:bg-[#222] transition-colors shadow-md flex items-center justify-center gap-3"
                >
                  <FaBuilding className="text-2xl" />
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
              <form onSubmit={handleSubmit} className="space-y-4">
                {userType === 'student' ? (
                  // Student Form
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-[#1B263B]">Prenume <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          name="firstName"
                          id="firstName"
                          required
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-black placeholder-gray-400"
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-[#1B263B]">Nume <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          name="lastName"
                          id="lastName"
                          required
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-black placeholder-gray-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="institutionalEmail" className="block text-sm font-medium text-[#1B263B]">Email Instituțional <span className="text-red-500">*</span></label>
                      <input
                        type="email"
                        name="institutionalEmail"
                        id="institutionalEmail"
                        required
                        value={formData.institutionalEmail}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-black placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label htmlFor="faculty" className="block text-sm font-medium text-[#1B263B]">Facultate <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="faculty"
                        id="faculty"
                        required
                        value={formData.faculty}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-black placeholder-gray-400"
                      />
                    </div>
                  </>
                ) : (
                  // Company Form
                  <>
                    <div>
                      <label htmlFor="companyName" className="block text-sm font-medium text-[#1B263B]">Nume Companie <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="companyName"
                        id="companyName"
                        required
                        value={formData.companyName}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-black placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-[#1B263B]">Email <span className="text-red-500">*</span></label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-black placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label htmlFor="website" className="block text-sm font-medium text-[#1B263B]">Website</label>
                      <input
                        type="url"
                        name="website"
                        id="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-black placeholder-gray-400"
                      />
                    </div>
                  </>
                )}
                
                {/* Common fields for both forms */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-[#1B263B]">Parolă <span className="text-red-500">*</span></label>
                    <input
                      type="password"
                      name="password"
                      id="password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-black placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#1B263B]">Verificare Parolă <span className="text-red-500">*</span></label>
                    <input
                      type="password"
                      name="confirmPassword"
                      id="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-black placeholder-gray-400"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => setUserType(null)}
                    className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#1B263B] text-white font-semibold shadow-md hover:bg-[#0056a0] transition-colors"
                  >
                    <FaArrowLeft className="text-lg !scale-100" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="bg-[#F2542D] text-white px-6 py-2 rounded-md font-medium hover:bg-[#ff7043] transition-colors shadow-md"
                  >
                    Înregistrare
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