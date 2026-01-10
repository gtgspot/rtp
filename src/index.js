/**
 * Cloudflare Workers with Predictive Modeling Disclaimer Framework
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { createDisclaimerFramework } from './disclaimer.js';

// Initialize the Predictive Modeling Disclaimer Framework
// Configuration can be overridden via environment variables
function initializeDisclaimerFramework(env = {}) {
	return createDisclaimerFramework({
		enabled: env.DISCLAIMER_ENABLED === 'true' || env.DISCLAIMER_ENABLED === true || true,
		includeInBody: env.DISCLAIMER_INCLUDE_IN_BODY === 'true' || false,
		text: env.DISCLAIMER_TEXT || undefined, // Falls back to default
		endpoints: [], // Empty array means apply to all endpoints
		contentTypes: ['application/json', 'text/html', 'text/plain']
	});
}

// Main fetch handler
async function handleRequest(request, env, ctx, disclaimerFramework) {
	try {
		const url = new URL(request.url);
		const path = url.pathname;

		// Dedicated disclaimer page endpoint
		if (path === '/disclaimer') {
			return disclaimerFramework.generateDisclaimerPage();
		}

		// Example API endpoint with predictive data
		if (path === '/api/predict') {
			const predictiveData = {
				prediction: 'sample_outcome',
				confidence: 0.85,
				model: 'proprietary_algorithm_v1',
				timestamp: new Date().toISOString(),
				note: 'This is a probabilistic analytical output'
			};

			return new Response(JSON.stringify(predictiveData, null, 2), {
				status: 200,
				headers: {
					'content-type': 'application/json'
				}
			});
		}

		// Root endpoint
		if (path === '/') {
			return new Response('Hello World! Visit /disclaimer for important information.', {
				headers: {
					'content-type': 'text/plain'
				}
			});
		}

		// 404 for other routes
		return new Response('Not Found', {
			status: 404,
			headers: {
				'content-type': 'text/plain'
			}
		});
	} catch (error) {
		return new Response('Internal Server Error', {
			status: 500,
			headers: {
				'content-type': 'text/plain'
			}
		});
	}
}

// Export worker with disclaimer framework wrapper
export default {
	async fetch(request, env, ctx) {
		// Initialize disclaimer framework with environment variables
		const disclaimerFramework = initializeDisclaimerFramework(env);

		// Create wrapper that passes framework to handler
		const wrappedHandler = async (req, environment, context) => {
			return handleRequest(req, environment, context, disclaimerFramework);
		};

		// Apply disclaimer middleware
		const middlewareWrapped = disclaimerFramework.wrapHandler(wrappedHandler);
		return middlewareWrapped(request, env, ctx);
	}
};