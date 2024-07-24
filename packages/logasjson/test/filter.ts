import assert from 'assert/strict'

import { LogLevel } from '../src/enums/loglevel.js'
import { filterLogLevel, filterTraceId } from '../src/helper/filter.js'

export default (): void => {
  describe('filter', () => {
    it('filterTraceId', () => {
      assert.equal(filterTraceId(undefined), undefined)
      assert.equal(filterTraceId([]), undefined)
      assert.equal(filterTraceId('sdsfs'), undefined)
      assert.equal(filterTraceId('AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA'), 'AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA')
    })

    it('filterLogLevel', () => {
      assert.equal(filterLogLevel(undefined), undefined)
      assert.equal(filterLogLevel([]), undefined)
      assert.equal(filterLogLevel('sdsfs'), undefined)
      assert.equal(filterLogLevel('-1'), undefined)
      assert.equal(filterLogLevel('5'), undefined)
      assert.equal(filterLogLevel('4'), LogLevel.None)
    })
  })
}
