var table_state = 'activities';     // what is currently being displayed?
var table_source;                   // store data for the DataTables plugin to render
var table_ref;                      // reference variable for accessing the data table
var select_expanded = false;        // used to dynamically render the dropdown- checkbox menu
const columns = [{ title: "Resource Name" }, { title: "Description" }, { title: "Duration" }, { title: "Grade Level "},
                    { title: "Subject" }, { title: "Tech Required "}, { title: "Author" }];

// When the page loads populate the table with activities and render the dropdown menus.
// Add a graderange to each activity that JS can interpret
$(document).ready(function(){
    // renderTable();
    _renderSelects();
    _addGradeRange();
    _tableData(resource_table.Activities);
    _setupDataTable();

    // switch between activity and curriculum views
    $('input[name=view]').click(function() {
        var selected = $('input[name=view]:checked').val();
        if(selected != table_state) {
            table_state = selected;
            renderTable();   
        }
    });

    $('input[name=tech-required]').change(function() {
      renderTable();
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
function renderTable() {
    var render_data = resource_table[table_state];
    // if(table_state === 'activities')
    //     render_data = _filterResources(resource_table.Activities);
    // else
    //     render_data = _filterResources(resource_table.Curricula);//resource_table.Curricula;
    _tableData(render_data);
    _refreshTable();

    // $('#table-content').html('');
    // $('#table-content').html(
    //     $.map(render_data, function(item, index) {
    //         return _buildRow(item);
    //     }).join());
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
    Convert the data JSON object into an array of arrays that DataTables can render
*/
function _tableData(data) {
    table_source = [];
        $.map(data, function(item) {
            table_source.push( ['<a href="' + item["Resource Link"] + '"">' + item["Resource Name"] + '</a>', 
                item["Description"], item["Duration"], item["Grade Level"], item["Subject"], item["Tech Required"],
                '<a href="' + item["Author Link"] + '">' + item["Author"] + '</a>']);  
        });
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
    var checkboxes = $(id).find('input[type=checkbox]');
    // console.log(checkboxes);

    $.map(checkboxes, function(item, index) {
        if(item.checked)
            filter_values.push(item.value);
    });
    // console.log(filter_values);

    if(filter_values.length == 0) return activities;

    $.map(activities, function(item) {
        if(Array.isArray(item[key])) {
            $.map(item[key], function(field_item) {
                if(filter_values.includes(field_item)) render_activities.push(item);
            });
        } else {
            if(filter_values.includes(item[key])) render_activities.push(item);
        }
    });

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

    $.each(resource_table.Activities, function(index, item) {
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
        $('<input />', { type: 'checkbox', id: (tag_id + index), value: item, checked: 'true', name: tag_id }).appendTo(check_label);
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
    Add a row corresponding to one activity to the html table
    For JSON values that could be arrays (tech and subject) add spaces between
    items if it is an array
    @param {item} activity - Activity object to build a row for
    @returns line of HTML to append to the table
    @private
*/
function _buildRow(item) {
    var new_line;
    new_line = '<tr><td><a href="' + item["Resource Link"] + '"">' + item["Resource Name"] + '</a></td><td>';
    // var tags = item["Tags"].join(", ");
    var tech;
    var subjects;
    if(Array.isArray(item["Tech Required"])) {
        tech = item["Tech Required"].join(", ");
    } else tech = item["Tech Required"];

    if(Array.isArray(item["Subject"])) {
        subjects = item["Subject"].join(", ");
    } else subjects = item["Subject"];


    new_line += item["Description"] + '</td><td>' + item["Duration"] + '</td><td>' + item["Grade Level"] + '</td><td>' + subjects + '</td><td>' + tech;
    new_line += '</td><td><a href="' + item["Author Link"] + '">' + item["Author"] + '</a></td></tr>';
    return new_line;
}

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

function _refreshTable() {
    table_ref.clear().rows.add(table_source).draw();
}

/*
    Wrap our table with the DataTables plugin from https://www.datatables.net/
    This makes the columns sortable and options for filtering by a search bar
    and displaying n entries per page.
*/
function _setupDataTable() {
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
            { "orderable": false, "targets": [1, 4, 5] },
            { "type": "grade", "targets": 2 }
            // { "dom": '<"wrapper"fli>' }
        ]
    });
}