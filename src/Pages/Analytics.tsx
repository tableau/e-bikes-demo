import { useEffect } from 'react';
import styles from './Analytics.module.css';
import { TableauViz, Toolbar} from '@tableau/embedding-api';
import { getJwt } from '../pseudoBackend';
import { useUser } from '../App';

function Analytics() {

  const {user} = useUser();

  useEffect(() => {
    const viz = new TableauViz();

    if (document.getElementById('tableauViz')?.children.length === 0) {
      viz.src = 'https://10ay.online.tableau.com/t/ehofman/views/eBikeSalesAnalysis/SalesAnalysis';
      viz.toolbar = Toolbar.Hidden;
      viz.token = getJwt();

      document.getElementById('tableauViz')!.appendChild(viz);
    }
  }, [])

  return (
    <div className={styles.root}>
      <h1>Welcome {user}</h1>
      <div id="tableauViz" className={styles.viz}></div>
    </div>
  )
}

export default Analytics;
