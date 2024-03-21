import styles from './Analytics.module.css';
import EmbeddedDashboard from './EmbeddedDashboard';
import { getJwt } from '../../pseudoBackend';
import { useAppContext } from '../../App';

function Analytics() {

  const {user} = useAppContext();

  if (!user) {
    return null;
  }

  return (
    <div className={styles.root}>
      <EmbeddedDashboard width={1000}/>
      <p className={styles.footer}>
        This page was created with the <a href='https://developer.salesforce.com/tools/tableau/embedding-playground' target='_blank'>Tableau Embedding Playground</a>.
        <br />
        See the <a href='https://tableau.github.io/embedding-playbook/' target='_blank'>Tableau Embedding Analytics Playbook</a> for more information how to embed Tableau in your applications and products.
        <br />
        <br />
        Inspect the JWT of the dashboard with <a href={`https://jwt.io/#debugger-io?token=${getJwt(user)}`} target='_blank'>jwt.io</a>
      </p>
    </div>
  )
}

export default Analytics;
