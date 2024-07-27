/* eslint-disable @typescript-eslint/no-misused-promises */
import assert from 'assert/strict'

import { Logger } from '../src/classes/Logger.js'
import { LogLevel } from '../src/enums/loglevel.js'
import type { LoggerContext } from '../src/types/logger.js'
import { Override } from '../src/classes/Override.js'

describe('override', () => {

  it('setByLogger', async () => {
    const log1 = new Logger({ name: 'str', logLevel: LogLevel.Info })
    assert.equal(log1.logLevel, LogLevel.Info)
    log1.override.setByLogger(LogLevel.Error, 'str')
    assert.equal(log1.logLevel, LogLevel.Error)
    log1.override.deleteByLogger('str')
    assert.equal(log1.logLevel, LogLevel.Info)
    log1.override.setByLogger(LogLevel.Error, 'str2')
    assert.equal(log1.logLevel, LogLevel.Info)
    log1.override.clear()
  })

  it('setByContext', async () => {
    let context: null | LoggerContext = null

    const log1 = new Logger({ name: 'str', logLevel: LogLevel.Info, context: () => context ?? undefined })

    context = { name: 'str2' }

    assert.equal(log1.logLevel, LogLevel.Info)
    log1.override.setByContext(LogLevel.Error, 'str2')
    assert.equal(log1.logLevel, LogLevel.Error)
    log1.override.deleteByContext('str2')
    assert.equal(log1.logLevel, LogLevel.Info)
    log1.override.setByContext(LogLevel.Error, 'str')
    assert.equal(log1.logLevel, LogLevel.Info)
    log1.override.clear()
  })

  it('set', async () => {
    let context: null | LoggerContext = null

    const log1 = new Logger({ name: 'str1', logLevel: LogLevel.Info, context: () => context ?? undefined })

    context = { name: 'str2' }
    assert.equal(log1.logLevel, LogLevel.Info)
    log1.override.set(LogLevel.Error, 'str1', 'str2')
    assert.equal(log1.logLevel, LogLevel.Error)
    log1.override.delete('str1', 'str2')
    assert.equal(log1.logLevel, LogLevel.Info)
    log1.override.set(LogLevel.Error, 'str2', 'str1')
    assert.equal(log1.logLevel, LogLevel.Info)
    log1.override.clear()

  })


  it('data', async () => {
    const override = new Override()
    override.set(LogLevel.Error, 'str1', 'str2')
    assert.deepEqual(override.data, new Map([['["str2","str1"]', LogLevel.Error]]))
  })

})
