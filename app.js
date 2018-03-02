var initialize = true;
var programRunning = false;
// var initialize = true;

var input = document.querySelector('input');
var preview = document.querySelector('.file-preview');

var dataStrings = {
	qw: undefined,
	jobs: undefined
}

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


input.addEventListener('change', handleFiles);


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
		buildMatches();

		function buildFileUpload() {
			$('#card-deck-files').empty();

			Object.keys(dataStrings).forEach((ds) => {
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



		function buildMatches() {
			if (typeof(matches) !== 'undefined') {
				$.each(matches, (ind, match) => {
					let msg;
					let itemClass = 'list-group-item-';
					let j = match.jobInd; let q = match.qwInd;
					let dt = '';
					if(jobs[j] !== undefined) {dt = dateJsToString(jobs[j].ead, '%d %b %y');}

					if(j !== undefined && q !== undefined) {
						msg = '<b>' + jobs[j].afsc + '</b> on <b>' + dt + '</b> matched to <b>' + qw[q].id + '</b>.';
						itemClass += 'success';
					} else if(j !== undefined) {
						msg = '<b>' + jobs[j].afsc + '</b> on <b>' + dt + '</b> was not filled.';
						itemClass += 'danger';
					} else if(q !== undefined) {
						msg = '<b>' + qw[q].id + '</b> was not matched to a job.';
						itemClass += 'warning';
					}

					$('#match-list').append('<li class="list-group-item">' + msg + '</li>');
					$('#match-list li').last().addClass(itemClass);
				});
			}
		}


	}


	function style() {

		styleIcons();
		styleButtons();
		showSections();

		function styleIcons() {
			Object.keys(dataStrings).forEach((ds) => {
				let fileLoaded = dataStrings[ds] !== undefined;
				//Set the icons for QW and Jobs as disabled not, depending on whether the data string exists
				$('#icon-' + ds).toggleClass('icon-disabled', !fileLoaded);
				$('#icon-close-' + ds).toggle(fileLoaded);
			});
		}
		
		function styleButtons() {
			if (dataStrings.qw !== undefined && dataStrings.jobs !== undefined) {
				$('#btn-start').removeAttr('disabled');
				$('#btn-start').removeClass('btn-disabled');
			} else {
				$('#btn-start').attr('disabled','disabled');
				$('#btn-start').addClass('btn-disabled');
			}
		}

		function showSections() {
			$('#sec-intro, #sec-file-browse').toggle(!programRunning);
			$('#sec-results').toggle(programRunning);
		}
	}



} //End updateDom


function listen() {

	$('form').on('mouseenter', function() {
		$('#icon-add-files').attr('style', 'opacity: 1');
	});

	$('form').on('mouseleave', function() {
		$('#icon-add-files').attr('style', 'opacity: 0.6');
	});

	$('.icon-close').on('click', function() {
		let objId = this.getAttribute('id').replace('icon-close-', '');
		dataStrings[objId] = undefined;
		updateDom();

	});

}
//==========================================================================================
//=============================END OF DOM UPDATES===========================================
//==========================================================================================



function handleFiles() {
	var currentFiles = input.files;

	for (i=0; i < currentFiles.length; i++) {
		var ftype = fileType(currentFiles[i]);
		console.log('outside ftype:', ftype);

		var reader = new FileReader();
		reader.readAsBinaryString(currentFiles[i]);

		reader.onload = (e) => {
			var data = undefined;
			data = parseFile(e.target.result, ftype);

			console.log('data:', data);
			if (isQwFile(data)) {
				// console.log('qw file');
				dataStrings.qw = arrayToObjectArray(data, true);
			}
			if (isJobsFile(data)) {
				// console.log('jobs file');
				dataStrings.jobs = arrayToObjectArray(data, true);
			}
			
			updateDom();
		}
	} //End for i in currentFiles.length



}

function parseFile(file, ftype) {
	console.log('ftype:', ftype);
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
	a = array;
	console.log(array);

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
		// console.log(j);
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




function writeCsv(arr, fileName) {
	const CSV_METADATA = 'data:text/csv;charset=utf-8,';
	//Append each row's data to the csv output data
	var csvContent = CSV_METADATA;
	arr.forEach((row) => {
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







// Convert dates to JS format (dateParser is a D3 function)
function dateStringToJs(dtInputString, dtFormat) {
	let dateProcessor = d3.timeParse(dtFormat);
	return dateProcessor(dtInputString);
}



function dateJsToString(dtInputJs, dtFormat) {
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


function returnFileSize(number) {
	if(number < 1024) {
		return number + ' bytes';
	} else if(number > 1024 && number < 1048576) {
		return (number/1024).toFixed(1) + ' KB';
	} else if(number > 1048576) {
		return (number/1048576).toFixed(1) + ' MB';
	}
}