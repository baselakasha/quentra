import jwt from "jsonwebtoken";
import config from "../../config/config";

export const generateToken = (userId: string): string => {
  // Using the config values
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: "1d" });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, config.jwtSecret);
};