import styles from './PulseCustom.module.css';
import { BanInsight } from './usePulseAPI';
import classNames from 'classnames';

const PulseCustom: React.FC<{
  banInsight: BanInsight,
}> = ({ banInsight }) => {

  return (
    <div
      className={styles.card}
      key={banInsight.metricDefinition.name}
      title={banInsight.markup}
    >
      <div className={styles.header}>
        <div className={styles.name}>{banInsight.metricDefinition.name}</div>
        <div className={styles.period}>{banInsight.period}</div>
      </div>
      <div className={styles.ban}>
        <div className={styles.value}>{banInsight.value}</div>
        <div className={classNames(styles.triangle, styles[banInsight.direction], styles[banInsight.sentiment])}></div>
      </div>
    </div>
  )
}

export default PulseCustom;
