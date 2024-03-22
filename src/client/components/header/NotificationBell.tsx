import React, { Fragment, useState, useEffect } from 'react';
import styles from './NotificationBell.module.css';
import { useAppContext } from '../../App';
import NotificationWindow from './NotificationWindow';
import { NotificationItem } from './NotificationWindow';
import { Query } from '../../../server/hbi'

// Our HBI Query to get return percentages
const query: Query = {
    connection: {
        tableauServerName: 'us-west-2a.online.tableau.com',
        siteId: 'ehofmanvds',
        datasource: 'eBikesInventoryandSales'
    },
    query: {
        columns: [
            {
                columnName: "Account Name",
                columnAlias: "accountName",
                sortPriority: 1
            },
            {
                columnName: "Product Name",
                columnAlias: "productName",
                sortPriority: 2
            },
            {
                columnName: "returnPercentage",
                // Note that for "Migrated Data" we have to use the name of the column as the
                // underlying Tableau PDS knows it (count). Not the human created name.
                calculation: "SUM(IF [Return Flag] = 'Yes' THEN 1 END) / COUNT([count])"
            }
        ],
        filters: [
          {
            filterType: "DATE",
            columnName: "Order Placed Date",
            periodType: "DAY",
            // Note that to get the last 30 days, it's actually -29 for the value. Thinking about fixing that
            // but currently that's how it works. We can also put an anchor date in here if needed. Right
            // Now it's the last 30 days from now.
            firstPeriod: -29,
            lastPeriod: 0
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

    const { notifications,  notificationReceived } = useAppContext();
    const [showPopup, setShowPopup] = useState(false);

    useEffect(() => {
        if (notifications.length > 0) {
          return;
        }
        const post = {
          method: 'post',
          body: JSON.stringify(query),
          headers: {
            'Content-Type': 'application/json'
          }
        }
        fetch('http://localhost:5001/api/-/hbi-query', post)
          .then(response => response.json())
          .then(response => response.data)
          .then((results: object[]) => results[0])
          .then(results => {
            const resultsList = results as object[];
            if (resultsList !== null && resultsList !== undefined && resultsList.length > 0) {
                const notifications = resultsList.map(value => {
                    const ar: AccountReturns = value as AccountReturns;
                    console.log(ar);
                    const p = ar.returnPercentage.toLocaleString('en-US', {style: 'percent', minimumFractionDigits:2}); 
                    const item = {
                    title: `High returns: ${ar.accountName}`,
                    message: `Your partner ${ar.accountName} has returned ${p} of their ${ar.productName} bikes in the last month. Please reach out to them as soon as possible.`
                    } as NotificationItem;
                    return item;
                });
                notificationReceived(notifications);
            }
          });
      })

    return (
        <Fragment>
            <div id={'notificationBell'} className={styles.notificationContainer}>
                <div className={styles.notificationIcon}>
                    <img key={'Notification'} className={styles.notification} src={`notification.png`} onClick={() => setShowPopup(prevShowPopup => !prevShowPopup)} />
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
