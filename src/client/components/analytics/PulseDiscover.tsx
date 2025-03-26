import { useEffect, useState } from 'react';
import { usePulseApi } from './usePulseAPI';

const PulseDiscover: React.FC<{
  jwt: string,
}> = ({ jwt }) => {

  const Q1 = 'Which battery type had the highest sales last month?';
  const Q2 = 'eBikes Inventory and Sales: What happened last month compared to the previous period for Wheelworks?';

  const { getPulseDiscoverInsights } = usePulseApi();
  const [pulseDiscoverInsights, setPulseDiscoverInsights] = useState<string | null>(null);
  const [question, setQuestion] = useState<string>(Q1);

  useEffect(() => {

    if (!jwt) {
      return;
    }

    (async () => {
      const markup = await getPulseDiscoverInsights(question);
      setPulseDiscoverInsights(markup);
    })();

  }, [jwt, question]);


  if (!pulseDiscoverInsights || !jwt) {

    return <div>Pulse Discover loading...</div>

  } else {

    return (
      <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => { setQuestion(Q1); setPulseDiscoverInsights(null); }}>Q1</button>
          <button onClick={() => { setQuestion(Q2); setPulseDiscoverInsights(null); }}>Q2</button>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexDirection: 'column'  }}>
          <h3>{question}</h3>
          <div dangerouslySetInnerHTML={{ __html: pulseDiscoverInsights ?? '' }} />
        </div>
      </div>
    );

  }
}

export default PulseDiscover;
