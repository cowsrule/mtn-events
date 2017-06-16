var util = require('./util');

var url = require('url')

var pg = require('pg');


var pool;

exports.init = function (cb)
{
	var params = url.parse(config.Database.URL);

	var auth = params.auth.split(':');

	var connectionConfig =
	{
		user: auth[0],
		password: auth[1],
		host: params.hostname,
		port: params.port,
		database: params.pathname.split('/')[1],
		ssl: true
	};

	pool = new pg.Pool(connectionConfig);

	pool.query(
		'CREATE TABLE IF NOT EXISTS events (' +
		'id text PRIMARY KEY,' +
		'href text,' +
		'type text,' +
		'title text,' +
		'branch text,' +
		'description text,' +
		'lat text,' +
		'long text,' +
		'regDate timestamp,' +
		'closeDate timestamp,' +
		'updateDate timestamp,' +
		'foundDate timestamp,' +
		'startDate date,' +
		'endDate date,' +
		'category text,' +
		'diff text,' +
		'technical smallint,' +
		'strenuous smallint,' +
		'rating text,' +
		'miles text,' +
		'elevation text,' +
		'availSlots smallint,' +
		'leaderSlots smallint' +
		')'
	).then(function ()
	{
		util.log('DB Connected');

    	cb(true);
  	}).catch(function (err)
  	{
  		if (err) { util.log('Table Error: ', err); }

  		cb(false);
  	});
};

exports.query = function (text, values, cb)
{
	return pool.query(text, values, cb);
};

exports.connect = function (cb)
{
	return pool.connect(cb);
};

exports.insertEvent = function (basicInfo, extendedInfo, cb)
{
	var fields =
	[
		'id',
		'href',
		'type',
		'title',
		'branch',
		'description',
		'lat',
		'long',
		'regDate',
		'closeDate',
		'updateDate',
		'foundDate',
		'startDate',
		'endDate',
		'category',
		'diff',
		'technical',
		'strenuous',
		'rating',
		'miles',
		'elevation',
		'availSlots',
		'leaderSlots'
	];

	var values =
	[
		basicInfo.id,
		basicInfo.href,
		extendedInfo.type,
		basicInfo.title,
		extendedInfo.branch,
		basicInfo.description,
		basicInfo.lat,
		basicInfo.long,
		extendedInfo.regDate,
		extendedInfo.closeDate,
		new Date(),
		new Date(),
		extendedInfo.startDate,
		extendedInfo.endDate,
		extendedInfo.category,
		extendedInfo.diff,
		extendedInfo.technical,
		extendedInfo.strenuous,
		extendedInfo.rating,
		extendedInfo.miles,
		extendedInfo.elevation,
		extendedInfo.availSlots.avail,
		extendedInfo.leaderSlots.avail
	];

	var text = 'INSERT INTO events (' + fields.join(',') + ') values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)';

	return exports.query(text, values, cb)
};

exports.updateEvent = function (basicInfo, extendedInfo, cb)
{
	var fields =
	[
		'href',
		'type',
		'title',
		'branch',
		'description',
		'lat',
		'long',
		'regDate',
		'closeDate',
		'updateDate',
		'startDate',
		'endDate',
		'category',
		'diff',
		'technical',
		'strenuous',
		'rating',
		'miles',
		'elevation',
		'availSlots',
		'leaderSlots'
	];

	var values =
	[
		basicInfo.href,
		extendedInfo.type,
		basicInfo.title,
		extendedInfo.branch,
		basicInfo.description,
		basicInfo.lat,
		basicInfo.long,
		extendedInfo.regDate,
		extendedInfo.closeDate,
		new Date(),
		extendedInfo.startDate,
		extendedInfo.endDate,
		extendedInfo.category,
		extendedInfo.diff,
		extendedInfo.technical,
		extendedInfo.strenuous,
		extendedInfo.rating,
		extendedInfo.miles,
		extendedInfo.elevation,
		extendedInfo.availSlots.avail,
		extendedInfo.leaderSlots.avail,
		basicInfo.id,
	];

	var setStr = '';

	for (var i = 0; i < fields.length; ++i)
	{
		setStr += (fields[i] + '=($' + (i + 1) + ')');

		if (i !== fields.length - 1)
		{
			setStr += ', ';
		}
	}

	var text = 'UPDATE events SET ' + setStr + ' WHERE id=($' + values.length + ')';

	return exports.query(text, values, cb);
};

exports.getAllEvents = function (onRow, onDone, onError)
{
	var query = pool.query('SELECT * FROM events', function (err, res)
	{
		if (err) { return onError(err); }

		if (onRow)
		{
			for (var i = 0; i < res.rows.length; ++i)
			{
				onRow(res.rows[i]);
			}
		}

		return onDone(res);
	});

	return query;
};
