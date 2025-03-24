import { useEffect, useState } from 'react';
import styles from './Pulse.module.css';
import { BanInsight, usePulseApi } from './usePulseAPI';
import EmbeddedPulse from './EmbeddedPulse';
import PulseCustom from './PulseCustom';
import { useAuth } from '../auth/useAuth';
import classNames from 'classnames';

function Pulse() {

  const { getSubscribedBanInsights } = usePulseApi();
  const { getJwtFromServer } = useAuth()
  const [jwt, setJwt] = useState<string | null>(null);
  const [banInsights, setBanInsights] = useState<BanInsight[] | null>((() => {
    const previous = localStorage.getItem('ban');
    if (previous) {
      return JSON.parse(previous);
    } else {
      return null;
    }
  })());
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {

    (async () => {
      setJwt(await getJwtFromServer());
    })();

  }, []);

  useEffect(() => {

    (async () => {
      const subscribedBanInsights = await getSubscribedBanInsights()
      setBanInsights(subscribedBanInsights);
      localStorage.setItem('ban', JSON.stringify(subscribedBanInsights))
    })();
  }, []);

  if (!jwt) {
    return null;
  } else {

    const pulseUrl = (banInsights && banInsights[0].metricDefinition.url) ?? '';

    if (!banInsights) {

      return <div>loading...</div>

    } else {

      return (

        <div className={classNames(styles.root, theme === 'light' ? styles.light : styles.dark)}>
          <div className={styles.cards}>
            <div className={styles.pulseItems}>
              <div className={styles.pulseban}>
                <EmbeddedPulse key={'ban'} url={pulseUrl} jwt={jwt} layout={'ban'} theme={theme} />
              </div>
              <div className={styles.pulsecard}>
                <EmbeddedPulse key={'card'} url={pulseUrl} jwt={jwt} layout={'card'} theme={theme} />
              </div>
              <div className={styles.pulsedefault}>
                <EmbeddedPulse key={'default'} url={pulseUrl} jwt={jwt} layout={'default'} theme={theme} />
              </div>
            </div>
            <div className={styles.pulseCustomItems}>
              <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
                {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
              </button>
              {banInsights.map(banInsight => <PulseCustom banInsight={banInsight} />)}
            </div>
          </div>
        </div>
      )

    }
  }
}

export default Pulse;
