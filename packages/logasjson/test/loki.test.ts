/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-misused-promises */
import assert from 'assert/strict'

import nock from 'nock'

import { DestinationLoki } from '../src/classes/destination/DestinationLoki.js'
import { Logger } from '../src/classes/Logger.js'
import { LogLevel } from '../src/enums/loglevel.js'
import type { LoggerContext } from '../src/types/logger.js'
import { setTimeout as sleep } from 'timers/promises'

describe('loki', () => {
  it('prepare', async () => {
    const loki = new DestinationLoki({
      host: 'http://localhost:1',
      fallback: {
        write: () => { }
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
        },
        async flush() {
          await sleep(100)
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

    let context: null | LoggerContext = null

    const logger = new Logger({ name: 'test', destination: loki1, logLevel: LogLevel.Debug, context: () => context ?? undefined })

    logger.error?.('loggertest', { hallo: 'test1' })

    context = { name: 'contexttest' }
    logger.warn?.('loggertest', { hi: 'test2' })
    context = null

    loki2.write({
      timestamp: Date.now(),
      logLevel: LogLevel.Debug,
      message: 'test1'
    })

    await loki1.flush()


    const logger2 = new Logger({ name: 'test', destination: loki2, logLevel: LogLevel.Debug, context: () => context ?? undefined })
    logger2.error?.('loggertest', { hallo: 'test1' })
    context = { name: 'contexttest' }
    logger2.warn?.('loggertest', { hi: 'test2' })
    context = null
    await loki2.flush()

    const logger3 = new Logger({ name: 'test', destination: loki3, logLevel: LogLevel.Debug, context: () => context ?? undefined })
    logger3.error?.('loggertest', { hallo: 'test1' })
    context = { name: 'contexttest' }
    logger3.warn?.('loggertest', { hi: 'test2' })
    context = null
    await loki3.flush()

    const logger4 = new Logger({ name: 'test', destination: loki4, logLevel: LogLevel.Debug, context: () => context ?? undefined })
    logger4.error?.('loggertest', { hallo: 'test1' })
    context = { name: 'contexttest' }
    logger4.warn?.('loggertest', { hi: 'test2' })
    context = null
    await loki4.flush()

    assert.deepEqual(called, [2, 0, 2, 0])

    // eslint-disable-next-line import/no-named-as-default-member
    nock.cleanAll()

    // Missing code paths: 
    loki2.write({
      timestamp: Date.now(),
      logLevel: LogLevel.None,
      message: 'test1'
    })

    loki2.write({
      timestamp: Date.now(),
      logLevel: LogLevel.Info,
      message: 'test1'
    })
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

