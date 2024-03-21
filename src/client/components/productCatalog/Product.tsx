import styles from './Product.module.css';
import { ProductInfo } from './ProductCatalog';

interface ProductProps {
  product: ProductInfo;
  selected: boolean;
  selectProduct: () => void;
}

const Product: React.FC<ProductProps> = ({ product, selected, selectProduct }) => {

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
      </div>
    </div>
  )
}

export default Product;
