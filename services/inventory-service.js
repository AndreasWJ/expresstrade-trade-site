const config = require('../config.json');
const axios = require('axios');
const pricingService = require('./pricing-service');

module.exports = {
	/**
	 * The response data includes total number of items(total), the item array(items), user data(user_data),
	 * and the sort parameters used in the request(sort_parameters).
	 * https://github.com/OPSkins/trade-opskins-api/blob/master/ITrade/GetUserInventoryFromSteamId.md
	 */
	getUserInventory: async function (steamId) {
		const userInventoryResponse = await axios.get(
			`https://api-trade.opskins.com/ITrade/GetUserInventoryFromSteamId/v1?steam_id=${steamId}&app_id=${config.appId}`,
			{
				auth: {
					username: config.opskinsApiKey,
				},
			},
		);

		return userInventoryResponse.data.response.items;
	},

	/**
	 * The response data includes total number of items(total), the item array(items), user data(user_data),
	 * and the sort parameters used in the request(sort_parameters).
	 * https://github.com/OPSkins/trade-opskins-api/blob/master/ITrade/GetUserInventory.md
	 */
	getOwnerInventory: async function () {
		const ownerInventoryResponse = await axios.get(
			`https://api-trade.opskins.com/IUser/GetInventory/v1?app_id=${config.appId}`,
			{
				auth: {
					username: config.opskinsApiKey,
				},
			},
		);

		// Extract the items array from the inventory response
		const ownerItems = ownerInventoryResponse.data.response.items;

		// Increase the owner's items valuation by multiplying their valuation with the profit factor
		const ownerItemsWithProfitPricing = ownerItems.map(item => {
			item.suggested_price = pricingService.increasePriceWithProfitFactor(item.suggested_price);
			return item;
		});

		return ownerItemsWithProfitPricing;
	}
};
