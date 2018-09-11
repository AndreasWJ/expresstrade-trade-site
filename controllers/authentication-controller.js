const { Router } = require('express');
const steam = require('steam-login');

// This router is prepended with '/authentication'
const authenticationRouter = Router();

// Set up the Steam authentication routes
// Go to the '/authentication' route to start the Steam authentication process
authenticationRouter.get('/', steam.authenticate(), function(req, res) {
	res.redirect('/');
});

// You are automatically redirected to the '/authentication/verify' route upon successful
// authentication. And this point the session cookie has been set with the user's data
authenticationRouter.get('/verify', steam.verify(), function(req, res) {
	res.redirect('/');
});

// Go to the '/authentication/logout' route to clear your session cookie with user data
authenticationRouter.get('/logout', steam.enforceLogin('/'), function(req, res) {
	req.logout();
	res.redirect('/');
});

module.exports.router = authenticationRouter;
