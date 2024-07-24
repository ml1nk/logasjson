import assert from 'assert/strict'
import { setTimeout as sleep } from 'timers/promises'

import '../src/classes/Logger.js'

import { Context } from '../src/classes/Context.js'

export default (): void => {
  describe('context', () => {
    it('restart - storage undefined', async () => {
    // @ts-expect-error workaround
      Context.storage = undefined
      // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
      assert.equal(Context.restart(), undefined)
    })

    it('getStore - storage undefined', async () => {
    // @ts-expect-error workaround
      Context.storage = undefined
      assert.equal(Context.getStore(), undefined)
    })

    it('tracing', async () => {
      Context.run({ name: 'test1' }, () => {
        const a = Context.getStore()

        Context.run({ name: 'test2' }, () => {
          const b = Context.getStore()
          const c = Context.getStore()
          assert.deepEqual(b, c)
          assert.notDeepEqual(a, b)
        })

        const d = Context.getStore()
        assert.deepEqual(a, d)
      })

      await Context.run({ name: 'test3' }, async () => {
        const a = Context.getStore()

        await Context.run({ name: 'test3' }, async () => {
          const b = Context.getStore()
          await sleep(0)
          const c = Context.getStore()
          assert.deepEqual(b, c)
          assert.notEqual(a, b)
        })

        await sleep(0)

        const d = Context.getStore()
        assert.deepEqual(a, d)
      })
    })

    it('catch', async () => {
      Context.runCatch({ name: 'test1' }, () => {
        const a = Context.getStore()
        Context.runCatch({ name: 'test2' }, () => {
          throw new Error('test')
        })
        const d = Context.getStore()
        assert.deepEqual(a, d)
      })

      await Context.runCatch({ name: 'test3' }, async () => {
        const a = Context.getStore()

        await Context.runCatch({ name: 'test3' }, async () => {
          throw new Error('test')
        })

        const d = Context.getStore()
        assert.deepEqual(a, d)
      })

      Context.runCatch({ name: 'test1' }, () => {
        Context.run({ name: 'test2' }, () => {
          throw new Error('test')
        })
        assert.fail()
      })

      await Context.runCatch({ name: 'test3' }, async () => {
        await Context.run({ name: 'test3' }, async () => {
          throw new Error('test')
        })
        assert.fail()
      })
    })

    it('store', async () => {
      const store = Context.getStore()
      assert.equal(store, undefined)

      await Context.run({ store: new Map([['a', 'b']]) }, async () => {
        const store = Context.getStore()
        if (store === undefined) assert.fail()
        assert.equal(store.get('a', 'string'), 'b')
      })

      await Context.run({ name: 'test3', store: [['a', 'b']] }, async () => {
        const store = Context.getStore()
        if (store === undefined) assert.fail()

        assert.equal(store.get('a', 'string'), 'b')

        assert.equal(store.has('test'), false)
        assert.equal(store.get('test', 'string'), undefined)
        store.set('test', 'hallo')
        assert.equal(store.has('test'), true)
        assert.equal(store.get('test', 'string'), 'hallo')

        assert.throws(() => store.get('test', Number))
        assert.throws(() => store.get('test', 'number'))
        assert.throws(() => store.get('test', String))
        assert.doesNotThrow(() => store.get('test', 'string'))

        const t = new Test2()

        store.set('test', t)

        assert.doesNotThrow(() => store.get('test', Test2))
        assert.doesNotThrow(() => store.get('test', Test))
        assert.throws(() => store.get('test', Test3))

        assert.equal(store.getUnsafe('test'), t)
        store.delete('test')
        assert.equal(store.getUnsafe('test'), undefined)
      })
    })

    it('getOrSet', async () => {
      const store = Context.getStore()
      assert.equal(store, undefined)

      await Context.run({ store: new Map([['a', 'b']]) }, async () => {
        const store = Context.getStore()
        if (store === undefined) assert.fail()

        assert.equal(store.getOrSet('a', 'string', () => ''), 'b')
        assert.equal(store.getOrSetUnsafe('a', () => ''), 'b')

        assert.equal(store.getOrSet('b', 'string', () => 'c'), 'c')
        assert.equal(store.getOrSetUnsafe('c', () => 'd'), 'd')
      })
    })

    it('context inheritance', async () => {
      const store = Context.getStore()
      assert.equal(store, undefined)

      await Context.run({ name: 't1', store: new Map([['a', 'b'], ['c', 'e']]) }, async () => {
        const store = Context.getStore()
        if (store === undefined) assert.fail()

        const traceId = store.traceId

        await Context.run({ name: 't2', store: [['c', 'd']] }, async () => {
          const store = Context.getStore()
          if (store === undefined) assert.fail()

          assert.equal(store.name, 't1:t2')

          assert.equal(store.get('a', 'string'), undefined)
          assert.equal(store.get('c', 'string'), 'd')

          assert.equal(store.traceId, traceId)
        })
      })
    })

    it('exit', async () => {
      const store = Context.getStore()
      assert.equal(store, undefined)

      await Context.run({ name: 't1', store: new Map([['a', 'b'], ['c', 'e']]) }, async () => {
        const store = Context.getStore()
        if (store === undefined) assert.fail()

        await Context.exit(async () => {
          const store = Context.getStore()
          if (store !== undefined) assert.fail()
        })

        await Context.exit(async () => {
          await sleep(0)
          const store = Context.getStore()
          if (store !== undefined) assert.fail()

          await Context.run({ name: 't2' }, async () => {
            const store = Context.getStore()
            if (store === undefined) assert.fail()
            if (store.name !== 't2') assert.fail()
          })
        })

        // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
        const t1 = await Context.exitCatch(async () => {
          const store = Context.getStore()
          if (store !== undefined) assert.fail()
          throw new Error('test')
        })
        assert.equal(t1, undefined)

        // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
        const t2 = Context.exitCatch(() => {
          const store = Context.getStore()
          if (store !== undefined) assert.fail()
          throw new Error('test')
        })
        assert.equal(t2, undefined)

        const t3 = await Context.exitCatch(async () => {
          const store = Context.getStore()
          if (store !== undefined) assert.fail()
          return 'test'
        })
        assert.equal(t3, 'test')

        const t4 = Context.exitCatch(() => {
          const store = Context.getStore()
          if (store !== undefined) assert.fail()
          return 'test'
        })
        assert.equal(t4, 'test')
      })
    })

    it('enterWith', async () => {
      const store = Context.getStore()
      assert.equal(store, undefined)

      await Context.run({ name: 't1', store: new Map([['a', 'b'], ['c', 'e']]) }, async () => {
        let store = Context.getStore()
        assert.equal(store?.name, 't1')

        await (async function () {
          await sleep(0)
          Context.enterWith({ name: 't2' })
          await sleep(0)
          store = Context.getStore()
          assert.equal(store?.name, 't1:t2')
          await sleep(0)
          store = Context.getStore()
          assert.equal(store?.name, 't1:t2')
        })()

        store = Context.getStore()
        assert.equal(store?.name, 't1')
      })
    })

    it('inherit', async () => {
      const store = Context.getStore()
      assert.equal(store, undefined)

      await Context.run({ name: 't1', store: new Map([['a', 'b'], ['c', 'e']]) }, async () => {
        const store = Context.getStore()
        assert.equal(store?.name, 't1')
        await Context.run({ name: 't2', inherit: false }, async () => {
          const store = Context.getStore()
          if (store === undefined) assert.fail()
          assert.equal(store.name, 't2')
        })
      })
    })

    it('restart', async () => {
      const store = Context.getStore()
      assert.equal(store, undefined)

      await Context.run({ name: 't1', store: new Map([['a', 'b'], ['c', 'e']]) }, async () => {
        Context.restart()
        const store = Context.getStore()
        assert.equal(store, undefined)
      })

      const t1 = Context.run({ name: 't1', store: new Map([['a', 'b'], ['c', 'e']]) }, async () => {
        let store = Context.getStore()
        assert.notEqual(store, undefined)
        await sleep(0)
        store = Context.getStore()
        assert.equal(store, undefined)
      })

      Context.restart()

      await t1
    })
  })

  class Test {
    get (): string {
      return 'test'
    }
  }

  class Test2 extends Test {
    get (): string {
      return 'test'
    }
  }

  class Test3 {
    get (): string {
      return 'test'
    }
  }
}
