import { Alert } from "@mui/material";

export default function AlertComponent({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}): React.JSX.Element {
  return (
    <Alert
      severity={type}
      variant="filled"
      style={{
        position: "fixed",
        bottom: 10,
        left: 50,
        right: 0,
        zIndex: 999,
        transform: "translateY(0)",
        borderRadius: "8px",
        margin: "0 auto",
        maxWidth: "400px",
        width: "fit-content",
        padding: "1rem 2rem",
        fontWeight: 700,
        fontSize: "1rem",
      }}
    >
      {message}
    </Alert>
  );
}
