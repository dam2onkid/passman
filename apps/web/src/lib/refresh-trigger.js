class RefreshTrigger {
  constructor() {
    this.subscribers = new Set();
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  trigger() {
    this.subscribers.forEach((callback) => callback());
  }
}

// Create a singleton instance for app-wide refresh events
export const globalRefreshTrigger = new RefreshTrigger();

// React hook to use the refresh trigger
export function useRefreshTrigger() {
  const subscribe = (callback) => {
    return globalRefreshTrigger.subscribe(callback);
  };

  const trigger = () => {
    globalRefreshTrigger.trigger();
  };

  return { subscribe, trigger };
}
