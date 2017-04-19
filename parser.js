var util = require('./util');

var months = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];
var days = [ 'Sun', 'Mon', 'Tues', 'Weds', 'Thurs', 'Fri', 'Sat' ];

var parseBoundaryDate = function (str)
{
	// Sat, May 6, 2017
	var regex = /([^\d]+),\s([^\d]+)\s(\d+),\s(\d+)/g;

	var match = regex.exec(str);

	if (match)
	{
		// util.log('Match: ', match);

		var month = months.indexOf(match[2]);
		var day = match[3];
		var year = match[4];

		var deltaMS = (new Date()).getTimezoneOffset() * 60 * 1000;

		var offsetDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));

		var outDate = new Date(offsetDate.getTime() + deltaMS);

		return outDate;
	}
	else
	{
		util.log('Unknown boundary date: ', str);
	}
}


exports.parseDate = function (str)
{
	var startDate;
	var endDate;

	var parts = str.split('—');

	if (parts.length === 2)
	{
		startDate = parseBoundaryDate(parts[0].trim());
		endDate = parseBoundaryDate(parts[1].trim());
	}
	else
	{
		startDate = endDate = parseBoundaryDate(str.trim());
	}

	return { start: startDate, end: endDate };
};

function parseRegDate(str)
{
	var regex = /([^\d]+)\s(\d+)\sat\s(\d+):(\d+)\s([^\d]+)/g;

	// util.log('----------------------------------------');
	// util.log('Registration Str: ', str);

	var match = regex.exec(str);

	if (match)
	{
		// util.log('Match: ', match);

		var currentDate = new Date();

		var month = months.indexOf(match[1]);
		var day = parseInt(match[2]);
		var mins = parseInt(match[4]);

		var hours = parseInt(match[3]);

		if (match[5] === 'PM')
		{
			hours += 12;
		}

		var deltaMS = currentDate.getTimezoneOffset() * 60 * 1000;

		var offsetDate = new Date(Date.UTC(currentDate.getUTCFullYear(), month, day, hours, mins, 0, 0));

		var outDate = new Date(offsetDate.getTime() + deltaMS);

		// util.log('Month: ', month, 'Day: ', day, 'Mins: ', mins, 'Hours: ', hours);

		// util.log('Registration Date: ', outDate);

		// util.log('----------------------------------------');

		return outDate;
	}
	else
	{
		util.log('Unknown registration date: ', str);
	}

	// util.log('----------------------------------------');
}

exports.parseRegistration = function (str)
{
	var openDate;
	var closeDate;

	if (str)
	{
		if (str.indexOf('Registration will') === 0)
		{
			str = str.replace('Registration will open on', '').trim();

			openDate = parseRegDate(str);
		}
		else if (str.indexOf('Registration closed') === 0)
		{
			str = str.replace('Registration closed on', '').trim();
			str = str.replace('. Contact leader to be added or removed from roster.', '').trim();

			closeDate = parseRegDate(str);
		}
	}

	return { isOpen: !str, open: openDate, close: closeDate };
};

exports.parseString = function (str)
{
	return str ? str.trim() : '';
};

exports.parseDifficulty = function (str)
{
	var diff = { };

	if (str)
	{
		var parts = str.split(',');

		for (var i = 0; i < parts.length; ++i)
		{
			var part = parts[i].trim();

			if (part.lastIndexOf('Strenuous', 0) === 0)
			{
				var parsedInfo = parseInt(part[part.length - 1]);

				if (!isNaN(parsedInfo))
				{
					diff.strenuous = parsedInfo;
				}
				else
				{
					// util.log('Found Strenuous NaN: ', str);
				}
			}
			else if (part.lastIndexOf('Technical', 0) === 0)
			{
				var parsedInfo = parseInt(part[part.length - 1]);

				if (!isNaN(parsedInfo))
				{
					diff.technical = parsedInfo;
				}
				else
				{
					util.log('Found Technical NaN: ', str);
				}
			}
			else
			{
				diff.type = part;
			}
		}
	}

	return diff;
};

exports.parseSlots = function (str)
{
	return str;
};

exports.parseAvail = function (nodes)
{
	var str = nodes ? visitNode({ type: 'Element', children: nodes }) : '';

	var regex = /(\d+|FULL)(?:(?:,\s+(\d)+\s+on\s+waitlist\s+)|\s+)\((\d+).*\)/g;

	var res = regex.exec(str);

	if (res)
	{
		var avail = res[1] === 'FULL' ? (res[2] ? -res[2] : 0) : res[1];
		var total = res[3];

		return { avail: parseInt(avail), total: parseInt(total) };
	}

	return { avail: 0, total: 0 };
};

function visitNode(node)
{
	if (node.type ==='Element')
	{
		var str = '';

		for (var i = 0; i < node.children.length; ++i)
		{
			str += visitNode(node.children[i]);
		}

		return str;
	}
	else if (node.type === 'Text')
	{
		return node.content;
	}
}