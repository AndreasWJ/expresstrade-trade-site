const express = require('express');
const exphbs = require('express-handlebars');
const handlebarHelpers = require('./helpers/handlebars');
const bodyParser = require('body-parser');
const inventoryService = require('./services/inventory-service');
const steam = require('steam-login');
const expressSession = require('express-session');
const config = require('./config.json');
const authenticationController = require('./controllers/authentication-controller');
const apiController = require('./controllers/api-controller');

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());

// Define the contents of the Bootstrap's dist folder as a static resource
// That way it's easily accessible in the views
app.use(express.static(__dirname + '/node_modules/bootstrap/dist'));
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist'));
app.use('/js', express.static(__dirname + '/node_modules/axios/dist'));
app.use('/css', express.static(__dirname + '/node_modules/animate.css'));
app.use(express.static('public'));

// Register Handlebars view engine.
// Add a default layout which will be present in
// all routes, where its '{{{ body }}}' represents the view template.
// Change the file extension from '.handlebars' to '.hbs' since that's more
// or less a standard
app.engine('.hbs', exphbs({ defaultLayout: 'main', extname: '.hbs', helpers: handlebarHelpers.helpers }));

// Use Handlebars view engine
app.set('view engine', '.hbs');

app.use(expressSession({ resave: false, saveUninitialized: false, secret: config.sessionSecret }));
app.use(steam.middleware({
	realm: 'http://localhost:5000/', 
	verify: 'http://localhost:5000/authentication/verify',
	apiKey: config.steamApiKey,
}));

// Initialize the router
const router = express.Router();
const authenticationRouter = express.Router();
const apiRouter = express.Router();

// Set up the Steam authentication routes with its controller
authenticationRouter.use('/', authenticationController.router);
router.use('/authentication', authenticationRouter);

// Set up the API routes with its controller
apiRouter.use('/', apiController.router);
router.use('/api', apiRouter);

// Site routes
router.get('/', async (req, res) => {
	let userInventoryItems;

	if (req.user) {
		userInventoryItems = await inventoryService.getUserInventory(req.user.steamid);
	} else {
		userInventoryItems = [];
	}

	const ownerInventoryItems = await inventoryService.getOwnerInventory();

	res.render('index', { userItems: userInventoryItems, ownerItems: ownerInventoryItems, user: req.user });
});

app.use(router);

app.listen(port, () => {
	console.log(`Example app is running → PORT ${port}`);
});
