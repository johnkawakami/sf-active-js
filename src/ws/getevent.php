<?php

include("shared/global.cfg");

$id = $_GET['id'];
$id = intval($id); // it must be an integer
if (!$id) { // id must be present
  echo "blank parameter";
	exit;
}

$db_obj = new DB;
$query = "SELECT start_date,event_id,duration,location_other,location_details,title,contact_name,contact_phone,contact_email,description,mime_type,artmime,linked_file FROM  WHERE event_id=".$id;
$result = $db_obj->query($query);
$article = array_pop($result);
$date = $article['start_date'];
$event_id = $article['event_id'];
$year = substr($ts_date,0,4);
$pathtoyear= SF_CACHE_PATH . "/calendar/event_cache/$year/";
$pathtofile = $pathtoyear.$event_id.".json";
if (!file_exists( $pathtofile )) {
	// json file doesn't exist, so we generate it here
	// move to a library asap
	if (!file_exists( $pathtoyear )) {
		mkdir( $pathtoyear );
	}
	$output = array();
	// output object is based on icalendar's vevent
	$output['summary'] = $article['title'];
	// All elements are parameters (attributes), except _content, which is the content (the stuff after the colon in icalendar)
	// icalendar syntax reminder
	// NAME;ATTRIB=value:The Actual Content Goes Here
	$output['description'] = array(
		'mime-type' => $article['artimime'],
		'_content' => $article['description']
	);
	$output['dtstart'] = date_to_dtstamp($article['start_date']);
	$output['dtend'] = date_to_dtstamp( add_duration( $article['start_date'], $article['duration'] ) );
	$output['organizer'] = organizer_line( $article['contact_name'], $article['contact_phone'], $article['contact_email'] );
	$output['location'] = location_line( $article['location_other'], $article['location_details'] );
	$output['attach'] = array(
		'fmttype' => $article['artmime'],
		'_content' => linked_file_to_url($article['linked_file'])
	);

	$fh = fopen( $pathtofile, 'w' );
	fwrite( $fh, json_encode( $output ) );
	fclose( $fh );
}

header("Content-type: application/json");
echo( file_get_contents( $pathtofile ) );
exit;

// ugly functions that would ruin comprehension

function date_to_dtstamp( $date ) {
}
function add_duration( $date, $duration ) {
}
function organizer_line( $name, $phone, $email ) {
}
function location_line( $short, $long ) {
}
function linked_file_to_url( $path ) {
}
