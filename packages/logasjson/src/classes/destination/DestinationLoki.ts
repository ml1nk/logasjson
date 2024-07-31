import http from 'http'
import https from 'https'
import { URL } from 'url'
import type { ZlibOptions } from 'zlib'
import zlib from 'zlib'

// @ts-expect-error workaround
import jc from 'json-cycle'
import { serializeError } from 'serialize-error'

import { LogLevel } from '../../enums/loglevel.js'
import type { LoggerDestination, LoggerDestinationBatch, LoggerEntry } from '../../types/logger.js'
import type { LokiOptions, LokiStream } from '../../types/loki.js'
import { processLog } from '../../helper/processLog.js'

/**
 * Log as JSON to Loki. Supports fallback (alternative logger if loki is down) and batching.
 */
export class DestinationLoki implements LoggerDestinationBatch<Map<string, LokiStream>> {
  readonly #url: URL
  readonly #fallback: LoggerDestination | undefined
  #promise: Promise<void> = Promise.resolve()
  readonly #labels: Record<string, string>
  readonly #compression: boolean
  readonly #zliboptions: ZlibOptions
  readonly #authentication: string | undefined

  constructor (options: LokiOptions) {
    this.#url = new URL(options.host + '/loki/api/v1/push')
    this.#fallback = options.fallback
    this.#labels = options.labels ?? {}
    this.#compression = options.compression ?? false
    this.#zliboptions = options.zliboptions ?? {}
    this.#authentication = (options.authentication !== undefined) ? ('Basic ' + Buffer.from(options.authentication.username + ':' + options.authentication.password).toString('base64')) : undefined
  }

  public process (p: Map<string, LokiStream> | undefined, data: LoggerEntry): Map<string, LokiStream> {
    if (p === undefined) p = new Map<string, LokiStream>()
    const key = JSON.stringify([data.context, data.logger, data.traceId, data.logLevel, ...Object.values(this.#labels)])
    const d = p.get(key)
    if (d === undefined) p.set(key, { stream: Object.assign({ logger: data.logger, context: data.context, level: this.#grafanaLevel(data.logLevel) }, this.#labels), values: [[data.timestamp.toString() + '000000', jc.stringify(serializeError(data))]] })
    else d.values.push([data.timestamp.toString() + '000000', jc.stringify(serializeError(data)) as string])
    return p
  }

  public send (data: Map<string, LokiStream>): void {
    const d = [...data.values()]
    this.#promise = this.#promise.then(async () => {
      await this.#post(d).catch((e: Error) => {
        this.#fallback?.write(processLog(undefined, LogLevel.Error, 'context:loki', {}, e.message, { failed: d }, false))
      })
    })
  }

  public write (arr: LoggerEntry): void {
    this.send(this.process(undefined, arr))
  }

  public async flush (): Promise<void> {
    await this.#promise
    await this.#fallback?.flush?.()
  }

  #grafanaLevel (logLevel: LogLevel): string {
    switch (logLevel) {
      case LogLevel.Debug: return 'debug'
      case LogLevel.Info: return 'info'
      case LogLevel.Warn: return 'warning'
      case LogLevel.Error: return 'error'
      case LogLevel.None: return 'none'
    }
  }

  async #post (data: LokiStream[], headers: Record<string, string> = {}, timeout = 1000): Promise<void> {
    const input = JSON.stringify({ streams: data })

    const buffer = this.#compression
      ? await new Promise<Buffer>((resolve, reject) => { zlib.gzip(input, this.#zliboptions, (error, buffer) => { (error != null) ? reject(error) : resolve(buffer) }) })
      : Buffer.from(input)

    // Construct the headers
    const defaultHeaders: Record<string, string | number> = {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': buffer.length
    }

    if (this.#authentication !== undefined) defaultHeaders.Authorization = this.#authentication
    if (this.#compression) defaultHeaders['Content-Encoding'] = 'gzip'

    await new Promise<void>((resolve, reject) => {
      // Decide which http library to use based on the url
      const lib = this.#url.protocol === 'https:' ? https : http

      // Construct the node request options
      const options = {
        hostname: this.#url.hostname,
        port: this.#url.port !== '' ? this.#url.port : (this.#url.protocol === 'https:' ? 443 : 80),
        path: this.#url.pathname,
        method: 'POST',
        headers: Object.assign(defaultHeaders, headers),
        timeout
      }

      // Construct the request
      const req = lib.request(options, res => {
        let resData = ''
        res.on('data', _data => (resData += _data as string))
        res.on('end', () => {
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          if (res.statusCode !== 204) reject(new Error(`StatusCode: ${res.statusCode}, Body: ${resData}`))
          else resolve()
        })
      })

      // Error listener
      req.on('error', reject)

      // Write to request
      req.write(buffer)
      req.end()
    })
  }
}
