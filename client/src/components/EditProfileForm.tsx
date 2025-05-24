import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { FaUserGraduate, FaBuilding, FaCamera, FaLinkedin, FaGithub, FaLink, FaGraduationCap, FaBriefcase, FaTools, FaGlobe, FaPhone, FaEnvelope } from 'react-icons/fa';

interface EditProfileFormProps {
  userType: 'student' | 'company';
  userData: any;
  onProfileUpdated: () => void;
  onCancel: () => void;
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({ userType, userData, onProfileUpdated, onCancel }) => {
  // State comun pentru ambele tipuri
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // State pentru student
  const [firstName, setFirstName] = useState(userData.firstName || '');
  const [lastName, setLastName] = useState(userData.lastName || '');
  const [bio, setBio] = useState(userData.bio || '');
  const [education, setEducation] = useState(userData.education || []);
  const [experience, setExperience] = useState(userData.experience || []);
  const [skills, setSkills] = useState(userData.skills || []);
  const [linkedin, setLinkedin] = useState(userData.linkedin || '');
  const [github, setGithub] = useState(userData.github || '');
  const [website, setWebsite] = useState(userData.website || '');

  // State pentru companie
  const [companyName, setCompanyName] = useState(userData.companyName || '');
  const [industry, setIndustry] = useState(userData.industry || '');
  const [companySize, setCompanySize] = useState(userData.companySize || '');
  const [companyType, setCompanyType] = useState(userData.companyType || '');
  const [description, setDescription] = useState(userData.bio || '');
  const [companyWebsite, setCompanyWebsite] = useState(userData.website || '');
  const [companyLinkedin, setCompanyLinkedin] = useState(userData.linkedin || '');
  const [phone, setPhone] = useState(userData.phone || '');
  const [email, setEmail] = useState(userData.email || '');
  const [location, setLocation] = useState(userData.location || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', userData.id);
      if (userType === 'student') {
        await updateDoc(userDocRef, {
          firstName,
          lastName,
          bio,
          education,
          experience,
          skills,
          linkedin,
          github,
          website,
          phone,
          email,
          location,
        });
      } else {
        await updateDoc(userDocRef, {
          companyName,
          industry,
          companySize,
          companyType,
          bio: description,
          website: companyWebsite,
          linkedin: companyLinkedin,
          phone,
          email,
          location,
        });
      }
      onProfileUpdated();
    } catch (err: any) {
      setError('A apărut o eroare la salvare: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-8 px-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl space-y-6">
        <h2 className="text-2xl font-bold text-[#1B263B] mb-4 flex items-center">
          {userType === 'student' ? <FaUserGraduate className="mr-2" /> : <FaBuilding className="mr-2" />} Editează profilul
        </h2>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">{error}</div>}
        {userType === 'student' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1B263B]">Prenume <span className="text-red-500">*</span></label>
                <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black" value={firstName} onChange={e => setFirstName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1B263B]">Nume <span className="text-red-500">*</span></label>
                <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black" value={lastName} onChange={e => setLastName(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1B263B]">Bio <span className="text-red-500">*</span></label>
              <textarea className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black" value={bio} onChange={e => setBio(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1B263B]">Email</label>
              <input type="email" className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1B263B]">Telefon</label>
              <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1B263B]">Locație</label>
              <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            {/* Educație */}
            <div>
              <label className="block text-sm font-medium text-[#1B263B]">Educație <span className="text-red-500">*</span></label>
              {education.map((entry: any, idx: number) => (
                <div key={idx} className="mb-2 p-2 border border-gray-200 rounded-md flex flex-col gap-2">
                  <input
                    type="text"
                    className="block w-full border border-gray-300 rounded-md p-2 text-black"
                    placeholder="Universitate"
                    value={entry.university || ''}
                    onChange={e => {
                      const newEdu = [...education];
                      newEdu[idx].university = e.target.value;
                      setEducation(newEdu);
                    }}
                    required
                  />
                  <input
                    type="text"
                    className="block w-full border border-gray-300 rounded-md p-2 text-black"
                    placeholder="Specializare"
                    value={entry.specialization || ''}
                    onChange={e => {
                      const newEdu = [...education];
                      newEdu[idx].specialization = e.target.value;
                      setEducation(newEdu);
                    }}
                    required
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="block w-full border border-gray-300 rounded-md p-2 text-black"
                      placeholder="Data început (ex: 2020)"
                      value={entry.startDate || ''}
                      onChange={e => {
                        const newEdu = [...education];
                        newEdu[idx].startDate = e.target.value;
                        setEducation(newEdu);
                      }}
                      required
                    />
                    <input
                      type="text"
                      className="block w-full border border-gray-300 rounded-md p-2 text-black"
                      placeholder="Data sfârșit (ex: 2024)"
                      value={entry.endDate || ''}
                      onChange={e => {
                        const newEdu = [...education];
                        newEdu[idx].endDate = e.target.value;
                        setEducation(newEdu);
                      }}
                      required
                    />
                  </div>
                  {education.length > 1 && (
                    <button type="button" className="text-red-600 text-xs self-end" onClick={() => {
                      setEducation(education.filter((_, i) => i !== idx));
                    }}>Elimină</button>
                  )}
                </div>
              ))}
              <button type="button" className="text-[#0056a0] text-sm font-semibold mt-1" onClick={() => setEducation([...education, {university:'',specialization:'',startDate:'',endDate:''}])}>+ Adaugă Educație</button>
            </div>
            {/* Experiență */}
            <div>
              <label className="block text-sm font-medium text-[#1B263B]">Experiență <span className="text-red-500">*</span></label>
              {experience.map((entry: any, idx: number) => (
                <div key={idx} className="mb-2 p-2 border border-gray-200 rounded-md flex flex-col gap-2">
                  <input
                    type="text"
                    className="block w-full border border-gray-300 rounded-md p-2 text-black"
                    placeholder="Titlu job"
                    value={entry.title || ''}
                    onChange={e => {
                      const newExp = [...experience];
                      newExp[idx].title = e.target.value;
                      setExperience(newExp);
                    }}
                    required
                  />
                  <input
                    type="text"
                    className="block w-full border border-gray-300 rounded-md p-2 text-black"
                    placeholder="Companie"
                    value={entry.company || ''}
                    onChange={e => {
                      const newExp = [...experience];
                      newExp[idx].company = e.target.value;
                      setExperience(newExp);
                    }}
                    required
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="block w-full border border-gray-300 rounded-md p-2 text-black"
                      placeholder="Data început (ex: 2022)"
                      value={entry.startDate || ''}
                      onChange={e => {
                        const newExp = [...experience];
                        newExp[idx].startDate = e.target.value;
                        setExperience(newExp);
                      }}
                      required
                    />
                    <input
                      type="text"
                      className="block w-full border border-gray-300 rounded-md p-2 text-black"
                      placeholder="Data sfârșit (ex: 2023 sau Prezent)"
                      value={entry.endDate || ''}
                      onChange={e => {
                        const newExp = [...experience];
                        newExp[idx].endDate = e.target.value;
                        setExperience(newExp);
                      }}
                      required
                    />
                  </div>
                  {experience.length > 1 && (
                    <button type="button" className="text-red-600 text-xs self-end" onClick={() => {
                      setExperience(experience.filter((_, i) => i !== idx));
                    }}>Elimină</button>
                  )}
                </div>
              ))}
              <button type="button" className="text-[#0056a0] text-sm font-semibold mt-1" onClick={() => setExperience([...experience, {title:'',company:'',startDate:'',endDate:''}])}>+ Adaugă Experiență</button>
            </div>
            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-[#1B263B]">Abilități <span className="text-red-500">*</span></label>
              <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black" value={skills.join(', ')} onChange={e => setSkills(e.target.value.split(','))} required />
            </div>
            {/* Linkuri */}
            <div>
              <label className="block text-sm font-medium text-[#1B263B]">LinkedIn</label>
              <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black" value={linkedin} onChange={e => setLinkedin(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1B263B]">GitHub</label>
              <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black" value={github} onChange={e => setGithub(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1B263B]">Website</label>
              <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black" value={website} onChange={e => setWebsite(e.target.value)} />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-[#1B263B]">Nume companie <span className="text-red-500">*</span></label>
              <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black" value={companyName} onChange={e => setCompanyName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1B263B]">Descriere <span className="text-red-500">*</span></label>
              <textarea className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black" value={description} onChange={e => setDescription(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1B263B]">Locație</label>
              <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1B263B]">Website</label>
              <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black" value={companyWebsite} onChange={e => setCompanyWebsite(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1B263B]">LinkedIn</label>
              <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black" value={companyLinkedin} onChange={e => setCompanyLinkedin(e.target.value)} />
            </div>
          </>
        )}
        <div className="flex justify-end gap-4 mt-8">
          <button type="button" onClick={onCancel} className="px-6 py-2 rounded bg-gray-200 text-[#1B263B] font-semibold hover:bg-gray-300">Anulează</button>
          <button type="submit" disabled={loading} className="px-6 py-2 rounded bg-[#0056a0] text-white font-semibold hover:bg-[#003f7a] shadow-md">
            {loading ? 'Se salvează...' : 'Salvează'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfileForm; 