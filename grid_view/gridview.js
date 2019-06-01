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
    if(render_data.length == 0) {
        alert('This Search returned no activities.');
        return;   
    }

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

    document.querySelector('#feature-container').scrollIntoView({ 
      behavior: 'smooth' 
    });
    location.hash = "results";
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
    _resetFilters();
    // renderGrid();
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
    if(!$('#keyword-search').length)
        return activities;

    console.log('applying search filter to ' + activities.length + ' activities');
    var render_data = [];
    var search_string = $('#keyword-search').val().toUpperCase();
    // console.log('reactive search called with string ' + search_string);
    if(search_string == "")
        return activities;

    activities.map(function(item) {
        // console.log('checking item ' + item["Resource Name"] + ' with index ' + resource_table.Activities.indexOf(item));
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
    var id_count = _populateDivs(resource_table.Activities);

    $.ajax({
        url: "https://content-sheets.googleapis.com/v4/spreadsheets/1EdmNxW0F5jTdkemGx95QB_WbasvWVGEfVXuCAZ19cXU/values/A2%3AM",
        type: "get",
        data: {
          majorDimension: 'ROWS',
          // ranges: 'A7:M10',
          key: API_KEY
        },

        error: function(xhr, text_status, error) {
            _displayError(xhr, text_status, error);
        },
        success: function(response) {
            var new_activities = _storeData(response);
            // _displayLoading(false);
            _addGradeRange(new_activities);
            _renderSelects(new_activities);
            _addRow(new_activities, id_count);
            // _populateDivs(resource_table.Activities);
        },
        timeout: 10000
    });
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
    Store Google Sheet data in the resource_table variable
    This involves parsing every row from the table (stored as arrays)
    into individual JSON objects
    @param {object} response- REST response 
    @private
*/
function _storeData(response) {
    console.log("processing " + response.values.length + " activities from Google Sheets API");
    var new_activities = [];
    
    for(let i=0; i<response.values.length; i++) {
        var value = response.values[i];
        if(!value[11])
            value[11] = "";
        
        var new_activity = {
          "Resource Name": value[0],
          "Resource Link": value[1],
          "Duration": value[2],
          "Grade Level": value[3],
          "Subject": value[4].split(", "),
          "Tech Required": value[5].split(", "),
          "Author": value[6],
          "Author Link": value[7],
          "Tags": value[8].split(", "),
          "Additional Info": value[9],
          "Description": value[10],
          "Img URL": value[11]
        };  

        if(!resource_table.Activities.find(act => act["Resource Name"] === new_activity["Resource Name"])) {
            console.log("pushing " + new_activity["Resource Name"]);
            resource_table.Activities.push(new_activity);
            new_activities.push(new_activity);

            var search_text_arr = [];
            value.map(function(field) { 
                field.split(', ').map(item => search_text_arr.push(item.toUpperCase()));
            });
            search_text.push(search_text_arr);
        }
    }
    return new_activities;
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
    Create a row of new activities. This is exclusively called after the Google Sheets API has returned
    new activities from the Resource Table
    @param {array} render_data - list of new activity objects to render
    @param {id_count} - number of rendered features (not unique) already in the grid
    @private 
*/  
function _addRow(render_data, id_count) {
    var row = {'data': render_data, 'title': 'New Activities:', 'id': 'new-activities'};
    // TODO - creat helper fn for checking images
    no_img = render_data.filter(resource => (resource["Img URL"] == "" || resource["Img URL"] == null));
    for(let i=0; i<no_img.length; i++) {
        no_img[i]["Img URL"] = '/s/code-icon.png';
    }

    $('#feature-container').append('<section class="features" id="'+row.id+'"></section>');
        _buildRow(row, id_count);

        $("#new-activities").slick({
            dots: true,
            infinite: true,
            slidesToShow: 3,
            slidesToScroll: 3
        });
        id_count += render_data.length;
        $('#'+row.id).prepend('<div class="section-header">' + row.title + '</div>');
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