import React, { Fragment, useState, useEffect } from 'react';
import styles from './NotificationBell.module.css';
import { useAppContext } from '../../App';
import NotificationWindow from './NotificationWindow';
import { NotificationItem } from './NotificationWindow';
import { Query } from '../../../server/hbi'
import { useAuth } from '../auth/useAuth';
import { server, site, datasourceLuid } from "../../../constants/Constants";

// Our HBI Query to get return percentages
const query: Query = {
  datasource: {
    datasourceLuid: datasourceLuid,
  },
  query: {
    fields: [
      {
        fieldCaption: "Account Name",
        fieldAlias: "accountName",
        sortPriority: 1
      },
      {
        fieldCaption: "Product Name",
        fieldAlias: "productName",
        sortPriority: 2
      },
      {
        fieldCaption: "returnPercentage",
        // Note that for "Migrated Data" we have to use the name of the column as the
        // underlying Tableau PDS knows it (count). Not the human created name.
        calculation: "SUM(IF [Return Flag] = 'Yes' THEN 1 END) / COUNT([count])"
      }
    ],
    filters: [
      {
        filterType: "DATE",
        field: {
          fieldCaption: "Order Placed Date"
        },
        periodType: "DAYS",
        dateRangeType: "LASTN",
        rangeN: 30
      }
    ]
  }
};

// We should get back these objects as data
export type AccountReturns = {
  accountName: string,
  productName: string,
  returnPercentage: number
}

const NotificationBell: React.FC = () => {

  const { notifications, notificationReceived } = useAppContext();
  const [showPopup, setShowPopup] = useState(false);
  const [jwt, setJwt] = useState<string | null>(null);
  const { getJwtFromServer } = useAuth()

  useEffect(() => {
    (async () => {
      if (jwt) {
        return;
      }
      setJwt(await getJwtFromServer());
    })();

  }, [jwt, getJwtFromServer]);
  

  useEffect(() => {
    if (notifications.length > 0) {
      return;
    }

    (async () => {
      if (!jwt) {
        return;
      }
      const post = {
        method: 'post',
        body: JSON.stringify(query),
        headers: {
          'Content-Type': 'application/json',
          server: server,
          site: site,
          jwt: jwt
        }
      }

      const response = await fetch('/api/-/hbi-query', post);
      const json = await response.json();
      const results = (json.data ?? []) as AccountReturns[];

      if (results?.length) {

        const notifications = results
        .sort((account1, account2) => account2.returnPercentage - account1.returnPercentage)
        .filter(account => {
          switch(account.accountName) {
            case 'Northern Trail Cycling': return account.productName === 'FUSE X2'
            case 'Trailblazers': return account.productName === 'VOLT X1'
            case 'Wheelworks': return account.productName === 'ELECTRA X4'
          }
        })
        .map(account => {
          const returnPercentage = account.returnPercentage.toLocaleString('en-US', { style: 'percent', minimumFractionDigits: 2 });

          return {
            title: `High returns: ${account.accountName}`,
            message: `${returnPercentage} of the product ${account.productName} was returned in the last month.`
          } as NotificationItem;
        });

        notificationReceived(notifications);
      }

    })();
  }, [jwt, notificationReceived, notifications.length])

  return (
    <Fragment>
      <div id={'notificationBell'} className={styles.notificationContainer}>
        <div className={styles.notificationIcon}>
          <img key={'Notification'} className={styles.notification} src={`/notification.png`} onClick={() => setShowPopup(prevShowPopup => !prevShowPopup)} />
        </div>
        {notifications.length > 0 &&
          <div className={styles.notificationCount}>{notifications.length}</div>
        }
        {showPopup && <NotificationWindow notifications={notifications} onClose={() => setShowPopup(false)} />}
      </div>
    </Fragment>
  );
}

export default NotificationBell;
