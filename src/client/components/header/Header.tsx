import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './Header.module.css'
import { useAppContext, userPages } from '../../App';
import NotificationBell from './NotificationBell';
import { users } from '../../../db/users';
import { useMobile } from '../../hooks/useMobile';

const Header: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const user = users.find(u => u.username === userId); // Fetch user data based on userId
  const isMobile = useMobile();

  const navigate = useNavigate();
    const { userLicense } = useAppContext();

  if (!user) {
    return null;
  }

  const handlePageChange = (newPage: string) => {
    navigate(`${newPage.toLowerCase().replace(' ', '-')}`);
  };

  return (
    <>
      <div className={`${styles.header} ${isMobile ? styles.mobile : ''}`}>
        <nav>
          <div>
            <ul>
              <li>
                <img className={styles.logo} src={`/${user.companyLogo}`} />
              </li>
              {userPages(user).map((page) => {
                return (
                  <li
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={styles.navItem}
                  >
                    {page}
                  </li>
                )
              })}
            </ul>
          </div>
          <div>
            <ul>
              <li>
                {(userLicense === 'Premium' ) && <NotificationBell />}
              </li>
              <li>
                <img key={'Avatar'} className={styles.avatar} src={`/${user?.username}.png`} onClick={() => navigate('/')} />
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </>
  );
};

export default Header;
