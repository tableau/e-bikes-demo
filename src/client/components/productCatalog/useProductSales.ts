import { useAppContext } from '../../App'; // Adjust the import path as necessary

export interface ProductSales {
  productName: string;
  sales: number;
  inventoryUnits: number;
  returns: number; 
  orders?: number; 
  orderPlacedDate?: string; // Optional field for the order date
}

// Define interfaces for your query structure
interface QueryColumn {
  columnName: string;
  columnAlias?: string;
  sortPriority?: number;
  calculation?: string;
  function?: string;
}

interface QueryFilter {
  filterType: string;
  columnName: string;
  values?: string[];
  exclude?: boolean;
  units?: string;
  pastCount?: number;
  futureCount?: number;
}

interface QueryStructure {
  connection: {
    tableauServerName: string;
    siteId: string;
    datasource: string;
  };
  query: {
    columns: QueryColumn[];
    filters: QueryFilter[];
  };
}

interface SalesQueryOptions {
  includeOrderDate?: boolean;
  productName?: string;
}

export function useProductSales() {
  const { user } = useAppContext(); // Ensure you have a context that provides user information

  async function getSalesPerProduct({ includeOrderDate = false, productName }: SalesQueryOptions = {}) {
    if (!user) {
      return [] as ProductSales[];
    }

    // Define the basic query structure with type assertion for TypeScript
    const query: QueryStructure = {
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
            columnName: "returns",
            calculation: `SUM(if [Return Flag] = "Yes" then [Units] else 0 end)`
            // calculation: `SUM(if [Return Flag] = "Yes" AND [Current vs Previous] = "Current" then [Units] else 0 end)`, //this isn't working yet because hbi doesn't support LOD, which is used in one of these fields
          },
          
        ],
        filters: [
          {
            filterType: "DATE",
            columnName: "Order Placed Date",
            units: "DAY",
            pastCount: 30,
            futureCount: 0
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

    // Conditionally add the Order Placed Date column if requested
    if (includeOrderDate) {
      query.query.columns.push({
        columnName: "Order Placed Date",
        columnAlias: "orderPlacedDate",
      });
    }

    // Optionally add a filter for a specific product name
    if (productName) {
      query.query.filters.push({
        filterType: "SET",
        columnName: "Product Name",
        values: [productName],
        exclude: false
      });
    }

    const post = {
      method: 'post',
      body: JSON.stringify(query),
      headers: {
        'Content-Type': 'application/json'
      },
    };

    try {
      const response = await fetch('/api/-/hbi-query', post);
      const json = await response.json();

       console.log('Hbi data:' , json)

      return (json.data ?? []) as ProductSales[];
    } catch (error) {
      console.error('Error fetching sales data:', error);
      return [];
    }
  }

  return { getSalesPerProduct };
}