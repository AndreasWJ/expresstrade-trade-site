const { Router } = require('express');
const tradeService = require('../services/trade-service');

// This router is prepended with '/api'
const apiRouter = Router();

/**
 * The '/api/request-trade' endpoint. Should accept the selected items as
 * POST data, then attempt to create a trade offer with these items to the
 * requesting user.
 */
apiRouter.post('/request-trade', async (req, res) => {
	if (req.user == null) {
		// The user is not logged in
		return res.status(401).json({
			status: 'failed',
			message: 'You need to be logged in to trade',
		});
	}

	try {
		// Try sending a trade offer to the user that initiated the trade
		const tradeOffer = await tradeService.requestTrade(
			req.body.itemsToExchange,
			req.body.itemsToReceive,
			req.user.steamid,
		);
		console.log(JSON.stringify(tradeOffer));

		res.status(202).json({
			status: 'success',
			data: tradeOffer,
		});
	} catch (error) {
		console.log('The trade failed for some reason, caught error', error.message);
		res.status(400).json({
			status: 'error',
			message: error.message,
		});
	} 
});

module.exports.router = apiRouter;
