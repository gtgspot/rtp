import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect, beforeEach } from 'vitest';
import {
	createDisclaimerFramework,
	DisclaimerFramework,
	DisclaimerConfig,
	PREDICTIVE_DISCLAIMER_TEXT,
	addDisclaimerHeader
} from '../src/disclaimer.js';

describe('Predictive Modeling Disclaimer Framework', () => {
	describe('DisclaimerConfig', () => {
		it('should create config with default values', () => {
			const config = new DisclaimerConfig();
			expect(config.enabled).toBe(true);
			expect(config.text).toBe(PREDICTIVE_DISCLAIMER_TEXT);
			expect(config.headerName).toBe('X-Predictive-Disclaimer');
			expect(config.includeInBody).toBe(false);
			expect(config.endpoints).toEqual([]);
			expect(config.contentTypes).toEqual(['application/json', 'text/html']);
		});

		it('should create config with custom values', () => {
			const config = new DisclaimerConfig({
				enabled: false,
				text: 'Custom disclaimer',
				headerName: 'X-Custom-Header',
				includeInBody: true,
				endpoints: ['/api'],
				contentTypes: ['application/json']
			});
			expect(config.enabled).toBe(false);
			expect(config.text).toBe('Custom disclaimer');
			expect(config.headerName).toBe('X-Custom-Header');
			expect(config.includeInBody).toBe(true);
			expect(config.endpoints).toEqual(['/api']);
			expect(config.contentTypes).toEqual(['application/json']);
		});
	});

	describe('DisclaimerFramework', () => {
		let framework;

		beforeEach(() => {
			framework = new DisclaimerFramework({
				enabled: true,
				contentTypes: ['application/json', 'text/html', 'text/plain']
			});
		});

		describe('shouldApplyDisclaimer', () => {
			it('should return false if disabled', () => {
				const disabledFramework = new DisclaimerFramework({ enabled: false });
				const request = new Request('http://example.com');
				const response = new Response('test', {
					headers: { 'content-type': 'application/json' }
				});

				expect(disabledFramework.shouldApplyDisclaimer(request, response)).toBe(false);
			});

			it('should return true for matching content type', () => {
				const request = new Request('http://example.com');
				const response = new Response('test', {
					headers: { 'content-type': 'application/json' }
				});

				expect(framework.shouldApplyDisclaimer(request, response)).toBe(true);
			});

			it('should return false for non-matching content type', () => {
				const request = new Request('http://example.com');
				const response = new Response('test', {
					headers: { 'content-type': 'image/png' }
				});

				expect(framework.shouldApplyDisclaimer(request, response)).toBe(false);
			});

			it('should filter by endpoint when configured', () => {
				const endpointFramework = new DisclaimerFramework({
					enabled: true,
					endpoints: ['/api'],
					contentTypes: ['application/json']
				});

				const apiRequest = new Request('http://example.com/api/predict');
				const otherRequest = new Request('http://example.com/other');
				const response = new Response('test', {
					headers: { 'content-type': 'application/json' }
				});

				expect(endpointFramework.shouldApplyDisclaimer(apiRequest, response)).toBe(true);
				expect(endpointFramework.shouldApplyDisclaimer(otherRequest, response)).toBe(false);
			});
		});

		describe('addDisclaimerHeader', () => {
			it('should add disclaimer header to response', () => {
				const response = new Response('test', {
					status: 200,
					headers: { 'content-type': 'application/json' }
				});

				const modifiedResponse = framework.addDisclaimerHeader(response);

				expect(modifiedResponse.headers.get('X-Predictive-Disclaimer')).toBe(
					PREDICTIVE_DISCLAIMER_TEXT
				);
				expect(modifiedResponse.status).toBe(200);
			});

			it('should preserve existing headers', () => {
				const response = new Response('test', {
					headers: {
						'content-type': 'application/json',
						'x-custom': 'value'
					}
				});

				const modifiedResponse = framework.addDisclaimerHeader(response);

				expect(modifiedResponse.headers.get('x-custom')).toBe('value');
				expect(modifiedResponse.headers.get('content-type')).toBe('application/json');
			});
		});

		describe('injectDisclaimerIntoBody', () => {
			it('should inject disclaimer into JSON response', async () => {
				const jsonData = { result: 'test', prediction: 0.95 };
				const response = new Response(JSON.stringify(jsonData), {
					headers: { 'content-type': 'application/json' }
				});

				const modifiedResponse = await framework.injectDisclaimerIntoBody(response);
				const body = await modifiedResponse.json();

				expect(body._disclaimer).toBeDefined();
				expect(body._disclaimer.type).toBe('predictive_modeling');
				expect(body._disclaimer.text).toBe(PREDICTIVE_DISCLAIMER_TEXT);
				expect(body._disclaimer.timestamp).toBeDefined();
				expect(body.result).toBe('test');
			});

			it('should inject disclaimer into HTML response', async () => {
				const html = '<html><body><h1>Test</h1></body></html>';
				const response = new Response(html, {
					headers: { 'content-type': 'text/html' }
				});

				const modifiedResponse = await framework.injectDisclaimerIntoBody(response);
				const body = await modifiedResponse.text();

				expect(body).toContain('<!-- PREDICTIVE MODELING DISCLAIMER:');
				expect(body).toContain(PREDICTIVE_DISCLAIMER_TEXT);
				expect(body).toContain('</body>');
			});

			it('should handle HTML without body tag', async () => {
				const html = '<html><h1>Test</h1></html>';
				const response = new Response(html, {
					headers: { 'content-type': 'text/html' }
				});

				const modifiedResponse = await framework.injectDisclaimerIntoBody(response);
				const body = await modifiedResponse.text();

				expect(body).toContain('<!-- PREDICTIVE MODELING DISCLAIMER:');
				expect(body).toContain(PREDICTIVE_DISCLAIMER_TEXT);
			});

			it('should not modify non-JSON/HTML content', async () => {
				const response = new Response('plain text', {
					headers: { 'content-type': 'text/plain' }
				});

				const modifiedResponse = await framework.injectDisclaimerIntoBody(response);
				const body = await modifiedResponse.text();

				expect(body).toBe('plain text');
			});
		});

		describe('applyDisclaimer', () => {
			it('should add header when conditions match', async () => {
				const request = new Request('http://example.com/api/predict');
				const response = new Response(JSON.stringify({ test: 'data' }), {
					headers: { 'content-type': 'application/json' }
				});

				const modifiedResponse = await framework.applyDisclaimer(request, response);

				expect(modifiedResponse.headers.get('X-Predictive-Disclaimer')).toBe(
					PREDICTIVE_DISCLAIMER_TEXT
				);
			});

			it('should inject into body when configured', async () => {
				const bodyFramework = new DisclaimerFramework({
					enabled: true,
					includeInBody: true,
					contentTypes: ['application/json']
				});

				const request = new Request('http://example.com');
				const jsonData = { result: 'test' };
				const response = new Response(JSON.stringify(jsonData), {
					headers: { 'content-type': 'application/json' }
				});

				const modifiedResponse = await bodyFramework.applyDisclaimer(request, response);
				const body = await modifiedResponse.json();

				expect(body._disclaimer).toBeDefined();
				expect(modifiedResponse.headers.get('X-Predictive-Disclaimer')).toBe(
					PREDICTIVE_DISCLAIMER_TEXT
				);
			});

			it('should not modify response when conditions do not match', async () => {
				const request = new Request('http://example.com');
				const response = new Response('test', {
					headers: { 'content-type': 'image/png' }
				});

				const modifiedResponse = await framework.applyDisclaimer(request, response);

				expect(modifiedResponse.headers.get('X-Predictive-Disclaimer')).toBeNull();
			});
		});

		describe('wrapHandler', () => {
			it('should wrap handler and apply disclaimer', async () => {
				const mockHandler = async (request, env, ctx) => {
					return new Response(JSON.stringify({ data: 'test' }), {
						headers: { 'content-type': 'application/json' }
					});
				};

				const wrappedHandler = framework.wrapHandler(mockHandler);
				const request = new Request('http://example.com');
				const response = await wrappedHandler(request, {}, {});

				expect(response.headers.get('X-Predictive-Disclaimer')).toBe(
					PREDICTIVE_DISCLAIMER_TEXT
				);
			});

			it('should pass through errors', async () => {
				const mockHandler = async () => {
					throw new Error('Test error');
				};

				const wrappedHandler = framework.wrapHandler(mockHandler);
				const request = new Request('http://example.com');

				await expect(wrappedHandler(request, {}, {})).rejects.toThrow('Test error');
			});
		});

		describe('generateDisclaimerPage', () => {
			it('should generate HTML disclaimer page', async () => {
				const response = framework.generateDisclaimerPage();

				expect(response.status).toBe(200);
				expect(response.headers.get('content-type')).toContain('text/html');
				expect(response.headers.get('X-Predictive-Disclaimer')).toBe(
					PREDICTIVE_DISCLAIMER_TEXT
				);

				const html = await response.text();
				expect(html).toContain('Predictive Modeling Disclaimer');
				expect(html).toContain(PREDICTIVE_DISCLAIMER_TEXT);
			});
		});
	});

	describe('createDisclaimerFramework factory', () => {
		it('should create a DisclaimerFramework instance', () => {
			const framework = createDisclaimerFramework({ enabled: true });
			expect(framework).toBeInstanceOf(DisclaimerFramework);
			expect(framework.config.enabled).toBe(true);
		});
	});

	describe('addDisclaimerHeader helper', () => {
		it('should add disclaimer header with default text', () => {
			const response = new Response('test');
			const modifiedResponse = addDisclaimerHeader(response);

			expect(modifiedResponse.headers.get('X-Predictive-Disclaimer')).toBe(
				PREDICTIVE_DISCLAIMER_TEXT
			);
		});

		it('should add disclaimer header with custom text', () => {
			const response = new Response('test');
			const customText = 'Custom disclaimer text';
			const modifiedResponse = addDisclaimerHeader(response, customText);

			expect(modifiedResponse.headers.get('X-Predictive-Disclaimer')).toBe(customText);
		});
	});
});
