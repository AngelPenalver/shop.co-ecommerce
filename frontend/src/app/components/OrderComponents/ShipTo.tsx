interface ShippingAddress {
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  phoneNumber: string;
}

interface ShipToProps {
  shippingAddress: ShippingAddress;
}

export default function ShipTo({
  shippingAddress: address,
}: ShipToProps): React.JSX.Element {
  return (
    <article
      style={{
        fontFamily: "Arial, sans-serif",
        maxWidth: "600px",
        padding: "20px",
      }}
    >
      <div style={{ lineHeight: "1.6" }}>
        <p
          style={{ fontSize: "clamp(0.85rem, 3vw, .9rem)", fontWeight: "500" }}
        >
          <strong>
            {address.first_name} {address.last_name}
          </strong>
          <br />
          {address.address}
          <br />
          {address.city}, {address.state}, {address.zipCode}
          <br />
          {address.country}
          <br />
          📞 {address.phoneNumber}
        </p>
      </div>
    </article>
  );
}
