var util = require('./util');
var db = require('./db');
var parser = require('./parser');

var fs = require('fs');

var DOMParser = require('xmldom').DOMParser;
var XMLSerializer = require('xmldom').XMLSerializer;

var himalaya = require('himalaya');

var RateLimiter = require('limiter').RateLimiter;
var limiter = new RateLimiter(100, 30 * 1000);


var isRunningSync = false;

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
			var syncStartTime = Date.now();

			isRunningSync = true;

			handleSyncData(authDataString, function (syncResult)
			{
				var syncEndTime = Date.now();

				var delta = syncEndTime - syncStartTime;

				var mins = Math.floor(delta / (60 * 1000));
				var seconds = Math.floor((delta % (60 * 1000) / 1000));

				util.log('Sync Complete: ' + mins + ' mins ' + seconds + ' secs');

				isRunningSync = false;
			});
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

function handleSyncData(html, cb)
{
	var json = convertToJSON(html);

	// fs.writeFileSync('./input.json', JSON.stringify(json, null, 4));

	var events = [ ];

	var body = json[1].children[0].children[0].children[0];

	for (var i = 0; i < body.children.length; ++i)
	{
		var container = body.children[i];

		var event = parseEvent(container);

		// util.log(event.title);

		events.push(event);
	}

	handleEvents(events, cb);
}

function createIDFromHref(href)
{
	return href.replace('https://www.mountaineers.org', '');
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

	event.id = createIDFromHref(href);
	event.href = href;
	event.title = rawTitle;
	event.description = description;
	event.lat = lat;
	event.long = long;

	return event;
}

function parseExtendedInfo(html)
{
	var info;

	var doc = new DOMParser().parseFromString(html);

	var infoRoot = doc.getElementById('content-core');

	if (infoRoot)
	{
		var s = new XMLSerializer();

		var json = convertToJSON(s.serializeToString(infoRoot));

		var sidebar = json[0].children[0];
		var core = json[0].children[1];

		var reg = sidebar.children[1].children[1].children[1];

		var info = core.children[0];
		var stats = core.children[1];
		var avail = core.children[2];

		// Info
		var dateStr = info.children[0].children[0].content;
		var type;
		var category;

		for (var i = 1; i < info.children.length; ++i)
		{
			var field = info.children[i];

			var fieldName = field.children[0].children[0].content;

			if (fieldName === 'Activity Type:')
			{
				type = field.children[1].content;
			}
			else if (fieldName === 'Category:')
			{
				category = field.children[1].content;
			}
			else if (fieldName === 'Committee:')
			{

			}
			else if (fieldName === 'Audience:')
			{

			}
			else if (fieldName === 'Climbing Category:')
			{

			}
			else if (fieldName === 'Snowshoeing Category:')
			{

			}
			else if (fieldName === 'Skiing/Snowboarding Category:')
			{

			}
			else
			{
				util.log('Unknown Info Field: ', fieldName, field);
			}
		}

		// Stats
		var difficulty;
		var rating;
		var elevation;
		var miles;
		
		for (var i = 0; i < stats.children.length; ++i)
		{
			var field = stats.children[i];

			var fieldName = field.children[0].children[0].content;

			if (fieldName === 'Leader Rating:')
			{
				rating = field.children[1].content;
			}
			else if (fieldName === 'Mileage:')
			{
				miles = field.children[1].children[0].content
			}
			else if (fieldName === 'Difficulty:')
			{
				difficulty = field.children[1].content;
			}
			else if (fieldName === 'Elevation Gain:')
			{
				elevation = field.children[1].children[0].content;
			}
			else
			{
				util.log('Unknown Stats Field: ', fieldName, field);
			}
		}

		// Avail
		var availNodes;
		var leaderAvailNodes;

		for (var i = 0; i < avail.children.length; ++i)
		{
			var field = avail.children[i];

			var fieldName = field.children[0].children[0].content;

			if (fieldName === 'Availability:')
			{
				availNodes = field.children.slice(1);
			}
			else if (fieldName === 'Assistant Leader Availability:')
			{
				leaderAvailNodes = field.children.slice(1);
			}
			else if (fieldName === 'Members:')
			{

			}
			else if (fieldName === 'Guests:')
			{

			}
			else if (fieldName === undefined)
			{

			}
			else
			{
				util.log('Unknown Avail Field: ', fieldName, field);
			}
		}

		var regString = reg.children[0];// .children[0].children[0].content;

		// util.log('Reg: ', regString);


		// More
		var meetingPlace = '';
		var notes = '';


		// Parse raw data
		var dateInfo = parser.parseDate(dateStr);
		var regInfo = parser.parseRegistration(regString);

		info =
		{
			startDate: dateInfo.start,
			endDate: dateInfo.end,
			regDate: regInfo.open,
			closeDate: regInfo.close,
			type: parser.parseString(type),
			category: parser.parseString(category),
			difficulty: parser.parseDifficulty(difficulty),
			rating: parser.parseString(rating),
			miles: miles,
			elevation: elevation,
			availSlots: parser.parseAvail(availNodes),
			leaderSlots: parser.parseAvail(leaderAvailNodes)
		};

		// fs.writeFileSync('./event.json', JSON.stringify(json, null, 4));
	}

	return info;
}

function fetchEventExtendedInfo(basicInfo, cb)
{
	limiter.removeTokens(1, function()
	{
		var reqHeaders =
		{
			'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
		};

		var path = basicInfo.href.replace('https://www.mountaineers.org', '');

		util.getRemoteData({
			host: 'www.mountaineers.org',
	        port: 443,
	        path: path,
	        method: 'GET',
	        headers: reqHeaders
		}, function (eventStatusCode, eventDataString, fullResult)
		{
			if (eventStatusCode === 200)
			{
				return cb(basicInfo, parseExtendedInfo(eventDataString));
			}
			else
			{
				util.log('Error fetching extended info: ', eventStatusCode, eventDataString);

				return cb(basicInfo, undefined);
			}
		});
	});
}

function mergeIntoDB(inEvents, dbEvents, cb)
{
	var newEvents = [ ];

	for (var i = 0; i < inEvents.length; ++i)
	{
		var event = inEvents[i];

		var dbEvent = dbEvents[event.id];

		if (dbEvent)
		{
			// util.log('DB Event: ', dbEvent);
		}
		else
		{
			newEvents.push(event);
		}
	}

	util.log('Starting Sync: ', { totalEvents: inEvents.length, newEvents: newEvents.length });

	function isNewEvent(e)
	{
		for (var i = 0; i < newEvents.length; ++i)
		{
			if (newEvents[i].id === e.id)
			{
				return true;
			}
		}

		return false;
	}

	function didEventChange(basicInfo, extendedInfo)
	{
		var didChange = false;

		function markChanged(field)
		{
			util.log('Field Changed: ', field, extendedInfo[field]);

			didChange = true;
		}

		for (var i = 0; i < dbEvents.length; ++i)
		{
			var dbEvent = dbEvents[i];

			if (dbEvent.id === basicInfo.id)
			{
				for (var field in extendedInfo)
				{
					var value = extendedInfo[field];

					switch (field)
					{
						case 'availSlots':
						case 'leaderSlots':
							if (value.avail !== dbEvent[field]) { markChanged(field); }
							break;
						case 'type':
						case 'regDate':
						case 'closeDate':
						case 'category':
						case 'difficulty':
						case 'rating':
						case 'miles':
						case 'elevation':
						case 'endDate':
						case 'startDate':
							if (value !== dbEvent[field]) { markChanged(field); }
							break;
						default:
							break;
					}
				}

				break;
			}
		}

		return didChange;
	}

	var expectedEvents = inEvents.length;
	var handledEvents = 0;
	var doneIterating = false;

	function checkIsComplete()
	{
		if (doneIterating && handledEvents === expectedEvents)
		{
			return cb();
		}
	}

	for (var i = 0; i < inEvents.length; ++i)
	{
		var syncEvent = inEvents[i];

		fetchEventExtendedInfo(syncEvent, function (basicInfo, extendedInfo)
		{
			if (basicInfo && extendedInfo)
			{
				if (isNewEvent(basicInfo))
				{
					db.insertEvent(basicInfo, extendedInfo, function (insertResult)
					{
						if (insertResult)
						{
							util.log('Insert Error Result: ', insertResult);
						}

						handledEvents++;

						util.log(handledEvents + ' / ' + expectedEvents + ' - New');

						checkIsComplete();
					});
				}
				else if (didEventChange(basicInfo, extendedInfo))
				{
					db.updateEvent(basicInfo, extendedInfo, function (updateResult)
					{
						if (updateResult)
						{
							util.log('Update Error Result: ', updateResult);
						}

						handledEvents++;

						util.log(handledEvents + ' / ' + expectedEvents + ' - Updated');

						checkIsComplete();
					});
				}
				else
				{
					handledEvents++;

					util.log(handledEvents + ' / ' + expectedEvents + ' - Unchanged');

					checkIsComplete();
				}
			}
			else
			{
				handledEvents++;

				util.log(handledEvents + ' / ' + expectedEvents + ' - Failure');

				checkIsComplete();
			}
		});
	}

	doneIterating = true;

	checkIsComplete();


	// fs.writeFileSync('./output.json', JSON.stringify(inEvents, null, 4));
}

function handleEvents(events, cb)
{
	var dbEvents = { };

	db.getAllEvents(
		function (dbEvent)
		{
			dbEvents[dbEvent.id] = dbEvent;
		},
		function (result)
		{
			// util.log('Stored events: ' + result.rowCount);

			return mergeIntoDB(events, dbEvents, cb);
		},
		function (err)
		{
			util.log('Event Query Error: ', err);
		}
	);
}
