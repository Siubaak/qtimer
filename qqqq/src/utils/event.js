const listeners = {}

export function on(event, callback) {
  if (!listeners[event]) {
    listeners[event] = []
  }
  listeners[event].push(callback)
}

export function emit(event, ctx) {
  if (listeners[event]) {
    for (let i = 0; i < listeners[event].length; i++) {
      listeners[event][i](ctx)
    }
  }
}