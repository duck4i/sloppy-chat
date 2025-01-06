import pino from "pino";
import pretty from "pino-pretty";

export const createLogger = (level?: string) => {
    const log = pino(pretty());
    log.level = level ?? "debug";
    return log;
}