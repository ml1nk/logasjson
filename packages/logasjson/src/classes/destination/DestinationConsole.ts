import util from 'util'

import { LogLevel } from '../../enums/loglevel.js'
import type { LoggerDestination, LoggerEntry } from '../../types/logger.js'

export class DestinationConsole implements LoggerDestination {
  public write (data: LoggerEntry): void {
    const d = util.inspect(data, { showHidden: false, getters: false, depth: Infinity, colors: true, showProxy: false })
    if (data.logLevel >= LogLevel.Error) process.stderr.write(d + '\n')
    else process.stdout.write(d + '\n')
  }
}
