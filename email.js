var util = require('./util');

var mailgun;

var dailyListName;
var hourlyListName;

var dailyList;
var hourlyList;

var isEnabled = false;

exports.init = function ()
{
    if (config.Mailgun.key)
    {
        mailgun = require('mailgun-js')({ apiKey: config.Mailgun.key, domain: config.Mailgun.domain });

        dailyListName = 'mtndailyevents@' + config.Mailgun.domain;
        hourlyListName = 'mtnhourlyevents@' + config.Mailgun.domain;

        dailyList = mailgun.lists(dailyListName);
        hourlyList = mailgun.lists(hourlyListName);

        util.log('Admin Email: ', config.Runtime.adminEmail);

        isEnabled = true;
    }
    else
    {
        util.log('Email sending disabled');
    }
};

exports.subscribeDaily = function (email, name, cb)
{
    if (!isEnabled) { return cb(false); }

    var subInfo =
    {
        subscribed: true,
        address: email,
        name: name
    };

    dailyList.members().create(subInfo, function (err, data)
    {
        if (err) { util.log('Error Subscribing Daily: ', err); }

        util.log('Daily Sub: ', email);

        return cb(!err);
    });
};

exports.subscribeHourly = function (email, name, cb)
{
    if (!isEnabled) { return cb(false); }

    var subInfo =
    {
        subscribed: true,
        address: email,
        name: name
    };

    hourlyList.members().create(subInfo, function (err, data)
    {
        if (err) { util.log('Error Subscribing Hourly: ', err); }

        util.log('Hourly Sub: ', email);

        return cb(!err);
    });
};

exports.unsubscribe = function (email, cb)
{
    if (!isEnabled) { return cb(false); }

    hourlyList.members(email).delete(function (errHourly, data)
    {
        dailyList.members(email).delete(function (errDaily, data)
        {
            return cb(true);
        });
    });
};

exports.sendDaily = function (html, text, cb)
{
    if (!isEnabled) { return cb(false); }

    var data =
    {
        from: 'Grant Watters <grant@mail.gwatters.com>',
        to: dailyListName,
        subject: 'Daily Events Summary',
        html: html,
        text: text
    };

    util.log('Send Daily: ', data);

    mailgun.messages().send(data, function (err, body)
    {
        if (err) { util.log('Daily Send Error: ', dailyListName, err); }

        util.log('Daily email sent: ', body);

        return cb(!err);
    });
};

exports.sendHourly = function (html, text, cb)
{
    if (!isEnabled) { return cb(false); }

    var data =
    {
        from: 'Grant Watters <grant@mail.gwatters.com>',
        to: hourlyListName,
        subject: 'Hourly Events Summary',
        html: html,
        text: text
    };

    util.log('Send Hourly: ', data);

    mailgun.messages().send(data, function (err, body)
    {
        if (err) { util.log('Hourly Send Error: ', hourlyListName, err); }

        util.log('Hourly email sent: ', body);

        return cb(!err);
    });
};

exports.sendFailureNotification = function (html, cb)
{
    if (!isEnabled) { return cb(false); }

    var data =
    {
        from: 'Grant Watters <grant@mail.gwatters.com>',
        to: config.Runtime.adminEmail,
        subject: 'Failure Notification',
        html: html
    };

    util.log('Send Failure: ', data);

    mailgun.messages().send(data, function (err, body)
    {
        if (err) { util.log('Failure Send Error: ', config.Runtime.adminEmail, err); }

        util.log('Failure Notification Sent: ', body);

        return cb(!err);
    });
};
