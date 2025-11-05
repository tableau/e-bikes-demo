import React from 'react';
import styles from './CitationPopup.module.css';
import EmbeddedPulse from './EmbeddedPulse';
import VegaLite from 'react-vega/lib/VegaLite';

interface CitationPopupProps {
  metricId: string;
  sourceInsights: any | null;
  citationNumber: number;
  jwt: string;
  onClose: () => void;
}

const CitationPopup: React.FC<CitationPopupProps> = ({ metricId, sourceInsights, citationNumber, jwt, onClose }) => {

  const pulseUrl = `https://10ay.online.tableau.com/pulse/site/ehofman/metrics/${metricId}`;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Citation [{citationNumber}]</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className={styles.content}>
          {
            sourceInsights
              ? <VegaLite spec={sourceInsights.viz} style={{height: '100%', width: '100%'}} />
              : <EmbeddedPulse key={'card'} url={pulseUrl} jwt={jwt} layout={'card'} theme={'none'} />
          }
        </div>
      </div>
    </div>
  );
};

export default CitationPopup;

