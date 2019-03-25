var table_state = 'Activities';     // what is currently being displayed?
// var table_source;                   // store data for the DataTables plugin to render
var resource_table = {"Activities": []};
var table_ref;                      // reference variable for accessing the data table
var select_expanded = false;        // used to dynamically render the dropdown- checkbox menu
const columns = [{ title: "Resource Name" }, { title: "Description" }, { title: "Duration" }, { title: "Grade Level "},
                    { title: "Subject" }, { title: "Tech Required "}, { title: "Author" }];

// When the page loads populate the table with activities and render the dropdown menus.
// Add a graderange to each activity that JS can interpret
$(document).ready(function(){
    _getResourceTable();

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

function _getResourceTable() {
      $.ajax({
        url: "https://content-sheets.googleapis.com/v4/spreadsheets/1EdmNxW0F5jTdkemGx95QB_WbasvWVGEfVXuCAZ19cXU/values/A2%3AM",
        type: "get",
        data: {
          majorDimension: 'ROWS',
          // ranges: 'A7:M10',
          key: 'AIzaSyD5Nq5v_wpiKmyyJ9Pxx170HNlsqM8VZsA'
        },
        success: function(response) {
          storeData(response);
        },
      });
    }

    function storeData(response) {
        console.log("processing " + response.values.length + " activities");
        for(let i=0; i<response.values.length; i++) {
            var value = response.values[i];
            
            resource_table.Activities.push({
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
              "Img URL": typeof value[12] !== undefined ? value[12] : ""
            });
        }
        _addGradeRange();
        _renderSelects();
        _addGradeRange();
        _setupDataTable(renderTable());
        renderFeatures();
    }

/*
    Add options to a dropdown menu
    @param {string} id - HTML id of the dropdown to create
    @param {string} key - JSON key in the Activity object that corresponds to the options for this menu
    @private
*/
function renderTable() {
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
        _refreshTable(table_source);
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
    Apply user-defined filters to the array of resources and return a filtered array
    @returns {array} of activities that match all filters
    @private
*/
function _filterResources(resource_list) {
    var render_activities = [];
    // render_activities = _applyFilter(resource_list, "tech-required", "Tech Required");
    render_activities = _applyFilter(resource_list, "subject", "Subject");
    render_activities = _applyCheckboxFilter(render_activities, "#tech-required", "Tech Required");
    render_activities = _applyGradeFilter(render_activities);

    return render_activities;
}

/*
    Apply a filter to an array of activities and return a filtered array
    @param {array} activities - array to filter
    @param {string} id - HTML id of the filtering element (in this case a select object)
    @param {string} key - JSON key of the activity field to apply the filter to
    @returns {array} of activities that match the given filter
    @private
*/
function _applyFilter(activities, id, key) {
    var filter_val = $('#' + id).val();
    var render_activities = [];

    if(filter_val != "") {
        $.each(activities, function(index, item) {
        // console.log('checking: ' + filter_val + ' against ' + item[key]);
            if(Array.isArray(item[key])) {
                $.each(item[key], function(index, array_item) {
                    if(array_item == filter_val) render_activities.push(item);
                });
            } else {

                if(item[key] == filter_val) render_activities.push(item);
            }
        });
    } else render_activities = activities;

    return render_activities;
}

/*
    Apply a filter to an array of activities and return a filtered array
    @param {array} activities - array to filter
    @param {string} id - HTML id of the filtering element (in this case a select object)
    @param {string} key - JSON key of the activity field to apply the filter to
    @returns {array} of activities that match the given filter
    @private
*/
function _applyCheckboxFilter(activities, id, key) {
    var filter_values = [];
    var render_activities = [];
    var checkboxes = $(id).find('input.tech-check');

    $.map(checkboxes, function(item, index) {
        if(item.checked)
            filter_values.push(item.value);
    });
    console.log(filter_values);

    // if(filter_values.length == 0) return activities;

    $.map(activities, function(item) {
        if(Array.isArray(item[key])) {
            $.map(item[key], function(field_item) {
                if(filter_values.includes(field_item) && !render_activities.includes(item)) {
                    render_activities.push(item);
                    return;
                }
            });
        } else {
            if(filter_values.includes(item[key])) render_activities.push(item);
        }
    });
    console.log('filtering ' + render_activities.length + " resources");

    return render_activities;
}

/*
    Apply the grade range filter to an array of activities and return a filtered array
    @param {array} activities - array to filter
    @returns {array} of activities that match the user-defined grade level
    @private
*/
function _applyGradeFilter(activities) {
    var grade_filter = $('#grade').val();
    var render_activities = [];

    if(grade_filter != "") {
        if(grade_filter === 'K') grade_filter = 0;
        else grade_filter = parseInt(grade_filter);

        $.each(activities, function(index, item) {
            if(grade_filter >= item["Grade Range"].low && grade_filter <= item["Grade Range"].high)
                render_activities.push(item);
        });
    } else render_activities = activities;

    return render_activities;
}

/*
    Parent function for rendering the drop down menus at the top of the table
    Populate each menu with the options available in the activities array
    @private
*/
function _renderSelects() {
  // this format works for tag options but these would be better to use checkboxes or 
  // a keyword search to allow for selecting multiple tags
    // _renderSelect("#tech-required","Tech Required");
    _renderCheckboxes('#tech-required',"Tech Required");
    _renderSelect("#subject","Subject");
    _renderGradeSelect();
}

/*
    Add options to a dropdown menu
    @param {string} id - HTML id of the dropdown to create
    @param {string} key - JSON key in the Activity object that corresponds to the options for this menu
    @private
*/
function _renderSelect(id, key) {

    var select_options = [];
    $.each(resource_table.Activities, function(index, item) {
        if(Array.isArray(item[key])) {
            $.each(item[key], function(index, array_item) {
                if($.inArray(array_item, select_options) === -1) select_options.push(array_item);
            });
        } else {
            if($.inArray(item[key], select_options) === -1) select_options.push(item[key]);
        }
    });

    $(id).append(
        $.map(select_options, function(item) {
            return '<option value="' + item + '">' + item + '</option>';
        }).join());
}

/*
    Add options to a checkboxfilter
    @param {string} id - HTML id of the dropdown to create
    @param {string} key - JSON key in the Activity object that corresponds to the options for this menu
    @private
*/
function _renderCheckboxes(id, key) {
    var select_options = [];
    var container = $(id);
    var tag_id = id.substr(1);

    $.each(resource_table[table_state], function(index, item) {
        if(Array.isArray(item[key])) {
            $.each(item[key], function(index, array_item) {
                if($.inArray(array_item, select_options) === -1) select_options.push(array_item);
            });
        } else {
            if($.inArray(item[key], select_options) === -1) select_options.push(item[key]);
        }
    });
    console.log('rendering ' + select_options);

    $.map(select_options, function(item, index) {
        var check_label = $('<label />', { 'for': (tag_id + index), text: item, style: 'font-weight: normal' }).appendTo(container);
        $('<input />', { type: 'checkbox', id: (tag_id + index), class: 'tech-check', value: item, checked: 'true', name: tag_id }).appendTo(check_label);
        // $('<br />').appendTo(container);
    });
}


/*
    Add options to the grade level dropdown menu
    Give users all grade options from K-12
    @private
*/
function _renderGradeSelect() {
    var grade_options = ['K','1','2','3','4','5','6','7','8','9','10','11','12'];
    $('#grade').append(
        $.map(grade_options, function(item) {
            return '<option value="' + item + '">' + item + '</option>';
        }).join());
}

/*
    Create a lightbox with more info about the activity, including a thumbnail (if available),
    link to the host page (author), activity description and keyword tags
    @param {object} item - Activity object used to build ligthbox content
    @param {int} index - activity index number used for building element IDs
    @private
*/
function _moreInfo(item, index) {
    var author_link = '<a target="_blank" href="' + item["Author Link"] + '">' + item["Author"] + '</a>';
    var activity_link = '<a target="_blank" href="' + item["Resource Link"] + '"">';
    var lightbox_link = '<a href="#" data-featherlight="#activity'+ index + '"">More Info</a>';
    var lightbox_div = lightbox_link + '<div  style="display: none"><div id="activity' + index +'" style="padding: 10px;">' + activity_link;

    // console.log('building more info url=' + item["Img URL"]);
    if(item["Img URL"] != "")
            lightbox_div += '<img src="' + item["Img URL"] + '" style="width: 50%; margin-left: 25%;"><br />';
    lightbox_div += '<span align="center" style="margin-left: 40%"><h3>' + item["Resource Name"] + '</h3></a></span><br />';
    lightbox_div += 'This activitiy was created by ' + author_link + ' and has the following keyword tags: <br />' + item['Tags'].join(', ') + '</div></div>';


        // lightbox_link.replace('mylightbox', 'activity'+index) + lightbox_div.replace('mylightbox', 'activity'+index);
        // lightbox = lightbox.replace('#author', author_link).replace('#tags', item['Tags'].join(', '));
    return lightbox_div;
}

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

    console.log('built ' + features.length + ' features with first author ' + features[0]["Author"]);
    return features;
}

/*
    Create a special lightbox for any activity that does not meet CS standards,
    and so requires adaptation by a teacher in order to qualify as a CS activity
    @param {string} activity_link - Link to the activity page
    @param {int} index - activity index number used for building element IDs
    @param {string} name - name of the activity
    @private
*/
function _adaptActivity(activity_link, index, name) {
    var resource_link = '<a href="#" target="_blank" data-featherlight="#adapt' + index + '">' + name + '</a>';
    resource_link += '<div style="display: none"><div id="adapt' + index + '" style="padding: 10px;">';
    resource_link += `<div class="header"><img src="/s/adapt-icon.png"><h3>Thank you for choosing one of our activities for adaptation!</h3></div>
        <br />
        This is an activity that we believe belongs in this resource, but currently does not meet Computer Science Education standards. We consider this activity to be <b>primed for CS Ed</b> and we believe it could be creatively adapted to fit your classroom needs. You can find the original activity page at the link below.
        <div style="padding-top: 1em">`;
    resource_link += activity_link;
    resource_link += `</div>
            <br />
            If you choose to work with this activity we'd love to collect some information on how it went! This will help us cultivate and improve the activities on this page and assist teachers who want to use this activity in the future. Please <a href="https://www.whitemountainscience.org/resource-table-contact-form">click here</a> to provide us with feedback.
            </div>
        </div>`;
    return resource_link;
}

/*
    DEPRECATED
    Add a row corresponding to one activity to the html table
    For JSON values that could be arrays (tech and subject) add spaces between
    items if it is an array
    @param {object} activity - Activity object to build a row for
    @returns line of HTML to append to the table
    @private
*/
// function _buildRow(item) {
//     var new_line;
//     new_line = '<tr><td><a href="' + item["Resource Link"] + '"">' + item["Resource Name"] + '</a></td><td>';
//     // var tags = item["Tags"].join(", ");
//     var tech;
//     var subjects;
//     if(Array.isArray(item["Tech Required"])) {
//         tech = item["Tech Required"].join(", ");
//     } else tech = item["Tech Required"];

//     if(Array.isArray(item["Subject"])) {
//         subjects = item["Subject"].join(", ");
//     } else subjects = item["Subject"];
//     console.log('buidling new line with subjects ' + subjects);


//     new_line += item["Description"] + '</td><td>' + item["Duration"] + '</td><td>' + item["Grade Level"] + '</td><td>' + subjects + '</td><td>' + tech;
//     new_line += '</td><td><a href="' + item["Author Link"] + '">' + item["Author"] + '</a></td></tr>';
//     return new_line;
// }

/*
    Add a code-interpretable grade range to an activity in the array
    'K' get stored as grade 0. The upper limit for unbounded range is 12
    @private
*/
function _addGradeRange() {
    $.each(resource_table.Activities, function(index, item) {
        item["Grade Range"] = {};
        var low = item["Grade Level"][0];
        var high;

        if(item["Grade Level"][item["Grade Level"].length-1] === '+') {
            high = 12;
        } else {
            high = parseInt(item["Grade Level"].split('-')[1]);
        }

        if(low === 'K') low = 0;
        else low = parseInt(low);

        item["Grade Range"]["low"] = low;
        item["Grade Range"]["high"] = high;
    });
}

function _refreshTable(table_source) {
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
}