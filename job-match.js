//====================================================================================
var matchingComplete = false;

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

	qw = preprocessQw(rawData.qw);
	jobs = preprocessJobs(rawData.jobs);
	matchJobs();
	logConsole();

	writeCsv(matches);
	updateDom();
}

function endProgram() {
	programRunning = false;
	resetVariables();
	updateDom();
}


function resetVariables() {
	qw = [];
	jobs = [];
	matches = [];
	bestMatches = [];


	jobsTable = [];
	peopleTable = [];

	for (key in scores) {
		scores[key].best.iteration = -1;
		scores[key].best.score = 0;
		scores[key].best.numMatches = 0;
		scores[key].best.matches = [];

		scores[key].allRuns = [];
	}
}

function preprocessQw(qwRaw) {
	let arr = [];
	for (let i=0; i<qwRaw.length; i++) {
		arr.push({
			prefs: [],
			filledJob: [],
			eadFrom: dateStringToJs(qwRaw[i]['EAD From'], DATE_FORMAT.qw),
			eadTo: dateStringToJs(qwRaw[i]['EAD To'], DATE_FORMAT.qw),
			daysInDep: +qwRaw[i]['Days in DEP'],
			id: qwRaw[i]['SSAN'],
			selected: false,
			originalIndex: i
		});

		for (let n=1; n<=NUM_AFSC_PREFS; n++) {
			let afscPref = 'AFSC Pref ' + n;
			if (qwRaw[i][afscPref] !== '') {
				arr[i].prefs.push({
					afsc: qwRaw[i][afscPref]
				});
			}
		}

		//Remove fields that are no longer needed - only keep those indicated in the qwColsToKeep variable at the beginning of this script
		for (key in arr[i]) {
			if (KEEP_COLUMNS.qw.indexOf(key) == -1) {delete arr[i][key]}
		}
	}

	//Score preferences
	arr.forEach((person) => {
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
	return arr;

} //End preprocessQw


function preprocessJobs(jobsRaw) {
	let arr = [];
	let iJobs = 0;

	for (let i=0; i<jobsRaw.length; i++) {
		//If there is more than one seat, duplicate that row for each seat
		let seats = +jobsRaw[i]['Seats Remaining']

		for (let j=0; j<seats; j++) {
			arr.push({
				ead: dateStringToJs(jobsRaw[i]['EAD'], DATE_FORMAT.jobs),
				afsc: jobsRaw[i]['AFSC'],
				filledBy: undefined,
				originalIndex: iJobs,
				possibleFills: countPossibleFills(jobsRaw[i]['AFSC'], qw)
			});
			iJobs++;
		}
	}
	return arr;

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

			///////////////Working here on making the jobs table
			if (jobsTable.length > 0 && 
				jobsTable.map(a => a.afsc).indexOf(job.afsc) !== -1 &&
				jobsTable.map((a) => {if(!a.ead) {return 0} else {return a.ead.getTime()}}).indexOf() !== 

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
	matchingComplete = true;


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
} // End match jobs



function logConsole() {
	console.log('qw:', qw);
	console.log('jobs:', jobs);
	console.log('matches:', matches);
	console.log('scores:', scores);
}
