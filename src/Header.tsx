import React from 'react';
import styles from './Header.module.css'
import { Pages, useUser } from './App';

interface HeaderProps {
  page: string;
  onPageChange: (e: { newPage: Pages }) => void;
}

const Header: React.FC<HeaderProps> = ({ page, onPageChange }) => {

  const {user, login} = useUser();

  const logo = (() => {
    switch (user) {
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
            {(['Home', 'Catalog', 'Analytics', 'Pulse', 'Co-pilot'] as Pages[]).map((pageBuilder) => {
              return (
                <li
                key={pageBuilder}  
                className={page === pageBuilder ? styles.active : ''}
                  onClick={() => onPageChange({ newPage: pageBuilder })}
                >
                  {pageBuilder}
                </li>
              )
            })}
          </ul>
        </div>
        <div >
          <ul>
            <li>
            <img key={'Avatar'} className={styles.avatar} src={`${user}.png`} onClick={() => login(undefined)} />
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );
};

export default Header;
