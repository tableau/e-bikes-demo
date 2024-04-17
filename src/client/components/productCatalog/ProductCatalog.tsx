import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../App';
import EmbeddedDashboardUpsellable from '../analytics/EmbeddedDashboardUpsellable';
import Product from './Product';
import styles from './ProductCatalog.module.css';
import { productlist } from './productlist';
import { ProductSales, useProductSales } from './useProductSales';
import Sparkline from './Sparkline';

export interface ProductInfo {
  id: number;
  name: string;
  price: number;
  imageSrc: string;
}

function ProductCatalog() {
  const [selectedProduct, setSelectedProduct] = useState<ProductInfo | null>(null);
<<<<<<< HEAD
  const [sales, setSales] = useState<ProductSales[]>([]); // here we use react state to set the sales 

  const products: ProductInfo[] = productlist();
  const { getSalesPerProduct } = useProductSales(); // this is the function where we get the sales
=======
  const [sales, setSales] = useState<ProductSales[]>([]);
  const products: ProductInfo[] = productlist();
  const [hoveredProductName, setHoveredProductName] = useState<string | null>(null);
  const [hoveredProductSales, setHoveredProductSales] = useState<ProductSales[]>([]);
  const [totalSalesVolume, setTotalSalesVolume] = useState<number>(0);
  const [totalReturns, setTotalReturns] = useState<number>(0);
  const { user } = useAppContext();
  const { getSalesPerProduct } = useProductSales();
  const [isLoading, setIsLoading] = useState(false);
>>>>>>> origin/dev-eski-d34hbi-uaf4pds

  useEffect(() => {
    (async () => {
      const hbiData = await getSalesPerProduct();
      setSales(hbiData.sort((a, b) => b.sales - a.sales));
    })();
  }, []);

  useEffect(() => {
    if (user?.license === 'Premium' && hoveredProductName) {
      setIsLoading(true);
      const fetchAndSetSalesData = async () => {
        try {
          const data = await getSalesPerProduct({ includeOrderDate: true, productName: hoveredProductName });
          setHoveredProductSales(data);
          const totalVolume = data.reduce((acc, curr) => acc + curr.sales, 0);
          const totalRets = data.reduce((acc, curr) => acc + (curr.returns || 0), 0);
          setTotalSalesVolume(totalVolume);
          setTotalReturns(totalRets);
        } catch (error) {
          console.error("Error fetching sales details:", error);
          // Reset states in case of errors
          setHoveredProductSales([]);
          setTotalSalesVolume(0);
          setTotalReturns(0);
        } finally {
          setIsLoading(false); 
        }
      };

      fetchAndSetSalesData();
    } else {
      // Reset states when not hovered or not premium
      setHoveredProductSales([]);
      setTotalSalesVolume(0);
      setTotalReturns(0);
    }
  }, [hoveredProductName, user?.license]);

  // New handler for mouse enter that selects the product
  const handleMouseEnter = (product: ProductInfo) => {
    if (user?.license === 'Premium') {
      setHoveredProductName(product.name);
      setSelectedProduct(product); // Now also sets the product as selected
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.catalog}>
        <div className={styles.grid}>
          {products.map((product) => (
            <div 
              className={styles.cardContainer} 
              key={product.id}
<<<<<<< HEAD
              selectProduct={() => setSelectedProduct(product)}
              selected={product.id === selectedProduct?.id}
              salesPerformance={(() => {
                if (sales?.length) {
                  // Looks like this will either return 1, 2, or 3 depending on the relative position of the product within the sales array
                  return Math.floor( sales.map(item => item.productName).indexOf(product.name) / sales.length * 3) + 1;
                } else {
                  return undefined;
                }
              })()}
            />
=======
              onMouseEnter={() => handleMouseEnter(product)}
              onMouseLeave={() => setHoveredProductName(null)}
            >
              <div 
                className={`${styles.card} ${user?.license === 'Premium' && hoveredProductName === product.name ? styles.isFlipped : ''}`}
              >
                {user?.license === 'Premium' && hoveredProductName === product.name ? (
                  <div className={styles.cardBack}>
                    <Sparkline salesData={hoveredProductSales} totalSalesVolume={totalSalesVolume} totalReturns={totalReturns} isLoading={isLoading} />
                  </div>
                ) : (
                  <div className={styles.cardFront}>
                    <Product
                      product={product}
                      selectProduct={() => {}} // This is now handled by the onMouseEnter
                      selected={product.id === selectedProduct?.id}
                      salesPerformance={sales?.length ? Math.floor(sales.map(item => item.productName).indexOf(product.name) / sales.length * 3) + 1 : undefined}
                    />
                  </div>
                )}
              </div>
            </div>
>>>>>>> origin/dev-eski-d34hbi-uaf4pds
          ))}
        </div>
      </div>
      <EmbeddedDashboardUpsellable selectedProduct={selectedProduct} />
    </div>
  );
}

export default ProductCatalog;
