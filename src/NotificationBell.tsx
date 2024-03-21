import React, { Fragment, useState } from 'react';
import styles from './NotificationBell.module.css';
import { useAppContext } from './App';
import NotificationWindow from './NotificationWindow';

const NotificationBell: React.FC = () => {

    const { notifications } = useAppContext();
    const [showPopup, setShowPopup] = useState(false);

    return (
        <Fragment>
            <div id={'notificationBell'} className={styles.notificationContainer}>
                <div className={styles.notificationIcon}>
                    <img key={'Notification'} className={styles.notification} src={`notification.png`} onClick={() => setShowPopup(prevShowPopup => !prevShowPopup)} />
                </div>
                {notifications.length > 0 &&
                    <div className={styles.notificationCount}>{notifications.length}</div>
                }
            {showPopup && <NotificationWindow notifications={notifications} onClose={() => setShowPopup(false)} />}
            </div>
        </Fragment>
    );
}

export default NotificationBell;
