<?php

include_once 'db.php';

$username = $_POST['username'];

$asset = getAsset($username) or die('用户不存在');

unlink("../users/$asset") or die('删除失败：无法删除数据文件');

$query = "DELETE FROM users WHERE username='$username'";
$db->query($query) or die('删除失败：'.$db->error);