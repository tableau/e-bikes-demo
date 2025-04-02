import { useState, createContext, useContext, ReactNode } from 'react'
import styles from './App.module.css';
import Header from './components/header/Header';
import Home from './components/home/Home';
import Performance from './components/analytics/Performance';
import Pulse from './components/analytics/Pulse';
import Login from './components/auth/Login';
import ProductCatalog from './components/productCatalog/ProductCatalog';
import WebAuthoring from './components/analytics/WebAuthoring';
import { NotificationItem } from './components/header/NotificationWindow';
import { User } from '../db/users';
import AgentforceIntegration from './components/agent/AgentforceIntegration';

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
    return ['Home', 'Performance', 'Analyze'] as Pages[];
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
        {selectedPage === 'Performance' && <Performance />}
        {selectedPage === 'Analyze' && user.isRetailer && <Pulse />}
        {selectedPage === 'Analyze' && !user.isRetailer && <WebAuthoring />}

        {/* <AgentforceIntegration /> */}
      </div>
    )

  }
}

export default App
