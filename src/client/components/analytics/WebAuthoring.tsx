import { useEffect, useState } from 'react';
import styles from './WebAuthoring.module.css';
import { useAuth } from '../auth/useAuth';

function WebAuthoring() {

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
  
    loadVizAsync();
  
  }, [jwt])

  async function loadVizAsync() {
    const vizElement = document.getElementById('TableauAuthoringViz')!;
    if (vizElement.children.length) {
      return;
    }

    // @ts-expect-error hack because GitHub runner can't install @tableau/embedding-api ¯\_(ツ)_/¯
    const { TableauAuthoringViz } = await import('https://10ay.online.tableau.com/javascripts/api/tableau.embedding.3.latest.js?url');

    const viz = new TableauAuthoringViz();

    const guid = crypto.randomUUID();
    viz.src = `https://10ay.online.tableau.com/t/ehofman/authoringNewWorkbook/${guid}/eBikesInventoryandSales`;
    viz.token = jwt
    viz.hideCloseButton = true;

    if (!vizElement.children.length) {
      vizElement.appendChild(viz);
    }
  }

  return (
    <div className={styles.root}>
      <div id="TableauAuthoringViz" className={styles.viz}></div>
    </div>
  )
}

export default WebAuthoring;
