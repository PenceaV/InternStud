import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import EditProfileForm from './EditProfileForm';
import { FaUserGraduate, FaBuilding, FaLinkedin, FaGithub, FaLink, FaGraduationCap, FaBriefcase, FaTools, FaEdit, FaGlobe, FaEye, FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa';
import { Timestamp } from 'firebase/firestore';

interface UserData {
  userType: 'student' | 'company';
  firstName?: string;
  lastName?: string;
  companyName?: string;
  bio?: string;
  education?: Array<{
    university: string;
    specialization: string;
    startDate: Timestamp;
    endDate: Timestamp;
  }>;
  experience?: Array<{
    title: string;
    company: string;
    startDate: Timestamp;
    endDate: Timestamp;
    isPresent: boolean;
  }>;
  skills?: string[];
  linkedin?: string;
  github?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  companyType?: string;
  profileImageUrl?: string;
  id: string;
  location?: string;
  email?: string; // Added email for contact info
  phone?: string; // Added phone for contact info
}

interface Announcement {
  id: string;
  title: string;
  companyName: string;
  description: string;
  location: string;
  jobType: string;
  salary?: string;
  requirements: string;
  benefits?: string;
  applicationDeadline: Timestamp;
  companyId: string;
  createdAt: Timestamp;
  status?: 'pending' | 'approved' | 'rejected';
}

const ProfileView: React.FC = () => {
  const [user, loadingAuth] = useAuthState(auth);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyAnnouncements, setCompanyAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [errorAnnouncements, setErrorAnnouncements] = useState<string | null>(null);

  const handleProfileUpdated = () => {
    setIsEditing(false);
    fetchUserData();
    if (userData?.userType === 'company') {
      fetchCompanyAnnouncements(userData.id);
    }
  };

  const fetchUserData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = { ...userDocSnap.data() as UserData, id: userDocSnap.id };
        setUserData(data);
        if (data.userType === 'company') {
          fetchCompanyAnnouncements(data.id);
        }
      } else {
        console.log("ProfileView: User document does not exist for uid:", user.uid);
        setUserData(null);
        setLoadingAnnouncements(false);
      }
    } catch (err: any) {
      console.error("ProfileView: Error fetching user data:", err);
      setError('Failed to load user data: ' + err.message);
      setLoadingAnnouncements(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyAnnouncements = async (companyId: string) => {
    console.log("ProfileView: Attempting to fetch announcements for companyId:", companyId);
    setLoadingAnnouncements(true);
    setErrorAnnouncements(null);
    try {
      const q = query(collection(db, 'announcements'),
                      where('companyId', '==', companyId),
                      where('status', '==', 'approved')
                      );
      const querySnapshot = await getDocs(q);
      const announcementsList: Announcement[] = [];
      querySnapshot.forEach((doc) => {
        announcementsList.push({ ...doc.data() as Announcement, id: doc.id });
      });
      console.log("ProfileView: Fetched", querySnapshot.size, "approved announcements.");
      setCompanyAnnouncements(announcementsList);
    } catch (err: any) {
      console.error("ProfileView: Error fetching company announcements:", err);
      setErrorAnnouncements('Failed to load announcements: ' + err.message);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [user]);

  useEffect(() => {
    setIsEditing(false);
  }, [user]);

  if (loadingAuth || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0056a0]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  } else if (!user || !userData) {
      return (
        <div className="min-h-screen flex items-center justify-center">
           <div className="text-gray-600">User profile data not found or still loading. Please make sure you are logged in and have a profile.</div>
        </div>
      );
  }

  if (isEditing) {
    return (
      <EditProfileForm
        userType={userData.userType}
        userData={userData}
        onProfileUpdated={handleProfileUpdated}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    // Dacă e deja string, încearcă să îl parsezi ca dată
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('ro-RO');
    }
    // Dacă e Firestore Timestamp
    if (typeof timestamp.toDate === 'function') {
      const date = timestamp.toDate();
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('ro-RO');
    }
    return '';
  };

  const displayCompanyType = (companyType?: string) => {
    switch (companyType) {
      case 'PublicCompany':
        return 'Companie Publică';
      case 'Self-Employed':
        return 'Liber Profesionist';
      case 'Non-Profit':
          return 'Organizație Non-Profit';
      case 'Educational':
          return 'Instituție de Învățământ';
      default:
        return companyType || '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="w-full max-w-4xl space-y-8">
        {/* HEADER GRADIENT DECORATIV */}
        <div className="w-full h-40 bg-gradient-to-r from-[#0056a0] to-[#1B263B] rounded-t-2xl shadow-lg relative"></div>

        {/* CARD PROFIL MODERN */}
        <div className="relative -mt-28 z-10 flex flex-col items-center bg-white rounded-2xl shadow-xl px-8 py-8">
          {/* Avatar */}
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white bg-gray-200 flex items-center justify-center shadow-md -mt-16">
            {userData?.profileImageUrl ? (
              <img src={userData.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : userData?.userType === 'student' ? (
              <FaUserGraduate className="text-5xl text-gray-500" />
            ) : (
              <FaBuilding className="text-5xl text-gray-500" />
            )}
          </div>
          {/* Nume și buton editare */}
          <div className="flex flex-col items-center mt-4 w-full">
            <div className="flex flex-col items-center w-full">
              <h2 className="text-3xl font-bold text-[#1B263B] text-center">
                {userData?.userType === 'student' ? `${userData.firstName || ''} ${userData.lastName || ''}` : userData?.companyName || ''}
              </h2>
              <div className="flex flex-col items-center gap-1 mt-2">
                {userData?.location && (
                  <p className="flex items-center text-gray-500 text-sm"><FaMapMarkerAlt className="mr-1 text-xs" /> {userData.location}</p>
                )}
                <div className="flex items-center gap-2">
                  {userData?.email && (
                    <a href={`mailto:${userData.email}`} className="flex items-center text-[#0056a0] hover:underline text-sm">
                      <FaEnvelope className="mr-1 text-xs" /> {userData.email}
                    </a>
                  )}
                  {userData?.phone && (
                    <a href={`tel:${userData.phone}`} className="flex items-center text-[#0056a0] hover:underline text-sm">
                      <FaPhone className="mr-1 text-xs" /> {userData.phone}
                    </a>
                  )}
                </div>
              </div>
            </div>
            {/* Buton editare profil */}
            {user && userData && user.uid === userData.id && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-1 text-[#0056a0] hover:underline text-sm mt-4 bg-gray-100 px-4 py-2 rounded-full shadow-sm border border-[#0056a0]/20 transition hover:bg-[#e6f0fa]"
              >
                <FaEdit className="text-lg" />
                <span>Editează profilul</span>
              </button>
            )}
          </div>
        </div>

        {/* SECTIUNI PROFIL */}
        <div className="space-y-8">
          {userData?.userType === 'student' && (
            <>
              {/* Fallback dacă nu există date relevante */}
              {!(userData.firstName || userData.lastName || userData.bio || (userData.education && userData.education.length > 0) || (userData.experience && userData.experience.length > 0) || (userData.skills && userData.skills.length > 0) || userData.linkedin || userData.github || userData.website) && (
                <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 flex flex-col items-center">
                  <p className="text-gray-700 text-lg mb-4">Profilul nu este completat.</p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-1 text-[#0056a0] hover:underline text-sm bg-gray-100 px-4 py-2 rounded-full shadow-sm border border-[#0056a0]/20 transition hover:bg-[#e6f0fa]"
                  >
                    <FaEdit className="text-lg" />
                    <span>Completează profilul</span>
                  </button>
                </div>
              )}
              {userData.bio && (
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                  <h3 className="text-xl font-bold text-[#1B263B] flex items-center mb-2"><FaUserGraduate className="mr-2" /> Despre mine</h3>
                  <p className="text-gray-700 text-base leading-relaxed">{userData.bio}</p>
                </div>
              )}
              {userData.education && userData.education.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                  <h3 className="text-xl font-bold text-[#1B263B] flex items-center mb-2"><FaGraduationCap className="mr-2" /> Educație</h3>
                  <div className="space-y-4">
                    {userData.education.map((edu, index) => (
                      <div key={index} className="border-b last:border-b-0 pb-4 last:pb-0">
                        <h4 className="font-semibold text-[#1B263B]">{edu.university}</h4>
                        <p className="text-gray-600 text-sm">{edu.specialization}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {userData.experience && userData.experience.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                  <h3 className="text-xl font-bold text-[#1B263B] flex items-center mb-2"><FaBriefcase className="mr-2" /> Experiență</h3>
                  <div className="space-y-4">
                    {userData.experience.map((exp, index) => (
                      <div key={index} className="border-b last:border-b-0 pb-4 last:pb-0">
                        <h4 className="font-semibold text-[#1B263B]">{exp.title}</h4>
                        <p className="text-gray-600 text-sm">{exp.company}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(exp.startDate)} - {exp.isPresent ? 'Prezent' : formatDate(exp.endDate)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {userData.skills && userData.skills.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                  <h3 className="text-xl font-bold text-[#1B263B] flex items-center mb-2"><FaTools className="mr-2" /> Competențe</h3>
                  <div className="flex flex-wrap gap-2">
                    {userData.skills.map((skill, index) => (
                      <span key={index} className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {(userData.linkedin || userData.github || userData.website) && (
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                  <h3 className="text-xl font-bold text-[#1B263B] flex items-center mb-2"><FaLink className="mr-2" /> Linkuri</h3>
                  <div className="space-y-2">
                    {userData.linkedin && (
                      <a href={userData.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center text-[#0056a0] hover:underline text-sm">
                        <FaLinkedin className="mr-2 text-lg" /> LinkedIn
                      </a>
                    )}
                    {userData.github && (
                      <a href={userData.github} target="_blank" rel="noopener noreferrer" className="flex items-center text-[#0056a0] hover:underline text-sm">
                        <FaGithub className="mr-2 text-lg" /> GitHub
                      </a>
                    )}
                    {userData.website && (
                      <a href={userData.website} target="_blank" rel="noopener noreferrer" className="flex items-center text-[#0056a0] hover:underline text-sm">
                        <FaGlobe className="mr-2 text-lg" /> Website
                      </a>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
          {userData?.userType === 'company' && (
            <>
              {userData.bio && (
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                  <h3 className="text-xl font-bold text-[#1B263B] flex items-center mb-2"><FaBuilding className="mr-2" /> Despre companie</h3>
                  <p className="text-gray-700 text-base leading-relaxed">{userData.bio}</p>
                </div>
              )}
              {(userData.industry || userData.companySize || userData.companyType) && (
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                  <h3 className="text-xl font-bold text-[#1B263B] flex items-center mb-2"><FaBriefcase className="mr-2" /> Detalii Companie</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                    {userData.industry && (
                      <p><span className="font-semibold">Industrie:</span> {userData.industry}</p>
                    )}
                    {userData.companySize && (
                      <p><span className="font-semibold">Dimensiune:</span> {userData.companySize}</p>
                    )}
                    {userData.companyType && (
                      <p><span className="font-semibold">Tip Companie:</span> {displayCompanyType(userData.companyType)}</p>
                    )}
                  </div>
                </div>
              )}
              {(userData.linkedin || userData.website) && (
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                  <h3 className="text-xl font-bold text-[#1B263B] flex items-center mb-2"><FaLink className="mr-2" /> Linkuri</h3>
                  <div className="space-y-2">
                    {userData.linkedin && (
                      <a href={userData.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center text-[#0056a0] hover:underline text-sm">
                        <FaLinkedin className="mr-2 text-lg" /> LinkedIn
                      </a>
                    )}
                    {userData.website && (
                      <a href={userData.website} target="_blank" rel="noopener noreferrer" className="flex items-center text-[#0056a0] hover:underline text-sm">
                        <FaGlobe className="mr-2 text-lg" /> Website
                      </a>
                    )}
                  </div>
                </div>
              )}
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h3 className="text-xl font-bold text-[#1B263B] flex items-center mb-2"><FaEye className="mr-2" /> Anunțuri Postate ({companyAnnouncements.length})</h3>
                {loadingAnnouncements ? (
                  <div className="flex items-center justify-center p-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0056a0]"></div>
                    <p className="ml-4 text-gray-700">Se încarcă anunțurile...</p>
                  </div>
                ) : errorAnnouncements ? (
                  <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                    <p>Eroare la încărcarea anunțurilor: {errorAnnouncements}</p>
                  </div>
                ) : companyAnnouncements.length > 0 ? (
                  <div className="space-y-4">
                    {companyAnnouncements.map(announcement => (
                      <div key={announcement.id} className="border-b last:border-b-0 pb-4 last:pb-0">
                        <h4 className="font-semibold text-[#1B263B]">{announcement.title}</h4>
                        <p className="text-gray-600 text-sm">{announcement.location} | {announcement.jobType}</p>
                        <p className="text-xs text-gray-500">Data limită aplicare: {formatDate(announcement.applicationDeadline)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-600">
                    <p>Această companie nu a postat încă anunțuri aprobate.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileView;