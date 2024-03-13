import { User, useUser } from './App';
import styles from './Login.module.css';

function Login() {

  const { user, login } = useUser();

  return (
    <div className={styles.root}>
      <select className={styles.users} value={user} onChange={e => login(e.target.value as User)}>
      <option value={undefined}>&lt;Please select user&gt;</option>
        <option value={'Mario'}>Mario</option>
        <option value={'McKenzie'}>McKenzie</option>
      </select>
    </div>
  )
}

export default Login;
