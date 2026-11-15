import dotenv from "dotenv";

dotenv.config();

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

export const env = {
  port: Number(process.env.PORT ?? 5000),
  mongoUri: required("DB_URI"),
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "1d",
  frontendOrigins: (
    process.env.FRONTEND_ORIGINS ??
    [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://startling-melomakarona-316645.netlify.app",
      "https://6af9e1738a556bda7396aa2f--startling-melomakarona-316645.netlify.app",
    ].join(",")
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};
