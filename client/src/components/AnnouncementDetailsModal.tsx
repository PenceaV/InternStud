import React from 'react';
import { Timestamp } from 'firebase/firestore';

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

interface AnnouncementDetailsModalProps {
  announcement: Announcement;
  onClose: () => void;
  userType: string;
  userId: string;
  // Add new props for student-specific actions and status
  onApply?: (announcementId: string, companyId: string) => Promise<void>; // Optional apply handler for students
  studentApplicationStatus?: 'pending' | 'approved' | 'rejected'; // Optional status for students
  onPrepareForInterviewModal?: (jobId: string) => void; // Optional handler to prepare for interview
}

const AnnouncementDetailsModal: React.FC<AnnouncementDetailsModalProps> = ({ announcement, onClose, userType, userId, onApply, studentApplicationStatus, onPrepareForInterviewModal }) => {
  // Function to format Firestore Timestamp to a readable date string
  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString('ro-RO'); // Format as DD/MM/YYYY
  };

  return (
    <div className="fixed inset-0 overflow-y-auto h-full w-full z-50 flex justify-center items-center backdrop-filter backdrop-blur-lg p-4">
      <div className="relative p-8 border mt-72 w-[1300px] max-w-[95vw] shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-2xl font-bold text-[#1B263B] mb-6">{announcement.title}</h3>
          
          <div className="space-y-4">
            <p className="text-base text-gray-700"><strong className="text-[#1B263B]">Companie:</strong> {announcement.companyName}</p>
            <div>
              <p className="text-base text-gray-700 mb-2"><strong className="text-[#1B263B]">Descriere:</strong></p>
              <p className="text-base text-gray-700 whitespace-pre-wrap">{announcement.description}</p>
            </div>
            <p className="text-base text-gray-700"><strong className="text-[#1B263B]">Locație:</strong> {announcement.location}</p>
            <p className="text-base text-gray-700"><strong className="text-[#1B263B]">Tip job:</strong> {announcement.jobType}</p>
            {announcement.salary && <p className="text-base text-gray-700"><strong className="text-[#1B263B]">Salariu:</strong> {announcement.salary}</p>}
            <div>
              <p className="text-base text-gray-700 mb-2"><strong className="text-[#1B263B]">Cerințe:</strong></p>
              <p className="text-base text-gray-700 whitespace-pre-wrap">{announcement.requirements}</p>
            </div>
            {announcement.benefits && (
              <div>
                <p className="text-base text-gray-700 mb-2"><strong className="text-[#1B263B]">Beneficii:</strong></p>
                <p className="text-base text-gray-700 whitespace-pre-wrap">{announcement.benefits}</p>
              </div>
            )}
            <p className="text-base text-gray-700"><strong className="text-[#1B263B]">Data Limită Aplicare:</strong> {formatDate(announcement.applicationDeadline)}</p>

            {/* Display Status */}
            {userType === 'company' && userId === announcement.companyId && announcement.status && (
              <p className={
                `text-base font-semibold ` +
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
          
          <div className="mt-8">
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