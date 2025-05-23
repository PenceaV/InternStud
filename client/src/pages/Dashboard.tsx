import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { FaUserGraduate, FaHome, FaBriefcase, FaUserCircle, FaRocket, FaCog, FaPowerOff, FaFilter } from 'react-icons/fa';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import CreateAnnouncementForm from '../components/CreateAnnouncementForm';

interface Announcement {
  id: string;
  title: string;
  companyName: string;
  // Add other announcement fields as needed (e.g., description, location, type)
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

  const [dashboardContent, setDashboardContent] = useState<'announcementsList' | 'createAnnouncement'>('announcementsList'); // State to control main content

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

  useEffect(() => {
    console.log('Dashboard useEffect running. user:', user, 'loadingAuth:', loadingAuth);
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

    fetchUserDataAndAnnouncements();
  }, [user]); // Rerun when user changes

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

  // Placeholder UI based on the provided image style
  return (
    <div className="min-h-screen bg-gray-200 flex antialiased">
      {/* Sidebar */}
      <div className="w-64 bg-[#1B263B] text-gray-300 p-6 space-y-6 flex flex-col shadow-lg fixed left-0 top-0 bottom-0 overflow-y-auto">
        <div className="flex items-center space-x-4">
          {/* User Icon and Name */}
          <div className="flex flex-col items-center w-full">
            {/* User Icon - Using FaUserGraduate for students, might need conditional rendering for companies */}
            <div className="w-25 h-25 rounded-full bg-[#004080] flex items-center justify-center text-3xl text-white mb-2">
              <FaUserGraduate /> {/* Or a company icon based on userType */}
            </div>
            {/* Display name based on user type */}
            <div className="text-center">
              {userName ? (
                userType === 'student' && userName.lastName && userName.firstName ? (
                  <span className="block text-lg font-bold text-gray-100 truncate px-2">{userName.lastName} {userName.firstName}</span>
                ) : userType === 'company' && userName.companyName ? (
                  <span className="block text-lg font-bold text-gray-100 truncate px-2">{userName.companyName}</span>
                ) : (
                  <span className="block text-lg font-bold text-gray-100 truncate px-2">Utilizator</span> // Fallback for unknown type or missing name data
                )
              ) : (
                <span className="block text-lg font-bold text-gray-100 truncate px-2">Încărcare nume...</span> // Loading state for name
              )}
            </div>
          </div>
        </div>
        {/* Navigation Links */}
        <nav className="space-y-2 flex-grow mt-6 text-sm">
           {/* Profilul Meu (Common, moved to top) */}
           <a href="#" className="flex items-center space-x-3 py-2.5 px-4 rounded transition duration-200 hover:bg-[#0056a0] text-gray-300">
              <FaUserCircle className="text-xl text-gray-400" /><span>Profilul meu</span>
           </a>

           <a href="#" className="flex items-center space-x-3 py-2.5 px-4 rounded transition duration-200 hover:bg-[#0056a0] text-gray-300">
              <FaHome className="text-xl text-gray-400" /><span>Ce este nou</span>
           </a>

           {userType === 'student' ? (
               <>
                   {/* Student Specific Links */}
                   <a href="#" className="flex items-center space-x-3 py-2.5 px-4 rounded transition duration-200 bg-[#0056a0] text-white">
                     <FaBriefcase className="text-xl text-white" /><span>Anunțuri de Joburi</span>
                   </a>
                   <a href="#" className="flex items-center space-x-3 py-2.5 px-4 rounded transition duration-200 hover:bg-[#0056a0] text-gray-300">
                     <FaRocket className="text-xl text-gray-400" /><span>Provocări</span>
                   </a>
               </>
           ) : userType === 'company' ? (
               <>
                   {/* Company Specific Links */}
                   <a href="#" className={`flex items-center space-x-3 py-2.5 px-4 rounded transition duration-200 hover:bg-[#0056a0] ${dashboardContent === 'announcementsList' ? 'bg-[#0056a0] text-white' : 'text-gray-300'}`}
                     onClick={(e) => { e.preventDefault(); setDashboardContent('announcementsList'); }}>
                     <FaBriefcase className="text-xl text-gray-400" /><span>Anunțurile Mele</span> {/* Changed text */}
                   </a>
                   <a href="#" className={`flex items-center space-x-3 py-2.5 px-4 rounded transition duration-200 hover:bg-[#0056a0] ${dashboardContent === 'createAnnouncement' ? 'bg-[#0056a0] text-white' : 'text-gray-300'}`}
                     onClick={(e) => { e.preventDefault(); setDashboardContent('createAnnouncement'); }}>
                     <FaBriefcase className="text-xl text-gray-400" /><span>Adaugă Anunț Nou</span> {/* New link */}
                   </a>
               </>
           ) : null /* Handle other user types or loading state */}
        </nav>

        {/* Bottom Links */}
        <div className="border-t border-gray-700 pt-4 space-y-2 mt-auto"> {/* Removed Settings link */}
            {/* Disconnect Link */}
            <a href="#" className="flex items-center space-x-3 py-2.5 px-4 rounded transition duration-200 hover:bg-red-700 text-gray-300" onClick={handleLogout}>
               <FaPowerOff className="text-xl text-gray-400" /><span>Deconectează-te</span>
            </a>
         </div>
      </div>

      {/* Main Content Wrapper to create space for fixed sidebar */}
      <div className="flex-1 pl-64">
        {/* Main Content Area - now has its own scrollbar */}
        <div className="p-8 bg-gray-100 h-screen overflow-y-auto">
          {/* Conditionally render content based on dashboardContent state */}
          {dashboardContent === 'announcementsList' ? (
            <>
              <h1 className="text-2xl font-bold text-[#1B263B] mb-6">Anunțuri de Joburi</h1>
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
                return matchesSearch && matchesCompany;
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
                    return matchesSearch && matchesCompany;
                  }).map((announcement) => (
                    <div key={announcement.id} className="bg-white p-6 rounded-lg shadow-md">
                      <h3 className="text-lg font-semibold text-[#1B263B]">{announcement.title}</h3>
                      <p className="text-gray-600">Company: {announcement.companyName}</p>
                      {/* Add more announcement details */}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : dashboardContent === 'createAnnouncement' && userType === 'company' ? (
            <CreateAnnouncementForm />
          ) : (
            <div className="text-center text-gray-600 text-xl mt-10 p-6 bg-white rounded-lg shadow-sm">
              <p>Selectați o opțiune din meniul lateral.</p> {/* Fallback message */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 