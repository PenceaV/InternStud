import React from 'react';
import { Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { collection, addDoc, query, where, getDocs, getDoc, doc } from 'firebase/firestore';

// Define the interface for the Announcement data (should match the one in Dashboard.tsx)
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
  status?: 'pending' | 'approved' | 'rejected'; // Add the status field
}

// Model pentru aplicație
interface Application {
  id?: string;
  jobId: string;
  studentId: string;
  companyId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

// Model pentru notificare
interface Notification {
  id?: string;
  userId: string;
  type: 'application' | 'approval' | 'rejection';
  message: string;
  read: boolean;
  data?: any;
  createdAt: Date;
}

interface AnnouncementDetailsModalProps {
  announcement: Announcement;
  onClose: () => void;
  userType: string;
  userId: string;
}

const AnnouncementDetailsModal: React.FC<AnnouncementDetailsModalProps> = ({ announcement, onClose, userType, userId }) => {
  const [applied, setApplied] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    // Verifică dacă studentul a aplicat deja
    const checkIfApplied = async () => {
      if (userType !== 'student') return;
      const q = query(
        collection(db, 'applications'),
        where('jobId', '==', announcement.id),
        where('studentId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) setApplied(true);
    };
    checkIfApplied();
  }, [announcement.id, userId, userType]);

  // Function to format Firestore Timestamp to a readable date string
  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString('ro-RO'); // Format as DD/MM/YYYY
  };

  const handleApply = async () => {
    setLoading(true);
    try {
      // Verifică din nou dacă există deja aplicație (pentru siguranță)
      const q = query(
        collection(db, 'applications'),
        where('jobId', '==', announcement.id),
        where('studentId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setApplied(true);
        setSuccessMsg('Ai aplicat deja la acest job!');
        setLoading(false);
        return;
      }
      // Creează aplicația
      await addDoc(collection(db, 'applications'), {
        jobId: announcement.id,
        studentId: userId,
        companyId: announcement.companyId,
        status: 'pending',
        createdAt: Timestamp.now(),
      });
      setApplied(true);
      setSuccessMsg('Ai aplicat cu succes!');

      // Fetch student name for notification
      let studentName = 'Un Student'; // Default name if fetch fails
      try {
        const studentDoc = await getDoc(doc(db, 'users', userId));
        if (studentDoc.exists()) {
          const studentData = studentDoc.data();
          studentName = `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim() || studentName;
        }
      } catch (studentFetchErr) {
        console.error("Error fetching student data for notification:", studentFetchErr);
      }

      // Creează notificare pentru companie
      await addDoc(collection(db, 'notifications'), {
        userId: announcement.companyId,
        type: 'application',
        message: `${studentName} a aplicat la jobul "${announcement.title}"`,
        read: false,
        data: {
          jobId: announcement.id,
          studentId: userId,
        },
        createdAt: Timestamp.now(),
      });
    } catch (err) {
      setSuccessMsg('Eroare la aplicare. Încearcă din nou.');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 overflow-y-auto h-full w-full z-50 flex justify-center items-center backdrop-filter backdrop-blur-lg">
      <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">{announcement.title}</h3>
          <div className="mt-2 px-7 py-3">
            {/* Display all announcement details here */}
            <p className="text-sm text-gray-500 text-left mb-2"><strong>Companie:</strong> {announcement.companyName}</p>
            <p className="text-sm text-gray-500 text-left mb-2"><strong>Descriere:</strong> {announcement.description}</p>
            <p className="text-sm text-gray-500 text-left mb-2"><strong>Locație:</strong> {announcement.location}</p>
            <p className="text-sm text-gray-500 text-left mb-2"><strong>Tip job:</strong> {announcement.jobType}</p>
            {announcement.salary && <p className="text-sm text-gray-500 text-left mb-2"><strong>Salariu:</strong> {announcement.salary}</p>}
            <p className="text-sm text-gray-500 text-left mb-2"><strong>Cerințe:</strong> {announcement.requirements}</p>
            {announcement.benefits && <p className="text-sm text-gray-500 text-left mb-2"><strong>Beneficii:</strong> {announcement.benefits}</p>}
            <p className="text-sm text-gray-500 text-left mb-2"><strong>Data Limită Aplicare:</strong> {formatDate(announcement.applicationDeadline)}</p>

            {/* Display Status */}
            {userType === 'company' && userId === announcement.companyId && announcement.status && (
              <p className={
                `text-sm text-left mb-2 font-semibold ` +
                (announcement.status === 'approved' ? 'text-green-600' :
                 announcement.status === 'rejected' ? 'text-red-600' : 'text-gray-500')
              }>
                <strong>Status:</strong>
                {announcement.status === 'approved' && ' Postat'}
                {announcement.status === 'pending' && ' Asteapta aprobarea'}
                {announcement.status === 'rejected' && ' Respins'}
              </p>
            )}

          </div>
          {/* Buton Aplică doar pentru studenți (UI only, fără logică încă) */}
          {/* Removed Apply Button from Modal */}
          {/*
          {userType === 'student' && (
            <div className="items-center px-4 py-3">
              {successMsg && <div className="mb-2 text-green-700 font-semibold text-sm">{successMsg}</div>}
              <button
                className="px-4 py-2 bg-green-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2"
                onClick={handleApply}
                disabled={applied || loading}
              >
                {applied ? 'Ai aplicat' : loading ? 'Se aplică...' : 'Aplică'}
              </button>
            </div>
          )}
          */}
          <div className="items-center px-4 py-3">
            <button
              id="ok-btn"
              onClick={onClose}
              className="px-4 py-2 bg-[#0056a0] text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-[#003f7a] focus:outline-none focus:ring-2"
            >
              Închide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementDetailsModal; 