import styles from './EmbeddedDashboardUpsellable.module.css';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../App';
import EmbeddedDashboard from './EmbeddedDashboard';
import { useEffect, useState } from 'react';
import { ProductInfo } from '../productCatalog/ProductCatalog';
import { usePulseApi } from './usePulseAPI';
import { useParams } from 'react-router-dom';

const EmbeddedDashboardUpsellable: React.FC<{ selectedProduct: ProductInfo | null }> = ({ selectedProduct }) => {

  const { updateUserLicense, userLicense } = useAppContext();
  const navigate = useNavigate();

  const [refreshDashboard, setRefreshDashboard] = useState<boolean>(false);
  const [insights, setInsights] = useState<string | null>(null);
  const {getSubscribedSpringboardInsights} = usePulseApi();

  const { userId } = useParams<{ userId: string }>();

  useEffect(() => {

    if (userLicense === 'Premium') {
      (async () => {
        const banInsights = await getSubscribedSpringboardInsights();

        const firstNegativeBanInsight = banInsights.find(banInsight => banInsight.sentiment === 'negative');
        if (firstNegativeBanInsight && firstNegativeBanInsight.markup) {
          setInsights(`${firstNegativeBanInsight.metricDefinition.name}: ${firstNegativeBanInsight.markup}`);
        } else {
          setInsights(null);
        }
      })();
    }

  }, [userLicense])

  const upgradeUserLicense = () => {
    updateUserLicense('Premium');
    setRefreshDashboard(!refreshDashboard);
  }

  return (
    <div className={styles.root}>
      {userLicense === 'Basic' && 
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
              <a className={styles.analyze} onClick={() => navigate(`${userId}/Analyze`)}>Analyze</a>
            </div>
        </div>
      }
      {<EmbeddedDashboard sheet={'SalesAnalysis'} width={520} selectedProduct={selectedProduct} />}
    </div>
  )
}

export default EmbeddedDashboardUpsellable;
