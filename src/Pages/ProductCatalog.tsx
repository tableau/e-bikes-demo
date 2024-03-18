import Product from '../Components/Product';
import styles from './ProductCatalog.module.css';

export interface ProductInfo {
  id: number;
  name: string;
  href: string;
  price: number;
  availability: string;
  imageSrc: string;
  imageAlt: string;
}

function ProductCatalog() {

  const products: ProductInfo[] = [
    {
      id: 1,
      name: 'Dynamo X1',
      href: '#',
      price: 7000,
      availability: 'Mountain Racer',
      imageSrc: 'dynamox1.jpg',
      imageAlt:
        'White fabric pouch with white zipper, black zipper pull, and black elastic loop.',
    },
    {
      id: 2,
      name: 'Electra X3',
      href: '#',
      price: 1600,
      availability: 'Mountain Enthusiast',
      imageSrc: 'electrax3.jpg',
      imageAlt:
        'Front of tote bag with washed black canvas body, black straps, and tan leather handles and accents.',
    },
    {
      id: 3,
      name: 'Volt X1',
      href: '#',
      price: 1200,
      availability: 'Commuter Beginner',
      imageSrc: 'voltx1.jpg',
      imageAlt:
        'Front of satchel with blue canvas body, black straps and handle, drawstring top, and front zipper pouch.',
    },
    {
      id: 4,
      name: 'Fuse X2',
      href: '#',
      price: 2600,
      availability: 'Commuter Beginner',
      imageSrc: 'fusex2.jpg',
      imageAlt:
        'Front of satchel with blue canvas body, black straps and handle, drawstring top, and front zipper pouch.',
    },
    // More products...
  ]

  return (
    <div className={styles.root}>
    <div className={styles.grid}>
      {products.map(product => <Product product={product} />)}
      </div>
    </div>
  )
}

export default ProductCatalog;
