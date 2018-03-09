var initialize = true;
var programRunning = false;

var input = document.querySelector('input');
var preview = document.querySelector('.file-preview');

var rawData = {
	qw: undefined,
	jobs: undefined
}

$(document).ready(() => {
	updateDom();
});


$.fn.slideToggleShow = function(show, speed) {
	return show? $(this).slideDown(speed) : $(this).slideUp(speed);
}

$.fn.fadeToggleShow = function(show, speed) {
	return show? $(this).fadeIn(speed) : $(this).fadeOut(speed);
}


function updateDom() {

	build();
	style();
	listen();


	function build() {

		buildFileUpload();
		buildScores();
		buildJobsTable();
		buildQwTable();
		// buildMatches();

		function buildFileUpload() {
			$('#card-deck-files').empty();

			Object.keys(rawData).forEach((ds) => {
				let ionClass;
				if (ds === 'qw') {ionClass = 'ion-person-stalker';}
				if (ds === 'jobs') {ionClass = 'ion-document-text';}

				$('#card-deck-files').append(
					'<div class="card">' +
						'<div class="card-block">' +
							'<div><i class="ion-close-round icon-sm icon-click icon-close" id="icon-close-' + ds + '"></i></div>' +
							'<i id="icon-' + ds + '" class="' + ionClass + ' icon-main icon-sm icon-disabled"></i><h6 class="card-title">' + ds + '</h6>' +
						'</div>' +
					'</div>'
					);
			});
		}



		function buildScores() {
			// Empty the html elements containing the list of matches and the results
			$('#card-deck-scores, #match-list').empty();

			if (typeof(scores) !== 'undefined') {
				$.each(scores, (ind, score) => {
					$('#card-deck-scores').append(
						'<div class="card">' + 
							'<div class="card-block">' + 
								'<h4 class="card-title">' + ind + '</h4>' +
								'<p class="card-text">Best score: ' + score.best.score + '</p>' +
								'<p class="card-text">Best iteration: ' + score.best.iteration + '</p>' +
								'<p class="card-text">Best number matches: ' + score.best.numMatches + '</p>' +
							'</div>' +
						'</div>'
						);
				});				
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
			$(containerId).empty();
			// Build the table structure
			$(containerId).append(
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

			// Empty the table
			$(containerId).empty();
			// Build the table structure
			$(containerId).append(
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

	}


	function style() {

		styleIcons();
		styleButtons();
		showSections();

		function styleIcons() {
			Object.keys(rawData).forEach((ds) => {
				let fileLoaded = rawData[ds] !== undefined;
				//Set the icons for QW and Jobs as disabled not, depending on whether the data string exists
				$('#icon-' + ds).toggleClass('icon-disabled', !fileLoaded);
				$('#icon-close-' + ds).toggle(fileLoaded);
			});
		}
		
		function styleButtons() {
			if (rawData.qw !== undefined && rawData.jobs !== undefined) {
				$('#btn-start').removeAttr('disabled');
				$('#btn-start').removeClass('btn-disabled');
			} else {
				$('#btn-start').attr('disabled','disabled');
				$('#btn-start').addClass('btn-disabled');
			}
		}

		function showSections() {
			let speed = 600;

			if (initialize) {
				speed = 0;
				initialize = false;
			}

			$('#sec-results').slideToggleShow(programRunning, speed);
			$('#sec-intro, #sec-file-browse').slideToggleShow(!programRunning, speed);	
		}
	}



} //End updateDom


function listen() {

	$('input').on('change', handleFiles);

	$('form').on('mouseenter', function() {
		$('#icon-add-files').attr('style', 'opacity: 1');
	});

	$('form').on('mouseleave', function() {
		$('#icon-add-files').attr('style', 'opacity: 0.6');
	});

	$('.icon-close').on('click', function() {
		let objId = this.getAttribute('id').replace('icon-close-', '');
		rawData[objId] = undefined;
		updateDom();

	});

}

//==========================================================================================
//=============================END OF DOM UPDATES===========================================
//==========================================================================================


function handleFiles() {
	var fileSpecs = [];
	var pending = 0;

	Array.prototype.forEach.call(input.files, (file, ind) => {
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
					rawData[ef] = arrayToObjectArray(data, true);
				}
			});

			pending--;
			if (pending === 0) {
				updateDom();
			}

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

function parseCsv(string) {
	var lineBreak = formatLineBreak('\r\n');
	return parseString(string, ',', lineBreak);
}

function parseString(string, delimiter, lineBreak) {
	var arr = [];
	var lines = string.split(lineBreak);
	// console.log('lines:', lines);

	for (let i=0; i < lines.length; i++) {
	// lines.forEach((line) => {
		var fields = lines[i].split(delimiter);
		fields = fixFragmentedStrings(fields);

		arr.push([]);
		for (let j=0; j < fields.length; j++) {
			arr[i][j] = fields[j];
		}
	}
	return arr;
}

// function date

function parseXlsx(file) {
		var workbook = XLSX.read(file, {type: 'binary'});
		var firstSheetName = workbook.SheetNames[0];
		var worksheet = workbook.Sheets[firstSheetName];
		
		var arr = XLSX.utils.sheet_to_json(worksheet, {header: 1, raw: false});
		return arr;
}

function fileType(file) {
	const FILE_TYPES = [
		{jsType: '.csv', fileType: 'csv'},
		{jsType: 'text/csv', fileType: 'csv'},
		{jsType: 'application/vnd.ms-excel', fileType: 'csv'},
		{jsType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', fileType: 'xlsx'}
	];

	for (var i=0; i<FILE_TYPES.length; i++) {
		if (file.type === FILE_TYPES[i].jsType) {return FILE_TYPES[i].fileType}
	}
	return 'unknown';
}


function arrayToObjectArray(array, containsHeader) {
	var header = [];
	if (containsHeader) {
		header = array[0];
		array.splice(0,1);
	} else {
		for (let j=0; j < array[0].length; j++) {
			header.push('x' + j);
		}
	}

	var arrObj = [];
	array.forEach((line) => {
		arrObj.push({});
		for (let j=0; j < line.length; j++) {
			arrObj[arrObj.length-1][header[j]] = line[j];
		}
	});
	return arrObj;
}


function isQwFile(data) {
	var qwContents = EXPECTED_FIELDS.qw.map((a) => {return a.header});

	return searchForContents(meltArray(data), qwContents);
}

function isJobsFile(data) {
	var jobsContents = EXPECTED_FIELDS.jobs.map((a) => {return a.header});

	return searchForContents(meltArray(data), jobsContents);
}


function meltArray(array) {
	var melt = '';
	for (let i=0; i < array.length; i++) {
		for (let j=0; j < array[i].length; j++) {
			melt += array[i][j];
		}
	}
	return melt;
}


function searchForContents(data, expectedContents) {
	for (i=0; i < expectedContents.length; i++) {
		if (data.search(expectedContents[i]) === -1) {return false}
	}
	return true;
}


function cleanDataArray(array, headerSpecs) {
	var expectedHeader = headerSpecs.map((a) => {return a.header});
	var canBeBlank = headerSpecs.map((a) => {return a.canBeBlank});

	while (array.length > 0 && !isHeaderLine(array[0], expectedHeader)) {
		console.log('isHeaderLine removing line 0: ' + array[0]);
		array.splice(0, 1);
	}

	var header = array[0];
	console.log('header line is:', header);

	for (let i=array.length-1; i > -1; i--) {
		if (!isValidDataLine(array[i], header, expectedHeader, canBeBlank)) {
			console.log('isValidDataLine removing line ' + i + ': ' + array[i]);
			array.splice(i,1);
		}
	}
	return array;
}



function isHeaderLine(line, expectedHeader) {
	//If the line is empty or contains no values, it is not valid
	if (line.length === 0) {return false}
	
	// Search through each expected header
	for (let i=0; i < expectedHeader.length; i++) {
		//If a header is not found, the line is not the header line
		if (line.indexOf(expectedHeader[i]) === -1) {
			return false;
		}
		//The line is the header line only if all expected headers are found
		return true;
	}
}



function isValidDataLine(line, header, expectedHeader, canBeBlank) {

	h = header;
	eh = expectedHeader;
	cbb = canBeBlank;
	//If the line doesn't contain at least as many fields as the header
	if (line.length < header.length) {return false}
	//Search through each field in the current line
	for (let j=0; j < line.length; j++) {
		//If the field is empty, investigate further
		if (line[j] === undefined || line[j].trim() === '') {
			// Find the index index in the expected headers array of the current field
			var headerIndex = expectedHeader.indexOf(header[j]);
			// If the header is in the list of expected headers, and it's blank when it shouldn't be, the line is invalid
			if (headerIndex !== -1 && !canBeBlank[headerIndex]) {
				return false;
			}
		}
	}
	return true;
}


function formatLineBreak(lineBreak) {
	if (lineBreak === '\r\n' || lineBreak === '\n') {
		if (getOs() === 'Windows') {
			lineBreak = '\r\n';
		} else {lineBreak = '\n';}
	}
	return lineBreak;
}


function fixFragmentedStrings(arr) {
	var fragmentedString = '';
	arr.forEach((field, ind) => {
		if(field.search('\"') !== -1) {
			if(fragmentedString === '') {
				fragmentedString += field.replace('\"', '') + ', ';
			} else {
				fragmentedString += field.replace('\"', '');
				arr[ind-1] = fragmentedString;
				arr.splice(ind, 1);
				fragmentedString = '';
			}
		}
	});
	return arr;
}




function writeCsv(array, fileName) {
	const CSV_METADATA = 'data:text/csv;charset=utf-8,';
	//Append each row's data to the csv output data
	var csvContent = CSV_METADATA;
	array.forEach((row) => {
		//Initialize current row content to a blank string
		let rowContent = '';
		//Loop through each key
		for (key in row) {
			//if the data headers have not yet been set (the only thing in the CSV is the metadata), set them now
			if (csvContent == CSV_METADATA) {
				rowContent += key + ',';
			//If data headers have been set, start appending data
			} else {
				rowContent += row[key] + ',';
			}
		};
		//Trim the last comma from the end of the row content
		rowContent = rowContent.slice(0, rowContent.length-1);
		//Append the current row content to the csv output
		csvContent += rowContent + '\r\n';
	});

	let encodedUri = encodeURI(csvContent);
	let link = document.getElementById('csv-link');
	link.setAttribute('href', encodedUri);

	if (fileName===undefined){fileName = 'data.csv'}
	if (!fileName.endsWith('.csv')){fileName += '.csv'}
	link.setAttribute('download', fileName);
}



function arrayAllIndicesOf(array, matches) {
	let output = [];

	for (let i=0; i<array.length; i++) {
		let n = 0;
		for (let j=0; j<matches.length; j++) {
			if (array[i][matches[j].field] === matches[j].value) {
				n++;
			}
		}
		if (n === matches.length) {
			output.push(i);
		}
	}
	return output;
}

function arrayIndexOf(array, matches) {
	let indices = arrayAllIndicesOf(array, matches);
	if (indices.length === 0) {
		return -1;
	} else {
		return indices[0];
	}
}

function allIndicesOf(array, match) {
	let output = [];

	for (let i=0; i<array.length; i++) {
		if (array[i] === match) {
			output.push(i);
		}
	}
	return output;
}

//randomly sort an array
function shuffleArray(arr) {
	arr.sort(() => {
		return 0.5 - Math.random();
	});
	return arr;
}


function arrayIntersection(arr1, arr2) {
	let output = arr1.filter((i) => {
		return arr2.indexOf(i) !== -1;
	});
	return output;
}

// Convert dates to JS format (dateParser is a D3 function)
function dateStringToJs(dtInputString, dtFormat) {
	let dateProcessor = d3.timeParse(dtFormat);
	return dateProcessor(dtInputString);
}



function dateJsToString(dtInputJs, dtFormat) {
	if (dtFormat == undefined) {dtFormat = '%Y%m%d'}
	if (dtInputJs != undefined) {
		let dateProcessor = d3.timeFormat(dtFormat);
		return dateProcessor(dtInputJs);
	} else {
		return '';
	}
}



function getOs() {
	let OS_LIST = [
		{codeName: 'Windows', name: 'Windows'},
		{codeName: 'Mac', name: 'Mac'},
		{codeName: 'Linux', name: 'Linux'}
	];

	let os = navigator.oscpu;

	for (let i=0; i<OS_LIST.length; i++) {
		if (os.search(OS_LIST[i].codeName) !== -1) {
			return OS_LIST[i].name;
		}
	}
	return 'unknown';
}


function fileSize(number) {
	if(number < 1024) {
		return number + ' bytes';
	} else if(number > 1024 && number < 1048576) {
		return (number/1024).toFixed(1) + ' KB';
	} else if(number > 1048576) {
		return (number/1048576).toFixed(1) + ' MB';
	}
}