var util = require('./util');


exports.parseDate = function (str)
{
	var startDate;
	var endDate;

	var parts = str.split('—');

	if (parts.length === 2)
	{
		startDate = new Date(parts[0].trim());
		endDate = new Date(parts[1].trim());
	}
	else
	{
		startDate = endDate = new Date(str.trim());
	}

	return { start: startDate, end: endDate };
};

exports.parseRegistration = function (str)
{
	var openDate;
	var closeDate;

	if (str && str.replace)
	{
		str = str.replace('Registration will open on', '').trim();
	}

	return { open: openDate, close: closeDate };
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
				diff.strenuous = parseInt(part[part.length - 1]);
			}
			else if (part.lastIndexOf('Technical', 0) === 0)
			{
				diff.technical = parseInt(part[part.length - 1]);
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

	var regex = /(\d+|FULL)\s+\((\d+).*\)/g;

	var res = regex.exec(str);

	if (res)
	{
		var avail = res[1] === 'FULL' ? 0 : res[1];
		var total = res[2];

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