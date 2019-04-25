// Shared core of functions between different versions of the Resource Table vs. Activity Grid

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
    Apply user-defined filters to the array of resources and return a filtered array
    @returns {array} of activities that match all filters
    @private
*/
function _filterResources(resource_list, search=false) {
    var render_activities = [];
    // render_activities = _applyFilter(resource_list, "tech-required", "Tech Required");
    render_activities = _applyFilter(resource_list, "subject", "Subject");
    render_activities = _applyCheckboxFilter(render_activities, "#tech-required", "Tech Required");
    render_activities = _applyGradeFilter(render_activities);
    if(search)
        render_activities = _applySearchFilter(render_activities);

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
    // console.log(filter_values);

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
    // console.log('filtering ' + render_activities.length + " resources");

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
    Print a generic error message if the resource does not load
    @param {object} response - REST Request Error message
    @private
*/
function _displayError(xhr, text_status, error) {
    console.log('jqXHR:');
    console.log(jqXHR);
    console.log('textStatus:');
    console.log(textStatus);
    console.log('errorThrown:');
    console.log(errorThrown);
    // print a generic error message with instructions
    // $('#feature-container').html(`Whoops! The resource failed to load. Please wait a few minutes and then refresh the page. 
    //     If the problem persists please <a href="https://www.whitemountainscience.org/contact-us">contact</a> a WMSI administrator.`);
    _getResourceTable();
}

/*
    Parent function for rendering the drop down menus at the top of the table
    Populate each menu with the options available in the activities array
    @private
*/
function _renderSelects(data=resource_table.Activities) {
    _renderCheckboxes('#tech-required',"Tech Required", data);
    _renderSelect("#subject","Subject", data);
    _renderGradeSelect();
}

/*
    Add options to a dropdown menu
    @param {string} id - HTML id of the dropdown to create
    @param {string} key - JSON key in the Activity object that corresponds to the options for this menu
    @private
*/
function _renderSelect(id, key, data) {
    var select_options = $(id).children().toArray().map(i => i.innerHTML);
    var new_options = [];

    $.each(data, function(index, item) {
        if(Array.isArray(item[key])) {
            $.each(item[key], function(index, array_item) {
                if($.inArray(array_item, select_options) === -1) {
                    select_options.push(array_item);
                    new_options.push(array_item);
                }
            });
        } else {
            if($.inArray(item[key], select_options) === -1) {
                select_options.push(item[key]);
                new_options.push(item[key]);
            }
        }
    });

    $(id).append(
        $.map(new_options, function(item) {
            return '<option value="' + item + '">' + item + '</option>';
        }).join());
}

/*
    Add options to a checkboxfilter
    @param {string} id - HTML id of the dropdown to create
    @param {string} key - JSON key in the Activity object that corresponds to the options for this menu
    @private
*/
function _renderCheckboxes(id, key, data) {
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

    container.html('');
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
    Add a code-interpretable grade range to an activity in the array
    'K' get stored as grade 0. The upper limit for unbounded range is 12
    @param {array} data- activities that need a grade range added
    @private
*/
function _addGradeRange(data=resource_table.Activities) {
    $.each(data, function(index, item) {
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