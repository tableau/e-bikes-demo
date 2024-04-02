import styles from './Product.module.css';
import { ProductInfo } from './ProductCatalog';

interface ProductProps {
  product: ProductInfo;
  selected: boolean;
  salesPerformance: number | undefined;
  selectProduct: () => void;
}

const Product: React.FC<ProductProps> = ({ product, selected, salesPerformance, selectProduct }) => {

  return (
    <div
      key={product.id}
      className={`${styles.root} ${selected ? styles.selected : ''}`}
    >
      <div
        key={product.id}
        className={styles.productCard}
        onClick={selectProduct}
      >
        <div className={styles.productImage}>
          <img
            className={styles.productImage}
            src={product.imageSrc}
          />
        </div>
        <div className={styles.productDescription}>
          <h3>{product.name}</h3>
          <p>MSRP: ${product.price}</p>
        </div>
        <div className={`${styles.sales} q${salesPerformance}`}>
          {(salesPerformance && '$'.repeat(salesPerformance))}
        </div>
      </div>
    </div>
  )
}

export default Product;
