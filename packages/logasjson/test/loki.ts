/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-misused-promises */
import assert from 'assert/strict'

import nock from 'nock'

import { Context } from '../src/classes/Context.js'
import { DestinationLoki } from '../src/classes/destination/DestinationLoki.js'
import { Logger } from '../src/classes/Logger.js'
import { LogLevel } from '../src/enums/loglevel.js'

export default (): void => {
  describe('loki', () => {
    it('prepare', async () => {
      const loki = new DestinationLoki({
        host: 'http://localhost:1',
        fallback: {
          write: () => {}
        }
      })
      const d = loki.process(undefined, {
        timestamp: Date.now(),
        logLevel: LogLevel.Debug,
        message: 'test1'
      })

      loki.process(d, {
        timestamp: Date.now(),
        logLevel: LogLevel.Debug,
        message: 'test2'
      })
    })

    it('write', async () => {
      Logger.options.logLevel = LogLevel.Debug

      const called = [0, 0, 0, 0]

      const loki1 = new DestinationLoki({
        host: 'http://localhost:1',
        fallback: {
          write: () => {
            called[0]++
          }
        },
        compression: true,
        authentication: {
          username: 'test',
          password: 'test'
        }
      })
      const loki2 = new DestinationLoki({
        host: 'http://localhost',
        fallback: {
          write: () => {
            called[1]++
          }
        },
        compression: true
      })
      const loki3 = new DestinationLoki({
        host: 'https://localhost:2',
        fallback: {
          write: () => {
            called[2]++
          }
        }
      })
      const loki4 = new DestinationLoki({
        host: 'https://localhost',
        fallback: {
          write: () => {
            called[3]++
          }
        }
      })

      nock('http://localhost:1')
        .post('/loki/api/v1/push')
        .times(4)
        .reply(200)

      nock('http://localhost')
        .post('/loki/api/v1/push')
        .times(3)
        .reply(204)

      nock('https://localhost:2')
        .post('/loki/api/v1/push')
        .times(2)
        .reply(500, 'error')

      nock('https://localhost')
        .post('/loki/api/v1/push')
        .times(2)
        .reply(204)

      Logger.options.destination = loki1

      const logger = new Logger('test')

      logger.error?.('loggertest', { hallo: 'test1' })

      Context.run({
        name: 'contexttest'
      }, () => {
        logger.warn?.('loggertest', { hi: 'test2' })
      })

      loki2.write({
        timestamp: Date.now(),
        logLevel: LogLevel.Debug,
        message: 'test1'
      })

      await loki1.flush()

      Logger.options.destination = loki2

      logger.error?.('loggertest', { hallo: 'test1' })

      Context.run({
        name: 'contexttest'
      }, () => {
        logger.warn?.('loggertest', { hi: 'test2' })
      })

      await loki2.flush()

      Logger.options.destination = loki3

      logger.error?.('loggertest', { hallo: 'test1' })

      Context.run({
        name: 'contexttest'
      }, () => {
        logger.warn?.('loggertest', { hi: 'test2' })
      })

      await loki3.flush()

      Logger.options.destination = loki4

      logger.error?.('loggertest', { hallo: 'test1' })

      Context.run({
        name: 'contexttest'
      }, () => {
        logger.warn?.('loggertest', { hi: 'test2' })
      })

      await loki4.flush()

      assert.deepEqual(called, [2, 0, 2, 0])

      // eslint-disable-next-line import/no-named-as-default-member
      nock.cleanAll()
    })

    it('zlib error', async () => {
      let called = 0
      const loki2 = new DestinationLoki({
        host: 'http://localhost',
        fallback: {
          write: (e) => {
            called++
            assert.equal(e.message, 'Cannot create a Buffer larger than 64 bytes')
          }
        },
        compression: true,
        zliboptions: {
          maxOutputLength: 64
        }
      })

      loki2.write({
        timestamp: Date.now(),
        logLevel: LogLevel.Debug,
        message: 'test1'
      })

      await loki2.flush()

      assert.equal(called, 1)
    })
  })
}
