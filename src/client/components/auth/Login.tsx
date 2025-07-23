import { users } from '../../../db/users';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import LoginUser from './LoginUser';
import imagePath from '@/assets/CyclingGrass.jpg';
import { useAppContext } from '../../App';
import { useMobile } from '../../hooks/useMobile';

function Login() {

  const { updateUserLicense } = useAppContext();
  const navigate = useNavigate();
  const isMobile = useMobile();

  // Filter users based on device type
  const availableUsers = isMobile 
    ? users.filter(user => user.username === 'McKenzie')  // Only McKenzie on mobile
    : users;  // All users on desktop

  const handleUserLogin = (user: any) => {
    updateUserLicense(user.license);
    
    // On mobile, redirect McKenzie directly to AI Assistant
    if (isMobile && user.username === 'McKenzie') {
      navigate(`${user.username}/ai-assistant`);
    } else {
      // On desktop, redirect to Home as usual
      navigate(`${user.username}/Home`);
    }
  };

  return (
    <div className={styles.root} style={{ backgroundImage: `url(${imagePath})` }}>

      {
        availableUsers.map((user) => {
          return <LoginUser
            user={user}
            key={user.username}
            onClick={() => handleUserLogin(user)} />
        })
      }

      {/* Only show resources footer on desktop */}
      {!isMobile && (
        <div className={styles.footer}>
          <h3>Resources</h3>
          <ul>
            <li>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  window.open('/DemoScript', '_blank');
                }}
              >
                Demo script
              </a>
            </li>
            <li>
              <a href="https://github.com/tableau/e-bikes-demo" target="_blank">GitHub</a>
            </li>
            <li>
              <a href="https://developer.salesforce.com/tools/tableau/embedding-playground" target="_blank">Tableau Embedding Playground</a>
            </li>
            <li>
              <a href="https://help.tableau.com/current/api/embedding_api/en-us/index.html" target="_blank">Tableau Embedding Guide</a>
            </li>
            <li>
              <a href="https://www.tableau.com/developer" target="_blank">Tableau Developer Program</a>
            </li>
          </ul>
        </div>
      )}

    </div>
  )
}

export default Login;
