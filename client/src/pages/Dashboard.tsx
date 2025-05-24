import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, query, getDocs, doc, getDoc, deleteDoc, where, updateDoc, addDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { FaUserGraduate, FaHome, FaBriefcase, FaUserCircle, FaRocket, FaCog, FaPowerOff, FaFilter, FaBuilding, FaBell, FaPlus, FaCheck, FaTimes, FaEnvelope, FaGraduationCap, FaTools } from 'react-icons/fa';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import CreateAnnouncementForm from '../components/CreateAnnouncementForm';
import { Timestamp } from 'firebase/firestore';
import AnnouncementDetailsModal from '../components/AnnouncementDetailsModal';
import ProfileView from '../components/ProfileView';
import logoCropped from '/logo-cropped.svg';
import NotificationsDropdown from '../components/NotificationsDropdown';

interface Announcement {
  id: string;
  title: string;
  companyName: string;
  description: string;
  location: string;
  jobType: string;
  salary?: string; // Optional
  requirements: string;
  benefits?: string; // Optional
  applicationDeadline: Timestamp;
  companyId: string;
  createdAt: Timestamp;
  status?: 'pending' | 'approved' | 'rejected'; // Add the status field
}

interface Application {
  id: string;
  jobId: string;
  studentId: string;
  companyId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
  studentData?: {
    firstName: string;
    lastName: string;
    email: string;
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
  };
  jobData?: {
    title: string;
    companyName: string;
  };
}

const Dashboard: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, loadingAuth] = useAuthState(auth);
  interface UserNameState { firstName?: string; lastName?: string; companyName?: string; } // Define interface for userName state
  const [userName, setUserName] = useState<UserNameState | null>(null); // Initialize userName as null
  const [userType, setUserType] = useState('');
  const [profileStatus, setProfileStatus] = useState<'not_submitted' | 'pending' | 'approved' | 'rejected' | null>(null);
  const navigate = useNavigate();

  // State for search and filter options visibility
  const [searchTerm, setSearchTerm] = useState('');
  const [showCompanyFilterOptions, setShowCompanyFilterOptions] = useState(false);
  // State for the active filter (company name)
  const [activeCompanyFilter, setActiveCompanyFilter] = useState('Toate Companiile');

  const [dashboardContent, setDashboardContent] = useState<'announcementsList' | 'createAnnouncement' | 'profile' | 'applications'>('announcementsList');
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);

  // State for announcement details modal
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementToEdit, setAnnouncementToEdit] = useState<Announcement | null>(null);

  // State for successful announcement creation message
  const [announcementAddedSuccess, setAnnouncementAddedSuccess] = useState(false);

  // State pentru modalul/vizualizarea profilului studentului
  const [showStudentProfileModal, setShowStudentProfileModal] = useState(false);
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<Application['studentData'] | null>(null);

  // Handle user logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/'); // Redirect to homepage after logout
    } catch (error) {
      console.error("Error logging out:", error);
      // Optionally show an error message to the user
    }
  };

  // Function to fetch user data and announcements
  const fetchUserDataAndAnnouncements = async () => {
    if (!user) {
      // Optionally redirect to login if not authenticated, though ProtectedRoute should handle this
      setLoading(false);
      console.log('Dashboard: user is null, stopping fetch.');
      return;
    }

    setLoading(true);
    setError(null);
    console.log('Dashboard: Starting data fetch for user:', user.uid);

    try {
      // Fetch user data
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      console.log('Dashboard: User document snapshot fetched.', userDocSnap.exists());

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setUserType(userData.userType || '');
        setProfileStatus(userData.status || 'not_submitted');
        // Display name based on user type
        if (userData.userType === 'student') {
          console.log('Dashboard: User is student, setting name.');
          // Store first and last name separately for display
          setUserName({ firstName: userData.firstName || '', lastName: userData.lastName || '' });
        } else if (userData.userType === 'company') {
          console.log('Dashboard: User is company, setting name.');
          // Store company name in firstName for simplicity, or adjust logic
          setUserName({ companyName: userData.companyName || '' });
        } else {
          console.log('Dashboard: User type unknown.');
          setUserName({}); // Set to empty object for unknown type initially
        }
      } else {
        console.log('Dashboard: User document does not exist for auth user.', user.uid);
      }

      // Fetch announcements
      const q = query(collection(db, 'announcements'));
      const querySnapshot = await getDocs(q);
      console.log('Dashboard: Announcements query snapshot fetched.', querySnapshot.size, 'documents.');

      const announcementsList: Announcement[] = [];
      querySnapshot.forEach((doc) => {
        // Map Firestore data to Announcement interface
        announcementsList.push({ ...doc.data() as Announcement, id: doc.id });
      });
      setAnnouncements(announcementsList);

    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError('Failed to load data: ' + err.message);
      console.log('Dashboard: Catch block executed, error set.', err.message);
    } finally {
      setLoading(false);
      console.log('Dashboard: Finally block executed, loading set to false.');
    }
  };

  // Funcție pentru a încărca aplicațiile companiei
  const fetchApplications = async () => {
    if (!user || userType !== 'company') return;
    
    setLoadingApplications(true);
    try {
      const q = query(
        collection(db, 'applications'),
        where('companyId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const applicationsList: Application[] = [];
      
      for (const docSnapshot of querySnapshot.docs) {
        const applicationData = docSnapshot.data();
        const application: Application = {
          id: docSnapshot.id,
          jobId: applicationData.jobId,
          studentId: applicationData.studentId,
          companyId: applicationData.companyId,
          status: applicationData.status,
          createdAt: applicationData.createdAt,
        };
        
        // Obține datele studentului
        const studentDoc = await getDoc(doc(db, 'users', application.studentId));
        if (studentDoc.exists()) {
          const studentData = studentDoc.data();
          application.studentData = {
            firstName: studentData.firstName || '',
            lastName: studentData.lastName || '',
            email: studentData.email || '',
            education: studentData.education ? studentData.education.map((edu: any) => ({
              university: edu.university || '',
              specialization: edu.specialization || '',
              startDate: edu.startDate instanceof Timestamp ? edu.startDate : (edu.startDate ? Timestamp.fromDate(new Date(edu.startDate)) : Timestamp.now()), // Convert or use now
              endDate: edu.endDate instanceof Timestamp ? edu.endDate : (edu.endDate ? Timestamp.fromDate(new Date(edu.endDate)) : Timestamp.now()), // Convert or use now
            })) : [],
            experience: studentData.experience ? studentData.experience.map((exp: any) => ({
              title: exp.title || '',
              company: exp.company || '',
              startDate: exp.startDate instanceof Timestamp ? exp.startDate : (exp.startDate ? Timestamp.fromDate(new Date(exp.startDate)) : Timestamp.now()), // Convert or use now
              endDate: exp.endDate instanceof Timestamp ? exp.endDate : (exp.endDate ? Timestamp.fromDate(new Date(exp.endDate)) : Timestamp.now()), // Convert or use now
              isPresent: exp.isPresent || false,
            })) : [],
            skills: studentData.skills || [],
          };
        }
        
        // Obține datele jobului
        const jobDoc = await getDoc(doc(db, 'announcements', application.jobId));
        if (jobDoc.exists()) {
          const jobData = jobDoc.data();
          application.jobData = {
            title: jobData.title || '',
            companyName: jobData.companyName || '',
          };
        }
        
        applicationsList.push(application);
      }
      
      setApplications(applicationsList);
    } catch (err: any) {
      console.error("Error fetching applications:", err);
      setError('Failed to load applications: ' + err.message);
    } finally {
      setLoadingApplications(false);
    }
  };

  // Funcție pentru a actualiza statusul unei aplicații
  const handleApplicationStatus = async (applicationId: string, newStatus: 'approved' | 'rejected') => {
    if (!user || userType !== 'company') return;

    try {
      // Actualizează statusul aplicației
      const applicationRef = doc(db, 'applications', applicationId);
      await updateDoc(applicationRef, { status: newStatus });

      // Obține datele aplicației pentru notificare
      const applicationDoc = await getDoc(applicationRef);
      const applicationData = applicationDoc.data();
      if (!applicationData || !applicationData.jobId || !applicationData.studentId) {
        console.error("Missing application data for notification");
        return;
      }

      // Fetch job data for notification message
      let jobTitle = 'a job'; // Default title if fetch fails
      let companyName = 'a company'; // Default company if fetch fails
      try {
        const jobDoc = await getDoc(doc(db, 'announcements', applicationData.jobId));
        if (jobDoc.exists()) {
          const jobData = jobDoc.data();
          jobTitle = jobData.title || jobTitle;
          companyName = jobData.companyName || companyName;
        }
      } catch (jobFetchErr) {
        console.error("Error fetching job data for notification:", jobFetchErr);
      }

      // Creează notificare pentru student
      await addDoc(collection(db, 'notifications'), {
        userId: applicationData.studentId,
        type: newStatus === 'approved' ? 'approval' : 'rejection',
        message: newStatus === 'approved' 
          ? `Aplicația ta pentru postul "${jobTitle}" a fost aprobată!`
          : `Aplicația ta pentru postul "${jobTitle}" a fost respinsă.`,
        read: false,
        data: {
          jobId: applicationData.jobId,
          applicationId: applicationId,
        },
        createdAt: Timestamp.now(),
      });

      // Reîncarcă aplicațiile pentru a actualiza UI-ul
      await fetchApplications();
    } catch (err: any) {
      console.error("Error updating application status:", err);
      setError('Failed to update application status: ' + err.message);
    }
  };

  // Funcție pentru a deschide modalul cu profilul studentului
  const handleViewStudentProfile = (studentData: Application['studentData']) => {
    setSelectedStudentProfile(studentData);
    setShowStudentProfileModal(true);
  };

  // Funcție pentru a închide modalul cu profilul studentului
  const handleCloseStudentProfileModal = () => {
    setSelectedStudentProfile(null);
    setShowStudentProfileModal(false);
  };

  // Funcție pentru a gestiona click-ul pe o notificare
  const handleNotificationClick = async (notification: any) => {
    // Assuming notification.data contains relevant info like applicationId or jobId

    // Mark notification as read
    if (!notification.read) {
      try {
        const notificationRef = doc(db, 'notifications', notification.id);
        await updateDoc(notificationRef, { read: true });
        // The NotificationsDropdown component listens for updates and should refresh the UI
      } catch (err) {
        console.error("Error marking notification as read in Dashboard handler:", err);
      }
    }

    if (userType === 'company' && notification.data?.applicationId) {
      console.log('Handling company application notification...');
      // For company users, clicking a new application notification should
      // navigate to the Applications section and directly show the student profile for that application.
      setDashboardContent('applications');
      console.log('Set dashboardContent to applications.');

      try {
        console.log('Attempting to fetch application data for ID:', notification.data.applicationId);
        // Fetch the specific application data
        const applicationDocRef = doc(db, 'applications', notification.data.applicationId);
        const applicationDocSnap = await getDoc(applicationDocRef);

        if (applicationDocSnap.exists()) {
          const applicationData = applicationDocSnap.data();
          console.log('Application document found:', applicationData);
          const studentId = applicationData.studentId;
          console.log('Student ID from application data:', studentId);

          if (studentId) {
            console.log('Attempting to fetch student data for ID:', studentId);
            // Fetch the student's user data
            const studentDocRef = doc(db, 'users', studentId);
            const studentDocSnap = await getDoc(studentDocRef);

            if (studentDocSnap.exists()) {
              const studentData = studentDocSnap.data();
              console.log('Student document found:', studentData);
              // Open the student profile modal
              console.log('Attempting to open student profile modal...');
              handleViewStudentProfile(studentData as Application['studentData']);
              console.log('handleViewStudentProfile called.');
            } else {
              console.log('Error: Student data not found for application:', studentId);
              // Optionally show a message
            }
          } else {
            console.log('Error: Student ID not found in application data:', notification.data.applicationId);
            // Optionally show a message
          }
        } else {
          console.log('Error: Application document not found for notification:', notification.data.applicationId);
          // Optionally show a message
        }

      } catch (err) {
        console.error("Error handling application notification click:", err);
        // Optionally show an error message
      }

    } else if (userType === 'student' && (notification.type === 'approval' || notification.type === 'rejection') && notification.data?.jobId) {
      // For students clicking on approval/rejection notifications, show job details
      try {
        const jobDoc = await getDoc(doc(db, 'announcements', notification.data.jobId));
        if (jobDoc.exists()) {
          const jobData = { ...jobDoc.data() as Announcement, id: jobDoc.id };
          handleViewDetails(jobData);
        } else {
          console.log('Job announcement not found for notification:', notification);
          // Optionally show a message that the job is no longer available
        }
      } catch (err) {
        console.error("Error fetching job for notification:", err);
        // Optionally show an error message
      }
    }
    // Handle other notification types if needed in the future
    // if (notification.type === 'other') { ... }
  };

  // Funcție pentru a aplica la un job direct de pe card (pentru studenți)
  const handleApplyFromCard = async (announcementId: string, companyId: string) => {
    if (userType !== 'student' || !user) return;

    try {
      // Verifică dacă studentul a aplicat deja
      const q = query(
        collection(db, 'applications'),
        where('jobId', '==', announcementId),
        where('studentId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        alert('Ai aplicat deja la acest job!'); // Simple alert for now
        return;
      }

      // Creează aplicația
      await addDoc(collection(db, 'applications'), {
        jobId: announcementId,
        studentId: user.uid,
        companyId: companyId,
        status: 'pending',
        createdAt: Timestamp.now(),
      });

      alert('Ai aplicat cu succes!'); // Simple alert for now

      // Fetch student name for notification
      let studentName = 'Un Student'; // Default name if fetch fails
      try {
        const studentDoc = await getDoc(doc(db, 'users', user.uid));
        if (studentDoc.exists()) {
          const studentData = studentDoc.data();
          studentName = `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim() || studentName;
        }
      } catch (studentFetchErr) {
        console.error("Error fetching student data for notification:", studentFetchErr);
      }

      // Creează notificare pentru companie
      await addDoc(collection(db, 'notifications'), {
        userId: companyId,
        type: 'application',
        message: `${studentName} a aplicat la jobul "${announcements.find(ann => ann.id === announcementId)?.title || 'necunoscut'}"`,
        read: false,
        data: {
          jobId: announcementId,
          studentId: user.uid,
        },
        createdAt: Timestamp.now(),
      });

    } catch (err: any) {
      console.error("Error applying from card:", err);
      alert('Eroare la aplicare. Încearcă din nou.'); // Simple alert for now
    }
  };

  useEffect(() => {
    console.log('Dashboard useEffect running. user:', user, 'loadingAuth:', loadingAuth);
    fetchUserDataAndAnnouncements();
  }, [user]); // Rerun when user changes

  useEffect(() => {
    if (dashboardContent === 'applications' && userType === 'company') {
      fetchApplications();
    }
  }, [dashboardContent, userType]);

  console.log('Dashboard Render. loading:', loading, 'error:', error, 'user:', !!user, 'userName:', userName, 'profileStatus:', profileStatus);
  if (loadingAuth || loading || !user || profileStatus === null) { // Check auth loading, data loading, user presence, and profileStatus
    if (loadingAuth || loading || profileStatus === null) {
      return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
    } else if (!user) {
      return <div className="min-h-screen flex items-center justify-center"><p>Please log in.</p></div>;
    }
  }

  if (error) { // Handle fetch errors
    return <div className="min-h-screen flex items-center justify-center text-red-500"><p>Error: {error}</p></div>;
  }

  // Afișează mesajul de pending pentru companii cu status 'pending'
  if (userType === 'company' && profileStatus === 'pending') {
    console.log('Dashboard: Rendering Pending State for Company.');
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl font-bold text-[#1B263B] mb-4">Cererea de creare a profilului companiei a fost trimisă spre examinare.</h2>
        <p className="text-gray-600">Vă mulțumim! Vă vom notifica prin email odată ce profilul dumneavoastră este aprobat.</p>
        <button
          onClick={handleLogout}
          className="mt-6 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          Deconectează-te
        </button>
      </div>
    );
  }

  // Handle case where user is loaded but user data (userName) is not yet fetched or is null
  if (!userName) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  }

  // Function to format Firestore Timestamp to a readable date string
  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString('ro-RO'); // Format as DD/MM/YYYY
  };

  // Function to handle clicking "Detalii" button
  const handleViewDetails = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setShowAnnouncementModal(true);
  };

  // Function to handle clicking "Editează" button
  const handleEditAnnouncement = (announcement: Announcement) => {
    setAnnouncementToEdit(announcement);
    setDashboardContent('createAnnouncement'); // Reuse the create announcement form for editing
  };

  // Function to close the details modal
  const handleCloseModal = () => {
    setSelectedAnnouncement(null);
    setShowAnnouncementModal(false);
  };

  // Function to handle deleting an announcement
  const handleDeleteAnnouncement = async (announcementId: string) => {
    console.log(`Attempting to delete announcement with ID: ${announcementId}`);
    // Optional: Add a confirmation dialog before deleting
    if (window.confirm('Ești sigur că vrei să ștergi acest anunț?')) {
      try {
        const announcementRef = doc(db, 'announcements', announcementId);
        await deleteDoc(announcementRef);
        console.log('Announcement deleted successfully.');
        // Refresh the list of announcements
        // A simple way is to refetch all announcements
        // A more efficient way would be to remove the deleted announcement from the state
        setAnnouncements(prevAnnouncements => prevAnnouncements.filter(ann => ann.id !== announcementId));
        // Optionally show a success message
        console.log('Announcement list updated after deletion.');
      } catch (err: any) {
        console.error("Error deleting announcement:", err);
        setError('Failed to delete announcement: ' + err.message);
        // Optionally show an error message to the user
      }
    }
  };

  // Handle profile link click
  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setDashboardContent('profile'); // Set dashboard content to 'profile'
  };

  // Placeholder UI based on the provided image style
  return (
    <div className="min-h-screen bg-gray-200 flex antialiased">
      {/* Sidebar */}
      <div className="w-64 bg-[#F5F6FA] text-black p-0 flex flex-col shadow-lg fixed left-0 top-0 bottom-0 overflow-y-auto z-40">
        {/* LOGO + NOTIFICARE SUS */}
        <div className="flex flex-row items-center justify-between w-full px-6 pt-6 pb-2" style={{minHeight: '64px'}}>
          <img src={logoCropped} alt="Logo" className="w-40 h-12 object-contain" />
          {user && <NotificationsDropdown userId={user.uid} onNotificationClick={handleNotificationClick} />}
        </div>
        {/* AVATAR + NUME */}
        <div className="flex flex-col items-center w-full gap-2 mt-4 mb-8">
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white flex items-center justify-center shadow-lg border-4 border-[#273247]">
            {userType === 'company' ? <FaBuilding className="text-5xl text-[#273247]" /> : <FaUserGraduate className="text-5xl text-[#273247]" />}
          </div>
          <div className="text-center w-full">
            {userName ? (
              userType === 'student' && userName.lastName && userName.firstName ? (
                <span className="block text-xl font-extrabold text-black truncate px-2">{userName.lastName} {userName.firstName}</span>
              ) : userType === 'company' && userName.companyName ? (
                <span className="block text-xl font-extrabold text-black truncate px-2">{userName.companyName}</span>
              ) : (
                <span className="block text-xl font-extrabold text-black truncate px-2">Utilizator</span>
              )
            ) : (
              <span className="block text-xl font-extrabold text-black truncate px-2">Încărcare nume...</span>
            )}
          </div>
        </div>
        {/* MENIU PRINCIPAL */}
        <nav className="flex flex-col gap-2 px-4">
          <a href="#" className={`flex items-center gap-3 py-3 px-4 rounded-xl font-bold text-base transition duration-200 ${dashboardContent === 'profile' ? 'bg-[#2561A9] text-white' : 'text-black hover:bg-[#E3EAFD] hover:text-black'}`} onClick={handleProfileClick}>
            <FaUserCircle className={`text-xl ${dashboardContent === 'profile' ? 'text-white' : 'text-black'}`} />
            <span>Profilul meu</span>
          </a>
          {userType === 'student' || userType === 'company' ? (
            <>
              <a href="#" className={`flex items-center gap-3 py-3 px-4 rounded-xl font-bold text-base transition duration-200 ${dashboardContent === 'announcementsList' ? 'bg-[#2561A9] text-white' : 'text-black hover:bg-[#E3EAFD] hover:text-black'}`} onClick={e => { e.preventDefault(); setDashboardContent('announcementsList'); }}>
                <FaBriefcase className={`text-xl ${dashboardContent === 'announcementsList' ? 'text-white' : 'text-black'}`} />
                <span>{userType === 'student' ? 'Anunțuri de Joburi' : 'Anunțurile Mele'}</span>
              </a>
              {userType === 'company' && (
                <>
                  <a href="#" className={`flex items-center gap-3 py-3 px-4 rounded-xl font-bold text-base transition duration-200 ${dashboardContent === 'createAnnouncement' ? 'bg-[#2561A9] text-white' : 'text-black hover:bg-[#E3EAFD] hover:text-black'}`} onClick={e => { e.preventDefault(); setDashboardContent('createAnnouncement'); }}>
                    <FaPlus className={`text-xl ${dashboardContent === 'createAnnouncement' ? 'text-white' : 'text-black'}`} />
                    <span>Adaugă Anunț Nou</span>
                  </a>
                  <a href="#" className={`flex items-center gap-3 py-3 px-4 rounded-xl font-bold text-base transition duration-200 ${dashboardContent === 'applications' ? 'bg-[#2561A9] text-white' : 'text-black hover:bg-[#E3EAFD] hover:text-black'}`} onClick={e => { e.preventDefault(); setDashboardContent('applications'); }}>
                    <FaUserGraduate className={`text-xl ${dashboardContent === 'applications' ? 'text-white' : 'text-black'}`} />
                    <span>Aplicații</span>
                  </a>
                </>
              )}
            </>
          ) : null}
        </nav>
        {/* Spacer pentru a împinge butoanele jos */}
        <div className="flex-grow" />
        {/* BUTOANE JOS */}
        <div className="border-t border-gray-300 pt-6 pb-4 px-6 flex flex-col gap-2">
          <a href="#" className="flex items-center gap-3 py-3 px-4 rounded-xl font-bold text-black text-base transition duration-200 hover:bg-[#E3EAFD] hover:text-black" onClick={e => { e.preventDefault(); navigate('/'); }}>
            <FaHome className="text-xl" />
            <span>Acasă</span>
          </a>
          <a href="#" onClick={handleLogout} className="flex items-center gap-3 py-2 px-2 rounded-xl font-bold text-black text-base transition duration-200 hover:bg-[#F2542D] hover:text-white">
            <FaPowerOff className="text-xl" />
            <span>Deconectează-te</span>
          </a>
        </div>
      </div>

      {/* Main Content Wrapper to create space for fixed sidebar */}
      <div className="flex-1 pl-64">
        {/* Main Content Area - now has its own scrollbar */}
        <div className="p-8 bg-gray-100 h-screen overflow-y-auto">
          {/* Conditionally render content based on dashboardContent state */}
          {dashboardContent === 'applications' && userType === 'company' ? (
            <div>
              <h1 className="text-2xl font-bold text-[#1B263B] mb-6">Aplicații Primite</h1>
              {loadingApplications ? (
                <div className="flex justify-center items-center h-64">
                  <LoadingSpinner />
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center text-gray-600 text-xl mt-10 p-6 bg-white rounded-lg shadow-sm">
                  <p>Nu există aplicații încă.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {applications.map((application) => (
                    <div key={application.id} className="bg-white p-6 rounded-lg shadow-md">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-[#1B263B]">
                            {application.jobData?.title || 'Job'}
                          </h3>
                          {application.studentData ? (
                            <button 
                              onClick={() => handleViewStudentProfile(application.studentData)}
                              className="text-gray-600 hover:text-blue-700 cursor-pointer focus:outline-none"
                            >
                              {application.studentData.firstName} {application.studentData.lastName}
                            </button>
                          ) : (
                            <p className="text-gray-600">Student indisponibil</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            application.status === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {application.status === 'pending' ? 'În așteptare' :
                             application.status === 'approved' ? 'Aprobat' : 'Respins'}
                          </span>
                        </div>
                      </div>
                      
                      {application.status === 'pending' && (
                        <div className="flex space-x-4 mt-4">
                          <button
                            onClick={() => handleApplicationStatus(application.id, 'approved')}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                          >
                            Aprobă
                          </button>
                          <button
                            onClick={() => handleApplicationStatus(application.id, 'rejected')}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                          >
                            Respinge
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : dashboardContent === 'announcementsList' ? (
            <>
              <h1 className="text-2xl font-bold text-[#1B263B] mb-6">Anunțuri de Joburi</h1>

              {/* Success Message Placeholder */}
              {announcementAddedSuccess && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6">
                  <strong className="font-bold">Succes!</strong>
                  <span className="block sm:inline ml-2">Anunțul a fost adăugat cu succes!</span>
                  <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
                    <svg className="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" onClick={() => setAnnouncementAddedSuccess(false)}><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.03a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15L6.303 6.849a1.2 1.2 0 0 1 1.697-1.697L10 8.183l2.651-3.03a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.15 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                  </span>
                </div>
              )}

              {/* Tabs Placeholder */}
              <div className="flex border-b border-gray-200 mb-6">
                <button className="py-2 px-4 text-[#0056a0] border-b-2 border-[#0056a0] font-semibold focus:outline-none">Toate</button>
                {/* Keep or remove other relevant tabs if needed */}
                {/* Add other tabs as needed */}
              </div>

              {/* Search and Filter Placeholder */}
              <div className="flex items-start space-x-4 mb-8 relative"> {/* Added relative positioning */}
                {/* Search Input Container */}
                <div className="flex-grow flex items-center bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                  <input
                    type="text"
                    placeholder="Caută anunțuri..."
                    className="flex-1 p-1 border-none outline-none focus:ring-0 text-gray-700 placeholder-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {/* Filter Icon - Clickable to show options */}
                  <button
                    className="p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
                    onClick={() => setShowCompanyFilterOptions(!showCompanyFilterOptions)}
                  >
                    <FaFilter className="text-xl" />
                  </button>
                </div>

                {/* Company Filter Options (Dropdown-like) */}
                {showCompanyFilterOptions && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1">
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => { setActiveCompanyFilter('Toate Companiile'); setShowCompanyFilterOptions(false); }}
                    >
                      Toate Companiile
                    </button>
                    {/* Dynamically generate unique companies from current announcements */}
                    {[...new Set(announcements.map(ann => ann.companyName))].map(company => (
                      <button
                        key={company}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => { setActiveCompanyFilter(company); setShowCompanyFilterOptions(false); }}
                      >
                        {company}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Announcement Cards or No Announcements Message */}
              {/* Filter announcements based on search term and selected company */}
              {announcements.filter(announcement => {
                const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                      announcement.companyName.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesCompany = activeCompanyFilter === 'Toate Companiile' || announcement.companyName === activeCompanyFilter;

                // Determine if the logged-in user is the company that posted this announcement
                const isOwnAnnouncement = user && user.uid === announcement.companyId;

                // Filter logic:
                // If it's the company's own announcement, include it regardless of status.
                // If it's NOT the company's own, only include if status is 'approved'.
                if (isOwnAnnouncement) {
                  return matchesSearch && matchesCompany;
                } else {
                  return matchesSearch && matchesCompany && announcement.status === 'approved';
                }
              }).length === 0 && !showCompanyFilterOptions ? (
                <div className="text-center text-gray-600 text-xl mt-10 p-6 bg-white rounded-lg shadow-sm">
                  <p>Momentan nu există anunțuri de joburi disponibile.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                  {/* Map and display filtered announcements */}
                  {announcements.filter(announcement => {
                    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                          announcement.companyName.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesCompany = activeCompanyFilter === 'Toate Companiile' || announcement.companyName === activeCompanyFilter;

                    // Determine if the logged-in user is the company that posted this announcement
                    const isOwnAnnouncement = user && user.uid === announcement.companyId;

                    // Filter logic (repeated for mapping, ensures consistency):
                    if (isOwnAnnouncement) {
                      return matchesSearch && matchesCompany;
                    } else {
                      return matchesSearch && matchesCompany && announcement.status === 'approved';
                    }
                  }).map((announcement) => (
                    <div key={announcement.id} className="bg-white p-6 rounded-lg shadow-md flex flex-col"> {/* Changed to flex-col */}
                      {/* Announcement Title (Centered at the top) */}
                      <h3 className="text-xl font-semibold text-[#1B263B] mb-4 text-center">{announcement.title}</h3> {/* Centered and added margin-bottom */}

                      {/* Company Icon and Name Area (using flex for horizontal layout) */}
                      <div className="flex items-start space-x-4">
                        {/* Larger Company Icon Circle */}
                        <div className="flex-shrink-0 w-16 h-16 rounded-full bg-[#004080] flex items-center justify-center text-3xl text-white"> {/* Adjusted size and color */}
                          <FaBuilding />
                        </div>
                        {/* Company Name and potentially Status */}
                        <div className="flex flex-col">
                           <p className="text-xl font-bold text-[#1B263B] leading-tight">{announcement.companyName}</p> {/* Company name larger and bold */}

                           {/* Status Indicator (only for the company that posted the announcement) */}
                           {user && user.uid === announcement.companyId && announcement.status && (
                             <div className="flex items-center mt-1">
                               <span className={
                                 `w-3 h-3 rounded-full mr-2 ` +
                                 (announcement.status === 'approved' ? 'bg-green-600' :
                                  announcement.status === 'rejected' ? 'text-red-600 bg-red-600' : 'bg-gray-500') // Added bg-red-600 for consistency
                               }></span>
                               <span className={
                                 `text-sm font-semibold ` +
                                 (announcement.status === 'approved' ? 'text-green-600' :
                                  announcement.status === 'rejected' ? 'text-red-600' : 'text-gray-500')
                               }>
                                 {announcement.status === 'approved' && 'Postat'}
                                 {announcement.status === 'pending' && 'Asteapta aprobarea'}
                                 {announcement.status === 'rejected' && 'Respins'}
                               </span>
                             </div>
                           )}

                        </div>
                      </div>

                      {/* Announcement Details Area (Remaining space) */}
                      <div className="flex-1 mt-4 text-sm text-gray-700">
                        {/* Display Location, Job Type, Salary */}
                        {announcement.location && <p className="mb-1"><strong>Locație:</strong> {announcement.location}</p>}
                        {announcement.jobType && <p className="mb-1"><strong>Tip job:</strong> {announcement.jobType.charAt(0).toUpperCase() + announcement.jobType.slice(1)}</p>}
                        {announcement.salary && <p className="mb-1"><strong>Salariu:</strong> {announcement.salary}</p>}

                        {/* Display application deadline */}
                        <p className="text-gray-600 text-xs mt-2">Data limită aplicare: {formatDate(announcement.applicationDeadline)}</p>
                        {/* Add more announcement details */}

                        {/* Details Button */}
                        <div className="mt-4 flex space-x-2"> {/* Added flex and space-x-2 for buttons */}
                          <button
                            className="px-4 py-2 bg-[#0056a0] text-white rounded-md hover:bg-[#003f7a] transition-colors text-sm"
                            onClick={() => handleViewDetails(announcement)}
                          >
                            Detalii
                          </button>

                          {/* Apply Button (only for students and if not already applied - basic check) */}
                          {userType === 'student' && !applications.some(app => app.jobId === announcement.id && app.studentId === user?.uid) && (
                             <button
                               className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                               onClick={() => handleApplyFromCard(announcement.id, announcement.companyId)}
                             >
                               Aplică
                             </button>
                          )}

                          {/* Edit and Delete Buttons (only for the posting company) */}
                          {user && user.uid === announcement.companyId && (
                            <div className="flex space-x-2"> {/* Wrapped in a div to maintain spacing if Apply button is not present */}
                              {/* Edit Button */}
                              <button
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                                onClick={() => handleEditAnnouncement(announcement)}
                              >
                                Editează
                              </button>
                              {/* Delete Button */}
                              <button
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                                onClick={() => handleDeleteAnnouncement(announcement.id)}
                              >
                                Șterge
                              </button>
                            </div>
                          )}

                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : dashboardContent === 'createAnnouncement' && userType === 'company' ? (
            <CreateAnnouncementForm
              onAnnouncementAdded={() => {
                setAnnouncementAddedSuccess(true);
                setDashboardContent('announcementsList');
                fetchUserDataAndAnnouncements(); // Refresh list after adding/editing
              }}
              announcementToEdit={announcementToEdit}
            />
          ) : dashboardContent === 'profile' ? ( // Render ProfileView when dashboardContent is 'profile'
            <ProfileView />
          ) : (
            <div className="text-center text-gray-600 text-xl mt-10 p-6 bg-white rounded-lg shadow-sm">
              <p>Selectați o opțiune din meniul lateral.</p> {/* Fallback message */}
            </div>
          )}

          {/* Announcement Details Modal */}
          {showAnnouncementModal && selectedAnnouncement && (
            <AnnouncementDetailsModal
              announcement={selectedAnnouncement}
              onClose={handleCloseModal}
              userType={userType}
              userId={user ? user.uid : ''}
            />
          )}

          {/* Student Profile Modal */}
          {showStudentProfileModal && selectedStudentProfile && (
            <div className="fixed inset-0 overflow-y-auto h-full w-full z-50 flex justify-center items-center backdrop-filter backdrop-blur-lg">
              <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3 text-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Profil Student</h3>
                  <div className="mt-2 px-7 py-3 text-left text-sm text-gray-700">
                    {selectedStudentProfile.firstName && selectedStudentProfile.lastName && (
                      <p className="mb-2"><strong>Nume:</strong> {selectedStudentProfile.lastName} {selectedStudentProfile.firstName}</p>
                    )}
                    {selectedStudentProfile.email && (
                       <p className="mb-2 flex items-center"><FaEnvelope className="mr-2 text-blue-500" /><strong>Email: </strong>{selectedStudentProfile.email}</p>
                    )}
                    
                    {selectedStudentProfile.education && selectedStudentProfile.education.length > 0 && (
                      <div className="mt-4">
                        <p className="font-semibold text-gray-900 flex items-center"><FaGraduationCap className="mr-2 text-green-500" />Educație:</p>
                        <ul className="list-disc list-inside ml-4">
                          {selectedStudentProfile.education.map((edu, index) => (
                            <li key={index} className="mb-1">
                              {edu.university} - {edu.specialization} ({edu.startDate.toDate().toLocaleDateString()} - {edu.endDate.toDate().toLocaleDateString()})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                     {selectedStudentProfile.experience && selectedStudentProfile.experience.length > 0 && (
                      <div className="mt-4">
                        <p className="font-semibold text-gray-900 flex items-center"><FaTools className="mr-2 text-purple-500" />Experiență:</p>
                        <ul className="list-disc list-inside ml-4">
                          {selectedStudentProfile.experience.map((exp, index) => (
                            <li key={index} className="mb-1">
                              {exp.title} la {exp.company} ({exp.startDate.toDate().toLocaleDateString()} - {exp.isPresent ? 'Prezent' : exp.endDate.toDate().toLocaleDateString()})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                     {selectedStudentProfile.skills && selectedStudentProfile.skills.length > 0 && (
                      <div className="mt-4">
                         <p className="font-semibold text-gray-900">Skill-uri:</p>
                         <p>{selectedStudentProfile.skills.join(', ')}</p>
                      </div>
                     )}

                  </div>
                  <div className="items-center px-4 py-3">
                    <button
                      id="close-student-profile-btn"
                      onClick={handleCloseStudentProfileModal}
                      className="px-4 py-2 bg-[#0056a0] text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-[#003f7a] focus:outline-none focus:ring-2"
                    >
                      Închide
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 