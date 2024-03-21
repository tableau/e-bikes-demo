import styles from './LoginUser.module.css';

export interface LoginUserProps {
  user: string;
  role: string;
  company: string;
  onClick: () => void;
}

const LoginUser: React.FC<LoginUserProps> = ({ user, role, company, onClick }) => {

  return (
    <div className={styles.root} onClick={onClick}>
        <img className={styles.loginImage} src={`${user}.png`} />
        <div className={styles.profile}>
          <div className={styles.user}>{user}</div>
          <div className={styles.role}>{role}</div>
          <div className={styles.company}>{company}</div>
          </div>
    </div>
  )
}

export default LoginUser;
