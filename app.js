var initialize = true;
var programRunning = false;
// var initialize = true;

var input = document.querySelector('input');
var preview = document.querySelector('.file-preview');

var dataStrings = {
	qw: undefined,
	jobs: undefined
}

// var qwString;
// var jobsString;

input.addEventListener('change', readFiles);
//******************* figure out how to get IE to work when files are added ********************
// input.attachEvent('onchange', handleFiles);



// var wb = XLSX.read('data/test.xlsx');
// console.log(wb);
// var sheets = wb.SheetNames;
// console.log(sheets);
// console.log(XLSX.utils.sheet_to_json(wb.Sheets[sheets[0]]));


$(document).ready(() => {
	updateDom();
	listen();
});





function updateDom() {

	build();
	style();


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
							'<div><i class="ion-close-round icon-sm icon-click" id="icon-close-' + ds + '"></i></div>' +
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

	// $('.icon-click').each(function() {
	// 	$(this).on('mouseenter', function() {
	// 		console.log('mouse on each');
	// 	})
	// });

	$('#icon-close-qw').on('mouseenter', function() {
		// console.log('enter qw');
	});

	// $('.icon-click').on('mouseenter', function() {
	// 	console.log('mouse on icon click');
	// 	// $(this).attr('style', 'opacity: 1');
	// });

	// $('.icon-click').on('mouseleave', function() {
	// 	console.log('mouse off icon click');
	// 	$(this).attr('style', 'opacity: 0.6');
	// });


	// $('[id ^= icon-close-]').click(function() {
	// 	dataStrings[this.id.replace('icon-close-', '')] = undefined;
	// });

	$('#btn-start, .icon-click').on('mouseenter', function() {
		// console.log('cheese');
	});



	// updateDom();
}





function readFiles() {
	var currentFiles = input.files;

	for (i=0; i<currentFiles.length; i++) {
		if (validFileType(currentFiles[i])) {
			let fileReader = new FileReader();

			fileReader.onload = (fr) => {
				checkForQwAndJobs(fr.target.result);
				updateDom();
			}
			fileReader.readAsText(currentFiles[i]);
		}
	}

	function validFileType(file) {
		const FILE_TYPES = [
			'.csv',
			'text/csv',
			'application/vnd.ms-excel',
	  		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
		];

		for(var i = 0; i < FILE_TYPES.length; i++) {
			if(file.type === FILE_TYPES[i]) {return true}
		}
		return false;
	}	
}


function checkForQwAndJobs(fileContents) {
	// console.log('fileContents:', fileContents);
	const EXPECTED_CONTENTS = {
		qw: ['Applicant', 'SSAN', 'DEP Date', 'Days in DEP', 'EAD From', 'EAD To', 'AFSC Pref'],
		jobs: ['AFSC', 'EAD', 'Seats Remaining']
	}

	if (checkFileContents(fileContents, EXPECTED_CONTENTS.qw)) {
		// qwString = fileContents;
		dataStrings.qw = fileContents;
	} else if (checkFileContents(fileContents, EXPECTED_CONTENTS.jobs)) {
		dataStrings.jobs = fileContents;
		// jobsString = fileContents;
	}

}


function checkFileContents(fileContents, expectedContents) {
	for (i=0; i<expectedContents.length; i++) {
		if (fileContents.search(expectedContents[i]) === -1) {return false}
	}
	return true;
}



function parseExcel(fname) {
	XLSX.readFile(fname);
}

	const EXPECTED_HEADERS = {
		qw: [
			{name: 'SSAN', canBeBlank: false},
			{name: 'Days in DEP', canBeBlank: false},
			{name: 'EAD From', canBeBlank: false},
			{name: 'EAD To', canBeBlank: false},
			{name: 'AFSC Pref 1', canBeBlank: false},
			{name: 'AFSC Pref 2', canBeBlank: true},
			{name: 'AFSC Pref 3', canBeBlank: true},
			{name: 'AFSC Pref 4', canBeBlank: true},
			{name: 'AFSC Pref 5', canBeBlank: true},
			{name: 'AFSC Pref 6', canBeBlank: true},
			{name: 'AFSC Pref 7', canBeBlank: true},
			{name: 'AFSC Pref 8', canBeBlank: true},
			{name: 'AFSC Pref 9', canBeBlank: true},
			{name: 'AFSC Pref 10', canBeBlank: true},
			{name: 'AFSC Pref 11', canBeBlank: true},
			{name: 'AFSC Pref 12', canBeBlank: true},
			{name: 'AFSC Pref 13', canBeBlank: true},
			{name: 'AFSC Pref 14', canBeBlank: true},
			{name: 'AFSC Pref 15', canBeBlank: true},
			{name: 'AFSC Pref 16', canBeBlank: true},
			{name: 'AFSC Pref 17', canBeBlank: true},
			{name: 'AFSC Pref 18', canBeBlank: true},
			{name: 'AFSC Pref 19', canBeBlank: true},
			{name: 'AFSC Pref 20', canBeBlank: true}
		],

		jobs: [
			{name: 'AFSC', canBeBlank: false},
			{name: 'EAD', canBeBlank: false},
			{name: 'Seats Remaining', canBeBlank: false}
		]
	}



function prepareDataString(string, delimiter, lineBreak, containsHeader) {

	const EXPECTED_HEADERS = {
		qw: [
			{name: 'SSAN', canBeBlank: false},
			{name: 'Days in DEP', canBeBlank: false},
			{name: 'EAD From', canBeBlank: false},
			{name: 'EAD To', canBeBlank: false},
			{name: 'AFSC Pref 1', canBeBlank: false},
			{name: 'AFSC Pref 2', canBeBlank: true},
			{name: 'AFSC Pref 3', canBeBlank: true},
			{name: 'AFSC Pref 4', canBeBlank: true},
			{name: 'AFSC Pref 5', canBeBlank: true},
			{name: 'AFSC Pref 6', canBeBlank: true},
			{name: 'AFSC Pref 7', canBeBlank: true},
			{name: 'AFSC Pref 8', canBeBlank: true},
			{name: 'AFSC Pref 9', canBeBlank: true},
			{name: 'AFSC Pref 10', canBeBlank: true},
			{name: 'AFSC Pref 11', canBeBlank: true},
			{name: 'AFSC Pref 12', canBeBlank: true},
			{name: 'AFSC Pref 13', canBeBlank: true},
			{name: 'AFSC Pref 14', canBeBlank: true},
			{name: 'AFSC Pref 15', canBeBlank: true},
			{name: 'AFSC Pref 16', canBeBlank: true},
			{name: 'AFSC Pref 17', canBeBlank: true},
			{name: 'AFSC Pref 18', canBeBlank: true},
			{name: 'AFSC Pref 19', canBeBlank: true},
			{name: 'AFSC Pref 20', canBeBlank: true}
		],

		jobs: [
			{name: 'AFSC', canBeBlank: false},
			{name: 'EAD', canBeBlank: false},
			{name: 'Seats Remaining', canBeBlank: false}
		]
	}


	lineBreak = formatNewLineDelimiter(lineBreak);
	var lines = string.trim().split(lineBreak);

	while (isHeaderLine(lines[0], EXPECTED_HEADERS.jobs.map((a)=>{return a.name})) === false) {
		console.log('first line: ', lines[0]);
		lines.splice(0, 1);
	}
	console.log('first line: ', lines[0]);


	function isHeaderLine(line, expectedHeader) {
		for (let i=0; i < expectedHeader.length; i++) {
			if (line.indexOf(expectedHeader[i]) === -1) {
				return false
			}
			return true
		}
	}


}


function formatNewLineDelimiter(delim) {
	if (delim === '\r\n' || delim === '\n') {
		if (getOs() === 'Windows') {
			delim = '\r\n';
		} else {delim = '\n';}
	}
	return delim;
}


function parseDataString(string, delimiter, lineBreak, containsHeader) {
	//Trim the string to remove any blanks, and then split it into lines based on the line break character
	// console.log('string:', string);
	lineBreak = formatNewLineDelimiter(lineBreak);
	var lines = string.trim().split(lineBreak);
	var columnNames = [];

	console.log(lines[0], lines[0].length);
	// console.log('lines:', lines);

	//Set the object property names depending on whether the csv string has headers or not
	if(containsHeader) {
		//If it has headers, the column names are the first line of the csv
		columnNames = lines[0].split(delimiter);
		//Then remove the first line so it isn't re-read
		lines.splice(0,1);
	} else {
		//If it doesn't have headers, assign column names 'X0' through 'Xn'
		for(i=0; i<lines[0].split(delimiter).length; i++) {
			columnNames.push('X' + i);
		}
	}

	//Iterate through each line in the data string
	var arr = [];
	lines.forEach((line) => {
		console.log(line);

		//Split each line by commas to get an array of each entry
		var fields = line.split(delimiter);
		fields = fixFragmentedStrings(fields)

		arr.push({});
		for(i=0; i<fields.length; i++) {
			arr[arr.length-1][columnNames[i]] = fields[i];
		}
	});
	return arr;





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

	for (i=0; i<OS_LIST.length; i++) {
		if (os.search(OS_LIST[i].codeName) !== -1) {
			return OS_LIST[i].name;
		}
	}
	return 'Unknown';
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