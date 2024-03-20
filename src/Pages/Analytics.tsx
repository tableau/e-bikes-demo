import styles from './Analytics.module.css';
import { useUser } from '../App';
import EmbeddedDashboard from './EmbeddedDashboard';
import { getJwt } from '../pseudoBackend';
import { useState } from 'react';

function Analytics() {

  const { user, upgradeLicense } = useUser();
  const [refreshDashboard, setRefreshDashboard] = useState<boolean>(false);

  if (!user) {
    return null;
  }

  const upgradeUserLicense = () => {
    upgradeLicense(user);
    setRefreshDashboard(!refreshDashboard);
  }

  return (
    <div className={styles.root}>
      {user.hasPremiumLicense && user.username === 'McKenzie' &&
        <p>Enjoy your premium analytics subscription.</p>
      }
      {!user.hasPremiumLicense && user.username === 'McKenzie' &&
        <div className={styles.upsellMessage}>
          <p>You have access to basic operational data. </p>
          <p><a href='#' onClick={upgradeUserLicense}>Upgrade to premium</a> for $9.99 /month to see period comparisons.</p>
        </div>
      }
      {refreshDashboard && <EmbeddedDashboard />}
      {!refreshDashboard && <EmbeddedDashboard />}
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
