var programRunning = false;
// var initialize = true;

var input = document.querySelector('input');
var preview = document.querySelector('.file-preview');

var qwString;
var jobsString;

input.addEventListener('change', handleFiles);
//******************* figure out how to get IE to work when files are added ********************
// input.attachEvent('onchange', handleFiles);


// var wb = XLSX.read('data/test.xlsx');
// console.log(wb);
// var sheets = wb.SheetNames;
// console.log(sheets);
// console.log(XLSX.utils.sheet_to_json(wb.Sheets[sheets[0]]));


$(document).ready(() => {
	updateDom();
});


function updateDom() {
	$('#todo').hide();

	if (!programRunning) {
		$('#sec-intro, #sec-file-browse').show('fast');
		$('#sec-results').hide();
	} else {
		$('#sec-intro, #sec-file-browse').hide('fast');
		$('#sec-results').show('fast');

		updateDomCards();
		updateDomMatchList();
	}
	styleListener();



	function updateDomCards() {
		// Empty the html elements containing the list of matches and the results
		$('#card-deck-scores, #match-list').empty();
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

	function updateDomMatchList() {
		$.each(matches, (ind, match) => {
			let msg;
			let cl = 'list-group-item-';
			let j = match.jobInd; let q = match.qwInd;
			let dt = '';
			if(jobs[j] !== undefined) {dt = dateJsToString(jobs[j].ead, '%d %b %y');}

			if(j !== undefined && q !== undefined) {
				msg = '<b>' + jobs[j].afsc + '</b> on <b>' + dt + '</b> matched to <b>' + qw[q].id + '</b>.';
				cl += 'success';
			} else if(j !== undefined) {
				msg = '<b>' + jobs[j].afsc + '</b> on <b>' + dt + '</b> was not filled.';
				cl += 'danger';
			} else if(q !== undefined) {
				msg = '<b>' + qw[q].id + '</b> was not matched to a job.';
				cl += 'warning';
			}

			$('#match-list').append('<li class="list-group-item">' + msg + '</li>');
			$('#match-list li').last().addClass(cl);
		});
	}

	
}

function styleListener() {
	$('form').hover(function() {
		$('.icon-add-files').attr('style', 'opacity: 1')
	}, function() {
		$('.icon-add-files').attr('style', 'opacity: 0.65');
	});
}


function handleFiles() {
	readFiles();
	updateImageDisplay();
}



function readFiles() {
	const EXPECTED_CONTENTS = {
		qw: ['Applicant', 'SSAN', 'DEP Date', 'Days in DEP', 'EAD From', 'EAD To', 'AFSC Pref'],
		jobs: ['AFSC', 'EAD', 'Seats Remaining']
	}

	var currentFiles = input.files;

	for (i=0; i<currentFiles.length; i++) {
		// console.log(currentFiles[i].name);

		if (validFileType(currentFiles[i])) {
			let fileReader = new FileReader();

			fileReader.onload = (fr) => {
				console.log(fr.target.result);
				// XLSX.read(fr.target.result);
				checkFileContents(fr.target.result, EXPECTED_CONTENTS.qw);
				checkFileContents(fr.target.result, EXPECTED_CONTENTS.jobs);

				validFileContents(fr.target.result);
				checkForRequiredFiles();
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
			// console.log(file.type)
			if(file.type === FILE_TYPES[i]) {
			  return true;
			}
		}
		return false;
	}
	
}



function validFileContents(contents) {
	if(contents.slice(0,4) === 'AFSC') {
	// if(contents.slice(0,4) === 'Repo') {
		jobsString = contents;
		// $('#excel').removeClass('icon-disabled');
		$('#icon-jobs').removeClass('icon-disabled');
	} else if(contents.slice(0,4) === 'Repo') {
	// } else if(contents.slice(0,4) === 'Prog') {
		qwString = contents;
		// $('#notepad').removeClass('icon-disabled');
		$('#icon-qw').removeClass('icon-disabled');
	}
}

function checkFileContents(contents, expectedFields) {
	expectedFields.forEach((field) => {
		console.log(field + ': ' + (contents.search(field) === -1));
		// console.log(contents.search(field));
		if (contents.search(field) == -1) {
			console.log(field);
			return false;
		}
	});
	// console.log('matching file!');

}

function checkForRequiredFiles() {
	if(qwString && jobsString) {
		$('#btn-start').removeAttr('disabled');
		$('#btn-start').attr('style','cursor: pointer');

		$('.ion-plus-circled').addClass('ion-checkmark-round');
		$('.ion-checkmark-round').removeClass('ion-plus-circled');
		// $('.ion-close-round').show();
	} else {
		// $('.ion-close-round').hide();
		// $('#btn-start').attr('disabled');
	}
}

function updateImageDisplay() {
}


function parseExcel(fname) {
	XLSX.readFile(fname);
}


function parseDataString(string, delimiter, lineBreak, containsHeader) {
	//Trim the string to remove any blanks, and then split it into lines based on the line break character
	console.log('string:', string);
	lineBreak = formatNewLineDelimiter(lineBreak);
	var lines = string.trim().split(lineBreak);
	var columnNames = [];

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
		//Split each line by commas to get an array of each entry
		var fields = line.split(delimiter);
		fields = fixFragmentedStrings(fields)

		arr.push({});
		for(i=0; i<fields.length; i++) {
			arr[arr.length-1][columnNames[i]] = fields[i];
		}
	});
	return arr;



	function formatNewLineDelimiter(delim) {
		if (delim === '\r\n' || delim === '\n') {
			if (getOs() === 'Windows') {
				delim = '\r\n';
			} else {delim = '\n';}
		}
		return delim;
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
	let link = document.getElementById('csv-link'); //document.createElement("a");
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