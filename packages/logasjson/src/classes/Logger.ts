import { Override } from './Override.js'
import type { LoggerInitOptions, LoggerOptions } from '../types/logger.js'
import { LoggerFork } from './LoggerFork.js'
import { DestinationConsole } from './destination/DestinationConsole.js'

export class Logger extends LoggerFork {
  public get override (): Override {
    return this.options.override
  }

  public constructor (options: LoggerInitOptions) {
    if(options.override === undefined) options.override = new Override()
    if(options.name === '') options.name = undefined
    if(options.destination === undefined) options.destination = new DestinationConsole()
    super(options as LoggerOptions)
  }

  public async flush (): Promise<void> {
    await this.options.destination?.flush?.()
  }
}
