import { useEffect, useState } from 'react';
import styles from './EmbeddedPulse.module.css';
import { TableauPulse } from '@tableau/embedding-api-react';
import { useAuth } from '../auth/useAuth';

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

  if (!jwt) {
    return null;
  } else {

    return (
      <div key={layout} className={`${styles.root} ${styles[`${layout}Layout`]}`}>
        <TableauPulse
          src={url}
          token={jwt}
          layout={layout}
          themeParameters={[
            {
              name: 'fontCssUrl',
              value: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap',
            },
 
            { name: 'backgroundColor', value: '#ffffff' },
            { name: 'foregroundColor', value: 'hashtag#cff' },
            { name: 'bar', value: '#022', type: 'chart' },
          ]}
        />
      </div>
    )

  }

}

export default EmbeddedPulse;
