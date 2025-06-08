export type UrlChangeCallback = (url: string, previousUrl: string) => void;

export interface UrlObserver {
  disconnect: () => void;
}

/**
 * Function to observe URL changes
 * @param callback Callback function called when URL changes
 * @returns Object with disconnect function to stop observing
 */
export function listenUrlChange(callback: UrlChangeCallback): UrlObserver {
  let currentUrl = window.location.href;
  let isListening = true;

  // Handler for popstate event (browser back/forward buttons)
  const handlePopState = () => {
    if (!isListening) return;

    const previousUrl = currentUrl;
    const newUrl = window.location.href;

    if (previousUrl !== newUrl) {
      currentUrl = newUrl;
      callback(newUrl, previousUrl);
    }
  };

  // Override History API (pushState, replaceState)
  const originalPushState = History.prototype.pushState;
  const originalReplaceState = History.prototype.replaceState;

  const wrapHistoryMethod = (originalMethod: typeof originalPushState) => {
    return function(this: History, ...args: Parameters<typeof originalPushState>) {
      const previousUrl = currentUrl;

      // Execute the original method
      const result = originalMethod.apply(this, args);

      if (!isListening) return result;

      // Check for URL changes
      const newUrl = window.location.href;
      if (previousUrl !== newUrl) {
        currentUrl = newUrl;
        callback(newUrl, previousUrl);
      }

      return result;
    };
  };

  // Override History API
  History.prototype.pushState = wrapHistoryMethod(originalPushState);
  History.prototype.replaceState = wrapHistoryMethod(originalReplaceState);

  // Listen to popstate events
  window.addEventListener('popstate', handlePopState);

  // Cleanup function
  const disconnect = () => {
    isListening = false;
    window.removeEventListener('popstate', handlePopState);

    // Restore original History API
    History.prototype.pushState = originalPushState;
    History.prototype.replaceState = originalReplaceState;
  };

  return { disconnect };
}
