/**
 * Bot detection utility that checks various browser properties and patterns
 * to determine if the current runtime environment is likely a bot or automated script.
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
  let botScore = 0;
  const maxScore = 10;

  // Check if running in Node.js or other server environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    reasons.push('No window or document object (server environment)');
    return { isBot: true, confidence: 1, reasons };
  }

  // 1. User Agent checks
  const userAgent = navigator.userAgent.toLowerCase();
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
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
    /developers\.google\.com/i,
    /headlesschrome/i,
    /phantomjs/i,
    /slimerjs/i,
    /selenium/i,
    /webdriver/i,
    /puppeteer/i,
    /playwright/i
  ];

  for (const pattern of botPatterns) {
    if (pattern.test(userAgent)) {
      reasons.push(`Bot pattern detected in user agent: ${pattern.source}`);
      botScore += 3;
      break;
    }
  }

  // 2. Check for missing or unusual browser properties
  try {
    // Missing webdriver property or explicitly set to true
    if (navigator.webdriver === true) {
      reasons.push('WebDriver property is true');
      botScore += 2;
    }

    // Check for automation-specific properties
    if ('__nightmare' in window || '__phantomas' in window) {
      reasons.push('Automation framework detected');
      botScore += 3;
    }

    // Check for Selenium/WebDriver indicators
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
      botScore += 3;
    }

    // Check for missing mouse/touch events capability
    if (!('ontouchstart' in window) && !('onmousedown' in window)) {
      reasons.push('Missing interaction event handlers');
      botScore += 1;
    }

    // Check screen properties
    if (screen.width === 0 || screen.height === 0) {
      reasons.push('Invalid screen dimensions');
      botScore += 2;
    }

    // Check for missing language property
    if (!navigator.language && !navigator.languages) {
      reasons.push('Missing language properties');
      botScore += 1;
    }

    // Check for suspicious timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timezone || timezone === 'UTC') {
      reasons.push('Suspicious or missing timezone');
      botScore += 1;
    }

    // Check for missing or suspicious permissions API
    if ('permissions' in navigator) {
      try {
        // This will throw in some headless browsers
        navigator.permissions.query({ name: 'notifications' as PermissionName });
      } catch {
        reasons.push('Permissions API unavailable or restricted');
        botScore += 1;
      }
    }

    // Check connection properties
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection && connection.rtt === 0) {
        reasons.push('Suspicious network connection properties');
        botScore += 1;
      }
    }

  } catch (error) {
    // Errors accessing browser properties can indicate bot environment
    reasons.push('Error accessing browser properties');
    botScore += 1;
  }

  // 3. Behavioral checks
  try {
    // Check if events can be properly created (some bots can't)
    const event = new MouseEvent('click');
    if (!event.isTrusted === undefined) {
      reasons.push('Event creation issues detected');
      botScore += 1;
    }
  } catch {
    reasons.push('Cannot create browser events');
    botScore += 2;
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
    botScore += 2;
  }

  // 5. Check Chrome-specific bot indicators
  if (userAgent.includes('chrome')) {
    if (!(window as any).chrome || !(window as any).chrome.runtime) {
      reasons.push('Chrome browser missing chrome runtime');
      botScore += 1;
    }
  }

  const confidence = Math.min(botScore / maxScore, 1);
  const isBot = confidence > 0.5;

  return {
    isBot,
    confidence,
    reasons
  };
}
