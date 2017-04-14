var http = require('http');

var util = require('./util');
var mtns = require('./mountaineers');
var db = require('./db');

var Colors = require('colors');

var express = require('express');

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var compression = require('compression');
var errorHandler = require('errorhandler');

var schedule = require('node-schedule');

require('./config');

//
// Routes
//

var ListEvents = require('./list');

//
//
//

Colors.setTheme({
    info: 'grey',
    warning: 'yellow',
    error: 'red',
    data: 'green'
});


var args = process.argv.slice(2);

var isProduction = (process.env.NODE_ENV === 'production') || args.indexOf('-prod') >= 0;

util.loadServerConfig(isProduction ? 'production' : 'development');


function getServerTypeString()
{
    return isProduction ? 'production' : app.get('env');
}


var app = express();

function setup()
{
	app.disable('x-powered-by');

    var payloadMaxSize = isProduction ? '400kb' : '100mb';

    app.use(bodyParser.json({ limit: payloadMaxSize }));
    app.use(bodyParser.urlencoded({ limit: payloadMaxSize, extended: false }));

    app.use(cookieParser());

    app.use(compression());

    app.use(allowCrossDomain);

    if (!isProduction)
    {
    	app.use(errorHandler());
    }

    createRoutes();

    db.init(function (success)
    {
    	if (success)
    	{
	    	runServer();

	    	startEventsSync();
	    }
	    else
	    {
	    	util.log('Failed to start server -- db connection error');
	    }
    });
}

function setRoute(type, path, handler)
{
    app[type](path, handler);
}

function startEventsSync()
{
	var syncJob = schedule.scheduleJob('0 */2 * * *', function ()
	{
		util.log('Scheduled Event Sync Running');

  		mtns.runEventsSync();
	});

	if (args.indexOf('--forceSync') >= 0)
	{
		mtns.runEventsSync();
	}
}

function createRoutes()
{
	app.use('/js', express.static(__dirname + '/../client/js'));
	app.use('/css', express.static(__dirname + '/../client/css'));

	app.get('/', express.static(__dirname + '/../client', { index: 'index.html' }));

	setRoute('post', '/api/v1/list', ListEvents.route);
}

function runServer()
{
    http.createServer(app).listen(config.Runtime.port, function ()
    {
        util.log('[' + '%s'.data + '] HTTP Server running at ' + 'http://localhost:%d'.data, getServerTypeString(), config.Runtime.port);
    });
}

function allowCrossDomain(req, res, next)
{
    if (isProduction)
    {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Vary', 'Origin');
    }
    else
    {
        res.header('Access-Control-Allow-Origin', '*');
    }

    res.header('Access-Control-Allow-Methods', 'GET,POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type,token,id_token,gid');

    if (req.method === 'OPTIONS') return res.sendStatus(200);

    next();
}


setup();