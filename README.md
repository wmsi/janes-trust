<!----- Conversion time: 0.573 seconds.


Using this Markdown file:

1. Cut and paste this output into your source file.
2. See the notes and action items below regarding this conversion run.
3. Check the rendered output (headings, lists, code blocks, tables) for proper
   formatting and use a linkchecker before you publish this page.

Conversion notes:

* Docs to Markdown version 1.0β16
* Mon Mar 25 2019 14:46:13 GMT-0700 (PDT)
* Source doc: https://docs.google.com/a/whitemountainscience.org/open?id=1loaX0o6KVTZv07Z2g-Tdo5r0Fd7PGITB9RDjZ4wWgrY
----->


_This document was put together in March, 2019 to facilitate the handoff of the bulk of this site's development work for the Jane's Trust 2018-2019 Grant. The goal of this document is to outline what's been done so far and why, with some potential next steps that could be accomplished with future funding. _


### Related Documentation:



*   [Adding Activities to the Site](https://drive.google.com/a/whitemountainscience.org/open?id=1Hs7H0mQIs9hFH5tkYoKdG3FD8dvXJInrGWSAbhZfQww)
*   [Adding Images to Activities](https://drive.google.com/a/whitemountainscience.org/open?id=1CXYLmfHWAhDx95hU0YXFIy4ovDY7eyaAYiiRtNlnILA)


### Web Page Backend



*   **Resource List: **This site originated as this [Resource Table](https://drive.google.com/a/whitemountainscience.org/open?id=1EdmNxW0F5jTdkemGx95QB_WbasvWVGEfVXuCAZ19cXU) of CS Ed activities. The same Google Sheet is still being used as the backend for our website, via the [Google Sheets API](https://developers.google.com/sheets/api/). For this reason it's important not to edit the format of the Google Sheet (e.g. column headers/ values) without making a corresponding change in the Javascript file for the website.
*   **[Gridview.js](https://github.com/wmsi/janes-trust/blob/master/grid_view/gridview.js): **This file is the backend for the thumbnail-grid version hosted as the [/activity-grid page](https://whitemountainscience.org/activity-grid). It uses the Google Sheets API to pull activities from the spreadsheet, and the [Slick](https://github.com/kenwheeler/slick/) carousel plugin to render them into a grid of scrolling thumbnails. This grid works with all the same filters as the list view (Grade, Subject, Tech Required, and Keyword Search). The categories right now are largely arbitrary but should become more well-informed by further user feedback (see Next Steps).
*   **[Resource_datatable_header.js:](https://github.com/wmsi/janes-trust/blob/master/list_view/resource_datatable_header.js)** This file is the backend for the table view of activities hosted as the [/resource-table page](https://whitemountainscience.org/resource-table). It uses the Google Sheets API to pull activities from the spreadsheet and the [Datatable plugin](https://datatables.net/) to render them into the table. It also includes 3 featured thumbnails above the datatable. These thumbnails so far **do not** have much of an algorithm determining which ones appear as features- at this time one of them is required to come from our list of preferred authors (hardcoded into the _buildFeatures() function) and the other two are random. If we hope to continue using this format as a way to support educators we should strongly consider putting more development effort into the Featured Activities section whenever funding is available to do so.


### Web Page Frontend

Both versions of the activity list ([table](https://www.whitemountainscience.org/resource-table) and [grid](https://www.whitemountainscience.org/activity-grid) views) are hosted on the Squarespace-based domain [https://whitemountainscience.org](https://whitemountainscience.org). Each page uses a slightly different "Code Block" to format html elements with specific id attributes that the .js files can use to render a complete web page. These pages also make use of the Squarespace Header Code Injection feature to add some styling and include javascript files. This code can be viewed by going to the "Advanced" tab of the Squarespace "Page" dialog for each of these pages.


### Next Steps

These steps are listed roughly in order of implementation. Some of these involve minor maintenance and improvement tasks that will take place as we continue gathering feedback on this resource. Further down the list are improvements that could be made if another round of funding comes through for this project.



*   Continue gathering educator feedback through the [Resource Website Teacher Survey](https://drive.google.com/open?id=1xjBLTNm99-0cziYkoj_LFmqhmDQTegYKDRls1Dz4Aig). Make minor improvements as possible to meet teacher needs- at a fundamental level this will involve adding specific types of activities that match what happens in the classroom.
*   Add/ Improve a more streamlined way for educators to give feedback on the site. This could include outlining how they adapted any activities they used, a way to add new activities to the site, and a method for inquiring about WMSI trainings and technology.
*   Continue to find/ develop activities that support subject matter that is not typically thought of as being close to Computer Science (e.g. Music, Physical Education). Continue to build our repertoire of unplugged activities to support teachers who don't have or don't want to use technology in their classrooms.
*   Improve the backend of gridview and Featured Activities (above the table view) to more accurately anticipate teachers' needs. The gridview could potentially extend to cover an almost endless array of categories as long as it doesn't slow the page down.
    *   As we continue to grow the thumbnail-grid view we will probably have to refactor the backend in order to make it load/ changes displays more efficiently
*   Increase our social media presence for this resource by sharing it on Instagram, WMSI blog posts, etc. This could especially help when we apply for more funding by showing that this resource is actually getting some use. To the same end, collect educator testimonials from anyone who incorporates our web site(s) into their classroom teaching.

<!-- Docs to Markdown version 1.0β16 -->
