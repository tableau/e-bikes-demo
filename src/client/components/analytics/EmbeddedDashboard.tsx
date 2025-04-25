import { useEffect, useState } from 'react';
import styles from './EmbeddedDashboard.module.css';
import { TableauViz } from '@tableau/embedding-api-react';
import { ProductInfo } from '../productCatalog/ProductCatalog';
import { useAuth } from '../auth/useAuth';
import { server, site } from "../../constants/Constants";

const EmbeddedDashboard: React.FC<{
  sheet: string,
  width: number,
  height?: number,
  selectedProduct?: ProductInfo | null
}> = ({ sheet, width, height, selectedProduct }) => {

  const { getJwtFromServer } = useAuth()
  const [jwt, setJwt] = useState<string | null>(null);

  useEffect(() => {

    (async () => {
      setJwt(await getJwtFromServer());
    })();

  }, []);

  if (!jwt) {

    return null;

  } else {

    return (
      <div className={styles.root}>
        <div className={styles.viz}>
          <TableauViz
            src={`https://${server}/t/${site}/views/eBikeSalesAnalysis/${sheet}`}
            token={jwt}
            height={`${height}px`}
            width={`${width}px`}
            toolbar={'hidden'}
            vizFilters={selectedProduct ? [{ field: 'Product Name', value: selectedProduct.name }] : []}
          />
        </div>
        <div className={styles.footer}>
          Inspect the JWT of the dashboard with <a href={`https://jwt.io/#debugger-io?token=${jwt}`} target='_blank'>jwt.io</a>
        </div>
      </div>
    );

  }
}

export default EmbeddedDashboard;
