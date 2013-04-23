// french month names
var monthNames = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
var monthNamesShort = ['Janv.','Févr.','Mars','Avril','Mai','Juin','Juil.','Août','Sept.','Oct.','Nov.','Déc.'];

// make cell text bold
function bold(node) {
    $(node).css('font-weight','bold');
}

// make cell text italic
function italic(node) {
    $(node).css('font-style','italic');
}

// center cell text
function center(node) {
    $(node).css({'text-align': 'center'});
}

// price
function price(node) {
    $(node).css({'text-align':'right', 'font-style':'italic'});
}

// use cell text as a link
function link(node)
{
    $(node).html('<a href="'+$(node).text()+'">Link</a>');
}

// date from MySQL date (Y-m-d) to french
function date_fr(node) {
    var ymd = $(node).text();
    var a_date = ymd.split('-', 3);
    if (a_date[1])
    {
        var month = parseInt(a_date[1], 10);
        $(node).html(a_date[2] + " " + monthNamesShort[month-1] + " " + a_date[0]).attr('title', ymd);
    }
}