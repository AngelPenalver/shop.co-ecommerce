import { jwtDecode } from "jwt-decode";
interface DecodedToken {
  exp: number;
  iat: number;
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}
export const decodeToken = (token: string): DecodedToken => {
  const decodedToken = jwtDecode(token) as DecodedToken;
  return decodedToken;
};
