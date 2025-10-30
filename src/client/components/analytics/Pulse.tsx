import { useEffect, useState } from 'react';
import styles from './Pulse.module.css';
import { BanInsight, usePulseApi } from './usePulseAPI';
import PulseCustom from './PulseCustom';
import { useAuth } from '../auth/useAuth';
import classNames from 'classnames';
import PulseEnhancedQA from './PulseEnhancedQA';
import PulseStandard from './PulseStandard';

function Pulse() {

  const { getJwtFromServer } = useAuth()
  const [jwt, setJwt] = useState<string | null>(null);

  const { getSubscribedBanInsights } = usePulseApi();
  const [banInsights, setBanInsights] = useState<BanInsight[] | null>(null);

  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {

    (async () => {
      setJwt(await getJwtFromServer());
    })();

  }, []);

  useEffect(() => {

    if (!jwt) {
      return;
    }

    (async () => {
      const subscribedBanInsights = await getSubscribedBanInsights()
      setBanInsights(subscribedBanInsights);
    })();

  }, [jwt]);

  if (!jwt) {
    return null;
  } else {

    return (

      <div className={classNames(styles.root, theme === 'light' ? styles.light : styles.dark)}>
        <div className={styles.cards}>
          <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
            <button onClick={() => setTheme(theme === "light" ? "dark" : "light")} style={{ height: '40px', width: '200px' }}>
              {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
            </button>
            <div style={{ fontSize: '18px', color: theme === 'light' ? 'black' : 'white' }}>Custom rendering:</div>
            <PulseCustom banInsights={banInsights} />
            <div style={{ fontSize: '18px', color: theme === 'light' ? 'black' : 'white' }}>Standard rendering in different layouts:</div>
            <div className={styles.pulseItems}>
              <PulseStandard jwt={jwt} theme={theme} banInsights={banInsights} />
            </div>

          </div>
          <div className={styles.pulseCustomItems}>
            <PulseEnhancedQA jwt={jwt} theme={theme} />
          </div>
        </div>
      </div>
    )

  }
}

export default Pulse;
