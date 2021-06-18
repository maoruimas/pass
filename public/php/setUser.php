<?php

include_once 'include/UserDataBase.php';
include_once 'include/utils.php';

$name = $_POST['name'];
$pwd = $_POST['pwd'];
$newName = $_POST['newName'];
$newPwd = $_POST['newPwd'];
$data = $_POST['data'];

$db = new UserDataBase('../data');

try {
    if ($newName) {
        $db->setUserName($name, $pwd, $newName);
    } else if ($newPwd && $data) {
        $db->setText($name, $pwd, 'data', $data);
        $db->setUserPwd($name, $pwd, $newPwd);
    }
    response(0);
} catch(Error $e) {
    response(-1, $e->getMessage());
}