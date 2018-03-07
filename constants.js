const NUM_ITER = 1;
const NUM_AFSC_PREFS = 20;

const DATE_FORMAT = {
	qw: '%Y%m%d',
	jobs: '%d-%m-%Y'
}

const KEEP_COLUMNS = {
	qw: ['id', 'prefs', 'eadFrom', 'eadTo', 'daysInDep', 'selected', 'originalIndex', 'filledJob']
}

const SCORE_METHODS = ['equal', 'normalized', 'linear'];

const EXPECTED_FIELDS = {
	qw: [
		{header: 'SSAN', canBeBlank: false},
		{header: 'Days in DEP', canBeBlank: false},
		{header: 'EAD From', canBeBlank: false},
		{header: 'EAD To', canBeBlank: false},
		{header: 'AFSC Pref 1', canBeBlank: false},
		{header: 'AFSC Pref 2', canBeBlank: true},
		{header: 'AFSC Pref 3', canBeBlank: true},
		{header: 'AFSC Pref 4', canBeBlank: true},
		{header: 'AFSC Pref 5', canBeBlank: true},
		{header: 'AFSC Pref 6', canBeBlank: true},
		{header: 'AFSC Pref 7', canBeBlank: true},
		{header: 'AFSC Pref 8', canBeBlank: true},
		{header: 'AFSC Pref 9', canBeBlank: true},
		{header: 'AFSC Pref 10', canBeBlank: true},
		{header: 'AFSC Pref 11', canBeBlank: true},
		{header: 'AFSC Pref 12', canBeBlank: true},
		{header: 'AFSC Pref 13', canBeBlank: true},
		{header: 'AFSC Pref 14', canBeBlank: true},
		{header: 'AFSC Pref 15', canBeBlank: true},
		{header: 'AFSC Pref 16', canBeBlank: true},
		{header: 'AFSC Pref 17', canBeBlank: true},
		{header: 'AFSC Pref 18', canBeBlank: true},
		{header: 'AFSC Pref 19', canBeBlank: true},
		{header: 'AFSC Pref 20', canBeBlank: true}
	],

	jobs: [
		{header: 'AFSC', canBeBlank: false},
		{header: 'EAD', canBeBlank: false},
		{header: 'Seats Remaining', canBeBlank: false}
	]
}