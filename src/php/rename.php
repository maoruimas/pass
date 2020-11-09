<?php

include_once 'db.php';

$old = $_POST['old'];
$new = $_POST['new'];

getAsset($new) or die('用户已存在');

$query = "UPDATE users SET username='$new' WHERE username='$old'";
$db->query($query) or die('重命名失败：'.$db->error);