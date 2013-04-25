# IO Datagrid jQuery Plugin

## Highlights

* Simple to configure jQuery Datagrid Plugin

## Example code


The HTML markup:

```html
<div id="datagrid" class="datagrid"></div>
```

The JS code:

```js
$(document).ready(function(){
    var dg_options = {
        url:                'datasource.json',
        colFx:              [center     ,null           ,bold          ,link        ,date_fr        ,date_fr],
        colTitles:          ['id'       ,'First Name'   ,'Last Name'    ,'Website'  ,'Birthdate'    ,"Subscribed"],
        colNames:           ['id'       ,'firstname'    ,'lastname'     ,'website'  ,'birthdate'    ,'subscribed'],
        colOrder:           ['asc'      ,'asc'          ,'asc'          ,'asc'      ,'desc'         ,'desc'],
        colWidths:          ['50px'     ,''             ,''             ,'120px'    ,'120px'        ,'120px']
    };
    $('#datagrid').IODatagrid(dg_options);
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
