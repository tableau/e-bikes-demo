import { useEffect, useState } from 'react';
import EmbeddedDashboardUpsellable from '../analytics/EmbeddedDashboardUpsellable';
import Product from './Product';
import styles from './ProductCatalog.module.css';
import { productlist } from './productlist';
import { ProductSales, useProductSales } from './useProductSales';

export interface ProductInfo {
  id: number;
  name: string;
  price: number;
  imageSrc: string;
}

function ProductCatalog() {

  const [selectedProduct, setSelectedProduct] = useState<ProductInfo | null>(null);
  const [sales, setSales] = useState<ProductSales[]>([]);

  const products: ProductInfo[] = productlist();
  const { getSalesPerProduct } = useProductSales();

  useEffect(() => {

    (async () => {
      const hbiData = await getSalesPerProduct();
      setSales(hbiData.sort((item1, item2) => item2.sales - item1.sales));
    })();

  }, []);

  return (
    <div className={styles.root}>
      <div className={styles.catalog}>
        <div className={styles.grid}>
          {products.map(product => (
            <Product
              product={product}
              key={product.id}
              selectProduct={() => setSelectedProduct(product)}
              selected={product.id === selectedProduct?.id}
              salesPerformance={(() => {
                if (sales?.length) {
                  return Math.floor( sales.map(item => item.productName).indexOf(product.name) / sales.length * 3) + 1;
                } else {
                  return undefined;
                }
              })()}
            />
          ))}
        </div>
      </div>
      <EmbeddedDashboardUpsellable selectedProduct={selectedProduct} />
    </div>
  )
}

export default ProductCatalog;
