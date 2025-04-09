import React, { useEffect } from 'react';
import styles from './NotificationWindow.module.css';
import { useNavigate, useParams } from 'react-router-dom';

export type NotificationItem = { title: string, message: string };

const NotificationWindow: React.FC<{ notifications: NotificationItem[], onClose: () => void }> = ({ notifications, onClose }) => {

    const { userId } = useParams<{ userId: string }>();
  
    const navigate = useNavigate();

    const analyze = () => {
        navigate(`/${userId}/Analyze`);
        onClose();
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {

            const target = event.target as HTMLElement;
            const popupContainer = document.querySelector(styles.container);

            // Check if the click event occurred outside the popup window            
            //if ((event.target as HTMLElement).closest(styles.container) === null) {
            if (!popupContainer?.contains(target) && !target.closest('#notificationBell')) {
                onClose();
            }
        };

        // Add event listener when the component mounts
        document.body.addEventListener('click', handleClickOutside);

        // Remove event listener when the component unmounts
        return () => {
            document.body.removeEventListener('click', handleClickOutside);
        };
    }, [onClose]);

    return (
        <div className={styles.container}>
            {
                notifications.map(notification => (
                    <div className={styles.notifcation} key={notification.message}>
                        <div className={styles.title}>{notification.title}</div>
                        <div className={styles.message}>{notification.message}</div>
                        <div className={styles.actions}>
                            <a className={styles.analyze} onClick={analyze}>Analyze</a>
                        </div>
                    </div>
                ))
            }
        </div>
    );
}

export default NotificationWindow;
