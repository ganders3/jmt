# Job Match Tool

## Description
This is a tool for recruiters to macth their recruits to open jobs. It performs matching to jobs for recruits who (1) have the jobs listed in their preferences, and (2) are available during the job's EAD date.

The program requires a Q&W file from AFRISS and an Open Jobs file from TTMS.

## Planned improvements
* Add bar charts showing the proportion of jobs/people matched and unmatched. Use D3 or base JS
* Improve the parse files function:
  * Read .xlsx files
  * Check for invalid characters, headers, metadata, etc.
  * Add compatibility on Linux - change \r\n to \n (unnecessary in all likelihood since recruiters will be using Windows, but for completeness)
* Make the file upload section more user-friendly and intuitive
