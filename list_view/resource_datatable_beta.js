var table_state = 'Activities';     // what is currently being displayed?
// var table_source;                   // store data for the DataTables plugin to render
// var resource_table = {"Activities": []};
var table_ref;                      // reference variable for accessing the data table
var select_expanded = false;        // used to dynamically render the dropdown- checkbox menu
const columns = [{ title: "Resource Name" }, { title: "Description" }, { title: "Duration" }, { title: "Grade Level "},
                    { title: "Subject" }, { title: "Tech Required "}, { title: "Author" }];

// When the page loads populate the table with activities and render the dropdown menus.
// Add a graderange to each activity that JS can interpret
$(document).ready(function(){
    console.log('table length ' + resource_table.Activities.length);
    _buildTable();
    _setupFeatures();

    // switch between activity and curriculum views
    // $('input[name=view]').click(function() {
    //     var selected = $('input[name=view]:checked').val();
    //     if(selected != table_state) {
    //         table_state = selected;
    //         renderTable(); 
    //         renderFeatures();  
    //     }
    // });

    // $('input[name=tech-required]').change(function() {
    //   renderTable();
    //   renderFeatures();
    // });
    $('.dataTables_filter').addClass('pull-left');
    $('.dataTables_length').addClass('pull-left');
});

/*
    Initiate a table search with the URL search parameter. This will cause the page to reload, 
    and the new datatable will be rendered using the search parameter
*/
function searchActvities() {
    var render_data = _filterResources(resource_table.Activities);
    var search_string = _getSearchString();

    if(render_data.length == 0) {
        alert('This Search returned no activities.');
        return;   
    }

    location.search=search_string;

}

/*
    Render the datatable with activities filtered by user.
    @param {boolean} search - 'true' if user has filtered activities. 
        'false' if the whole table should be rendered
*/
function renderTable() {
    var render_data = _filterResources(resource_table[table_state]);
    var table_source = [];
    var resource_link;
    
    renderFeatures();

    $.map(render_data, function(item, index) {
        var subjects = Array.isArray(item["Subject"]) ? item["Subject"].join(", ") : item["Subject"];
        // var author_link = '<a target="_blank" href="' + item["Author Link"] + '">' + item["Author"] + '</a>';
        var activity_link = '<a target="_blank" href="' + item["Resource Link"] + '"">' + item["Resource Name"] + '</a>';

        var lightbox = _moreInfo(item, index);

        if(item['Tags'].includes('incomplete')) {
            resource_link = _adaptActivity(activity_link, index, item["Resource Name"]);
        } else
            resource_link = activity_link;

        table_source.push([resource_link, item["Description"], item["Duration"], item["Grade Level"], subjects, item["Tech Required"], lightbox]);       
    });

    if(table_ref)
        _refreshTable(table_source);

    // return table_source;
}

/*
    Render 3 Featured Activities at the top of the page. Collect a list of all
    activities with img urls that match the set of filters chosen. Then pick
    features from this list based on keywords
*/
function renderFeatures() {
    var render_data = _filterResources(resource_table[table_state]);
    var feature_list = [];
    $.map(render_data, function(item) {
        if(item["Img URL"] != "") {
            feature_list.push(item);
        }
    });


    var features = _buildFeatures(feature_list);
    console.log('rendering ' + features.length + ' features');
    
    $(".featured-activity").each(function(i) {
        $(this).empty();
        var feature_id = 'feature' + (i + 1);
        var subjects = Array.isArray(features[i]["Subject"]) ? features[i]["Subject"].join(", ") : features[i]["Subject"];
        var feature_div = `
            <a href="#" data-featherlight="#`+ feature_id +`"><div class="feature"><img class="feature" src="`+ features[i]["Img URL"] +`" /></div><br />
            <span>`+ features[i]["Resource Name"] +`</span></a>
                <div  style="display: none"><div id="`+ feature_id +`" style="padding: 10px;">
                    <h3>Activity Page: <a target="_blank" href="`+ features[i]["Resource Link"] +`">`+ features[i]["Resource Name"] +`</a></h3>
                    <br />`+ features[i]["Description"] +`<br /><br />
                    <b>Grade Level: </b>`+ features[i]["Grade Level"] +`<br />
                    <b>Subject: </b>`+ subjects +`<br />
                    <b>Tech Required: </b>`+ features[i]["Tech Required"] +`<br />
                    <b>Author: </b><a href="`+ features[i]["Author Link"] +`">`+ features[i]["Author"] +`</a>
                </div>`;
        $(this).append(feature_div);
    });

}

/* 
    Reset all fitlers to their default values
*/
function resetFilters() {
    _resetFilters();
    $('input[type="search"]').val("");
    renderTable();
}

/*
    Create a search string from the chosen filter options.
*/
function _getSearchString() {
    var search_params = [];

    if($('input[type="search"]').val() != "")
        search_params.push("Search=" + $('input[type="search"]').val());
    
    if($('#subject').val() != "") 
        search_params.push("Subject=" + $('#subject').val());

    if($('#grade').val() != "")
        search_params.push("Grade=" + $('#grade').val());

    if($('#no-tech').is(':checked'))
        search_params.push('unplugged');

    if($('#tech').is(':checked'))
        search_params.push('tech');

    return search_params.join('&');
}

/*
    Set filter options based on a URL search string
    @param {string} search_string - filter string taken from URL search parameter
*/
function _setFilters(search_string) {
    var search_params = new URLSearchParams(location.search);
    if(location.search == "")
        return;

    if(!search_params.has('unplugged'))
        $('#no-tech').prop('checked', false);

    if(!search_params.has('tech'))
        $('#tech').prop('checked', false);

    if(search_params.get('Subject'))
        $('#subject').val(search_params.get('Subject'));

    if(search_params.get('Grade'))
        $('#grade').val(search_params.get('Grade'));

    if(search_params.get('Search'))
        $('input[type="search"]').val(search_params.get("Search"));
    
    document.querySelector('#content').scrollIntoView({ 
      behavior: 'smooth' 
    });
}

/*
    Get the "Resource Table" Google sheet from https://docs.google.com/spreadsheets/d/1EdmNxW0F5jTdkemGx95QB_WbasvWVGEfVXuCAZ19cXU/
    Once the HTTP Request is complete, call helper functions to populate the array and build
    page features. This function makes use of the Google Sheets API
    Reference: https://developers.google.com/sheets/api/
    @private
*/
function _buildTable() {
    // _displayLoading(true);
    _addGradeRange();
    _renderSelects();
    _setupDataTable(_getTableSource());
    // renderFeatures();
    _setFilters(location.search);
    renderTable();
}

function _getTableSource() {
    var table_source = [];
    $.map(resource_table.Activities, function(item, index) {
        var subjects = Array.isArray(item["Subject"]) ? item["Subject"].join(", ") : item["Subject"];
        // var author_link = '<a target="_blank" href="' + item["Author Link"] + '">' + item["Author"] + '</a>';
        var activity_link = '<a target="_blank" href="' + item["Resource Link"] + '"">' + item["Resource Name"] + '</a>';

        var lightbox = _moreInfo(item, index);

        if(item['Tags'].includes('incomplete')) {
            resource_link = _adaptActivity(activity_link, index, item["Resource Name"]);
        } else
            resource_link = activity_link;

        table_source.push([resource_link, item["Description"], item["Duration"], item["Grade Level"], subjects, item["Tech Required"], lightbox]);       
    });

    return table_source;
}
/*
    Wrap our table with the DataTables plugin from https://www.datatables.net/
    This makes the columns sortable and options for filtering by a search bar
    and displaying n entries per page.
*/
function _setupDataTable(table_source) {
    // custom grade sort could use some improvement, e.g. so 3-9 is higher than K-5
    jQuery.fn.dataTableExt.oSort["grade-desc"] = function (x, y) {
        x = x.match(/\d+/);
        y = y.match(/\d+/);
        return y-x;
    };

    jQuery.fn.dataTableExt.oSort["grade-asc"] = function (x, y) {
        x = x.match(/\d+/);
        y = y.match(/\d+/);
        return x-y;
    };

    table_ref = $('#resource-table').DataTable({
        data: table_source,
        // columns: columns
      "pageLength": 50,
      "columnDefs": [
            { "orderable": false, "targets": [1, 4, 5, 6] },
            { "type": "grade", "targets": 3 }
            // { "dom": '<"wrapper"fli>' }
        ]
    });

    // return table_ref;
}

function _setupFeatures() {
    $('#resource-table_filter').after(`<section id="feature-container">
      <br /><h3>Featured Activities:</h3><br />
      <div class="features">
        <div class="featured-activity" id="feature1"></div>
        <div class="featured-activity" id="feature2"></div>
        <div class="featured-activity" id="feature3"></div>
      </div>
    </section>`);
}