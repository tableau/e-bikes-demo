import { useEffect } from 'react';
import styles from './EmbeddedDashboard.module.css';
import { FilterUpdateType, TableauViz, Toolbar } from '@tableau/embedding-api';
import { getJwt } from '../pseudoBackend';
import { useAppContext } from '../App';
import { ProductInfo } from './ProductCatalog';

const EmbeddedDashboard: React.FC<{ width: number, selectedProduct?: ProductInfo | null }> = ({ width, selectedProduct }) => {

  const { user } = useAppContext();



  useEffect(() => {

    if (!user) {
      return;
    }
    const vizElement = document.getElementById('tableauViz');

    if (vizElement?.children.length === 0) {

      const viz = new TableauViz();
      viz.src = 'https://10ay.online.tableau.com/t/ehofman/views/eBikeSalesAnalysis/SalesAnalysis';
      viz.toolbar = Toolbar.Hidden;
      viz.token = getJwt(user);
      viz.width = `${width}px`;

      vizElement.appendChild(viz);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {

    if (selectedProduct) {
      const viz = document.querySelector('tableau-viz')!;

      if (viz?.workbook) {
        const dashboard = viz.workbook.activeSheet;
        const worksheet = dashboard.worksheets.find(ws => ws.name === 'sales_BAN');

        worksheet.applyFilterAsync("Product Name", [selectedProduct.name], FilterUpdateType.Replace);
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct])

  return (
    <div id="tableauViz" className={styles.viz}></div>
  )
}

export default EmbeddedDashboard;
