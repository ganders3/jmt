//========================================================================================================
//----------------------------------constants------------------------------------------------
const NUM_AFSC_PREFS = 20;

const DATE_FORMAT = {
	qw: '%Y%m%d',
	jobs: '%d-%m-%Y',
	output: '%d %b %Y'
}

const KEEP_COLUMNS = {
	qw: ['id', 'prefs', 'eadFrom', 'eadTo', 'daysInDep', 'selected', 'originalIndex', 'filledJob']
}

const SCORE_METHODS = ['equal', 'normalized', 'linear'];

const EXPECTED_FIELDS = {
	qw: [
		{header: 'SSAN', canBeBlank: false},
		{header: 'Days in DEP', canBeBlank: false},
		{header: 'EAD From', canBeBlank: false},
		{header: 'EAD To', canBeBlank: false},
		{header: 'AFSC Pref 1', canBeBlank: false},
		{header: 'AFSC Pref 2', canBeBlank: true},
		{header: 'AFSC Pref 3', canBeBlank: true},
		{header: 'AFSC Pref 4', canBeBlank: true},
		{header: 'AFSC Pref 5', canBeBlank: true},
		{header: 'AFSC Pref 6', canBeBlank: true},
		{header: 'AFSC Pref 7', canBeBlank: true},
		{header: 'AFSC Pref 8', canBeBlank: true},
		{header: 'AFSC Pref 9', canBeBlank: true},
		{header: 'AFSC Pref 10', canBeBlank: true},
		{header: 'AFSC Pref 11', canBeBlank: true},
		{header: 'AFSC Pref 12', canBeBlank: true},
		{header: 'AFSC Pref 13', canBeBlank: true},
		{header: 'AFSC Pref 14', canBeBlank: true},
		{header: 'AFSC Pref 15', canBeBlank: true},
		{header: 'AFSC Pref 16', canBeBlank: true},
		{header: 'AFSC Pref 17', canBeBlank: true},
		{header: 'AFSC Pref 18', canBeBlank: true},
		{header: 'AFSC Pref 19', canBeBlank: true},
		{header: 'AFSC Pref 20', canBeBlank: true}
	],

	jobs: [
		{header: 'AFSC', canBeBlank: false},
		{header: 'EAD', canBeBlank: false},
		{header: 'Seats Remaining', canBeBlank: false}
	]
}

//----------------------------------variables------------------------------------------------
var initialize = true;
var programRunning = false;
var readyToRun = false;

var input = document.querySelector('input');
var preview = document.querySelector('.file-preview');

var rawData = {
	qw: {
		name: undefined,
		size: undefined,
		type: undefined,
		data: undefined
	},
	jobs: {
		name: undefined,
		size: undefined,
		type: undefined,
		data: undefined
	}
}

var qw; var jobs; var jobsTable; var qwTable; var matches; var summary;
//========================================================================================================

$(document).ready(() => {updateDom()});


function updateDom() {

	readyToRun = allDataLoaded();

	build();
	style();
	listen();

	function build() {
		buildFileUpload();
		buildScores();
		buildJobsTable();
		buildQwTable();


		//----------------------------build functions--------------------------------
		function buildFileUpload() {
			$('#table-files').empty().append('<tbody></tbody>');
			Object.keys(rawData).forEach(rd => {
				let ionClass; let nameText; let imgName;
				if (rd === 'qw') {
					ionClass = 'ion-person-stalker';
					nameText = 'Q&amp;W File';
				}
				if (rd === 'jobs') {
					ionClass = 'ion-document-text';
					nameText = 'Jobs File';
				}
				if (rawData[rd].type === 'csv') {imgName = 'csv'}
				if (rawData[rd].type === 'excel') {imgName = 'excel'}

				$('#table-files > tbody').append(
					'<tr id="tr-' + rd + '">' +
						'<td class="td-left">' +
							'<i id="icon-' + rd + '" class="' + ionClass + ' icon-main icon-sm"></i> ' +
							'<b>' + nameText + '</b>: ' +
							'<img class="img-file-thumbnail" src="img/icon-' + rawData[rd].type + '.png"> ' +
							rawData[rd].name + ' (' + rawData[rd].size + ')' +
						'</td>' +
						'<td class="td-right">' +
							'<i class="ion-close-round icon-sm icon-click icon-close" id="icon-close-' + rd + '"></i>' +
						'</td>' +
					'</tr>'
					);
			});
		}


		function buildScores() {
			if (summary !== undefined) {
				$('#card-deck-scores').empty().append(
					'<div class="card">' +
						'<div class="card-block">' +
							'<h4 class="card-title">' + 'Jobs' + '</h4>' +
							'<p>' +
								'Total: <b>' + summary.jobs.total + '</b>; ' + 
								'Filled: <b>' + summary.jobs.filled + '</b>; ' +
								'Unfilled: <b>' + summary.jobs.unfilled + '</b>' +
							'</p>' +
							'<canvas id="fill-bar-jobs" class="canvas-fill-bar"></canvas>' +
						'</div>' +
					'</div>' +
					'<div class="card">' +
						'<div class="card-block">' +
							'<h4 class="card-title">' + 'Q&amp;W' + '</h4>' +
							'<p>' +
								'Total: <b>' + summary.qw.total + '</b>; ' + 
								'Matched: <b>' + summary.qw.matched + '</b>; ' +
								'Unmatched: <b>' + summary.qw.unmatched + '</b>' +
							'</p>' +
							'<canvas id="fill-bar-qw" class="canvas-fill-bar"></canvas>' +
						'</div>' +
					'</div>'
				);

				let colorRed = '#F5C6CB';
				let colorGreen = '#C3E6CB';
				drawStackedBar('fill-bar-jobs', [summary.jobs.filled, summary.jobs.unfilled], [colorGreen, colorRed]);
				drawStackedBar('fill-bar-qw', [summary.qw.matched, summary.qw.unmatched], [colorGreen, colorRed]);
			}
		}


		function buildJobsTable() {
			var containerId = '#container-jobs-table';
			var tableTitle = 'Jobs Summary';

			var jobsTableColumns = [
				{field: 'afsc', display: 'AFSC'},
				{field: 'ead', display: 'EAD'},
				{field: 'numSeats', display: 'Open Seats'},
				{field: 'numFilled', display: 'Filled Seats'},
				{field: 'numUnfilled', display: 'Unfilled Seats'},
				{field: 'filledBy', display: 'Filled By'}
			];

			// Empty the table
			$(containerId).empty().append(
				'<h3>' + tableTitle + '</h3>' +
				'<table class="table table-hover table-bordered">' +
					'<thead></thead>' +
					'<tbody></tbody>' +
				'</table>'
				);

			// Build the table header
			$.each(jobsTableColumns, (ind, col) => {
				$(containerId + ' > table > thead').append('<th scope="col">' + col.display + '</th>');
			});

			if (typeof(jobsTable) !== 'undefined') {
				$.each(jobsTable, (ind, row) => {
					let trClass = row.numUnfilled === 0 ? 'table-success' : row.numUnfilled === row.numSeats ? 'table-danger' : 'table-warning';
					let trData = '';

					// Build the data for the current table row
					$.each(jobsTableColumns, (ind, col) => {trData += '<td>' + row[col.field] + '</td>'});
					// Append the row onto the table body
					$(containerId  + ' > table > tbody').append('<tr class="' + trClass + '">' + trData + '</tr>');
				});
			}
		}


		function buildQwTable() {
			var containerId = '#container-qw-table';
			var tableTitle = 'Q&amp;W Summary';

			var qwTableColumns = [
				{field: 'id', display: 'ID'},
				// {field: 'daysInDep', display: 'Days In DEP'},
				{field: 'job', display: 'Matched AFSC'},
				{field: 'ead', display: 'Matched EAD'}
			];

			// Empty the table and build
			$(containerId).empty().append(
				'<h3>' + tableTitle + '</h3>' +
				'<table class="table table-hover table-bordered">' +
					'<thead></thead>' +
					'<tbody></tbody>' +
				'</table>'
				);

			// Build the table header
			$.each(qwTableColumns, (ind, col) => {
				$(containerId + ' > table > thead').append('<th scope="col">' + col.display + '</th>');
			});

			if (typeof(qwTable) !== 'undefined') {
				$.each(qwTable, (ind, row) => {
					let trClass = row.job !== 'Unmatched' ? 'table-success' : 'table-danger';
					let trData = '';

					// Build the data for the current table row
					$.each(qwTableColumns, (ind, col) => {trData += '<td>' + row[col.field] + '</td>'});
					// Append the row onto the table body
					$(containerId  + ' > table > tbody').append('<tr class="' + trClass + '">' + trData + '</tr>');
				});
			}
		}
		//-------------------------end of build functions---------------------

	}


	function style() {
		styleIcons();
		styleButtons();
		showSections();


		//-------------------------style functions---------------------------------
		function styleIcons() {
			Object.keys(rawData).forEach(rd => {
				let fileLoaded = rawData[rd].data !== undefined;
				//Set the table rows for QW and Jobs as visible not, depending on whether the data string exists
				$('#tr-' + rd).toggle(fileLoaded);
			});
		}

		
		function styleButtons() {
			if (rawData.qw.data && rawData.jobs.data) {
				$('#btn-start').removeAttr('disabled');
				$('#btn-start').removeClass('btn-disabled');
			} else {
				$('#btn-start').attr('disabled','disabled');
				$('#btn-start').addClass('btn-disabled');
			}
		}

		function showSections() {
			let speed = initialize ? 0 : 300;
			initialize = initialize ? false : initialize;

			$('#sec-results').slideFadeToggle(programRunning, speed);
			$('#sec-intro, #sec-file-browse').slideFadeToggle(!programRunning, speed);
			$('#form-file-upload').slideFadeToggle(!readyToRun, speed);
			$('#p-ready').slideFadeToggle(readyToRun, speed);
		}
		//------------------------end of style functions---------------------------
	}
} //End updateDom


function listen() {
	$('input').on('change', handleFiles);
	$('form').on('mouseenter', () => {$('#icon-add-files, #p-browse').attr('style', 'opacity: 1')});
	$('form').on('mouseleave', () => {$('#icon-add-files, #p-browse').attr('style', 'opacity: 0.6')});

	$('.icon-close').on('click', function() {
		let objId = this.getAttribute('id').replace('icon-close-', '');
		rawData[objId].data = undefined;
		updateDom();
	});
}

//==========================================================================================
//=============================END OF DOM UPDATES===========================================
//==========================================================================================
$.fn.slideToggleShow = function(show, speed) {return show? $(this).slideDown(speed) : $(this).slideUp(speed)}
$.fn.fadeToggleShow = function(show, speed) {return show? $(this).fadeIn(speed) : $(this).fadeOut(speed)}

$.fn.slideFadeToggle  = function(show, speed) {
	let op = show ? 'show' : 'hide';
	let ht = show ? 'show' : 'hide';
	return this.animate({opacity: op, height: ht}, speed);
}; 


function handleFiles() {
	var fileSpecs = [];
	var pending = 0;

	Array.prototype.forEach.call(input.files, (file, ind) => {
		// Since FileReader.onload is asynchronous, need to determine when it is done - the pending variable tracks this
		pending++;
		fileSpecs.push({
			name: file.name,
			size: fileSize(file.size),
			type: fileType(file)
		});

		var reader = new FileReader();
		reader.readAsBinaryString(file);

		reader.onload = function(e) {
			//Only proceed if the current file has a known (valid) file type
			if (fileSpecs[ind].type !== 'unknown') {
				var data = parseFile(e.target.result, fileSpecs[ind].type);

				Object.keys(EXPECTED_FIELDS).forEach((ef) => {
					if (searchForContents(meltArray(data), EXPECTED_FIELDS[ef].map(a => a.header))) {
						data = cleanDataArray(data, EXPECTED_FIELDS[ef]);
						rawData[ef].name = fileSpecs[ind].name;
						rawData[ef].size = fileSpecs[ind].size;
						rawData[ef].type = fileSpecs[ind].type;
						rawData[ef].data = arrayToObjectArray(data, true);
					}
				});

				//Decrease pending for each file that is completely read
				pending--;
				if (pending === 0) {updateDom()}
			}

		} // end reader.onload
	}); // end forEach.call(inputFiles)
}


function parseFile(file, ftype) {
	if (ftype === 'csv') {
		return parseCsv(file);
	} else if (ftype === 'excel') {
		return parseXlsx(file);
	}
}

function allDataLoaded() {
	return (rawData.qw.data !== undefined && rawData.jobs.data !== undefined);
}

// function isQwFile(data) {
// 	var qwContents = EXPECTED_FIELDS.qw.map(a => a.header);
// 	return searchForContents(meltArray(data), qwContents);
// }


// function isJobsFile(data) {
// 	var jobsContents = EXPECTED_FIELDS.jobs.map(a => a.header);
// 	return searchForContents(meltArray(data), jobsContents);
// }