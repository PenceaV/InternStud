import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { auth, db } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { FaBuilding, FaCamera, FaLink } from 'react-icons/fa'; // Add Building and Camera back

interface CompanyProfileFormProps {
  userType: 'student' | 'company';
  onProfileUpdated?: () => void;
}

const CompanyProfileForm: React.FC<CompanyProfileFormProps> = ({ userType, onProfileUpdated }) => {
  // State for LinkedIn-like fields
  const [companyName, setCompanyName] = useState('');
  // Removed linkedinUrl state
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [companyType, setCompanyType] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [verification, setVerification] = useState(false);
  
  const [logo, setLogo] = useState<File | null>(null); // Add logo state back
  const [logoUrl, setLogoUrl] = useState<string | null>(null); // Add logoUrl state back

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const user = auth.currentUser;

  // TODO: Ar trebui preîncărcate datele dacă utilizatorul revine pe această pagină
  // Fetch user data on component mount to pre-fill form if data exists
  // useEffect(() => { ... }, [user]);

  // Placeholder handleLogoUpload function (non-functional)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Logo upload triggered (placeholder)', e.target.files);
    // No actual upload logic here
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log('handleSubmit started, loading set to true'); // Log start

    if (!user) {
      setError('Utilizatorul nu este autentificat.');
      setLoading(false);
      console.log('handleSubmit: No user, loading set to false, returning.'); // Log no user
      return;
    }

     // Basic validation
     if (!companyName || !industry || !companySize || !companyType || !verification) {
         setError('Te rugăm să completezi toate câmpurile obligatorii și să bifezi caseta de verificare.');
        setLoading(false);
        console.log('handleSubmit: Validation failed, loading set to false, returning.'); // Log validation failure
        return;
      }

    const userDocRef = doc(db, 'users', user.uid);

    try {
      console.log('handleSubmit: Try block entered.'); // Log try start

      // Removed logo upload logic

      console.log('handleSubmit: Updating user document with status pending (without logo).'); // Log update start
      await updateDoc(userDocRef, {
        companyName: companyName,
        // Removed linkedinUrl
        website: website,
        industry: industry,
        companySize: companySize,
        companyType: companyType,
        tagline: tagline,
        // logoUrl: logoUrl, // Keep this line, but logoUrl state will be null
        verification: verification,
        profileCompleted: true,
        status: 'pending',
        description: description,
      });
      console.log('handleSubmit: User document updated.'); // Log update finish

      if (onProfileUpdated) {
        onProfileUpdated();
      } else {
        navigate('/dashboard');
      }

    } catch (err: any) {
      console.error("handleSubmit: Catch block entered, error:", err);
      console.error("Eroare la salvarea profilului companiei:", err);
      setError('A apărut o eroare la salvarea profilului: ' + err.message);
    } finally {
      console.log('handleSubmit: Finally block entered, setting loading to false.'); // Log finally
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0056a0] to-[#1B263B] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full mx-auto bg-white py-8 px-6 shadow-lg rounded-lg space-y-6">

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Page Identity Section (with Logo and Name) */}
              <div className="space-y-4 pb-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-[#1B263B]">Informații Pagină și Profil</h3>

                 {/* Company Logo and Name */}
                 <div className="flex flex-row items-center space-x-6">
                   {/* Logo Upload */}
                   <div>
                     <label className="block text-sm font-medium text-[#1B263B]">Logo</label>
                     <div className="mt-1 flex items-center space-x-4">
                       <div className="relative flex-shrink-0 w-24 h-24 rounded-full overflow-hidden border-2 border-[#0056a0] bg-gray-100 flex items-center justify-center">
                         {logoUrl ? (
                           <img src={logoUrl} alt="Company Logo" className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-gray-500 text-4xl">
                             <FaBuilding size={40} />
                           </div>
                         )}
                         {/* Upload Button with Hover Effect */}
                         <label className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-xl cursor-default opacity-0 hover:opacity-100 transition-opacity">
                            <FaCamera size={30} />
                         </label>
                         {/* Hidden file input (non-functional) */}
                         <input
                           id="company-logo-upload"
                           type="file"
                           accept="image/*"
                           disabled
                           className="sr-only" // Tailwind class to visually hide the input
                           onChange={handleLogoUpload} // Placeholder handler
                         />
                       </div>
                     </div>
                   </div>

                   {/* Name */}
                   <div className="flex-grow">
                     <label htmlFor="companyName" className="block text-sm font-medium text-[#1B263B]">Nume <span className="text-red-500">*</span></label>
                     <input
                       id="companyName"
                       name="companyName"
                       type="text"
                       required
                       className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-gray-800 placeholder-gray-400 bg-white"
                       value={companyName}
                       onChange={(e) => setCompanyName(e.target.value)}
                       placeholder="Numele companiei tale"
                     />
                   </div>
                 </div>
              </div>

              {/* Company Details Section */}
              <div className="space-y-4 pb-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-[#1B263B]">Detalii Companie</h3>
                {/* Industry */}
                <div>
                  <label htmlFor="industry" className="block text-sm font-medium text-[#1B263B]">Industrie <span className="text-red-500">*</span></label>
                  <select
                    id="industry"
                    name="industry"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-gray-800 bg-white"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  >
                    <option value="">Selectează industrie</option>
                    <option value="Technology">Tehnologie</option>
                    <option value="Finance">Finanțe</option>
                    <option value="Healthcare">Sănătate</option>
                    <option value="Education">Educație</option>
                  </select>
                </div>
                {/* Company Size */}
                <div>
                  <label htmlFor="companySize" className="block text-sm font-medium text-[#1B263B]">Dimensiune companie <span className="text-red-500">*</span></label>
                  <select
                    id="companySize"
                    name="companySize"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-gray-800 bg-white"
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                  >
                    <option value="">Selectează dimensiune</option>
                    <option value="1-10">1-10 angajați</option>
                    <option value="11-50">11-50 angajați</option>
                    {/* ... more options */}
                  </select>
                </div>
                {/* Company Type */}
                <div>
                  <label htmlFor="companyType" className="block text-sm font-medium text-[#1B263B]">Tip companie <span className="text-red-500">*</span></label>
                  <select
                    id="companyType"
                    name="companyType"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-gray-800 bg-white"
                    value={companyType}
                    onChange={(e) => setCompanyType(e.target.value)}
                  >
                    <option value="">Selectează tip</option>
                    <option value="PublicCompany">Companie Publică</option>
                    <option value="Self-Employed">Liber Profesionist</option>
                    {/* ... more options */}
                  </select>
                </div>
              </div>

            </div>

            {/* Right Column */}
            <div className="space-y-6">
               {/* Website and Tagline */}
               <div className="space-y-4 pb-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-[#1B263B]">Linkuri și Slogan</h3>
                   {/* Website */}
                   <div>
                     <label htmlFor="website" className="block text-sm font-medium text-[#1B263B]">Website</label>
                     <div className="mt-1 flex items-center space-x-2">
                       <span className="text-gray-500"><FaLink size={20} /></span>
                       <input
                         id="website"
                         name="website"
                         type="text"
                         className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-gray-800 placeholder-gray-400 bg-white"
                         value={website}
                         onChange={(e) => setWebsite(e.target.value)}
                         placeholder="https://siteul-companiei.com"
                       />
                     </div>
                   </div>
                    {/* Tagline */}
                   <div>
                     <label htmlFor="tagline" className="block text-sm font-medium text-[#1B263B]">Slogan</label>
                     <input
                       id="tagline"
                       name="tagline"
                       type="text"
                       className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-gray-800 placeholder-gray-400 bg-white"
                       value={tagline}
                       onChange={(e) => setTagline(e.target.value)}
                       placeholder="Exemplu: Firma de contabilitate familială care vă garantează liniștea în privința taxelor."
                     />
                   </div>
                   {/* Description */}
                   <div>
                     <label htmlFor="description" className="block text-sm font-medium text-[#1B263B]">Descriere Companie</label>
                     <textarea
                       id="description"
                       name="description"
                       rows={4} // Adjust rows as needed
                       className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-gray-800 placeholder-gray-400 bg-white"
                       value={description}
                       onChange={(e) => setDescription(e.target.value)}
                       placeholder="O scurtă descriere a companiei tale..."
                     ></textarea>
                   </div>
               </div>

               {/* Verification Checkbox */}
               <div className="border border-gray-300 rounded-md p-4 space-y-2">
                 <div className="flex items-start">
                   <input
                     id="verification"
                     name="verification"
                     type="checkbox"
                     required
                     className="mt-1 h-4 w-4 text-[#0056a0] border-gray-300 rounded focus:ring-[#0056a0]"
                     checked={verification}
                     onChange={(e) => setVerification(e.target.checked)}
                   />
                   <div className="ml-2 text-sm text-gray-600">
                     <label htmlFor="verification" className="font-medium text-[#1B263B]">Confirm că sunt un reprezentant autorizat al acestei organizații și am dreptul să acționez în numele ei pentru crearea și administrarea acestei pagini.</label>
                     <p>Organizația și cu mine suntem de acord cu <a href="#" className="text-[#0056a0] hover:underline">termenii</a> adiționali pentru Pagini.</p>
                   </div>
                 </div>
               </div>

            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="bg-[#0056a0] text-white px-8 py-3 rounded-md font-semibold hover:bg-[#003f7a] transition-colors shadow-md"
              disabled={loading}
            >
              {loading ? 'Se salvează...' : 'Creează Pagină'}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyProfileForm;