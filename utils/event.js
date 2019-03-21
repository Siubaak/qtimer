const listeners = {}

function on(event, callback) {
  if (!listeners[event]) {
    listeners[event] = []
  }
  listeners[event].push(callback)
}

function emit(event, ctx) {
  console.log(ctx)
  console.log(listeners[event])
  if (listeners[event]) {
    for (let i = 0; i < listeners[event].length; i++) {
      listeners[event][i](ctx)
    }
  }
}

module.exports = { on, emit }