<?php

include_once 'db.php';

$username = $_POST['username'];
$data = $_POST['data'];

$query = "UPDATE users SET data='$data' WHERE username='$username'";
if (!$db->query($query)) {
    die('更新失败：'.$db->error);
}