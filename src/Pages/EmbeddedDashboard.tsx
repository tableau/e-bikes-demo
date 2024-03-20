import { useEffect } from 'react';
import styles from './EmbeddedDashboard.module.css';
import { TableauViz, Toolbar} from '@tableau/embedding-api';
import { getJwt } from '../pseudoBackend';
import { useUser } from '../App';

function EmbeddedDashboard() {

  const {user} = useUser();

  useEffect(() => {

    if (!user) {
      return;
    }

    const viz = new TableauViz();

    if (document.getElementById('tableauViz')?.children.length === 0) {

      viz.src = 'https://10ay.online.tableau.com/t/ehofman/views/eBikeSalesAnalysis/SalesAnalysis';
      viz.toolbar = Toolbar.Hidden;
      viz.token = getJwt(user);

      document.getElementById('tableauViz')!.appendChild(viz);
    }
  }, [])

  return (
    <div id="tableauViz" className={styles.viz}></div>
  )
}

export default EmbeddedDashboard;
