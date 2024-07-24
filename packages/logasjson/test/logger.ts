/* eslint-disable @typescript-eslint/no-misused-promises */
import assert from 'assert/strict'

import { Context } from '../src/classes/Context.js'
import { DestinationArray } from '../src/classes/destination/DestinationArray.js'
import { DestinationConsole } from '../src/classes/destination/DestinationConsole.js'
import { DestinationJson } from '../src/classes/destination/DestinationJson.js'
import { DestinationMessage } from '../src/classes/destination/DestinationMessage.js'
import { Logger } from '../src/classes/Logger.js'
import { LogLevel } from '../src/enums/loglevel.js'
import { filterTraceId } from '../src/helper/filter.js'

export default (): void => {
  describe('logger', () => {
    it('loglevel', async () => {
      Logger.options.logLevel = LogLevel.Info

      let logger = new Logger('test1')
      assert.equal(logger.debug, undefined)
      assert.notEqual(logger.info, undefined)
      assert.notEqual(logger.warn, undefined)
      assert.notEqual(logger.error, undefined)

      Logger.options.logLevel = undefined

      assert.equal(logger.debug, undefined)
      assert.equal(logger.info, undefined)
      assert.equal(logger.warn, undefined)
      assert.equal(logger.error, undefined)

      Context.run({ name: 'test2', logger: { logLevel: LogLevel.Error } }, () => {
        assert.equal(logger.debug, undefined)
        assert.equal(logger.info, undefined)
        assert.equal(logger.warn, undefined)
        assert.notEqual(logger.error, undefined)
      })

      Logger.options.logLevel = LogLevel.Warn
      assert.equal(logger.debug, undefined)
      assert.equal(logger.info, undefined)
      assert.notEqual(logger.warn, undefined)
      assert.notEqual(logger.error, undefined)

      logger = new Logger('test2', { logLevel: LogLevel.Debug })
      assert.notEqual(logger.debug, undefined)
      assert.notEqual(logger.info, undefined)
      assert.notEqual(logger.warn, undefined)
      assert.notEqual(logger.error, undefined)

      assert.deepEqual(logger.logLevel, LogLevel.Debug)

      Context.run({ name: 'test2', logger: { logLevel: LogLevel.Error } }, () => {
        assert.deepEqual(logger.logLevel, LogLevel.Error)

        assert.equal(logger.debug, undefined)
        assert.equal(logger.info, undefined)
        assert.equal(logger.warn, undefined)
        assert.notEqual(logger.error, undefined)
      })

      Context.run({ name: 'test2' }, () => {
        assert.notEqual(logger.debug, undefined)
        assert.notEqual(logger.info, undefined)
        assert.notEqual(logger.warn, undefined)
        assert.notEqual(logger.error, undefined)
      })

      logger = new Logger('test3', { logLevel: LogLevel.Error })
      assert.equal(logger.debug, undefined)
      assert.equal(logger.info, undefined)
      assert.equal(logger.warn, undefined)
      assert.notEqual(logger.error, undefined)

      Context.run({ name: 'test3', logger: { logLevel: LogLevel.Debug } }, () => {
        assert.notEqual(logger.debug, undefined)
        assert.notEqual(logger.info, undefined)
        assert.notEqual(logger.warn, undefined)
        assert.notEqual(logger.error, undefined)
      })

      Logger.options.logLevel = LogLevel.Info
    })

    it('write', async () => {
      let called1 = false
      const logger = new Logger('test', {
        destination: {
          write: (data) => {
            called1 = true
            assert.equal(data.logLevel, LogLevel.Warn)
            assert.equal(data.logger, 'test')
            assert.equal(data.message, 'testMessage hallo')
            assert.equal(data.hi, 'hallo')
            assert.notEqual(data.timestamp, undefined)
            assert.notEqual(data.traceId, undefined)
            assert.equal(data.context, 'testcontext')
          }
        }
      })

      Context.run({ name: 'testcontext' }, () => {
        logger.warn?.('testMessage :hi', { hi: 'hallo' })
      })

      assert.equal(called1, true)

      let called2 = false

      const da = new DestinationArray([{
        write: (data) => {
          assert.equal(data.logLevel, LogLevel.Warn)
          assert.equal(data.message, 'hi')
          called2 = true
        }
      }])

      Context.run({
        name: 'testcontext',
        logger: {
          destination: da
        }
      }, () => {
        logger.warn?.('hi')
      })
      await da.flush()
      assert.equal(called2, true)

      let log = new Logger('test')
      log.warn?.('test1', {}, true)
      log.error?.('test2', {}, false)

      log = new Logger('test', { destination: new DestinationJson() })
      log.warn?.('test1', {}, false)
      log.error?.('test2', {}, false)

      const message = new DestinationMessage()

      message.write({ message: 'test1', logLevel: LogLevel.Debug, timestamp: Date.now() })
      message.write({ message: 'test2', logLevel: LogLevel.Error, timestamp: Date.now() })
      message.write({ message: '5', logLevel: LogLevel.None, timestamp: Date.now() })

      message.write({ message: 'test2', error: new Error('t1'), logLevel: LogLevel.Warn, timestamp: Date.now() })
      message.write({ message: 'test2', error: new Error('t2'), logLevel: LogLevel.Error, timestamp: Date.now() })

      const console = new DestinationConsole()

      console.write({ message: 'test1', logLevel: LogLevel.Debug, timestamp: Date.now() })
      console.write({ message: 'test2', logLevel: LogLevel.Error, timestamp: Date.now() })
      console.write({ message: '5', logLevel: LogLevel.None, timestamp: Date.now() })

      console.write({ message: 'test2', error: new Error('t1'), logLevel: LogLevel.Warn, timestamp: Date.now() })
      console.write({ message: 'test2', error: new Error('t2'), logLevel: LogLevel.Error, timestamp: Date.now() })
    })

    it('extend', async () => {
      let called = false
      const log1 = new Logger('test1', { logLevel: LogLevel.Debug, data: { hi: 'hi' } })
      const log2 = log1.extend('test2', {
        data: { ho: 'ho' },
        destination: {
          write: (data) => {
            called = true

            assert.equal(data.hi, 'hi')
            assert.equal(data.ho, 'ho')
            assert.equal(data.test, 'test')
          }
        }
      })

      assert.equal(log1.name, 'test1')
      assert.equal(log1.logLevel, LogLevel.Debug)
      assert.equal(log2.name, 'test1:test2')
      assert.equal(log2.logLevel, LogLevel.Debug)

      log2.info?.('test', { test: 'test' })
      assert.equal(called, true)

      const log3 = new Logger()
      const log4 = log3.extend()

      assert.equal(log4.name, ':')
    })

    it('override.setByLogger', async () => {
      const log1 = new Logger('str', { logLevel: LogLevel.Info })
      assert.equal(log1.logLevel, LogLevel.Info)
      Logger.override.setByLogger(LogLevel.Error, 'str')
      assert.equal(log1.logLevel, LogLevel.Error)
      Logger.override.deleteByLogger('str')
      assert.equal(log1.logLevel, LogLevel.Info)
      Logger.override.setByLogger(LogLevel.Error, 'str2')
      assert.equal(log1.logLevel, LogLevel.Info)
      Logger.override.clear()
    })

    it('override.setByContext', async () => {
      const log1 = new Logger('str1', { logLevel: LogLevel.Info })

      Context.run({
        name: 'str2'
      }, () => {
        assert.equal(log1.logLevel, LogLevel.Info)
        Logger.override.setByContext(LogLevel.Error, 'str2')
        assert.equal(log1.logLevel, LogLevel.Error)
        Logger.override.deleteByContext('str2')
        assert.equal(log1.logLevel, LogLevel.Info)
        Logger.override.setByContext(LogLevel.Error, 'str')
        assert.equal(log1.logLevel, LogLevel.Info)
        Logger.override.clear()
      })
    })

    it('override.set', async () => {
      const log1 = new Logger('str1', { logLevel: LogLevel.Info })

      Context.run({
        name: 'str2'
      }, () => {
        assert.equal(log1.logLevel, LogLevel.Info)
        Logger.override.set(LogLevel.Error, 'str1', 'str2')
        assert.equal(log1.logLevel, LogLevel.Error)
        Logger.override.delete('str1', 'str2')
        assert.equal(log1.logLevel, LogLevel.Info)
        Logger.override.set(LogLevel.Error, 'str2', 'str1')
        assert.equal(log1.logLevel, LogLevel.Info)
        Logger.override.clear()
      })
    })

    it('processData', async () => {
      let d = Logger.processData(LogLevel.Debug, 'test', {}, 'test2', {}, false)
      assert.equal(d.logger, 'test')

      // @ts-expect-error workaround
      d = Logger.processData(LogLevel.Debug, 'test', {}, undefined, {}, true)
      assert.equal(d.message, 'undefined')
    })

    it('traceId', async () => {
      const d = (new Logger()).traceId
      assert.equal(filterTraceId(d), d)
    })

    it('flush', async () => {
      const log1 = new Logger('str1', { logLevel: LogLevel.Info })

      await log1.flush()
      await Logger.flush()
    })
  })
}
