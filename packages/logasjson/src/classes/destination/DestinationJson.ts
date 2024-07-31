// @ts-expect-error workaround
import jc from 'json-cycle'
import { serializeError } from 'serialize-error'

import { LogLevel } from '../../enums/loglevel.js'
import type { LoggerDestination, LoggerEntry } from '../../types/logger.js'


/**
 * Write log as json to stdout (LogLevel < Error) or stderr (LogLevel >= Error).
 */
export class DestinationJson implements LoggerDestination {
  public write (data: LoggerEntry): void {
    const d: string = jc.stringify(serializeError(data))
    if (data.logLevel >= LogLevel.Error) process.stderr.write(d + '\n')
    else process.stdout.write(d + '\n')
  }
}
