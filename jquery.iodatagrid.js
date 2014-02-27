/**
 * jQuery IO Datagrid Plugin
 * @author  Internet Objects
 * @site    http://internet-objects.ro
 * @date    2014-02-26
 * @version 1.5.16 Sort floats with any number of decimals
 */
(function ($) {
    var version = '1.5.16',
        debug = false,
        regex_num = new RegExp('^[0-9]+$'),
        regex_float = new RegExp('^[0-9\.]+$'),
        regex_date = new RegExp('^[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}$');

    /** Plugin Public Methods **/
    var methods = {
        init: function( options ){
            // Create some defaults, extending them with any options that were provided
            var options = $.extend({}, $.fn.IODatagrid.defaults, options);

            return this.each(function(){
                var $this = $(this),
                    dgData = $this.data('iodatagrid');

                // If the plugin hasn't been initialized yet
                if ( !dgData )
                {
                    options._target = $this;
                    dgData = { options: options };
                    $this.data('iodatagrid', dgData);
                }
                // call datagrid builder
                if (dgData && dgData.options)
                {
                    _buildDatagrid(dgData.options);
                }
                else
                {
                    $.error('Cannot build datagrid!');
                }
            });
        },
        destroy: function(){
            return this.each(function(){
                $(window).unbind('.iodatagrid');
                $(this).removeData('iodatagrid');
            });
        },
        // reload datagrid
        reload: function(){
            return this.each(function(){
                var $this = $(this),
                    dgData = $this.data('iodatagrid');

                if (dgData && dgData.options)
                {
                    // reset current page on reload
                    dgData.options._currentPage = 1;
                    // reset JS filter
                    _searchAction(dgData.options, "");
                    // reset search string from input
                    $this.find(".dg-filter").val("");
                    // load data
                    _loadData(dgData.options);
                }
                else
                {
                    $.error('Cannot reload datagrid!');
                }
            });
        },
        // set/get options
        option: function(optionIndex, optionValue){
            var _optionValue;
            var $return = this.each(function(){
                var $this = $(this),
                    dgData = $this.data('iodatagrid');

                if (dgData && dgData.options)
                {
                    // update option value
                    if (optionValue)
                    {
                        dgData.options[optionIndex] = optionValue;
                        $this.data('iodatagrid', dgData);
                    }
                    // or return option value
                    else
                    {
                        _optionValue = dgData.options[optionIndex];
                    }
                }
            });
            return _optionValue ? _optionValue : $return;
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
            $.error('Method ' + method + ' does not exist on jQuery.IODatagrid');
        }
    };

    /** Plugin Version **/
    $.fn.IODatagrid.version = version;

    /** Plugin Defaults **/
    $.fn.IODatagrid.defaults = {
        // private properties
        _target: null,
        _rawData: null,
        _jsonTempData: null,
        _numRows: 0,
        _numPages: 0,
        _currentPage: 1,
        _triggerAfterLoad: null, // private trigger after load function
        // public properties
        url : "",
        colFx: [],
        colTitles: [],
        colNames: [],
        colExtraNames: [],
        colWidths: [],
        colOrder: [],
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
        reloadLabelText: "",
        ipp: 10, // items per page
        ippOptions: [2, 5, 10, 20, 50, 100],
        maxVisiblePages: 5, // an odd value
        showLoadingLabel: true,
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
        tableCss: "table table-bordered table-striped table-hover",
        headerCss: "",
        colTitlesCss: "",
        paginationCss: "pagination",
        paginationPosition: "header",
        searchCss: "pull-right",
        filterInputCss: "",
        ippCss: "pull-right",
        ippSelectCss: "span1",
        ippPosition: "before .dg-search",
        footerCss: "",
        useLocalStorage: true,
        triggerAfterLoad: null,
        useCookies: false,
        cookieName: 'iodatagrid',
        cookieOptions: {expires: 365},
        searchStr: '',
        allowServerSideSort: false,
        dataSourceJSON: false,
        showHeader: true,
        showFooter: true,
        showExcelButton: false,
        colExcel: [],
        cssExcel: '',
        excelPath: '',
        displayTableIfEmpty: true,
        emptyMessageText: "No items in list!",
        emptyMessageCss: ""
    };


    /** Plugin Private Methods **/

    /** Trigger event after load **/
    var _eventDataLoaded = function(options) {
        if (typeof(options.triggerAfterLoad) === "function")
        {
            options.triggerAfterLoad();
        }
        if (typeof(options._triggerAfterLoad) === "function")
        {
            options._triggerAfterLoad();
        }
    }

    /** Build Datagrid **/
    var _buildDatagrid = function(options) {
        if (options.url != "" || options.dataSourceJSON)
        {
            _buildEmptyMessage(options);
            _setOptionsFromCookie(options);
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
            '<table class="dg-display">'+
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

        if (typeof(options.colTitles) === 'object')
        {
            // remove head row first
            $thead.find('tr').remove();

            var colTitles = '';
            var orderByField = options.orderByField ? options.orderByField : (options.data && options.data.order_by ? options.data.order_by : undefined);
            var orderByFieldDir = options.orderByFieldDir ? options.orderByFieldDir : (options.data && options.data.order_by_dir ? options.data.order_by : undefined);
            $.each(options.colTitles, function(index, headText) {
                // th style
                var style = (options.colWidths[index]!=undefined && options.colWidths[index]!="" ? ' style="width:' + options.colWidths[index] + ';"' : '');
                // col title
                colTitles += '<th' + style;
                // order by
                if (options.colOrder[index]!=undefined && options.colOrder[index]!='')
                {
                    colTitles += ' class="pointer"';
                    if (orderByField && orderByFieldDir && options.colNames[index]==orderByField)
                    {
                        colTitles += ' order-by="'+options.colNames[index]+'" order-dir="'+
                            (orderByFieldDir=='asc' ? 'desc' : 'asc')+'">' + headText;
                        colTitles += '<i class="pull-right ' + (orderByFieldDir=='asc' ? options.iconOrderUp : options.iconOrderDown) + '"></i>';
                    }
                    else
                    {
                        colTitles += ' order-by="'+options.colNames[index]+'" order-dir="' + options.colOrder[index]+'">' + headText;
                        colTitles += '<i class="pull-right '+options.iconOrderDefault+'"></i>';
                    }
                }
                // no order
                else
                {
                    colTitles += '>' + headText;
                }
                colTitles += '</th>';
            });

            // create head row
            $thead.prepend('<tr>' + colTitles + '</tr>').find('th').addClass(options.colTitlesCss);
        }
    }

    /** Attach Click Event to Order Links **/
    var _attachClickEventToTitles = function(options) {
        $('table.dg-display thead', options._target).delegate('th', 'click', function(e){
            e.preventDefault();
            var orderBy = $(this).attr('order-by');
            var orderByDir = $(this).attr('order-dir');
            if (orderBy && orderByDir)
            {
                // Set new ordering values
                options.orderByField = orderBy;
                options.orderByFieldDir = orderByDir;

                if (options.allowServerSideSort)
                {
                    // send ordering details
                    options.data.order_by = orderBy;
                    options.data.order_by_dir = orderByDir;

                    // load AJAX
                    _loadData(options);
                }
                else
                {
                    // Sort json according to order params
                    _sortJson(options);
                    // Refresh table rows after json ordering
                    _refreshRows(options);
                    // Build title with new ordering values
                    _buildTitles(options);
                }
            }
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
    var _buildFootCallbacks = function(options, data, filteredData) {
        if (options.fxFootCallbacks != undefined) {
            var i = 1;
            $.each(options.fxFootCallbacks, function(index, fxFootCallbacks) {
                if (typeof(fxFootCallbacks) === 'function')
                {
                    fxFootCallbacks(index, data, filteredData, options.colNames);
                }
                i++;
            });
        }
    }

    /** Build Header Tag **/
    var _buildHeaderTag = function(options) {
        if (options.showHeader && $('div.dg-header', options._target).length == 0)
        {
            $(options._target).prepend('<div class="dg-header"></div>');
            // set custom css
            _setHeaderCss(options);
        }
    }

    /** Build Pagination **/
    var _buildPagination = function(options) {
        // if there's no header
        if (!options.showHeader) return;

        // pagination markup
        var paginationUI = '<ul>' +
                              '<li class="dg-items disabled"><a href="javascript:;">'+options.itemsLabelText+' <span></span></a></li>'+
                              '<li class="dg-first-last dg-first"><a href="javascript:;">'+options.firstLabelText+'</a></li>'+
                              '<li class="dg-prev-next dg-prev"><a href="javascript:;">'+options.prevLabelText+'</a></li>'+
                              '<li class="dg-prev-next dg-next"><a href="javascript:;">'+options.nextLabelText+'</a></li>'+
                              '<li class="dg-first-last dg-last"><a href="javascript:;">'+options.lastLabelText+'</a></li>'+
                            '</ul>';
        // if pagination div doesn't exist in header
        if ($('.dg-pagination', options._target).length==0)
        {
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
        else
        {
            $('.dg-pagination', options._target).html(paginationUI);
        }
    }

    /** Build Filter **/
    var _buildFilter = function(options) {
        if (options.showHeader && options.allowFilter)
        {
            var placeHolder = options.filterByLabelText.length>options.filterByLabelTextLength ? '' : options.filterByLabelText;
            var filterByLabelText = options.filterByLabelText.length>options.filterByLabelTextLength ? options.filterByLabelText : '';

            // create search ui element if not exists
            if ($('.dg-search', options._target).length==0)
            {
                $('.dg-header', options._target).prepend(
                    '<div class="dg-search">'+
                        '<div class="input-append">'+
                            '<input class="dg-filter" type="text" value="'+options.searchStr+'" placeholder="'+placeHolder+'" />'+
                            (options.allowDynamicFilter ? '' : '<button class="dg-submit btn" type="submit">'+options.searchLabelText+'</button>')+
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
            // reset additional filters
            options.data.filters = {};
            // search by keyup
            if ($('.dg-submit', options._target).length==0 || options.allowDynamicFilter)
            {
                var timeoutHandle;
                // trigger search on keyup and on paste event
                $('.dg-filter', options._target).on("keyup paste", function () {
                    var self = this;
                    clearTimeout(timeoutHandle);
                    // delay the search onkeyup to avoid useless searches
                    timeoutHandle = setTimeout(function () {
                        _searchAction(options, $(self).val());
                    }, 500);
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
                // Reset page on reload
                options._currentPage = 1;
                // ajax call
                _loadData(options);
                return false;
            });
        }
    }

    /** Build Footer Tag **/
    var _buildFooterTag = function(options) {
        if (options.showFooter && $('.dg-footer', options._target).length == 0)
        {
            $(options._target).append('<div class="dg-footer"></div>');
            // set custom css
            _setFooterCss(options);
        }
    }

    /** Build Items Per Page Select Box **/
    var _buildItemsPerPageSelect = function(options) {
        // get item
        var $ipp = $('.dg-items-per-page', options._target);

        if ($ipp.length == 0)
        {
            var ipp = '<div class="dg-items-per-page">' + _buildIPPSelectOptions(options) + '</div>';
            var ippPosition = $.trim(options.ippPosition);
            var splitIppPos = ippPosition!="" ? ippPosition.split(' ') : ['after', '.dg-search'];

            if ($.inArray(splitIppPos[0], ['before', 'after']) != -1)
            {
                var ippSiblingCss = (splitIppPos[1] ? splitIppPos[1] : '.dg-search');
                var $ippSibling = $(ippSiblingCss, options._target);

                if ($ippSibling.length == 0)
                {
                    $('.dg-header', options._target).append(ipp);
                }
                else
                {
                    if (splitIppPos[0] == "before")
                    {
                        $ippSibling.before(ipp);
                    }
                    else
                    {
                        $ippSibling.after(ipp);
                    }
                }
            }
            // get newly created element
            $ipp = $('.dg-items-per-page', options._target);
            // set custom css
            _setIppCss(options);
        }
        else if ($ipp.html().length==0)
        {
            $ipp.html(_buildIPPSelectOptions(options));
        }
        // add change event
        $ipp.change(function(){
            _setItemsPerPage(options);
        });
    }

    /** Build items per page select options **/
    var _buildIPPSelectOptions = function(options) {
        var ippOptionSelectedIndex = -1;
        var ippOptions = '';

        if (options.ippOptions.length > 0)
        {
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
            return '<select'+(options.ippSelectCss ? ' class="'+options.ippSelectCss+'"' : '')+'>' + ippOptions + '</select>';
        }
        else
        {
            return "";
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
                                rowValue += otherColName.replace(/["']/g, '');
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
        if (numRows > 0 || options.displayTableIfEmpty)
        {
            $('.dg-empty', options._target).hide();
            $('table.dg-display', options._target).show();

            _updateNumRows(options, numRows);
            _updatePages(options);
            _buildFootCallbacks(options, tblData, searchObject);
            _buildTBody(options, tableRows, tableRowsData);
            _updateCookies(options);
            
            // show download excel button
            if (options.showExcelButton)
            {
                options._triggerAfterLoad = function() {
                    _buildExcelButton(options);
                }
            }
        }
        else
        {
            $('.dg-empty', options._target).show();
            $('table.dg-display', options._target).hide();
            
            options._triggerAfterLoad = null;
        }
    }
    
    /** Build empty message **/
    var _buildEmptyMessage = function(options) {
        if ($('.dg-empty', options._target).length == 0)
        {
            $(options._target).append('<div class="dg-empty">' + options.emptyMessageText + '</div>');
            // set custom css
            _setEmptyMessageCss(options);
        }
    }

    /** Build table body **/
    var _buildTBody = function(options, tableRows, tableRowsData) {
        var dfd = $.Deferred();
        // Add handlers to be called when dfd is resolved
        dfd.done(function () {
            $('table.dg-display tbody', options._target).html(tableRows);
        }, function () {
            _updateCellFx(options, tableRowsData);
        });
        dfd.resolve();
    }

    /** Update Cells with given Functions **/
    var _updateCellFx = function(options, tableRowsData) {
        if (options.colFx != undefined || options.colFx.length > 0)
        {
            // column index
            var colIndex = 1;
            var rowIndex = -1;
            // Set keys values
            var tempKeys = (options.data.fields != undefined && options.data.fields.length > 0) ? options.data.fields : options.colNames;
            var tempKeysLen = tempKeys.length;

            $.each(options.colFx, function(index, colFx) {
                if (typeof(colFx) === 'function')
                {
                    $.each($('table.dg-display tbody tr > :nth-child(' + colIndex + ')', options._target), function() {
                        var rowIndex = $(this).parent().index() + (options.ipp * (options._currentPage-1));
                        var rowData = tableRowsData[rowIndex] ? tableRowsData[rowIndex] : {};
                        colFx(this, rowData, colIndex, rowIndex);
                    });
                }
                colIndex++;
            });
        }
    }

    /** Search Action **/
    var _searchAction = function(options, searchStr, fromCookie) {
        // set search string into options
        options.searchStr = searchStr;

        // Check filter value
        if (searchStr != "")
        {
            // filter by fields
            var filterByFields = options.filterByFields;
            // table head
            var tblHead = options._rawData.head ? options._rawData.head : [];
            // table data
            var tblData = options._rawData.data ? options._rawData.data : [];

            // Init response json
            options._jsonTempData = [];

            if (tblHead.length==0 || tblData.length==0)
            {
                return false;
            }

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
        options._currentPage = fromCookie ? options._currentPage : 1;
        // Sort json according to order params
        // @removed to improve performance - not necessary to resort
        //_sortJson(options);
        // Refresh row with extra param if
        _refreshRows(options);
    }

    /** Load data from the server and place the returned HTML into target **/
    var _loadData = function(options, buildTitles) {
        // load directly from json object
        if (options.dataSourceJSON)
        {
            setTimeout(function(){
                _showLoading(options);
                _hideMessages(options);
            }, 200);
            setTimeout(function(){
                _loadDataDone(options, buildTitles, options.dataSourceJSON);
                _hideLoading(options);
            }, 500);
        }
        // do ajax call
        else
        {
            $.ajax({
                url: options.url,
                dataType: options.dataType,
                data: _requestParams(options),
                type: 'post',
                beforeSend: function(responseData) {
                    _showLoading(options);
                    _hideMessages(options);
                }
            }).done(function(responseData, status, xhr){
                _loadDataDone(options, buildTitles, responseData);
            }).fail(function(responseData, status, statusText) {
                _loadDataFail(options, responseData);
            }).always(function(){
                _hideLoading(options);
            });
        }
    }

    var _loadDataDone = function(options, buildTitles, responseData) {

        if (options.dataSourceJSON)
        {
            options._rawData = responseData;
        }
        else
        {
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
    }

    var _loadDataFail = function(options, responseData) {
        var msg = options.errorLoadingData;
        if (responseData.status=='404')
        {
            msg += " Page "+options.url+" not found!";
        }
        _showMessages(options, msg);
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
        var maxVisiblePages = (options.maxVisiblePages%2==0 ? (options.maxVisiblePages+1) : options.maxVisiblePages);
        var startItemIndex = 1;
        var endItemIndex = numPages;

        if (numPages > maxVisiblePages)
        {
            // 4
            var items = (maxVisiblePages - 1);
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
                endItemIndex = parseInt(currentPage) + parseInt((maxVisiblePages - currentPage));
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

    /** Header Component CSS **/
    var _setHeaderCss = function(options) {
        if (options.headerCss != '')
        {
            $('.dg-header', options._target).addClass(options.headerCss);
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
            $('.dg-filter', options._target).addClass(options.filterInputCss);
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
            _showLoading(options);
            _refreshRows(options);
            setTimeout(function(){
                _hideLoading(options);
            }, 500 );
        }
    }
    
    /** Empty Message CSS **/
    var _setEmptyMessageCss = function(options) {
        if (options.emptyMessageCss != '')
        {
            $('.dg-empty', options._target).addClass(options.emptyMessageCss);
        }
    }

    /** Footer Component CSS **/
    var _setFooterCss = function(options) {
        if (options.footerCss!='')
        {
            $('.dg-footer', options._target).addClass(options.footerCss);
        }
    }

    /** Use Cookies **/
    var _updateCookies = function(options) {
        if (options.useCookies && $.cookie)
        {
            $.cookie.json = true;
            var cookieValue = {
                orderByField: options.orderByField,
                orderByFieldDir: options.orderByFieldDir,
                searchStr: options.searchStr,
                ipp: options.ipp,
                _currentPage: options._currentPage
            };
            $.cookie(options.cookieName, cookieValue, options.cookieOptions);
        }
    }

    /** Set Options from Cookie **/
    var _setOptionsFromCookie = function(options) {
        if (options.useCookies && $.cookie)
        {
            $.cookie.json = true;
            var $cookie = $.cookie(options.cookieName);
            for (var _key in $cookie)
            {
                if (options[_key]!=undefined)
                {
                    options[_key] = $cookie[_key];
                }
            }
            // trigger search
            if (options.searchStr)
            {
                options._triggerAfterLoad = function() {
                    _searchAction(options, options.searchStr, true);
                }
            }
        }
    }

    /** Sorting an array in js **/
    var _sortJson = function(options) {
        // no sort
        if (options.orderByField=='none') return;
        
        // get all columns from head
        var sortColNames = options._rawData.head ? options._rawData.head : [];
        // set order by field
        var orderByField = (options.orderByField ? options.orderByField : (sortColNames[0] ? sortColNames[0] : ''));
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
        // if null detected
        if (str1==null) str1 = "";
        if (str2==null) str2 = "";

        // compare dates
        if (regex_date.test(str1) && regex_date.test(str2))
        {
            var d1 = parseInt(str1.replace(/-/g, ''), 10);
            var d2 = parseInt(str2.replace(/-/g, ''), 10);
            if (orderDir == "asc") return (d1 - d2);
            else return (d2 - d1);
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
            var prec1 = _getFloatPrecision(str1);
            var prec2 = _getFloatPrecision(str2);
            var n1 = parseInt(str1 * Math.pow(10, prec1), 10);
            var n2 = parseInt(str2 * Math.pow(10, prec2), 10);
            if (orderDir == "asc") return (n1 - n2);
            else return (n2 - n1);
        }
        // compare strings
        else
        {
            if (orderDir == "asc") return ((str1.toLowerCase() > str2.toLowerCase()) ? 1 : ((str1.toLowerCase() < str2.toLowerCase()) ? -1 : 0));
            else return ((str1.toLowerCase() < str2.toLowerCase()) ? 1 : ((str1.toLowerCase() > str2.toLowerCase()) ? -1 : 0));
        }
    }

    /** Get Float Precision **/
    var _getFloatPrecision = function(str) {
        var prec = 2,
            prec1 = (str + "").split(".");
        if (prec1.length==2)
        {
            prec = prec1[1].length;
        }
        return prec;
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
        if (options.showLoadingLabel) $('.dg-loading', options._target).show();
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

    /** Build Excel Button **/
    var _buildExcelButton = function(options) {
        if (typeof(options.colExcel) === 'object')
        {
            if ($('.dg-excel', options._target).length == 0)
            {
                $('<div class="dg-excel ' + options.cssExcel + ' downloadify">EXPORT</div>').appendTo("#"+options._target.attr("id")+' .dg-footer');
            }

            _exportToExcel(options);
        }
    }

    /** Export to excel **/
    var _exportToExcel = function(options) {
        // table head
        var tblHeadKeys = options._rawData.head;

        var tblData = (options._jsonTempData != null) ? options._jsonTempData : options._rawData.data;
        var table = '<table><tr>';
        var colExcelKeys = [];

        // build table head
        $.each(options.colExcel, function(index, colObj) {
            // order by
            var currentIndex = tblHeadKeys.indexOf(colObj.key);
            // extract only keys
            colExcelKeys.push(colObj.key);
            if (index>-1)
            {
                table += '<th>'+colObj.val+'</th>';
            }
        });

        table += '</tr>';
        // build table rows
        $.each(tblData, function(rowIndex, rowData){
            // iterate through each value from row
            table += '<tr>';

            $.each(this, function(cellIndex, cellData) {
                var currentIndex = colExcelKeys.indexOf(tblHeadKeys[cellIndex]);
                if (currentIndex>-1)
                {
                    cellData = ( cellData == null || cellData == 'null' || cellData == '0' ) ? '' : cellData;
                    table += '<td>'+cellData+'</td>';
                }
            });
            table += '</tr>';
        });
        table += '</table>';

        var config = {
            filename: function() {
                var d = new Date(),
                    month = d.getMonth()+1,
                    day = d.getDate(),
                    hour = d.getHours(),
                    minutes = d.getMinutes(),
                    seconds = d.getSeconds(),
                    output = d.getFullYear() + '-' +
                                ((''+month).length<2 ? '0' : '') + month + '-' +
                                ((''+day).length<2 ? '0' : '') + day + '-' + hour + '-' + minutes + '-' + seconds;

                return output + "-" + options._target.attr("id") + ".xls";
            },
            data: function () {
                return table;
            },
            swf: '../assets/media/downloadify.swf',
            downloadImage: '../assets/img/download.png',
            width: 100,
            height: 30,
            transparent: true,
            append: false
        };

        try {
            $(".downloadify").downloadify(config);
        } catch (ex) {
            alert(ex);
        }
    }
})(jQuery);
