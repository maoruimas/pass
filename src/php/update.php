<?php

include_once 'db.php';

$username = $_POST['username'];
$data = $_POST['data'];

$asset = getAsset($username) or die('用户不存在');
$file = fopen("../users/$asset", 'w') or die('无法打开数据文件');
fwrite($file, $data) or die('无法写入数据文件');
fclose($file);