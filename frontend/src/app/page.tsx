import styles from "./page.module.css";
import NavBar from "./components/NavBar/NavBar";
import CardSpaces from "./components/cardSpaces/CardSpaces";
import ImageDining from "../../public/dining_image.png";
import ImageLiving from "../../public/living_image.png";
import ImageBedroom from "../../public/bedroom_image.png";
import CardProduct from "./components/cardProduct/cardProducts";
import ProductImage from '../../public/produc_image.png'


export default function Home(): React.JSX.Element {
  return (
    <main className={styles.home_contain}>
      <section className={styles.home_header}>
        <NavBar />
        <div className={styles.tag_image}>
          <span>New Arrival</span>
          <h1>
            Discover Our <br />
            New Collection
          </h1>
          <p>
            Explore our exclusive collection of furniture designed to transform
            your spaces. Renew your home with our latest trends in decoration.
          </p>
          <button>BUY NOW</button>
        </div>
      </section>
      <section className={styles.home_content}>
        <div className={styles.home_content_header}>
          <h2>Browse The Range</h2>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
        </div>
        <ul className={styles.home_content_cards}>
          <li>
            <CardSpaces name="Dining" image={ImageDining} />
          </li>{" "}
          <li>
            <CardSpaces name="Living" image={ImageLiving} />
          </li>{" "}
          <li>
            <CardSpaces name="Bedroom" image={ImageBedroom} />
          </li>
        </ul>
      </section>
      <section className={styles.cards_content_products}>
        <CardProduct image={ProductImage} title="Syltherine" category="Stylish cafe chair" price="250"  />
      </section>
    </main>
  );
}
