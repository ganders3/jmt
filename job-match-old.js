var vm = new Vue({
	el: '#app',
	
	data: {

		//==================================================
		// gregCheck: greg,

		NUM_ITER: 1,
		NUM_AFSC_PREFS: 20,
		DATE_FORMAT: {
			QW: '%Y%m%d',
			JOBS: '%d-%m-%Y'
		},

		KEEP_COLUMNS: {
			QW: ['id', 'prefs', 'eadFrom', 'eadTo', 'daysInDep', 'selected', 'originalIndex', 'filledJob']
		},
		//==================================================

		runProgress: 0,
		programIsRunning: false,

		scores: {
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
		},

		qw: [],
		jobs: [],
		matches: [],
		bestMatches: [],
		// qwUnmatched: [],

		htmlContent: {
			title: 'AFRS Job Match Tool',
			instructions: 'Upload the Q&W and Jobs files, then click the button.',
			downloadResults: 'Download results'
		},

		csvIsReady: false,

	},


	methods: {
		startProgram: function() {
			this.programIsRunning = true;
			d3.csv('data/qw-test.csv', (qwData) => {
				d3.csv('data/jobs-test.csv', (jobsData) => {
					vm.initializeVariables();
					vm.preprocessQw(qwData);
					vm.preprocessJobs(jobsData);
					vm.matchJobs();
					vm.createCsv();
					vm.logConsole();
				});
			});
		},

		endProgram: function() {
			vm.programIsRunning = false;
			vm.initializeVariables();
			// vm.matches = [];
		},

		initializeVariables: function() {
			vm.runProgress = 0;
			vm.csvIsReady = false;
			vm.qw = [];
			vm.jobs = [];
			vm.matches = [];

			for (key in vm.scores) {
				vm.scores[key].best.iteration = -1;
				vm.scores[key].best.score = 0;
				vm.scores[key].best.numMatches = 0;
				vm.scores[key].best.matches = [];

				vm.scores[key].allRuns = [];
			}
		},

		preprocessQw: function(qwData) {
			vm.qw = qwData
			vm.qw.forEach((person, ind) => {
				//Create a new empty array for the person's AFSC preferences
				person.prefs = [];
				person.filledJob = [];
				//Loop through each preference
				for (i=1; i <= vm.NUM_AFSC_PREFS; i++) {
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
				person.eadFrom = vm.convertDate(person['EAD From'], vm.DATE_FORMAT.QW);
				person.eadTo = vm.convertDate(person['EAD To'], vm.DATE_FORMAT.QW);
				//Convert the value to numeric - it reads in as text
				person.daysInDep = +person['Days in DEP'];
				//Give each person a unique ID
				person.id = person['SSAN'];
				//Assign a variable to each person, indicating whether they have been matched to a job
				person.selected = false;
				person.originalIndex = ind;

				//Remove fields that are no longer needed - only keep those indicated in the qwColsToKeep variable at the beginning of this script
				for (key in person) {
					if (vm.KEEP_COLUMNS.QW.indexOf(key) == -1) {delete person[key]}
				}
			}); //End forEach person

			//Score preferences
			vm.qw.forEach((person) => {
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
		}, //End preprocessQw

		preprocessJobs: function(jobsData) {
			let iJobs = 0;
			for (i=0; i<jobsData.length; i++) {
				//If there is more than one seat, duplicate that row for each seat
				let seats = +jobsData[i]['Seats Remaining']
				for (j=0; j<seats; j++) {
					vm.jobs.push({
						ead: vm.convertDate(jobsData[i]['EAD'], vm.DATE_FORMAT.JOBS),
						afsc: jobsData[i]['AFSC'],
						filledBy: undefined,
						originalIndex: iJobs,
						possibleFills: countPossibleFills(jobsData[i]['AFSC'], vm.qw)
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
		}, //end preprocessJobs

		//randomly sort an array
		shuffleArray: function(arr) {
			arr.sort(() => {
				return 0.5 - Math.random();
			});
			return arr;
		},

		matchJobs: function() {
			for (iter=0; iter<vm.NUM_ITER; iter++) {
				initializeMatchData();

				//Add a new element to the scores array for this current iteration
				for (metric in vm.scores) {
					vm.scores[metric].allRuns.push({
						iteration: iter,
						score: 0,
						numMatches: 0,
						matches: []
					});
				}

				//Match each job
				vm.jobs.forEach((job) => {
					let matchingEad = job.ead;
					let matchingAfsc = job.afsc;
					//Append the list of matches
					vm.matches.push({
						jobInd: job.originalIndex,
						qwInd: undefined
					});
					//Filter and sort QW data to find the best match
					let qwFiltered = filterAndSortQw(vm.qw, matchingEad, matchingAfsc);
					//If there is at least 1 person to fill the job
					if (qwFiltered.length > 0) {
						//The index within the qw array of the person matched to this job
						let iMatchingPerson = vm.qw.map((a)=>{return a.id}).indexOf(qwFiltered[0].id);
						//The index within the qw array's matching person's job preference array of the job matched
						let iMatchingAfsc = vm.qw[iMatchingPerson].prefs.map((a)=>{return a.afsc}).indexOf(matchingAfsc);
						job.filledBy = qwFiltered[0].id;
						vm.qw[iMatchingPerson].selected = true;
						vm.qw[iMatchingPerson].filledJob.push({
							ead: matchingEad,
							job: matchingAfsc
						});

						//Increment the current scores with the new match's scores
						for (metric in vm.scores) {
							vm.scores[metric].allRuns[iter].score += vm.qw[iMatchingPerson].prefs[iMatchingAfsc].score[metric];
							vm.scores[metric].allRuns[iter].numMatches++;
						}

						//Save the index of the current match
						vm.matches[vm.matches.length-1].qwInd = vm.qw[iMatchingPerson].originalIndex;
					}
				});

				//Append the matches array with all unmatched people
				//Filter the qw to only unmatched people

				let qwUnmatched = vm.qw.filter((person) => {
					return(person.filledJob.length == 0);
				});

				qwUnmatched.forEach((person) => {
					vm.matches.push({
						jobInd: undefined,
						qwInd: person.originalIndex
					});
				});

				//sort matches array by jobId
				vm.matches.sort((a,b) => {
					return(a.jobInd - b.jobInd);
				});

				//Check each different score metric for a new best value
				for (key in vm.scores) {
					//Checks for the best scores and saves that iteration's values
					if (vm.scores[key].current > vm.scores[key].best) {
						vm.scores[key].best = vm.scores[key].current;
						vm.scores[key].bestIteration = iter;
						vm.scores[key].bestNumMatches = vm.scores.equal.current;
						vm.scores[key].bestMatches = saveIterationData(vm.matches);

						//***************************integrate the line below into the line above - need to fix the write csv function
						vm.bestMatches = saveIterationData(vm.matches);
					}
				}
				findBestMatch();
				updateProgress(iter, vm.NUM_ITER);
			} //End for i = 1 to N ITER


		// scores: {
		// 	equal: {
		// 		best: {
		// 			iteration: -1,
		// 			score: 0,
		// 			numMatches: 0,
		// 			matches: []
		// 		},

		// 		allRuns: []
		// 	},

			
			// vvvvvvvvvvvvvvvvvvvvvvvvvv matchJob functions below vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
			function initializeMatchData() {
				//Reset each score's current value
				for (key in vm.scores) {vm.scores[key].current = 0}

				//Reset each job to be unfilled
				vm.jobs.forEach((job) => {
					job.filledBy = undefined;
				});

				//Randomly sort the jobs order
				// sortJobs();

				//Reset each person to be unselected
				vm.qw.forEach((person) => {
					person.selected = false;
					person.filledJob = [];
				});

				vm.matches = [].slice();
			}


			function sortJobs(random) {
				if (random) {
					vm.jobs = vm.shuffleArray(vm.jobs);
				} else {
					vm.jobs.sort((a,b) => {
						return a.possibleFills - b.possibleFills;
					});
				}
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


			function updateProgress(i, numIter) {
				// console.log('i:', i, 'NUM_ITER:', vm.NUM_ITER);
				vm.runProgress = 100*(i+1)/numIter;
				// console.log('progress:', vm.runProgress);
			}

			function findBestMatch() {
				for (metric in vm.scores) {
					let indexOfMax = vm.scores[metric].allRuns.map((a)=>{return a.score}).indexOf(Math.max(...vm.scores[metric].allRuns.map((a)=>{return a.score})));
					vm.scores[metric].best.iteration = vm.scores[metric].allRuns[indexOfMax].iteration;
					vm.scores[metric].best.score = vm.scores[metric].allRuns[indexOfMax].score;
					vm.scores[metric].best.numMatches = vm.scores[metric].allRuns[indexOfMax].numMatches;
					vm.scores[metric].best.matches= vm.scores[metric].allRuns[indexOfMax].matches;
				}
			}
			//^^^^^^^^^^^^^^^^^^^^^^^^^^^ matchJob functions above ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^


		}, // End match jobs


		createCsv: function() {
			const CSV_METADATA = 'data:text/csv;charset=utf-8,';
			var csvContent = CSV_METADATA;
			//Append each row's data to the csv output data
			vm.bestMatches.forEach((row) => {
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

			vm.csvIsReady = true;
			let encodedUri = encodeURI(csvContent);
			let link = document.getElementById('csv-link'); //document.createElement("a");
			link.setAttribute("href", encodedUri);
			link.setAttribute("download", "mydata.csv");
		},


		// Convert dates to JS format (this is a D3 function)
		convertDate: function(dateInput, dateFormat) {
			var dateParser = d3.time.format(dateFormat).parse;
			return dateParser(dateInput);
		},


		logConsole: function() {
			console.log('qw:', vm.qw);
			console.log('jobs:', vm.jobs);
			console.log('matches:', vm.matches);
			console.log('scores:', vm.scores);
		}

	}, //End methods



	computed: {
	}


});