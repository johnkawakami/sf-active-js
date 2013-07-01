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

// machine-dependent configs
if (0) {
	$sf_active_config_path = "/www/la.indymedia.org/local/config/sfactive.cfg";
} else {
	$sf_active_config_path = "/home/johnk/Sites/la.indymedia.org/local/config/sfactive.cfg";
}

// script configs
$max_stories = 15;

// sf-active configs to import
list( $dbhost, $dbname, $dbuser, $dbpass, $production_category_id ) = get_settings();

// global cache var
$webcast = NULL;

// parameter s selects which data to get
$select = $_GET['s'];
switch($select) {
	case 'features': 
		echo json_encode( select_features($production_category_id) );
	break;
	case 'breakingnews': 
		echo json_encode( select_breakingnews() );
	break;
	case 'calendar': 
		echo json_encode( select_calendar() );
	break;
	case 'local': 
		echo json_encode( select_local() );
	break;
	case 'combo':  // all the feeds in one
		echo json_encode(
			array( 
			    'local' => select_local(),
				'features' => select_features($production_category_id),
			    'breakingnews' => select_breakingnews(),
			    'calendar' => select_calendar()
			)
		);
	break;
}
exit;

function select_breakingnews() {
	global $webcast, $max_stories;
	load_webcast();
	$count = 0;
	// filter in status='l' and count to $max_stories
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
	return $output;
}

function select_calendar() {
	return array();
}

function select_local() {
	global $webcast, $max_stories;
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
// cache a copy of last 1000 webcast posts, so we do only one sql query
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
	$features = array_map( 
		function($a) {
			$b = array();
			$b['id'] = $a['feature_id'];
			$b['url'] = '/cache/';
			$b['title'] = $a['title'];
			$b['date'] = substr($a['date'],6,4).'/'.
			             substr($a['date'],0,2).'/'.
			             substr($a['date'],3,2);
			return $b;
		},
		$features );
	return $features;
}

// UTILITIES

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
	return new PDO( "mysql:dbname=$dbname;host=$dbhost", $dbuser, $dbpass );
}



