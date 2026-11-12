export function createEventBus() {
    const listeners = new Map();

    function on(eventName, listener) {
        if (!listeners.has(eventName)) {
            listeners.set(eventName, new Set());
        }

        const eventListeners = listeners.get(eventName);

        eventListeners.add(listener);

        return () => {
            eventListeners.delete(listener);

            if (eventListeners.size === 0 && listeners.get(eventName) === eventListeners) {
                listeners.delete(eventName);
            }
        };
    }

    function emit(eventName, payload) {
        const eventListeners = listeners.get(eventName);

        if (!eventListeners) {
            return;
        }

        [...eventListeners].forEach((listener) => {
            listener(payload);
        });
    }

    function clear() {
        listeners.clear();
    }

    return {
        on,
        emit,
        clear,
    };
}
