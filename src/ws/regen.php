<?php 
/* coding style notes
 * - trying to remove dependencies on the old sf-active code
 * - coding for functionality first, reusability second, but stay DRY
 * - c style code with mostly_underscores in non OO code
 * - java style code with camelCaps and FirstWordCaps in OO code
 * - perl script style variable definitions instead of config files
 */

/* output format
 * json array with these fields
 *   title - what we show
 *   url - to a json file with the content
 *   date - y/m/d
 *   id - raw id number
 *   
 *   The url should not include the machine name.  The current machine is
 *   assumed.
 */

/* fixme - all instances of "feature" should be renamed to "features" 
   including in the css and html */

/**
 * fixme - next version should conform to the HAL standard, as should the
 * client  http://tools.ietf.org/html/draft-kelly-json-hal-06
 */

// machine-dependent configs
if ( $_SERVER['HTTP_HOST'] == 'indymedia.lo' ) {
	$sf_active_config_path = "/home/johnk/Sites/la.indymedia.org/local/config/sfactive.cfg";
	$cache_path = '/tmp/json/';
} else {
	$sf_active_config_path = "/www/la.indymedia.org/local/config/sfactive.cfg";
	$cache_path = '/www/la.indymedia.org/local/cache/';
}
$upload_root = array();
$upload_root[] = '/mnt/ad3/usr/local/www-domains/la.indymedia.org/public/uploads';
$upload_root[] = '/usr/local/sf-active/la.indymedia.org/public/uploads';

// script configs
$max_stories = 15;
$total_stories = 1000;
$max_events = 25;
$cache_expire = 120; //seconds to expire

// sf-active configs to import
list( $dbhost, $dbname, $dbuser, $dbpass, $production_category_id ) = get_settings();

// global cache var
$webcast = NULL;

// JSONP support
if (isset($_GET['callback'])) {
	$callback = $_GET['callback'];
} else {
	$callback = false;
}

// parameter s selects which data to get
if (isset($_GET['s'])) {
    $select = $_GET['s'];
} else {
    $select = 'combined';
}

switch($select) {
  // the individual selects are going to be deprecated
	// the combined is all we should use
	case 'features': 
		$output = json_encode( select_features($production_category_id) );
	break;
	case 'breakingnews': 
		$output = json_encode( select_breakingnews() );
	break;
	case 'calendar': 
		$output = json_encode( select_calendar() );
	break;
	case 'local': 
		$output = json_encode( select_local() );
	break;
	case 'latestcomments': 
		$output = json_encode( select_comments() );
	break;
	case 'combined':  // all the feeds in one
		$output = json_encode( select_combined() );
	break;
}
header('Content-Type: text/javascript');
header('Cache-Control: max-age=3600, public');
$etag = md5($output);
header('ETag: ' . $etag);

// check if-none-match header to see if it matches the etag.
if ($_SERVER['HTTP_IF_NONE_MATCH'] == $etag) {
    header('HTTP/ 304 Not Modified');
    exit();
}

if ($callback) echo $callback . '(';
echo $output; 
if ($callback) echo ');';
exit;

function select_combined() {
	global $max_stories, $cache_path, $production_category_id;
	$cache_filename = 'combined.json';
	$cache_file = $cache_path . $cache_filename;

	$output = read_cache_file( $cache_file );
	if ($output != NULL) return $output;
	
	$output = array(
	    'local' => select_local(),
	    'features' => select_features($production_category_id),
	    'breakingnews' => select_breakingnews(),
	    'latestcomments' => select_comments(),
	    'calendar' => select_calendar()
	);

	write_cache_file( $cache_file, $output );

	return $output;
}

function select_breakingnews() {
	global $webcast, $max_stories, $cache_path;
	$cache_filename = 'breakingnews.json';
	$cache_file = $cache_path . $cache_filename;

	// check the cache
	$output = read_cache_file( $cache_file );
	if ($output != NULL) return $output;

	// otherwise get data from the db
	load_webcast();
	$count = 0;
	// filter in display='l' and count to $max_stories
	$local = array_filter( $webcast,
		function($a) use (&$count) {
			global $max_stories;
			if ($count > $max_stories) return false;
			if ($a['display']=='t' 
				and $a['parent_id']==0 
				and $a['heading']!=null ) {
					$count++;
					return true;
			}
			return false;
		}
	);
	// clean up and remove the display field
	// this also removes the indexes, which pollute the json version
	$output = array();
	foreach($local as $l) {
		$output[] = cleanup_webcast_row( $l );
	}

	write_cache_file( $cache_file, $output );

	return $output;
}

function select_calendar() {
	global $webcast, $max_stories, $cache_path, $upload_root;
	$cache_filename = 'calendar.json';
	$cache_file = $cache_path . $cache_filename;

	$output = read_cache_file( $cache_file );
	if ($output != NULL) return $output;

	$today = '';
	$sql = 
		"SELECT event_id AS id, start_date, duration, title, location_details AS location, 
		contact_name, contact_phone, contact_email, description, 
		artmime, linked_file, mime_type 
		FROM event 
		WHERE unix_timestamp(start_date) > unix_timestamp(now()) - (24*60*60*1) 
		ORDER BY start_date ASC
		";
	try {
		$db = get_pdo_connection();
		$sth = $db->prepare( $sql );
		$sth->execute( array("today"=>$today) );
		$events = $sth->fetchAll( PDO::FETCH_ASSOC );
	} catch(PDOException $e) {
		die( $e->getMessage() );
	}
	// Mangle the result into something that looks more like an article or an email,
	// which is some metadata, a text body, and one or more attachments.
	// Overall, this needs a lot of refactoring.  One version of this needs to 
	// be used to generate a JSON file for each calendar item.  This version 
	// needs to deliver only the title and time information, and maybe location info.
	$output = array();
	foreach( $events as $event )
	{
		$event['url'] = '/calendar/?id=' . $event['id'];

		// Convert the start_date and duration to start and end.
		$start = $event['start_date'];
		$duration = $event['duration'];
		$fmt =  'Y-m-d G:i:s';
		$end = DateTime::createFromFormat( $fmt, $start );
		if ($end === FALSE) die("bad date $start");
		$end->add( new DateInterval( "PT{$duration}M" ));
		unset($event['start_date']);
		unset($event['duration']);
		$event['start'] = $start;
		$event['end'] = $end->format( $fmt );

		// If the artmime is text, convert to html.
		if ($event['artmime']=='t') {
			$event['description'] = preg_replace( '/\r\n/', '<br />', $event['description'] );
		}

		// Delete artmime field.
		unset($event['artmime']);

		// Convert attachment into an array of attachments
		// of form [{"title":"", "body":"", "type":"application/pdf", "url":"url..."}]
		$file = $event['linked_file'];
		foreach( $upload_root as $ur ) {
			$file = str_replace( $ur, '', $file );
		}
		$type = $event['mime_type'];
		$event['attachments'] = array();
		$event['attachments'][] = array(
			'title' => '',
			'body' => '',
			'type' => $type,
			'url' => $file
		);
		unset( $event['linked_file'] );
		unset( $event['mime_type'] );

		// Convert contact info into an array of contacts.
		$event['contacts'] = array();
		$event['contacts'][] = array( 
			'name' => $event['contact_name'],
			'email' => $event['contact_email'],
			'phone' => $event['contact_phone']
		);
		unset($event['contact_name']);
		unset($event['contact_email']);
		unset($event['contact_phone']);
		unset($event['description']);

		// Field names are: id, title, url, start, end, contacts, attachments

		$output[] = $event;
	}
	return $output;
}

function select_local() {
	global $webcast, $max_stories, $cache_path;
	$cache_filename = 'local.json';
	$cache_file = $cache_path . $cache_filename;

	$output = read_cache_file( $cache_file );
	if ($output != NULL) return $output;

	load_webcast();
	$count = 0;
	// filter in status='l' and count to $max_stories
	$local = array_filter( $webcast,
		function($a) use (&$count) {
			global $max_stories;
			if ($count > $max_stories) return false;
			if ($a['display']=='l') {
				$count++;
				return true;
			}
			return false;
		}
	);
	// clean up and remove the display field
	// this also removes the indexes, which pollute the json version
	$output = array();
	foreach($local as $l) {
		$output[] = cleanup_webcast_row( $l );
	}

	write_cache_file( $cache_file, $output );

	return $output;
}

function cleanup_webcast_row( $l ) {
	$id = $l['id'];
	$date = $l['created'];
	// 2012-11-14 12:34:08
	$y = substr( $date, 0, 4 );
	$m = substr( $date, 5, 2 );
	$d = substr( $date, 8, 2 );
	return array(
		'id'=>$id,
		'title'=>$l['heading'],
		'url' => "/news/$y/$m/$id.json",
		'date'=> "$y/$m/$d"
	);
}


function format_as_html( $s ) { return $s; }

// cache a copy of last 1000 webcast posts in memory, so we do only one sql query
function load_webcast() {
	global $webcast;
	if ($webcast) return;
	
	$sql = "
		SELECT id, display, heading, author, created, parent_id
		FROM webcast
		ORDER BY id DESC
		LIMIT 1000
		";
	try {
		$db = get_pdo_connection();
		$sth = $db->prepare( $sql );
		$sth->execute();
		$webcast = $sth->fetchAll( PDO::FETCH_ASSOC );
	} catch(PDOException $e) {
		die( $e->getMessage() );
	}
}

// home page features list
function select_features( $category_id ) {
	global $cache_path;
	$cache_file = $cache_path . 'features.json';
	$output = read_cache_file( $cache_file );
	if ($output != NULL) return $output;

	$home_page_features_sql = 
	  "SELECT feature_id, title2 as title, display_date as date, order_num
		FROM feature 
		WHERE is_current_version=1 
		AND status='c'
		AND category_id=" . $category_id;
	// status values are 'a'rchive 'c'urrent 'h'idden
		
	try {
		$db = get_pdo_connection();
		$sth = $db->prepare( $home_page_features_sql );
		$sth->execute();
		// load it all into an array
		$features = $sth->fetchAll( PDO::FETCH_ASSOC );
	} catch ( PDOException $e ) {
		die( $e->getMessage() );
	}
	
	// sort results by order_num, descending
	usort( $features, 
		function($a, $b) {
			if ($a['order_num'] == $b['order_num']) return 0; 
			if ($a['order_num'] > $b['order_num']) return -1;
			return 1; 
		}
	);
	// mangle the features to resemble news stories
	$features = array_map( 
		function($a) {
			$b = array();
			$b['id'] = $a['feature_id'];
			$b['title'] = $a['title'];
			$b['date'] = substr($a['date'],6,4).'/'.
			             substr($a['date'],0,2).'/'.
			             substr($a['date'],3,2);
			$b['url'] = '/archives/cache/json/'.$b['id'].'.json';
			return $b;
		},
		$features );

	write_cache_file( $cache_file, $features );
	
	return $features;
}

function select_comments() 
{
	global $cache_path;
	$cache_file = $cache_path . '/latestcomments.json';
	$output = read_cache_file( $cache_file );
	if ($output != NULL) return $output;

	$sql = 
	  "SELECT parent_id, comment_id, heading, author, url, comments, postingdate, parentpostingdate
		 FROM commentlist ORDER BY postingdate DESC";
	// status values are 'a'rchive 'c'urrent 'h'idden
		
	try {
		$db = get_pdo_connection();
		$sth = $db->prepare( $sql );
		$sth->execute();
		// load it all into an array
		$comments = $sth->fetchAll( PDO::FETCH_ASSOC );
	} catch ( PDOException $e ) {
		die( $e->getMessage() );
	}
	
	// mangle the comments to resemble news stories
	$comments = array_map( 
		function($a) {
			$b = array();
			$b['id'] = $a['parent_id'];
			$b['title'] = $a['heading'];

			$date = $a['postingdate'];
			$y = substr( $date, 0, 4 );
			$m = substr( $date, 5, 2 );
			$d = substr( $date, 8, 2 );
			$b['date'] = "$y/$m/$d";

			$date = $a['parentpostingdate'];
			$y = substr( $date, 0, 4 );
			$m = substr( $date, 5, 2 );
			$d = substr( $date, 8, 2 );
			$b['url'] = "/news/$y/$m/".$b['id'].'.json';
			return $b;
		},
		$comments );

	write_cache_file( $cache_file, $comments );
	
	return $comments;
}

// UTILITIES

/* cache checking functions */

function read_cache_file( $file ) {
	global $cache_expire;
	$stat = stat( $file );
	if ($stat === FALSE) return FALSE;
	if ($stat['mtime'] + $cache_expire > time()) {
		$output = file_get_contents( $file );
		return unserialize($output);
	}
	return FALSE;
}

function write_cache_file( $file, $data ) {
	global $cache_path;
	mkdir( $cache_path, 0777, TRUE );
	$result = file_put_contents( $file, serialize($data), LOCK_EX );
	if ($result === FALSE) die();
}

/* rather than use the db library, we just extract the values from the 
 * config file
 */
function get_settings() {
	global $sf_active_config_path;
	if (!defined("DB_HOSTNAME")) {
	    include $sf_active_config_path;
	}
	return array( 
		DB_HOSTNAME,
		DB_DATABASE,
        DB_USERNAME,
        DB_PASSWORD,
		$GLOBALS['config_defcategory']
	);
}
// convenience function to get a db connection
function get_pdo_connection() {
	global $dbhost, $dbname, $dbuser, $dbpass;
	return new PDO( "mysql:dbname=$dbname;host=$dbhost;charset=utf8", $dbuser, $dbpass );
}



