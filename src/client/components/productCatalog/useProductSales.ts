import { Query } from '../../../server/hbi';
import { useAppContext } from '../../App';

export interface ProductSales {
  productName: string;
  sales: number;
}

export function useProductSales() {

  const { user } = useAppContext();

  async function getSalesPerProduct() {

    if (!user) {
      return [] as ProductSales[];
    }

    // Headless bi query
    const query: Query = {
      connection: {
        tableauServerName: 'us-west-2a.online.tableau.com',
        siteId: 'ehofmanvds',
        datasource: 'eBikesInventoryandSales'
      },
      query: {
        columns: [
          {
            columnName: "Product Name",
            columnAlias: "productName",
            sortPriority: 1
          },
          {
            columnName: "sales",
            calculation: "SUM([Sales])"
            // calculation: "SUM([Sales]) / TOTAL(SUM([Sales]))"
          }
        ],
        filters: [
          {
            filterType: "DATE",
            columnName: "Order Placed Date",
            periodType: "DAY",
            firstPeriod: -29,
            lastPeriod: 0
          },
          {
            columnName: "Account Name",
            filterType: "SET",
            values: [user.company],
            exclude: false
          },
        ]
      }
    };

    const post = {
      method: 'post',
      body: JSON.stringify(query),
      headers: {
        'Content-Type': 'application/json'
      }
    }

    const response = await fetch('http://localhost:5001/api/-/hbi-query', post);
    const json = await response.json();
    const results = (json.data ?? []) as ProductSales[];

    return results;

  }



  return { getSalesPerProduct };

}