import { useEffect } from 'react';
import styles from './Analytics.module.css';
import { TableauViz, TableauEventType } from '@tableau/embedding-api';

function Analytics() {

  useEffect(() => {
    const viz = new TableauViz();

    if (document.getElementById('tableauViz')?.children.length === 0) {
      viz.src = 'https://my-server/views/my-workbook/my-view';
      //viz.toolbar = 'hidden';

      document.getElementById('tableauViz')!.appendChild(viz);
    }
  }, [])

  return (
    <div className={styles.root}>
      <div id="tableauViz"></div>
    </div>
  )
}

export default Analytics;
