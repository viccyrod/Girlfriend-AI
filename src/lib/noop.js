// Mock implementation of OpenTelemetry API
module.exports = {
  createContextKey: (description) => ({
    description,
    toString: () => description,
  }),
  createTracer: () => ({
    startSpan: () => ({
      end: () => {},
    }),
  }),
  context: {
    active: () => ({}),
    bind: (context, target) => target,
    with: (context, fn) => fn(),
  },
  trace: {
    getSpan: () => null,
    setSpan: () => {},
  },
  SpanStatusCode: {
    OK: 'OK',
    ERROR: 'ERROR',
  },
  ValueType: {
    STRING: 'string',
    BOOLEAN: 'boolean',
    INT: 'int',
    DOUBLE: 'double',
    ARRAY: 'array',
  },
  diag: {
    warn: () => {},
    error: () => {},
    info: () => {},
    debug: () => {},
    verbose: () => {},
  },
}
