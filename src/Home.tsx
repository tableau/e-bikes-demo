import styles from './Home.module.css';

function Home() {

  return (
    <div className={styles.root}>
      <div>
        <video className={styles.video} autoPlay muted loop>
          <source src="ebikes.mp4" type="video/mp4" />
        </video>
        <div className={styles.heroDynamo}>
          <h1 className={styles.title}>DYNAMO X2</h1>
          <h2 className={styles.subtitle}>CONQUER THE IMPOSSIBLE</h2>
          <div className={styles.action}>EXPLORE MORE</div>
        </div>
      </div>
      <div>
        <img className={styles.img} src='CyclingGrass.jpg' />
        <div className={styles.heroElectra}>
          <h1 className={styles.title}>ELECTRA SERIES</h1>
          <h2 className={styles.subtitle}>RIDE WITH POWER</h2>
          <div className={styles.action}>SEE ELECTRA BIKES</div>
        </div>
      </div>
    </div>
  )
}

export default Home;
