/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request, env, ctx) {
		try {
			const url = new URL(request.url);
			const path = url.pathname;

			if (path === '/') {
				return new Response('Hello World!');
			} else {
				return new Response('Not Found', { status: 404 });
			}
		} catch (error) {
			return new Response('Internal Server Error', { status: 500 });
		}
	},
};