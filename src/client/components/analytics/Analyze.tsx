import { useEffect, useState } from 'react';
import styles from './Analyze.module.css';
import { TableauAuthoringViz } from '@tableau/embedding-api';
import { useAppContext } from '../../App';
import { getJwtFromServer } from './jwt';

function Copilot() {

  const { user } = useAppContext();
  const [jwt, setJwt] = useState<string | null>(null);


  useEffect(() => {

    if (!user) {
      return;
    }

    (async () => {
      setJwt(await getJwtFromServer(user));
    })();
  }, []);

  useEffect(() => {

    if (!jwt) {
      return;
    }
  
    if (document.getElementById('TableauAuthoringViz')?.children.length === 0) {
      const viz = new TableauAuthoringViz();

      const guid = crypto.randomUUID();
      //viz.src = `https://10ay.online.tableau.com/t/ehofman/newWorkbook/${guid}`;
      viz.src = `https://10ay.online.tableau.com/t/ehofman/authoringNewWorkbook/${guid}/eBikesInventoryandSales`;
      viz.token = jwt
  
      document.getElementById('TableauAuthoringViz')!.appendChild(viz);
    }
  
  }, [jwt])

  return (
    <div className={styles.root}>
      <div id="TableauAuthoringViz" className={styles.viz}></div>
    </div>
  )
}

export default Copilot;
