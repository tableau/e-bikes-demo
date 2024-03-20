import { useState } from 'react';
import EmbeddedDashboardUpsellable from './EmbeddedDashboardUpsellable';
import Product from './Product';
import styles from './ProductCatalog.module.css';
import { productlist } from './productlist';

export interface ProductInfo {
  id: number;
  name: string;
  price: number;
  imageSrc: string;
}

function ProductCatalog() {

  const [selectedProduct, setSelectedProduct] = useState<ProductInfo | null>(null);

  const products: ProductInfo[] = productlist();

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
            />
          ))}
        </div>
      </div>
      <EmbeddedDashboardUpsellable selectedProduct={selectedProduct}/>
    </div>
  )
}

export default ProductCatalog;
