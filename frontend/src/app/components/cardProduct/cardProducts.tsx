import styles from "./cardProducts.module.css";
import Image, { StaticImageData } from "next/image";
import ShareIcon from "../../../../public/share_icon.svg";
import LikeIcon from "../../../../public/like_icon.svg";
interface CardProductInterface {
  image: StaticImageData;
  title: string;
  category: string;
  price: string;
  price_discount?: string;
}
export default function CardProduct({
  image,
  title,
  category,
  price,
  price_discount,
}: CardProductInterface): React.JSX.Element {
  return (
    <div className={styles.card_content}>
      <div id={styles.hover_image}>
        <div>
        <button>Add to cart</button>
          <ul>
            <li>
              <Image src={ShareIcon} alt="Share Icon" />
              <span>Share</span>
            </li>
            <li>
              <Image src={LikeIcon} alt="Like Icon" />
              <span>Like</span>
            </li>
          </ul>
        </div>
      </div>
      <Image src={image} alt={title} />
      <div>
        <h2>{title}</h2>
        <p>{category}</p>
        <span>{price}$</span>
        {price_discount && <span>{price_discount}</span>}
      </div>
    </div>
  );
}
