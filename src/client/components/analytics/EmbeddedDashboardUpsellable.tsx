import styles from './EmbeddedDashboardUpsellable.module.css';
import { useAppContext } from '../../App';
import EmbeddedDashboard from './EmbeddedDashboard';
import { useEffect, useState } from 'react';
import { ProductInfo } from '../productCatalog/ProductCatalog';
import { usePulseApi } from './usePulseAPI';

const EmbeddedDashboardUpsellable: React.FC<{ selectedProduct: ProductInfo | null }> = ({ selectedProduct }) => {

  const { user, upgradeLicense } = useAppContext();
//  const { getInsightMarkup } = usePulseApi();

  const [refreshDashboard, setRefreshDashboard] = useState<boolean>(false);
  const [insights, setInsights] = useState<string | null>(null);

  useEffect(() => {

    if (user?.license === 'Premium') {
  //    (async () => setInsights(await getInsightMarkup()))();
    }

  }, [user?.license])

  const upgradeUserLicense = () => {
    if (!user) {
      return null;
    }

    upgradeLicense(user);
    setRefreshDashboard(!refreshDashboard);
  }

  return (
    <div className={styles.root}>
      {user?.license === 'Basic' &&
        <div className={styles.upsellMessage}>
          <p>You have access to basic operational data. </p>
          <p><a href='#' onClick={upgradeUserLicense}>Upgrade to premium</a> for $9.99 /month.</p>
        </div>
      }
      {insights && <div className={styles.insights} dangerouslySetInnerHTML={{__html: insights}} /> }
      {refreshDashboard && <EmbeddedDashboard width={520} selectedProduct={selectedProduct} />}
      {!refreshDashboard && <EmbeddedDashboard width={520} selectedProduct={selectedProduct} />}
    </div>
  )
}

export default EmbeddedDashboardUpsellable;
