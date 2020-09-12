<?php

include_once 'db.php';

$username = $_POST['username'];

$query = "DELETE FROM users WHERE username='$username'";
if (!$db->query($query)) {
    die('删除失败：'.$db->error);
}