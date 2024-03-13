import { useState } from 'react'
import styles from './App.module.css';
import Header from './Header';
import Home from './Home';
import Analytics from './Analytics';
import Pulse from './Pulse';

export type Pages = 'Home' | 'Analytics' | 'Pulse'

function App() {

  const [page, setPage] = useState<Pages>('Home');

  return (
    <div className={styles.root}>
      <Header page={page} onPageChange={(e) => setPage(e.newPage)} />

      {page === 'Home' && <Home />}
      {page === 'Analytics' && <Analytics />}
      {page === 'Pulse' && <Pulse />}
    </div>
  )
}

export default App
