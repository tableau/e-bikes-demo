import { useEffect, useState } from 'react';
import styles from './Pulse.module.css';
import { BanInsight, usePulseApi } from './usePulseAPI';
import classNames from 'classnames';
import EmbeddedPulse from './EmbeddedPulse';

function Pulse() {

  const { getSubscribedBanInsights } = usePulseApi();
  const [selectedMetricId, setSelectedMetricId] = useState<string | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<'default' | 'card' | 'ban'>('card');

  const [banInsights, setBanInsights] = useState<BanInsight[] | null>((() => {
    const previous = localStorage.getItem('ban');
    if (previous) {
      return JSON.parse(previous);
    } else {
      return null;
    }
  })());

  const pulseUrl = banInsights?.find(banInsight => banInsight.metricDefinition.metric_id === selectedMetricId)?.metricDefinition.url;

  useEffect(() => {

    (async () => {
      const subscribedBanInsights = await getSubscribedBanInsights()
      setBanInsights(subscribedBanInsights);
      localStorage.setItem('ban', JSON.stringify(subscribedBanInsights))
    })();
  }, []);

  if (!banInsights) {

    return <div>loading...</div>

  } else {

    return (

      <div className={styles.root}>
        <div className={styles.cards}>{banInsights.map(banInsight => {
          return (
            <div
              className={classNames(styles.card, banInsight.metricDefinition.metric_id === selectedMetricId ? styles.selected : '')}
              key={banInsight.metricDefinition.name}
              onClick={() => setSelectedMetricId(banInsight.metricDefinition.metric_id)}
              title={banInsight.markup}
            >
              <div className={styles.header}>
                <div className={styles.name}>{banInsight.metricDefinition.name}</div>
                <div className={styles.period}>{banInsight.period}</div>
              </div>
              <div className={styles.ban}>
                <div className={styles.value}>{banInsight.value}</div>
                <div className={classNames(styles.triangle, styles[banInsight.direction], styles[banInsight.sentiment])}></div>
              </div>
            </div>
          )
        })}</div>
        {
          selectedMetricId
            ? <div className={styles.pulseContainer}>
              <div className={styles.pulseLayoutChooser}>
                <button className={`${styles.pulseLayoutButton} ${selectedLayout === 'default' ? styles.selected : ''}`} onClick={() => setSelectedLayout('default')}>default</button>
                <button className={`${styles.pulseLayoutButton} ${selectedLayout === 'card' ? styles.selected : ''}`} onClick={() => setSelectedLayout('card')}>card</button>
                <button className={`${styles.pulseLayoutButton} ${selectedLayout === 'ban' ? styles.selected : ''}`} onClick={() => setSelectedLayout('ban')}>ban</button>
              </div>
              <EmbeddedPulse url={pulseUrl} layout={selectedLayout} />
            </div>
            : <div className={styles.selectMetricMessageContainer}>
              <div className={styles.selectMetricMessage}>Select a metric card to see its detailed info</div>
            </div>
        }
      </div>
    )

  }
}

export default Pulse;
