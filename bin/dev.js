#!/usr/bin/env -S node --loader ts-node/esm --no-warnings

import {execute} from '@oclif/core'

// Suppress the NODE_TLS_REJECT_UNAUTHORIZED warning in development
const originalEmit = process.emit.bind(process)
process.emit = function (event, ...args) {
  if (
    event === 'warning' &&
    args[0]?.message?.includes('NODE_TLS_REJECT_UNAUTHORIZED')
  ) {
    return false
  }

  return originalEmit(event, ...args)
}

await execute({development: true, dir: import.meta.url})
