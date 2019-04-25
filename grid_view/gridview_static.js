var table_state = 'Activities';     // what is currently being displayed?
// var resource_table = {"Activities": []};
var search_text = [];
var table_ref;                      // reference variable for accessing the data table
var select_expanded = false;        // used to dynamically render the dropdown- checkbox menu
const columns = [{ title: "Resource Name" }, { title: "Description" }, { title: "Duration" }, { title: "Grade Level "},
                    { title: "Subject" }, { title: "Tech Required "}, { title: "Author" }];

// When the page loads populate the table with activities and render the dropdown menus.
// Add a graderange to each activity that JS can interpret
$(document).ready(function(){
    _getResourceTable();
    // renderGrid();

    // switch between activity and curriculum views
    $('input[name=view]').click(function() {
        var selected = $('input[name=view]:checked').val();
        if(selected != table_state) {
            table_state = selected;
            // renderTable(); 
            renderGrid();  
        }
    });

    $('input[name=tech-required]').change(function() {
      // renderTable();
      renderGrid();
    });

});

/*
    Filter the activities being displayed in the grid based on the current filter options
*/
function renderGrid() {
    var render_data = _filterResources(resource_table[table_state], true);
    console.log('rendering ' + render_data.length + ' features');

    var rows = $('#feature-container').children().toArray();
    var row_ids = rows.map(function(item) {return item.id});

    for(let i=0; i<row_ids.length; i++) {
        var row_count = 0;
        $('#' + row_ids[i]).hide();

        $('#' + row_ids[i]).slick('slickUnfilter');
        $('#' + row_ids[i]).slick('slickFilter', function(index, item) {
            var table_index = $(this).find(".thumbnail").attr("list-index");
            if(table_index == undefined)
                table_index = $(this).attr('list-index');

            if(render_data.includes(resource_table[table_state][table_index]))
                $('#' + row_ids[i]).show();
            return render_data.includes(resource_table[table_state][table_index]);
        });
    }
}

/*
    Toggle display of a select element full of checkboxes. Use the global state variables
    'select_expanded' to switch between states.
*/
function showCheckboxes() {
  var checkboxes = document.getElementById("tech-required");
  if (!select_expanded) {
    checkboxes.style.display = "block";
    select_expanded = true;
  } else {
    checkboxes.style.display = "none";
    select_expanded = false;
  }
}

/* 
    Reset all fitlers to their default values
*/
function resetFilters() {
    $('#subject').val("");
    $('#grade').val("");
    $('#keyword-search').val("");

    var checkboxes = $('#tech-required').find('input.tech-check');
    $.map(checkboxes, function(item, index) {
        item.checked= true;
    });
    renderGrid();
}

/*
    Uncheck all options in the "Tech Required" dropdown
*/
function uncheckTech() {
    var checkboxes = $('#tech-required').find('input.tech-check');
    $.map(checkboxes, function(item, index) {
        item.checked = false;
    });
    renderGrid();
}

/*
    Filter out activities that don't contain text (in any field) that matches
    the text in the search bar
    @param {array} activities - list of activities to filter
    @returns {array} of activities that match the search bar filter
    @private
*/
function _applySearchFilter(activities) {
    console.log('applying search filter to ' + activities.length + ' activities');
    var render_data = [];
    var search_string = $('#keyword-search').val().toUpperCase();
    // console.log('reactive search called with string ' + search_string);
    if(search_string == "")
        return activities;

    activities.map(function(item) {
        console.log('checking item ' + item["Resource Name"] + ' with index ' + resource_table.Activities.indexOf(item));
        var list_index = resource_table.Activities.indexOf(item);
        search_text[list_index].map(function(text) {
            if(text.includes(search_string))
                render_data.push(item);
        });
    });
    return render_data;
}

/*
    Process the hardcoded activities stored in resource_table.Activities. Then use the Google
    Sheets API to get any new activities from the Resource Table source
    Once the HTTP Request is complete, call helper functions to add new activities to their own 
    row in the grid.
    Reference: https://developers.google.com/sheets/api/
    Google Sheet URI: https://docs.google.com/spreadsheets/d/1EdmNxW0F5jTdkemGx95QB_WbasvWVGEfVXuCAZ19cXU/
    @private
*/
function _getResourceTable() {
    // _displayLoading(true);
    _generateSearchText();
    _addGradeRange();
    _renderSelects();
    _populateDivs(resource_table.Activities);
}

/*
    Generate search terms based on the static (hardcoded) activities so that 
    the search bar will work.
*/
function _generateSearchText() {
    resource_table.Activities.map(function(activity) {
        var search_text_arr = [];
        var keywords = [];
        // value.map(function(field) { 
        Object.keys(activity).map(function(key) {
            if(Array.isArray(activity[key]))
                keywords = activity[key];
            else if(activity[key] !== null)
                keywords = activity[key].split(", ");
            keywords.map(item => search_text_arr.push(item.toUpperCase()));
        });
        search_text.push(search_text_arr);
    });
}

/*
    Create rows of 'div' elements for the slick plugin to turn into carousels
    In order to stay readable independent of the number of rows, this function
    calls a helper function for each new row
    @param {array} render_data - list of activities to render into the grid
    @private
*/
function _populateDivs(render_data) {
    // render_data = render_data.filter(resource => resource["Img URL"] != "");

    // fill in missing image links with a placeholder
    no_img = render_data.filter(resource => (resource["Img URL"] == "" || resource["Img URL"] == null));
    for(let i=0; i<no_img.length; i++) {
        no_img[i]["Img URL"] = '/s/code-icon.png';
    }

    rows = _getRows(render_data);

    // var rows = [unplugged, best_authors, humanities];
    var id_count = 0;
    for(let i=0; i<rows.length; i++) {
        // _buildRow(render_data.slice(i*row_divide, (i+1)*row_divide), row_ids[i], i*row_divide);
        $('#feature-container').append('<section class="features" id="' +rows[i].id+ '"></section>');
        _buildRow(rows[i], id_count);

        $("#" + rows[i].id).slick({
            dots: true,
            infinite: true,
            slidesToShow: 3,
            slidesToScroll: 3
        });
        id_count += rows[i].data.length;
        $('#'+rows[i].id).prepend('<div class="section-header">' + rows[i].title + '</div>');
    }

    return id_count;
}

/*
    Build the HTML elements for one row of activities in the grid.
    @param {object} row - auto-generated row object with 'title', 'id', and 'data' fields
    @param {number} index_offset - offset number to add to the featherlight id of each item
        in this row. This allows lightboxes to render properly
    @private
*/
function _buildRow(row, index_offset) {
    var jq_id = '#' + row.id;
    $(jq_id).empty();

    if(row.data.length == 0)
        $(jq_id).hide();

    row.data.map(function(item, i) {
        var feature_id = 'feature' + (i + index_offset);
        var subjects = Array.isArray(item["Subject"]) ? item["Subject"].join(", ") : item["Subject"];
        var feature_div = `
            <a href="#"" data-featherlight="#`+ feature_id +`"><div class="feature"><img class="feature" data-lazy="`+ item["Img URL"] +`" /></div><br />
            <span>`+ item["Resource Name"] +`</span></a>
                <div  style="display: none"><div id="`+ feature_id +`" style="padding: 10px;">
                    <h3>Activity Page: <a target="_blank" href="`+ item["Resource Link"] +`">`+ item["Resource Name"] +`</a></h3>
                    <br />`+ item["Description"] +`<br /><br />
                    <b>Grade Level: </b>`+ item["Grade Level"] +`<br />
                    <b>Subject: </b>`+ subjects +`<br />
                    <b>Tech Required: </b>`+ item["Tech Required"] +`<br />
                    <b>Author: </b><a href="`+ item["Author Link"] +`">`+ item["Author"] +`</a>
                </div>`;
        $("#" + row.id).append("<div class='thumbnail' list-index='" + resource_table[table_state].indexOf(item) + "'>" + feature_div + "</div>");
        // $("#" + id).append("<div class='thumbnail'><img data-lazy='" + item["Img URL"] + "'></div>");
    });  
}

/*
    Create an return an array of row objects that will be used to create the activity grid.
    Each row has the following properties:
        data - list of activities to include in that row of the grid
        title - appears above the row
        id - used for the parent HTML element
    @param {array} render_data - list of activities to be sorted into rows
    @private
*/
function _getRows(render_data) {
    const BEST_AUTHORS = ["Code.org Unplugged","code.org","Scratch","CSFirst with Google"];
    var rows = [{
            'data': render_data.filter(resource => resource["Tags"].includes("unplugged")), 
            'title': "Unplugged Activities:", 'id': 'unplugged'
        },
        {
            'data': render_data.filter(resource => BEST_AUTHORS.includes(resource.Author)),
            'title': "From our Favorite Authors:", 'id': 'best-authors'
        },
        {
            'data': render_data.filter(resource => (resource.Subject.includes("Language Arts") || resource.Subject.includes("Social Studies")) ? true : false),
            'title': 'Activities in the Humanities:', 'id': 'humanities'
        },
        {
            'data': render_data.filter(resource => resource.Subject.includes("Art") || resource.Subject.includes("Music") ? true : false),
            'title': 'Activities in Music and the Visual Arts:', 'id': 'arts'
        },
        {
            'data': render_data.filter(resource => resource.Subject.includes('Science') || resource.Subject.includes('Math')),
            'title': 'Science and Math Activities: ', 'id': 'science-math'
        }];

    var last_row = {
        'data': render_data.filter(function(resource) {
            for(let i=0; i<rows.length; i++) {
                if(rows[i].data.includes(resource))
                    return false;
            }
            return true;
        }),
        'title': 'Other Activities', 'id': 'other'
    }
    rows.push(last_row);

    return rows;
}