import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { useState, useEffect } from 'react';

interface ProtectedRouteProps {
  children?: React.ReactElement; // Use children for the element to render
  adminOnly?: boolean; // Optional prop to indicate if the route is for admins only
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const [user, loadingAuth] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAdminCheck, setLoadingAdminCheck] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false); // Ensure isAdmin is false if no user
        setLoadingAdminCheck(false);
        return;
      }

      if (adminOnly) {
        const userDocRef = doc(db, 'users', user.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists() && userDoc.data()?.isAdmin) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch (err) {
          console.error("Error checking admin status:", err);
          setIsAdmin(false); // Assume not admin on error
        } finally {
          setLoadingAdminCheck(false);
        }
      } else {
        // Not an admin-only route, no need to check admin status
        setIsAdmin(false); // Ensure isAdmin is false for non-admin routes
        setLoadingAdminCheck(false); // Admin check is not applicable
      }
    };

    if (!loadingAuth) {
        checkAdminStatus();
    }

  }, [user, loadingAuth, adminOnly]); // Depend on user, loadingAuth, and adminOnly

  // Show loading until authentication state is determined AND admin check is done for adminOnly routes
  if (loadingAuth || (adminOnly && loadingAdminCheck)) {
      console.log('ProtectedRoute: Still loading...', { loadingAuth, loadingAdminCheck, adminOnly });
      return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  }

  if (!user) {
    // Not authenticated after loadingAuth is false
    console.log('ProtectedRoute: Not authenticated, redirecting to login.');
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    // Authenticated but not admin, trying to access admin route
    console.log('ProtectedRoute: Authenticated but not admin, redirecting to home.');
    return <Navigate to="/" replace />;
  }

  // Authenticated and either not adminOnly or is admin
  console.log('ProtectedRoute: Access granted.');
  return children ? children : <Outlet />;
};

export default ProtectedRoute; 