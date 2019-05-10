var table_state = 'Activities';     // what is currently being displayed?
var datatable;
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
    $('input[name=view]').click(function() {
        var selected = $('input[name=view]:checked').val();
        if(selected != table_state) {
            table_state = selected;
            renderTable(); 
            renderFeatures();  
        }
    });

    $('input[name=tech-required]').change(function() {
      renderTable();
      renderFeatures();
    });
    $('.dataTables_filter').addClass('pull-left');
    $('.dataTables_length').addClass('pull-left');
});

/*
    Add options to a dropdown menu
    @param {string} id - HTML id of the dropdown to create
    @param {string} key - JSON key in the Activity object that corresponds to the options for this menu
    @private
*/
function renderTable(table_ref=datatable) {
    var render_data = _filterResources(resource_table[table_state]);
    var table_source = [];
    
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
        _refreshTable(table_ref, table_source);
    return table_source;
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
    
    $(".featured-activity").each(function(i) {
        $(this).empty();
        var feature_id = 'feature' + (i + 1);
        var subjects = Array.isArray(features[i]["Subject"]) ? features[i]["Subject"].join(", ") : features[i]["Subject"];
        var feature_div = `
            <a href="#"" data-featherlight="#`+ feature_id +`"><div class="feature"><img class="feature" src="`+ features[i]["Img URL"] +`" /></div><br />
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
    $('#subject').val("");
    $('#grade').val("");

    var checkboxes = $('#tech-required').find('input.tech-check');
    $.map(checkboxes, function(item, index) {
        item.checked= true;
    });
    renderTable();
}

function uncheckTech() {
    var checkboxes = $('#tech-required').find('input.tech-check');
    $.map(checkboxes, function(item, index) {
        item.checked = false;
    });
    renderTable();
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
    var table = _setupDataTable(renderTable());
    renderFeatures();
}

/*
    Create three features to appear above the table. Features can fit whatever criteria we want-
    Right now the first one always comes from a list of 'best authors' and the other two are random
    @param {array} feature_list - a list of activities that could be used as features. Currently this
        is all activities with an "Img URL" field
    @returns {array} features - featured activities to display above the table
    @private
*/
function _buildFeatures(feature_list) {
    features = [];
    num_features = 3;
    const BEST_AUTHORS = ["Code.org Unplugged","code.org","Scratch","CSFirst with Google"];

    while(features.length < num_features) {
        var new_id = Math.floor(Math.random()*feature_list.length);

        // get the first feature from a top-tier source
        if(features.length == 0) {
            if(BEST_AUTHORS.includes(feature_list[new_id]["Author"]))
                features.push(feature_list[new_id]);

        } else if(!features.includes(feature_list[new_id]) && !feature_list[new_id]["Tags"].includes("incomplete"))
            features.push(feature_list[new_id]);
    }

    // console.log('built ' + features.length + ' features with first author ' + features[0]["Author"]);
    return features;
}

function _refreshTable(table_ref, table_source) {
    table_ref.clear().rows.add(table_source).draw();
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

    datatable=table_ref;
    return table_ref;
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