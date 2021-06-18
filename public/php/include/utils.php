<?php

function response(int $retcode, string $message = '', $data = null)
{
    $r = array(
        'retcode' => $retcode,
        'message' => $message,
        'data' => $data
    );
    die(json_encode($r));
}