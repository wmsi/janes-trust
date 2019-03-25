var table_state = 'Activities';     // what is currently being displayed?
var resource_table = {"Activities": []};
var search_text = [];
var table_ref;                      // reference variable for accessing the data table
var select_expanded = false;        // used to dynamically render the dropdown- checkbox menu
const columns = [{ title: "Resource Name" }, { title: "Description" }, { title: "Duration" }, { title: "Grade Level "},
                    { title: "Subject" }, { title: "Tech Required "}, { title: "Author" }];

// When the page loads populate the table with activities and render the dropdown menus.
// Add a graderange to each activity that JS can interpret
$(document).ready(function(){
    _getResourceTable();
    // renderFeatures();

    // switch between activity and curriculum views
    $('input[name=view]').click(function() {
        var selected = $('input[name=view]:checked').val();
        if(selected != table_state) {
            table_state = selected;
            // renderTable(); 
            renderFeatures();  
        }
    });

    $('input[name=tech-required]').change(function() {
      // renderTable();
      renderFeatures();
    });

});

/*
    Render 3 Featured Activities at the top of the page. Collect a list of all
    activities with img urls that match the set of filters chosen. Then pick
    features from this list based on keywords
*/
function renderFeatures() {
    var render_data = _filterResources(resource_table[table_state]);
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
    renderFeatures();
}

/*
    Uncheck all options in the "Tech Required" dropdown
*/
function uncheckTech() {
    var checkboxes = $('#tech-required').find('input.tech-check');
    $.map(checkboxes, function(item, index) {
        item.checked = false;
    });
    renderFeatures();
}

/*
    Create rows of 'div' elements for the slick plugin to turn into carousels
    In order to stay readable independent of the number of rows, this function
    shoudl call a helper function for each new row
*/
function _populateDivs(render_data) {
    // render_data = render_data.filter(resource => resource["Img URL"] != "");

    // fill in missing image links with a placeholder
    no_img = render_data.filter(resource => resource["Img URL"] == "");
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
}

function _buildRow(row, index_offset) {
    var jq_id = '#' + row.id;
    $(jq_id).empty();

    if(row.data.length == 0)
        $(jq_id).display('none');

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

function _getRows(render_data) {
    const BEST_AUTHORS = ["Code.org Unplugged","code.org","Scratch","CSFirst with Google"];
    return [{
            'data': render_data.filter(resource => resource["Tags"].includes("unplugged")), 
            'title': "Unplugged Activities:",
            'id': 'unplugged'
        },
        {
            'data': render_data.filter(resource => BEST_AUTHORS.includes(resource.Author)),
            'title': "From our Favorite Authors:",
            'id': 'best-authors'
        },
        {
            'data': render_data.filter(function(resource) {
                return (resource.Subject.includes("Language Arts") || resource.Subject.includes("Social Studies")) ? true : false;
            }),
            'title': 'Activities in the Humanities:',
            'id': 'humanities'
        },
        {
            'data': render_data.filter(function(resource) {
                 return (resource.Subject.includes("Art") || resource.Subject.includes("Music")) ? true : false;
            }),
            'title': 'Activities in Music and the Visual Arts:',
            'id': 'arts'
        },
        {
            'data': render_data.filter(resource => (resource.Subject.includes('Science') || resource.Subject.includes('Math'))),
            'title': 'Science and Math Activities: ',
            'id': 'science-math'
        }];
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
    Filter out activities that don't contain text (in any field) that matches
    the text in the search bar
    @param {array} activities - list of activities to filter
    @returns {array} of activities that match the search bar filter
    @private
*/
function _applySearchFilter(activities) {
    var render_data = [];
    var search_string = $('#keyword-search').val().toUpperCase();
    console.log('reactive search called with string ' + search_string);
    if(search_string == "")
        return activities;

    activities.map(function(item) {
        var list_index = resource_table.Activities.indexOf(item);
        search_text[list_index].map(function(text) {
            if(text.includes(search_string))
                render_data.push(item);
        });
    });
    return render_data;
}

/*
    Get the "Resource Table" Google sheet from https://docs.google.com/spreadsheets/d/1EdmNxW0F5jTdkemGx95QB_WbasvWVGEfVXuCAZ19cXU/
    Once the HTTP Request is complete, call helper functions to populate the array and build
    page features. This function makes use of the Google Sheets API
    Reference: https://developers.google.com/sheets/api/
    @private
*/
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
            _addGradeRange();
            _renderSelects();
            _populateDivs(resource_table.Activities);
        },
    });
}

/*
    Store Google Sheet data in the resource_table variable
    This involves parsing every row from the table (stored as arrays)
    into individual JSON objects
    @param {object} response- REST response 
    @private
*/
function storeData(response) {
    console.log("processing " + response.values.length + " activities");
    for(let i=0; i<response.values.length; i++) {
        var value = response.values[i];
        if(!value[11])
            value[11] = "";
        
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
          "Img URL": value[11]
        });

        var search_text_arr = [];
        value.map(function(field) { 
            field.split(', ').map(item => search_text_arr.push(item.toUpperCase()));
        });
        search_text.push(search_text_arr);
    }
}

/*
    Parent function for rendering the drop down menus at the top of the table
    Populate each menu with the options available in the activities array
    @private
*/
function _renderSelects() {
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

    console.log('building more info url=' + item["Img URL"]);
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

// DEPRECATED //

/*
    Match search string with activity keyword tags
*/
// $('#keyword-search').change(function() {
// function reactiveSearch(unfilter=true) {
//     var search_string = $('#keyword-search').val();
//     console.log('reactive search called with string ' + search_string + ' and unfilter ' + unfilter);
//     var row_ids = $('#feature-container').children().toArray().map(function(item) {return item.id});

//     for(let i=0; i<row_ids.length; i++) {
//         $('#' + row_ids[i]).hide();

//         if(unfilter)
//             $('#' + row_ids[i]).slick('slickUnfilter');

//         if(search_string == "") {
//             $('#' + row_ids[i]).show();
//             continue;
//         }

//         $('#' + row_ids[i]).slick('slickFilter', function(index, item) {
//             var table_index = $(this).find(".thumbnail").attr("list-index");
//             if(table_index == undefined)
//                 table_index = $(this).attr('list-index');

//             var filtered_text = search_text[table_index].filter(item => item.includes(search_string.toUpperCase())); 

//             if(filtered_text.length != 0) {
//                 $('#' + row_ids[i]).show();
//                 return true;
//             } else
//                 return false;
//         });
//     }
// }