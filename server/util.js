var http = require('http');
var https = require('https');

exports.getRemoteData = function (options, onResult)
{
    var prot = options.port === 443 ? https : http;

    var req = prot.request(options, function (res)
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

    req.on('error', function (err)
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

var validConfigNames = [ 'development', 'production' ];

exports.loadServerConfig = function(configName)
{
    var configured = false;

    if (validConfigNames.indexOf(configName) >= 0)
    {
        for (var configGroup in config)
        {
            var group = config[configGroup];

            if (group[configName])
            {
                for (var configVar in group[configName])
                {
                    var configValue = group[configName][configVar];

                    if (group[configVar] !== undefined)
                    {
                        exports.log('Invalid config value: ', configGroup, configVar);

                        configured = false;
                    }
                    else
                    {
                        group[configVar] = configValue;
                    }
                }
            }
        }

        configured = true;

        exports.log('Server configured successfully');
    }
    else
    {
        exports.log('Invalid config name: ', configName);
    }

    return configured;
};

exports.log = function()
{
    console.log.apply(console, arguments);
};
