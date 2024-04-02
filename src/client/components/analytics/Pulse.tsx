import { useEffect, useState } from 'react';
import styles from './Pulse.module.css';
import { TableauPulse } from '@tableau/embedding-api';
import { BanInsight, usePulseApi } from './usePulseAPI';
import { useAuth } from '../auth/useAuth';
import classNames from 'classnames';

function Pulse() {

  const { getJwtFromServer } = useAuth()
  const [jwt, setJwt] = useState<string | null>(null);
  const { getSubscribedBanInsights } = usePulseApi();
  const [selectedMetricId, setSelectedMetricId] = useState<string | null>(null);

  const [banInsights, setBanInsights] = useState<BanInsight[] | null>((() => {
    const previous = localStorage.getItem('ban');
    if (previous) {
      return JSON.parse(previous);
    } else {
      return null;
    }
  })());

  useEffect(() => {

    (async () => {
      setJwt(await getJwtFromServer());
    })();

    (async () => {
      const subscribedBanInsights = await getSubscribedBanInsights()
      setBanInsights(subscribedBanInsights);
      localStorage.setItem('ban', JSON.stringify(subscribedBanInsights))
    })();
  }, []);

  useEffect(() => {

    if (!jwt || !selectedMetricId || !banInsights) {
      return;
    }

    const pulseElt = document.getElementById('tableauPulse');

    if (!pulseElt) {
      return;
    }

    const metricDefinition= banInsights.find(banInsight => banInsight.metricDefinition.metric_id === selectedMetricId)

    if (!metricDefinition) {
      return;
    }

    const pulse = new TableauPulse();
    pulse.src = banInsights.find(banInsight => banInsight.metricDefinition.metric_id === selectedMetricId)!.metricDefinition.url;
    pulse.token = jwt;

    pulseElt.innerHTML = '';
    pulseElt.appendChild(pulse);

  }, [jwt, selectedMetricId])

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
          ?<div className={styles.pulse} id="tableauPulse" ></div>
          : <div className={styles.selectMetricMessageContainer}>
              <div className={styles.selectMetricMessage}>Select a metric card to see its detailed info</div>
            </div>
        }
      </div>
    )

  }
}

export default Pulse;
