import styles from './Performance.module.css';
import EmbeddedDashboard from './EmbeddedDashboard';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/useAuth';

function Performance() {

  const { getJwtFromServer } = useAuth()
  const [jwt, setJwt] = useState<string | null>(null);

  useEffect(() => {

    (async () => {
      setJwt(await getJwtFromServer());
    })();

  }, [])

  if (!jwt) {
    return null;
  }

  return (
    <div className={styles.root}>
      <EmbeddedDashboard sheet={'SalesAnalysis'} width={1000} />
    </div>
  )
}

export default Performance;
