import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { auth, db, storage } from '../firebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import { FaCamera, FaUpload, FaUserGraduate, FaLinkedin, FaGithub, FaLink, FaBriefcase, FaGraduationCap, FaTools } from 'react-icons/fa'; // Importăm iconițe

interface StudentProfileFormProps {
  userType?: 'student'; // Define userType prop as optional, since it might not always be 'student'
}

interface ExperienceEntry {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  isPresent: boolean;
}

interface EducationEntry {
  university: string;
  specialization: string;
  startDate: string;
  endDate: string;
}

const StudentProfileForm: React.FC<StudentProfileFormProps> = ({ userType }) => {
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const user = auth.currentUser;

  // State for name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // New state for additional student fields
  const [education, setEducation] = useState<EducationEntry[]>([{ 
    university: '', 
    specialization: '', 
    startDate: '', 
    endDate: ''
  }]);
  const [experience, setExperience] = useState<ExperienceEntry[]>([{ title: '', company: '', startDate: '', endDate: '', isPresent: false }]); // Updated state for experience to include dates and isPresent
  const [skills, setSkills] = useState<string[]>(['']); // Array of strings for skills
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [website, setWebsite] = useState('');

  // Fetch user data on component mount to pre-fill form if data exists
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setBio(data.bio || '');
          setProfileImageUrl(data.profileImageUrl || null);
          setCvFile(null); // We don't fetch the actual file, just the URL
          setEducation(data.education || [{ university: '', specialization: '', startDate: '', endDate: '' }]);
          setExperience(data.experience || [{ title: '', company: '', startDate: '', endDate: '', isPresent: false }]);
          setSkills(data.skills || ['']);
          setLinkedin(data.linkedin || '');
          setGithub(data.github || '');
          setWebsite(data.website || '');
          // Set initial first and last name from fetched data
          setFirstName(data.firstName || '');
          setLastName(data.lastName || '');
        }
      }
    };

    fetchUserData();
  }, [user]); // Dependency array includes user so it runs when user state changes

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImageUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCvFile(e.target.files[0]);
    }
  };

  // Update education handlers
  const handleAddEducation = () => setEducation([...education, { 
    university: '', 
    specialization: '', 
    startDate: '', 
    endDate: ''
  }]);
  
  const handleEducationChange = (index: number, field: keyof EducationEntry, value: string) => {
    const newEducation = [...education];
    newEducation[index][field] = value;
    setEducation(newEducation);
  };

  const handleRemoveEducation = (index: number) => {
    const newEducation = education.filter((_, i) => i !== index);
    setEducation(newEducation);
  };

  // Handlers for experience with dates and isPresent
  const handleAddExperience = () => setExperience([...experience, { title: '', company: '', startDate: '', endDate: '', isPresent: false }]);
  const handleExperienceChange = (index: number, field: keyof ExperienceEntry, value: string | boolean) => {
    const newExperience = [...experience];
    (newExperience[index][field] as any) = value; // Use any for boolean assignment
    setExperience(newExperience);
  };
   const handleRemoveExperience = (index: number) => {
    const newExperience = experience.filter((_, i) => i !== index);
    setExperience(newExperience);
  };

  const handleAddSkill = () => setSkills([...skills, '']);
  const handleSkillChange = (index: number, value: string) => {
    const newSkills = [...skills];
    newSkills[index] = value;
    setSkills(newSkills);
  };
   const handleRemoveSkill = (index: number) => {
    const newSkills = skills.filter((_, i) => i !== index);
    setSkills(newSkills);
  };

  const handleSaveName = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        firstName: firstName,
        lastName: lastName,
      });
      setIsEditingName(false);
    } catch (err: any) {
      console.error("Error updating name:", err);
      setError('A apărut o eroare la salvarea numelui: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNameEditClick = () => {
    setIsEditingName(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!user) {
      setError('Utilizatorul nu este autentificat.');
      setLoading(false);
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    let uploadedProfileImageUrl = profileImageUrl;
    let uploadedCvUrl = '';

    try {
      if (profileImage) {
        const imageRef = ref(storage, `profile_images/${user.uid}/${profileImage.name}`);
        await uploadBytes(imageRef, profileImage);
        uploadedProfileImageUrl = await getDownloadURL(imageRef);
      }

      if (cvFile) {
        const cvRef = ref(storage, `cvs/${user.uid}/${cvFile.name}`);
        await uploadBytes(cvRef, cvFile);
        uploadedCvUrl = await getDownloadURL(cvRef);
      }

      await updateDoc(userDocRef, {
        bio: bio,
        profileImageUrl: uploadedProfileImageUrl,
        cvUrl: uploadedCvUrl,
        education: education.filter(edu => edu.university.trim() !== '' || edu.specialization.trim() !== ''), // Save non-empty entries
        experience: experience.filter(exp => exp.title.trim() !== '' || exp.company.trim() !== ''), // Filter out empty experience entries
        skills: skills.filter(skill => skill.trim() !== ''), // Save non-empty entries
        linkedin: linkedin,
        github: github,
        website: website,
        profileCompleted: true,
      });

      navigate('/dashboard');

    } catch (err: any) {
      console.error("Eroare la salvarea profilului studentului:", err);
      setError('A apărut o eroare la salvarea profilului: ' + err.message);
    } finally {
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
          {/* Profile Photo and Summary Section */}
          <div className="space-y-4 pb-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-[#1B263B]">Creează profil</h3>

            {/* Name Display and Edit */}
            <div className="flex items-center space-x-4">
              {isEditingName ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-gray-800 placeholder-gray-400 bg-white"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Prenume"
                  />
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-gray-800 placeholder-gray-400 bg-white"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Nume"
                  />
                  <button type="button" onClick={handleSaveName} className="text-sm text-[#0056a0] hover:underline">Salvează</button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <p className="text-lg font-semibold text-gray-800">{`${firstName} ${lastName}`}</p>
                  <button type="button" onClick={handleNameEditClick} className="text-sm text-[#0056a0] hover:underline">Editează</button>
                </div>
              )}
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
               {/* Profile Photo */}
              <div className="flex-shrink-0 relative w-32 h-32 rounded-full overflow-hidden border-4 border-[#0056a0] bg-gray-100 flex items-center justify-center">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="Poză de profil" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-6xl">
                     <FaUserGraduate size={60} />
                  </div>
                )}
                 {/* Upload Button */}
                <label htmlFor="profile-image-upload" className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-xl cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                   <FaCamera size={30} />
                </label>
                 <input id="profile-image-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </div>
               {/* Bio/Summary */}
              <div className="flex-grow space-y-2">
                 <label htmlFor="bio" className="block text-sm font-semibold text-[#1B263B]">Bio/Rezumat</label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-[#0056a0] focus:border-[#0056a0] text-gray-800 placeholder-gray-400 bg-white"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Spune ceva despre tine..."
                ></textarea>
                 {profileImage && <p className="text-sm text-gray-600 mt-1">Fișier poză selectat: {profileImage.name}</p>}
              </div>
            </div>
          </div>

          {/* Education Section */}
          <div className="space-y-4 pb-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-[#1B263B] flex items-center"><span className="mr-2"><FaGraduationCap /></span> Educație</h3>
            {education.map((entry, index) => (
              <div key={index} className="space-y-2 p-4 border border-gray-200 rounded-md">
                {/* University */}
                <div>
                  <label htmlFor={`education-university-${index}`} className="block text-sm font-medium text-[#1B263B]">Facultate</label>
                  <input
                    id={`education-university-${index}`}
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-gray-800 placeholder-gray-400 bg-white"
                    value={entry.university}
                    onChange={(e) => handleEducationChange(index, 'university', e.target.value)}
                    placeholder="ex: Universitatea Politehnica București"
                  />
                </div>
                {/* Specialization */}
                <div>
                  <label htmlFor={`education-specialization-${index}`} className="block text-sm font-medium text-[#1B263B]">Specializare</label>
                  <input
                    id={`education-specialization-${index}`}
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-gray-800 placeholder-gray-400 bg-white"
                    value={entry.specialization}
                    onChange={(e) => handleEducationChange(index, 'specialization', e.target.value)}
                    placeholder="ex: Calculatoare și Tehnologia Informației"
                  />
                </div>
                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={`education-startDate-${index}`} className="block text-sm font-medium text-[#1B263B]">Data Începerii</label>
                    <input
                      id={`education-startDate-${index}`}
                      type="date"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-gray-800 bg-white"
                      value={entry.startDate}
                      onChange={(e) => handleEducationChange(index, 'startDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor={`education-endDate-${index}`} className="block text-sm font-medium text-[#1B263B]">Data Terminării</label>
                    <input
                      id={`education-endDate-${index}`}
                      type="date"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-gray-800 bg-white"
                      value={entry.endDate}
                      onChange={(e) => handleEducationChange(index, 'endDate', e.target.value)}
                    />
                  </div>
                </div>

                {education.length > 1 && (
                  <button type="button" onClick={() => handleRemoveEducation(index)} className="text-red-600 hover:underline text-sm font-semibold mt-2">Elimină Educație</button>
                )}
              </div>
            ))}
            <button type="button" onClick={handleAddEducation} className="mt-2 text-[#0056a0] hover:underline text-sm font-semibold">+ Adaugă Educație</button>
          </div>

          {/* Experience Section - Updated */}
          <div className="space-y-4 pb-6 border-b border-gray-200">
             <h3 className="text-lg font-semibold text-[#1B263B] flex items-center"><span className="mr-2"><FaBriefcase /></span> Experiență Profesională</h3>
             {experience.map((entry, index) => (
               <div key={index} className="space-y-2 p-4 border border-gray-200 rounded-md">
                 {/* Job Title */}
                 <div>
                    <label htmlFor={`experience-title-${index}`} className="block text-sm font-medium text-[#1B263B]">Titlu Post</label>
                    <input
                      id={`experience-title-${index}`}
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-gray-800 placeholder-gray-400 bg-white"
                      value={entry.title}
                      onChange={(e) => handleExperienceChange(index, 'title', e.target.value)}
                      placeholder="ex: Inginer Software"
                    />
                 </div>
                 {/* Company */}
                 <div>
                    <label htmlFor={`experience-company-${index}`} className="block text-sm font-medium text-[#1B263B]">Companie</label>
                    <input
                      id={`experience-company-${index}`}
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-gray-800 placeholder-gray-400 bg-white"
                      value={entry.company}
                      onChange={(e) => handleExperienceChange(index, 'company', e.target.value)}
                      placeholder="ex: Google"
                    />
                 </div>
                 {/* Dates */}
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label htmlFor={`experience-startDate-${index}`} className="block text-sm font-medium text-[#1B263B]">Data Începerii</label>
                      <input
                        id={`experience-startDate-${index}`}
                        type="date"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-gray-800 bg-white"
                        value={entry.startDate}
                        onChange={(e) => handleExperienceChange(index, 'startDate', e.target.value)}
                      />
                   </div>
                    <div>
                       <label htmlFor={`experience-endDate-${index}`} className="block text-sm font-medium text-[#1B263B]">Data Terminării</label>
                       <input
                         id={`experience-endDate-${index}`}
                         type="date"
                         className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-gray-800 bg-white ${
                           entry.isPresent ? 'bg-gray-100 opacity-50 cursor-not-allowed' : ''
                         }`}
                         value={entry.endDate}
                         onChange={(e) => handleExperienceChange(index, 'endDate', e.target.value)}
                         disabled={entry.isPresent}
                       />
                    </div>
                 </div>
                  {/* Present Checkbox */}
                  <div className="flex items-center">
                     <input
                       id={`experience-isPresent-${index}`}
                       name={`experience-isPresent-${index}`}
                       type="checkbox"
                       className="h-4 w-4 text-[#0056a0] border-gray-300 rounded focus:ring-[#0056a0]"
                       checked={entry.isPresent}
                       onChange={(e) => handleExperienceChange(index, 'isPresent', e.target.checked)}
                     />
                     <label htmlFor={`experience-isPresent-${index}`} className="ml-2 block text-sm text-gray-900">În prezent</label>
                   </div>

                  {experience.length > 1 && (
                     <button type="button" onClick={() => handleRemoveExperience(index)} className="text-red-600 hover:underline text-sm font-semibold mt-2">Elimină Experiență</button>
                   )}
               </div>
             ))}
             <button type="button" onClick={handleAddExperience} className="mt-2 text-[#0056a0] hover:underline text-sm font-semibold">+ Adaugă Experiență</button>
          </div>

           {/* Skills Section */}
          <div className="space-y-4 pb-6 border-b border-gray-200">
             <h3 className="text-lg font-semibold text-[#1B263B] flex items-center"><span className="mr-2"><FaTools /></span> Abilități</h3>
             {skills.map((skill, index) => (
               <div key={index} className="flex items-center space-x-2">
                 <input
                   type="text"
                   className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-gray-800 placeholder-gray-400 bg-white"
                   value={skill}
                   onChange={(e) => handleSkillChange(index, e.target.value)}
                   placeholder="ex: JavaScript, React, Python..."
                 />
                  {skills.length > 1 && (
                     <button type="button" onClick={() => handleRemoveSkill(index)} className="text-red-600 hover:underline text-sm font-semibold">Elimină</button>
                   )}
               </div>
             ))}
             <button type="button" onClick={handleAddSkill} className="mt-2 text-[#0056a0] hover:underline text-sm font-semibold">+ Adaugă Abilitate</button>
          </div>

          {/* Links Section */}
          <div className="space-y-4 pb-6 border-b border-gray-200">
             <h3 className="text-lg font-semibold text-[#1B263B]">Linkuri</h3>
             {/* LinkedIn */}
             <div>
                <label htmlFor="linkedin" className="block text-sm font-medium text-[#1B263B]">URL Profil LinkedIn</label>
                <div className="mt-1 flex items-center space-x-2">
                  <span className="text-gray-500"><FaLinkedin size={20} /></span>
                  <input
                    id="linkedin"
                    name="linkedin"
                    type="text"
                    className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-gray-800 placeholder-gray-400 bg-white"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
             </div>
             {/* GitHub */}
             <div>
                <label htmlFor="github" className="block text-sm font-medium text-[#1B263B]">URL Profil GitHub</label>
                 <div className="mt-1 flex items-center space-x-2">
                   <span className="text-gray-500"><FaGithub size={20} /></span>
                   <input
                     id="github"
                     name="github"
                     type="text"
                     className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-gray-800 placeholder-gray-400 bg-white"
                     value={github}
                     onChange={(e) => setGithub(e.target.value)}
                     placeholder="https://github.com/yourprofile"
                   />
                 </div>
             </div>
             {/* Website/Portfolio */}
             <div>
                <label htmlFor="website" className="block text-sm font-medium text-[#1B263B]">URL Website/Portofoliu</label>
                 <div className="mt-1 flex items-center space-x-2">
                   <span className="text-gray-500"><FaLink size={20} /></span>
                   <input
                     id="website"
                     name="website"
                     type="text"
                     className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-gray-800 placeholder-gray-400 bg-white"
                     value={website}
                     onChange={(e) => setWebsite(e.target.value)}
                     placeholder="https://yourwebsite.com"
                   />
                 </div>
             </div>
          </div>

          {/* CV Upload Section */}
          <div className="space-y-4">
             <h3 className="text-lg font-semibold text-[#1B263B]">Încărcare CV</h3>
             <div>
               <label className="block text-sm font-medium text-[#1B263B]">Încarcă CV</label>
               <div className="mt-1 flex items-center space-x-4 p-4 border border-gray-300 rounded-md bg-gray-50">
                 <label htmlFor="cv-upload" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-semibold text-[#1B263B] bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0056a0] cursor-pointer transition-colors">
                   <span className="mr-2"><FaUpload size={16} /></span>
                   Alege fișier
                 </label>
                 <input id="cv-upload" type="file" accept=".pdf,.doc,.docx" onChange={handleCvUpload} className="hidden" />
                 {cvFile ? (
                    <span className="text-sm text-gray-700 font-medium">{cvFile.name}</span>
                 ) : (
                    <span className="text-sm text-gray-500">Niciun fișier selectat</span>
                 )}
               </div>
                <p className="mt-2 text-xs text-gray-500">Fișiere PDF, DOC, și DOCX suportate.</p>
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
              {loading ? 'Se salvează...' : 'Salvează Profil'}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentProfileForm; 