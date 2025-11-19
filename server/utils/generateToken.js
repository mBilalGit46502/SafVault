import jwt from "jsonwebtoken";

export const accessToken= async (userId)=>{
const token = jwt.sign({ userId }, process.env.JWT_TOKEN_SECRETE, {
  expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY,
});
return token;
}