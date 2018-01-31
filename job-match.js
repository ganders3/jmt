//====================================================================================
var matchingComplete = false;

const NUM_ITER = 1;
const NUM_AFSC_PREFS = 20;

const DATE_FORMAT = {
	QW: '%Y%m%d',
	JOBS: '%d-%m-%Y'
}

const KEEP_COLUMNS = {
	QW: ['id', 'prefs', 'eadFrom', 'eadTo', 'daysInDep', 'selected', 'originalIndex', 'filledJob']
}

// var scores = {equal: {}, normalized: {}, linear: {}}
var scores = {
	equal: {
		best: {
			iteration: -1,
			score: 0,
			numMatches: 0,
			matches: []
		},

		allRuns: []
	},

	normalized: {
		best: {
			iteration: -1,
			score: 0,
			numMatches: 0,
			matches: []
		},

		allRuns: []
	},

	linear: {
		best: {
			iteration: -1,
			score: 0,
			numMatches: 0,
			matches: []
		},

		allRuns: []
	}
}

var qw = [];
var jobs = [];
var matches = [];
var bestMatches = [];
//====================================================================================


function startProgram() {
	initializeVariables();
	importData();

	preprocessQw();
	preprocessJobs();
	matchJobs();
	logConsole();

	// printResults();
	updateDom();
	createCsv();
}

function endProgram() {
	initializeDom();
	initializeVariables();
}


function initializeVariables() {
	qw = [];
	jobs = [];
	matches = [];

	for (key in scores) {
		scores[key].best.iteration = -1;
		scores[key].best.score = 0;
		scores[key].best.numMatches = 0;
		scores[key].best.matches = [];

		scores[key].allRuns = [];
	}
}


function importData() {
	qwRaw = parseDataString(qwString, ',', '\r\n', true);
	jobsRaw = parseDataString(jobsString, ',', '\r\n', true);
}



function preprocessQw() {
	qw = qwRaw;
	qw.forEach((person, ind) => {
		//Create a new empty array for the person's AFSC preferences
		person.prefs = [];
		person.filledJob = [];
		//Loop through each preference
		for (i=1; i <= NUM_AFSC_PREFS; i++) {
			//Only proceed if there is a preference listed (not blank)
			if (person['AFSC Pref ' + i] != '') {
				//Add the afsc preference score to the (currently empty) prefs array
				person.prefs.push({
					afsc: person['AFSC Pref ' + i],
					// score: 1//scorePreferences('linear')
				});
			}
		} //End for i=1 to NUM_AFSC_PREFS
		//Convert the QW file date formats to JS format
		person.eadFrom = dateStringToJs(person['EAD From'], DATE_FORMAT.QW);
		person.eadTo = dateStringToJs(person['EAD To'], DATE_FORMAT.QW);
		//Convert the value to numeric - it reads in as text
		person.daysInDep = +person['Days in DEP'];
		//Give each person a unique ID
		person.id = person['SSAN'];
		//Assign a variable to each person, indicating whether they have been matched to a job
		person.selected = false;
		person.originalIndex = ind;

		//Remove fields that are no longer needed - only keep those indicated in the qwColsToKeep variable at the beginning of this script
		for (key in person) {
			if (KEEP_COLUMNS.QW.indexOf(key) == -1) {delete person[key]}
		}
	}); //End forEach person

	//Score preferences
	qw.forEach((person) => {
		let n = person.prefs.length;
		for (i=0; i<n; i++) {
			person.prefs[i].score = {};
			//Assigns the same weight to each job, regardless of order
			person.prefs[i].score.equal = 1;
			//Assigns a normalized weight to each job - more preferences mean each individual job holds less weight
			person.prefs[i].score.normalized = 1/n;
			//Assigns a linearly decreasing weight to each job
			person.prefs[i].score.linear = (n-i)/n;
		}
	});
} //End preprocessQw


function preprocessJobs() {
	let iJobs = 0;
	for (i=0; i<jobsRaw.length; i++) {
		//If there is more than one seat, duplicate that row for each seat
		let seats = +jobsRaw[i]['Seats Remaining']
		for (j=0; j<seats; j++) {
			jobs.push({
				ead: dateStringToJs(jobsRaw[i]['EAD'], DATE_FORMAT.JOBS),
				afsc: jobsRaw[i]['AFSC'],
				filledBy: undefined,
				originalIndex: iJobs,
				possibleFills: countPossibleFills(jobsRaw[i]['AFSC'], qw)
			});
			iJobs++;
		}
	}

	function countPossibleFills(afsc, qw) {
		let fills = 0;
		qw.forEach((person) => {
			person.prefs.forEach((pref) => {
				if (pref.afsc == afsc) {fills++}
			});
		});
		return fills;
	}
} //end preprocessJobs


//randomly sort an array
function shuffleArray(arr) {
	arr.sort(() => {
		return 0.5 - Math.random();
	});
	return arr;
}

function matchJobs() {
	for (iter=0; iter<NUM_ITER; iter++) {
		initializeMatchData();

		//Add a new element to the scores array for this current iteration
		for (metric in scores) {
			scores[metric].allRuns.push({
				iteration: iter,
				score: 0,
				numMatches: 0,
				matches: []
			});
		}

		//Match each job
		jobs.forEach((job) => {
			let matchingEad = job.ead;
			let matchingAfsc = job.afsc;
			//Append the list of matches
			matches.push({
				jobInd: job.originalIndex,
				qwInd: undefined
			});
			//Filter and sort QW data to find the best match
			let qwFiltered = filterAndSortQw(qw, matchingEad, matchingAfsc);
			//If there is at least 1 person to fill the job
			if (qwFiltered.length > 0) {
				//The index within the qw array of the person matched to this job
				let iMatchingPerson = qw.map((a)=>{return a.id}).indexOf(qwFiltered[0].id);
				//The index within the qw array's matching person's job preference array of the job matched
				let iMatchingAfsc = qw[iMatchingPerson].prefs.map((a)=>{return a.afsc}).indexOf(matchingAfsc);
				job.filledBy = qwFiltered[0].id;
				qw[iMatchingPerson].selected = true;
				qw[iMatchingPerson].filledJob.push({
					ead: matchingEad,
					job: matchingAfsc
				});

				//Increment the current scores with the new match's scores
				for (metric in scores) {
					scores[metric].allRuns[iter].score += qw[iMatchingPerson].prefs[iMatchingAfsc].score[metric];
					scores[metric].allRuns[iter].numMatches++;
				}

				//Save the index of the current match
				matches[matches.length-1].qwInd = qw[iMatchingPerson].originalIndex;
			}
		});

		//Append the matches array with all unmatched people
		//Filter the qw to only unmatched people

		let qwUnmatched = qw.filter((person) => {
			return(person.filledJob.length == 0);
		});

		qwUnmatched.forEach((person) => {
			matches.push({
				jobInd: undefined,
				qwInd: person.originalIndex
			});
		});

		//sort matches array by jobInd
		matches.sort((a,b) => {
			return(a.jobInd - b.jobInd);
		});

		//Check each different score metric for a new best value
		for (key in scores) {
			//Checks for the best scores and saves that iteration's values
			if (scores[key].current > scores[key].best) {
				scores[key].best = scores[key].current;
				scores[key].bestIteration = iter;
				scores[key].bestNumMatches = scores.equal.current;
				scores[key].bestMatches = saveIterationData(matches);

				//***************************integrate the line below into the line above - need to fix the write csv function
				bestMatches = saveIterationData(matches);
			}
		}
		findBestMatch();
	} //End for i = 1 to N ITER


	// vvvvvvvvvvvvvvvvvvvvvvvvvv matchJob functions below vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
	function initializeMatchData() {
		//Reset each score's current value
		for (key in scores) {scores[key].current = 0}

		//Reset each job to be unfilled
		jobs.forEach((job) => {
			job.filledBy = undefined;
		});

		//Sort jobs based on which are hardest to fill
		jobs.sort((a,b) => {
			return a.possibleFills - b.possibleFills;
		});
		// sortJobs(false);

		//Reset each person to be unselected
		qw.forEach((person) => {
			person.selected = false;
			person.filledJob = [];
		});

		matches = [].slice();
	}


	function filterAndSortQw(qw, matchingEad, matchingAfsc) {
		//Filter the qw to people that meet the criteria:
		let qwFiltered = qw.filter((person) => {
			return (
				person.eadFrom <= matchingEad && //The job EAD is on or after the person's first available date
				(person.eadTo > matchingEad || person.eadTo == null) && //The job is before the person's last available date
				person.prefs.map((p)=>{return p.afsc}).indexOf(matchingAfsc) != -1 && //The person has the current AFSC on their preference list
				person.selected == false //The person has not yet been selected
				);
		});
		//Sort the filtered list of people by the following criteria:
		qwFiltered.sort((a, b) => {
			return(
				//In order of AFSC preference (highest preference first)
				//Using || sorts on multiple fields...I don't understand how it works
				a.prefs.map((p)=>{return p.afsc}).indexOf(matchingAfsc) - b.prefs.map((p)=>{return p.afsc}).indexOf(matchingAfsc) ||
				b.daysInDep - a.daysInDep //and then in order of number of days in DEP (most to least)
				);
		});
		return qwFiltered;
	} //End function filterAndSortQw



	function saveIterationData(matches) {
		let arr = [];
		matches.forEach((match) => {
			arr[arr.length] = {};

			for (key in match) {arr[arr.length-1][key] = match[key]}
			i++;
		});
		return arr;
	}

	function findBestMatch() {
		for (metric in scores) {
			let indexOfMax = scores[metric].allRuns.map((a)=>{return a.score}).indexOf(Math.max(...scores[metric].allRuns.map((a)=>{return a.score})));
			scores[metric].best.iteration = scores[metric].allRuns[indexOfMax].iteration;
			scores[metric].best.score = scores[metric].allRuns[indexOfMax].score;
			scores[metric].best.numMatches = scores[metric].allRuns[indexOfMax].numMatches;
			scores[metric].best.matches= scores[metric].allRuns[indexOfMax].matches;
		}
	}
	//^^^^^^^^^^^^^^^^^^^^^^^^^^^ matchJob functions above ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
	matchingComplete = true;
} // End match jobs


function createCsv() {
	const CSV_METADATA = 'data:text/csv;charset=utf-8,';
	var csvContent = CSV_METADATA;
	//Append each row's data to the csv output data
	bestMatches.forEach((row) => {
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
	link.setAttribute("href", encodedUri);
	link.setAttribute("download", "mydata.csv");
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


function logConsole() {
	console.log('qw:', qw);
	console.log('jobs:', jobs);
	console.log('matches:', matches);
	console.log('scores:', scores);
}



function updateDom() {

	$('#sec-intro').hide('fast');
	$('#sec-file-browse').hide('fast');
	$('#sec-results').show('fast');

	// Empty the html elements containing the list of matches and the results
	$('#card-deck-scores').empty();
	$('#match-list').empty();

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
