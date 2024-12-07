// Mock implementation of OpenTelemetry API
module.exports = {
  context: {
    active: () => ({}),
    bind: (context, target) => target,
    with: (context, fn) => fn(),
    ROOT_CONTEXT: Symbol('root context'),
    createContextKey: (description) => ({
      description,
      toString: () => description,
    }),
  },
  trace: {
    getSpan: () => null,
    setSpan: () => {},
    getTracer: (name, version) => ({
      startSpan: (name, options) => ({
        end: () => {},
        setAttribute: () => {},
        setAttributes: () => {},
        setStatus: () => {},
        recordException: () => {},
      }),
      startActiveSpan: (name, options, fn) => {
        if (typeof options === 'function') {
          fn = options;
        }
        const span = {
          end: () => {},
          setAttribute: () => {},
          setAttributes: () => {},
          setStatus: () => {},
          recordException: () => {},
        };
        return fn(span);
      },
    }),
    setSpanContext: () => {},
    spanContextFromTraceParent: () => ({}),
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
  propagation: {
    extract: () => ({}),
    inject: () => {},
    fields: () => [],
    setTextMapPropagator: () => {},
  },
  metrics: {
    getMeter: () => ({
      createHistogram: () => ({
        record: () => {},
      }),
      createCounter: () => ({
        add: () => {},
      }),
    }),
  },
  ROOT_CONTEXT: Symbol('root context'),
  createContextKey: (description) => ({
    description,
    toString: () => description,
  }),
}
