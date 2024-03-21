import React from 'react';
import styles from './Header.module.css'
import { Pages, useAppContext, userPages } from './App';

interface HeaderProps {
  selectedPage: string;
  onPageChange: (e: { newPage: Pages }) => void;
}

const Header: React.FC<HeaderProps> = ({ selectedPage, onPageChange }) => {

  const { user, login, notificationCount } = useAppContext();

  if (!user) {
    return null;
  }

  const logo = (() => {
    switch (user.username) {
      case 'Mario': return 'ebikes-logo.png';
      case 'McKenzie': return 'Wheelworks-logo.png';
    }
  })

  return (
    <div className={styles.header}>
      <nav>
        <div >
          <ul>
            <li>
              <img className={styles.logo} src={`${logo()}`} />
            </li>
            {userPages(user).map((page) => {
              return (
                <li
                  key={page}
                  className={page === selectedPage ? styles.active : ''}
                  onClick={() => onPageChange({ newPage: page })}
                >
                  {page}
                </li>
              )
            })}
          </ul>
        </div>
        <div >
          <ul>
            <li>
              <div className={styles.notificationContainer}>
                <div className={styles.notificationIcon}>
                  <img key={'Notification'} className={styles.notification} src={`notification.png`} onClick={() => login(undefined)} />
                </div>
                {notificationCount > 0 &&
                  <div className={styles.notificationCount}>{notificationCount}</div>
                }
              </div>
            </li>
            <li>
              <img key={'Avatar'} className={styles.avatar} src={`${user?.username}.png`} onClick={() => login(undefined)} />
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );
};

export default Header;
