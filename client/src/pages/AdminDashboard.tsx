import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import { FaBuilding } from 'react-icons/fa';

interface CompanyUser {
  id: string;
  companyName: string;
  email: string;
  website?: string;
  industry?: string;
  companySize?: string;
  companyType?: string;
  tagline?: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  logoUrl?: string;
  // Add other fields as needed
}

// Helper function to format Company Type string (e.g., add space before caps)
const formatCompanyType = (type: string | undefined): string => {
    if (!type) return '';
    // Add a space before all uppercase letters that are not at the beginning of the string
    return type.replace(/([A-Z])/g, ' $1').trim();
};

const AdminDashboard: React.FC = () => {
  const [pendingCompanies, setPendingCompanies] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserType, setCurrentUserType] = useState<string | null>(null);
  const [currentUserStatus, setCurrentUserStatus] = useState<string | null>(null);
  const [user, loadingAuth] = useAuthState(auth);
  const navigate = useNavigate();

  // Basic check for admin user - replace with proper role-based access control
  useEffect(() => {
    const checkAdmin = async () => {
      if (!loadingAuth && !user) {
        // Not authenticated, redirect to login
        navigate('/login');
        return;
      }

      if (user) {
        // Check for admin role in user document
        const userDocRef = doc(db, 'users', user.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setIsAdmin(userData.isAdmin || false); // Assume not admin if field is missing
            setCurrentUserType(userData.userType || null);
            setCurrentUserStatus(userData.status || null);

            if (userData.isAdmin) {
              fetchPendingCompanies(); // Fetch data only if admin
            } else {
              setLoading(false); // Stop loading if not admin
            }
          } else {
            // User document does not exist - unexpected for an authenticated user
            console.error("User document not found for authenticated user!");
            setError('Date utilizator incomplete.');
            setIsAdmin(false);
            setLoading(false);
          }
        } catch (err: any) {
          console.error("Error checking admin status:", err);
          setError('Failed to check admin status: ' + err.message);
          setIsAdmin(false); // Assume not admin on error
          setLoading(false); // Stop loading on error
        }
      }
    };

    checkAdmin();

  }, [user, loadingAuth, navigate]);

  const fetchPendingCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const companiesRef = collection(db, 'users');
      const q = query(companiesRef, where('userType', '==', 'company'), where('status', '==', 'pending'));
      const querySnapshot = await getDocs(q);

      const companiesList: CompanyUser[] = [];
      querySnapshot.forEach((doc) => {
        companiesList.push({ ...doc.data() as CompanyUser, id: doc.id });
      });
      setPendingCompanies(companiesList);
    } catch (err: any) {
      console.error("Error fetching pending companies:", err);
      setError('Failed to fetch pending companies: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (companyId: string) => {
    // TODO: Implement logic to update status to 'approved'
    console.log(`Approve company with ID: ${companyId}`);
    try {
        const companyRef = doc(db, 'users', companyId);
        await updateDoc(companyRef, {
            status: 'approved',
            profileCompleted: true, // Mark as completed upon approval
        });
        // Refresh the list
        fetchPendingCompanies();
    } catch (err: any) {
        console.error("Error approving company:", err);
        setError('Failed to approve company: ' + err.message);
    }
  };

  const handleReject = async (companyId: string) => {
    // TODO: Implement logic to update status to 'rejected' and perhaps add a reason field
    console.log(`Reject company with ID: ${companyId}`);
     try {
        const companyRef = doc(db, 'users', companyId);
        await updateDoc(companyRef, {
            status: 'rejected',
            // Optional: add a reason for rejection
        });
        // Refresh the list
        fetchPendingCompanies();
    } catch (err: any) {
        console.error("Error rejecting company:", err);
        setError('Failed to reject company: ' + err.message);
    }
  };

  if (loadingAuth || loading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  }

  // Show pending message for company users with pending status
  if (user && currentUserType === 'company' && currentUserStatus === 'pending') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl font-bold text-[#1B263B] mb-4">Cererea de creare a profilului companiei a fost trimisă spre examinare.</h2>
        <p className="text-gray-600">Vă mulțumim! Vă vom notifica prin email odată ce profilul dumneavoastră este aprobat.</p>
      </div>
    );
  }

   // TODO: Add UI for unauthorized users if you implement proper role check
  if (!isAdmin) {
    return <div className="min-h-screen flex items-center justify-center text-red-500"><p>You are not authorized to view this page.</p></div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500"><p>Error: {error}</p></div>;
  }

  // Fallback for authenticated users who are not pending companies and not admins
  if (user && currentUserType !== 'company' && !isAdmin) {
     return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl font-bold text-[#1B263B] mb-4">Bun venit în contul tău!</h2>
        <p className="text-gray-600">Nu ai acces la panoul de administrare. Conținutul specific tipului tău de cont va fi disponibil aici.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0056a0] to-[#1B263B] text-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-white mb-8">Admin Dashboard</h1>

        {pendingCompanies.length === 0 ? (
          <div className="bg-white text-gray-800 p-6 rounded-lg shadow-md text-center">
            <p className="text-xl">Nu există profiluri de companie în așteptare.</p>
          </div>
        ) : (
          <ul className="space-y-6">
            {pendingCompanies.map((company) => (
              <li key={company.id} className="bg-white text-gray-800 p-6 rounded-lg shadow-md flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div className="flex-shrink-0 mr-6">
                  {company.logoUrl ? (
                    <img src={company.logoUrl} alt={`${company.companyName} Logo`} className="w-16 h-16 object-cover rounded-full border-2 border-[#0056a0]" />
                  ) : (
                    <div className="w-16 h-16 rounded-full border-2 border-gray-300 bg-gray-100 flex items-center justify-center text-gray-500 text-2xl">
                      <FaBuilding />
                    </div>
                  )}
                </div>
                <div className="flex-grow space-y-2">
                  <h2 className="text-xl font-semibold text-[#1B263B]">{company.companyName}</h2>
                  <p className="text-gray-600"><strong>Email:</strong> {company.email}</p>
                  {/* Display other relevant company info */}
                  {company.website && <p className="text-gray-600"><strong>Website:</strong> {company.website}</p>}
                  {company.industry && <p className="text-gray-600"><strong>Industrie:</strong> {company.industry}</p>}
                  {company.companySize && <p className="text-gray-600"><strong>Dimensiune:</strong> {company.companySize}</p>}
                  {company.companyType && <p className="text-gray-600"><strong>Tip:</strong> {formatCompanyType(company.companyType)}</p>}
                  {company.tagline && <p className="text-gray-600"><strong>Slogan:</strong> {company.tagline}</p>}
                  {company.description && <p className="text-gray-600"><strong>Descriere:</strong> {company.description}</p>}
                </div>
                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
                  <button
                    onClick={() => handleApprove(company.id)}
                    className="bg-green-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-green-700 transition-colors shadow-md"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(company.id)}
                    className="bg-red-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-red-700 transition-colors shadow-md"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 