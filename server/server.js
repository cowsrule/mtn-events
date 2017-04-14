var http = require('http');

var util = require('./util');
var mtns = require('./mountaineers');

var Colors = require('colors');

var express = require('express');

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var compression = require('compression');
var errorHandler = require('errorhandler');

Colors.setTheme({
    info: 'grey',
    warning: 'yellow',
    error: 'red',
    data: 'green'
});


var args = process.argv.slice(2);

var isProduction = (process.env.NODE_ENV === 'production') || args.indexOf('-prod') >= 0;

function getServerTypeString()
{
    return isProduction ? 'production' : app.get('env');
}


var port = process.env.PORT || 9006;

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

    runServer();

    startEventsSync();
}

function setRoute(type, path, handler)
{
    app[type](path, handler);
}

function startEventsSync()
{
	mtns.runEventsSync();
}

function createRoutes()
{
	
}

function runServer()
{
    http.createServer(app).listen(port, function ()
    {
        util.log('[' + '%s'.data + '] HTTP Server running at ' + 'http://localhost:%d'.data, getServerTypeString(), port);
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