import { useEffect, useState } from 'react';
import { usePulseApi } from './usePulseAPI';

const PulseEnhancedQA: React.FC<{
  jwt: string,
  theme: 'light' | 'dark',
}> = ({ jwt, theme }) => {

  const Q1 = 'What battery type decreased the most in sales due to high returns?';
  const Q2 = 'eBikes Inventory and Sales: What happened last month compared to the previous period for Wheelworks?';
  const loadingText = 'Pulse Enhanced Q&A loading...';

  const { getPulseEnhancedQAInsights } = usePulseApi();
  const [PulseEnhancedQAInsights, setPulseEnhancedQAInsights] = useState<string | null>(null);
  const [question, setQuestion] = useState<string>(Q1);
  const [userInput, setUserInput] = useState<string>(Q1);

  useEffect(() => {

    if (!jwt) {
      return;
    }

    (async () => {
      const markup = await getPulseEnhancedQAInsights(question);
      setPulseEnhancedQAInsights(markup);
    })();

  }, [jwt, question]);


  if (!jwt) {

    return <div>{loadingText}</div>

  } else {

    return (
      <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => { setUserInput(Q1); setQuestion(Q1); setPulseEnhancedQAInsights(null); }}>Q1</button>
          <button onClick={() => { setUserInput(Q2); setQuestion(Q2); setPulseEnhancedQAInsights(null); }}>Q2</button>
        </div>
        <div style={{
          display: 'flex',
          gap: '10px',
          flexDirection: 'column',
          fontSize: '18px',
          color: theme === 'light' ? 'black' : 'white',
        }}
        >
          <textarea
            value={userInput}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                setQuestion(userInput);
                setPulseEnhancedQAInsights(null)
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
              fontSize: '16px',
            }}
          />
          {PulseEnhancedQAInsights
            ? <div dangerouslySetInnerHTML={{ __html: PulseEnhancedQAInsights ?? '' }} />
            : <div>{loadingText}</div>
          }
        </div>
      </div>
    );

  }
}

export default PulseEnhancedQA;
