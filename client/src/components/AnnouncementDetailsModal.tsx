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
}

const AnnouncementDetailsModal: React.FC<AnnouncementDetailsModalProps> = ({ announcement, onClose }) => {
  // Function to format Firestore Timestamp to a readable date string
  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString('ro-RO'); // Format as DD/MM/YYYY
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
            <p className="text-sm text-gray-500 text-left mb-2"><strong>Tip Job:</strong> {announcement.jobType}</p>
            {announcement.salary && <p className="text-sm text-gray-500 text-left mb-2"><strong>Salariu:</strong> {announcement.salary}</p>}
            <p className="text-sm text-gray-500 text-left mb-2"><strong>Cerințe:</strong> {announcement.requirements}</p>
            {announcement.benefits && <p className="text-sm text-gray-500 text-left mb-2"><strong>Beneficii:</strong> {announcement.benefits}</p>}
            <p className="text-sm text-gray-500 text-left mb-2"><strong>Data Limită Aplicare:</strong> {formatDate(announcement.applicationDeadline)}</p>

            {/* Display Status */}
            {announcement.status && (
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