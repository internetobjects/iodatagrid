/**
 * jQuery IO Datagrid Plugin
 * @author  Internet Objects
 * @site    http://internet-objects.ro
 * @date    2013-04-18
 * @version 1.4.2
 * 1. List - OK
 * 2. Add button - OK
 * 3. Pagination - OK
 * 4. AJAX Search - OK
 * 5. AJAX Ordering - OK
 * 6. JSON Search - OK
 * 7. JSON Ordering - OK
 */
(function ($) {
    /**  Plugin class definition **/
    var IODatagrid,
        debug = false;
    var _settings = null;
    var jsonTempData = null;

    IODatagrid = (function () {
        /** Plugin constructor **/
        function IODatagrid(element, options)
        {
            // settings
            _settings = $.extend({}, $.fn.IODatagrid.defaults, options);

            // set target
            _settings._target = $(element);

            // build datagrid
            _buildDatagrid(_settings);
        }

        /** Public methods **/
        IODatagrid.prototype.refresh = function () {
            _loadData(_settings);
        };
        IODatagrid.prototype.eventDataLoaded = function (fn) {
            fn();
        };
        IODatagrid.prototype.destroy = function () {};

        return IODatagrid;
    })();


    /** Private Methods **/

    /** Trigger event after load **/
    _eventDataLoaded = function(_settings) {
        if (typeof(_settings.triggerAfterLoad) === "function")
        {
            _settings.triggerAfterLoad();
        }
    }

    /** Build Datagrid **/
    _buildDatagrid = function(_settings) {
        _dbg('_buildDatagrid');
        if (_settings.url!="")
        {
            _loadData(_settings);
            _buildTable(_settings);
            _buildTitles(_settings);
            _attachClickEventToTitles(_settings);
            _buildFooterTag(_settings);
            _buildFilter(_settings);
            _buildItemsPerPageSelect(_settings);
            _buildPagination(_settings);
            _buildFoot(_settings);
        }
    }

    /** Build Table **/
    _buildTable = function(_settings) {
        $('.dg-datagrid', _settings._target).html(
            '<span class="dg-loading label">' +
            _settings.dg_loading_text +
            '</span><table class="dg-display" width="' +
            _settings.width +
            '"><thead></thead><tfoot></tfoot><tbody></tbody></table>'
        );

        _setTableCss(_settings);
    }

    /** Build Titles **/
    _buildTitles = function(_settings) {
        _dbg('titles');
        var $thead = $('table.dg-display thead', _settings._target);
        var col = '',
            style = '',
            order_by = '';
        if (typeof(_settings.colTitles) === 'object')
        {
            $thead.find('tr').remove();

            $.each(_settings.colTitles, function(index, val) {
                // style
                style = (_settings.colWidths[index]!=undefined && _settings.colWidths[index]!="" ? ' style="width:' + _settings.colWidths[index] + ';"' : '');

                // order by
                order_by = '';
                if (_settings.colOrder[index]!=undefined && _settings.colOrder[index]!='')
                {
                    order_by = '<a href="#" class="pull-right"';
                    if (_settings.data.order_by && _settings.data.order_dir && _settings.colNames[index]==_settings.data.order_by)
                    {
                        order_by += ' order-by="'+_settings.colNames[index]+'" order-dir="'+
                                    (_settings.data.order_dir=='asc' ? 'desc' : 'asc')+'">';
                        order_by += '<i class="' + (_settings.data.order_dir=='asc' ? _settings.icon_order_up : _settings.icon_order_down) + '"></i>';
                    }
                    else
                    {
                        order_by += ' order-by="'+_settings.colNames[index]+'" order-dir="' +
                                    _settings.colOrder[index]+'">';
                        order_by += '<i class="icon-th"></i>';
                    }
                    order_by += '</a>';
                }
                col += '<th' + style + '>' + val + order_by + '</th>';
            });

            $thead.prepend('<tr>' + col + '</tr>');
        }
    }

    /** Attach Click Event to Order Links **/
    _attachClickEventToTitles = function(_settings) {
        $('table.dg-display thead', _settings._target).delegate('a', 'click', function(e){
            e.preventDefault();
            // Set new ordering values
            var data = _settings.data;
            data.order_by = $(this).attr('order-by');
            data.order_dir = $(this).attr('order-dir');
            _settings.data = data;
            // Sort json according to order params
            _sortJson(_settings);
            // Refresh table rows after json ordering
            _refreshRows(_settings);
            // Build title with new ordering values
            _buildTitles(_settings);
            return false;
        });
    }

    /** Build table foot columns **/
    _buildFoot = function(_settings)
    {
        if (_settings.fxFootCallbacks != undefined) {
            var $tfoot = $('table.dg-display tfoot', _settings._target);
            if (typeof(_settings.colTitles) === 'object')
            {
                $tfoot.find('tr').remove();
                var col = '';
                $.each(_settings.colTitles, function(index, val) {
                    col += '<th></th>';
                });
                $tfoot.prepend('<tr>' + col + '</tr>');
            }
        }
    }

    /** Build table foot callbacks **/
    _buildFootCallbacks = function(_settings, data) {
        if (_settings.fxFootCallbacks != undefined) {
            var i = 1;
            $.each(_settings.fxFootCallbacks, function(index, fxFootCallbacks) {
                if (typeof(fxFootCallbacks) === 'function')
                {
                    fxFootCallbacks(index, data);
                }
                i++;
            });
        }
    }

    /** Build Pagination **/
    _buildPagination = function(_settings) {
        // if pagination div doesn't exist in header
        if ($('.dg-pagination', _settings._target).length==0)
        {
            var paginationUI = '<ul>'+
                                    '<li class="dg-items disabled"><a href="#">'+_settings.dg_items_text+' <span></span></a></li>'+
                                    '<li class="dg-first-last dg-first"><a href="#">'+_settings.dg_first_text+'</a></li>'+
                                    '<li class="dg-prev-next dg-prev"><a href="#">'+_settings.dg_prev_text+'</a></li>'+
                                    '<li class="dg-prev-next dg-next"><a href="#">'+_settings.dg_next_text+'</a></li>'+
                                    '<li class="dg-first-last dg-last"><a href="#">'+_settings.dg_last_text+'</a></li>'+
                                    '</ul>';
            // if position in header
            if (_settings.paginationPosition=='header')
            {
                $('.dg-header', _settings._target).prepend('<div class="dg-pagination">'+paginationUI+'</div>');
            }
            // if position in footer
            else if (_settings.paginationPosition=='footer')
            {
                $('.dg-footer', _settings._target).prepend('<div class="dg-pagination">'+paginationUI+'</div>');
            }
            // set extra pagination css if requested
            _setPaginationCss(_settings);
        }
    }

    /** Build Filter **/
    _buildFilter = function(_settings) {
        if (_settings.filter)
        {
            if ($('.dg-header', _settings._target).length==0)
            {
                $('.dg-header', _settings._target).append('<input class="dg-filter" value="" />');
            }
            // search by keyup
            if ($('.dg-submit', _settings._target).length==0)
            {
                $('.dg-filter', _settings._target).keyup(function(){
                    _dbg($(this).val());
                    _searchAction(_settings, $(this).val());
                });
            }
            // or by button click
            else
            {
                // click on search button
                $('.dg-submit', _settings._target).click(function(event){
                    event.preventDefault();
                    _dbg($('.dg-filter', _settings._target).val());
                    _searchAction(_settings, $('.dg-filter', _settings._target).val());
                    return false;
                });
                // trigger search on Enter
                $('.dg-filter', _settings._target).keyup(function(event){
                    if (_settings.filter_dynamic || event.keyCode == 13)
                    {
                        $(".dg-submit", _settings._target).click();
                    }
                });
            }
            // search by
            if ($('.dg-searchby', _settings._target).length==0 && _settings.filter_by_label!="")
            {
                $('.dg-search', _settings._target).append('<div class="dg-searchby"><em>'+_settings.filter_by_label+'</em></div>');
            }
        }
    }

    /** Build Footer Tag **/
    _buildFooterTag = function(_settings) {
        if ($('div.dg-footer', _settings._target).length == 0)
        {
            $(_settings._target).append('<div class="dg-footer"></div>');
        }
    }

    /** Build Items Per Page Select Box **/
    _buildItemsPerPageSelect = function(_settings) {
        if ($('.dg-items-per-page', _settings._target).length == 0)
        {
            var ipp_option_selected_index = -1;
            var ipp_options = '';
            $.each(_settings.ipp_options, function(index, val) {
                if (val==_settings.ipp)
                {
                    ipp_option_selected_index = index;
                }
                ipp_options += '<option value="' + val + '"' + (val==_settings.ipp ? ' selected="selected"' : '') + '>'+val+'</option>';
            });
            if (ipp_option_selected_index==-1)
            {
                ipp_options = '<option value="' + _settings.ipp + '" selected="selected">-</option>' + ipp_options;
            }
            $('.dg-header', _settings._target).append('<div class="dg-items-per-page"><select>' + ipp_options + '</select></div>').change(function(){
                _setItemsPerPage(_settings);
            });
            _setIppCss(_settings);
        }
    }

    /** Will refresh datagrid with rows from datasource **/
    _refreshRows = function(_settings) {
        // reset num rows
        var numRows = 0;
        // table rows holder
        var tableRows = '';
        // page start / end
        var limitStart = ((_settings._currentPage - 1) * _settings.ipp);
        var limitEnd = (_settings.ipp * _settings._currentPage);
        // table head
        var tblHead = _settings._rawData.head;
        // table data
        var tblData = _settings._rawData.data;
        // Search into parent json or in the filtered json
        var searchObject = (jsonTempData != null) ? jsonTempData : tblData;

        // for each line from datasource matching our needs
        $.each(searchObject, function (searchObjectRowIndex, searchObjectRow) {
            // rebuild a row for display
            if (numRows >= limitStart && numRows < limitEnd)
            {
                // table row holder
                var tableRow = '';

                // iterate through all column names and display only the requested fields
                $.each(_settings.colNames, function(colNameIndex, colName) {
                    // index of item in json data head
                    var colNameIndexInHead = $.inArray(colName, tblHead);

                    // if item found in json head
                    // (colNameIndexInHead can be different than the colNameIndex, if we have for example, [id, title, id])
                    if (colNameIndexInHead != -1)
                    {
                        var rowValue = '';
                        // first get value at index of colName, if any
                        if (searchObjectRow[colNameIndex]!==undefined)
                        {
                            rowValue = searchObjectRow[colNameIndex];
                        }
                        // then, find if there is a value in json data at index of column with the same name in head
                        else
                        {
                            rowValue = searchObjectRow[colNameIndexInHead];
                        }

                        // add value to table cell
                        tableRow += '<td col-name="' + colName + '">' + rowValue + '</td>';
                    }
                });

                // add row to table rows holder
                if (tableRow != "")
                {
                    tableRows += '<tr>' + tableRow + '</tr>';
                }
            }
            numRows++;
        });

        // update datagrid UI
        _updateNumRows(_settings, numRows);
        _updatePages(_settings);
        _buildFootCallbacks(_settings, tblData);
        _buildTBody(_settings, tableRows);
        _updateCellFx(_settings);
    }

    /** Build table body **/
    _buildTBody = function(_settings, tableRows) {
        // always empty tbody before populate
        $('table.dg-display tbody', _settings._target).html('');
        // display data
        $('table.dg-display tbody', _settings._target).html( tableRows );
    }

    /** Update Cells with given Functions **/
    _updateCellFx = function(_settings) {
        if (_settings.fx.length > 0)
        {
            var i = 1;
            $.each(_settings.fx, function(index, fx) {
                if (typeof(fx) === 'function')
                {
                    $.each($('table.dg-display tbody tr > :nth-child(' + i + ')', _settings._target), function() {
                        fx(this, _settings._rawData.data);
                    });
                }
                i++;
            });
        }
    }

    /** Search Action **/
    _searchAction = function(_settings, filter) {
        // Check filter value
        if (filter != "")
        {
            // Init response json
            jsonTempData = [];
            // Parse parent json
            $.each(_settings._rawData.data, function(index, value){
                var match = false;
                $.each(this, function(i, v) {
                    if (_settings.data.filter_by_fields != undefined)
                    {
                        if ($.inArray(_settings.colNames[i], _settings.data.filter_by_fields) != -1)
                        {
                            if (_matchExpresion(filter, v))
                                match = true;
                        }
                    }
                    else
                    {
                        if (_matchExpresion(filter, v))
                            match = true;
                    }
                });
                // If any value found add it
                if (match)
                {
                    jsonTempData.push(value);
                }
            });
        }
        else
        {
            jsonTempData = null;
        }
        // Reset page on search
        _settings._currentPage = 1;
        // Refresh row with extra param if
        _refreshRows(_settings);
    }

    /** Load data from the server and place the returned HTML into target **/
    _loadData = function(_settings) {
        $.ajax({
            url: _settings.url,
            dataType: _settings.dataType,
            data: _requestParams(_settings),
            type: 'post',
            beforeSend: function(responseData) {
                _dbg('before send');
                $('.dg-loading', _settings._target).show();
            },
            success: function(responseData) {
                _dbg('data loaded OK');

                if (_settings.useLocalStorage && responseData !== false)
                {
                    _setLocalStorage(responseData);
                    _settings._rawData = JSON.parse(_getLocalStorageValue('jsonData'));
                }
                else if (_settings.useLocalStorage && responseData === false)
                {
                    _settings._rawData = JSON.parse(_getLocalStorageValue('jsonData'));
                }
                else
                {
                    _settings._rawData = responseData;
                }
                // sort data
                _sortJson(_settings);
                // refresh rows
                _refreshRows(_settings);
                _buildTitles(_settings);
                _hideLoading(_settings);
                _eventDataLoaded(_settings);
            },
            error: function(responseData) {
                _dbg("Ooops");
                _dbg(responseData.responseText);
                _dbg(responseData);
            }
        });
    }

    /** Update HTML with num rows after refresh **/
    _updateNumRows = function(_settings, numRows) {
        _settings._numRows = numRows;
        $(".dg-items span", _settings._target).text('(' + numRows + ')');
    }

    /** Get number of rows returned from datasource **/
    _getNumRows = function(_settings) {
        return _settings._numRows;
    }

    /** Update pages after refresh **/
    _updatePages = function(_settings) {
        // num pages float
        var numPagesFloat = (_settings._numRows / _settings.ipp);
        // round up num pages
        var numPages = parseInt(numPagesFloat);
        if (numPagesFloat > parseInt(numPagesFloat))
        {
            numPages++;
        }
        // current page
        var currentPage = _settings._currentPage;

        // remove "disabled" class from all menu items
        $('.dg-pagination ul li:not(.dg-items)', _settings._target).removeClass('disabled');

        // start, end menu items
        var maxMenuItems = (_settings.max_menu_items%2==0 ? (_settings.max_menu_items+1) : _settings.max_menu_items);
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
            $('.dg-pagination ul li', _settings._target).addClass('disabled');
        }
        else if (currentPage==1)
        {
            $('.dg-pagination ul li.dg-first-last', _settings._target).first().addClass('disabled');
            $('.dg-pagination ul li.dg-prev-next', _settings._target).first().addClass('disabled');
        }
        else if (currentPage==numPages)
        {
            $('.dg-pagination ul li.dg-first-last', _settings._target).last().addClass('disabled');
            $('.dg-pagination ul li.dg-prev-next', _settings._target).last().addClass('disabled');
        }
        
        // unbind click events from li's
        $('.dg-pagination ul li', _settings._target).unbind('click');
        $('.dg-pagination ul li.dg-page-item', _settings._target).remove();

        // add pagination li items
        var selector = '.dg-items';
        if ($('.dg-pagination ul li.dg-prev-next', _settings._target).length!=0)
            selector = '.dg-prev-next';
        else if ($('.dg-pagination ul li.dg-first-last', _settings._target).length!=0)
            selector = '.dg-first-last';

        // create numbered menu items
        var menuItemLi = '';
        for(i = startItemIndex; i <= endItemIndex; i++)
        {
            menuItemLi += '<li class="dg-page-item'+(i==currentPage ? ' active' : '')+'"><a href="#">' + i + '</a></li>';
        }
        // add li's after first found item in selector
        $(".dg-pagination ul "+selector, _settings._target).first().after(menuItemLi);

        // add click event for pagination
        $(".dg-pagination ul li:not(.dg-items,.disabled)", _settings._target).click(function(e) {
            e.preventDefault();
            _changePageFx(_settings, this);
            return false;
        });
        
        // set number of pages
        _settings._numPages = numPages;
    }

    /** Change Page Action **/
    _changePageFx = function(_settings, elem) {
        // current page
        _settings._currentPage = parseInt(_settings._currentPage);

        // goto previous page
        if ($(elem).hasClass('dg-prev'))
        {
            if (_settings._currentPage>1) _settings._currentPage--;
        }
        // goto next page
        else if ($(elem).hasClass('dg-next'))
        {
            if (_settings._currentPage<_settings._numPages) _settings._currentPage++;
        }
        // goto first page
        else if ($(elem).hasClass('dg-first'))
        {
            _settings._currentPage = 1;
        }
        // goto last page
        else if ($(elem).hasClass('dg-last'))
        {
            _settings._currentPage = _settings._numPages;
        }
        // other pages
        else
        {
            _settings._currentPage = $(elem).text();
        }
        // refresh rows
        _refreshRows(_settings);
    }

    /** Main Table CSS **/
    _setTableCss = function(_settings) {
        if (_settings.tableCss != '')
        {
            $('table.dg-display', _settings._target).addClass(_settings.tableCss);
        }
    }

    /** Pagination Component CSS **/
    _setPaginationCss = function(_settings) {
        if (_settings.paginationCss != '')
        {
            $('.dg-pagination', _settings._target).addClass(_settings.paginationCss);
        }
    }

    /** Items Per Page Component CSS **/
    _setIppCss = function(_settings) {
        if (_settings.ippCss!='')
        {
            $('.dg-items-per-page', _settings._target).addClass(_settings.ippCss);
        }
    }

    /** Items Per Page Component **/
    _setItemsPerPage = function(_settings) {
        if ($('.dg-items-per-page', _settings._target).length!=0)
        {
            _settings.ipp = $('.dg-items-per-page select', _settings._target).val();
            _settings._currentPage = 1;
            _refreshRows(_settings);
        }
    }

    /** Sorting an array in js **/
    _sortJson = function(_settings) {
        // Get order column index
        var index = _settings.colNames.indexOf(_settings.data.order_by);
        // Get order column direction
        var order = _settings.data.order_dir;

        // Sort search json if any
        if (jsonTempData != null)
        {
            jsonTempData.sort(function(a, b){
                return _compare(a, b, index, order);
            });
        }
        // Sort initial json
        else
        {
            _settings._rawData.data.sort(function(a, b){
                return _compare(a, b, index, order);
            });
        }
    }

    /**
     * Order array based on the relationship between each pair of elements "a" and "b"
     * @param a - Array of data
     * @param b - Array of data
     * @param index - Index of order column
     * @param order_dir - Order direction of order column
     */
    _compare = function(a, b, index, order_dir) {
        // cast strings to int
        var str1 = parseInt(a[index], 10);
        var str2 = parseInt(b[index], 10);
        // compare numbers
        if (!isNaN(str1) && !isNaN(str2))
        {
            if (order_dir == "asc") return (a[index] - b[index]);
            else return (b[index] - a[index]);

        }
        // compare strings
        else
        {
            if (order_dir == "asc") return (a[index] > b[index]);
            else return (b[index] > a[index]);
        }
    }

    /** Match Expression **/
    _matchExpresion = function(expresion, value) {
        return RegExp(expresion, "i").test(value);
    }

    /** Build request params. If useLocalStorage add extra value **/
    _requestParams = function(_settings) {
        // If useLocalStorage add crypted data to check if the response is diffrent
        if (_settings.useLocalStorage)
        {
            _settings.data.sha1 = _getLocalStorageValue('sha1Data');
        }
        return _settings.data;
    }

    /**
     * Retrieve the value of the required key
     * @param index - key storage
     */
    _getLocalStorageValue = function(index) {
        // Check if browser supports localStorage and retrieve value
        return ((typeof(Storage) !== "undefined" && localStorage.getItem(index)) ? localStorage.getItem(index) : false);
    }

    /**
     * Store needed value to localstorage
     * @param paramsData - data to store
     */
    _setLocalStorage = function(paramsData){
        // Check if browser supports localStorage and set values
        if ((typeof(Storage) !== "undefined"))
        {
            localStorage.setItem('jsonData', JSON.stringify(paramsData));
            localStorage.setItem('sha1Data', paramsData.sha1);
        }
    }

    /** Hide Loading **/
    _hideLoading = function(_settings) {
        $('.dg-loading', _settings._target).hide();
    }

    /** Debug Component **/
    _dbg = function(info) {
        if (debug)
        {
            if ($("#dg_dbg").length == 0)
            {
                $("body").append('<hr /><div id="dg_dbg"><div>');
            }
            $('#dg_dbg').prepend('<div>' + info + '</div>');
        }
    }

    /** Plugin definition */
    $.fn.IODatagrid = function (options) {
        if (options=='destroy')
        {
            this.removeData('IODatagrid');
        }
        else if (options=='refresh')
        {
            var instance;
            instance = this.data('IODatagrid');
            if (instance)
            {
                instance.refresh();
            }
        }
        else
        {
            var instance;
            instance = this.data('IODatagrid');
            if (!instance)
            {
                return this.each(function () {
                    return $(this).data('IODatagrid', new IODatagrid(this, options));
                });
            }
            if (options === true) return instance;
            if ($.type(options) === 'string') instance[options]();
            return this;
        }
    };

    $.fn.IODatagrid.reload = function(options) {
        $.each(options, function(index,value){
            _settings.data[index] = value;
        });
        _buildDatagrid(_settings);
    }

    $.fn.IODatagrid.defaults = {
        _numRows: 0,
        _rawData: null,
        _currentPage: 1,
        _numPages: null,
        datasource: "json", // options: 'json' (default)
        url : "",
        data: {
            /** specific fields to get from ajax; by default: it will take all that comes from model and display only the fields found in colNames array **/
            fields: [],
            filter_by_fields: [],
            order_by: null,
            order_dir: null
        },
        dataType: 'json',
        width: 600,
        height: 600,
        tableCss: "table table-bordered table-striped",
        paginationCss: "span7 pagination",
        paginationPosition: "header",
        ippCss: "span1",
        colTitles: [],
        colNames: [],
        colExtraNames: [],
        colWidths: [],
        filter: true,
        filter_by: "",
        filter_by_label: "",
        filter_dynamic: false,
        ipp: 10, // items per page
        ipp_options: [2, 5, 10, 20, 50, 100],
        max_menu_items: 5, // an odd value
        dg_loading_text: "Loading table data... Please wait...",
        dg_items_text: "Items",
        dg_first_text: "&laquo;",   // translate('list_paging_first'),
        dg_prev_text: "&lsaquo;",   // translate('list_paging_previous'),
        dg_next_text: "&rsaquo;",   // translate('list_paging_next'),
        dg_last_text: "&raquo;",    // translate('list_paging_last'),
        icon_order_up: "icon-chevron-up",
        icon_order_down: "icon-chevron-down",
        icon_order_default: "icon-th",
        triggerAfterLoad: null,
        useLocalStorage: true
    };
})( jQuery );
