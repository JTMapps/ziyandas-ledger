// src/lib/eventEmitter.ts
type Handler<T = any> = (payload: T) => void

class EventEmitter {
  private listeners: Record<string, Set<Handler>> = {}

  on<T = any>(event: string, handler: Handler<T>) {
    if (!this.listeners[event]) this.listeners[event] = new Set()
    this.listeners[event].add(handler as Handler)
    return () => this.off(event, handler)
  }

  off<T = any>(event: string, handler: Handler<T>) {
    this.listeners[event]?.delete(handler as Handler)
  }

  emit<T = any>(event: string, payload?: T) {
    this.listeners[event]?.forEach((handler) => handler(payload))
  }

  clear(event?: string) {
    if (event) delete this.listeners[event]
    else this.listeners = {}
  }
}

export const eventEmitter = new EventEmitter()

// Optional: strongly-typed event names (nice-to-have)
export const DomainEvents = {
  ECONOMIC_EVENT_RECORDED: 'ECONOMIC_EVENT_RECORDED',
  STATEMENT_RENDERED: 'STATEMENT_RENDERED',
  STATEMENT_REBUILT: 'STATEMENT_REBUILT',
  SNAPSHOT_FINALIZED: 'SNAPSHOT_FINALIZED'
} as const
