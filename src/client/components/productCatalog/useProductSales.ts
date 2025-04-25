import { useAppContext } from '../../App'; // Adjust the import path as necessary

import { Query } from '../../../server/hbi'
import { useAuth } from '../auth/useAuth';
import { server, site, datasourceLuid } from "../../constants/Constants";
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { users } from '../../../db/users';

export interface ProductSales {
  productName: string;
  sales: number;
  inventoryUnits: number;
  returns: number; 
  orders?: number; 
  orderPlacedDate?: string; // Optional field for the order date
}

interface SalesQueryOptions {
  includeOrderDate?: boolean;
  productName?: string;
}

export function useProductSales() {

  const { userId } = useParams<{ userId: string }>();
  const user = users.find(u => u.username === userId); // Fetch user data based on userId

  const [jwt, setJwt] = useState<string | null>(null);
  const { getJwtFromServer } = useAuth()

  useEffect(() => {
    (async () => {
      if (jwt) {
        return;
      }
      const val = await getJwtFromServer();
      setJwt(val);
    })();
  }, [jwt, getJwtFromServer]);

  async function getSalesPerProduct({ includeOrderDate = false, productName }: SalesQueryOptions = {}) {
    if (!user || !jwt) {
      return [] as ProductSales[];
    }

    // Define the basic query structure with type assertion for TypeScript
    const query: Query = {
      datasource: {
        datasourceLuid: datasourceLuid,
      },
      query: {
        fields: [
          {
            fieldCaption: "Product Name",
            fieldAlias: "productName"
          },
          {
            fieldCaption: "sales",
            calculation: "SUM([Sales])"
          },
          // {
          //   columnName: "InventoryUnits",
          //   function: "SUM",
          // },
          // {
          //   columnName: "OrderID",
          //   // columnAlias: "orders",
          //   function: "COUNT_DIST",
          // },
          {
            fieldCaption: "returns",
            calculation: `SUM(if [Return Flag] = "Yes" then [Units] else 0 end)`
            // calculation: `SUM(if [Return Flag] = "Yes" AND [Current vs Previous] = "Current" then [Units] else 0 end)`, //this isn't working yet because hbi doesn't support LOD, which is used in one of these fields
          },
          
        ],
        filters: [
          {
            filterType: "DATE",
            field: {
              fieldCaption: "Order Placed Date",
            },
            periodType: "DAYS",
            dateRangeType: "LASTN",
            rangeN: 30
          },
          {
            field: {
              fieldCaption: "Account Name"
            },
            filterType: "SET",
            values: [user.company],
            exclude: false
          },
        ]
      }
    };

    // Conditionally add the Order Placed Date column if requested
    if (includeOrderDate) {
      query.query.fields.push({
        fieldCaption: "Order Placed Date",
        fieldAlias: "orderPlacedDate",
        sortPriority: 1
      });
    }

    // Optionally add a filter for a specific product name
    if (productName) {
      query.query.filters.push({
        filterType: "SET",
        field: {
          fieldCaption: "Product Name"
        },
        values: [productName],
        exclude: false
      });
    }

    const post = {
      method: 'post',
      body: JSON.stringify(query),
      headers: {
        'Content-Type': 'application/json',
        server: server,
        site: site,
        jwt: jwt
      },
    };

    try {
      const response = await fetch('/api/-/hbi-query', post);
      const json = await response.json();

      return (json.data ?? []) as ProductSales[];
    } catch (error) {
      console.error('Error fetching sales data:', error);
      return [];
    }
  }

  return { getSalesPerProduct };
}