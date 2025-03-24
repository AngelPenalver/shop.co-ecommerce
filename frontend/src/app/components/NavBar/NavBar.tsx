import React from "react";
import styles from "./NavBar.module.css";
import Logo from "../../../../public/logo.svg";
import Account from "../../../../public/account_icon.svg";
import Favorites from "../../../../public/favorites_icon.svg";
import Search from "../../../../public/search_icon.svg";
import Cart from "../../../../public/cart_icon.svg";
import Image from "next/image";

export default function NavBar(): React.JSX.Element {
  return (
    <div className={styles.navBarContainer}>
      <Image
        src={Logo}
        height={41}
        width={185}
        alt="Logo"
        className={styles.logo}
      />
      <ul className={styles.navLinks}>
        <li>
          <a>Home</a>
        </li>
        <li>
          <a>Shop</a>
        </li>
        <li>
          <a>About</a>
        </li>
        <li>
          <a>Contact</a>
        </li>
      </ul>
      <ul className={styles.navIcons}>
        <li>
          <Image
            src={Account}
            height={28}
            width={28}
            alt="Account"
            className={styles.icon}
          />
        </li>
        <li>
          <Image
            src={Favorites}
            height={28}
            width={28}
            alt="Favorites"
            className={styles.icon}
          />
        </li>
        <li>
          <Image
            src={Search}
            height={28}
            width={28}
            alt="Search"
            className={styles.icon}
          />
        </li>
        <li>
          <Image
            src={Cart}
            height={28}
            width={28}
            alt="Cart"
            className={styles.icon}
          />
        </li>
      </ul>
    </div>
  );
}
