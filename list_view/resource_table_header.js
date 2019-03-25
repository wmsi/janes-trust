var table_state = 'activities';

// When the page loads populate the table with activities and render the dropdown menus.
// Add a graderange to each activity that JS can interpret
$(document).ready(function(){
    renderTable();
    _renderSelects();
    _addGradeRange();
    $('input[name=view]').click(function() {
        if($('input[name=view]:checked').val() != table_state) {
            table_state = $('input[name=view]:checked').val();
            renderTable();
        }
    });
});

/*
    Add options to a dropdown menu
    @param {string} id - HTML id of the dropdown to create
    @param {string} key - JSON key in the Activity object that corresponds to the options for this menu
    @private
*/
function renderTable() {
    var render_data = [];
    if(table_state === 'activities')
        render_data = _filterResources(resource_table.Activities);
    else
        render_data = _filterResources(resource_table.Curricula);//resource_table.Curricula;

    $('#table-content').html(
        $.map(render_data, function(item, index) {
            return _buildRow(item);
        }).join());
}

/*
    Apply user-defined filters to the array of resources and return a filtered array
    @returns {array} of activities that match all filters
    @private
*/
function _filterResources(resource_list) {
    var render_activities = [];
    render_activities = _applyFilter(resource_list, "tech-required", "Tech Required");
    render_activities = _applyFilter(render_activities, "subject", "Subject");
    render_activities = _applyGradeFilter(render_activities);

    return render_activities;
}


/*
    Apply user-defined filters to the array of curricula and return a filtered array
    @returns {array} of activities that match all filters
    @private
*/
// function _filterCurricula() {
//     var render_activities = [];
//     render_activities = _applyFilter(resource_table.Curricula, "tech-required", "Tech Required");
//     render_activities = _applyFilter(render_activities, "subject", "Subject");
//     render_activities = _applyGradeFilter(render_activities);

//     return render_activities;
// }

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
    _renderSelect("#tech-required","Tech Required");
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
    if(table_state === 'activities')
        new_line = '<tr><td><a href="' + item["Activity Link"] + '"">' + item["Activity Name"] + '</a></td><td>';
    else
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


    new_line += item["Duration"] + '</td><td>' + item["Grade Level"] + '</td><td>' + subjects + '</td><td>' + tech;
    new_line += '</td><td><a href="' + item["Author Link"] + '">' + item["Author"] + '</a></td><td>' + item["Description"] + '</td></tr>';
    return new_line;
}


/*
    Add a row corresponding to one curriculum to the html table
    For JSON values that could be arrays (tech and subject) add spaces between
    items if it is an array
    @param {item} activity - Activity object to build a row for
    @returns line of HTML to append to the table
    @private
*/
function _buildCurriculumRow(item) {
    var new_line = '<tr><td><a href="' + item["Resource Link"] + '"">' + item["Resource Name"] + '</a></td><td>';
    var tech;
    var subjects;
    if(Array.isArray(item["Tech Required"])) {
        tech = item["Tech Required"].join(", ");
    } else tech = item["Tech Required"];

    if(Array.isArray(item["Subject"])) {
        subjects = item["Subject"].join(", ");
    } else subjects = item["Subject"];


    new_line += item["Duration"] + '</td><td>' + item["Grade Level"] + '</td><td>' + subjects + '</td><td>' + tech;
    new_line += '</td><td><a href="' + item["Author Link"] + '">' + item["Author"] + '</a></td><td>' + item["Description"] + '</td></tr>';
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