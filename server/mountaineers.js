var util = require('./util');

var fs = require('fs');

var himalaya = require('himalaya');


exports.runEventsSync = function ()
{
	var reqHeaders =
	{
		'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
	};

	util.getRemoteData({
		host: 'www.mountaineers.org',
        port: 443,
        path: '/explore/activities/@@faceted_query?view%5B%5D=map',
        method: 'GET',
        headers: reqHeaders
	}, function (authStatusCode, authDataString, fullResult)
	{
		if (authStatusCode === 200)
		{
			var syncResult = handleSyncData(authDataString);

			util.log('Sync Complete: ', syncResult);
		}
		else
		{
			util.log('Sync Failure: ', authStatusCode, authDataString);
		}
	});
};

function convertToJSON(html)
{
	html = html.replace(/<!--[\s\S]*?-->/g, '');
	html = html.replace(/>(\s*)</g, '><');

	return himalaya.parse(html);
}

function handleSyncData(html)
{
	var json = convertToJSON(html);

	fs.writeFileSync('./input.json', JSON.stringify(json, null, 4));

	var events = [ ];

	var body = json[1].children[0].children[0].children[0];

	for (var i = 0; i < body.children.length; ++i)
	{
		var container = body.children[i];

		var event = parseEvent(container);

		util.log(event.title);

		events.push(event);
	}

	return handleEvents(events);
}

function parseEvent(json)
{
	var event = { };

	var href = json.children[0].children[0].attributes.href;
	var rawTitle = json.children[0].children[0].children[0].content;

	var description;
	var descHolder = json.children[1].children[0].children[0];

	if (descHolder)
	{
		description = descHolder.content;
	}

	var lat = json.children[2].children[0].children[0].content;
	var long = json.children[2].children[1].children[0].content;

	event.href = href;
	event.type = rawTitle.split(' - ')[0];
	event.title = rawTitle.split(' - ')[1];
	event.description = description;
	event.lat = lat;
	event.long = long;

	return event;
}

function handleEvents(events)
{
	fs.writeFileSync('./output.json', JSON.stringify(events, null, 4));

	return { totalEvents: events.length, newEvents: events.length };
}