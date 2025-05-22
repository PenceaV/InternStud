import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement login logic
    console.log('Login submitted:', formData);
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
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-black placeholder-gray-400"
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
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-black placeholder-gray-400"
                />
              </div>
              <div className="flex justify-end pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="bg-[#F2542D] text-white px-6 py-2 rounded-md font-medium hover:bg-[#ff7043] transition-colors shadow-md"
                >
                  Autentificare
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