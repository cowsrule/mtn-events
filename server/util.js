var http = require('http');
var https = require('https');

exports.getRemoteData = function (options, onResult)
{
    var prot = options.port === 443 ? https : http;

    var req = prot.request(options, function(res)
    {
        var output = '';

        res.setEncoding('utf8');

        res.on('data', function (chunk)
        {
            output += chunk;
        });

        res.on('end', function()
        {
            onResult(res.statusCode, output, res);
        });
    });

    req.on('error', function(err)
    {
        onResult(404, err.message);
    });

    if (options.timeout)
    {
        req.on('socket', function (socket)
        {
            socket.setTimeout(options.timeout);
        });
    }

    if (options.data)
    {
        req.write(options.data);
    }

    req.end();
};

exports.log = function()
{
    console.log.apply(console, arguments);
};
