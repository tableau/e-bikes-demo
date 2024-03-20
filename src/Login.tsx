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
            user={user}
            role={role}
            company={company}
            onClick={() => login({
              username: user as any,
              retailer: user === 'McKenzie' ? company as any : null,
              hasPremiumLicense: user === 'Mario',
            })} />
        })
      }

    </div>
  )
}

export default Login;
