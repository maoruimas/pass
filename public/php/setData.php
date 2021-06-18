<?php

include_once 'include/UserDataBase.php';
include_once 'include/utils.php';

$name = $_POST['name'];
$pwd = $_POST['pwd'];
$data = $_POST['data'];

$db = new UserDataBase('../data');

try {
    $db->setText($name, $pwd, 'data', $data);
    response(0);
} catch(Error $e) {
    response(-1, $e->getMessage());
}