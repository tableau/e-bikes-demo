import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { isMcKenziePersona, users } from '../../../db/users';
import WebAuthoring from './WebAuthoring';
import styles from './Analyze.module.css';

type AnalyzeView = 'hub' | 'authoring';

function Analyze() {
  const { userId } = useParams<{ userId: string }>();
  const user = users.find((u) => u.username === userId);
  const [view, setView] = useState<AnalyzeView>('hub');

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!isMcKenziePersona(user)) {
    return <Navigate to={`/${user.username}/home`} replace />;
  }

  if (view === 'authoring') {
    return (
      <div className={styles.rootAuthoring}>
        <div className={styles.authoringShell}>
          <div className={styles.toolbar}>
            <button type="button" className={styles.backButton} onClick={() => setView('hub')}>
              ← Back to Analyze
            </button>
          </div>
          <WebAuthoring />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>Analyze</h1>
      <p className={styles.subtitle}>
        Choose an experience below. Web authoring opens Tableau embedded authoring for the e-bikes semantic model.
      </p>
      <div className={styles.options} role="list">
        <button
          type="button"
          className={styles.optionCard}
          role="listitem"
          onClick={() => setView('authoring')}
        >
          <div className={styles.optionTitle}>Web authoring</div>
          <p className={styles.optionDescription}>
            Open Tableau web authoring to explore and edit workbooks against eBikes inventory and sales data.
          </p>
        </button>
      </div>
    </div>
  );
}

export default Analyze;
