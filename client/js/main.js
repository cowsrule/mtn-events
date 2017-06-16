if (typeof DEBUG === 'undefined') { DEBUG = true; }

requirejs([ 'util', 'cal', 'FileSaver' ], function (util, cal)
{
	var lastUpdate;
	var currentEvents;

	var doFilterSlots = false;
	var doFilterRegister = false;
	var doFilterClosed = true;
	var doFilterOutdated = true;

	var doFilterBranch = undefined;

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

	function not(fn)
	{
		return function ()
		{
			return !fn.apply(undefined, arguments);
		};
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

		if (doFilterClosed)
		{
			outData = filterEvents(outData, not(isRegistrationClosed));
		}

		if (doFilterOutdated)
		{
			outData = filterEvents(outData, isOutdated);
		}

		if (doFilterBranch)
		{
			outData = filterEvents(outData, belongsToBranch);
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

		if (Date.now() - foundDate.getTime() < 8.64e+7)
		{
			isRecent = true;
		}

		return isRecent;
	}

	function computeNewSymbol(entry)
	{
		var symbol;

		if (recentlyAdded(entry))
		{
			symbol = '<span title="Added on ' + formatDateString(new Date(entry.founddate)) + '">!</span>';
		}
		else
		{
			symbol = '';
		}

		return symbol
	}

	function belongsToBranch(entry)
	{
		var doesBelong = false;

		if (!entry.branch)
		{
			console.log('Branch: ', entry.href);
		}

		if (!entry.branch || entry.branch.indexOf(doFilterBranch) >= 0)
		{
			doesBelong = true;
		}

		return doesBelong;
	}

	function isOutdated(entry)
	{
		var isOutdated = false;

		if (entry.updatedate)
		{
			var updateDate = new Date(entry.updatedate);

			if (Date.now() - updateDate.getTime() < 8.64e+7)
			{
				isOutdated = true;
			}
		}


		return isOutdated;
	}

	function isRegistrationOpen(entry)
	{
		var isOpen = false;

		if (!entry.regdate)
		{
			isOpen = true;
		}
		else
		{
			var regDate = new Date(entry.regdate);

			if (regDate.getTime() < Date.now())
			{
				isOpen = true;
			}
		}

		return isOpen;
	}

	function isRegistrationClosed(entry)
	{
		var isClosed = false;

		if (entry.closedate)
		{
			var closeDate = new Date(entry.closedate);

			if (closeDate.getTime() < Date.now())
			{
				isClosed = true;
			}
		}

		return isClosed;
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

		if (isRegistrationClosed(entry))
		{
			color = '#ffb2ae';
		}

		return color;
	}

	var days = [ 'Sun', 'Mon', 'Tues', 'Weds', 'Thurs', 'Fri', 'Sat' ];
	var months = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];

	function formatDateString(date)
	{
		return days[date.getDay()] + ' ' + months[date.getMonth()] + ' ' + date.getDate();
	}

	function formatUTCDateString(date)
	{
		return days[date.getUTCDay()] + ' ' + months[date.getUTCMonth()] + ' ' + date.getUTCDate();
	}

	function formatTimeString(date)
	{
		return date.toTimeString().substr(0, 5);
	}

	function computeRegStr(entry)
	{
		var regStr;

		var regDate = new Date(entry.regdate);

		if (isRegistrationOpen(entry))
		{
			regStr = '-';
		}
		else
		{
			var displayText = (formatDateString(regDate) + ' ' + formatTimeString(regDate));

			regStr = '<a href="' + cal.generateGCalLink(entry) + '" target="_blank">' + displayText + '</a>';
			// regStr = '<a href="#" onclick="handleRegClick(\'' + entry.id + '\')">' + displayText + '</a>';
		}

		return regStr;
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

				var title = entry.title.split('-')[1].trim();

				var slots = entry.availslots < 0 ? Math.abs(entry.availslots) : '-';

				var titleLink = '<a href="' + entry.href + '" target="_blank">' + title + '</a>';
				var infoLink = '<a href="#" onclick="handleInfoClick(\'' + entry.id + '\')">More</a>';


				var endStr = (startDate.getTime() === endDate.getTime()) ? '-' : formatUTCDateString(endDate);

				var regStr = computeRegStr(entry);

				var newSymbol = computeNewSymbol(entry);

				if (!isRegistrationOpen(entry))
				{
					var sortDate = new Date(entry.regdate);

					entry.opensort = sortDate.getTime();
				}

				addField(row, newSymbol);
				addField(row, formatUTCDateString(startDate));
				addField(row, endStr);
				addField(row, titleLink);
				addField(row, computeType(entry));
				addField(row, regStr);
				addField(row, slots);
				// addField(row, infoLink);

				row.style.backgroundColor = computeBGColor(entry);

				tbody.appendChild(row);
			}
		}

		updateAggregateData(data);
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

		for (var i = 0; i < currentEvents.length; ++i)
		{
			var up = new Date(currentEvents[i].updatedate);

			if (up.getTime() > lastUpdate.getTime())
			{
				lastUpdate = up;
			}
		}

		var outDate = new Date(lastUpdate.getTime());

		lastUpdateEle.innerText = formatDateString(outDate) + ' ' + formatTimeString(outDate);
	}

	function updateAggregateData(data)
	{
		var destinations = { };

		var sel = document.getElementById('destinationDropdown');

		if (sel)
		{
			for (var i = 0; i < data.length; ++i)
			{
				var ev = data[i];

				if (isActivity(ev) && inFuture(ev))
				{
					var dest = ev.title.split('-')[1].trim();

					if (destinations.hasOwnProperty(dest))
					{
						destinations[dest]++;
					}
					else
					{
						destinations[dest] = 1;
					}
				}
			}

			sel.innerHTML = '';

			for (var dest in destinations)
			{
				var opt = document.createElement('option');

				opt.innerText = dest + ' (' + destinations[dest] + ')';

				sel.appendChild(opt);
			}
		}
	}

	function handleDestinationChange()
	{

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

	function filterNotOpen(e)
	{
		return !isRegistrationOpen(e);
	}

	function filterNew(e)
	{
		var foundDate = new Date(e.founddate);

		var currentSyncDate = util.storage.getItem('currentSyncDate');

		if (currentSyncDate)
		{
			currentSyncDate = new Date(currentSyncDate);
		}

		return (Date.now() - foundDate.getTime() < 8.64e+7);
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
		currentSortField = 'startdate';
		currentSortDir = 'asc';

		switch (btn)
		{
			case 'all':
				currentFilterFn = filterAll;
				break;
			case 'new':
				currentFilterFn = filterAll;
				currentSortField = 'founddate';
				currentSortDir = 'desc';
				break;
			case 'opens':
				currentFilterFn = filterNotOpen;
				currentSortField = 'opensort';
				currentSortDir = 'asc';
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

	window.handleRadio = function (chk)
	{
		switch (chk)
		{
			case 'All':
				doFilterBranch = undefined;
				break;
			case 'Seattle':
				doFilterBranch = 'Seattle';
				break;
			case 'Tacoma':
				doFilterBranch = 'Tacoma';
				break;
			case 'Everett':
				doFilterBranch = 'Everett';
				break;
			case 'Olympia':
				doFilterBranch = 'Olympia';
				break;
			case 'Kitsap':
				doFilterBranch = 'Kitsap';
				break;
			case 'Foothills':
				doFilterBranch = 'Foothills';
				break;
			default:
				doFilterBranch = undefined;

				alert('Unknown Branch: ', chk);
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
			case 'closed':
				doFilterClosed = !ele.checked;
				break;
			case 'outdated':
				doFilterOutdated = !ele.checked;
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

	window.handleRegClick = function (id)
	{
		var event = getEvent(id);

		var blob = cal.generateICS(event);

		saveAs(blob, event.title + '.ics', true);
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
