import { Rating } from "@mui/material";
import styles from "./cardProducts.module.css";
import Image from "next/image";
import LikeIcon from "@/public/like_icon.svg";
import ViewIcon from "@/public/view_icon.svg";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "../../hook";
import {
  fetchProductById,
  setModalLoading,
} from "../../lib/store/features/products/productsSlice";
import { setModalAddToCart } from "../../lib/store/features/cart/cartSlice";

interface CardProductInterface {
  id: number;
  image: string;
  title: string;
  sub_title?: string;
  price: string;
  price_discount?: string;
}

export default function CardProduct({
  image,
  title,
  price,
  price_discount,
  id,
}: CardProductInterface): React.JSX.Element {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const handleRouter = async (name: string, id: number) => {
    await dispatch(fetchProductById(id));
    router.push(`/product/${name}`);
  };

  const handleOpenModal = async (id: number) => {
    await dispatch(fetchProductById(id));
    dispatch(setModalLoading(true));
    setTimeout(() => {
      dispatch(setModalAddToCart(true));
      dispatch(setModalLoading(false));
    }, 1300);
  };

  return (
    <article
      className={styles.card_product}
      itemScope
      itemType="https://schema.org/Product"
    >
      <figure className={styles.card_image}>
        <Image
          src={image}
          alt={title}
          width={370}
          height={340}
          itemProp="image"
          id={styles.image}
        />
        <figcaption className={styles.hover_icons}>
          <button aria-label="Add to favorites" className={styles.icon_button}>
            <Image src={LikeIcon} alt="Like" width={28} />
          </button>
          <button aria-label="View details" className={styles.icon_button}>
            <Image src={ViewIcon} alt="View detailsw" width={28} />
          </button>
        </figcaption>
        <button
          className={styles.add_to_cart}
          onClick={() => handleOpenModal(id)}
          aria-label={`Añadir ${title} al carrito`}
        >
          Add to cart
        </button>
      </figure>
      <div
        className={styles.card_content}
        itemProp="offers"
        itemScope
        itemType="https://schema.org/Offer"
      >
        <h3
          id={styles.title}
          itemProp="name"
          onClick={() => handleRouter(title, id)}
        >
          {title}
        </h3>
        <Rating
          name="product-rating"
          defaultValue={2.5}
          precision={0.5}
          readOnly
          aria-label={`Valoración: 2.5 estrellas`}
        />
        <div className={styles.card_price}>
          {price_discount && (
            <span id={styles.price_discount} itemProp="price">
              ${price_discount}
            </span>
          )}
          <span
            id={styles.price}
            itemProp="priceCurrency"
            content="USD"
            onClick={() => handleRouter(title, 1)}
          >
            ${price}
          </span>
        </div>
      </div>
    </article>
  );
}
