import React from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import styles from './Header.module.css'
import { useAppContext, userPages } from '../../App';
import NotificationBell from './NotificationBell';
import { users } from '../../../db/users';

const Header: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const user = users.find(u => u.username === userId); // Fetch user data based on userId

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
      <div className={styles.header}>
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
      <Outlet />
    </>
  );
};

export default Header;
