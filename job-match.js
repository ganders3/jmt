//====================================================================================
var matchingComplete = false;

const NUM_ITER = 1;
const NUM_AFSC_PREFS = 20;

const DATE_FORMAT = {
	QW: '%Y%m%d',
	JOBS: '%d-%m-%Y'
}

// const EXPECTED_FIELDS = {
// 	qw: [
// 		{header: 'SSAN', canBeBlank: false},
// 		{header: 'Days in DEP', canBeBlank: false},
// 		{header: 'EAD From', canBeBlank: false},
// 		{header: 'EAD To', canBeBlank: false},
// 		{header: 'AFSC Pref 1', canBeBlank: false},
// 		{header: 'AFSC Pref 2', canBeBlank: true},
// 		{header: 'AFSC Pref 3', canBeBlank: true},
// 		{header: 'AFSC Pref 4', canBeBlank: true},
// 		{header: 'AFSC Pref 5', canBeBlank: true},
// 		{header: 'AFSC Pref 6', canBeBlank: true},
// 		{header: 'AFSC Pref 7', canBeBlank: true},
// 		{header: 'AFSC Pref 8', canBeBlank: true},
// 		{header: 'AFSC Pref 9', canBeBlank: true},
// 		{header: 'AFSC Pref 10', canBeBlank: true},
// 		{header: 'AFSC Pref 11', canBeBlank: true},
// 		{header: 'AFSC Pref 12', canBeBlank: true},
// 		{header: 'AFSC Pref 13', canBeBlank: true},
// 		{header: 'AFSC Pref 14', canBeBlank: true},
// 		{header: 'AFSC Pref 15', canBeBlank: true},
// 		{header: 'AFSC Pref 16', canBeBlank: true},
// 		{header: 'AFSC Pref 17', canBeBlank: true},
// 		{header: 'AFSC Pref 18', canBeBlank: true},
// 		{header: 'AFSC Pref 19', canBeBlank: true},
// 		{header: 'AFSC Pref 20', canBeBlank: true}
// 	],

// 	jobs: [
// 		{header: 'AFSC', canBeBlank: false},
// 		{header: 'EAD', canBeBlank: false},
// 		{header: 'Seats Remaining', canBeBlank: false}
// 	]
// }

const KEEP_COLUMNS = {
	QW: ['id', 'prefs', 'eadFrom', 'eadTo', 'daysInDep', 'selected', 'originalIndex', 'filledJob']
}

const SCORE_METHODS = ['equal', 'normalized', 'linear'];
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

//====================================================================================


function startProgram() {
	programRunning = true;
	resetVariables();
	importData();

	preprocessQw();
	preprocessJobs();
	matchJobs();
	logConsole();

	writeCsv(matches);
	updateDom();
}

function endProgram() {
	programRunning = false;
	updateDom();
}


function resetVariables() {
	qw = [];
	jobs = [];
	matches = [];
	bestMatches = [];

	for (key in scores) {
		scores[key].best.iteration = -1;
		scores[key].best.score = 0;
		scores[key].best.numMatches = 0;
		scores[key].best.matches = [];

		scores[key].allRuns = [];
	}
}


function importData() {
	qwRaw = dataStrings.qw;
	jobsRaw = dataStrings.jobs;
	// qwRaw = parseDataString(dataStrings.qw, ',', '\r\n', true, EXPECTED_FIELDS.qw);
	// qw = parseDataString(dataStrings.qw, ',', '\r\n', true);
	// jobsRaw = parseDataString(dataStrings.jobs, ',', '\r\n', true, EXPECTED_FIELDS.jobs);
	// jobs = parseDataString(dataStrings.jobs, ',', '\r\n', true);

	console.log('qwRaw:', qwRaw);
	console.log('jobsRaw:', jobsRaw);
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



function logConsole() {
	console.log('qw:', qw);
	console.log('jobs:', jobs);
	console.log('matches:', matches);
	console.log('scores:', scores);
}
