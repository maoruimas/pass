<?php

$dbHost     = 'localhost';
$dbUsername = 'root';
$dbPassword = '';

$db = new mysqli($dbHost, $dbUsername, $dbPassword);

if ($db->connect_error) {
    die('无法连接数据库：'.$db->connect_error);
}

$query = 'CREATE DATABASE IF NOT EXISTS pass';
if (!$db->query($query)) {
    die('无法创建数据库：'.$db->error);
}
$db->select_db('pass');

$query = 'CREATE TABLE IF NOT EXISTS users (
    username VARCHAR(64) NOT NULL PRIMARY KEY,
    data TEXT NOT NULL
)';
if (!$db->query($query)) {
    die('无法创建数据表：'.$db->error);
}

function getData($username) {
    global $db;
    $query = "SELECT data FROM users WHERE username='$username'";
    $result = $db->query($query);
    if ($result->num_rows == 1) {
        return $result->fetch_assoc()['data'];
    } else {
        return '';
    }
}