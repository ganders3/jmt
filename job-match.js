function startProgram() {
	programRunning = true;
	resetVariables();
	preprocessFiles();
	matchJobs();
	updateDom();
}


function endProgram() {
	programRunning = false;
	resetVariables();
	updateDom();
}


function resetVariables() {
	if (!programRunning) {
		rawData.qw.data = undefined;
		rawData.jobs.data = undefined;
	}

	qw = [];
	jobs = [];
	matches = [];
}


function preprocessFiles() {
	qw = preprocessQw(rawData.qw.data);
	jobs = preprocessJobs(rawData.jobs.data);


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
}





function matchJobs() {
	initializeMatchData();

	//Match each job
	jobs.forEach((job) => {
		let matchingEad = job.ead;
		let matchingAfsc = job.afsc;

		//Filter and sort QW data to find the best match
		let qwFiltered = filterAndSortQw(qw, matchingEad, matchingAfsc);
		//If there is at least 1 person to fill the job
		if (qwFiltered.length > 0) {
			//The index within the qw array of the person matched to this job
			let iMatchingPerson = qw.map(a => a.id).indexOf(qwFiltered[0].id);
			//The index within the qw array's matching person's job preference array of the job matched
			let iMatchingAfsc = qw[iMatchingPerson].prefs.map(a => a.afsc).indexOf(matchingAfsc);
			job.filledBy = qwFiltered[0].id;
			qw[iMatchingPerson].selected = true;
			qw[iMatchingPerson].filledJob.push({
				ead: matchingEad,
				job: matchingAfsc
			});
		}
	});

	qwTable = createQwTable(qw);
	jobsTable = createJobsTable(jobs);
	summary = createSummary(qw, jobs);

	console.log(qwTable);
	console.log(jobsTable);
	console.log(summary);

	// writeCsv(jobsTable, 'csv-link', 'jobs.csv');




	// vvvvvvvvvvvvvvvvvvvvvvvvvv matchJob functions below vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
	function initializeMatchData() {
		//Reset each job to be unfilled
		jobs.forEach(job => {job.filledBy = undefined});
		//Sort jobs based on which are hardest to fill
		jobs.sort((a,b) => {return a.possibleFills - b.possibleFills});

		//Reset each person to be unselected
		qw.forEach((person) => {
			person.selected = false;
			person.filledJob = [];
		});
	}


	function filterAndSortQw(qw, matchingEad, matchingAfsc) {
		//Filter the qw to people that meet the criteria:
		let qwFiltered = qw.filter(person => {
			return (
				person.eadFrom <= matchingEad && //The job EAD is on or after the person's first available date
				(person.eadTo > matchingEad || person.eadTo == null) && //The job is before the person's last available date
				person.prefs.map(p => p.afsc).indexOf(matchingAfsc) != -1 && //The person has the current AFSC on their preference list
				person.selected == false //The person has not yet been selected
				);
		});
		//Sort the filtered list of people by the following criteria:
		qwFiltered.sort((a, b) => {
			return(
				//In order of AFSC preference (highest preference first)
				//Using || sorts on multiple fields...I don't understand how it works
				a.prefs.map(p => p.afsc).indexOf(matchingAfsc) - b.prefs.map(p => p.afsc).indexOf(matchingAfsc) ||
				b.daysInDep - a.daysInDep //and then in order of number of days in DEP (most to least)
				);
		});
		return qwFiltered;
	} //End function filterAndSortQw



	function createJobsTable(jobs) {
		let output = [];

		for (let i=0; i < jobs.length; i++) {
			let eadIndices = allIndicesOf(output.map(a => a.ead), dateJsToString(jobs[i].ead, DATE_FORMAT.output));
			let afscIndices = allIndicesOf(output.map(a => a.afsc), jobs[i].afsc);
			let intersectingIndices = arrayIntersection(eadIndices, afscIndices);
			let filled = !jobs[i].filledBy ? 0 : 1;

			//If the ead and afsc combination already exists
			if (intersectingIndices.length > 0) {
				let t = intersectingIndices[0]
				output[t].numSeats++;
				output[t].numFilled += filled;
				output[t].numUnfilled = output[t].numSeats - output[t].numFilled;
				if (filled === 1) {output[t].filledBy += '; ' + jobs[i].filledBy}
			} else {
				output.push({
					afsc: fixAfsc(jobs[i].afsc),
					// ead: dateJsToExcel(jobs[i].ead),
					ead: dateJsToString(jobs[i].ead, DATE_FORMAT.output),
					numSeats: 1,
					numFilled: filled,
					numUnfilled: 1 - filled,
					filledBy: filled === 1 ? jobs[i].filledBy : ''
				});
			}
		}
		return output;
	}

	function createQwTable(qw) {
		let output = [];

		for (let i=0; i < qw.length; i++) {
			let job = qw[i].filledJob.length > 0 ? qw[i].filledJob[0].job : 'Unmatched';
			let ead = qw[i].filledJob.length > 0 ? dateJsToString(qw[i].filledJob[0].ead, DATE_FORMAT.output) : '';
			output.push({
				id: qw[i].id,
				job: job,
				ead: ead
			});
		}
		return output;
	}

	function createSummary(qw, jobs) {
		var output = {
			qw: {
				total: 0,
				matched: 0,
				unmatched: 0
			},
			jobs: {
				total: 0,
				filled: 0,
				unfilled: 0
			}
		}

		output.qw.total = qw.length;
		output.qw.matched = qw.filter(a => a.selected).length;
		output.qw.unmatched = qw.filter(a => !a.selected).length;

		output.jobs.total = jobs.length;
		output.jobs.filled = jobs.filter(a => a.filledBy).length;
		output.jobs.unfilled = jobs.filter(a => !a.filledBy).length;

		return output;
	}
	//^^^^^^^^^^^^^^^^^^^^^^^^^^^ matchJob functions above ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
} // End match jobs



function writeXlsxCrappy(jobsTable, qwTable, fileName) {
	var wb = XLSX.utils.book_new();

	var wsJobs = XLSX.utils.json_to_sheet(jobsTable);
	var wsQw = XLSX.utils.json_to_sheet(qwTable);
	XLSX.utils.book_append_sheet(wb, wsJobs, 'Jobs');
	XLSX.utils.book_append_sheet(wb, wsQw, 'Q & W');

	if (!fileName) {fileName = 'data.xlsx'}
	if (!fileName.endsWith('.xlsx')) {fileName += '.xlsx'}

	XLSX.writeFile(wb, fileName);
}