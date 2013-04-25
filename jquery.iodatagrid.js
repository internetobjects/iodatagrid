/**
 * jQuery IO Datagrid Plugin
 * @author  Internet Objects
 * @site    http://internet-objects.ro
 * @date    2013-04-24
 * @version 1.5.1
 */
;(function ($) {
    var debug = false;
    var regex_num = new RegExp('^[0-9]+$'),
        regex_float = new RegExp('^[0-9\.]+$'),
        regex_date = new RegExp('^[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}$');

    /** Plugin Public Methods **/
    var methods = {
        init : function( options ) {
            // Create some defaults, extending them with any options that were provided
            var options = $.extend({}, $.fn.IODatagrid.defaults, options);

            return this.each(function(){
                var $this = $(this),
                    data = $this.data('iodatagrid');

                // If the plugin hasn't been initialized yet
                if ( !data )
                {
                    options._target = $this;
                    data = {
                        settings: options
                    };
                    $(this).data('iodatagrid', data);
                }
                // call datagrid builder
                if (data && data.settings)
                {
                    _buildDatagrid(data.settings);
                }
                else
                {
                    alert('Problem with datagrid!');
                }
            });
        },
        destroy : function( ) {
            return this.each(function(){
                var $this = $(this);
                // Namespacing FTW
                $(window).unbind('.iodatagrid');
                $this.removeData('iodatagrid');
            });
        },
        refresh : function() {
            return this.each(function(){
                var $this = $(this),
                    data = $this.data('iodatagrid');

                // call datagrid builder
                if (data && data.settings)
                {
                    _loadData(data.settings);
                }
                else
                {
                    _dbg('Cannot refresh datagrid!');
                }
            });
        }
    };

    /** Plugin Definition */
    $.fn.IODatagrid = function( method ) {
        if ( methods[method] )
        {
            return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
        }
        else if ( typeof method === 'object' || ! method )
        {
            return methods.init.apply( this, arguments );
        }
        else
        {
            $.error( 'Method ' +  method + ' does not exist on jQuery.IODatagrid' );
        }
    };

    /** Plugin Defaults **/
    $.fn.IODatagrid.defaults = {
        // private properties
        _target: null,
        _rawData: null,
        _jsonTempData: null,
        _numRows: 0,
        _numPages: 0,
        _currentPage: 1,
        // public properties
        url : "",
        colFx: [],
        colTitles: [],
        colNames: [],
        colExtraNames: [],
        colWidths: [],
        extraFields: [],
        dataType: 'json',
        data: {}, // request data
        allowFilter: true,
        allowDynamicFilter: false,
        filterByFields: [],
        filterByLabelText: "",
        filterByLabelTextLength: 22, // if less than 22 chars, will be displayed as placeholder
        orderByField: null,
        orderByFieldDir: null,
        searchLabelText: "Search",
        showReloadButton: true,
        reloadLabelText: "Reload",
        ipp: 10, // items per page
        ippOptions: [2, 5, 10, 20, 50, 100],
        maxMenuItems: 5, // an odd value
        loadingLabelText: "Loading table data... Please wait...",
        itemsLabelText: "Items",
        firstLabelText: "&laquo;",
        prevLabelText: "&lsaquo;",
        nextLabelText: "&rsaquo;",
        lastLabelText: "&raquo;",
        errorLoadingData: 'Error loading table data!',
        iconOrderUp: "icon-chevron-up",
        iconOrderDown: "icon-chevron-down",
        iconOrderDefault: "icon-th",
        width: 600,
        height: 600,
        tableCss: "table table-bordered table-striped",
        paginationCss: "span7 pagination",
        paginationPosition: "header",
        searchCss: "pull-right",
        ippCss: "pull-right", //
        ippPosition: "before .dg-search",
        useLocalStorage: true,
        triggerAfterLoad: null
    };


    /** Plugin Private Methods **/

    /** Trigger event after load **/
    var _eventDataLoaded = function(options) {
        if (typeof(options.triggerAfterLoad) === "function")
        {
            options.triggerAfterLoad();
        }
    }

    /** Build Datagrid **/
    var _buildDatagrid = function(options) {
        if (options.url!="")
        {
            _loadData(options, false);
            _buildTable(options);
            _buildTitles(options);
            _attachClickEventToTitles(options);
            _buildHeaderTag(options);
            _buildFooterTag(options);
            _buildPagination(options);
            _buildFilter(options);
            _buildItemsPerPageSelect(options);
            _buildFoot(options);
        }
    }

    /** Build Table **/
    var _buildTable = function(options) {
        // if datagrid doesn't exist, create it
        if ($('.dg-datagrid', options._target).length==0)
        {
            $(options._target).append('<div class="dg-datagrid"></div>');
        }
        $('.dg-datagrid', options._target).html(
            '<span class="dg-loading label">' + options.loadingLabelText + '</span>'+
            '<table class="dg-display" width="' + options.width + '">'+
                '<thead></thead>'+
                '<tbody></tbody>'+
                '<tfoot></tfoot>'+
            '</table>'
        );
        _setTableCss(options);
    }

    /** Build Titles **/
    var _buildTitles = function(options) {
        var $thead = $('table.dg-display thead', options._target);
        var col = '',
            style = '',
            orderByFieldLink = '';
        if (typeof(options.colTitles) === 'object')
        {
            $thead.find('tr').remove();

            $.each(options.colTitles, function(index, val) {
                // style
                style = (options.colWidths[index]!=undefined && options.colWidths[index]!="" ? ' style="width:' + options.colWidths[index] + ';"' : '');

                // order by
                orderByFieldLink = '';
                if (options.colOrder[index]!=undefined && options.colOrder[index]!='')
                {
                    orderByFieldLink = '<a href="javascript:;" class="pull-right"';
                    if (options.orderByField && options.orderByFieldDir && options.colNames[index]==options.orderByField)
                    {
                        orderByFieldLink += ' order-by="'+options.colNames[index]+'" order-dir="'+
                                    (options.orderByFieldDir=='asc' ? 'desc' : 'asc')+'">';
                        orderByFieldLink += '<i class="' + (options.orderByFieldDir=='asc' ? options.iconOrderUp : options.iconOrderDown) + '"></i>';
                    }
                    else
                    {
                        orderByFieldLink += ' order-by="'+options.colNames[index]+'" order-dir="' + options.colOrder[index]+'">';
                        orderByFieldLink += '<i class="'+options.iconOrderDefault+'"></i>';
                    }
                    orderByFieldLink += '</a>';
                }
                col += '<th' + style + '>' + val + orderByFieldLink + '</th>';
            });

            $thead.prepend('<tr>' + col + '</tr>');
        }
    }

    /** Attach Click Event to Order Links **/
    var _attachClickEventToTitles = function(options) {
        $('table.dg-display thead', options._target).delegate('a', 'click', function(e){
            e.preventDefault();
            // Set new ordering values
            options.orderByField = $(this).attr('order-by');
            options.orderByFieldDir = $(this).attr('order-dir');
            // Sort json according to order params
            _sortJson(options);
            // Refresh table rows after json ordering
            _refreshRows(options);
            // Build title with new ordering values
            _buildTitles(options);
            return false;
        });
    }

    /** Build table foot columns **/
    var _buildFoot = function(options)
    {
        if (options.fxFootCallbacks != undefined) {
            var $tfoot = $('table.dg-display tfoot', options._target);
            if (typeof(options.colTitles) === 'object')
            {
                $tfoot.find('tr').remove();
                var col = '';
                $.each(options.colTitles, function(index, val) {
                    col += '<th></th>';
                });
                $tfoot.prepend('<tr>' + col + '</tr>');
            }
        }
    }

    /** Build table foot callbacks **/
    var _buildFootCallbacks = function(options, data) {
        if (options.fxFootCallbacks != undefined) {
            var i = 1;
            $.each(options.fxFootCallbacks, function(index, fxFootCallbacks) {
                if (typeof(fxFootCallbacks) === 'function')
                {
                    fxFootCallbacks(index, data);
                }
                i++;
            });
        }
    }

    /** Build Header Tag **/
    var _buildHeaderTag = function(options) {
        if ($('div.dg-header', options._target).length == 0)
        {
            $(options._target).prepend('<div class="dg-header row"></div>');
        }
    }

    /** Build Pagination **/
    var _buildPagination = function(options) {
        // if pagination div doesn't exist in header
        if ($('.dg-pagination', options._target).length==0)
        {
            var paginationUI = '<ul>'+
                                    '<li class="dg-items disabled"><a href="javascript:;">'+options.itemsLabelText+' <span></span></a></li>'+
                                    '<li class="dg-first-last dg-first"><a href="javascript:;">'+options.firstLabelText+'</a></li>'+
                                    '<li class="dg-prev-next dg-prev"><a href="javascript:;">'+options.prevLabelText+'</a></li>'+
                                    '<li class="dg-prev-next dg-next"><a href="javascript:;">'+options.nextLabelText+'</a></li>'+
                                    '<li class="dg-first-last dg-last"><a href="javascript:;">'+options.lastLabelText+'</a></li>'+
                                '</ul>';
            // if position in header
            if (options.paginationPosition=='header')
            {
                $('.dg-header', options._target).prepend('<div class="dg-pagination">'+paginationUI+'</div>');
            }
            // if position in footer
            else if (options.paginationPosition=='footer')
            {
                $('.dg-footer', options._target).prepend('<div class="dg-pagination">'+paginationUI+'</div>');
            }
            // set extra pagination css if requested
            _setPaginationCss(options);
        }
    }

    /** Build Filter **/
    var _buildFilter = function(options) {
        if (options.allowFilter)
        {
            var placeHolder = options.filterByLabelText.length>options.filterByLabelTextLength ? '' : options.filterByLabelText;
            var filterByLabelText = options.filterByLabelText.length>options.filterByLabelTextLength ? options.filterByLabelText : '';

            // create search ui element if not exists
            if ($('.dg-search', options._target).length==0)
            {
                $('.dg-header', options._target).prepend(
                    '<div class="dg-search">'+
                        '<div class="input-append">'+
                            '<input class="dg-filter" type="text" value="" placeholder="'+placeHolder+'" />'+
                            '<button class="dg-submit btn" type="submit">'+options.searchLabelText+'</button>'+
                            '<button class="dg-reload btn btn-primary"><i class="icon-refresh icon-white"></i>'+
                                (options.reloadLabelText!="" ? " "+options.reloadLabelText : "")+
                            '</button>'+
                        '</div>'+
                        '<div class="dg-searchby">'+
                            '<em>'+filterByLabelText+'</em>'+
                        '</div>'+
                    '</div>'
                );
                _setSearchCss(options);
            }
            // search by keyup
            if ($('.dg-submit', options._target).length==0)
            {
                $('.dg-filter', options._target).keyup(function(){
                    _searchAction(options, $(this).val());
                });
            }
            // or by button click
            else
            {
                // click on search button
                $('.dg-submit', options._target).click(function(event){
                    event.preventDefault();
                    _searchAction(options, $('.dg-filter', options._target).val());
                    return false;
                });
                // trigger search on Enter
                $('.dg-filter', options._target).keyup(function(event){
                    if (options.allowDynamicFilter || event.keyCode == 13)
                    {
                        $(".dg-submit", options._target).click();
                    }
                });
            }
            // search by
            if ($('.dg-searchby', options._target).length==0 && options.filterByLabelText!="")
            {
                $('.dg-search', options._target).append(
                    '<div class="dg-searchby">'+
                        '<em>'+options.filterByLabelText+'</em>'+
                    '</div>'
                );
            }
            // click on reload button
            $('.dg-reload', options._target).click(function(event){
                event.preventDefault();
                _loadData(options);
                return false;
            });
        }
    }

    /** Build Footer Tag **/
    var _buildFooterTag = function(options) {
        if ($('.dg-footer', options._target).length == 0)
        {
            $(options._target).append('<div class="dg-footer"></div>');
        }
    }

    /** Build Items Per Page Select Box **/
    var _buildItemsPerPageSelect = function(options) {
        if ($('.dg-items-per-page', options._target).length == 0)
        {
            var ippOptionSelectedIndex = -1;
            var ippOptions = '';
            $.each(options.ippOptions, function(index, val) {
                if (val==options.ipp)
                {
                    ippOptionSelectedIndex = index;
                }
                ippOptions += '<option value="' + val + '"' + (val==options.ipp ? ' selected="selected"' : '') + '>'+val+'</option>';
            });
            if (ippOptionSelectedIndex==-1)
            {
                ippOptions = '<option value="' + options.ipp + '" selected="selected">-</option>' + ippOptions;
            }
            var ipp = '<div class="dg-items-per-page"><select>' + ippOptions + '</select></div>';
            var ippPosition = $.trim(options.ippPosition);
            var splitIppPos = ippPosition!="" ? ippPosition.split(' ') : ['after', '.dg-search'];

            if ($.inArray(splitIppPos[0], ['before', 'after']) != -1)
            {
                var ippSiblingCss = (splitIppPos[1] ? splitIppPos[1] : '.dg-search');
                var $ippSibling = $(ippSiblingCss, options._target);

                if ($ippSibling.length == 0)
                {
                    $('.dg-header', options._target).append(ipp)
                    .change(function(){
                        _setItemsPerPage(options);
                    });
                }
                else
                {
                    if (splitIppPos[0] == "before")
                    {
                        $ippSibling.before(ipp)
                        .change(function(){
                            _setItemsPerPage(options);
                        });
                    }
                    else
                    {
                        $ippSibling.after(ipp).change(function(){
                            _setItemsPerPage(options);
                        });
                    }
                }
                _setIppCss(options);
            }
        }
    }

    /** Will refresh datagrid with rows from datasource **/
    var _refreshRows = function(options) {
        // reset num rows
        var numRows = 0;
        // table rows holder
        var tableRows = '';
        var tableRowsData = [];
        // page start / end
        var limitStart = ((options._currentPage - 1) * options.ipp);
        var limitEnd = (options.ipp * options._currentPage);
        // table head
        var tblHead = options._rawData.head;
        // table data
        var tblData = options._rawData.data;
        // Search into parent json or in the filtered json
        var searchObject = (options._jsonTempData != null) ? options._jsonTempData : tblData;

        // for each line from datasource matching our needs
        $.each(searchObject, function (searchObjectRowIndex, searchObjectRow) {
            // rebuild a row for display
            if (numRows >= limitStart && numRows < limitEnd)
            {
                // table row holder
                var tableRow = '';
                // put table row data in an object for later usage in function calls
                var tableRowData = {};
                $.each(tblHead, function(tblHeadIndex, tblHeadColName) {
                    tableRowData[tblHeadColName] = searchObjectRow[tblHeadIndex];
                });

                // iterate through all column names and display only the requested fields
                $.each(options.colNames, function(colNameIndex, colName) {
                    // check if the column name is a multi-column
                    var colNames = colName.split('|');
                    // row value
                    var rowValue = '';
                    // main column name
                    var mainColName = colName;

                    // multi column
                    if (colNames.length > 1)
                    {
                        mainColName = colNames[0];

                        for (var otherColNameIndex in colNames)
                        {
                            var otherColName = colNames[otherColNameIndex];
                            var otherColNameIndexInHead = $.inArray(otherColName, tblHead);
                            // the column was found
                            if (otherColNameIndexInHead != -1)
                            {
                                rowValue += searchObjectRow[otherColNameIndexInHead];
                            }
                            // not a column, maybe a string
                            else
                            {
                                rowValue += otherColName;
                            }
                        }
                    }
                    // one column
                    else
                    {
                        // index of item in json data head
                        var colNameIndexInHead = $.inArray(colName, tblHead);

                        // if item found in json head
                        // (colNameIndexInHead can be different than the colNameIndex, if we have for example, [id, title, id])
                        if (colNameIndexInHead != -1)
                        {
                            // get value by index of column from head
                            rowValue = searchObjectRow[colNameIndexInHead];
                        }
                    }

                    // add value to table cell
                    tableRow += '<td col-name="' + mainColName + '">' + rowValue + '</td>';
                });

                // add row to table rows holder
                if (tableRow != "")
                {
                    tableRows += '<tr>' + tableRow + '</tr>';
                    tableRowsData[searchObjectRowIndex] = tableRowData;
                }
            }
            numRows++;
        });

        // update datagrid UI
        _updateNumRows(options, numRows);
        _updatePages(options);
        _buildFootCallbacks(options, tblData);
        _buildTBody(options, tableRows);
        _updateCellFx(options, tableRowsData);
    }

    /** Build table body **/
    var _buildTBody = function(options, tableRows) {
        // always empty tbody before populate
        $('table.dg-display tbody', options._target).html('');
        // display data
        $('table.dg-display tbody', options._target).html( tableRows );
    }

    /** Update Cells with given Functions **/
    var _updateCellFx = function(options, tableRowsData) {
        if (options.colFx != undefined || options.colFx.length > 0)
        {
            // column index
            var colIndex = 1;
            // Set keys values
            var tempKeys = (options.data.fields != undefined && options.data.fields.length > 0) ? options.data.fields : options.colNames;
            var tempKeysLen = tempKeys.length;

            $.each(options.colFx, function(index, colFx) {
                if (typeof(colFx) === 'function')
                {
                    $.each($('table.dg-display tbody tr > :nth-child(' + colIndex + ')', options._target), function() {
                        var position = $(this).parent().index() + (options.ipp * (options._currentPage-1));
                        var rowData = tableRowsData[position] ? tableRowsData[position] : {};
                        colFx(this, rowData, colIndex);
                    });
                }
                colIndex++;
            });
        }
    }

    /** Search Action **/
    var _searchAction = function(options, searchStr) {
        // Check filter value
        if (searchStr != "")
        {
            // filter by fields
            var filterByFields = options.filterByFields;
            // table head
            var tblHead = options._rawData.head;
            // table data
            var tblData = options._rawData.data;

            // Init response json
            options._jsonTempData = [];

            // Parse parent json
            $.each(tblData, function(rowIndex, rowData){
                // if match found
                var matchFound = false;

                // iterate through each value from row
                $.each(this, function(cellIndex, cellData) {
                    // column name
                    var colName = (tblHead[cellIndex] ? tblHead[cellIndex] : '');

                    // if no filter by fields set or field is in filter by fields array
                    if (filterByFields.length == 0 || (filterByFields.length != 0 && ($.inArray(colName, filterByFields) != -1)))
                    {
                        // if a match was found...
                        if (_matchExpresion(searchStr, cellData))
                        {
                            matchFound = true;
                        }
                    }
                });

                // If any value found, add the row
                if (matchFound)
                {
                    options._jsonTempData.push(rowData);
                }
            });
        }
        else
        {
            options._jsonTempData = null;
        }
        // Reset page on search
        options._currentPage = 1;
        // Sort json according to order params
        _sortJson(options);
        // Refresh row with extra param if
        _refreshRows(options);
    }

    /** Load data from the server and place the returned HTML into target **/
    var _loadData = function(options, buildTitles) {
        // do ajax call
        $.ajax({
            url: options.url,
            dataType: options.dataType,
            data: _requestParams(options),
            type: 'post',
            beforeSend: function(responseData) {
                _showLoading(options);
            }
        }).done(function(responseData, status, xhr){
            // check data in local storage
            if (options.useLocalStorage && responseData !== false)
            {
                _setLocalStorage(responseData);
                options._rawData = JSON.parse(_getLocalStorageValue('jsonData'));
            }
            else if (options.useLocalStorage && responseData === false)
            {
                options._rawData = JSON.parse(_getLocalStorageValue('jsonData'));
            }
            else
            {
                options._rawData = responseData;
            }

            // sort data
            _sortJson(options);
            // refresh rows
            _refreshRows(options);
            // build titles
            if (buildTitles===undefined)
            {
                _buildTitles(options);
            }
            // trigger events
            _eventDataLoaded(options);
        }).fail(function(responseData, status, statusText) {
            var msg = options.errorLoadingData;
            if (responseData.status=='404')
            {
                msg += " Page "+options.url+" not found!";
            }
            _showMessages(options, msg);
        }).always(function(){
            _hideLoading(options);
        });
    }

    /** Update HTML with num rows after refresh **/
    var _updateNumRows = function(options, numRows) {
        options._numRows = numRows;
        $(".dg-items span", options._target).text('(' + numRows + ')');
    }

    /** Get number of rows returned from datasource **/
    var _getNumRows = function(options) {
        return options._numRows;
    }

    /** Update pages after refresh **/
    var _updatePages = function(options) {
        // num pages float
        var numPagesFloat = (options._numRows / options.ipp);
        // round up num pages
        var numPages = parseInt(numPagesFloat);
        if (numPagesFloat > parseInt(numPagesFloat))
        {
            numPages++;
        }
        // current page
        var currentPage = options._currentPage;

        // remove "disabled" class from all menu items
        $('.dg-pagination ul li:not(.dg-items)', options._target).removeClass('disabled');

        // start, end menu items
        var maxMenuItems = (options.maxMenuItems%2==0 ? (options.maxMenuItems+1) : options.maxMenuItems);
        var startItemIndex = 1;
        var endItemIndex = numPages;

        if (numPages > maxMenuItems)
        {
            // 4
            var items = (maxMenuItems - 1);
            // 2
            var offset = (items / 2);
            // 10
            var endOffset = numPages - offset;
            // 3 - 10
            if (currentPage > offset && currentPage <= endOffset)
            {
                startItemIndex = (currentPage - offset);
                if (currentPage <= endOffset)
                {
                    endItemIndex = (parseInt(currentPage) + parseInt(offset));
                }
            }
            // 1 - 2
            else if (currentPage <= offset)
            {
                endItemIndex = parseInt(currentPage) + parseInt((maxMenuItems - currentPage));
            }
            // 11 - 12
            else if (currentPage > endOffset)
            {
                startItemIndex = (currentPage - (items - (numPages - currentPage)));
            }
        }

        // disable some menu items
        if (numPages==1 || numPages==0)
        {
            $('.dg-pagination ul li', options._target).addClass('disabled');
        }
        else if (currentPage==1)
        {
            $('.dg-pagination ul li.dg-first-last', options._target).first().addClass('disabled');
            $('.dg-pagination ul li.dg-prev-next', options._target).first().addClass('disabled');
        }
        else if (currentPage==numPages)
        {
            $('.dg-pagination ul li.dg-first-last', options._target).last().addClass('disabled');
            $('.dg-pagination ul li.dg-prev-next', options._target).last().addClass('disabled');
        }

        // unbind click events from li's
        $('.dg-pagination ul li', options._target).unbind('click');
        $('.dg-pagination ul li.dg-page-item', options._target).remove();

        // add pagination li items
        var selector = '.dg-items';
        if ($('.dg-pagination ul li.dg-prev-next', options._target).length!=0)
            selector = '.dg-prev-next';
        else if ($('.dg-pagination ul li.dg-first-last', options._target).length!=0)
            selector = '.dg-first-last';

        // create numbered menu items
        var menuItemLi = '';
        for(i = startItemIndex; i <= endItemIndex; i++)
        {
            menuItemLi += '<li class="dg-page-item'+(i==currentPage ? ' active' : '')+'"><a href="javascript:;">' + i + '</a></li>';
        }
        // add li's after first found item in selector
        $(".dg-pagination ul "+selector, options._target).first().after(menuItemLi);

        // add click event for pagination
        $(".dg-pagination ul li:not(.dg-items,.disabled)", options._target).click(function(e) {
            e.preventDefault();
            _changePageFx(options, this);
            return false;
        });

        // set number of pages
        options._numPages = numPages;
    }

    /** Change Page Action **/
    var _changePageFx = function(options, elem) {
        // current page
        options._currentPage = parseInt(options._currentPage);

        // goto previous page
        if ($(elem).hasClass('dg-prev'))
        {
            if (options._currentPage>1) options._currentPage--;
        }
        // goto next page
        else if ($(elem).hasClass('dg-next'))
        {
            if (options._currentPage<options._numPages) options._currentPage++;
        }
        // goto first page
        else if ($(elem).hasClass('dg-first'))
        {
            options._currentPage = 1;
        }
        // goto last page
        else if ($(elem).hasClass('dg-last'))
        {
            options._currentPage = options._numPages;
        }
        // other pages
        else
        {
            options._currentPage = $(elem).text();
        }
        // refresh rows
        _refreshRows(options);
    }

    /** Main Table CSS **/
    var _setTableCss = function(options) {
        if (options.tableCss != '')
        {
            $('table.dg-display', options._target).addClass(options.tableCss);
        }
    }

    /** Pagination Component CSS **/
    var _setPaginationCss = function(options) {
        if (options.paginationCss != '')
        {
            $('.dg-pagination', options._target).addClass(options.paginationCss);
        }
    }

    /** Search Component CSS **/
    var _setSearchCss = function(options) {
        if (options.searchCss != '')
        {
            $('.dg-search', options._target).addClass(options.searchCss);
        }
    }

    /** Items Per Page Component CSS **/
    var _setIppCss = function(options) {
        if (options.ippCss!='')
        {
            $('.dg-items-per-page', options._target).addClass(options.ippCss);
        }
    }

    /** Items Per Page Component **/
    var _setItemsPerPage = function(options) {
        if ($('.dg-items-per-page', options._target).length!=0)
        {
            options.ipp = $('.dg-items-per-page select', options._target).val();
            options._currentPage = 1;
            _refreshRows(options);
        }
    }

    /** Sorting an array in js **/
    var _sortJson = function(options) {
        var sortColNames = options._rawData.head;
        var orderByField = options.orderByField ? options.orderByField : sortColNames[0];
        // multi-column
        var orderByFields = orderByField.split('|');
        if (orderByFields.length > 1)
        {
            orderByField = orderByFields[0];
        }
        // Get order column index
        var index = $.inArray(orderByField, sortColNames);
        if (index != -1)
        {
            // Get order column direction
            var orderDir = options.orderByFieldDir ? options.orderByFieldDir : 'asc';

            // Sort search json if any
            if (options._jsonTempData != null)
            {
                options._jsonTempData.sort(function(a, b){
                    return _compare(a[index], b[index], orderDir);
                });
            }
            // Sort initial json
            else
            {
                options._rawData.data.sort(function(a, b){
                    return _compare(a[index], b[index], orderDir);
                });
            }
        }
    }

    /**
     * Order array based on the relationship between each pair of elements "str1" and "str2"
     * @param str1 - String 1 to compare
     * @param str2 - String 2 to compare
     * @param orderDir - Order direction of order column
     */
    var _compare = function(str1, str2, orderDir) {
        // compare dates
        if (regex_date.test(str1) && regex_date.test(str2))
        {
            var d1 = parseInt(str1.replace(/-/g, ''), 10);
            var d2 = parseInt(str2.replace(/-/g, ''), 10);
            if (orderDir == "asc") return (d1 > d2);
            else return (d1 < d2);
        }
        // compare numbers
        else if (regex_num.test(str1) && regex_num.test(str2))
        {
            var n1 = parseInt(str1, 10);
            var n2 = parseInt(str2, 10);
            if (orderDir == "asc") return (n1 - n2);
            else return (n2 - n1);
        }
        // compare float numbers
        else if (regex_float.test(str1) && regex_float.test(str2))
        {
            var n1 = parseInt(str1*100, 10);
            var n2 = parseInt(str2*100, 10);
            if (orderDir == "asc") return (n1 - n2);
            else return (n2 - n1);
        }
        // compare strings
        else
        {
            if (orderDir == "asc") return (str1 > str2);
            else return (str1 < str2);
        }
    }

    /** Escape Regex Expression **/
    var _escapeExpression = function(str) {
        return str.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
    };

    /** Match Expression **/
    var _matchExpresion = function(needle, haystack) {
        var expression = _escapeExpression(needle);
        return RegExp(expression, "i").test(haystack);
    }

    /** Build request params. If useLocalStorage add extra value **/
    var _requestParams = function(options) {
        // If useLocalStorage add crypted data to check if the response is diffrent
        if (options.useLocalStorage)
        {
            options.data.sha1 = _getLocalStorageValue('sha1Data');
        }
        return options.data;
    }

    /**
     * Retrieve the value of the required key
     * @param index - key storage
     */
    var _getLocalStorageValue = function(index) {
        // Check if browser supports localStorage and retrieve value
        return ((typeof(Storage) !== "undefined" && localStorage.getItem(index)) ? localStorage.getItem(index) : false);
    }

    /**
     * Store needed value to localstorage
     * @param paramsData - data to store
     */
    var _setLocalStorage = function(paramsData){
        // Check if browser supports localStorage and set values
        if ((typeof(Storage) !== "undefined"))
        {
            localStorage.setItem('jsonData', JSON.stringify(paramsData));
            localStorage.setItem('sha1Data', paramsData.sha1);
        }
    }

    /** Show Loading **/
    var _showLoading = function(options) {
        $('.dg-loading', options._target).show();
    }

    /** Hide Loading **/
    var _hideLoading = function(options) {
        $('.dg-loading', options._target).hide();
    }

    /** Show Table **/
    var _showTable = function(options) {
        $('.dg-display', options._target).show();
    }

    /** Hide Table **/
    var _hideTable = function(options) {
        $('.dg-display', options._target).hide();
    }

    /** Show Messages **/
    var _showMessages = function(options, message) {
        if ($('.dg-messages', options._target).length == 0)
        {
            $('.dg-datagrid', options._target).prepend(
                '<div class="dg-messages alert alert-error">'+
                    '<button type="button" class="close" data-dismiss="alert">&times;</button>'+
                    '<strong>Error!</strong> <span>'+message+'</span>'+
                '</div>'
            );
        }
        else
        {
            $('.dg-messages', options._target).show().find('span').html(message);
        }
    }

    /** Hide Messages **/
    var _hideMessages = function(options) {
        $('.dg-messages', options._target).remove();
    }

    /** Debug Component **/
    var _dbg = function(info) {
        if (debug)
        {
            if ($("#dg-debug").length == 0)
            {
                $("body").append('<hr /><div id="dg-debug"><div>');
            }
            $('#dg-debug').prepend('<div class="well">' + info + '</div>');
        }
    }
})( jQuery );
