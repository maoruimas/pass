<?php

$dbHost     = 'localhost';
$dbUsername = 'root';
$dbPassword = '';

$db = new mysqli($dbHost, $dbUsername, $dbPassword);

if ($db->connect_error) {
    die('无法连接数据库：'.$db->connect_error);
}

$query = 'CREATE DATABASE IF NOT EXISTS pass';
$db->query($query) or die('无法创建数据库：'.$db->error);
$db->select_db('pass');

$query = 'CREATE TABLE IF NOT EXISTS users (
    username CHAR(64) NOT NULL PRIMARY KEY,
    asset CHAR(8) NOT NULL
)';
$db->query($query) or die('无法创建数据表：'.$db->error);

if (!is_dir('../users')) {
    mkdir('../users') or die('无法创建用户文件夹');
}

function getAsset($username) {
    global $db;
    $query = "SELECT asset FROM users WHERE username='$username'";
    $result = $db->query($query);
    if ($result->num_rows == 1) {
        return $result->fetch_assoc()['asset'];
    } else {
        return false;
    }
}