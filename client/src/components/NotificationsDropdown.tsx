import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, updateDoc, orderBy, limit, onSnapshot, deleteDoc, writeBatch } from 'firebase/firestore';
import { FaBell, FaCheck, FaTimes } from 'react-icons/fa';
import { Timestamp } from 'firebase/firestore';

interface Notification {
  id: string;
  userId: string;
  type: 'application' | 'approval' | 'rejection';
  message: string;
  read: boolean;
  data?: {
    jobId?: string;
    applicationId?: string;
  };
  createdAt: Date;
}

interface NotificationsDropdownProps {
  userId: string;
  onNotificationClick?: (notification: Notification) => void;
}

const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ userId, onNotificationClick }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifications = () => {
      if (!userId) return;

      try {
        const q = query(
          collection(db, 'notifications'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(10)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const notificationsList: Notification[] = [];
          let unread = 0;

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            const notification: Notification = {
              id: doc.id,
              userId: data.userId,
              type: data.type,
              message: data.message,
              read: data.read,
              data: data.data,
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
            };
            notificationsList.push(notification);
            if (!notification.read) unread++;
          });

          setNotifications(notificationsList);
          setUnreadCount(unread);
        }, (error) => {
          console.error("Error fetching real-time notifications:", error);
        });

        return unsubscribe;
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    fetchNotifications();
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
      
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      const updatePromises = unreadNotifications.map(notification =>
        updateDoc(doc(db, 'notifications', notification.id), { read: true })
      );
      
      await Promise.all(updatePromises);
      
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
      
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await deleteDoc(notificationRef);
      // UI will update automatically due to onSnapshot
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const handleDeleteAllNotifications = async () => {
    if (notifications.length === 0) return;

    try {
      const batch = writeBatch(db);
      // Fetch all notifications for the user (onSnapshot query is limited, need a separate query for all)
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      // UI will update automatically due to onSnapshot
    } catch (err) {
      console.error("Error deleting all notifications:", err);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-black hover:text-[#2561A9] focus:outline-none transition duration-200"
      >
        <FaBell className="text-2xl" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      <div
        className={`fixed w-80 bg-white rounded-lg shadow-lg z-50 origin-top-left
                   transition transition-opacity transition-transform ease-out duration-300 transform
                   ${isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
      >
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">Notificări</h3>
          {notifications.length > 0 && (
            <button
              onClick={handleDeleteAllNotifications}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Șterge Toate
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Nu ai notificări
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b border-gray-200 cursor-pointer ${
                  !notification.read ? 'bg-blue-50' : ''
                } hover:bg-gray-100`}
                onClick={() => { console.log('Notification row clicked in dropdown', notification); handleNotificationClick(notification); }}
              >
                <div className="flex justify-between items-start">
                  <p className="text-sm text-gray-900 flex-grow mr-2">{notification.message}</p>
                  <div className="flex items-center">
                    {!notification.read && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification.id); }}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                      >
                        <FaCheck className="text-sm" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteNotification(notification.id); }}
                      className="ml-2 text-gray-400 hover:text-red-600"
                    >
                      <FaTimes className="text-sm" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {notification.createdAt.toLocaleDateString('ro-RO', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsDropdown; 