<?php

include_once 'db.php';

$old = $_POST['old'];
$new = $_POST['new'];

if (getData($new)) {
    die('用户已存在');
}

$query = "UPDATE users SET username='$new' WHERE username='$old'";
if (!$db->query($query)) {
    die('重命名失败：'.$db->error);
}