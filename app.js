var input = document.querySelector('input');
var preview = document.querySelector('.file-preview');

var qwString;
var jobsString;
// input.style.opacity = 0;

input.addEventListener('change', handleFiles);
//******************* figure out how to get IE to work when files are added ********************
// input.attachEvent('onchange', handleFiles);

// initializeDom();
$(document).ready(() => {
	initializeDom();
});


function initializeDom() {
	$('#btn-run-jmt').attr({
		disabled: 'disabled',
		style: 'cursor: not-allowed'
	});
	// $('#btn-run-jmt').attr('style', 'cursor: not-allowed');
	$('#sec-intro').show('fast');
	$('#sec-file-browse').show('fast');
	$('#sec-results').hide();

	checkForRequiredFiles();
}


function handleFiles() {
	readFiles();
	updateImageDisplay();
}


function readFiles() {	
	var currentFiles = input.files;

	for (i=0; i<currentFiles.length; i++) {
		if (validFileType(currentFiles[i])) {
			let fileReader = new FileReader();

			fileReader.onload = (fr) => {
				validFileContents(fr.target.result);
				checkForRequiredFiles();
			}

			fileReader.readAsText(currentFiles[i]);
		}
	}
	
}


function validFileType(file) {
	const FILE_TYPES = [
		'.csv',
		'text/csv',
		'application/vnd.ms-excel',
  // 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
	];

	for(var i = 0; i < FILE_TYPES.length; i++) {
		// console.log(file.type)
		if(file.type === FILE_TYPES[i]) {
		  return true;
		}
	}
	return false;
}


function validFileContents(contents) {
	if(contents.slice(0,4) === 'AFSC') {
		jobsString = contents;
		// $('#excel').removeClass('icon-disabled');
		$('#icon-jobs').removeClass('icon-disabled');
	} else if(contents.slice(0,4) === 'Prog') {
		qwString = contents;
		// $('#notepad').removeClass('icon-disabled');
		$('#icon-qw').removeClass('icon-disabled');
	}
}

function checkForRequiredFiles() {
	if(qwString && jobsString) {
		$('#btn-run-jmt').removeAttr('disabled');
		$('#btn-run-jmt').attr('style','cursor: pointer');
	}
}

function updateImageDisplay() {
}



function parseDataString(string, delimiter, lineBreak, containsHeader) {
	//Trim the string to remove any blanks, and then split it into lines based on the line break character
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


function returnFileSize(number) {
  if(number < 1024) {
    return number + ' bytes';
  } else if(number > 1024 && number < 1048576) {
    return (number/1024).toFixed(1) + ' KB';
  } else if(number > 1048576) {
    return (number/1048576).toFixed(1) + ' MB';
  }
}