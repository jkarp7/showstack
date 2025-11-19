type LogLevel = 'info' | 'warn' | 'error' | 'debug'

class Logger {
  private log(level: LogLevel, message: string, data?: any) {
    const timestamp = new Date().toISOString()
    const logData = data ? ` ${JSON.stringify(data)}` : ''

    console[level === 'debug' ? 'log' : level](
      `[${timestamp}] [${level.toUpperCase()}] ${message}${logData}`
    )
  }

  info(message: string, data?: any) {
    this.log('info', message, data)
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data)
  }

  error(message: string, data?: any) {
    this.log('error', message, data)
  }

  debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, data)
    }
  }
}

export const logger = new Logger()
