const twoFactor = require('node-2fa');
const config = require('../config.json');

function getTwoFactorCode() {
	const { token } = twoFactor.generateToken(config.twoFactorSecret);
	const { delta } = twoFactor.verifyToken(config.twoFactorSecret, token);

	if (delta === 0) {
		console.log('Generated two factor code', token);
		return token;
	}
}

module.exports.getTwoFactorCode = getTwoFactorCode;
