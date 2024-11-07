import styles from './EmbeddedDashboardUpsellable.module.css';
import { useAppContext } from '../../App';
import EmbeddedDashboard from './EmbeddedDashboard';
import { useEffect, useState } from 'react';
import { ProductInfo } from '../productCatalog/ProductCatalog';
import { usePulseApi } from './usePulseAPI';

const EmbeddedDashboardUpsellable: React.FC<{ selectedProduct: ProductInfo | null }> = ({ selectedProduct }) => {

  const { user, navigate, upgradeLicense } = useAppContext();

  const [refreshDashboard, setRefreshDashboard] = useState<boolean>(false);
  const [insights, setInsights] = useState<string | null>(null);
  // const { getSubscribedBanInsights } = usePulseApi();
const {getSubscribedSpringboardInsights} = usePulseApi();

  useEffect(() => {

    if (user?.license === 'Premium') {
      (async () => {
        // const banInsights = await getSubscribedBanInsights();
        const banInsights = await getSubscribedSpringboardInsights();
        // console.log('banInsights', banInsights)
        const firstNegativeBanInsight = banInsights.find(banInsight => banInsight.sentiment === 'negative');
        if (firstNegativeBanInsight && firstNegativeBanInsight.markup) {
          setInsights(`${firstNegativeBanInsight.metricDefinition.name}: ${firstNegativeBanInsight.markup}`);
        } else {
          setInsights(null);
        }
      })();
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
      {
        insights &&
        <div className={styles.insights}>
          {insights}
            <div className={styles.actions}>
              <a className={styles.analyze} onClick={() => navigate('Analyze')}>Analyze</a>
            </div>
        </div>
      }
      {refreshDashboard && <EmbeddedDashboard sheet={'SalesAnalysis'} width={520} selectedProduct={selectedProduct} />}
      {!refreshDashboard && <EmbeddedDashboard sheet={'SalesAnalysis'} width={520} selectedProduct={selectedProduct} />}
    </div>
  )
}

export default EmbeddedDashboardUpsellable;
