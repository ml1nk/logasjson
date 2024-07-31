import { Override } from './Override.js'
import type { LoggerInitOptions, LoggerOptions } from '../types/logger.js'
import { LoggerFork } from './LoggerFork.js'
import { DestinationConsole } from './destination/DestinationConsole.js'

/**
 * Logger base class which contains:
 *  - default loglevel
 *  - destination
 *  - override object
 */
export class Logger extends LoggerFork {
  /**
   * The override object allows manipulating the logLevel for this logger and all it's forks.
   */
  public get override (): Override {
    return this.options.override
  }

  /**
   * Initialize a new Logger
   * @param options 
   */
  public constructor (options: LoggerInitOptions) {
    if(options.override === undefined) options.override = new Override()
    if(options.name === '') options.name = undefined
    if(options.destination === undefined) options.destination = new DestinationConsole()
    super(options as LoggerOptions)
  }

  /**
   * Flush all logs
   */
  public async flush (): Promise<void> {
    await this.options.destination?.flush?.()
  }
}
