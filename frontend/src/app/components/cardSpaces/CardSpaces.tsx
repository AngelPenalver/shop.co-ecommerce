import Image, { StaticImageData } from "next/image";
import React from "react";
import styles from './CardSpace.module.css'

interface CardSpaceProps {
  name: string;
  image: StaticImageData;
}

export default function CardSpaces({
  name,
  image
}: CardSpaceProps): React.JSX.Element {
  return (
    <div className={styles.card_content}>
      <Image alt={name} src={image} />
      <h3>{name}</h3>
    </div>
  );
}