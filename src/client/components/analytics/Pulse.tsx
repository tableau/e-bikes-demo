import { useEffect, useState } from 'react';
import styles from './Pulse.module.css';
import { BanInsight, usePulseApi } from './usePulseAPI';
import EmbeddedPulse from './EmbeddedPulse';
import PulseCustom from './PulseCustom';
import { useAuth } from '../auth/useAuth';
import classNames from 'classnames';
import PulseDiscover from './PulseDiscover';
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
          <div className={styles.pulseItems}>
            <PulseStandard jwt={jwt} theme={theme} banInsights={banInsights} />
          </div>
          <div className={styles.pulseCustomItems}>
            <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
              {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
            </button>
            <PulseDiscover jwt={jwt} />
            <PulseCustom banInsights={banInsights} />
          </div>
        </div>
      </div>
    )

  }
}

export default Pulse;
