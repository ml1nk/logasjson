import batch from './batch.js'
import context from './context.js'
import filter from './filter.js'
import json from './json.js'
import logger from './logger.js'
import loki from './loki.js'
import lokireal from './lokireal.js'
import placeholder from './placeholder.js'

describe('context', () => {
  batch()
  context()
  filter()
  json()
  logger()
  loki()
  lokireal()
  placeholder()
})
