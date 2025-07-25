import { useState, createContext, useContext, ReactNode } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import styles from './App.module.css';
import Header from './components/header/Header';
import Home from './components/home/Home';
import Performance from './components/analytics/Performance';
import Login from './components/auth/Login';
import ProductCatalog from './components/productCatalog/ProductCatalog';
import { NotificationItem } from './components/header/NotificationWindow';
import { LicenseType, User } from '../db/users';
import Analyze from './components/analytics/Analyze';
import AIAssistent from './components/analytics/AIAssistent';
import DemoScript from './components/auth/DemoScript';
import MobileRouteGuard from './components/MobileRouteGuard';
import { useGA } from './hooks/useGA';

interface AppContextType {
  notifications: NotificationItem[];
  notificationReceived: (notifications: NotificationItem[]) => void;
  userLicense: string;
  updateUserLicense: (license: LicenseType) => void;
}

export type Pages = 'Home' | 'Product Catalog' | 'Performance' | 'Analyze' | 'AI Assistant';

export const userPages = ((user: User): Pages[] => {
  // Use mobile detection inside the component context
  const isMobile = typeof window !== 'undefined' ? 
    (window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) 
    : false;

  // On mobile, only show AI Assistant
  if (isMobile) {
    return ['AI Assistant'];
  }

  // On desktop, show pages based on user type
  if (user.isRetailer) {
    return ['Home', 'Product Catalog', 'Analyze', 'AI Assistant'];
  } else {
    return ['Home', 'Performance', 'Analyze', 'AI Assistant'] as Pages[];
  }
});

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within UserProvider');
  return context;
};

export const UserProvider = ({ children }: { children: ReactNode }) => {

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [userLicense, setUserLicense] = useState<LicenseType>('Basic');

  const notificationReceived = (notifications: NotificationItem[]) => {
    setNotifications(notifications);
  }

  const updateUserLicense = (license: LicenseType) => {
    setUserLicense(license);
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
  // Initialize Google Analytics tracking
  useGA();

  return (
    <div className={styles.root}>
      <UserProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/demoscript" element={<DemoScript />} />
          <Route path="/:userId" element={
            <MobileRouteGuard>
              <Header />
              <Outlet />
            </MobileRouteGuard>
          }>
            <Route path="home" element={<Home />} />
            <Route path="product-catalog" element={<ProductCatalog />} />
            <Route path="performance" element={<Performance />} />
            <Route path="analyze" element={<Analyze />} />
                            <Route path="ai-assistant" element={<AIAssistent />} />
          </Route>
        </Routes>
      </UserProvider>
    </div>
  );
}

export default App;
