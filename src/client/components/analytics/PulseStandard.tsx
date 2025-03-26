import styles from './PulseStandard.module.css';
import EmbeddedPulse from './EmbeddedPulse';
import { BanInsight } from './usePulseAPI';

const PulseStandard: React.FC<{
  jwt: string | null,
  banInsights: BanInsight[] | null,
  theme: 'light' | 'dark',
}> = ({ jwt, banInsights, theme }) => {

  if (!banInsights || !jwt) {

    return null;

  } else {

    const pulseUrl = (banInsights && banInsights[0].metricDefinition.url) ?? '';

    return (
      <>
        <div className={styles.pulseban}>
          <EmbeddedPulse key={'ban'} url={pulseUrl} jwt={jwt} layout={'ban'} theme={theme} />
        </div>
        <div className={styles.pulsecard}>
          <EmbeddedPulse key={'card'} url={pulseUrl} jwt={jwt} layout={'card'} theme={theme} />
        </div>
        <div className={styles.pulsedefault}>
          <EmbeddedPulse key={'default'} url={pulseUrl} jwt={jwt} layout={'default'} theme={theme} />
        </div>
      </>
    )

  }
}

export default PulseStandard;
