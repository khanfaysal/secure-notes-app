import dotenv from "dotenv";

dotenv.config();

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

export const env = {
  port: Number(process.env.PORT ?? 4000),
  mongoUri: required("DB_URI"),
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "1d",
};
