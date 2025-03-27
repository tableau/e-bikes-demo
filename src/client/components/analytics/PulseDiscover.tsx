import { useEffect, useState } from 'react';
import { usePulseApi } from './usePulseAPI';

const PulseDiscover: React.FC<{
  jwt: string,
  theme: 'light' | 'dark',
}> = ({ jwt, theme }) => {

  const Q1 = 'Which battery type had the highest sales last month?';
  const Q2 = 'eBikes Inventory and Sales: What happened last month compared to the previous period for Wheelworks?';

  const { getPulseDiscoverInsights } = usePulseApi();
  const [pulseDiscoverInsights, setPulseDiscoverInsights] = useState<string | null>(null);
  const [question, setQuestion] = useState<string>(Q1);
  const [userInput, setUserInput] = useState<string>(Q1);

  useEffect(() => {

    if (!jwt) {
      return;
    }

    (async () => {
      const markup = await getPulseDiscoverInsights(question);
      setPulseDiscoverInsights(markup);
    })();

  }, [jwt, question]);


  if (!jwt) {

    return <div>Pulse Discover loading...</div>

  } else {

    return (
      <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => { setUserInput(Q1); setQuestion(Q1); setPulseDiscoverInsights(null); }}>Q1</button>
          <button onClick={() => { setUserInput(Q2); setQuestion(Q2); setPulseDiscoverInsights(null); }}>Q2</button>
        </div>
        <div style={{
          display: 'flex',
          gap: '10px',
          flexDirection: 'column',
          color: theme === 'light' ? 'black' : 'white',
        }}
        >
          <textarea
            value={userInput}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                setQuestion(userInput);
                setPulseDiscoverInsights(null)
              }
            }}
            onChange={(e) => {
              setUserInput(e.target.value);
            }}
            style={{
              width: '100%',
              height: '75px',
              backgroundColor: 'transparent',
              color: theme === 'light' ? 'black' : 'white',
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '10px',
            }}
          />
          {pulseDiscoverInsights
            ? <div dangerouslySetInnerHTML={{ __html: pulseDiscoverInsights ?? '' }} />
            : <div>Pulse Discover loading...</div>
          }
        </div>
      </div>
    );

  }
}

export default PulseDiscover;
