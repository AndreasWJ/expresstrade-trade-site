const axios = require('axios');
const twoFactorService = require('./two-factor-service');
const querystring = require('querystring');
const config = require('../config.json');
const inventoryService = require('./inventory-service');

async function requestTrade(itemsToExchange, itemsToReceive, recipientSteamId) {
	const isVerified = await verifyTrade(itemsToExchange, itemsToReceive, recipientSteamId);

	if (!isVerified) {
		throw new Error('The trade couldn\'t be verified');
	}

	// Arrange POST data
	const allItemIds = [...itemArrayToIds(itemsToExchange), ...itemArrayToIds(itemsToReceive)];

	/**
	 * This endpoint wants its post data either as application/x-www-form-urlencoded or application/json.
	 * I'm going to try with application/x-www-form-urlencoded as it makes more sense with the key value pairs input.
	 *
	 * The twofactor_code needs to be parsed from string to integer, that's what the endpoint expects.
	 *
	 * It seems like you don't need to parse the SteamID from string to integer. According to the ExpressTrade's API
	 * documentation the endpoint expects a SteamID of type integer but when I use 'parseInt()' the string is
	 * converted to 76561198055227920 which is just 1 number from my SteamID 76561198055227921. It's probably
	 * a problem with the 'parseInt()' function but you don't have to parse it before it seems like.
	 *
	 * The 'items' key of the post data expects a string of item ids, for example '1,2,3,4'. The reason why you
	 * don't need to differentiate between your items and the recipient's items is because all item ids are
	 * unique and the API endpoint can differentiate the items themselves when creating the trade offer.
	 *
	 * 'One or more items are not eligible for trade offer.' is most likely an error caused by you trying to
	 * create a trade where one of the parties doesn't own one of the items.
	 */
	const postData = {
		twofactor_code: Number.parseInt(twoFactorService.getTwoFactorCode()),
		steam_id: recipientSteamId,
		items: allItemIds.toString(),
		message: 'Trade offer from the trade site',
	};

	return await sendTrade(postData);
}

/**
 * API endpoint documentation
 * https://github.com/OPSkins/trade-opskins-api/blob/master/ITrade/SendOfferToSteamId.md
 * @param {object} tradePostData object containing twofactor_code, steam_id, items, and optionally a message
 */
async function sendTrade(tradePostData) {
	/**
	 * The endpoint expects a content-type of either application/json or application/x-www-form-urlencoded. I chose
	 * the latter. But in order to send the POST data in the POST's body with the aforementioned content type you
	 * need to encode it, so the body structure resembles the content type. For example, the POST data could
	 * look like this:
	 * 'twofactor_code=123456&steam_id=1234&items=1,2,3,4&message=Trade offer'
	 *
	 * https://nodejs.org/api/querystring.html#querystring_querystring_stringify_obj_sep_eq_options
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST
	 * https://github.com/axios/axios/issues/350#issuecomment-227270046
	 */
	const encodedPostData = querystring.stringify(tradePostData);

	const response = await axios.post('https://api-trade.opskins.com/ITrade/SendOfferToSteamId/v1', encodedPostData, {
		headers: {
			'Content-type': 'application/x-www-form-urlencoded',
		},
		auth: {
			username: config.opskinsApiKey,
		},
	});

	return response.data;
}

/**
 * This function's responsibility is to verify what the user sent in as input. For example:
 * - Does the user own the items they requested to trade away?
 * - Do the items the user wanted to receive exist in the owner's inventory?
 * - Verify the price difference. Are the exchanged items worth more than the received
 * items? If not cancel the trade.
 *
 * In order to verify these expectations both the user and the owner's inventory
 * needs to be retrieved once again.
 *
 * You don't need to consider the profit factor to be included in the price difference as the
 * owner inventory already is valued higher according to the profit factor. You only need to
 * verify that the items requested to be traded is valued equal or greater than the items
 * that are to be received from the trade.
 */
async function verifyTrade(itemsToExchange, itemsToReceive, recipientSteamId) {
	const userInventory = await inventoryService.getUserInventory(recipientSteamId);
	const ownerInventory = await inventoryService.getOwnerInventory();

	// If one of the items from either party doesn't exist in their inventory, throw an error which cancels the trade
	if (!isInInventory(itemsToExchange, userInventory) || !isInInventory(itemsToReceive, ownerInventory)) {
		throw new Error('One or many of the items doesn\'t exist in either inventory');
	}

	// Verify the price difference
	if (getItemsValue(itemsToExchange) < getItemsValue(itemsToReceive)) {
		throw new Error('The items chosen has a value less than the requested items, add more items to your trade to increase its value');
	}

	return true;
}

/**
 * If the inventory possesses all items, return true. Otherwise if one or more is missing return false.
 * @param {Item[]} itemArray an array of items you wish to check if it exist in an inventory
 * @param {Item[]} inventoryItemArray the inventory you want to compare against
 */
function isInInventory(itemArray, inventoryItemArray) {
	for (requestedItem of itemArray) {
		const itemInInventory = inventoryItemArray.find((inventoryItem) => inventoryItem.id === requestedItem.id);

		if (itemInInventory == undefined) {
			return false;
		}
	}

	return true;
}

function getItemsValue(itemArray) {
	let itemsValue = 0;

	for (item of itemArray) {
		itemsValue += item.suggested_price;
	}

	return itemsValue;
}

function itemArrayToIds(itemArray) {
	return itemArray.map(item => item.id);
}

module.exports.requestTrade = requestTrade;
