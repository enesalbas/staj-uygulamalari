import winston from "winston";
import { config } from "../config/config.js";

const gelisimFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const ekBilgi = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] ${level}: ${message}${ekBilgi}`;
  })
);

const uretimFormat = winston.format.combine(winston.format.timestamp(), winston.format.json());

export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: config.NODE_ENV === "production" ? uretimFormat : gelisimFormat,
  transports: [new winston.transports.Console()],
});
