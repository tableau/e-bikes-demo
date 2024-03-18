import { useEffect } from 'react';
import styles from './Copilot.module.css';
import { TableauAuthoringViz } from '@tableau/embedding-api';
import { getJwt } from '../pseudoBackend';

function Copilot() {

  useEffect(() => {
    const viz = new TableauAuthoringViz();

    if (document.getElementById('TableauAuthoringViz')?.children.length === 0) {
      viz.src = 'https://10ay.online.tableau.com/t/ehofman/views/Superstore1_16648177645910/Sheet1';
      viz.token = getJwt();

      document.getElementById('TableauAuthoringViz')!.appendChild(viz);
    }
  }, [])

  return (
    <div className={styles.root}>
      <div id="TableauAuthoringViz" className={styles.viz}></div>
    </div>
  )
}

export default Copilot;
