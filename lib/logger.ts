type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, unknown>
  error?: {
    name: string
    message: string
    stack?: string
  }
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

class Logger {
  private minLevel: LogLevel

  constructor() {
    this.minLevel = (process.env.LOG_LEVEL as LogLevel) || 'info'
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel]
  }

  private formatEntry(entry: LogEntry): string {
    if (process.env.NODE_ENV === 'production') {
      // JSON format for production (easier to parse in log aggregators)
      return JSON.stringify(entry)
    }

    // Human-readable format for development
    const { level, message, timestamp, context, error } = entry
    const levelColor = {
      debug: '\x1b[36m', // cyan
      info: '\x1b[32m',  // green
      warn: '\x1b[33m',  // yellow
      error: '\x1b[31m', // red
    }[level]
    const reset = '\x1b[0m'

    let output = `${levelColor}[${level.toUpperCase()}]${reset} ${timestamp} - ${message}`

    if (context && Object.keys(context).length > 0) {
      output += ` ${JSON.stringify(context)}`
    }

    if (error) {
      output += `\n  Error: ${error.message}`
      if (error.stack) {
        output += `\n  ${error.stack.split('\n').slice(1).join('\n  ')}`
      }
    }

    return output
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error) {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
    }

    const formatted = this.formatEntry(entry)

    switch (level) {
      case 'debug':
      case 'info':
        console.log(formatted)
        break
      case 'warn':
        console.warn(formatted)
        break
      case 'error':
        console.error(formatted)
        break
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context)
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context)
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context)
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log('error', message, context, error)
  }

  // Create a child logger with preset context
  child(defaultContext: Record<string, unknown>): ChildLogger {
    return new ChildLogger(this, defaultContext)
  }
}

class ChildLogger {
  constructor(
    private parent: Logger,
    private defaultContext: Record<string, unknown>
  ) {}

  private mergeContext(context?: Record<string, unknown>): Record<string, unknown> {
    return { ...this.defaultContext, ...context }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.parent.debug(message, this.mergeContext(context))
  }

  info(message: string, context?: Record<string, unknown>) {
    this.parent.info(message, this.mergeContext(context))
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.parent.warn(message, this.mergeContext(context))
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.parent.error(message, error, this.mergeContext(context))
  }
}

// Export singleton instance
export const logger = new Logger()

// Request logging helper
export function logRequest(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
  userId?: string
) {
  const context = {
    method,
    path,
    statusCode,
    durationMs,
    ...(userId && { userId }),
  }

  if (statusCode >= 500) {
    logger.error(`${method} ${path} - ${statusCode}`, undefined, context)
  } else if (statusCode >= 400) {
    logger.warn(`${method} ${path} - ${statusCode}`, context)
  } else {
    logger.info(`${method} ${path} - ${statusCode}`, context)
  }
}

// Audit log helper
export function logAudit(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  changes?: Record<string, unknown>
) {
  logger.info(`Audit: ${action}`, {
    userId,
    action,
    entityType,
    entityId,
    changes,
  })
}

// Performance timing helper
export function createTimer(operation: string) {
  const start = performance.now()

  return {
    end: (context?: Record<string, unknown>) => {
      const duration = performance.now() - start
      logger.debug(`${operation} completed`, {
        ...context,
        durationMs: Math.round(duration * 100) / 100,
      })
      return duration
    },
  }
}
