import styles from './Home.module.css';

function Home() {

  return (
    <div className={styles.root}>
      <video className={styles.video}  autoPlay muted loop>
        <source src="src/assets/ebikes.mp4" type="video/mp4" />
      </video>
      <div className={styles.heroDynamo}>
        <h1>DYNAMO X2</h1>
        <h2>CONQUER THE IMPOSSIBLE</h2>
        <p>EXPLORE MORE</p>
      </div>
      <img className={styles.img} src='src/assets/CyclingGrass.jpg' />
      <div className={styles.heroElectra}>
        <h1>ELECTRA SERIES</h1>
        <h2>RIDE WITH POWER</h2>
        <p>SEE ELECTRA BIKES</p>
      </div>
    </div>
  )
}

export default Home;
