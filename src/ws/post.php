<?php
/* 
Note that this script cannot be run through the proxy.
It can only run on the server.  Running it in the test
envrionment, at this time, only updates the test database.
It doesn't affect the production database which delivers
content to the test environment.
 */

include("shared/global.cfg");
require_once SF_CLASS_PATH.'/csrf_class.inc';

$csrf_token = filter_input(INPUT_POST, 'csrf_token',
    FILTER_VALIDATE_REGEXP, array('options'=>array('regexp'=>"/[0-9a-f]{1,32}/")));
$csrf = new CSRF();
if (! $csrf->validate_token($csrf_token)) {
    http_error_400("Invalid Form ".$csrf_token);
}

if (get_magic_quotes_gpc()) {
    foreach($_POST as $k=>$v) {
        $_POST[$k] = stripslashes($v);
    }
}
$author = $_POST['author'];
$subject = $_POST['subject'];
$text = $_POST['text'];
$parent_id = filter_var($_POST['parent_id'], FILTER_VALIDATE_INT,
    array(
        'options'=>array(
            'default'=>NULL,
            'min_range'=>1,
            'max_range'=>2000000
        )
    )
);
if ($parent_id==NULL) http_error_400("Bad Parent ID");

$pdo = new PDO(DB_VENDOR.':host='.DB_HOSTNAME.';dbname='.DB_DATABASE.';charset=utf8',
    DB_USERNAME, DB_PASSWORD);
$sth = $pdo->prepare("SELECT COUNT(*) FROM webcast WHERE id=:parent_id");
$sth->bindParam(':parent_id', $parent_id, PDO::PARAM_INT);
$sth->execute();
$row = $sth->fetch();
if ((int)$row[0]!=1) {
    http_error_400("Bad Parent ID");
}

$sth = $pdo->prepare("INSERT INTO webcast (heading, author, article, parent_id, arttype, modified, created) VALUES (:heading, :author, :article, :parent_id, 'news-response', NOW(), NOW())");
$sth->bindParam(':heading', $subject, PDO::PARAM_STR, 128);
$sth->bindParam(':author', $author, PDO::PARAM_STR, 128);
$sth->bindParam(':article', $text, PDO::PARAM_STR);
$sth->bindParam(':parent_id', $parent_id, PDO::PARAM_INT);
$sth->execute();

// increment numcomment
$sth = $pdo->prepare("UPDATE webcast SET numcomment=(numcomment+1) WHERE id=?");
$sth->execute(array($parent_id));

$article = new Article($parent_id);
$article->render_everything();
$article->cache_to_disk();

header("HTTP/ 200 OK", true, 200);
header('Content-Type: application/json');
$out = array('status'=>200, 'author'=>$author, 'subject'=>$subject, 'text'=>$text);
echo json_encode($out);
exit();

//------------------------------------------------------------end

function http_error_400($msg) {
    header("HTTP/ 400 $msg", true, 400);
    header('Content-Type: application/json');
    $out = array('status'=>400, 'error'=>$msg);
    echo json_encode($out); 
    exit();
}
