import { users } from '../../../db/users';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import LoginUser from './LoginUser';
import imagePath from '@/assets/CyclingGrass.jpg';
import { useAppContext } from '../../App';

function Login() {

  const {updateUserLicense} = useAppContext();
  const navigate  = useNavigate();

  return (
    <div className={styles.root} style={{ backgroundImage: `url(${imagePath})` }}>

      {
        users.map((user) => {
          return <LoginUser 
            user={user}
            key={user.username}
            onClick={() => {
              navigate(`${user.username}/Home`)
              updateUserLicense(user.license);
            }} />
        })
      }

    </div>
  )
}

export default Login;
