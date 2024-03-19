import { User, useUser } from './App';
import styles from './Login.module.css';
import LoginUser from './LoginUser';

function Login() {

  const { login } = useUser();

  return (
    <div className={styles.root}>

      {
        ([
          {user: 'Mario', role: 'Partner Manager', company: 'E-Bikes LLC'}, 
          {user: 'McKenzie' , role: 'Retail Shop Owner', company: 'Wheelworks'},
        ]).map(({user, role, company}) => {
          return <LoginUser 
            user={user as User} 
            role={role}
            company={company}
            onClick={() => login(user as User)} />
        })
      }

    </div>
  )
}

export default Login;
