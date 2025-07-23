import { useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useMobile } from '../hooks/useMobile';

interface MobileRouteGuardProps {
  children: React.ReactNode;
}

const MobileRouteGuard = ({ children }: MobileRouteGuardProps) => {
  const isMobile = useMobile();
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const location = useLocation();

  useEffect(() => {
    // Only redirect on mobile and if the user is McKenzie
    if (isMobile && userId === 'McKenzie') {
      const currentPath = location.pathname.toLowerCase();
      
      // If not on AI Assistant page, redirect to it
      if (!currentPath.includes('ai-assistant')) {
        navigate(`/${userId}/ai-assistant`, { replace: true });
      }
    }
  }, [isMobile, userId, location.pathname, navigate]);

  return <>{children}</>;
};

export default MobileRouteGuard; 