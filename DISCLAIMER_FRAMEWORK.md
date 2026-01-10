# Predictive Modeling Disclaimer Framework

## Overview

The Predictive Modeling Disclaimer Framework is a comprehensive system for managing and displaying disclaimers for probabilistic analytical outputs and predictive modeling systems. This framework ensures proper legal notice and intellectual property protection for algorithmic transformations.

## Features

- **Automatic Disclaimer Headers**: Adds disclaimer information to HTTP response headers
- **Body Injection**: Optionally inject disclaimers into JSON and HTML response bodies
- **Configurable Endpoints**: Apply disclaimers to specific endpoints or globally
- **Content Type Filtering**: Target specific content types for disclaimer application
- **Middleware Pattern**: Easy integration with Cloudflare Workers using middleware
- **Dedicated Disclaimer Page**: Built-in HTML page for detailed disclaimer information
- **Environment Variable Support**: Configure via `wrangler.toml` variables

## Default Disclaimer Text

```
System generates probabilistic analytical outputs derived through proprietary algorithmic
transformation of publicly licensed data. Results constitute statistical inference with
inherent uncertainty. No representation of outcome certainty is expressed or implied.
Intellectual property rights vest in computational methodology, not source materials.
```

## Installation & Setup

### 1. File Structure

```
/home/user/rtp/
├── src/
│   ├── index.js           # Main worker with disclaimer integration
│   └── disclaimer.js      # Disclaimer framework module
├── test/
│   ├── index.spec.js      # Worker integration tests
│   └── disclaimer.spec.js # Framework unit tests
└── wrangler.toml          # Cloudflare Workers configuration
```

### 2. Configuration (wrangler.toml)

Add these variables to your `wrangler.toml`:

```toml
[vars]
DISCLAIMER_ENABLED = "true"
DISCLAIMER_INCLUDE_IN_BODY = "false"
DISCLAIMER_TEXT = "Your custom disclaimer text here"
```

### 3. Worker Integration

The framework is already integrated in `src/index.js`. The worker automatically:

- Initializes the disclaimer framework with environment variables
- Wraps all responses with disclaimer middleware
- Provides a `/disclaimer` endpoint for viewing the full disclaimer

## Usage

### Basic Usage in Worker

```javascript
import { createDisclaimerFramework } from './disclaimer.js';

// Create framework instance
const framework = createDisclaimerFramework({
  enabled: true,
  includeInBody: false,
  endpoints: [], // Empty = apply to all endpoints
  contentTypes: ['application/json', 'text/html', 'text/plain']
});

// Wrap your fetch handler
export default {
  async fetch(request, env, ctx) {
    const handler = async (req, env, ctx) => {
      return new Response('Hello World');
    };

    const wrappedHandler = framework.wrapHandler(handler);
    return wrappedHandler(request, env, ctx);
  }
};
```

### Configuration Options

```javascript
const framework = createDisclaimerFramework({
  // Enable/disable the framework
  enabled: true,

  // Custom disclaimer text (optional, defaults to PREDICTIVE_DISCLAIMER_TEXT)
  text: "Your custom disclaimer",

  // Header name for disclaimer
  headerName: 'X-Predictive-Disclaimer',

  // Inject disclaimer into response bodies (JSON/HTML)
  includeInBody: false,

  // Apply only to specific endpoints (empty = all endpoints)
  endpoints: ['/api', '/predict'],

  // Apply only to specific content types
  contentTypes: ['application/json', 'text/html']
});
```

### Applying Disclaimer to Specific Responses

```javascript
import { DisclaimerFramework, addDisclaimerHeader } from './disclaimer.js';

// Quick helper method
const response = new Response('data');
const withDisclaimer = addDisclaimerHeader(response);

// Or use the framework directly
const framework = new DisclaimerFramework();
const modifiedResponse = await framework.applyDisclaimer(request, response);
```

### Generating Disclaimer Page

```javascript
const framework = createDisclaimerFramework();

// In your fetch handler
if (request.url.endsWith('/disclaimer')) {
  return framework.generateDisclaimerPage();
}
```

## API Reference

### `createDisclaimerFramework(options)`

Factory function to create a new DisclaimerFramework instance.

**Parameters:**
- `options` (Object): Configuration options
  - `enabled` (Boolean): Enable/disable framework (default: true)
  - `text` (String): Custom disclaimer text
  - `headerName` (String): Header name (default: 'X-Predictive-Disclaimer')
  - `includeInBody` (Boolean): Inject into response bodies (default: false)
  - `endpoints` (Array): Specific endpoints to target (default: [])
  - `contentTypes` (Array): Content types to target (default: ['application/json', 'text/html'])

**Returns:** DisclaimerFramework instance

### `DisclaimerFramework` Class Methods

#### `shouldApplyDisclaimer(request, response)`

Determines if disclaimer should be applied based on configuration.

**Returns:** Boolean

#### `addDisclaimerHeader(response)`

Adds disclaimer header to response.

**Returns:** Response with disclaimer header

#### `injectDisclaimerIntoBody(response)`

Injects disclaimer into JSON or HTML response body.

**Returns:** Promise<Response> with modified body

#### `applyDisclaimer(request, response)`

Applies disclaimer (header and optionally body injection).

**Returns:** Promise<Response> with disclaimer applied

#### `wrapHandler(handler)`

Wraps a fetch handler with disclaimer middleware.

**Parameters:**
- `handler` (Function): Original fetch handler

**Returns:** Wrapped handler function

#### `generateDisclaimerPage()`

Generates a standalone HTML disclaimer page.

**Returns:** Response containing HTML page

### Helper Functions

#### `addDisclaimerHeader(response, disclaimerText)`

Quick helper to add disclaimer header to any response.

**Parameters:**
- `response` (Response): Response to modify
- `disclaimerText` (String): Optional custom text

**Returns:** Response with disclaimer header

## Endpoints

### `/` - Root

Returns "Hello World!" message with disclaimer header.

### `/disclaimer`

Displays a dedicated HTML page with the full disclaimer text.

### `/api/predict`

Example predictive modeling endpoint that returns probabilistic data with disclaimer header.

Example response:
```json
{
  "prediction": "sample_outcome",
  "confidence": 0.85,
  "model": "proprietary_algorithm_v1",
  "timestamp": "2024-01-10T14:30:00.000Z",
  "note": "This is a probabilistic analytical output"
}
```

## Testing

Run the test suite:

```bash
npm test
```

### Test Coverage

- **Framework Unit Tests** (`test/disclaimer.spec.js`):
  - DisclaimerConfig creation and customization
  - shouldApplyDisclaimer logic
  - Header injection
  - Body injection (JSON and HTML)
  - Middleware wrapping
  - Disclaimer page generation

- **Integration Tests** (`test/index.spec.js`):
  - Worker endpoints with disclaimer headers
  - Environment variable configuration
  - Disclaimer page rendering
  - Predictive API endpoint

## Examples

### Example 1: Apply Disclaimer to All JSON Responses

```javascript
const framework = createDisclaimerFramework({
  enabled: true,
  contentTypes: ['application/json']
});
```

### Example 2: Inject Disclaimer into Response Bodies

```javascript
const framework = createDisclaimerFramework({
  enabled: true,
  includeInBody: true,
  contentTypes: ['application/json', 'text/html']
});

// JSON responses will include:
// {
//   "data": "...",
//   "_disclaimer": {
//     "type": "predictive_modeling",
//     "text": "...",
//     "timestamp": "2024-01-10T14:30:00.000Z"
//   }
// }
```

### Example 3: Target Specific API Endpoints

```javascript
const framework = createDisclaimerFramework({
  enabled: true,
  endpoints: ['/api/predict', '/api/analyze', '/api/forecast'],
  contentTypes: ['application/json']
});
```

### Example 4: Custom Disclaimer Text

```javascript
const framework = createDisclaimerFramework({
  enabled: true,
  text: "Custom legal disclaimer for your specific use case"
});
```

## Response Headers

When the framework is enabled, responses include:

```
X-Predictive-Disclaimer: System generates probabilistic analytical outputs...
```

You can verify this with:

```bash
curl -I http://localhost:8787/api/predict
```

## Body Injection Format

### JSON Responses

```json
{
  "your": "data",
  "_disclaimer": {
    "type": "predictive_modeling",
    "text": "System generates probabilistic analytical outputs...",
    "timestamp": "2024-01-10T14:30:00.000Z"
  }
}
```

### HTML Responses

```html
<html>
<body>
  <h1>Content</h1>
  <!-- PREDICTIVE MODELING DISCLAIMER: System generates probabilistic analytical outputs... -->
</body>
</html>
```

## Environment Variables

Configure the framework via `wrangler.toml`:

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `DISCLAIMER_ENABLED` | String/Boolean | "true" | Enable/disable the framework |
| `DISCLAIMER_INCLUDE_IN_BODY` | String/Boolean | "false" | Inject disclaimer into response bodies |
| `DISCLAIMER_TEXT` | String | (default text) | Custom disclaimer text |

## Best Practices

1. **Header-Only by Default**: Keep `includeInBody: false` for better performance
2. **Target Specific Endpoints**: Use the `endpoints` array to limit scope
3. **Content Type Filtering**: Only apply to relevant content types
4. **Custom Text**: Override default text for specific legal requirements
5. **Testing**: Always test disclaimer application in your deployment environment

## Troubleshooting

### Disclaimer not appearing

- Check `DISCLAIMER_ENABLED` is set to "true" in environment
- Verify content type matches configured `contentTypes`
- Ensure endpoint matches if `endpoints` array is configured

### Body injection not working

- Set `DISCLAIMER_INCLUDE_IN_BODY` to "true"
- Verify response content type is JSON or HTML
- Check response is not already consumed before injection

## License & Legal

This framework helps display disclaimers but does not constitute legal advice. Consult with legal counsel to ensure your disclaimer text meets your specific requirements.

## Support

For issues or questions:
- Review the test files for usage examples
- Check the inline code documentation in `src/disclaimer.js`
- Verify configuration in `wrangler.toml`
