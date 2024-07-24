/* eslint-disable @typescript-eslint/no-misused-promises */
import { DestinationConsole } from '../src/classes/destination/DestinationConsole.js'
import { DestinationLoki } from '../src/classes/destination/DestinationLoki.js'
import { Logger } from '../src/classes/Logger.js'

export default (): void => {
  describe.skip('lokireal', () => {
    it('test', async () => {
      const loki = new DestinationLoki({ host: 'http://localhost:3100', fallback: new DestinationConsole(), labels: { env: 'test' } })
      const logger = new Logger('test', { destination: loki })
      logger.error?.('loggertest', { hallo: 'test1' })

      await logger.flush()
    })
  })
}
