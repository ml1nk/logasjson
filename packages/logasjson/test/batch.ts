/* eslint-disable @typescript-eslint/no-misused-promises */
import assert from 'assert/strict'
import { setTimeout as sleep } from 'timers/promises'

import { DestinationBatch } from '../src/classes/destination/DestinationBatch.js'
import { Logger } from '../src/classes/Logger.js'
import { LogLevel } from '../src/enums/loglevel.js'

export default (): void => {
  describe('batch', () => {
    it('destination', async () => {
      let process = 0
      let raw = 0
      const b = new DestinationBatch<string[]>(0, {
        process: (p, data) => {
          if (p === undefined) p = []
          assert.equal(data.message, 'test')
          p.push('test')
          process++
          return p
        },
        send: (data: string[]) => {
          assert.equal(data.length, 2)
          raw++
        }
      })

      const t = new Logger('test', { destination: b, logLevel: LogLevel.Error })

      t?.error?.('test')
      assert.equal(process, 1)
      t?.error?.('test')
      assert.equal(process, 2)

      assert.equal(raw, 0)

      await sleep(0)

      assert.equal(process, 2)
      assert.equal(raw, 1)
    })

    it('flush', async () => {
      let process = 0
      let raw = 0
      const b = new DestinationBatch<string[]>(0, {
        process: (p, data) => {
          if (p === undefined) p = []
          assert.equal(data.message, 'test')
          p.push('test')
          process++
          return p
        },
        send: (data: string[]) => {
          assert.equal(data.length, 2)
          raw++
        }
      })

      const t = new Logger('test', { destination: b, logLevel: LogLevel.Error })

      t?.error?.('test')
      assert.equal(process, 1)
      t?.error?.('test')
      assert.equal(process, 2)

      assert.equal(raw, 0)

      await t.flush()

      assert.equal(process, 2)
      assert.equal(raw, 1)

      // @ts-expect-error workaround
      b.run()
    })
  })
}
