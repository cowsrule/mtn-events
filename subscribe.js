var util = require('./util');

var email = require('./email');

exports.route = function (req, res, next)
{
    var addr = req.body.email;
    var list = req.body.list;

    if (!addr || !list) { return res.sendStatus(400); }
    if (list !== 'hourly' && list !== 'daily') { return res.sendStatus(400); }

    if (list === 'hourly')
    {
        email.subscribeHourly(addr, undefined, function (success)
        {
            if (success)
            {
                return res.sendStatus(200);
            }
            else
            {
                return res.sendStatus(400);
            }
        });
    }
    else if (list === 'daily')
    {
        email.subscribeDaily(addr, undefined, function (success)
        {
            util.log('Success: ', success);

            if (success)
            {
                return res.sendStatus(200);
            }
            else
            {
                return res.sendStatus(400);
            }
        });
    }
};
