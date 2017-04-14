var util = require('./util');
var db = require('./db');

exports.route = function (req, res, next)
{
	db.getAllEvents(
		undefined,
		function (dbRes)
		{
			var outData =
			{
				events: dbRes.rows,
				metadata:
				{
					lastSyncDate: new Date()
				}
			}

			return res.status(200).send(outData);
		},
		function (dbErr)
		{
			return res.sendStatus(500);
		}
	);
};
