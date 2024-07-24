import type { LoggerDestination, LoggerEntry } from '../../types/logger.js'

export class DestinationArray implements LoggerDestination {
  readonly #destinations: LoggerDestination[]

  constructor (destinations: LoggerDestination[]) {
    this.#destinations = destinations
  }

  public write (arr: LoggerEntry): void {
    for (const destination of this.#destinations) {
      destination.write(arr)
    }
  }

  public async flush (): Promise<void> {
    await Promise.all(this.#destinations.map(async e => await e.flush?.()))
  }
}
