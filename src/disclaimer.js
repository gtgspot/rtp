/**
 * Predictive Modeling Disclaimer Framework
 *
 * Provides comprehensive disclaimer functionality for probabilistic analytical outputs
 * and predictive modeling systems. This framework ensures proper legal notice and
 * intellectual property protection for algorithmic transformations.
 */

/**
 * Default disclaimer text for predictive modeling outputs
 */
export const PREDICTIVE_DISCLAIMER_TEXT =
  "System generates probabilistic analytical outputs derived through proprietary " +
  "algorithmic transformation of publicly licensed data. Results constitute statistical " +
  "inference with inherent uncertainty. No representation of outcome certainty is " +
  "expressed or implied. Intellectual property rights vest in computational methodology, " +
  "not source materials.";

/**
 * Disclaimer configuration options
 */
export class DisclaimerConfig {
  constructor(options = {}) {
    this.enabled = options.enabled !== false; // Default: true
    this.text = options.text || PREDICTIVE_DISCLAIMER_TEXT;
    this.headerName = options.headerName || 'X-Predictive-Disclaimer';
    this.includeInBody = options.includeInBody || false;
    this.endpoints = options.endpoints || []; // Specific endpoints to apply disclaimer
    this.contentTypes = options.contentTypes || ['application/json', 'text/html'];
  }
}

/**
 * Disclaimer Framework Class
 * Manages disclaimer injection and application across worker responses
 */
export class DisclaimerFramework {
  constructor(config = {}) {
    this.config = new DisclaimerConfig(config);
  }

  /**
   * Check if disclaimer should be applied to this request
   * @param {Request} request - The incoming request
   * @param {Response} response - The response being generated
   * @returns {boolean}
   */
  shouldApplyDisclaimer(request, response) {
    if (!this.config.enabled) {
      return false;
    }

    // Check if specific endpoints are configured
    if (this.config.endpoints.length > 0) {
      const url = new URL(request.url);
      const pathMatches = this.config.endpoints.some(endpoint =>
        url.pathname.startsWith(endpoint)
      );
      if (!pathMatches) {
        return false;
      }
    }

    // Check content type
    const contentType = response.headers.get('content-type') || '';
    const contentTypeMatches = this.config.contentTypes.some(type =>
      contentType.includes(type)
    );

    return contentTypeMatches;
  }

  /**
   * Add disclaimer header to response
   * @param {Response} response - The response to modify
   * @returns {Response} - Modified response with disclaimer header
   */
  addDisclaimerHeader(response) {
    const newHeaders = new Headers(response.headers);
    newHeaders.set(this.config.headerName, this.config.text);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }

  /**
   * Inject disclaimer into response body (for HTML and JSON)
   * @param {Response} response - The response to modify
   * @returns {Promise<Response>} - Modified response with disclaimer in body
   */
  async injectDisclaimerIntoBody(response) {
    const contentType = response.headers.get('content-type') || '';

    // Clone response to read body
    const text = await response.text();

    let modifiedBody = text;

    if (contentType.includes('application/json')) {
      try {
        const json = JSON.parse(text);
        json._disclaimer = {
          type: 'predictive_modeling',
          text: this.config.text,
          timestamp: new Date().toISOString()
        };
        modifiedBody = JSON.stringify(json);
      } catch (e) {
        // If JSON parsing fails, just add header
        console.error('Failed to parse JSON for disclaimer injection:', e);
      }
    } else if (contentType.includes('text/html')) {
      // Inject disclaimer as HTML comment at the end of body
      const disclaimerComment = `\n<!-- PREDICTIVE MODELING DISCLAIMER: ${this.config.text} -->\n`;
      modifiedBody = text.replace('</body>', `${disclaimerComment}</body>`);

      // If no body tag, append at end
      if (!text.includes('</body>')) {
        modifiedBody = text + disclaimerComment;
      }
    }

    return new Response(modifiedBody, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  }

  /**
   * Apply disclaimer to response
   * @param {Request} request - The incoming request
   * @param {Response} response - The response to modify
   * @returns {Promise<Response>} - Response with disclaimer applied
   */
  async applyDisclaimer(request, response) {
    if (!this.shouldApplyDisclaimer(request, response)) {
      return response;
    }

    // Always add header
    let modifiedResponse = this.addDisclaimerHeader(response);

    // Optionally inject into body
    if (this.config.includeInBody) {
      modifiedResponse = await this.injectDisclaimerIntoBody(modifiedResponse);
    }

    return modifiedResponse;
  }

  /**
   * Middleware function for Cloudflare Workers
   * Wraps the fetch handler with disclaimer functionality
   * @param {Function} handler - The original fetch handler
   * @returns {Function} - Wrapped handler with disclaimer
   */
  wrapHandler(handler) {
    return async (request, env, ctx) => {
      try {
        // Call original handler
        const response = await handler(request, env, ctx);

        // Apply disclaimer
        return await this.applyDisclaimer(request, response);
      } catch (error) {
        // Pass through errors
        throw error;
      }
    };
  }

  /**
   * Generate a standalone disclaimer page
   * @returns {Response} - HTML response with disclaimer information
   */
  generateDisclaimerPage() {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Predictive Modeling Disclaimer</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        .disclaimer-box {
            border: 2px solid #e74c3c;
            border-radius: 8px;
            padding: 30px;
            background-color: #fff5f5;
            margin: 20px 0;
        }
        h1 {
            color: #e74c3c;
            border-bottom: 2px solid #e74c3c;
            padding-bottom: 10px;
        }
        .meta {
            color: #666;
            font-size: 0.9em;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <h1>Predictive Modeling Disclaimer</h1>
    <div class="disclaimer-box">
        <p><strong>${this.config.text}</strong></p>
    </div>
    <div class="meta">
        <p>Generated: ${new Date().toISOString()}</p>
        <p>This disclaimer applies to all predictive modeling and analytical outputs from this system.</p>
    </div>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'content-type': 'text/html;charset=UTF-8',
        [this.config.headerName]: this.config.text
      }
    });
  }
}

/**
 * Create a default disclaimer framework instance
 * @param {Object} options - Configuration options
 * @returns {DisclaimerFramework}
 */
export function createDisclaimerFramework(options = {}) {
  return new DisclaimerFramework(options);
}

/**
 * Quick helper to add disclaimer header to any response
 * @param {Response} response - Response to modify
 * @param {string} disclaimerText - Optional custom disclaimer text
 * @returns {Response}
 */
export function addDisclaimerHeader(response, disclaimerText = PREDICTIVE_DISCLAIMER_TEXT) {
  const newHeaders = new Headers(response.headers);
  newHeaders.set('X-Predictive-Disclaimer', disclaimerText);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
