<?php

$allowed = "la.indymedia.org|www.la.indymedia.org";

if (!isset($_GET['url'])) exit;
$url = $_GET['url'];

if ($_SERVER['REQUEST_METHOD']=='GET') {
	## only the allowed sites may request
	if (!preg_match( "/^http:\/\/($allowed)/", $url )) exit;
	## only specific urls are allowed
	if (preg_match( '/\/\d\d\d\d\/\d\d\/\d{1,20}\.json$/', $url )) 
	{
		header("Content-Type: application/json");
		$ch = curl_init( $url );
		curl_setopt($ch, CURLOPT_HEADER, 0);
		curl_exec($ch);
		curl_close($ch);
	}
	else if (preg_match( '/\/js\/ws\/regen\.php$/', $url ))
	{
		header("Content-Type: application/json");
		$ch = curl_init( $url );
		curl_setopt($ch, CURLOPT_HEADER, 0);
		curl_exec($ch);
		curl_close($ch);
	}
	else if (preg_match( '/\/archives\/cache\/json\/\d+?\.json$/', $url ))
	{
		header("Content-Type: application/json");
		$ch = curl_init( $url );
		curl_setopt($ch, CURLOPT_HEADER, 0);
		curl_exec($ch);
		curl_close($ch);
	} else {
		echo "invalid url";
	}
} else if ($_SERVER['REQUEST_METHOD']=='POST') {
	if (preg_match( '/\/js\/ws\/post.php$/', $url )) {
		$author = $_POST['author'];
		$subject = $_POST['subject'];
		$text = $_POST['text'];
		// add file handling code later
		$ch = curl_init( 'http://la.indymedia.org/js/ws/post.php' );

		// fixme not done yet
	} else {
		echo "invalid url";
	}
}
