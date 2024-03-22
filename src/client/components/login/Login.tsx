import { users } from '../../../db/users';
import { useAppContext } from '../../App';
import styles from './Login.module.css';
import LoginUser from './LoginUser';

function Login() {

  const { login } = useAppContext();

  return (
    <div className={styles.root}>

      {
        users.map((user) => {
          return <LoginUser 
            user={user}
            key={user.username}
            onClick={() => login(user)} />
        })
      }

    </div>
  )
}

export default Login;
