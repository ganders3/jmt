var input = document.querySelector('input');
var preview = document.querySelector('.preview');

// var input = $('input');
// var preview = $('.preview');
// input.style.opacity = 0;

input.addEventListener('change', handleFiles); //updateImageDisplay);
//******************* figure out how to get IE to work when files are added ********************
// input.attachEvent('onchange', handleFiles);

function handleFiles() {
	updateImageDisplay();
	// console.log(input.files);
	readFiles();
}


function readFiles() {
	// console.log('files:', input.files);
	var currentFiles = input.files;
	for(i=0; i<currentFiles.length; i++) {
		// console.log(currentFiles[i]);

		if(validFileType(currentFiles[i])) {
			let fileReader = new FileReader();
			fileReader.onload = (fr) => {
				// console.log('fr.target.result:', fr.target.result);
				// console.log('fr.target.result.length:', fr.target.result.length);
				// console.log('fr.target.result.search(newline):', fr.target.result.search('\n'));

				validFileContents(fr.target.result);
			}
			fileReader.readAsText(currentFiles[i]);
			// console.log('fileReader:',fileReader);


		}
		// console.log(file.name);
	}
}

function validFileContents(contents) {
	if(contents.slice(0,4) === 'AFSC') {
		jobsString = contents;
	} else if(contents.slice(0,4) === 'Prog') {
		qwString = contents;
	}
}


function updateImageDisplay() {
	//removes all items within the preview element
	while(preview.firstChild) {
	preview.removeChild(preview.firstChild);
	}

	var curFiles = input.files;
	if(curFiles.length === 0) {
		var para = document.createElement('p');
		para.textContent = 'No files selected';
		preview.appendChild(para);
	} else {
		var list = document.createElement('ol');
		preview.appendChild(list);
		for(var i = 0; i < curFiles.length; i++) {
		  var listItem = document.createElement('li');
		  var para = document.createElement('p');
		  if(validFileType(curFiles[i])) {
		    para.textContent = curFiles[i].name + ', file size ' + returnFileSize(curFiles[i].size) + '.';
		    var image = document.createElement('img');
		    image.src = 'img/icon-notepad.png';

		    listItem.appendChild(image);
		    listItem.appendChild(para);

		  } else {
		    para.textContent = curFiles[i].name + ' is not a valid file type.';
		    listItem.appendChild(para);
		  }

		  list.appendChild(listItem);
		}
	}
}


var fileTypes = [
  'application/vnd.ms-excel'
  // 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]




function validFileType(file) {
	// console.log(file.type)
	for(var i = 0; i < fileTypes.length; i++) {
		if(file.type === fileTypes[i]) {
		  return true;
		}
	}
	return false;
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
		var entries = line.split(delimiter);

		arr.push({});
		for(i=0; i<entries.length; i++) {
			arr[arr.length-1][columnNames[i]] = entries[i];
		}
	});
	return arr;
}





function returnFileSize(number) {
	if(number < 1024) {
		return number + 'bytes';
	} else if(number > 1024 && number < 1048576) {
		return (number/1024).toFixed(1) + 'KB';
	} else if(number > 1048576) {
		return (number/1048576).toFixed(1) + 'MB';
	}
}