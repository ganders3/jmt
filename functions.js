function parseCsv(string) {
	var lineBreak = formatLineBreak('\r\n');
	return parseString(string, ',', lineBreak);
}

function parseString(string, delimiter, lineBreak) {
	var arr = [];
	var lines = string.split(lineBreak);

	for (let i=0; i < lines.length; i++) {
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
		{jsType: '.xls', fileType: 'excel'},
		{jsType: '.xlsx', fileType: 'excel'}
	];

	for (var i=0; i<FILE_TYPES.length; i++) {
		if (file.name.endsWith(FILE_TYPES[i].jsType)) {return FILE_TYPES[i].fileType}
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
	var expectedHeader = headerSpecs.map(a => a.header);
	var canBeBlank = headerSpecs.map(a => a.canBeBlank);

	while (array.length > 0 && !isHeaderLine(array[0], expectedHeader)) {
		array.splice(0, 1);
	}

	var header = array[0];

	for (let i=array.length-1; i > -1; i--) {
		if (!isValidDataLine(array[i], header, expectedHeader, canBeBlank)) {array.splice(i, 1)}
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
	//If the line doesn't contain at least as many fields as the header
	if (line.length < header.length) {return false}
	//Search through each field in the current line
	for (let j=0; j < line.length; j++) {
		//If the field is empty, investigate further
		if (!line[j] || line[j].trim() === '') {
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


function writeCsv(array, linkToElement, fileName) {
	const CSV_METADATA = 'data:text/csv;charset=utf-8,';
	//Append each row's data to the csv output data
	var csvContent = CSV_METADATA;
	array.forEach((row) => {
		//Initialize current row content to a blank string
		let rowContent = '';
		//Loop through each key
		for (key in row) {
			//if the data headers have not yet been set (the only thing in the CSV is the metadata), set them now
			if (csvContent === CSV_METADATA) {
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

	let link = document.getElementById(linkToElement);
	if (link === null) {
		link = document.createElement('a');
		let text = document.createTextNode('Download csv');
		link.appendChild(text);
		document.body.appendChild(link);
	}
	link.setAttribute('href', encodedUri);

	if (!fileName) {fileName = 'file.csv'}
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
	let output = arr1.filter(i => arr2.indexOf(i) !== -1);
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

function dateJsToExcel(dtInputJs) {
	let excelRefDate = new Date('Dec 31, 1899');
	let millisecondsPerDay = 1000*60*60*24;

	return Math.ceil(dtInputJs/millisecondsPerDay) + -1*(Math.floor(excelRefDate/millisecondsPerDay)); 
}




function getOs() {
	let OS_LIST = [
		{platformName: 'Windows', os: 'Windows'},
		{platformName: 'Windows', os: 'Windows'},
		{platformName: 'Mac', os: 'Mac'},
		{platformName: 'Linux', os: 'Linux'}
	];
	let os = navigator.platform;
	for (let i=0; i<OS_LIST.length; i++) {
		if (os.search(OS_LIST[i].platformName) !== -1) {
			return OS_LIST[i].os;
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


function reduceSum(accumulator, currentValue) {
	return accumulator + currentValue;
}


function drawStackedBar(canvasId, vals, colors) {
	let canvas = document.getElementById(canvasId);
	let ctx = canvas.getContext('2d');

	canvas.height = 75;
	
	if (vals.length !== colors.length) {return}

	let valsTotal = vals.reduce(reduceSum);
	let x = 0;
	let currWidth = 0;
	for (let i=0; i < vals.length; i++) {
		let currWidth = canvas.width*(vals[i]/valsTotal);

		ctx.fillStyle = colors[i];
		ctx.fillRect(x, 0, currWidth, canvas.height);

		ctx.fillStyle = '#000';
		ctx.font = '1rem Calibri';
		ctx.fillText(vals[i], x + currWidth/2, 0.5*canvas.height);

		x += currWidth;
	}
}

function drawText(canvasId, textX, textY, fillColor){
    canvasContext.fillStyle=fillColor;
    canvasContext.fillText(showText, textX, textY);
}

function fixAfsc(afsc) {
	let rep = /\.0+E{1}\+/;
	let result = afsc.replace(rep, 'E');

	while (result.length < 5) {result = result.replace('E', 'E0')}
	return result;
}

function createCanvas(w, h, ratio, id) {
	if (!ratio) {ratio = getPixelRatio()}
	let canvas = document.createElement('canvas');
	canvas.width = w*ratio;
	canvas.height = h*ratio;
	canvas.style.width = w + 'px';
	canvas.style.height	= h + 'px';
	canvas.getContext('2d').setTransform(ratio, 0, 0, ratio, 0, 0);

	if (id) {canvas.id = id}

	return canvas;
}

function getPixelRatio() {
	let ctx = document.createElement('canvas').getContext('2d');
	let devicePixelRatio = window.devicePixelRatio || 1;
	let backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
                            ctx.mozBackingStorePixelRatio ||
                            ctx.msBackingStorePixelRatio ||
                            ctx.oBackingStorePixelRatio ||
                            ctx.backingStorePixelRatio || 1;

    return devicePixelRatio/backingStoreRatio;
}