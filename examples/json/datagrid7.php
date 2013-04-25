<?php
date_default_timezone_set('Europe/Bucharest');
//header("Content-Type: text/json; charset=UTF-8");

//$titles = array('Mr.', 'Mrs.');
$first_names = array('Adrian', 'Alex', 'Amos', 'Daniel', 'David', 'Diana', 'Gabriel', 'George', 'John', 'Luke', 'Mark', 'Mary', 'Paul', 'Xena');
$last_names = array('Amet', 'Angel', 'Dolor', 'Ipsum', 'Lorem', 'Pop', 'Sit', 'Smith');
$tld = array('.com', '.eu', '.net', '.info');

$data['head'] = array("id","title","firstname","lastname","website","phone","cellphone","birthdate","subscribed");
$data['data'] = array();
$fn_cnt = count($first_names);
$ln_cnt = count($last_names);
$tld_cnt = count($tld);
for ($i = 1; $i <= 6; $i++)
{
    $fn_rand = mt_rand(0, $fn_cnt-1);
    $first_name = $first_names[$fn_rand];
    $title = in_array($first_name, array('Diana', 'Mary', 'Xena')) ? 'Mrs.' : 'Mr.';
    $ln_rand = mt_rand(0, $ln_cnt-1);
    $last_name = $last_names[$ln_rand];
    $tld_rand = mt_rand(0, $tld_cnt-1);
    $website = 'http://'.strtolower($first_name.$last_name).$tld[$tld_rand];
    $phone = '00402'.mt_rand(20, 88).sprintf("%03d", mt_rand(100, 999)).sprintf("%03d", mt_rand(100, 999));
    $cellphone = '00407'.mt_rand(20, 88).sprintf("%03d", mt_rand(100, 999)).sprintf("%03d", mt_rand(100, 999));
    $birthdate = rand_date(1950, 1990);
    $subscribed = rand_date(2009, 2012);
    $data['data'][] = array($i, $title, $first_name, $last_name, $website, $phone, $cellphone, $birthdate, $subscribed);
}

echo json_encode($data);

function rand_date($start=0, $end=0)
{
    $y_rand = mt_rand($start, $end);
    $m_rand = mt_rand(1, 12);
    if ($m_rand==2)
    {
        $leap = date('L', mktime(0, 0, 0, 1, 1, $y_rand));
        $d_rand_end = $leap ? 29 : 28;
    }
    else if ($m_rand<7)
    {
        if ($m_rand%2==0)
        {
            $d_rand_end = 30;
        }
        else
        {
            $d_rand_end = 31;
        }
    }
    else
    {
        if ($m_rand%2==0)
        {
            $d_rand_end = 31;
        }
        else
        {
            $d_rand_end = 30;
        }
    }
    $d_rand = mt_rand(1, $d_rand_end);
    return sprintf("%04d-%02d-%02d", $y_rand, $m_rand, $d_rand);
}