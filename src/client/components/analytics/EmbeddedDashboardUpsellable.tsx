import styles from './EmbeddedDashboardUpsellable.module.css';
import { useAppContext } from '../../App';
import EmbeddedDashboard from './EmbeddedDashboard';
import { useState } from 'react';
import { ProductInfo } from '../productCatalog/ProductCatalog';

const EmbeddedDashboardUpsellable: React.FC<{selectedProduct: ProductInfo | null}>  = ({selectedProduct}) => {

  const { user, upgradeLicense } = useAppContext();
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
      {user.license === 'Basic' &&
        <div className={styles.upsellMessage}>
          <p>You have access to basic operational data. </p>
          <p><a href='#' onClick={upgradeUserLicense}>Upgrade to premium</a> for $9.99 /month to see period comparisons.</p>
        </div>
      }
      {refreshDashboard && <EmbeddedDashboard width={520} selectedProduct={selectedProduct}/>}
      {!refreshDashboard && <EmbeddedDashboard width={520} selectedProduct={selectedProduct}/>}
    </div>
  )
}

export default EmbeddedDashboardUpsellable;
