<?php

include("shared/global.cfg");
require_once SF_CLASS_PATH.'/csrf_class.inc';

$csrf = new CSRF();

header("HTTP/ 200 OK", true, 200);
header('Content-Type: application/json');
$out = array('csrf_token'=>$csrf->make_token('js-client'));
echo json_encode($out);
exit();


