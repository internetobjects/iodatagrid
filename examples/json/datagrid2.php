<?php
date_default_timezone_set('Europe/Bucharest');
//header("Content-Type: text/json; charset=UTF-8");

$first_names = array('Adrian', 'Alex', 'Amos', 'Daniel', 'David', 'Diana', 'Gabriel', 'George', 'John', 'Luke', 'Mark', 'Mary', 'Paul', 'Xena');
$last_names = array('Amet', 'Angel', 'Dolor', 'Ipsum', 'Lorem', 'Pop', 'Sit', 'Smith');
$tld = array('.com', '.eu', '.net', '.info');

$data['head'] = array("id","firstname","lastname","website","birthdate","subscribed");
$data['data'] = array();
$fn_cnt = count($first_names);
$ln_cnt = count($last_names);
$tld_cnt = count($tld);
for ($i = 1; $i <= 10000; $i++)
{
    $fn_rand = mt_rand(0, $fn_cnt-1);
    $first_name = $first_names[$fn_rand];
    $ln_rand = mt_rand(0, $ln_cnt-1);
    $last_name = $last_names[$ln_rand];
    $tld_rand = mt_rand(0, $tld_cnt-1);
    $website = 'http://'.strtolower($first_name.$last_name).$tld[$tld_rand];
    $birthdate = rand_date(1950, 1990);
    $subscribed = rand_date(2010, 2013);
    $data['data'][] = array($i, $first_name, $last_name, $website, $birthdate, $subscribed);
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
    return $y_rand.'-'.$m_rand.'-'.$d_rand;
}