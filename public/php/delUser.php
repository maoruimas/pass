<?php

include_once 'include/UserDataBase.php';
include_once 'include/utils.php';

$name = $_POST['name'];
$pwd = $_POST['pwd'];

$db = new UserDataBase('../data');

try {
    $db->delUser($name, $pwd);
    response(0);
} catch(Error $e) {
    response(-1, $e->getMessage());
}