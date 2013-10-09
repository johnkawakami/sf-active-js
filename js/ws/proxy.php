<?php

$allowed = "la.indymedia.org|www.la.indymedia.org";

if (!isset($_GET['url'])) exit;
$url = $_GET['url'];
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
else if (preg_match( '/\/js\/ws\/regen\.php\?s=combined$/', $url ))
{
	header("Content-Type: application/json");
	$ch = curl_init( $url );
	curl_setopt($ch, CURLOPT_HEADER, 0);
	curl_exec($ch);
	curl_close($ch);
} else {
  echo "invalid url";
}
