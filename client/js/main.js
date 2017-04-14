if (typeof DEBUG === 'undefined') { DEBUG = true; }

requirejs([ 'util' ], function (util)
{
	var currentEvents;

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

	function isRegistrationOpen(entry)
	{
		return true;
	}

	function computeBGColor(entry)
	{
		var color = 'white';

		if (entry.availslots > 0)
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

	function constructTable(data)
	{
		var table = document.getElementById('displayTable');

		var thead = table.children[0];
		var tbody = table.children[1];

		tbody.innerHTML = '';

		for (var i = 0; i < data.length; ++i)
		{
			var entry = data[i];

			if (isActivity(entry))
			{
				var row = document.createElement('tr');

				var startDate = new Date(entry.startdate);
				var endDate = new Date(entry.enddate);
				var title = entry.title.split('-')[1].trim();

				var titleLink = '<a href="' + entry.href + '" target="_blank">' + title + '</a>';
				// var infoLink = '<a href="#" onclick="handleInfoClick(\'' + entry.id + '\')">More</a>';


				var endStr = (startDate.getTime() === endDate.getTime()) ? '-' : endDate.toDateString().replace(' 2017', '');

				var newSymbol = recentlyAdded(entry) ? '!' : '';

				addField(row, newSymbol);
				addField(row, startDate.toDateString().replace(' 2017', ''));
				addField(row, endStr);
				addField(row, titleLink);
				addField(row, computeType(entry));
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
		constructTable(filterEvents(sortEvents(currentEvents.slice(0), currentSortField, currentSortDir), currentFilterFn));
	}

	function handleEventData(data)
	{
		currentEvents = data;

		updateTable();

		var syncDateEle = document.getElementById('syncDate');

		syncDateEle.innerText = (new Date(util.storage.getItem('lastSyncDate'))).toDateString().replace(' 2017', '');
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
		return e.type.indexOf('Climbing') >= 0 && e.title.indexOf('Basic') === 0 || e.title.indexOf('Glacier') === 0;
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

    window.handleInfoClick = function (id)
    {
    	var event = getEvent(id);

    	alert(JSON.stringify(event, null, 4));
    };

    function runPage()
    {
    	var lastSyncDate = util.storage.getItem('lastSyncDate');
    	util.storage.setItem('currentSyncDate', lastSyncDate);

    	util.XHR({
	        type: 'POST',
	        url: 'http://' + window.location.host + '/api/v1/list',
	        data: { lastSyncDate: lastSyncDate },
	        cb: function (xhr)
	        {
	        	if (xhr.status === 200)
	        	{
	        		var data = JSON.parse(xhr.responseText);

	        		handleEventData(data.events);

	        		util.storage.setItem('lastSyncDate', data.metadata.lastSyncDate);
	        	}
	        }
	    });
    }


    runPage();
});
