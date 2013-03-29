/**
 * jQuery IO Datagrid (AD)
 * @author  Paul BRIE (1.0) and Gabriel PRECUP (1.0, 1.1, 1.2, 1.3) and Anca BALC (1.4)
 * @date    2013-02-01
 * @version 1.4
 * 1. List - OK
 * 2. Add button - OK
 * 3. Pagination - OK
 * 4. AJAX Search - OK
 * 5. AJAX Ordering - OK
 * 6. JSON Search - Anca BALC 14.03.2013
 * 7. JSON Ordering - Anca BALC 21.03.2013
 */
(function ($) {
	/*
	 Plugin class definition
	 */
	var ADatagrid,
		debug = false;
    var _settings = null;      
    var jsonTempData = null;

	ADatagrid = (function () {
		/** Plugin constructor **/
		function ADatagrid(element, options)
		{
			// settings
			_settings = $.extend({}, $.fn.ADatagrid.defaults, options); 

			// set target
			_settings._target = $(element);

			// build datagrid
			_buildDatagrid(_settings);  
		}
        
        ADatagrid.prototype.refresh = function () {
            _loadData(_settings);
        };  
        
        ADatagrid.prototype.eventDataLoaded = function (fn) {
            fn();
        };   

		/** Public method **/
		ADatagrid.prototype.destroy = function () {
		};
		return ADatagrid;
	})();
    
	/** Private Methods **/
	/** Build Datagrid **/
    
    _eventDataLoaded = function(_settings) {
        _settings.triggerAfterLoad();
    }
    
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
            _buildFooterTemp(_settings);
		}
	},

	/** Build Table **/
	_buildTable = function(_settings) {
		//console.log($(this).data('datagrid'));
		//console.log(_targets);
		$('.ad-datagrid', _settings._target).html('<span class="ad-loading label">'+_settings.ad_loading_text+'</span><table class="ad-display" width="' + _settings.width +'"><thead></thead><tfoot></tfoot><tbody></tbody></table>');

		_setTableCss(_settings);
	}    

	/** Build Titles **/
	_buildTitles = function(_settings) {
		_dbg('titles');
		var $thead = $('table.ad-display thead', _settings._target);
		var col = '',
			style = '',
			order_by = '';
		if (typeof(_settings.colTitles)=='object')
		{
			$thead.find('tr').remove();
			col = '', style = '';
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
						order_by += ' order-by="'+_settings.colNames[index]+'" order-dir="'+(_settings.data.order_dir=='asc' ? 'desc' : 'asc')+'">';
						order_by += '<i class="' + (_settings.data.order_dir=='asc' ? _settings.icon_order_up : _settings.icon_order_down) + '"></i>';
					}
					else
					{
						order_by += ' order-by="'+_settings.colNames[index]+'" order-dir="'+_settings.colOrder[index]+'">';
						order_by += '<i class="icon-th"></i>';
					}
					order_by += '</a>';
				}
				col += '<th' + style + '>' + val + order_by + '</th>';
			});
            //
            
			$thead.prepend('<tr>' + col + '</tr>');
		}
	}

    /**
    * Attach CLick Event to Order Links
    * Mod 21.03.2013 - Anca BALC json order
    * 
    * @param _settings
    */
	_attachClickEventToTitles = function(_settings) {
		$('table.ad-display thead', _settings._target).delegate('a', 'click', function(e){
			e.preventDefault();
            // Set new ordering values 
            var data = _settings.data;
            data.order_by = $(this).attr('order-by');
            data.order_dir = $(this).attr('order-dir');
            _settings.data = data;
            // Sort json according to order params
            sortJson();   
            // Refresh table rows after json ordering                     
            _refreshRows(_settings);
            // Build title with new ordering values
            _buildTitles(_settings);
			return false;
		});
	}
    
    _buildFoot = function(_settings)
    {
        _dbg('footer');
        var $tfoot = $('table.ad-display tfoot', _settings._target);
        if (typeof(_settings.colTitles)=='object')
        {
            $tfoot.find('tr').remove();
            col = '';
            $.each(_settings.colTitles, function(index, val) {
                // style
                col += '<th></th>';
            });
            $tfoot.prepend('<tr>' + col + '</tr>');
        }
    }
    _buildFooterTemp = function(data) {
        if (_settings.fxFootCallbacks.length > 0) {
            var i = 1;
            $.each(_settings.fxFootCallbacks, function(index, fxFootCallbacks) {
                if (typeof(fxFootCallbacks) == 'function') {    
                        fxFootCallbacks(index, data);
                }
                i++;
            });
        }
    }

	/** Build AD Pagination **/
	_buildPagination = function(_settings) {
		// if pagination div doesn't exist
		if ($('.ad-pagination', _settings._target).length==0)
		{
			$('.ad-header', _settings._target).prepend('<div class="ad-pagination"><ul>'+
				'<li class="ad-items disabled"><a href="#">'+_settings.ad_items_text+' <span></span></a></li>'+
				'<li class="ad-first-last ad-first"><a href="#">'+_settings.ad_first_text+'</a></li>'+
				'<li class="ad-prev-next ad-prev"><a href="#">'+_settings.ad_prev_text+'</a></li>'+
				'<li class="ad-prev-next ad-next"><a href="#">'+_settings.ad_next_text+'</a></li>'+
				'<li class="ad-first-last ad-last"><a href="#">'+_settings.ad_last_text+'</a></li>'+
				'</ul></div>');
			_setPaginationCss(_settings);
		}
        else
        {
            $('.ad-footer .ad-pagination').html('<ul>'+
                '<li class="ad-items disabled"><a href="#">'+_settings.ad_items_text+' <span></span></a></li>'+
                '<li class="ad-first-last ad-first"><a href="#">'+_settings.ad_first_text+'</a></li>'+
                '<li class="ad-prev-next ad-prev"><a href="#">'+_settings.ad_prev_text+'</a></li>'+
                '<li class="ad-prev-next ad-next"><a href="#">'+_settings.ad_next_text+'</a></li>'+
                '<li class="ad-first-last ad-last"><a href="#">'+_settings.ad_last_text+'</a></li>'+
                '</ul>'); 
            _setPaginationCss(_settings);   
        }
	}

	/** Build AD Filter **/
	_buildFilter = function(_settings) {  
		if (_settings.filter)
		{          
			if ($('.ad-header', _settings._target).length==0)
			{
				$('.ad-header', _settings._target).append('<input class="ad-filter" value="" />');  
			}
			// search by keyup
			if ($('.ad-submit', _settings._target).length==0)
			{        
				$('.ad-filter', _settings._target).keyup(function(){  
					_dbg($(this).val());
					_searchAction(_settings, $(this).val());
				});
			}
			// or by button click
			else
			{    
				// click on search button
				$('.ad-submit', _settings._target).click(function(event){  
					event.preventDefault();
					_dbg($('.ad-filter', _settings._target).val());
					_searchAction(_settings, $('.ad-filter', _settings._target).val());
					return false;
				});
				// trigger search on Enter
				$('.ad-filter', _settings._target).keyup(function(event){    
					if (_settings.filter_dynamic || event.keyCode == 13)
					{
						$(".ad-submit", _settings._target).click();
					}
				});
			}
			// search by
			if ($('.ad-searchby', _settings._target).length==0 && _settings.filter_by_label!="")
			{
				$('.ad-search', _settings._target).append('<div class="ad-searchby"><em>'+_settings.filter_by_label+'</em></div>');
			}
		}
	}

	/** Build Footer Tag **/
	_buildFooterTag = function(_settings) {
		if ($('div.ad-footer', _settings._target).length == 0)
		{
			$(_settings._target).append('<div class="ad-footer"></div>');
		}
	}

	/** Build Items Per Page Select Box **/
	_buildItemsPerPageSelect = function(_settings) {
		if ($('.ad-items-per-page', _settings._target).length == 0)
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
			$('.ad-header', _settings._target).append('<div class="ad-items-per-page"><select>' + ipp_options + '</select></div>').change(function(){
				_setItemsPerPage(_settings);
			});
			_setIppCss(_settings);
		}
	}

	/** Will refresh datagrid with rows from datasource **/
	_refreshRows = function(_settings) {
		// reset num rows
		_settings._num_rows = 0;

        //console.log('C page = '+ _settings._currentPage);
		// init vars
		var table_rows = '',
			table_row = '',
			style = '',
			start = ((_settings._currentPage - 1) * _settings.ipp);
        // Search into parent json or in the filtered json    
		var searchObject = (jsonTempData != null)?jsonTempData:_settings._rawData.data;  
        
		// create an object with the column names as keys
		var _colNames = {};
		$.each(_settings.colNames, function(index, val){
			_colNames[val] = 1;
		});
        
		// foreach line from datasource matching our needs
		$.each(searchObject, function (index, val) {  
			// rebuild a row for display
            
			if (_settings._num_rows>=start && _settings._num_rows<(_settings.ipp * _settings._currentPage))
			{
				table_row = '', style = '';
				$.each(_settings._rawData.head, function(index1, val1){
					// display only the requested fields
					if (_colNames[val1])
					{
					    table_row += '<td col-name="' + val1 + '">' + val[index1] + '</td>';
					}
				});
				table_rows += '<tr>' + table_row + '</tr>';
			}
			_settings._num_rows++;
		}); 
                   
          
		_updateNumRows(_settings);
		_updatePages(_settings);
        
       _buildFooterTemp(_settings._rawData.data);

		// always remove tbody before populate
		$('table.ad-display tbody', _settings._target).html('');
		// display data
		$('table.ad-display tbody', _settings._target).html( table_rows );

		_updateCellFx(_settings, _settings._rawData.data);
	}

	/** Update Cells with given Functions **/
	_updateCellFx = function(_settings, data) {
		if (_settings.fx.length > 0) {
			var i = 1;
			$.each(_settings.fx, function(index, fx) {
				if (typeof(fx) == 'function') {
					$.each($('table.ad-display tbody tr > :nth-child(' + i + ')', _settings._target), function() {  
						fx(this,data);
					});
				}
				i++;
			});
		}
	}

	/** Search Action **/
	_searchAction = function(_settings, string) {
		// Get filter value
		var filter = string;
        console.log(filter);
        if (string != "")
        {
            // Init respons json
            jsonTempData = [];
            // Parse parent json 
            $.each(_settings._rawData.data, function(index,value){
                var match = false;
                $.each(this, function(i, v) {
                    if (i > 0 && i< parseInt(_settings.colTitles.length-1))
                    {
                        // Apply filter & add corresponding values
                        var expresion = RegExp(filter, "i"); 
                        var result = expresion.test(v);
                        if(result) match = true;
                    }
                })
                // If any value found add it
                if(match)
                {
                    jsonTempData.push(value);       
                }
            });
        }
        else
        {
            jsonTempData = null;    
        }
        
        // Refresh row with extra param if 
        _refreshRows(_settings);
	}

	/**
    * Load data from the server and place the returned HTML into target. 
    * 
    * @param _settings 
    */
	_loadData = function(_settings) {
		$.ajax({
			url: _settings.url,
			dataType: _settings.dataType,
			data: requestParams(_settings),
			type: 'post',
			beforeSend: function(responseData) {
				_dbg('before send');
				$('.ad-loading', _settings._target).show();
			},
			success: function(responseData) {
				_dbg('data loaded OK');
                 
                if (_settings.useLocalStorage && responseData !== false)
                {
                    setLocalStorage(responseData);
                    _settings._rawData = JSON.parse(getLocalStorageValue('jsonData'));        
                }
                else if (_settings.useLocalStorage && responseData === false)
                {
                    _settings._rawData = JSON.parse(getLocalStorageValue('jsonData'));     
                }
                else
                {
                    _settings._rawData = responseData;   
                }
               
				// refresh rows
				_refreshRows(_settings);
				_buildTitles(_settings);  
				$('.ad-loading', _settings._target).hide();
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
	_updateNumRows = function(_settings) {
        $(".ad-items span", _settings._target).text('(' + _settings._num_rows + ')');
	}
    
    _getNumRows = function(_settings) {
        return _settings._num_rows;
    }

	/** Update pages after refresh **/
	_updatePages = function(_settings) {
		// num pages
		var pagesFloat = _settings._num_rows / _settings.ipp;

		// round up num pages
		_settings._pages = parseInt(pagesFloat);
		if (pagesFloat > parseInt(pagesFloat))
			_settings._pages++;

		// remove "disabled" class from all menu items
		$('.ad-pagination ul li:not(.ad-items)', _settings._target).removeClass('disabled');

		// start, end menu items
		var max_menu_items = (_settings.max_menu_items%2==0 ? (_settings.max_menu_items+1) : _settings.max_menu_items);
		var start_item_index = 1;
		var end_item_index = _settings._pages;

		if (_settings._pages>max_menu_items)
		{
			// 4
			var items = (max_menu_items - 1);
			// 2
			var offset = (items / 2);
			// 10
			var end_offset = _settings._pages - offset;
			// 3 - 10
			if (_settings._currentPage>offset && _settings._currentPage<=end_offset)
			{
				start_item_index = _settings._currentPage - offset;
				if (_settings._currentPage<=end_offset)
				{
					end_item_index = parseInt(_settings._currentPage) + parseInt(offset);
				}
			}
			// 1 - 2
			else if (_settings._currentPage<=offset)
			{
				var offset = (max_menu_items - _settings._currentPage);
				end_item_index = parseInt(_settings._currentPage) + parseInt(offset);
			}
			// 11 - 12
			else if (_settings._currentPage>end_offset)
			{
				var offset = _settings._currentPage - (items - (_settings._pages - _settings._currentPage));
				start_item_index = offset;
			}
		}

		// disable some menu items
		if (_settings._pages==1 || _settings._pages==0)
		{
			$('.ad-pagination ul li', _settings._target).addClass('disabled');
		}
		else if (_settings._currentPage==1)
		{
			$('.ad-pagination ul li.ad-first-last', _settings._target).first().addClass('disabled');
			$('.ad-pagination ul li.ad-prev-next', _settings._target).first().addClass('disabled');
		}
		else if (_settings._currentPage==_settings._pages)
		{
			$('.ad-pagination ul li.ad-first-last', _settings._target).last().addClass('disabled');
			$('.ad-pagination ul li.ad-prev-next', _settings._target).last().addClass('disabled');
		}
		$('.ad-pagination ul li', _settings._target).unbind('click');
		$('.ad-pagination ul li.ad-page-item', _settings._target).remove();

		// create numbered menu items
		var li = '';
		for(i = start_item_index; i <= end_item_index; i++)
		{
			li += '<li class="ad-page-item'+(i==_settings._currentPage ? ' active' : '')+'"><a href="#">' + i + '</a></li>';
		}

		// add pagination li items
		var selector = '.ad-items';
		if ($('.ad-pagination ul li.ad-prev-next', _settings._target).length!=0)
			selector = '.ad-prev-next';
		else if ($('.ad-pagination ul li.ad-first-last', _settings._target).length!=0)
			selector = '.ad-first-last';

		// add li's after first found item in selector
		$(".ad-pagination ul "+selector, _settings._target).first().after(li);

		var count = 0;
		$(".ad-pagination ul li:not(.ad-items,.disabled)", _settings._target).click(function(e) {
			e.preventDefault();
			_changePageFx(_settings, this);
			return false;
		});
	}

	/** Change Page Action **/
	_changePageFx = function(_settings, elem) {
		// current page
		_settings._currentPage = parseInt(_settings._currentPage);

		// goto previous page
		if ($(elem).hasClass('ad-prev'))
		{
			if (_settings._currentPage>1) _settings._currentPage--;
		}
		// goto next page
		else if ($(elem).hasClass('ad-next'))
		{
			if (_settings._currentPage<_settings._pages) _settings._currentPage++;
		}
		// goto first page
		else if ($(elem).hasClass('ad-first'))
		{
			_settings._currentPage = 1;
		}
		// goto last page
		else if ($(elem).hasClass('ad-last'))
		{
			_settings._currentPage = _settings._pages;
		}
		// other pages
		else
		{
			_settings._currentPage = $(elem).text();
		}
		_refreshRows(_settings);
	}

	/** Main Table CSS **/
	_setTableCss = function(_settings) {
		if (_settings.tableCss!='')
		{
			$('table.ad-display', _settings._target).addClass(_settings.tableCss);
		}
	}

	/** Pagination Component CSS **/
	_setPaginationCss = function(_settings) {
		if (_settings.paginationCss!='')
		{
			$('.ad-pagination', _settings._target).addClass(_settings.paginationCss);
		}
	}

	/** Items Per Page Component CSS **/
	_setIppCss = function(_settings) {
		if (_settings.ippCss!='')
		{
			$('.ad-items-per-page', _settings._target).addClass(_settings.ippCss);
		}
	}

	/** Items Per Page Component **/
	_setItemsPerPage = function(_settings) {
		if ($('.ad-items-per-page', _settings._target).length!=0)
		{
			_settings.ipp = $('.ad-items-per-page select', _settings._target).val();
			_settings._currentPage = 1;
			_refreshRows(_settings);
		}
	}
    
    /**
    * Sorting an array in js
    * @author Anca Balc
    * @since 21.03.2013
    * 
    * @param index - element position
    * @param asc - order direction
    */
    function sortJson(index, order) {
        // Sort search json if any
        if (jsonTempData != null) 
        {
            jsonTempData.sort(compare);
        }
        // Sort initial json
        else
        {
            _settings._rawData.data.sort(compare);
        } 
    } 
    
    /**
    * Order array based on the relationship between each pair of elements "a" and "b"
    * @author Anca Balc
    * @since 21.03.2013
    * 
    * @param a
    * @param b
    */
    function compare(a,b)
    {
        // Get order column
        var index = _settings.colNames.indexOf(_settings.data.order_by)
        // Get order direction
        var order = _settings.data.order_dir;
        // Sort string values
        console.log(Date.parse(a[index]));
        if (isNaN(a[index]))
        {
            if (order == "asc") return (a[index] > b[index]);
            else return (b[index] > a[index]);    
        }
        else if (Date.parse(a[index]))
        {
            
        }
        // Sort numerical values
        else
        {
            if (order == "asc") return (a[index] - b[index]);
            else return (b[index] - a[index]);    
        }    
    }
    
    
    /**
    * Build request params. If useLocalStorage add extra value.
    * 
    * @param _settings
    */
    function requestParams(_settings)
    {
        // If useLocalStorage add crypted data to check if the response is diffrent
        if (_settings.useLocalStorage)
        {
            _settings.data.sha1 = getLocalStorageValue('sha1Data');
        }
        return _settings.data;
    }
    
    /**
    * Retrieve the value of the required key
    *
    * @param index - key storage
    */
    function getLocalStorageValue(index)
    {
        // Check if browser supports localStorage and retrieve value
        return (typeof(Storage)!=="undefined" && localStorage.getItem(index))?localStorage.getItem(index):false; 
    } 
    
    /**
    * Store needed value to localstorage
    * 
    * @param paramsData - data to store
    */
    function setLocalStorage(paramsData)
    {
        // Check if browser supports localStorage and set values
        if ((typeof(Storage)!=="undefined"))
        {
            localStorage.setItem('jsonData', JSON.stringify(paramsData));
            localStorage.setItem('sha1Data', paramsData.sha1);    
        }
    }
    
	/** Debug Component **/
	_dbg = function(info) {
		if (debug)
		{
			if ($("#ad_dbg").length == 0)
			{
				$("body").append('<hr /><div id="ad_dbg"><div>');
			}
			$('#ad_dbg').prepend('<div>' + info + '</div>');
		}
	}

	/*
	 Plugin definition
	 */
	$.fn.ADatagrid = function (options) {
		if (options=='destroy')
		{            
			this.removeData('ADatagrid');
		}
        /* add Anca BALC refresh table only*/
        else if (options=='refresh')
        {
            var instance;
            instance = this.data('ADatagrid');
            if (instance) 
            {
                instance.refresh();  
            }  
        }    
		else
		{
			var instance;
			instance = this.data('ADatagrid');
			if (!instance) {
				return this.each(function () {
					return $(this).data('ADatagrid', new ADatagrid(this, options));
				});
			}
			if (options === true) return instance;
			if ($.type(options) === 'string') instance[options]();
			return this;
		}
	};
    
    $.fn.ADatagrid.reload = function(options) {
        $.each(options, function(index,value){
            _settings.data[index] = value;
        });
        _buildDatagrid(_settings);   
    }

	$.fn.ADatagrid.defaults = {
		_num_rows: 0,
		_rawData: null,
		_currentPage: 1,
		_pages: null,
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
		paginationCss: "span7 pagination pagination-small",
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
		ad_loading_text: "Loading table data... Please wait...",
		ad_items_text: "Items",
		ad_first_text: "&laquo;",//translate('list_paging_first'),         
		ad_prev_text: "&lsaquo;",//translate('list_paging_previous'),
		ad_next_text: "&rsaquo;",//,translate('list_paging_next'),
		ad_last_text: "&raquo;",//translate('list_paging_last'),
		icon_order_up: "icon-chevron-up",
		icon_order_down: "icon-chevron-down",
		icon_order_default: "icon-th",
        triggerAfterLoad: function(){},
        useLocalStorage: true
	};

	/** Apply plugin automatically to any element with class datagrid **/
	/*$(function () {
		return new ADatagrid($('.datagrid'));
	});*/
})( jQuery );//.call(this);
