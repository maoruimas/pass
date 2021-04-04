<?php

include_once 'include/UserDataBase.php';
include_once 'include/utils.php';

$name = $_POST['name'];
$pwd = $_POST['pwd'];

$db = new UserDataBase('../data');

try {
    $text = $db->getText($name, $pwd, 'data');
    response(0, '', $text);
} catch(Error $e) {
    response(-1, $e->getMessage());
}