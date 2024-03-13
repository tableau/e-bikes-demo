import React from 'react';
import styles from './Header.module.css'
import { Pages } from './App';

interface HeaderProps {
  page: string;
  onPageChange: (e: { newPage: Pages }) => void;
}

const Header: React.FC<HeaderProps> = ({ page, onPageChange }) => {
  return (
    <div className={styles.header}>
      <nav>
        <div >
          <ul>
            <li>
              <img className={styles.logo} src='src/assets/ebikes-logo.png' />
            </li>
            {(['Home', 'Analytics', 'Pulse'] as Pages[]).map((pageBuilder) => {
              return (
                <li
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
            <img className={styles.avatar} src='src/assets/MacKinzie.png' />
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );
};

export default Header;
