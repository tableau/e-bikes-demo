import { useState, createContext, useContext, ReactNode } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import styles from './App.module.css';
import Header from './components/header/Header';
import Home from './components/home/Home';
import Performance from './components/analytics/Performance';
import Login from './components/auth/Login';
import ProductCatalog from './components/productCatalog/ProductCatalog';
import { NotificationItem } from './components/header/NotificationWindow';
import { isMcKenziePersona, LicenseType, User } from '../db/users';
import Analyze from './components/analytics/Analyze';
import Metrics from './components/analytics/Metrics';
import AIAssistent from './components/analytics/AIAssistent';
import Analytics from './components/analytics/Analytics';
import DemoScript from './components/auth/DemoScript';
import MobileRouteGuard from './components/MobileRouteGuard';
import { useGA } from './hooks/useGA';

interface AppContextType {
  notifications: NotificationItem[];
  notificationReceived: (notifications: NotificationItem[]) => void;
  userLicense: string;
  updateUserLicense: (license: LicenseType) => void;
}

export type Pages = 'Home' | 'Product Catalog' | 'Performance' | 'Metrics' | 'Analyze' | 'AI Assistant' | 'Analytics';

export const userPages = ((user: User): Pages[] => {
  // Use mobile detection inside the component context
  const isMobile = typeof window !== 'undefined' ?
    (window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
    : false;

  // On mobile, only show AI Assistant (or Analytics for Mario)
  if (isMobile) {
    return user.isRetailer ? ['AI Assistant'] : ['Analytics'];
  }

  // On desktop, show pages based on user type
  // Mario (non-retailer): Home, Analytics (same as AI Assistant)
  // McKenzie (retailer): Home, Product Catalog, Metrics, Analyze (McKenzie only), AI Assistant
  if (user.isRetailer) {
    const pages: Pages[] = ['Home', 'Product Catalog', 'Metrics'];
    if (isMcKenziePersona(user)) {
      pages.push('Analyze');
    }
    pages.push('AI Assistant');
    return pages;
  } else {
    return ['Home', 'Analytics'] as Pages[];
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
            <Route path="performance" element={
                <Performance />
            } />
            <Route path="metrics" element={<Metrics />} />
            <Route path="analyze" element={<Analyze />} />
            <Route path="ai-assistant" element={<AIAssistent isSidePane={false} />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>
        </Routes>
      </UserProvider>
    </div>
  );
}

export default App;
