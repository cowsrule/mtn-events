var util = require('./util');

var email = require('./email');

exports.route = function (req, res, next)
{
    var addr = req.body.email;

    if (!addr) { return res.sendStatus(400); }

    email.unsubscribe(addr, function (success)
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
};
