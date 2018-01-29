var input = document.querySelector('input');
var preview = document.querySelector('.preview');

// input.style.opacity = 0;

input.addEventListener('change', updateImageDisplay);


function updateImageDisplay() {
	//removes all items within the preview element
	while(preview.firstChild) {
	preview.removeChild(preview.firstChild);
	}

	var curFiles = input.files;
	if(curFiles.length === 0) {
		var para = document.createElement('p');
		para.textContent = 'No files currently selected for upload';
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
		    image.src = window.URL.createObjectURL(curFiles[i]);

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
  'image/jpeg',
  'image/pjpeg',
  'image/png'
]

function validFileType(file) {
	console.log(file.type)
	for(var i = 0; i < fileTypes.length; i++) {
	if(file.type === fileTypes[i]) {
	  return true;
	}
	}

	return false;
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
