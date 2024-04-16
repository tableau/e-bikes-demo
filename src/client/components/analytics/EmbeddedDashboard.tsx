import { useEffect, useState } from 'react';
import styles from './EmbeddedDashboard.module.css';
import { ProductInfo } from '../productCatalog/ProductCatalog';
import { useAuth } from '../auth/useAuth';

const EmbeddedDashboard: React.FC<{ width: number, selectedProduct?: ProductInfo | null }> = ({ width, selectedProduct }) => {

  const { getJwtFromServer } = useAuth()
  const [vizIsInteractive, setVizIsInteractive] = useState<boolean>(false);
  const [jwt, setJwt] = useState<string | null>(null);

  const applyFilter = () => {
    if (!vizIsInteractive) {
      return;
    }

    if (selectedProduct) {
      applyFilterAsync(selectedProduct);
    }
  }

  useEffect(() => {

    (async () => {
      setJwt(await getJwtFromServer());
    })();

  }, []);

  useEffect(() => {

    if (!jwt) {
      return;
    }

    const vizElement = document.getElementById('tableauViz');

    if (vizElement?.children.length === 0) {
      loadVizAsync();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jwt])

  useEffect(() => {

    applyFilter();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct, vizIsInteractive])

  async function loadVizAsync() {
    // @ts-expect-error hack because GitHub runner can't install @tableau/embedding-api ¯\_(ツ)_/¯
    const { TableauEventType, TableauViz, Toolbar } = await import('https://10ay.online.tableau.com/javascripts/api/tableau.embedding.3.latest.js?url');

      const viz = new TableauViz();
      viz.src = 'https://10ay.online.tableau.com/t/ehofman/views/eBikeSalesAnalysis/SalesAnalysis';
      viz.toolbar = Toolbar.Hidden;
      viz.token = jwt;
      viz.width = `${width}px`;

      viz.addEventListener(TableauEventType.FirstInteractive, () => {
        setVizIsInteractive(true);
      });

      const vizElement = document.getElementById('tableauViz')!;
      vizElement.appendChild(viz);
  }

  async function applyFilterAsync(selectedProduct: ProductInfo) {
    // @ts-expect-error hack because GitHub runner can't install @tableau/embedding-api ¯\_(ツ)_/¯
    const { FilterUpdateType, TableauViz } = await import('https://10ay.online.tableau.com/javascripts/api/tableau.embedding.3.latest.js?url');
    const viz = document.querySelector('tableau-viz') as typeof TableauViz;

    const dashboard = viz.workbook.activeSheet;
    const worksheet = dashboard.worksheets.find(ws => ws.name === 'sales_BAN')!;

    worksheet.applyFilterAsync("Product Name", [selectedProduct.name], FilterUpdateType.Replace, { isExcludeMode: false });
  }

  return (
    <div id="tableauViz" className={styles.viz}></div>
  )
}

export default EmbeddedDashboard;
