import React from 'react';
import styles from './Header.module.css'
import { Pages, useAppContext, userPages } from '../../App';
import NotificationBell from './NotificationBell';

interface HeaderProps {
  selectedPage: string;
  onPageChange: (e: { newPage: Pages }) => void;
}

const Header: React.FC<HeaderProps> = ({ selectedPage, onPageChange }) => {

  const { user, login } = useAppContext();

  if (!user) {
    return null;
  }

  return (
    <div className={styles.header}>
      <nav>
        <div >
          <ul>
            <li>
              <img className={styles.logo} src={`${user.companyLogo}`} />
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
              {user.license === 'Premium'  && <NotificationBell />}
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
