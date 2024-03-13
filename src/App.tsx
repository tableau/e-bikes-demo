import { useState, createContext, useContext, ReactNode } from 'react'
import styles from './App.module.css';
import Header from './Header';
import Home from './Home';
import Analytics from './Analytics';
import Pulse from './Pulse';
import Login from './Login';
import Catalog from './Catalog';

export type User = 'McKenzie' | 'Mario' | undefined;
interface UserContextType {
  user: User;
  login: (user: User) => void;
}

const UserContext = createContext<UserContextType>({user:undefined, login: () => {}});
export const useUser = () => useContext(UserContext);
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(undefined);

  const login = (user: User) => {
    setUser(user);
  }

  return (
    <UserContext.Provider value={{ user, login }}>
      {children}
    </UserContext.Provider>
  )
}

export type Pages = 'Home' | 'Catalog' | 'Analytics' | 'Pulse';

function App() {

  const [page, setPage] = useState<Pages>('Home');
  const { user } = useUser();

  if (!user) {

    return <Login />

  } else {

    return (
      <div className={styles.root}>
        <Header page={page} onPageChange={(e) => setPage(e.newPage)} />

        {page === 'Home' && <Home />}
        {page === 'Catalog' && <Catalog />}
        {page === 'Analytics' && <Analytics />}
        {page === 'Pulse' && <Pulse />}
      </div>
    )

  }
}

export default App
