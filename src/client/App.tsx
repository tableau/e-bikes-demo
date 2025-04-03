import { useState, createContext, useContext, ReactNode, useEffect } from 'react';
import { Routes, Route, Outlet, useLocation } from 'react-router-dom';
import styles from './App.module.css';
import Header from './components/header/Header';
import Home from './components/home/Home';
import Performance from './components/analytics/Performance';
import Login from './components/auth/Login';
import ProductCatalog from './components/productCatalog/ProductCatalog';
import { NotificationItem } from './components/header/NotificationWindow';
import { LicenseType, User } from '../db/users';
import Analyze from './components/analytics/Analyze';
import ChatWindow from './components/agent/ChatWindow';
import ChatMinimized from './components/agent/ChatMinimized';

interface AppContextType {
  notifications: NotificationItem[];
  notificationReceived: (notifications: NotificationItem[]) => void;
  userLicense: string;
  updateUserLicense: (license: LicenseType) => void;
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
  notifications: [],
  notificationReceived: () => { },
  userLicense: '',
  updateUserLicense: () => { },
});
export const useAppContext = () => useContext(AppContext);
export const UserProvider = ({ children }: { children: ReactNode }) => {

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [userLicense, setUserLicense] = useState<string>('Basic');

  const notificationReceived = (notifications: NotificationItem[]) => {
    setNotifications(notifications);
  }

  const updateUserLicense = () => {
    setUserLicense('Premium');
  }

  return (
    <AppContext.Provider value={{
      notifications,
      notificationReceived,
      userLicense,
      updateUserLicense,
    }}>
      {children}
    </AppContext.Provider>
  )
}

function App() {

  const [chatWindowMinimized, setChatWindowMinimized] = useState<boolean>(true);
  const location = useLocation();

  // Set chatWindowMinimized to true whenever the URL changes
  useEffect(() => {
    setChatWindowMinimized(true);
  }, [location]);

  return (
    <div className={styles.root}>
      <UserProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/:userId" element={
            <>
            <Header />
            <Outlet />
            {chatWindowMinimized ? <ChatMinimized onClick={() => setChatWindowMinimized(false)} /> : <ChatWindow />}
            </>
          }>
            <Route path="home" element={<Home />} />
            <Route path="product-catalog" element={<ProductCatalog />} />
            <Route path="performance" element={<Performance />} />
            <Route path="analyze" element={<Analyze />}
            />
          </Route>
        </Routes>
      </UserProvider>
    </div>
  );
}

export default App;
