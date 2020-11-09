<?php

include_once 'db.php';

$username = $_POST['username'];
$data = $_POST['data'];

if (getAsset($username)) {
    die('用户已存在');
}

$asset = '';
do {
    $asset = '';
    $s = '0123456789';
    for ($i = 0; $i < 8; ++$i) {
        $asset .= $s[mt_rand(0, 9)];
    }
} while(file_exists("../users/$asset"));

$file = fopen("../users/$asset", 'w') or die('无法创建数据文件');
fwrite($file, $data) or die('无法写入数据文件');
fclose($file);

$query = "INSERT INTO users (username, asset) VALUES ('$username', '$asset')";
if (!$db->query($query)) {
    unlink("../users/$asset");
    die('注册失败：'.$db->error);
}