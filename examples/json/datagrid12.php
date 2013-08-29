<?php
date_default_timezone_set('Europe/Bucharest');

$json_data = file_get_contents('datagrid_10000_rows1.json');
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