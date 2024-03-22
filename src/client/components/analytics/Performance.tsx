import styles from './Performance.module.css';
import EmbeddedDashboard from './EmbeddedDashboard';
import { useAppContext } from '../../App';
import { useEffect, useState } from 'react';
import { getJwtFromServer } from '../../jwt';

function Analytics() {

  const { user } = useAppContext();
  const [jwt, setJwt] = useState<string | null>(null);

  useEffect(() => {

    (async () => {
      if (!user) {
        return;
      }

      setJwt(await getJwtFromServer(user));
    })();

  }, [])

  if (!jwt) {
    return null;
  }

  return (
    <div className={styles.root}>
      <EmbeddedDashboard width={1000} />
      <p className={styles.footer}>
        This page was created with the <a href='https://developer.salesforce.com/tools/tableau/embedding-playground' target='_blank'>Tableau Embedding Playground</a>.
        <br />
        See the <a href='https://tableau.github.io/embedding-playbook/' target='_blank'>Tableau Embedding Analytics Playbook</a> for more information how to embed Tableau in your applications and products.
        <br />
        <br />
        Inspect the JWT of the dashboard with <a href={`https://jwt.io/#debugger-io?token=${jwt}`} target='_blank'>jwt.io</a>
      </p>
    </div>
  )
}

export default Analytics;
