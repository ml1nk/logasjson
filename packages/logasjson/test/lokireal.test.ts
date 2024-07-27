/* eslint-disable @typescript-eslint/no-misused-promises */
import { DestinationConsole } from '../src/classes/destination/DestinationConsole.js'
import { DestinationLoki } from '../src/classes/destination/DestinationLoki.js'
import { Logger } from '../src/classes/Logger.js'
import { LogLevel } from '../src/enums/loglevel.js'

export default (): void => {
  describe.skip('lokireal', () => {
    it('test', async () => {
      const loki = new DestinationLoki({ host: 'http://localhost:3100', fallback: new DestinationConsole(), labels: { env: 'test' } })

      const t = new Logger({ name: 'test', destination: loki, logLevel: LogLevel.Error, })
      t.error?.('loggertest', { hallo: 'test1' })

      await t.flush()
    })
  })
}
