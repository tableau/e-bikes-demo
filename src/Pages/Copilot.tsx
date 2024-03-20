import { useEffect } from 'react';
import styles from './Copilot.module.css';
import { TableauAuthoringViz } from '@tableau/embedding-api';
import { getJwt } from '../pseudoBackend';
import { useUser } from '../App';

function Copilot() {

  const {user} = useUser();

  useEffect(() => {

    if (!user){
      return ;
    }

    if (document.getElementById('TableauAuthoringViz')?.children.length === 0) {
      const viz = new TableauAuthoringViz();

      const guid = crypto.randomUUID();
      //viz.src = `https://10ay.online.tableau.com/t/ehofman/newWorkbook/${guid}`;
      viz.src = `https://10ay.online.tableau.com/t/ehofman/authoringNewWorkbook/${guid}/eBikesInventoryandSales`;
      viz.token = getJwt(user);

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
