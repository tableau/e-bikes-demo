import { useEffect, useState } from 'react';
import { usePulseApi } from './usePulseAPI';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from "rehype-raw";
import styles from './PulseEnhancedQA.module.css';
import CitationPopup from './CitationPopup';

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
  const [selectedCitation, setSelectedCitation] = useState<{ metricId: string; insightId: string; number: number } | null>(null);

  // Convert citations from [[n]](randomguid|id) to clickable links that open popup
  const convertCitations = (content: string): string => {
    // Pattern matches [[n]](randomguid|id) where n is a number, we capture both randomguid and id
    // Format: [[n]](guid|id) - we extract both values separated by pipe character
    const citationPattern = /\[\[(\d+)\]\]\(([^|]+)\|([^)]+)\)/gi;

    // The insightId is the auto-generated id for the insight based on the metric. That is what the Enhanced Q&A used to 
    // generate the answer to the user.
    // The metricId is the id of the metric that was used to base the insight of.
    
    return content.replace(citationPattern, (_match, number, insightId, metricId) => {
      return `<a href="#" data-citation-number="${number}" data-metric-id="${metricId}" data-insight-id="${insightId}" class="citation-link">[${number}]</a>`;
    });
  };

  const handleCitationClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('citation-link')) {
      e.preventDefault();
      const citationNumber = target.getAttribute('data-citation-number');
      const metricId = target.getAttribute('data-metric-id');
      const insightId = target.getAttribute('data-insight-id');
      if (citationNumber && metricId && insightId) {
        setSelectedCitation({ metricId, insightId, number: parseInt(citationNumber) });
      }
    }
  };

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
      <>
        <div className={styles.root} style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
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
            <div onClick={handleCitationClick}>
              {PulseEnhancedQAInsights
                ? <ReactMarkdown  rehypePlugins={[rehypeRaw]}>
                    {convertCitations(PulseEnhancedQAInsights)}
                  </ReactMarkdown>
                : <div>{loadingText}</div>
              }
            </div>
          </div>
        </div>
        
        {selectedCitation && (
          <CitationPopup
            metricId={selectedCitation.metricId}
            citationNumber={selectedCitation.number}
            jwt={jwt}
            onClose={() => setSelectedCitation(null)}
          />
        )}
      </>
    );

  }
}

export default PulseEnhancedQA;
