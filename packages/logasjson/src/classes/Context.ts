import { AsyncLocalStorage } from 'async_hooks'
import { randomUUID } from 'crypto'

import { Logger } from './Logger.js'
import type { ContextOptions, ContextResultSafe } from '../types/context.js'
import type { LoggerOptions } from '../types/logger.js'

export class Context {
  static #storage: AsyncLocalStorage<Context>
  static #logger: Logger

  readonly #store: Map<string, any>

  public readonly logger: LoggerOptions
  public readonly name: string
  public readonly traceId: string

  constructor (options: ContextOptions) {
    if (Context.#storage === undefined) {
      Context.#storage = new AsyncLocalStorage<Context>()
      Context.#logger = new Logger('context')
    }

    const session = (options.inherit ?? true) ? Context.getStore() : undefined

    this.name = Logger.mergeName(session?.name, options.name ?? '')
    this.traceId = options.traceId ?? session?.traceId ?? randomUUID()
    this.logger = Logger.mergeOptions(session?.logger, options.logger)

    if (options.store !== undefined) {
      this.#store = options.store instanceof Map ? options.store : new Map(options.store)
    } else {
      this.#store = new Map()
    }
  }

  public get<T extends 'number' | 'string' | 'boolean' | (abstract new (...args: any[]) => any)>(key: string, type: T): ContextResultSafe<T> | undefined {
    const d = this.getUnsafe(key)
    if (d === undefined) return undefined
    if (typeof type === 'string') {
      // eslint-disable-next-line valid-typeof
      if (typeof d !== type) throw new Error('typeof mismatch')
    } else if (!(d instanceof (type as (abstract new (...args: any[]) => any)))) throw new Error('instanceof mismatch')
    return d
  }

  public getOrSet<T extends 'number' | 'string' | 'boolean' | (abstract new (...args: any[]) => any)>(key: string, type: T, factory: () => ContextResultSafe<T>): ContextResultSafe<T> {
    let d = this.get(key, type)
    if (d === undefined) {
      d = factory()
      this.#store.set(key, d)
    }
    return d as any as ContextResultSafe<T>
  }

  public getUnsafe<T = any>(key: string): T | undefined {
    const d = this.#store.get(key)
    if (d === undefined) return undefined
    return d
  }

  public getOrSetUnsafe<T = any>(key: string, factory: () => T): T {
    let d = this.#store.get(key)
    if (d === undefined) {
      d = factory()
      this.#store.set(key, d)
    }
    return d
  }

  public has (key: string): boolean {
    return this.#store.has(key)
  }

  public set (key: string, data: any): void {
    this.#store.set(key, data)
  }

  public delete (key: string): void {
    this.#store.delete(key)
  }

  public run<R, TArgs extends any[]>(callback: (...args: TArgs) => R, ...args: TArgs): R {
    return Context.#storage.run(this, callback, ...args)
  }

  public runCatch<R, TArgs extends any[]>(callback: (...args: TArgs) => R, ...args: TArgs): R | undefined {
    try {
      const res = this.run(callback, ...args)
      if (res instanceof Promise) return res.catch(e => Context.#logger.error?.('runCatch - promise rejected', { error: e })) as any
      return res
    } catch (e) {
      Context.#logger.error?.('runCatch - error thrown', { error: e })
    }
  }

  public static run<R, TArgs extends any[]>(options: ContextOptions, callback: (...args: TArgs) => R, ...args: TArgs): R {
    const context = new Context(options)
    return context.run(callback, ...args)
  }

  public static runCatch<R, TArgs extends any[]>(options: ContextOptions, callback: (...args: TArgs) => R, ...args: TArgs): R | undefined {
    const context = new Context(options)
    return context.runCatch(callback, ...args)
  }

  public static getStore (): Context | undefined {
    return this.#storage?.getStore()
  }

  public static exit<R, TArgs extends any[]>(callback: (...args: TArgs) => R, ...args: TArgs): R {
    return this.#storage.exit(callback, ...args)
  }

  public static exitCatch<R, TArgs extends any[]>(callback: (...args: TArgs) => R, ...args: TArgs): R | undefined {
    try {
      const res = this.#storage.exit(callback, ...args)
      if (res instanceof Promise) return res.catch(e => Context.#logger.error?.('exitCatch - promise rejected', { error: e })) as any
      return res
    } catch (e) {
      Context.#logger.error?.('exitCatch - error thrown', { error: e })
    }
  }

  public static enterWith (options: ContextOptions): void {
    const context = new Context(options)
    this.#storage.enterWith(context)
  }

  public static restart (): void {
    if (Context.#storage === undefined) return
    Context.#storage.disable()
    Context.#storage = new AsyncLocalStorage<Context>()
  }
}
