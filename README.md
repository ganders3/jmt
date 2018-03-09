# Job Match Tool

## Description
This is a tool for recruiters to macth their recruits to open jobs. It performs matching to jobs for recruits who (1) have the jobs listed in their preferences, and (2) are available during the job's EAD date.

The program requires a Q&W file from AFRISS and an Open Jobs file from TTMS.

## Primary improvements
* Generate csvs and Excel files for jobs and qw list, save as a zip file
* Refactor code - move all controls to constants.js
* Remove iterative feature from code - comment out or delete?

## Secondary improvements
* Add bar charts showing the proportion of jobs/people matched and unmatched. Use D3 or base JS
* Make the file upload section more user-friendly and intuitive
