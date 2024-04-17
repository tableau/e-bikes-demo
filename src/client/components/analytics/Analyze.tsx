import { useEffect, useState } from 'react';
import styles from './Analyze.module.css';
import { TableauAuthoringViz } from '@tableau/embedding-api';
import { useAuth } from '../auth/useAuth';

function Copilot() {

  const { getJwtFromServer } = useAuth()
  const [jwt, setJwt] = useState<string | null>(null);


  useEffect(() => {

    (async () => {
      setJwt(await getJwtFromServer());
    })();
  }, []);

  useEffect(() => {

    if (!jwt) {
      return;
    }
  
    if (document.getElementById('TableauAuthoringViz')?.children.length === 0) {
      const viz = new TableauAuthoringViz();

      const guid = crypto.randomUUID();
      // viz.src = `https://10ay.online.tableau.com/t/ehofman/authoringNewWorkbook/${guid}/eBikesInventoryandSales`;
      // viz.src = `https://us-west-2a.online.tableau.com/t/ehofmanvds/authoringNewWorkbook/${guid}/ebikes_inventory_and_sales`; //web auth to data source broken?
      viz.src = `https://us-west-2a.online.tableau.com/t/ehofmanvds/views/ebikes_inventory_and_sales_wb/Sheet1`;
      viz.token = jwt
      viz.hideCloseButton = true;

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
