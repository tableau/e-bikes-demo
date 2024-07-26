import { useEffect, useState } from 'react';
import styles from './EmbeddedPulse.module.css';
import { useAuth } from '../auth/useAuth';
import classNames from 'classnames';

export type PulseLayout = 'default' | 'card' | 'ban';

const EmbeddedPulse: React.FC<{
  url: string | undefined,
  layout: PulseLayout,
}> = ({ url, layout }) => {

  const { getJwtFromServer } = useAuth()
  const [jwt, setJwt] = useState<string | null>(null);

  useEffect(() => {

    (async () => {
      setJwt(await getJwtFromServer());
    })();

  }, []);

  useEffect(() => {

    if (!jwt || !url) {
      return;
    }

    const pulseElt = document.getElementById('tableauPulse');

    if (!pulseElt) {
      return;
    }

    loadAsync();

  }, [jwt, layout, url])

  async function loadAsync() {
    // @ts-expect-error hack because GitHub runner can't install @tableau/embedding-api ¯\_(ツ)_/¯
    const { TableauPulse, PulseLayout } = await import('https://10ay.online.tableau.com/javascripts/api/tableau.embedding.3.latest.js?url');

    const pulse = new TableauPulse();
    pulse.src = url;
    //pulse.layout = layout;
    pulse.token = jwt;

    console.log (url)

    const customParameter = document.createElement("custom-parameter");
    customParameter.setAttribute("name", "embed_layout");
    customParameter.setAttribute("value", layout);
    pulse.appendChild(customParameter);

    const pulseElt = document.getElementById('tableauPulse')!;
    pulseElt.innerHTML = '';
    pulseElt.appendChild(pulse);
  }

  return (
    <div className={styles[`${layout}Layout`]} id="tableauPulse" />
  )

}

export default EmbeddedPulse;
