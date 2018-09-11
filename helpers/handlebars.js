/**
 * Register Handlebars helpers. Handlebars templates is intended to be "logic-less".
 * Therefore all necessary changes to data in the templates such as transforming a value
 * from cents to dollars need to be a helper which then can be used in templates.
 */
const register = function(Handlebars) {
    const helpers = {
		/**
		 * Scroll down to the "Helpers" section for information about non-block helpers.
		 */
		centsToDollars: function(value) {
			return parseInt(value) / 100;
		},
		stringifyJSON: function(value) {
			return JSON.stringify(value);
		}
	};

	if (Handlebars && typeof Handlebars.registerHelper === "function") {
		for (const prop in helpers) {
			Handlebars.registerHelper(prop, helpers[prop]);
		}
	} else {
		return helpers;
	}
};

module.exports.register = register;
module.exports.helpers = register(null);
