const config = require('../config.json');

function increasePriceWithProfitFactor(originalPriceInCents) {
	return originalPriceInCents * config.profitFactor;
}

module.exports.increasePriceWithProfitFactor = increasePriceWithProfitFactor;
