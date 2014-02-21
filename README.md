# IO Datagrid jQuery Plugin

## Highlights

* Simple to configure jQuery Datagrid Plugin
* Uses condensed json data format to improve download time from server
* Allows server side and local on fly data filters
* Uses standard default Bootstrap css but remains 100% configurable
* Is capable of using browser storage to cache json data


## Example code


The HTML markup:

```html
<div id="datagrid" class="datagrid"></div>
```

The JS code:

```js
$(document).ready(function(){
    // declare datagrid options
    var dg_options = {
        // set the server url from which you get the json data
        url:                'datasource.json',
        // you can apply to each element of a row a callback function
        colFx:              [null       ,red            ,null           ,null       ,null           ,null],
        // set columns titles
        colTitles:          ['id'       ,'First Name'   ,'Last Name'    ,'Website'  ,'Birthdate'    ,"Subscribed"],
        // attach to each column a the source from you json data
        colNames:           ['id'       ,'firstname'    ,'lastname'     ,'website'  ,'birthdate'    ,'subscribed'],
        // set order by column
        colOrder:           ['asc'      ,'asc'          ,'asc'          ,'asc'      ,'desc'         ,'desc'],
        // set column widths
        colWidths:          ['50px'     ,''             ,''             ,'120px'    ,'120px'        ,'120px']
    };
    
    // instantiate
    $('#datagrid').IODatagrid(dg_options);
    
    // callback function
    function red(node) {
        $(node).css("color":"red")    
    }
    
});
```

The PHP code:

```php
<?php
$data['head'] = array('id','firstname','lastname','website','birthdate','subscribed');
$data['data'][0] = array(1,'John','Doe','http://johndoe.com','1980-04-24','2013-04-24');
echo json_encode($data);
```

## License

Released under the GNU Affero General Public License
