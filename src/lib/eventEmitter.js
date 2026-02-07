/**
 * Frontend event emitter for pub/sub between services and components.
 * Allows decoupling UI from Supabase real-time by emitting application events.
 * 
 * Usage:
 *   import { eventEmitter } from './eventEmitter'
 *   
 *   // In services (after DB write succeeds):
 *   eventEmitter.emit('INCOME_ADDED', { eventId, amount, ... })
 *   
 *   // In components (subscribe):
 *   useEffect(() => {
 *     eventEmitter.on('INCOME_ADDED', (data) => { reload() })
 *     return () => eventEmitter.off('INCOME_ADDED', ...)
 *   }, [])
 */

class EventEmitter {
  constructor() {
    this.events = {};
  }

  /**
   * Subscribe to an event
   * @param {string} eventName 
   * @param {Function} callback 
   */
  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
    
    // Return unsubscribe function for convenience
    return () => this.off(eventName, callback);
  }

  /**
   * Subscribe to event once, then auto-unsubscribe
   * @param {string} eventName 
   * @param {Function} callback 
   */
  once(eventName, callback) {
    const onceWrapper = (data) => {
      callback(data);
      this.off(eventName, onceWrapper);
    };
    this.on(eventName, onceWrapper);
  }

  /**
   * Unsubscribe from an event
   * @param {string} eventName 
   * @param {Function} callback 
   */
  off(eventName, callback) {
    if (!this.events[eventName]) return;
    this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
  }

  /**
   * Emit an event to all subscribers
   * @param {string} eventName 
   * @param {any} data 
   */
  emit(eventName, data) {
    if (!this.events[eventName]) return;
    this.events[eventName].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in listener for ${eventName}:`, error);
      }
    });
  }

  /**
   * Clear all listeners for an event (or all events if no eventName provided)
   * @param {string} eventName - Optional
   */
  clear(eventName) {
    if (eventName) {
      this.events[eventName] = [];
    } else {
      this.events = {};
    }
  }
}

// Singleton instance
export const eventEmitter = new EventEmitter();

/**
 * Supported event names:
 * 
 * ECONOMIC_EVENT_RECORDED - Any economic event recorded
 * INCOME_ADDED - Income event created
 * EXPENSE_ADDED - Expense event created
 * ASSET_ADDED - Asset event created
 * LIABILITY_ADDED - Liability event created
 * ENTITY_CREATED - New entity created
 * ENTITY_DELETED - Entity deleted
 * RECOVERY_ERROR - Error during operation (payload: { error })
 */
