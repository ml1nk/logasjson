import assert from 'assert/strict'

import { DestinationJson } from '../src/classes/destination/DestinationJson.js'
import { Logger } from '../src/classes/Logger.js'
import { LogLevel } from '../src/enums/loglevel.js'

const stackTraceLimit = 20
let oldValue = 0

export default (): void => {
  describe('json', () => {
    const write = process.stderr.write.bind(process.stderr)

    before(() => {
      oldValue = Error.stackTraceLimit

      Error.stackTraceLimit = stackTraceLimit

      process.stderr.write = (...args: any) => {
        const a = JSON.parse(args[0] as string)
        assert.deepEqual(a?.error?.message, 'a')
        const rows: string[] = a?.error?.stack?.split('\n')
        assert.ok(rows.shift()?.includes('Error:') ?? false)
        assert.deepEqual(rows.length, stackTraceLimit)
        rows.forEach(e => { assert.ok(e.includes('at recursive')) })
        return write.apply(process.stdout, args as [str: string | Uint8Array, encoding?: BufferEncoding | undefined, cb?: ((err?: Error | undefined) => void) | undefined])
      }
    })

    after(() => {
      Error.stackTraceLimit = oldValue
      process.stderr.write = write
    })

    it('stringify error', () => {
      const log = new Logger('test', { destination: new DestinationJson(), logLevel: LogLevel.Error })
      try {
        recursive(stackTraceLimit)
      } catch (error) {
        const a: any = { }
        a.t = a
        a.error = new Error('b')
        log.error?.('tester2', { error, a })
      }
    })
  })
}

function recursive (count: number): void {
  if (count > 0) recursive(count - 1)
  else throw new Error('a')
}
