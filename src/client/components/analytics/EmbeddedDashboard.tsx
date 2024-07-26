import { useEffect, useState } from 'react';
import styles from './EmbeddedDashboard.module.css';
import { ProductInfo } from '../productCatalog/ProductCatalog';
import { useAuth } from '../auth/useAuth';

const EmbeddedDashboard: React.FC<{
  sheet: string,
  width: number,
  height?: number,
  selectedProduct?: ProductInfo | null
}> = ({ sheet, width, height, selectedProduct }) => {

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
    const vizElement = document.getElementById('tableauViz')!;
    if (vizElement.children.length) {
      return;
    }

    // @ts-expect-error hack because GitHub runner can't install @tableau/embedding-api ¯\_(ツ)_/¯
    const { TableauEventType, TableauViz, Toolbar } = await import('https://10ay.online.tableau.com/javascripts/api/tableau.embedding.3.latest.js?url');

    const viz = new TableauViz();
    viz.src = `https://10ay.online.tableau.com/t/ehofman/views/eBikeSalesAnalysis/${sheet}`;
    viz.toolbar = Toolbar.Hidden;
    viz.token = jwt;
    if (height) viz.height = height;
    viz.width = `${width}px`;

    viz.addEventListener(TableauEventType.FirstInteractive, () => {
      setVizIsInteractive(true);
    });

    if (!vizElement.children.length) {
      vizElement.appendChild(viz);
    }
  }

  async function applyFilterAsync(selectedProduct: ProductInfo) {
    // @ts-expect-error hack because GitHub runner can't install @tableau/embedding-api ¯\_(ツ)_/¯
    const { FilterUpdateType, TableauViz } = await import('https://10ay.online.tableau.com/javascripts/api/tableau.embedding.3.latest.js?url');
    const viz = document.querySelector('tableau-viz') as typeof TableauViz;

    const dashboard = viz.workbook.activeSheet;
    const worksheet = (() => {
      if (!dashboard.worksheets) {
        // AI Response
        return dashboard;
      } else {
        for (const ws of dashboard.worksheets) {
          if (ws.name === 'sales_BAN') {
            return ws;
          }
        }
        return null;
      }
    })();

    if (worksheet) {
      worksheet.applyFilterAsync("Product Name", [selectedProduct.name], FilterUpdateType.Replace, { isExcludeMode: false });
    }
  }

  return (
    <div id="tableauViz" className={styles.viz}></div>
  )
}

export default EmbeddedDashboard;
