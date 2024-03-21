import { useState, createContext, useContext, ReactNode } from 'react'
import styles from './App.module.css';
import Header from './Header';
import Home from './Pages/Home';
import Analytics from './Pages/Analytics';
import Pulse from './Pages/Pulse';
import Login from './Login';
import ProductCatalog from './Pages/ProductCatalog';
import Copilot from './Pages/Copilot';
import { NotificationItem } from './NotificationWindow';

export interface User {
  username: 'McKenzie' | 'Mario';
  retailer: 'Wheelworks' | null;
  hasPremiumLicense: boolean;
}
interface AppContextType {
  user: User | undefined;
  notifications: NotificationItem[];
  selectedPage: Pages;
  login: (user?: User) => void;
  navigate: (page: Pages) => void;
  notificationReceived: (notifications: NotificationItem[]) => void;
  upgradeLicense: (user: User) => void;
}

export type Pages = 'Home' | 'Product Catalog' | 'Analytics' | 'Get insights' | 'Self-service analytics';

export const userPages = ((user: User): Pages[] => {
  switch (user?.username) {
    case 'Mario':
      return ['Home', 'Analytics', 'Self-service analytics'];
    case 'McKenzie':
      return ['Home', 'Product Catalog', 'Get insights'];
    default:
      return [];
  }
});


const AppContext = createContext<AppContextType>({ 
  user: undefined,
  selectedPage: 'Home', 
  notifications: [], 
  login: () => { }, 
  navigate: () => { }, 
  notificationReceived: () => {},
  upgradeLicense: () => { } 
});
export const useAppContext = () => useContext(AppContext);
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | undefined>(undefined);
  const [selectedPage, setSelectedPage] = useState<Pages>('Home');
  const [ notifications, setNotifications] = useState<NotificationItem[]>([
    {title: 'High returns: Wheelworks', message: 'Your partner Wheelworks has returned 25% of their Fuse X2 bikes in the last month. Please reach out to them as soon as possible.'},
    {title: 'High returns: Wheelworks', message: 'Your partner Wheelworks has returned 25% of their Fuse X2 bikes in the last month. Please reach out to them as soon as possible.'},
  ]);

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
      hasPremiumLicense: true,
    });
  }

  return (
    <AppContext.Provider value={{ user, selectedPage, notifications, login, navigate, notificationReceived, upgradeLicense }}>
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
        {selectedPage === 'Analytics' && <Analytics />}
        {selectedPage === 'Get insights' && <Pulse />}
        {selectedPage === 'Self-service analytics' && <Copilot />}
      </div>
    )

  }
}

export default App
