import { User } from '../../../db/users';
import styles from './LoginUser.module.css';

export interface LoginUserProps {
  user: User;
  onClick: () => void;
}

const LoginUser: React.FC<LoginUserProps> = ({ user, onClick }) => {

  return (
    <div className={styles.root} onClick={onClick}>
        <img className={styles.loginImage} src={`/${user.username}.png`} />
        <div className={styles.profile}>
          <div className={styles.user}>{user.username}</div>
          <div className={styles.role}>{user.role}</div>
          <div className={styles.company}>{user.company}</div>
          </div>
    </div>
  )
}

export default LoginUser;
