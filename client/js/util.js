define(function (require)
{

var self = { };


var dummyStorage = { getItem: function () { }, setItem: function () { }, removeItem: function () { }, clear: function () { } };

try
{
    self.__storage = window.localStorage || dummyStorage;
}
catch (err)
{
    self.__storage = dummyStorage;
}

function dummyStorageGetFn() { }

self.storage =
{
    getItem: (self.__storage.getItem || function (key, cb)
    {
        return this.get(key, cb || dummyStorageGetFn);
    }).bind(self.__storage),

    setItem: (self.__storage.setItem || function (key, value)
    {
        var obj = { };

        obj[key] = value;

        this.set(obj);
    }).bind(self.__storage),

    removeItem: (self.__storage.removeItem || function (key, cb)
    {
        this.remove(key, cb);
    }).bind(self.__storage),

    clear: (self.__storage.clear || function (cb)
    {
        this.clear(cb);
    }).bind(self.__storage)
};

self.getURLHashParam = function (key)
{
    var queryString = window.location.hash.substring(1);

    var regex = /([^&=]+)=([^&]*)/g;
    var m;

    while (m = regex.exec(queryString))
    {
        if (decodeURIComponent(m[1]) === key)
        {
            return decodeURIComponent(m[2]);
        }
    }

    return undefined;
};

function generateQueryString(data)
{
    var queryString = '';

    if (typeof data == 'object')
    {
        var queryArr = [ ]

        for (key in data)
        {
            queryArr[queryArr.length] = encodeURIComponent(key) + '=' + encodeURIComponent(data[key]);
        }

        queryString = queryArr.join('&').replace(/%20/g, '+');
    }
    else
    {
        queryString = data;
    }

    return queryString;
};

var maxRetryCount = 5;
var retryTimeouts = [ 0, 5, 15, 35, 80, 170 ];
var retryErrorCodes = [ 408, 500, 502, 503, 504 ];

self.XHR = function (params)
{
    var url = params.url;
    var type = params.type;
    var cb = params.cb;
    var data = params.data;
    var headers = params.headers;
    var autoRetry = params.autoRetry;
    var maxRetries = params.maxRetries || 2;
    var currentRetries = 0;

    var username = params.username;
    var password = params.password;

    function retry()
    {
        if (currentRetries < maxRetries)
        {
            currentRetries++;

            setTimeout(sendXHR, retryTimeouts[currentRetries] * 1000);
        }
        else
        {
            log('XHR Failed to retry - reached max retry limit');
        }
    }

    function sendXHR()
    {
        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function ()
        {
            if (xhr.readyState !== 4)
            {
                return;
            }

            // If the XHR was a failure, setup request for retry if requested and valid
            if (xhr.status !== 200)
            {
                // If we have retries left, enable the retry field so callers can perform a retry
                if (currentRetries < maxRetries)
                {
                    xhr.retry = retry;

                    // Some callers may request auto-retry, in which case do not call the CB. Invalid requests
                    // do not get automatically retried as there is an issue with the payload.
                    if (autoRetry && retryErrorCodes.indexOf(xhr.status) >= 0)
                    {
                        xhr.retry();
                    }
                    else
                    {
                        // When not auto-retrying, the caller is responsible for performing the retry themselves
                        cb(xhr);
                    }
                }
                else
                {
                    // If we have exhausted the retry count, ensure that the CB is still called with a failure code
                    cb(xhr);
                }
            }
            else
            {
                // No need to retry on success
                cb(xhr);
            }
        };

        if (username && password)
        {
            xhr.open(type.toUpperCase(), url, /*async*/true, username, password);
        }
        else
        {
            xhr.open(type.toUpperCase(), url, /*async*/true);
        }


        if (headers)
        {
            for (var key in headers)
            {
                xhr.setRequestHeader(key, headers[key]);
            }
        }

        if (data)
        {
            xhr.setRequestHeader('Accept', '*/*');
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');

            var queryString = generateQueryString(data);
            xhr.send(queryString);
        }
        else
        {
            //xhr.setRequestHeader('Access-Control-Allow-Origin', '*');

            xhr.send();
        }
    }

    sendXHR();
};

self.generateUUID = function ()
{
    return 0;
};

return self;

});