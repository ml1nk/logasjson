import type { LoggerDestination, LoggerDestinationBatch, LoggerEntry } from '../../types/logger.js'

/**
 * DestinationBatch delays writing of logs to batch them.
 */
export class DestinationBatch<T> implements LoggerDestination {
  readonly #interval: number
  readonly #destination: LoggerDestinationBatch<T>
  #data: T | undefined
  #timeout: number | undefined

  constructor (interval: number, destination: LoggerDestinationBatch<T>) {
    this.#interval = interval
    this.#destination = destination
    this.#data = undefined
    this.#timeout = undefined
  }

  #run (): void {
    this.#timeout = undefined
    if (this.#data !== undefined) this.#destination.send(this.#data)
    this.#data = undefined
  }

  public write (data: LoggerEntry): void {
    this.#data = this.#destination.process(this.#data, data)
    if (this.#timeout !== undefined) return
    this.#timeout = setTimeout(() => { this.#run() }, this.#interval) as any
  }

  public async flush (): Promise<void> {
    clearTimeout(this.#timeout)
    this.#run()
    await this.#destination.flush?.()
  }
}
