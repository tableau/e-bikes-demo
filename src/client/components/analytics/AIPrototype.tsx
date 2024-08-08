import { useEffect, useState } from 'react';
import styles from './AIPrototype.module.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { VegaLite } from 'react-vega';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { ThreeDots } from 'react-loader-spinner';
import { useAuth } from '../auth/useAuth';
import EmbeddedDashboard from './EmbeddedDashboard';
import EmbeddedPulse from './EmbeddedPulse';

function AIPrototype() {

  type State = 'idle' | 'typing' | 'readyToCommit' | 'committing';

  const { getJwtFromServer } = useAuth()
  const [jwt, setJwt] = useState<string | null>(null);

  const [value, setValue] = useState('');
  const [state, setState] = useState<State>('idle');
  const [currentPromptIndex, setCurrentPromptIndex] = useState(-1);
  const [currentPromptResponseIndex, setCurrentPromptResponseIndex] = useState<number | null>(null);
  const [showDevComponents, setShowDevComponents] = useState(false);

  useEffect(() => {

    (async () => {
      setJwt(await getJwtFromServer());
    })();

  }, []);


  const spec = {
    width: 400,
    height: 200,
    mark: 'bar',
    encoding: {
      x: { field: 'Partner', type: 'ordinal' },
      y: { field: 'Sales', type: 'quantitative' },
    },
    data: { name: 'table' },
  }

  const data = [
    { Partner: 'Wheelworks', Sales: 1400, Orders: 270 },
    { Partner: 'Steer & co', Sales: 1286, Orders: 212 },
    { Partner: 'Peddlemore', Sales: 967, Orders: 189 },
    { Partner: 'Brakehard', Sales: 548, Orders: 138 },
    { Partner: 'Flattire', Sales: 356, Orders: 49 },
  ];

  const responseText = `${data[0].Partner} was the best selling partner with $${data[0].Sales} in sales last month, followed by ${data[1].Partner} ($${data[1].Sales}) and ${data[2].Partner} ($${data[2].Sales})`;
  const responseHtml = `<div><b>${data[0].Partner}</b> was the best selling partner with <b>$${data[0].Sales}</b> in sales last month, followed by <b>${data[1].Partner}</b> (<b>$${data[1].Sales}</b>) and <b>${data[2].Partner}</b> (<b>$${data[2].Sales}</b>)</div>`;

  const prompts = [
    {
      prompt: 'Which 3 partners had the highest sales last month?',
      output: 'text',
      onPrompt: `document.getElementById('output').innerText = response.text;`,
      responseText: responseText,
      responseHtml: responseHtml,
      responseData: `${data.slice(0, 3).map(row => `    {\n      partner: '${row.Partner}',\n      sales: ${row.Sales},\n    },`).join('')}`,
      componentToRender: <div>{responseText}</div>,
    },
    {
      prompt: 'How many orders have each of the partners received?',
      output: 'table',
      onPrompt: `document.getElementById('output').innerHtml = response.html;`,
      responseText: `Orders by partners: ${data.map(row => `${row.Partner} (${row.Orders})`).join(',')}`,
      responseHtml: `<table><thead><tr><th>Partner</th><th>Orders</th></tr></thead><tbody>${data.map(row => (`<tr><td>{${row.Partner}}</td><td>{${row.Orders}}</td></tr>)`))}</tbody></table>`,
      responseData: data.map(row => `    {\n      partner: '${row.Partner}',\n      sales: ${row.Sales},\n    },`).join('\n'),
      componentToRender: (
        <table>
          <thead>
            <tr><th>Partner</th><th>Orders</th></tr>
          </thead>
          <tbody>
            {data.map(row => (<tr><td>{row.Partner}</td><td>{row.Orders}</td></tr>))}
          </tbody>
        </table>
      ),
    },
    {
      prompt: 'Show these results in a line chart',
      output: 'tableau-viz',
      onPromptScripts: [
        '<script src="https://10ay.online.tableau.com/javascripts/api/tableau.embedding.3.latest.js"></script>',
      ],
      onPrompt: `document.getElementById('output').appendChild(response.html);`,
      responseText: undefined,
      responseHtml: `<tableau-viz src='[temp-url]' token='[authtoken]' />`,
      responseData: undefined,
      componentToRender: <div style={{ width: '800px' }}><EmbeddedDashboard sheet={'AIResponse'} width={600} height={300} /></div>,
    },
    {
      prompt: 'Filter the data to show the bike DYNAMO X1 only',
      output: 'tableau-viz',
      onPromptScripts: [
        '<script src="https://10ay.online.tableau.com/javascripts/api/tableau.embedding.3.latest.js"></script>',
      ],
      onPrompt: `document.getElementById('output').appendChild(response.html);`,
      responseText: undefined,
      responseHtml: `<tableau-viz src='[temp-url]' token='[authtoken]' />`,
      responseData: undefined,
      componentToRender: <div style={{ width: '800px' }}><EmbeddedDashboard sheet={'AIResponse'} width={600} height={300} selectedProduct={{ name: 'DYNAMO X1' }} /></div>,
    },
    {
      prompt: 'Convert this in a KPI that I can track in Salesforce',
      output: 'tableau-pulse',
      onPromptScripts: [
        '<script src="https://10ay.online.tableau.com/javascripts/api/tableau.embedding.3.latest.js"></script>',
      ],
      onPrompt: `document.getElementById('output').appendChild(response.html);`,
      responseText: undefined,
      responseHtml: `<tableau-pulse src='[temp-url]' token='[authtoken]' layout='ban' />`,
      responseData: undefined,
      componentToRender: <EmbeddedPulse layout='ban' url={'https://10ay.online.tableau.com/pulse/site/ehofman/metrics/8f6d2220-d916-4cec-bfa6-0e0f02eb168c'} />,
    },
    {
      prompt: 'Show me the trendline on that KPI',
      output: 'tableau-pulse',
      onPromptScripts: [
        '<script src="https://10ay.online.tableau.com/javascripts/api/tableau.embedding.3.latest.js"></script>',
      ],
      onPrompt: `document.getElementById('output').appendChild(response.html);`,
      responseText: undefined,
      responseHtml: `<tableau-pulse src='[temp-url]' token='[authtoken]' layout='card' />`,
      responseData: undefined,
      componentToRender: <div style={{ transform: 'scale(0.75)', transformOrigin: 'top left' }}><EmbeddedPulse layout='card' url={'https://10ay.online.tableau.com/pulse/site/ehofman/metrics/8f6d2220-d916-4cec-bfa6-0e0f02eb168c'} /></div>,
    },
    {
      prompt: 'Show me the result in a Vega bar chart',
      output: 'vega',
      onPromptScripts: [
        '<script src="https://cdn.jsdelivr.net/npm/vega@5"></script>',
        '<script src="https://cdn.jsdelivr.net/npm/vega-lite@5"></script>',
        '<script src="https://cdn.jsdelivr.net/npm/vega-embed@6"></script>',
      ],
      onPrompt: `const specWithData = { ...response.spec, data: { values: response.data } };\n  vegaEmbed('#vega', specWithData)`,
      responseText: undefined,
      responseHtml: `<div id='vega' />`,
      responseSpec: JSON.stringify(spec),
      responseData: data.map(row => `    {\n      partner: '${row.Partner}',\n      sales: ${row.Sales},\n    },`).join('\n'),
      componentToRender: <VegaLite spec={spec as any} data={{ table: data }} />,
    },
  ];


  const simulateTyping = (text: string) => {
    let index = -1;
    const interval = setInterval(() => {
      if (index < text.length - 1) {
        setValue((prev) => prev + text[index]);
        index++;
      } else {
        clearInterval(interval);
        setState('readyToCommit');
      }
    }, 20);
  };

  return (
    <div className={styles.root}>
      <div className={styles.mainArea}>
        <div className={styles.promptArea}>
          <textarea
            value={value}
            readOnly
            className={styles.fixedSizeTextarea}
            placeholder={'Type your prompt...'}
          />
          <button
            className={state !== 'readyToCommit' ? styles.disabled : ''}
            onClick={() => {

              setState('committing');
              setCurrentPromptResponseIndex(null);

              setTimeout(() => {
                setState('idle');
                setCurrentPromptResponseIndex(currentPromptIndex);
              }, 1000)
            }}
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
          <div
            className={styles.nextPrompt}
            onClick={() => {
              if (state === 'typing') return;

              const newIndex = (currentPromptIndex + 1) % (prompts.length)
              setCurrentPromptIndex(newIndex);
              setState('typing');
              setValue('');
              simulateTyping(prompts[newIndex].prompt);
            }}
          >
            <u>{currentPromptIndex === prompts.length -1 ? 'Reset' : 'Next prompt'}</u>
          </div>
        </div>
        <div className={styles.responseArea}>
          <div className={styles.user}>
            {currentPromptResponseIndex !== null ? prompts[currentPromptResponseIndex].componentToRender : null}
          </div>
          {state === 'committing' &&
            <ThreeDots
              visible={true}
              height="80"
              width="80"
              color="#4fa94d"
              radius="9"
              ariaLabel="three-dots-loading"
              wrapperStyle={{}}
              wrapperClass=""
            />
          }
        </div>
      </div>
      <div className={styles.toggleDeveloper}>
        <button onClick={() => setShowDevComponents(prev => !prev)}>{showDevComponents ? 'Hide' : 'Show'} developer mode</button>
      </div>
      {showDevComponents &&
        <div className={styles.developerInfo}>
          <div className={styles.webComponentSyntax}>
            HTML the developer would put in their application
            <SyntaxHighlighter language={'html'} style={okaidia} customStyle={{ height: '350px' }}>
              {(currentPromptResponseIndex !== null && prompts[currentPromptResponseIndex].onPromptScripts?.length
                ?  prompts[currentPromptResponseIndex].onPromptScripts?.join('\n') + '\n\n'
                : '') +
                (currentPromptResponseIndex !== null
                  ? `function onPrompt(response) {\n  ${prompts[currentPromptResponseIndex]?.onPrompt}\n}\n\n<tableau-einstein \n  data-sources="SalesData,ReturnData"\n  output="${prompts[currentPromptResponseIndex]?.output}"\n  onPrompt="onPrompt"\n/>`
                  : '')
              }
            </SyntaxHighlighter>
          </div>
          <div className={styles.backendResponse}>
            Payload for the response in onPrompt
            <SyntaxHighlighter language={'json'} style={okaidia} customStyle={{ height: '350px' }}>
              {
                currentPromptResponseIndex !== null
                  ? [
                    `{`,
                    ((!prompts[currentPromptResponseIndex]?.responseText) ? '' : `  text: '${prompts[currentPromptResponseIndex]?.responseText}',`),
                    ((!prompts[currentPromptResponseIndex]?.responseHtml) ? '' : `  html: '${prompts[currentPromptResponseIndex]?.responseHtml}',`),
                    ((!prompts[currentPromptResponseIndex]?.responseSpec) ? '' : `  spec: '${prompts[currentPromptResponseIndex]?.responseSpec}',`),
                    ((!prompts[currentPromptResponseIndex]?.responseData) ? '' : `  data: [\n${prompts[currentPromptResponseIndex]?.responseData}\n  ],`),
                    `}`,
                  ].filter(s => !!s).join('\n')
                  : ''
              }
            </SyntaxHighlighter>
          </div>
        </div>
      }
    </div>
  )
}

export default AIPrototype;
