//========================================================================================================
var initialize = true;
var programRunning = false;

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


//red #F5C6CB
//green #C3E6CB
//yellow #FFEEBA
function draw() {
	var canvas = document.getElementById('fill-bar-jobs');
	var ctx = canvas.getContext('2d');

	ctx.fillStyle = '#FF0000';
	ctx.fillRect(0, 0, canvas.width, 75);
}


$(document).ready(() => {
	updateDom();
});


function updateDom() {
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
				if (rawData[rd].type === 'csv') {imgName = 'notepad'}
				if (rawData[rd].type === 'xlsx') {imgName = 'excel'}

				$('#table-files > tbody').append(
					'<tr id="tr-' + rd + '">' +
						'<td class="td-left">' +
							'<i id="icon-' + rd + '" class="' + ionClass + ' icon-main icon-sm"></i> ' +
							'<b>' + nameText + '</b>: ' +
							'<img class="img-file-thumbnail" src="img/icon-' + imgName + '.png"> ' +
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
				// Empty the html elements containing the list of matches and the results
				$('#card-deck-scores').empty().append(
					'<div class="card">' + 
						'<div class="card-block">' + 
							'<h4 class="card-title">' + 'Jobs' + '</h4>' +
							'<p class="card-text">' + 'Total: ' + summary.jobs.total + '</p>' +
							'<p class="card-text">' + 'Filled: ' + summary.jobs.filled + '</p>' +
							'<p class="card-text">' + 'Unfilled: ' + summary.jobs.unfilled + '</p>' +
							'<canvas id="fill-bar-jobs" class="fill-bar"></canvas>' +
						'</div>' +
					'</div>' + 
					'<div class="card">' + 
						'<div class="card-block">' + 
							'<h4 class="card-title">' + 'Q&amp;W' + '</h4>' +
							'<p class="card-text">' + 'Total: ' + summary.qw.total + '</p>' +
							'<p class="card-text">' + 'Matched: ' + summary.qw.matched + '</p>' +
							'<p class="card-text">' + 'Unmatched: ' + summary.qw.unmatched + '</p>' +
							'<canvas id="fill-bar-qw" class="fill-bar"></canvas>' +
						'</div>' +
					'</div>'
				);
			}

			// let canvasJobs = $('#fill-bar-jobs');


			// function drawBar([color1, color2, etc.])

			// //red #F5C6CB
			// //green #C3E6CB
			// //yellow #FFEEBA
			// function draw() {
			// 	var canvas = document.getElementById('fill-bar-jobs');
			// 	var ctx = canvas.getContext('2d');

			// 	ctx.fillStyle = '#FF0000';
			// 	ctx.fillRect(0, 0, canvas.width, 75);
			// }

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
					let trClass = row.numUnfilled === 0 ? 'table-success' : 'table-danger';
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
			var tableTitle = 'Q &amp; W Summary';

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
					let trClass = row.job !== 'Unmatched' ? 'table-success' : 'table-warning';
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
			if (rawData.qw.data !== undefined && rawData.jobs.data !== undefined) {
				$('#btn-start').removeAttr('disabled');
				$('#btn-start').removeClass('btn-disabled');
			} else {
				$('#btn-start').attr('disabled','disabled');
				$('#btn-start').addClass('btn-disabled');
			}
		}

		function showSections() {
			let speed = 500;
			if (initialize) {
				speed = 0;
				initialize = false;
			}
			$('#sec-results').slideToggleShow(programRunning, speed);
			$('#sec-intro, #sec-file-browse').slideToggleShow(!programRunning, speed);	
		}
		//------------------------end of style functions---------------------------
	}



} //End updateDom


function listen() {

	$('input').on('change', handleFiles);

	$('form').on('mouseenter', function() {
		$('#icon-add-files').attr('style', 'opacity: 1');
		$('#p-browse').attr('style', 'opacity: 1');
	});

	$('form').on('mouseleave', function() {
		$('#icon-add-files').attr('style', 'opacity: 0.6');
		$('#p-browse').attr('style', 'opacity: 0.6');
	});

	$('.icon-close').on('click', function() {
		let objId = this.getAttribute('id').replace('icon-close-', '');
		rawData[objId].data = undefined;
		updateDom();

	});

}

//==========================================================================================
//=============================END OF DOM UPDATES===========================================
//==========================================================================================
$.fn.slideToggleShow = function(show, speed) {
	return show? $(this).slideDown(speed) : $(this).slideUp(speed);
}

$.fn.fadeToggleShow = function(show, speed) {
	return show? $(this).fadeIn(speed) : $(this).fadeOut(speed);
}


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

		} // end reader.onload
	}); // end forEach.call(inputFiles)
}


function parseFile(file, ftype) {
	if (ftype === 'csv') {
		return parseCsv(file);
	} else if (ftype === 'xlsx') {
		return parseXlsx(file);
	}
}


function isQwFile(data) {
	var qwContents = EXPECTED_FIELDS.qw.map(a => a.header);

	return searchForContents(meltArray(data), qwContents);
}


function isJobsFile(data) {
	var jobsContents = EXPECTED_FIELDS.jobs.map(a => a.header);

	return searchForContents(meltArray(data), jobsContents);
}