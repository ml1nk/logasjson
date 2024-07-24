import { LogLevel } from '../../enums/loglevel.js'
import type { LoggerDestination, LoggerEntry } from '../../types/logger.js'

export class DestinationMessage implements LoggerDestination {
  public write (data: LoggerEntry): void {
    if (data.logLevel >= LogLevel.Error) process.stderr.write(data.message + '\n')
    else process.stdout.write(data.message + '\n')

    if (data.logLevel >= LogLevel.Warn) {
      const errors: Error[] = Object.values(data).filter(e => e instanceof Error)
      for (const error of errors) {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        if (data.logLevel >= LogLevel.Error) process.stderr.write(error.toString() + '\n')
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        else process.stdout.write(error.toString() + '\n')
      }
    }
  }
}
