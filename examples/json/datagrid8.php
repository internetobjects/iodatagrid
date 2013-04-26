<?php
date_default_timezone_set('Europe/Bucharest');

$json_data = '{"head":["id","title","firstname","lastname","website","phone","cellphone","birthdate","subscribed","tags"],"data":[[1,"Mr.","David","Smith","http:\/\/davidsmith.info","0040223388281","0040740190778","1964-05-23","2011-06-18","A,B,C"],[2,"Mr.","Paul","Lorem","http:\/\/paullorem.com","0040221449292","0040780757340","1976-02-04","2011-10-15","A,B"],[3,"Mr.","John","Angel","http:\/\/johnangel.net","0040253929368","0040782410368","1958-03-15","2011-03-01","B,C"],[4,"Mrs.","Mary","Smith","http:\/\/marysmith.info","0040263380485","0040751298271","1979-07-10","2009-02-10","A"],[5,"Mr.","George","Pop","http:\/\/georgepop.info","0040274876646","0040729168474","1963-12-22","2012-04-04","B"],[6,"Mr.","Paul","Lorem","http:\/\/paullorem.eu","0040274444653","0040756505458","1985-01-19","2010-03-16","A,C"]]}';
$data = json_decode($json_data);

$filters = req('filters', array());
$start_date = val4key($filters, 'start_date');
$end_date = val4key($filters, 'end_date');
$tag = val4key($filters, 'tag');
$other = val4key($filters, 'other');

$temp = new stdClass($data);
$temp->filters = $filters;
$temp->head = $data->head;
$temp->data = $data->data;

if ($start_date!="" || $end_date!="" || $tag!="" || $other!="")
{
    $temp->data = array();
    foreach ($data->data as $values)
    {
        $found = array();
        foreach ($values as $key=>$value)
        {
            if ($data->head[$key]=="birthdate" || $data->head[$key]=="subscribed")
            {
                if ($start_date<=$value && $value<=$end_date)
                {
                    $found['date'] = $values;
                }
            }
            else if ($data->head[$key]=="tags")
            {
                if ($tag!="" && strpos($value, $tag)!==false)
                {
                    $found['tag'] = $values;
                }
            }
            else
            {
                if ($other!="" && strpos($value, $other)!==false)
                {
                    $found['other'] = $values;
                }
            }
        }
        foreach ($found as $values)
        {
            if (
                ($other=="" || ($other!="" && isset($found['other']))) &&
                ($tag=="" || ($tag!="" && isset($found['tag']))) &&
                (isset($found['date']))
            )
            {
                $temp->data[] = $values;
            }
        }
    }
}

echo json_encode($temp);

function req($key, $def='')
{
    return isset($_REQUEST[$key]) ? $_REQUEST[$key] : $def;
}
function val4key($arr, $key, $def='')
{
    return isset($arr[$key]) ? $arr[$key] : '';
}
function echopre($arr)
{
    echo '<pre>';
    print_r($arr);
    echo '</pre>';
}