<?php

include_once 'db.php';

$username = $_POST['username'];

echo getData($username);