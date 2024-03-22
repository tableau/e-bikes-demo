import { useState, createContext, useContext, ReactNode } from 'react'
import styles from './App.module.css';
import Header from './components/header/Header';
import Home from './components/home/Home';
import Analytics from './components/analytics/Performance';
import Pulse from './components/analytics/Pulse';
import Login from './components/login/Login';
import ProductCatalog from './components/productCatalog/ProductCatalog';
import Copilot from './components/analytics/Analyze';
import { NotificationItem } from './components/header/NotificationWindow';
import { User } from '../db/users';

interface AppContextType {
  user: User | undefined;
  selectedPage: Pages;
  notifications: NotificationItem[];
  login: (user?: User) => void;
  navigate: (page: Pages) => void;
  notificationReceived: (notifications: NotificationItem[]) => void;
  upgradeLicense: (user: User) => void;
}

export type Pages = 'Home' | 'Product Catalog' | 'Performance' | 'Analyze';

export const userPages = ((user: User): Pages[] => {
  if (user.isRetailer) {
    return ['Home', 'Product Catalog', 'Analyze'];
  } else {
    return ['Home', 'Performance', 'Analyze'];
  }
});


const AppContext = createContext<AppContextType>({
  user: undefined,
  selectedPage: 'Home',
  notifications: [],
  login: () => { },
  navigate: () => { },
  notificationReceived: () => { },
  upgradeLicense: () => { }
});
export const useAppContext = () => useContext(AppContext);
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | undefined>(undefined);
  const [selectedPage, setSelectedPage] = useState<Pages>('Home');
  const [ notifications, setNotifications] = useState<NotificationItem[]>([]);

  const login = (user?: User) => {
    setUser(user);
    setSelectedPage('Home');
  }

  const navigate = (page: Pages) => {
    setSelectedPage(page);
  }

  const notificationReceived = (notifications: NotificationItem[]) => {
    setNotifications(notifications);
  }

  const upgradeLicense = (user: User) => {
setUser({
  ...user,
  license: 'Premium'
})
  }

  return (
    <AppContext.Provider value={{
      user,
      selectedPage,
      notifications,
      login,
      navigate,
      notificationReceived,
      upgradeLicense
    }}>
      {children}
    </AppContext.Provider>
  )
}

function App() {

  const { user, selectedPage, navigate } = useAppContext();

  if (!user) {

    return <Login />

  } else {

    return (
      <div className={styles.root}>
        <Header selectedPage={selectedPage} onPageChange={(e) => navigate(e.newPage)} />

        {selectedPage === 'Home' && <Home />}
        {selectedPage === 'Product Catalog' && <ProductCatalog />}
        {selectedPage === 'Performance' && <Analytics />}
        {selectedPage === 'Analyze' && user.isRetailer && <Pulse />}
        {selectedPage === 'Analyze' && !user.isRetailer && <Copilot />}
      </div>
    )

  }
}

export default App
