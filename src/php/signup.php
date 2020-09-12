<?php

include_once 'db.php';

$username = $_POST['username'];
$data = $_POST['data'];

if (getData($username)) {
    die('用户已存在');
}

$query = "INSERT INTO users (username, data) VALUES ('$username', '$data')";
if (!$db->query($query)) {
    die('注册失败：'.$db->error);
}