import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import StudentProfileForm from '../components/StudentProfileForm';
import CompanyProfileForm from '../components/CompanyProfileForm';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';

const CreateProfile: React.FC = () => {
  const [userType, setUserType] = useState<'student' | 'company' | null>(null);
  const [profileCompleted, setProfileCompleted] = useState<boolean>(false);
  const [user, loadingAuth] = useAuthState(auth);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [errorProfile, setErrorProfile] = useState<string | null>(null); // Setăm inițial pe null
  const navigate = useNavigate();

  console.log('CreateProfile Component Rendered', { userType, profileCompleted, loadingAuth, loadingProfile, errorProfile, user: !!user });

  useEffect(() => {
    console.log('useEffect running', { user, loadingAuth });
    const fetchUserData = async () => {
      console.log('fetchUserData running');
      if (!user) {
        // Dacă utilizatorul nu este autentificat, redirecționează la login (ar trebui gestionat de ruta privata, dar este o verificare suplimentara)
        navigate('/login');
        return; // Oprim execuția
      }

      setLoadingProfile(true); // Setăm loading la true înainte de fetch
      const userDocRef = doc(db, 'users', user.uid);
      try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('User data fetched:', userData);
          setUserType(userData.userType);
          setProfileCompleted(userData.profileCompleted);

          // Dacă profilul este deja complet, redirecționează către dashboard
          if (userData.profileCompleted) {
            navigate('/dashboard');
          }

        } else {
          // Acest caz nu ar trebui să se întâmple dacă utilizatorul s-a înregistrat corect
          // Dar, pentru siguranță, gestionăm și acest scenariu
           // Putem decide cum gestionăm acest caz - ex: afișăm un mesaj de eroare sau cerem reînregistrarea/autentificarea
          console.log('User document not found');
          setErrorProfile('Date utilizator incomplete. Te rugăm să te înregistrezi din nou sau să contactezi suportul.');
           setUserType(null); // Nu avem tip de utilizator valid
        }
      } catch (err: any) {
        console.error("Eroare la citirea datelor utilizatorului:", err);
        setErrorProfile('A apărut o eroare la citirea datelor utilizatorului: ' + err.message);
         setUserType(null); // În caz de eroare, nu avem tip valid
      } finally {
        console.log('fetchUserData finished', { loadingProfile, errorProfile });
        setLoadingProfile(false); // Setăm loading la false indiferent de succes/eroare
      }
    };

    // Executăm fetchUserData doar după ce starea de autentificare a fost determinată și utilizatorul este autentificat
    if (!loadingAuth && user) {
       fetchUserData();
     } else if (!loadingAuth && !user) {
       // Dacă nu este autentificat după ce s-a terminat loadingAuth, redirecționează la login
        console.log('User not authenticated after loadingAuth');
        navigate('/login');
     }

  }, [user, loadingAuth, navigate]); // Dependențe pentru useEffect

  // Gestionarea stărilor de încărcare și eroare
  if (loadingAuth || loadingProfile) {
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

  // Afișează formularul corespunzător dacă profilul nu este complet și userType este determinat
   if (userType && !profileCompleted) {
    console.log('Rendering Profile Forms', { userType, profileCompleted });
    return (
      <div>
        <Navbar />
        {userType === 'student' && <StudentProfileForm userType={userType} />}
        {userType === 'company' && <CompanyProfileForm userType={userType} />}
      </div>
    );
  }

  // Cazul implicit sau dacă profilul este deja complet (deși ar trebui redirecționat mai sus)
  console.log('Rendering Null State', { userType, profileCompleted });
  return null; // Nu afișăm nimic dacă nu suntem în nicio stare de mai sus
};

export default CreateProfile; 