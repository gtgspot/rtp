import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src';
import { PREDICTIVE_DISCLAIMER_TEXT } from '../src/disclaimer.js';

describe('Worker with Disclaimer Framework', () => {
	it('responds with Hello World and disclaimer header (unit style)', async () => {
		const request = new Request('http://example.com');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(await response.text()).toContain('Hello World!');
		expect(response.headers.get('X-Predictive-Disclaimer')).toBe(PREDICTIVE_DISCLAIMER_TEXT);
	});

	it('serves disclaimer page at /disclaimer', async () => {
		const request = new Request('http://example.com/disclaimer');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toContain('text/html');
		expect(response.headers.get('X-Predictive-Disclaimer')).toBe(PREDICTIVE_DISCLAIMER_TEXT);

		const html = await response.text();
		expect(html).toContain('Predictive Modeling Disclaimer');
		expect(html).toContain(PREDICTIVE_DISCLAIMER_TEXT);
	});

	it('serves predictive API endpoint with disclaimer', async () => {
		const request = new Request('http://example.com/api/predict');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toContain('application/json');
		expect(response.headers.get('X-Predictive-Disclaimer')).toBe(PREDICTIVE_DISCLAIMER_TEXT);

		const data = await response.json();
		expect(data.prediction).toBeDefined();
		expect(data.confidence).toBeDefined();
		expect(data.model).toBeDefined();
	});

	it('returns 404 for unknown routes with disclaimer header', async () => {
		const request = new Request('http://example.com/unknown');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(404);
		expect(response.headers.get('X-Predictive-Disclaimer')).toBe(PREDICTIVE_DISCLAIMER_TEXT);
	});

	it('responds correctly when DISCLAIMER_ENABLED is true in env', async () => {
		const customEnv = {
			...env,
			DISCLAIMER_ENABLED: 'true',
			DISCLAIMER_TEXT: 'Custom disclaimer for testing'
		};

		const request = new Request('http://example.com');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, customEnv, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.headers.get('X-Predictive-Disclaimer')).toBe('Custom disclaimer for testing');
	});
});
