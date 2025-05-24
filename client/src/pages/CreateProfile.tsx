import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import StudentProfileForm from '../components/StudentProfileForm';
import CompanyProfileForm from '../components/CompanyProfileForm';
import { auth, db } from '../firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';

const CreateProfile: React.FC = () => {
  const [userType, setUserType] = useState<'student' | 'company' | null>(null);
  const [profileCompleted, setProfileCompleted] = useState<boolean>(false);
  const [profileStatus, setProfileStatus] = useState<'not_submitted' | 'pending' | 'approved' | 'rejected'>('not_submitted');
  const [user, loadingAuth] = useAuthState(auth);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [errorProfile, setErrorProfile] = useState<string | null>(null); // Setăm inițial pe null
  const navigate = useNavigate();

  console.log('CreateProfile Component Rendered', { userType, profileCompleted, loadingAuth, loadingProfile, errorProfile, user: !!user });

  useEffect(() => {
    console.log('useEffect running for snapshot listener', { user, loadingAuth });

    let unsubscribe = () => {}; // Placeholder for the unsubscribe function

    if (!loadingAuth && user) {
      const userDocRef = doc(db, 'users', user.uid);
      
      // Set up real-time listener
      unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
        console.log('Snapshot received:', docSnapshot.data());
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          setUserType(userData.userType);
          setProfileCompleted(userData.profileCompleted);

          // Read profile status for company users
          if (userData.userType === 'company') {
            setProfileStatus(userData.status || 'not_submitted');
          } else {
              // Reset status for non-company users or if status is missing
              setProfileStatus('not_submitted');
          }

          // Handle redirection based on user type and status
          if (userData.userType === 'company' && userData.status === 'pending') {
              // Stay on this page to show the 'under review' message after profile completion
              console.log('Company profile is pending, staying on create-profile page.');
          } else if (userData.profileCompleted && userData.userType === 'student') {
              // Redirect students immediately after profile completion
              console.log('Student profile completed, redirecting to dashboard.');
              navigate('/dashboard');
          } else if (userData.userType === 'company' && userData.status === 'approved') {
              // Redirect approved companies to dashboard
              console.log('Company profile approved, redirecting to dashboard.');
              navigate('/dashboard');
          }

          // Set loading to false after the first snapshot
          setLoadingProfile(false);

        } else {
          // User document does not exist
          console.log('User document not found in snapshot');
          setErrorProfile('Date utilizator incomplete. Te rugăm să te înregistrezi din nou sau să contactezi suportul.');
          setUserType(null);
          setProfileCompleted(false);
          setProfileStatus('not_submitted');
          setLoadingProfile(false);
        }
      }, (err: any) => {
        // Handle errors from the snapshot listener
        console.error("Error listening to user document:", err);
        setErrorProfile('A apărut o eroare la citirea datelor utilizatorului: ' + err.message);
        setLoadingProfile(false);
      });

    } else if (!loadingAuth && !user) {
      // If not authenticated after loadingAuth, redirect
      console.log('User not authenticated after loadingAuth, redirecting to login');
      navigate('/login');
      setLoadingProfile(false); // Stop loading if not authenticated
    }

    // Cleanup function to unsubscribe from the listener
    return () => {
      console.log('Unsubscribing from snapshot listener');
      unsubscribe();
    };

  }, [user, loadingAuth, navigate]); // Depend on user, loadingAuth, and navigate

  // Gestionarea stărilor de încărcare și eroare
  if (loadingAuth || (user && loadingProfile)) {
    console.log('Rendering Loading State');
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="loader"></div> {/* Roata de încărcare */}
        <p className="text-black text-xl mt-4">Se încarcă...</p>
      </div>
    );
  }

   if (errorProfile) {
    console.log('Rendering Error State', errorProfile);
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <p className="text-red-500 text-xl">Eroare: {errorProfile}</p>
         <button 
           onClick={() => navigate('/login')}
           className="mt-4 bg-[#0056a0] text-white px-4 py-2 rounded-md"
         >
           Înapoi la Autentificare
         </button>
      </div>
    );
  }

  // Afișează mesajul de pending pentru companii cu status 'pending' ȘI profil completat
  if (userType === 'company' && profileStatus === 'pending' && profileCompleted) {
    console.log('Rendering Pending State for Company');
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl font-bold text-[#1B263B] mb-4">Cererea de creare a profilului companiei a fost trimisă spre examinare.</h2>
        <p className="text-gray-600">Vă mulțumim! Vă vom notifica prin email odată ce profilul dumneavoastră este aprobat.</p>
      </div>
    );
  }

  // Afișează formularul corespunzător dacă userType este determinat și profilul NU este completat
  if (userType && !profileCompleted) {
    console.log('Rendering Profile Forms', { userType, profileCompleted, profileStatus });
    return (
      <div>
        <Navbar />
        {userType === 'student' && <StudentProfileForm userType={userType} />}
        {userType === 'company' && <CompanyProfileForm />}
      </div>
    );
  }

  // Cazul implicit sau dacă profilul este deja complet (deși ar trebui redirecționat mai sus)
  console.log('Rendering Null/Completed State', { userType, profileCompleted, profileStatus });
  return null; // Nu afișăm nimic dacă nu suntem în nicio stare de mai sus
};

export default CreateProfile; 