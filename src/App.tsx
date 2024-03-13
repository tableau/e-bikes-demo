import { useState } from 'react'
import styles from './App.module.css';
import Header from './Header';
import Home from './Home';

export type Pages = 'Home' | 'Dashboard' | 'Pulse'

function App() {

  const [page, setPage] = useState<Pages>('Home');

  return (
    <div className={styles.root}>
      <Header page={page} onPageChange={(e) => setPage(e.newPage)} />

      {page === 'Home' && <Home />}
    </div>
  )
}

export default App
