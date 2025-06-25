/**
 * Bot detection utility that checks various browser properties and patterns
 * to determine if the current runtime environment is likely a bot or automated script.
 *
 * Generated with Claude.
 */

export interface BotDetectionResult {
  isBot: boolean;
  confidence: number; // 0-1 scale
  reasons: string[];
}

/**
 * Checks if the current runtime environment is likely a bot
 * @returns boolean indicating if the environment is detected as a bot
 */
export function isBot(): boolean {
  const result = detectBot();
  return result.isBot;
}

/**
 * Performs detailed bot detection with confidence score and reasons
 * @returns BotDetectionResult with detailed information
 */
export function detectBot(): BotDetectionResult {
  const reasons: string[] = [];
  let suspicionScore = 0;

  // Check if running in Node.js or other server environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    reasons.push('No window or document object (server environment)');
    return { isBot: true, confidence: 1, reasons };
  }

  // 1. User Agent checks - Known bots get immediate detection
  const userAgent = navigator.userAgent.toLowerCase();
  const knownBotPatterns = [
    /googlebot/i,
    /bingbot/i,
    /slurp/i,
    /duckduckbot/i,
    /baiduspider/i,
    /yandexbot/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /rogerbot/i,
    /linkedinbot/i,
    /embedly/i,
    /quora link preview/i,
    /showyoubot/i,
    /outbrain/i,
    /pinterest/i,
    /developers\.google\.com/i
  ];

  // Known automation tools - also immediate detection
  const automationPatterns = [
    /headlesschrome/i,
    /phantomjs/i,
    /slimerjs/i,
    /selenium/i,
    /webdriver/i,
    /puppeteer/i,
    /playwright/i
  ];

  // Generic bot patterns - suspicious but not definitive
  const genericBotPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i
  ];

  // Check for known bots - immediate detection
  for (const pattern of knownBotPatterns) {
    if (pattern.test(userAgent)) {
      reasons.push(`Known bot detected: ${pattern.source}`);
      return { isBot: true, confidence: 1, reasons };
    }
  }

  // Check for automation tools - immediate detection
  for (const pattern of automationPatterns) {
    if (pattern.test(userAgent)) {
      reasons.push(`Automation tool detected: ${pattern.source}`);
      return { isBot: true, confidence: 1, reasons };
    }
  }

  // Check for generic bot patterns - high suspicion
  for (const pattern of genericBotPatterns) {
    if (pattern.test(userAgent)) {
      reasons.push(`Generic bot pattern detected: ${pattern.source}`);
      suspicionScore += 50;
      break;
    }
  }

  // 2. Check for missing or unusual browser properties
  try {
    // WebDriver property explicitly set to true - immediate detection
    if (navigator.webdriver === true) {
      reasons.push('WebDriver property is true');
      return { isBot: true, confidence: 1, reasons };
    }

    // Check for automation-specific properties - immediate detection
    if ('__nightmare' in window || '__phantomas' in window) {
      reasons.push('Automation framework detected');
      return { isBot: true, confidence: 1, reasons };
    }

    // Check for Selenium/WebDriver indicators - immediate detection
    if (
      'callSelenium' in window ||
      'callPhantom' in window ||
      '_selenium' in window ||
      '__webdriver_evaluate' in window ||
      '__driver_evaluate' in window ||
      '__webdriver_unwrapped' in window ||
      '__driver_unwrapped' in window ||
      '__fxdriver_evaluate' in window ||
      '__fxdriver_unwrapped' in window
    ) {
      reasons.push('Selenium/WebDriver indicators found');
      return { isBot: true, confidence: 1, reasons };
    }

    // Check for missing mouse/touch events capability
    if (!('ontouchstart' in window) && !('onmousedown' in window)) {
      reasons.push('Missing interaction event handlers');
      suspicionScore += 15;
    }

    // Check screen properties
    if (screen.width === 0 || screen.height === 0) {
      reasons.push('Invalid screen dimensions');
      suspicionScore += 30;
    }

    // Check for missing language property
    if (!navigator.language && !navigator.languages) {
      reasons.push('Missing language properties');
      suspicionScore += 15;
    }

    // Check for suspicious timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timezone || timezone === 'UTC') {
      reasons.push('Suspicious or missing timezone');
      suspicionScore += 10;
    }

    // Check for missing or suspicious permissions API
    if ('permissions' in navigator) {
      try {
        // This will throw in some headless browsers
        navigator.permissions.query({ name: 'notifications' as PermissionName });
      } catch {
        reasons.push('Permissions API unavailable or restricted');
        suspicionScore += 15;
      }
    }

    // Check connection properties
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection && connection.rtt === 0) {
        reasons.push('Suspicious network connection properties');
        suspicionScore += 10;
      }
    }

  } catch (error) {
    // Errors accessing browser properties can indicate bot environment
    reasons.push('Error accessing browser properties');
    suspicionScore += 20;
  }

  // 3. Behavioral checks
  try {
    // Check if events can be properly created (some bots can't)
    const event = new MouseEvent('click');
    if (event.isTrusted === undefined) {
      reasons.push('Event creation issues detected');
      suspicionScore += 15;
    }
  } catch {
    reasons.push('Cannot create browser events');
    suspicionScore += 30;
  }

  // 4. Check for headless browser indicators
  if (
    !navigator.mediaDevices ||
    !navigator.serviceWorker ||
    !window.indexedDB ||
    !window.sessionStorage ||
    !window.localStorage
  ) {
    reasons.push('Missing essential browser APIs');
    suspicionScore += 40;
  }

  // 5. Check Chrome-specific bot indicators
  if (userAgent.includes('chrome')) {
    if (!(window as any).chrome || !(window as any).chrome.runtime) {
      reasons.push('Chrome browser missing chrome runtime');
      suspicionScore += 20;
    }
  }

  // Calculate confidence based on suspicion score
  // 0-50: Low suspicion (0-0.3 confidence)
  // 50-100: Medium suspicion (0.3-0.6 confidence)
  // 100+: High suspicion (0.6-1.0 confidence)
  let confidence: number;
  if (suspicionScore < 50) {
    confidence = suspicionScore / 167; // Max ~0.3
  } else if (suspicionScore < 100) {
    confidence = 0.3 + ((suspicionScore - 50) / 167); // 0.3-0.6
  } else {
    confidence = Math.min(0.6 + ((suspicionScore - 100) / 167), 1); // 0.6-1.0
  }

  // Consider it a bot if confidence is high (>0.7) or multiple strong indicators
  const isBot = confidence > 0.7 || suspicionScore >= 100;

  return {
    isBot,
    confidence,
    reasons
  };
}
