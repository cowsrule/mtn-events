if (typeof DEBUG === 'undefined') { DEBUG = true; }

requirejs([ 'util' ], function (util)
{
	var lastUpdate;
	var currentEvents;

	var doFilterSlots = false;
	var doFilterRegister = false;

	var currentSortField = 'startdate';
	var currentSortDir = 'asc';
	var currentFilterFn = filterAll;

	function sortEvents(events, field, dir)
	{
		events.sort(function (left, right)
		{
			if (dir === 'asc')
			{
				if (left[field] === right[field])
				{
					return 0;
				}
				else if (left[field] > right[field])
				{
					return 1;
				}
				else
				{
					return -1;
				}
			}
			else if (dir === 'desc')
			{
				if (left[field] === right[field])
				{
					return 0;
				}
				else if (left[field] > right[field])
				{
					return -1;
				}
				else
				{
					return 1;
				}
			}
		});

		return events;
	}

	function filterEvents(events, fn)
	{
		return events.filter(fn);
	}

	function filterChecks(data)
	{
		var outData = data;

		if (doFilterSlots)
		{
			outData = filterEvents(outData, hasSlotsAvailable);
		}

		if (doFilterRegister)
		{
			outData = filterEvents(outData, isRegistrationOpen);
		}

		return outData;
	}

	function computeType(entry)
	{
		var type = entry.type;

		if (entry.type.indexOf('Climbing') >= 0)
		{
			var climbType = entry.title.split('-')[0].trim();

			type += ' [' + climbType.replace('Climbing', '').replace('Climb', '').trim() + ']';
		}

		return type;
	}

	function isActivity(entry)
	{
		return entry.id.indexOf('/explore/') === 0;
	}

	function inFuture(entry)
	{
		var currentDate = new Date();

		currentDate.setHours(0);
		currentDate.setMinutes(0);
		currentDate.setSeconds(0);
		currentDate.setMilliseconds(0);

		return currentDate.getTime() < (new Date(entry.startdate)).getTime();
	}

	function recentlyAdded(entry)
	{
		var isRecent = false;

		var foundDate = new Date(entry.founddate);

		var currentSyncDate = util.storage.getItem('currentSyncDate');

		if (currentSyncDate)
		{
			currentSyncDate = new Date(currentSyncDate);
		}

		if (foundDate.getTime() - Date.now() < 8.64e+7 || (currentSyncDate && currentSyncDate.getTime() > foundDate.getTime()))
		{
			isRecent = true;
		}

		return isRecent;
	}

	function computeNewSymbol(entry)
	{
		return recentlyAdded(entry) ? '!' : '';
	}

	function isRegistrationOpen(entry)
	{
		var isOpen = false;

		if (!entry.regdate)
		{
			isOpen = true;
		}

		return isOpen;
	}

	function hasSlotsAvailable(entry)
	{
		return entry.availslots > 0;
	}

	function computeBGColor(entry)
	{
		var color = 'white';

		if (hasSlotsAvailable(entry))
		{
			if (isRegistrationOpen(entry))
			{
				color = '#EAFEEA';
			}
			else
			{
				color = '#FFFFE0';
			}
		}

		return color;
	}

	function formatDateString(date)
	{
		var days = [ 'Sun', 'Mon', 'Tues', 'Weds', 'Thurs', 'Fri', 'Sat' ];
		var months = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];

		return days[date.getDay()] + ' ' + months[date.getMonth()] + ' ' + date.getDate();
	}

	function formatTimeString(date)
	{
		return date.toTimeString().substr(0, 5);
	}

	function constructTable(data)
	{
		var table = document.getElementById('displayTable');

		var thead = table.children[0];
		var tbody = table.children[1];

		tbody.innerHTML = '';

		for (var i = 0; i < data.length; ++i)
		{
			var entry = data[i];

			if (isActivity(entry) && inFuture(entry))
			{
				var row = document.createElement('tr');

				var startDate = new Date(entry.startdate);
				var endDate = new Date(entry.enddate);
				var regDate = new Date(entry.regdate);
				var title = entry.title.split('-')[1].trim();

				var titleLink = '<a href="' + entry.href + '" target="_blank">' + title + '</a>';
				var infoLink = '<a href="#" onclick="handleInfoClick(\'' + entry.id + '\')">More</a>';


				var endStr = (startDate.getTime() === endDate.getTime()) ? '-' : formatDateString(endDate);

				var regStr = isRegistrationOpen(entry) ? '-' : (formatDateString(regDate) + ' ' + formatTimeString(regDate));

				var newSymbol = computeNewSymbol(entry);

				addField(row, newSymbol);
				addField(row, formatDateString(startDate));
				addField(row, endStr);
				addField(row, titleLink);
				addField(row, computeType(entry));
				addField(row, regStr);
				// addField(row, infoLink);

				row.style.backgroundColor = computeBGColor(entry);

				tbody.appendChild(row);
			}
		}
	}

	function getEvent(id)
	{
		for (var i = 0; i < currentEvents.length; ++i)
		{
			if (currentEvents[i].id === id)
			{
				return currentEvents[i];
			}
		}
	}

	function updateTable()
	{
		constructTable(filterChecks(filterEvents(sortEvents(currentEvents.slice(0), currentSortField, currentSortDir), currentFilterFn)));

		updateHash();
	}

	function updateHash()
	{
		window.location.hash = 'slots=' + doFilterSlots + '&register=' + doFilterRegister;
	}

	function updateLastSync()
	{
		var syncDateEle = document.getElementById('syncDate');

		var rawDate = util.storage.getItem('lastSyncDate');
		var displayString;

		if (rawDate)
		{
			displayString = formatDateString(new Date(rawDate));
		}
		else
		{
			displayString = 'NEVER';
		}

		syncDateEle.innerText = displayString;
	}

	function updateLastUpdate()
	{
		var lastUpdateEle = document.getElementById('lastUpdate');

		var lastUpdate = new Date(0);
		var deltaMS = lastUpdate.getTimezoneOffset() * 60 * 1000;

		for (var i = 0; i < currentEvents.length; ++i)
		{
			var up = new Date(currentEvents[i].updatedate);

			if (up.getTime() > lastUpdate.getTime())
			{
				lastUpdate = up;
			}
		}

		var outDate = new Date(lastUpdate.getTime() - deltaMS);

		lastUpdateEle.innerText = formatDateString(outDate) + ' ' + formatTimeString(outDate);
	}

	function handleEventData(data)
	{
		currentEvents = data;

		updateTable();

		// updateLastSync();

		updateLastUpdate();
	}

	function addField(row, value)
	{
		var ele = document.createElement('td');

		ele.innerHTML = value;

		row.appendChild(ele);
	}

	function filterAll(e)
	{
		return true;
	}

	function filterNew(e)
	{
		var foundDate = new Date(e.founddate);

		var currentSyncDate = util.storage.getItem('currentSyncDate');

		if (currentSyncDate)
		{
			currentSyncDate = new Date(currentSyncDate);
		}

		return !currentSyncDate || (currentSyncDate.getTime() > foundDate.getTime()) || (currentSyncDate.getTime() - Date.now() < 8.64e+7);
	}

	function filterAvail(e)
	{
		return e.availslots > 0;
	}

	function filterHiking(e)
	{
		return e.type.indexOf('Hiking') >= 0;
	}

	function filterScramble(e)
	{
		return e.type.indexOf('Scrambling') >= 0;
	}

	function filterClimbing(e)
	{
		return e.type.indexOf('Climbing') >= 0;
	}

	function filterBasic(e)
	{
		return e.type.indexOf('Climbing') >= 0 && (e.title.indexOf('Basic') === 0 || e.title.indexOf('Glacier') === 0);
	}


	window.handleFilterButton = function (btn, ele)
	{
		switch (btn)
		{
			case 'all':
				currentFilterFn = filterAll;
				break;
			case 'new':
				currentFilterFn = filterNew;
				break;
			case 'avail':
				currentFilterFn = filterAvail;
				break;
			case 'hiking':
				currentFilterFn = filterHiking;
				break;
			case 'scramble':
				currentFilterFn = filterScramble;
				break;
			case 'climbing':
				currentFilterFn = filterClimbing;
				break;
			case 'basic':
				currentFilterFn = filterBasic;
				break;
			default:
				alert('Unknwon Button: ' + btn);
				break;
		}

		updateTable();
	};

	window.handleCheck = function (chk, ele)
	{
		switch (chk)
		{
			case 'slots':
				doFilterSlots = ele.checked;
				break;
			case 'register':
				doFilterRegister = ele.checked;
				break;
			default:
				alert('Unknown Checkbox: ', chk);
				break;
		}

		updateTable();
	};

	window.handleInfoClick = function (id)
	{
		var event = getEvent(id);

		alert(JSON.stringify(event, null, 4));
	};

	window.handleSubButton = function (id)
	{
		var emailEle = document.getElementById('emailaddr');

		var email = emailEle.value;

		util.XHR({
			type: 'POST',
			url: '//' + window.location.host + '/api/v1/sub',
			data: { email: email, list: id },
			cb: function (xhr)
			{
				if (xhr.status === 200)
				{
					util.storage.setItem('subscribed', email);

					updateSubArea();
				}
				else
				{
					// Display Error
				}
			}
		});
	};

	window.handleUnsubButton = function ()
	{
		var emailEle = document.getElementById('emailaddr');

		var email = emailEle.value;

		util.XHR({
			type: 'POST',
			url: '//' + window.location.host + '/api/v1/unsub',
			data: { email: email },
			cb: function (xhr)
			{
				if (xhr.status === 200)
				{
					util.storage.removeItem('subscribed');

					updateSubArea();
				}
				else
				{
					// Display Error
				}
			}
		});
	};

	function updateSubArea()
	{
		var subscribed = util.storage.getItem('subscribed');

		if (subscribed)
		{
			document.getElementById('emailaddr').value = subscribed;

			document.getElementById('subDaily').style.display = 'none';
			document.getElementById('subHourly').style.display = 'none';
		}
	}

	function runPage()
	{
		var lastSyncDate = util.storage.getItem('lastSyncDate');
		util.storage.setItem('currentSyncDate', lastSyncDate);

		doFilterSlots = util.getURLHashParam('slots') === 'true';
		doFilterRegister = util.getURLHashParam('register') === 'true';

		document.getElementById('slots').checked = doFilterSlots;
		document.getElementById('register').checked = doFilterRegister;

		updateSubArea();

		util.XHR({
			type: 'POST',
			url: '//' + window.location.host + '/api/v1/list',
			data: { lastSyncDate: lastSyncDate },
			cb: function (xhr)
			{
				if (xhr.status === 200)
				{
					var data = JSON.parse(xhr.responseText);

					handleEventData(data.events);

					util.storage.setItem('lastSyncDate', data.metadata.lastSyncDate);
				}
				else
				{
					// Display Error
				}
			}
		});
	}


	runPage();
});
