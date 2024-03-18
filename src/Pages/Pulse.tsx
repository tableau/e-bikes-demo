import { useEffect } from 'react';
import styles from './Pulse.module.css';
import { TableauPulse } from '@tableau/embedding-api';
import { getJwt } from '../pseudoBackend';

function Pulse() {

  useEffect(() => {
    const pulse = new TableauPulse();

    if (document.getElementById('tableauPulse')?.children.length === 0) {
      pulse.src = 'https://10ay.online.tableau.com/pulse/site/ehofman/metrics/7d8fe39a-7bf9-424c-bdd3-2676a5598c50';
      pulse.token = getJwt();

      document.getElementById('tableauPulse')!.appendChild(pulse);
    }
  }, [])

  return (

    <div className={styles.root}>
      <div id="tableauPulse"></div>
    </div>
  )
}

export default Pulse;
