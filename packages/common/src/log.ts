import winston from "winston";

export interface LoggerOptions {
    name: string;
    level?: string;
}

const createLogger = (options: LoggerOptions) => {
    return winston.createLogger({
        level: options?.level ?? "debug",
        defaultMeta: options.name,
        format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.colorize({ level: true }),
            winston.format.printf(({ timestamp, level, message }) => {
                return `${timestamp} ${level}:\t${message}`;
            })
        ),
        transports: [
            new winston.transports.Console(),
            //  enable for file logging
            //  new winston.transports.File({ filename: "chat.log"})
        ]
    });
}

export { createLogger }