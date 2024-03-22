import { useEffect, useState } from 'react';
import styles from './EmbeddedDashboard.module.css';
import { Dashboard, FilterUpdateType, TableauEventType, TableauViz, Toolbar } from '@tableau/embedding-api';
import { useAppContext } from '../../App';
import { ProductInfo } from '../productCatalog/ProductCatalog';
import { getJwtFromServer } from '../../jwt';

const EmbeddedDashboard: React.FC<{ width: number, selectedProduct?: ProductInfo | null }> = ({ width, selectedProduct }) => {

  const { user } = useAppContext();
  const [vizIsInteractive, setVizIsInteractive] = useState<boolean>(false);
  const [jwt, setJwt] = useState<string | null>(null);

  const applyFilter = () => {
    if (!vizIsInteractive) {
      return;
    }

    if (selectedProduct) {

      const viz = document.querySelector('tableau-viz') as TableauViz;

      const dashboard = viz.workbook.activeSheet as Dashboard;
      const worksheet = dashboard.worksheets.find(ws => ws.name === 'sales_BAN')!;

      worksheet.applyFilterAsync("Product Name", [selectedProduct.name], FilterUpdateType.Replace, { isExcludeMode: false });
    }
  }

  useEffect(() => {

    if (!user) {
      return;
    }

    (async () => {
      setJwt(await getJwtFromServer(user));
    })();
  }, []);

  useEffect(() => {

    if (!jwt) {
      return;
    }

    const vizElement = document.getElementById('tableauViz');

    if (vizElement?.children.length === 0) {

      const viz = new TableauViz();
      viz.src = 'https://10ay.online.tableau.com/t/ehofman/views/eBikeSalesAnalysis/SalesAnalysis';
      viz.toolbar = Toolbar.Hidden;
      viz.token = jwt;
      viz.width = `${width}px`;

      viz.addEventListener(TableauEventType.FirstInteractive, () => {
        setVizIsInteractive(true);
      });

      vizElement.appendChild(viz);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jwt])

  useEffect(() => {

    applyFilter();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct, vizIsInteractive])

  return (
    <div id="tableauViz" className={styles.viz}></div>
  )
}

export default EmbeddedDashboard;
