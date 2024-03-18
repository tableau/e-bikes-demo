import { useState } from 'react';
import styles from './Product.module.css';
import { ProductInfo } from '../Pages/ProductCatalog';

interface ProductProps {
  product: ProductInfo;
}

const Product: React.FC<ProductProps> = ({ product }) => {

  const [quickViewOpen, setQuickViewOpen] = useState<boolean>(false);

  return (
    <div className={styles.root}>
      <div
        key={product.id}
        className={styles.productCard}
        onClick={() => { setQuickViewOpen(true) }}
      >
        <div className={styles.productImage}>
          <img
            className={styles.productImage}
            src={product.imageSrc}
            alt={product.imageAlt}
          />
        </div>
        <div className={styles.productDescription}>
          <h3>{product.name}</h3>
          <p>MSRP: ${product.price}</p>
        </div>
      </div>
    </div>
  )
}

export default Product;
