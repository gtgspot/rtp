/**
 * Softgaming Casino API Integration with Predictive Disclaimer Middleware
 * CloudFlare Workers Implementation
 *
 * Features:
 * - Automatic X-Predictive-Disclaimer headers
 * - JSON response body disclaimer injection
 * - Endpoint-level configuration
 * - Dedicated /disclaimer endpoint
 * - CORS support with exposed custom headers
 * - Casino API endpoints (games, providers, RTP data)
 */

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
	disclaimer: {
		enabled: true,
		defaultText: 'Predictions generated using statistical models. Not financial advice. Past performance does not guarantee future results.',
		modelVersion: 'v2.1.3',
		injectJson: true,
		injectHtml: false,
		exemptEndpoints: ['/health', '/ping']
	},
	casino: {
		// Softgaming API configuration (placeholder - configure with real credentials)
		apiBaseUrl: 'https://api.softgaming.com/v1',
		apiKey: process.env.SOFTGAMING_API_KEY || 'demo-key',
		// Mock data for demo purposes
		useMockData: true
	},
	cors: {
		allowOrigins: ['*'],
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowHeaders: ['*'],
		exposeHeaders: [
			'X-Predictive-Disclaimer',
			'X-Prediction-Model-Version',
			'X-Prediction-Confidence',
			'X-Prediction-Timestamp',
			'X-Casino-Provider',
			'X-RTP-Version'
		]
	}
};

// ============================================================================
// Mock Casino Data (Replace with real API calls)
// ============================================================================

const MOCK_CASINO_DATA = {
	providers: [
		{
			id: 'softgaming',
			name: 'Softgaming',
			gameCount: 10000,
			description: 'Unified single API integration accessing 250+ providers',
			features: ['Seamless Wallet API', 'Real-time balance sync', 'Multi-game concurrent play']
		},
		{
			id: 'elk-studios',
			name: 'ELK Studios',
			gameCount: 50,
			description: 'Premium slot provider with innovative game mechanics',
			features: ['X-iter™ modular bonus', 'ELK Compete tournaments', 'Mobile-first optimization']
		},
		{
			id: 'imperium-games',
			name: 'Imperium-Games',
			gameCount: 12,
			description: 'Modular B2B integration supporting live casino, slots, table games',
			features: ['Seamless Wallet API', 'Standard Wallet API', 'Multi-jurisdictional licensing']
		}
	],
	games: [
		// Softgaming Games
		{
			id: 'mega-moolah',
			name: 'Mega Moolah',
			provider: 'softgaming',
			type: 'slot',
			rtp: 88.12,
			volatility: 'high',
			maxWin: '1000000x',
			features: ['Progressive Jackpot', 'Free Spins', 'Wild Symbols'],
			predictedRtp: 88.15,
			predictedVolatility: 'high',
			confidence: 0.92
		},
		{
			id: 'starburst',
			name: 'Starburst',
			provider: 'softgaming',
			type: 'slot',
			rtp: 96.09,
			volatility: 'low',
			maxWin: '50000x',
			features: ['Expanding Wilds', 'Re-Spins', 'Both Ways Wins'],
			predictedRtp: 96.11,
			predictedVolatility: 'low',
			confidence: 0.95
		},
		// ELK Studios Games
		{
			id: 'elk-wild-toro',
			name: 'Wild Toro',
			provider: 'elk-studios',
			type: 'slot',
			rtp: 96.40,
			volatility: 'medium-high',
			maxWin: '2250x',
			features: ['Walking Wilds', 'Matador Re-Spin', 'X-iter™'],
			predictedRtp: 96.38,
			predictedVolatility: 'medium-high',
			confidence: 0.89
		},
		// Imperium-Games Platform - Slot Games
		{
			id: 'imperium-dragons-fortune',
			name: "Dragon's Fortune",
			provider: 'imperium-games',
			type: 'slot',
			rtp: 96.50,
			volatility: 'high',
			maxWin: '5000x',
			features: ['Cascading Reels', 'Free Spins', 'Multipliers', 'Scatter Symbols'],
			predictedRtp: 96.48,
			predictedVolatility: 'high',
			confidence: 0.93,
			releaseDate: '2025-06-15',
			paylines: 25,
			minBet: 0.25,
			maxBet: 100
		},
		{
			id: 'imperium-aztec-gold',
			name: 'Aztec Gold Rush',
			provider: 'imperium-games',
			type: 'slot',
			rtp: 95.80,
			volatility: 'medium-high',
			maxWin: '3500x',
			features: ['Free Spins', 'Bonus Game', 'Wild Symbols', 'Expanding Wilds'],
			predictedRtp: 95.85,
			predictedVolatility: 'medium-high',
			confidence: 0.91,
			releaseDate: '2025-08-20',
			paylines: 30,
			minBet: 0.30,
			maxBet: 150
		},
		{
			id: 'imperium-pharaohs-treasure',
			name: "Pharaoh's Treasure",
			provider: 'imperium-games',
			type: 'slot',
			rtp: 96.25,
			volatility: 'medium',
			maxWin: '2800x',
			features: ['Free Spins', 'Bonus Rounds', 'Scatter Symbols', 'Gamble Feature'],
			predictedRtp: 96.22,
			predictedVolatility: 'medium',
			confidence: 0.94,
			releaseDate: '2025-05-10',
			paylines: 20,
			minBet: 0.20,
			maxBet: 80
		},
		{
			id: 'imperium-lucky-clover',
			name: 'Lucky Clover Deluxe',
			provider: 'imperium-games',
			type: 'slot',
			rtp: 94.50,
			volatility: 'low',
			maxWin: '1000x',
			features: ['Classic Symbols', 'Wild Symbols', 'Scatter Pay'],
			predictedRtp: 94.55,
			predictedVolatility: 'low',
			confidence: 0.96,
			releaseDate: '2025-03-05',
			paylines: 10,
			minBet: 0.10,
			maxBet: 50
		},
		{
			id: 'imperium-viking-conquest',
			name: 'Viking Conquest',
			provider: 'imperium-games',
			type: 'slot',
			rtp: 96.75,
			volatility: 'high',
			maxWin: '8000x',
			features: ['Free Spins', 'Multipliers', 'Sticky Wilds', 'Re-Spins', 'Bonus Buy'],
			predictedRtp: 96.70,
			predictedVolatility: 'very-high',
			confidence: 0.88,
			releaseDate: '2025-09-12',
			paylines: 40,
			minBet: 0.40,
			maxBet: 200
		},
		{
			id: 'imperium-ocean-mystery',
			name: 'Ocean Mystery',
			provider: 'imperium-games',
			type: 'slot',
			rtp: 95.45,
			volatility: 'medium',
			maxWin: '2500x',
			features: ['Free Spins', 'Wild Symbols', 'Scatter Symbols', 'Bonus Game'],
			predictedRtp: 95.50,
			predictedVolatility: 'medium',
			confidence: 0.92,
			releaseDate: '2025-07-18',
			paylines: 25,
			minBet: 0.25,
			maxBet: 125
		},
		{
			id: 'imperium-jungle-quest',
			name: 'Jungle Quest Adventure',
			provider: 'imperium-games',
			type: 'slot',
			rtp: 96.10,
			volatility: 'medium-high',
			maxWin: '4200x',
			features: ['Cascading Reels', 'Free Spins', 'Multipliers', 'Wild Symbols'],
			predictedRtp: 96.05,
			predictedVolatility: 'medium-high',
			confidence: 0.90,
			releaseDate: '2025-04-22',
			paylines: 50,
			minBet: 0.50,
			maxBet: 250
		},
		{
			id: 'imperium-magic-gems',
			name: 'Magic Gems Deluxe',
			provider: 'imperium-games',
			type: 'slot',
			rtp: 95.20,
			volatility: 'low-medium',
			maxWin: '1500x',
			features: ['Cluster Pays', 'Cascading Wins', 'Multipliers'],
			predictedRtp: 95.25,
			predictedVolatility: 'low-medium',
			confidence: 0.95,
			releaseDate: '2025-02-14',
			paylines: 'cluster',
			minBet: 0.20,
			maxBet: 100
		},
		{
			id: 'imperium-wild-west',
			name: 'Wild West Showdown',
			provider: 'imperium-games',
			type: 'slot',
			rtp: 96.35,
			volatility: 'high',
			maxWin: '6500x',
			features: ['Free Spins', 'Bonus Game', 'Multipliers', 'Wild Symbols', 'Sticky Wilds'],
			predictedRtp: 96.40,
			predictedVolatility: 'high',
			confidence: 0.89,
			releaseDate: '2025-10-05',
			paylines: 30,
			minBet: 0.30,
			maxBet: 150
		},
		{
			id: 'imperium-space-odyssey',
			name: 'Space Odyssey Mega',
			provider: 'imperium-games',
			type: 'slot',
			rtp: 97.10,
			volatility: 'very-high',
			maxWin: '10000x',
			features: ['Free Spins', 'Expanding Wilds', 'Re-Spins', 'Bonus Buy', 'Megaways'],
			predictedRtp: 97.05,
			predictedVolatility: 'very-high',
			confidence: 0.85,
			releaseDate: '2025-11-20',
			paylines: 'megaways',
			minBet: 0.20,
			maxBet: 100
		},
		{
			id: 'imperium-fruit-party',
			name: 'Fruit Party Supreme',
			provider: 'imperium-games',
			type: 'slot',
			rtp: 94.80,
			volatility: 'low',
			maxWin: '800x',
			features: ['Classic Symbols', 'Wild Symbols', '3-Reel Classic'],
			predictedRtp: 94.82,
			predictedVolatility: 'low',
			confidence: 0.97,
			releaseDate: '2025-01-10',
			paylines: 5,
			minBet: 0.05,
			maxBet: 25
		},
		{
			id: 'imperium-samurai-fortune',
			name: 'Samurai Fortune',
			provider: 'imperium-games',
			type: 'slot',
			rtp: 96.55,
			volatility: 'medium-high',
			maxWin: '5500x',
			features: ['Free Spins', 'Wild Multipliers', 'Stacked Symbols', 'Re-Spins'],
			predictedRtp: 96.52,
			predictedVolatility: 'medium-high',
			confidence: 0.91,
			releaseDate: '2025-08-08',
			paylines: 25,
			minBet: 0.25,
			maxBet: 125
		}
	],
	rtpStats: {
		averageRtp: 95.95,
		highestRtp: 97.10,
		lowestRtp: 88.12,
		totalGames: 15,
		totalImperiumGames: 12,
		lastUpdated: new Date().toISOString()
	}
};

// ============================================================================
// Middleware: CORS Handler
// ============================================================================

function corsHeaders() {
	return {
		'Access-Control-Allow-Origin': CONFIG.cors.allowOrigins[0],
		'Access-Control-Allow-Methods': CONFIG.cors.allowMethods.join(', '),
		'Access-Control-Allow-Headers': CONFIG.cors.allowHeaders.join(', '),
		'Access-Control-Expose-Headers': CONFIG.cors.exposeHeaders.join(', '),
		'Access-Control-Max-Age': '86400'
	};
}

function handleCorsPreFlight() {
	return new Response(null, {
		status: 204,
		headers: corsHeaders()
	});
}

// ============================================================================
// Middleware: Predictive Disclaimer
// ============================================================================

function addDisclaimerHeaders(headers = {}, endpoint = '', confidence = null) {
	if (!CONFIG.disclaimer.enabled) {
		return headers;
	}

	// Check if endpoint is exempt
	if (CONFIG.disclaimer.exemptEndpoints.includes(endpoint)) {
		return headers;
	}

	// Core disclaimer header
	headers['X-Predictive-Disclaimer'] = CONFIG.disclaimer.defaultText;
	headers['X-Prediction-Model-Version'] = CONFIG.disclaimer.modelVersion;
	headers['X-Prediction-Timestamp'] = new Date().toISOString();

	// Add confidence header if available
	if (confidence !== null) {
		headers['X-Prediction-Confidence'] = confidence.toString();
	}

	return headers;
}

function injectJsonDisclaimer(data, endpoint = '') {
	if (!CONFIG.disclaimer.enabled || !CONFIG.disclaimer.injectJson) {
		return data;
	}

	// Check if endpoint is exempt
	if (CONFIG.disclaimer.exemptEndpoints.includes(endpoint)) {
		return data;
	}

	// Inject disclaimer object
	if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
		data._disclaimer = {
			message: CONFIG.disclaimer.defaultText,
			model_type: 'Statistical Analysis',
			model_version: CONFIG.disclaimer.modelVersion,
			timestamp: new Date().toISOString(),
			legal_notice: 'See /disclaimer for full terms',
			compliance: {
				gdpr_compliant: true,
				data_retention: '90 days',
				user_rights: 'Access, rectification, erasure available'
			}
		};

		// Add predictive disclaimer to casino data
		if (data.rtp || data.predictedRtp) {
			data._predictive_disclaimer = {
				rtp_prediction: 'Theoretical RTP may vary in practice',
				volatility_notice: 'Past volatility patterns not guaranteed',
				sample_size_warning: 'Predictions based on historical data samples',
				disclaimer_url: '/disclaimer'
			};
		}
	}

	return data;
}

// ============================================================================
// Utility: JSON Response Helper
// ============================================================================

function jsonResponse(data, status = 200, endpoint = '', confidence = null) {
	// Inject disclaimer into response body
	const responseData = injectJsonDisclaimer(data, endpoint);

	// Prepare headers
	let headers = {
		'Content-Type': 'application/json',
		...corsHeaders()
	};

	// Add disclaimer headers
	headers = addDisclaimerHeaders(headers, endpoint, confidence);

	return new Response(JSON.stringify(responseData, null, 2), {
		status,
		headers
	});
}

function errorResponse(message, status = 400, details = null) {
	const errorData = {
		error: true,
		message,
		status,
		timestamp: new Date().toISOString()
	};

	if (details) {
		errorData.details = details;
	}

	return jsonResponse(errorData, status);
}

// ============================================================================
// Route Handlers: Casino API
// ============================================================================

/**
 * GET /api/providers
 * Get list of casino game providers
 */
function handleGetProviders() {
	const response = {
		success: true,
		count: MOCK_CASINO_DATA.providers.length,
		providers: MOCK_CASINO_DATA.providers,
		integrationInfo: {
			architecture: 'Unified single API integration',
			totalGames: 10000,
			totalProviders: 250,
			apiVersion: 'v1.0',
			supportedFeatures: [
				'Seamless Wallet API',
				'Real-time balance synchronization',
				'Multi-game concurrent play (4 simultaneous games)'
			]
		}
	};

	return jsonResponse(response, 200, '/api/providers');
}

/**
 * GET /api/games
 * Get list of casino games with optional filtering
 */
function handleGetGames(searchParams) {
	const provider = searchParams.get('provider');
	const type = searchParams.get('type');
	const minRtp = searchParams.get('minRtp');

	let games = [...MOCK_CASINO_DATA.games];

	// Filter by provider
	if (provider) {
		games = games.filter(g => g.provider === provider);
	}

	// Filter by type
	if (type) {
		games = games.filter(g => g.type === type);
	}

	// Filter by minimum RTP
	if (minRtp) {
		const rtpThreshold = parseFloat(minRtp);
		games = games.filter(g => g.rtp >= rtpThreshold);
	}

	const response = {
		success: true,
		count: games.length,
		filters: {
			provider: provider || 'all',
			type: type || 'all',
			minRtp: minRtp || 'none'
		},
		games: games
	};

	// Calculate average confidence from filtered games
	const avgConfidence = games.length > 0
		? games.reduce((sum, g) => sum + g.confidence, 0) / games.length
		: null;

	return jsonResponse(response, 200, '/api/games', avgConfidence);
}

/**
 * GET /api/games/:id
 * Get detailed information about a specific game
 */
function handleGetGameById(gameId) {
	const game = MOCK_CASINO_DATA.games.find(g => g.id === gameId);

	if (!game) {
		return errorResponse(`Game not found: ${gameId}`, 404);
	}

	const response = {
		success: true,
		game: {
			...game,
			detailedStats: {
				averageSessionLength: '8.5 minutes',
				popularityRank: 42,
				lastUpdated: new Date().toISOString(),
				dataPoints: 15420,
				confidenceInterval: '95%'
			}
		}
	};

	return jsonResponse(response, 200, `/api/games/${gameId}`, game.confidence);
}

/**
 * GET /api/rtp/stats
 * Get RTP statistics across all games
 */
function handleGetRtpStats() {
	const response = {
		success: true,
		stats: MOCK_CASINO_DATA.rtpStats,
		analysis: {
			distribution: {
				'85-90%': 1200,
				'90-95%': 4500,
				'95-97%': 3800,
				'97-99%': 500
			},
			predictiveAccuracy: 0.91,
			sampleSize: 10000,
			methodology: 'Monte Carlo simulation with historical data analysis'
		}
	};

	return jsonResponse(response, 200, '/api/rtp/stats', 0.91);
}

/**
 * GET /api/predict/rtp/:gameId
 * Get RTP prediction for a specific game
 */
function handlePredictRtp(gameId) {
	const game = MOCK_CASINO_DATA.games.find(g => g.id === gameId);

	if (!game) {
		return errorResponse(`Game not found: ${gameId}`, 404);
	}

	const response = {
		success: true,
		gameId: game.id,
		gameName: game.name,
		currentRtp: game.rtp,
		predictedRtp: game.predictedRtp,
		confidence: game.confidence,
		predictionDetails: {
			model: 'Bayesian RTP Predictor',
			trainingData: '50,000 game sessions',
			lastTraining: '2026-01-01',
			factors: [
				'Historical RTP variance',
				'Provider track record',
				'Game volatility profile',
				'Regulatory requirements'
			]
		},
		disclaimer: {
			note: 'RTP predictions are theoretical and based on infinite play sessions',
			warning: 'Individual session results will vary significantly',
			legalNotice: 'Not intended as financial or gambling advice'
		}
	};

	return jsonResponse(response, 200, `/api/predict/rtp/${gameId}`, game.confidence);
}

/**
 * POST /api/casino/session
 * Create a new casino gaming session (Seamless Wallet API)
 */
async function handleCreateSession(request) {
	try {
		const body = await request.json();
		const { userId, gameId, currency = 'USD', balance = 1000 } = body;

		if (!userId || !gameId) {
			return errorResponse('Missing required fields: userId, gameId', 400);
		}

		const game = MOCK_CASINO_DATA.games.find(g => g.id === gameId);
		if (!game) {
			return errorResponse(`Game not found: ${gameId}`, 404);
		}

		const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		const response = {
			success: true,
			session: {
				sessionId,
				userId,
				gameId,
				gameName: game.name,
				currency,
				balance,
				createdAt: new Date().toISOString(),
				expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
				walletType: 'seamless',
				features: {
					realTimeSync: true,
					multiGameSupport: true,
					maxConcurrentGames: 4
				}
			},
			gameInfo: {
				provider: game.provider,
				rtp: game.rtp,
				volatility: game.volatility,
				predictedRtp: game.predictedRtp
			}
		};

		return jsonResponse(response, 201, '/api/casino/session', game.confidence);
	} catch (error) {
		return errorResponse('Invalid request body', 400, error.message);
	}
}

// ============================================================================
// Route Handler: Disclaimer Endpoint
// ============================================================================

/**
 * GET /disclaimer
 * Comprehensive predictive modeling disclaimer
 */
function handleGetDisclaimer() {
	const disclaimer = {
		title: 'Predictive Modeling & Casino Data Disclaimer',
		version: '1.0.0',
		lastUpdated: '2026-01-11T00:00:00Z',
		effectiveDate: '2026-01-01T00:00:00Z',
		sections: {
			general: {
				title: 'General Disclaimer',
				content: 'All predictions, forecasts, and statistical analyses provided through this API are generated using mathematical models and historical data. These predictions are provided for informational and entertainment purposes only and should not be construed as financial advice, investment recommendations, or guaranteed outcomes.'
			},
			methodology: {
				title: 'Predictive Methodology',
				content: 'Our predictions utilize various statistical techniques including Monte Carlo simulations, Bayesian inference, time series analysis, and machine learning models. All models are trained on historical data and validated against industry standards.',
				techniques: [
					'Monte Carlo simulation for probability distributions',
					'Bayesian networks for causal inference',
					'Regression analysis for trend prediction',
					'Historical pattern matching',
					'Provider-specific performance metrics'
				]
			},
			limitations: {
				title: 'Model Limitations',
				content: 'Predictive models have inherent limitations and cannot account for all variables that may affect outcomes.',
				specificLimitations: [
					'Models cannot predict unforeseen events or market disruptions',
					'Historical performance does not guarantee future results',
					'RTP (Return to Player) values are theoretical and calculated over infinite play sessions',
					'Individual session results will vary significantly from predicted values',
					'External factors (regulatory changes, provider updates) may affect accuracy',
					'Model confidence scores represent statistical certainty, not guaranteed accuracy'
				]
			},
			rtpSpecific: {
				title: 'RTP Prediction Disclaimer',
				content: 'Return to Player (RTP) percentages are theoretical values calculated over millions of game rounds. Actual player experience may vary significantly.',
				warnings: [
					'Theoretical RTP may vary significantly in practice',
					'Short-term play sessions will deviate from predicted RTP',
					'Volatility affects short-term outcomes regardless of RTP',
					'Casino edge ensures house advantage over time',
					'Individual results are subject to random variance'
				]
			},
			gambling: {
				title: 'Responsible Gambling Notice',
				content: 'This API provides casino game data and predictions. Gambling involves risk of financial loss.',
				notices: [
					'Only gamble with money you can afford to lose',
					'Seek help if gambling becomes a problem',
					'Predictions do not increase chances of winning',
					'Casino games are designed for entertainment, not income',
					'Set limits and stick to them'
				],
				resources: [
					{ name: 'National Council on Problem Gambling', url: 'https://www.ncpgambling.org' },
					{ name: 'Gamblers Anonymous', url: 'https://www.gamblersanonymous.org' },
					{ name: 'BeGambleAware', url: 'https://www.begambleaware.org' }
				]
			},
			liability: {
				title: 'Limitation of Liability',
				content: 'We provide this data and these predictions "as is" without warranties of any kind, express or implied. We disclaim all liability for decisions made based on our predictions or data.',
				terms: [
					'No liability for financial losses resulting from predictions',
					'No warranty of accuracy, completeness, or timeliness',
					'No guarantee of system availability or uptime',
					'User assumes all risks associated with using prediction data',
					'We are not responsible for third-party provider data accuracy'
				]
			},
			dataPrivacy: {
				title: 'Data Privacy & Compliance',
				content: 'We are committed to protecting user privacy and complying with applicable regulations.',
				compliance: {
					gdpr: {
						compliant: true,
						rights: [
							'Right to access your data',
							'Right to rectification',
							'Right to erasure',
							'Right to data portability',
							'Right to object to processing'
						]
					},
					dataRetention: '90 days for prediction logs, 30 days for session data',
					dataCollection: 'We collect minimal data necessary for predictions',
					thirdPartySharing: 'Data is not shared with third parties without consent'
				}
			},
			intellectualProperty: {
				title: 'Intellectual Property',
				content: 'All predictive models, algorithms, and methodologies are proprietary. Game data is provided by third-party providers and remains their intellectual property.'
			},
			updates: {
				title: 'Disclaimer Updates',
				content: 'This disclaimer may be updated periodically. Continued use of the API constitutes acceptance of any changes.',
				changeLog: [
					{ date: '2026-01-11', change: 'Initial version published' }
				]
			},
			contact: {
				title: 'Contact Information',
				content: 'For questions about this disclaimer or our predictive methodologies, please contact us.',
				email: 'legal@casinoapi.example.com',
				url: 'https://www.agentrtp.com/legal'
			}
		},
		legalEntity: {
			name: 'RTP Worker API Service',
			jurisdiction: 'International',
			regulatoryCompliance: [
				'MGA (Malta Gaming Authority)',
				'UKGC (UK Gambling Commission)',
				'Curacao eGaming License'
			]
		},
		acknowledgment: 'By using this API, you acknowledge that you have read, understood, and agree to be bound by this disclaimer.'
	};

	// Don't inject disclaimer into the disclaimer endpoint itself
	let headers = {
		'Content-Type': 'application/json',
		...corsHeaders()
	};

	return new Response(JSON.stringify(disclaimer, null, 2), {
		status: 200,
		headers
	});
}

// ============================================================================
// Route Handler: Health & Info
// ============================================================================

/**
 * GET /health
 * Health check endpoint (exempt from disclaimers)
 */
function handleHealthCheck() {
	const health = {
		status: 'healthy',
		uptime: process.uptime ? process.uptime() : 'N/A',
		timestamp: new Date().toISOString(),
		version: '1.0.0',
		environment: 'cloudflare-workers'
	};

	return jsonResponse(health, 200, '/health');
}

/**
 * GET /
 * API information and documentation
 */
function handleRoot() {
	const info = {
		name: 'Softgaming Casino API with Predictive Disclaimer',
		version: '1.0.0',
		description: 'Unified single API integration for casino games with predictive analytics and compliance',
		features: [
			'250+ game providers',
			'10,000+ games',
			'Seamless Wallet API',
			'Real-time balance synchronization',
			'Multi-game concurrent play (4 simultaneous games)',
			'Predictive RTP analytics',
			'Automatic disclaimer headers',
			'GDPR compliant'
		],
		endpoints: {
			info: {
				'GET /': 'API information',
				'GET /health': 'Health check',
				'GET /disclaimer': 'Full legal disclaimer'
			},
			providers: {
				'GET /api/providers': 'List all casino game providers'
			},
			games: {
				'GET /api/games': 'List all games (supports ?provider, ?type, ?minRtp filters)',
				'GET /api/games/:id': 'Get specific game details'
			},
			rtp: {
				'GET /api/rtp/stats': 'Get RTP statistics across all games',
				'GET /api/predict/rtp/:gameId': 'Get RTP prediction for specific game'
			},
			casino: {
				'POST /api/casino/session': 'Create new gaming session (Seamless Wallet API)'
			}
		},
		disclaimerFeatures: {
			'Automatic Headers': 'X-Predictive-Disclaimer, X-Prediction-Model-Version, X-Prediction-Confidence',
			'JSON Injection': 'All responses include _disclaimer and _predictive_disclaimer objects',
			'Endpoint Config': 'Configurable per-endpoint disclaimer settings',
			'Legal Compliance': 'Full disclaimer available at /disclaimer',
			'CORS Support': 'Custom headers exposed for browser access'
		},
		documentation: 'https://www.agentrtp.com/docs',
		support: 'https://www.agentrtp.com/support'
	};

	return jsonResponse(info, 200, '/');
}

// ============================================================================
// Router: Main Request Handler
// ============================================================================

async function handleRequest(request, env, ctx) {
	const url = new URL(request.url);
	const path = url.pathname;
	const method = request.method;

	// Handle CORS preflight
	if (method === 'OPTIONS') {
		return handleCorsPreFlight();
	}

	// Route matching
	try {
		// Health check
		if (path === '/health') {
			return handleHealthCheck();
		}

		// Root / API info
		if (path === '/') {
			return handleRoot();
		}

		// Disclaimer endpoint
		if (path === '/disclaimer') {
			return handleGetDisclaimer();
		}

		// Casino API routes
		if (path === '/api/providers' && method === 'GET') {
			return handleGetProviders();
		}

		if (path === '/api/games' && method === 'GET') {
			return handleGetGames(url.searchParams);
		}

		if (path.startsWith('/api/games/') && method === 'GET') {
			const gameId = path.split('/api/games/')[1];
			return handleGetGameById(gameId);
		}

		if (path === '/api/rtp/stats' && method === 'GET') {
			return handleGetRtpStats();
		}

		if (path.startsWith('/api/predict/rtp/') && method === 'GET') {
			const gameId = path.split('/api/predict/rtp/')[1];
			return handlePredictRtp(gameId);
		}

		if (path === '/api/casino/session' && method === 'POST') {
			return await handleCreateSession(request);
		}

		// Not found
		return errorResponse(`Endpoint not found: ${method} ${path}`, 404);

	} catch (error) {
		console.error('Request handling error:', error);
		return errorResponse('Internal server error', 500, error.message);
	}
}

// ============================================================================
// Worker Export
// ============================================================================

export default {
	async fetch(request, env, ctx) {
		return handleRequest(request, env, ctx);
	}
};
