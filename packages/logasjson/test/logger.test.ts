/* eslint-disable @typescript-eslint/no-misused-promises */
import assert from 'assert/strict'

import { DestinationArray } from '../src/classes/destination/DestinationArray.js'
import { DestinationConsole } from '../src/classes/destination/DestinationConsole.js'
import { DestinationJson } from '../src/classes/destination/DestinationJson.js'
import { DestinationMessage } from '../src/classes/destination/DestinationMessage.js'
import { Logger } from '../src/classes/Logger.js'
import { LogLevel } from '../src/enums/loglevel.js'
import type { LoggerContext } from '../src/types/logger.js'
import { processLog } from '../src/helper/processLog.js'
import { setTimeout as sleep } from 'timers/promises'

describe('logger', () => {
  it('loglevel', async () => {
    let context: null | LoggerContext = null

    const logger = new Logger({ name: 'test1', destination: new DestinationJson(), logLevel: LogLevel.Info, context: () => context ?? undefined })

    const logger1 = logger.fork({ })
    assert.equal(logger1.debug, undefined)
    assert.notEqual(logger1.info, undefined)
    assert.notEqual(logger1.warn, undefined)
    assert.notEqual(logger1.error, undefined)

    const logger2 = logger.fork({ logLevel: LogLevel.None })
    assert.equal(logger2.debug, undefined)
    assert.equal(logger2.info, undefined)
    assert.equal(logger2.warn, undefined)
    assert.equal(logger2.error, undefined)

    context = { name: "test2", logLevel: LogLevel.Error }
    assert.equal(logger2.debug, undefined)
    assert.equal(logger2.info, undefined)
    assert.equal(logger2.warn, undefined)
    assert.notEqual(logger2.error, undefined)


    context = { name: "test", logLevel: LogLevel.Warn }
    assert.equal(logger2.debug, undefined)
    assert.equal(logger2.info, undefined)
    assert.notEqual(logger2.warn, undefined)
    assert.notEqual(logger2.error, undefined)

    context = { name: "test", logLevel: LogLevel.Debug }
    assert.notEqual(logger2.debug, undefined)
    assert.notEqual(logger2.info, undefined)
    assert.notEqual(logger2.warn, undefined)
    assert.notEqual(logger2.error, undefined)
  })

  it('write', async () => {
    let called1 = false


    let context: null | LoggerContext = null

    const logger = new Logger({
      name: 'test',
      destination: {
        write: (data) => {
          called1 = true
          assert.equal(data.logLevel, LogLevel.Warn)
          assert.equal(data.logger, 'test')
          assert.equal(data.message, 'testMessage hallo')
          assert.equal(data.hi, 'hallo')
          assert.notEqual(data.timestamp, undefined)
          assert.equal(data.traceId, "hi")
          assert.equal(data.context, 'testcontext')
        }
      },
      context: () => context ?? undefined,
      logLevel: LogLevel.Info
    })

    context = { name: 'testcontext', traceId: "hi" }
    logger.warn?.('testMessage :hi', { hi: 'hallo' })
    context = null

    assert.equal(called1, true)

    let called2 = false

    const da = new DestinationArray([{
      write: (data) => {
        assert.equal(data.logLevel, LogLevel.Warn)
        assert.equal(data.message, 'hi')
        called2 = true
      },
      async flush(): Promise<void> {
        await sleep(100)
      }
    }])

    context = { name: 'testcontext' }

    const logger2 = new Logger({ destination: da, logLevel: LogLevel.Info })
    logger2.warn?.('hi')
    await da.flush()
    assert.equal(called2, true)

    const message = new DestinationMessage()

    message.write({ message: 'test1', logLevel: LogLevel.Debug, timestamp: Date.now() })
    message.write({ message: 'test2', logLevel: LogLevel.Error, timestamp: Date.now() })
    message.write({ message: '5', logLevel: LogLevel.None, timestamp: Date.now() })

    message.write({ message: 'test2', error: new Error('t1'), logLevel: LogLevel.Warn, timestamp: Date.now() })
    message.write({ message: 'test2', error: new Error('t2'), logLevel: LogLevel.Error, timestamp: Date.now() })

    const dconsole = new DestinationConsole()

    dconsole.write({ message: 'test1', logLevel: LogLevel.Debug, timestamp: Date.now() })
    dconsole.write({ message: 'test2', logLevel: LogLevel.Error, timestamp: Date.now() })
    dconsole.write({ message: '5', logLevel: LogLevel.None, timestamp: Date.now() })

    dconsole.write({ message: 'test2', error: new Error('t1'), logLevel: LogLevel.Warn, timestamp: Date.now() })
    dconsole.write({ message: 'test2', error: new Error('t2'), logLevel: LogLevel.Error, timestamp: Date.now() })
  })

  it('processData', async () => {
    const d = processLog(undefined, LogLevel.Debug, 'test', {}, 'test2', {}, false)
    assert.equal(d.logger, 'test')
  })

  it('traceId', async () => {
    let context: null | LoggerContext = null
    const log = new Logger({ logLevel: LogLevel.Debug, context: () => context ?? undefined  })
    assert.equal(log.traceId, undefined)
    context = { traceId: "hi"}
    assert.equal(log.traceId, "hi")
  })

  it('stacktrace', async () => {
    const log = new Logger({ logLevel: LogLevel.Debug })
    log.info?.("hi", undefined, true)
  })

  it('flush', async () => {
    const log1 = new Logger({ name: 'str1', logLevel: LogLevel.Info })

    await log1.flush()
  })
})
