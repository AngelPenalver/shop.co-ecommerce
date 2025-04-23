import Image from "next/image";
import styles from "./cart-item.module.css";
import { CartItemInterface } from "../../lib/store/features/cart/cartSlice";
import QuantityInput from "../QuantityInput";

export default function CartItem(item: CartItemInterface): React.JSX.Element {
  const { product, quantity: initialQuantity } = item;
  
  return (
    <article className={styles.container_cart_item}>
      <div className={styles.image_cart_item}>
        <Image
          src={product.image}
          alt={product.name}
          width={160}
          height={160}
        />
      </div>
      <div className={styles.content_cart_item}>
        <h1>{product.name}</h1>
        <h3>{product.subtitle}</h3>
        <span id={styles.stock}>Maximum stock: {product.stock}</span>
        <span id={styles.price}>${product.price}</span>
        <div id={styles.quantity}>
          <QuantityInput
            productId={product.id}
            initialQuantity={initialQuantity}
            maxQuantity={product.stock}
            isCartView={true}
          />
        </div>
      </div>
    </article>
  );
}
