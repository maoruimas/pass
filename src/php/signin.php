<?php

include_once 'db.php';

$username = $_POST['username'];

$asset = getAsset($username);
echo $asset ? $asset : '用户不存在';