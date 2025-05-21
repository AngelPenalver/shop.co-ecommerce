import Image from "next/image";
import styles from "./ReviewCard.module.css";

interface ProductData {
  id: number;
  name: string;
  subtitle: string;
  description: string;
  stock: number;
  price: string;
  image: string;
  create_at: string;
  update_at: string;
  delete_at: string | null;
}

interface ReviewCardProps {
  id: number;
  product: ProductData;
  quantity: number;
}
export default function ReviewCard(
  reviewCardData: ReviewCardProps
): React.JSX.Element {
  const { id, product, quantity } = reviewCardData;
  const { price, subtitle, name, image } = product;
  return (
    <article key={id} className={styles.review_card}>
      <div className={styles.image_container}>
        <Image src={image} alt={name} width={130} height={140} />
      </div>
      <div className={styles.review_card_content}>
        <h2>{name}</h2>
        <h3>{subtitle}</h3>
        <span>${price}</span>
        <p>Quantity {quantity}</p>
      </div>
    </article>
  );
}
