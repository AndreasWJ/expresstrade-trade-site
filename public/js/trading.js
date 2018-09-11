/**
 * Script which is only intended to be running on the trading page.
 */
$(document).ready(() => {
	// Dictionaries to store the selected items. Keys are the item indices, and values are the item objects
	const itemsToExchange = {};
	const itemsToReceive = {};

	/**
	 * Attempts to send a POST request to the API endpoint '/api/request-trade'.
	 * @param {Item[]} itemsToExchange
	 * @param {Item[]} itemsToReceive
	 */
	async function postTradeRequest(itemsToExchange, itemsToReceive) {
		if (!isTradeValid()) {
			alert('Invalid trade. The value of your choosen items need to equal or be greater than the items you are to receive');
			return;
		}

		// The item indices are only relevant on the frontend to keep track of items, but irrelevant on the server
		// Therefore convert the dictionaries to arrays
		const exchangeArray = dictionaryToArray(itemsToExchange);
		const receiveArray = dictionaryToArray(itemsToReceive);

		const postData = {
			itemsToExchange: exchangeArray,
			itemsToReceive: receiveArray,
		};

		const response = await axios.post('http://localhost:5000/api/request-trade', postData, {
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (200 < response.status < 300) {
			alert('Trade offer sent! Check your trade offers and accept it');
		} else {
			alert('Something went wrong', response.data);
		}
	}

	/**
	 * Ensures that the items the user selected of their inventory is equal to
	 * or greater than the items the user selected from the owner's inventory.
	 * This function only exists to prevent accidental trade requests going out
	 * to the server. The trade validity is checked properly on the serverside.
	 */
	function isTradeValid() {
		const userItemValue = getItemsPrice(itemsToExchange);
		const ownerItemValue = getItemsPrice(itemsToReceive);

		const priceDifference = userItemValue - ownerItemValue;

		return priceDifference >= 0 ? true : false;
	}

	function dictionaryToArray(dictionary) {
		const resultArray = [];

		for(key in dictionary) {
			resultArray.push(dictionary[key]);
		}

		return resultArray;
	}

	function toggleItem(itemIndex, selectedItem, itemDictionary) {
		// const arrayIndex = itemArray.indexOf(itemIndex);
		const hasIndex = itemDictionary.hasOwnProperty(itemIndex);

		if (hasIndex === false) {
			// Add the item index to the array
			itemDictionary[itemIndex] = selectedItem;
		} else {
			// Remove the item index from the array
			delete itemDictionary[itemIndex];
		}

		updateTradeData();
	}

	function centsToDollars(price) {
		return price / 100;
	}

	function getItemsPrice(itemDictionary) {
		let totalPrice = 0;

		for(index in itemDictionary) {
			console.log(index, itemDictionary);
			console.log(JSON.stringify(itemDictionary[index]));
			totalPrice += parseInt(itemDictionary[index].suggested_price);
		}

		return centsToDollars(totalPrice);
	}

	function updateTradeData() {
		const userItemValue = getItemsPrice(itemsToExchange);
		const ownerItemValue = getItemsPrice(itemsToReceive);

		$('#user-item-value').text(`${userItemValue}$`);
		$('#owner-item-value').text(`${ownerItemValue}$`);

		// The priceDifference will be used to indicate how much the user is underpaying or overpaying so
		// they can get a better trade. Set the number of decimals to 2
		const priceDifference = (userItemValue - ownerItemValue).toFixed(2);
		let priceDifferenceString;

		if (priceDifference > 0) {
			priceDifferenceString = `+${priceDifference}`;
		} else {
			priceDifferenceString = priceDifference.toString();
		}

		$('#trade-value').text(`${priceDifferenceString}$`);
	}

	function isItemActive(itemIndex, itemDictionary) {
		return itemDictionary.hasOwnProperty(itemIndex);
	}

	function setItemStyling(isActive, element) {
		if (isActive) {
			element.addClass('active-item');
			element.find('img').addClass('animated infinite pulse');
		} else {
			element.removeClass('active-item');
			element.find('img').removeClass('animated infinite pulse');
		}
	}

	$('#trade-button').click(() => {
		console.log('Requesting trade');
		postTradeRequest(itemsToExchange, itemsToReceive);
	});

	$('.player-item').click(function() {
		selectedItemIndex = $(this).attr('index');
		selectedItem = $(this).data('item');
		toggleItem(selectedItemIndex, selectedItem, itemsToExchange);
		isItemActive(selectedItemIndex, itemsToExchange) ? setItemStyling(true, $(this)) : setItemStyling(false, $(this));
	});

	$('.owner-item').click(function() {
		selectedItemIndex = $(this).attr('index');
		selectedItem = $(this).data('item');
		toggleItem(selectedItemIndex, selectedItem, itemsToReceive);
		isItemActive(selectedItemIndex, itemsToReceive) ? setItemStyling(true, $(this)) : setItemStyling(false, $(this));
	});
});
