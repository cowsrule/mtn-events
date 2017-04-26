define(function (require)
{

var util = require('util');

var self = { };


function formatICSDate(date)
{
    var year = ("0000" + (date.getFullYear().toString())).slice(-4);
    var month = ("00" + ((date.getMonth() + 1).toString())).slice(-2);
    var day = ("00" + ((date.getDate()).toString())).slice(-2);
    var hours = ("00" + (date.getHours().toString())).slice(-2);
    var minutes = ("00" + (date.getMinutes().toString())).slice(-2);
    var seconds = ("00" + (date.getMinutes().toString())).slice(-2);

    var time = 'T' + hours + minutes + seconds;

    return year + month + day + time;
}

self.generateICS = function (ev)
{
    var ics = [ ];

    function add(key, value)
    {
        ics.push(key + ':' + value);
    }

    var startDate = new Date(ev.regdate);
    var endDate = new Date(startDate.getTime() + 15 * 60 * 1000);
    var createDate = new Date();

    var dtStart = formatICSDate(startDate);
    var dtEnd = formatICSDate(endDate);
    var dtStamp = formatICSDate(createDate);
    var url = ev.href;
    var organizer = 'Mountaineers Events <grant@gwatters.com>';
    var uid = util.generateUUID();
    var created = formatICSDate(createDate);
    var description = 'Mountaineers event signup for ' + ev.title;
    var summary = 'Signup opens ' + ev.title;

    var alarmDescription = 'Event Signup Reminder';

    add('BEGIN', 'VCALENDAR');
        add('VERSION', '2.0');
        add('PRODID', 'GW Mtn Events v1.0');
        add('BEGIN', 'VEVENT');
            add('DTSTART', dtStart);
            add('DTEND', dtEnd);
            add('DTSTAMP', dtStamp);
            add('URL', url);
            add('ORGANIZER', organizer);
            add('UID', uid);
            add('CREATED', created);
            add('DESCRIPTION', description);
            add('SUMMARY', summary);
            add('BEGIN', 'VALARM');
                add('TRIGGER', '-PT10M');
                add('REPEAT', '1');
                add('DURATION', 'PT10M');
                add('ACTION', 'DISPLAY');
                add('DESCRIPTION', alarmDescription);
            add('END', 'VALARM');
        add('END', 'VEVENT');
    add('END', 'VCALENDAR');

    return new Blob([ ics.join('\r\n') ], { type: 'text/calendar;charset=utf-8' });
};

self.generateGCalLink = function (ev)
{
    var title = 'Signup opens ' + ev.title;
    var startDate = new Date(ev.regdate);
    var endDate = new Date(startDate.getTime() + 15 * 60 * 1000);
    var description = 'Mountaineers event signup for ' + ev.title;

    var dtStart = startDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
    var dtEnd = endDate.toISOString().replace(/-|:|\.\d\d\d/g, "");

    return "http://www.google.com/calendar/event?action=TEMPLATE&text=" + encodeURIComponent(title) + "&dates=" + encodeURIComponent(dtStart) + "/" + encodeURIComponent(dtEnd) + "&details=" + encodeURIComponent(description) + "&trp=false";
};


return self;

});
