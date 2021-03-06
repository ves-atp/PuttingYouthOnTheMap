vgis.namespace("widget.print");

vgis.widget.print = function (params) {
    'use strict';
    
    var printDijit,
        $parentDiv;

    /*params = params || {
        map: {},
        divToAttachTo: "",
        customTitle: VIEWER_TITLE,
        legendLayers: [],
        customText: {
            panelTitle: VIEWER_TITLE,
            layerTitle: "unknown layer",
            sourceUrl: "",
            description: ""
        }
    };*/
    
    function start() {
        $parentDiv = $("#" + params.divToAttachTo).parent();
        // get print templates from the export web map task
        var printInfo = esri.request({
            "url": PRINT_URL,
            "content": { "f": "json" }
        });
        printInfo.then(handlePrintInfo, handleError);
    }

    function end() {
        printDijit.destroy(); // this destroys the divToAttachTo
        $parentDiv.append("<div id='" + params.divToAttachTo + "' style='text-align:center;'></div>");
    }

    function handlePrintInfo(resp) {
        var layoutTemplate, templateNames, templateLabels, mapOnlyIndex, templates, f, r, re;

        layoutTemplate = dojo.filter(resp.parameters, function (param, idx) {
            return param.name === "Layout_Template";
        });

        if (layoutTemplate.length === 0) {
            console.log("print service parameters name for templates must be \"Layout_Template\"");
            return;
        }
        templateNames = layoutTemplate[0].choiceList;
        templateLabels = dojo.clone(layoutTemplate[0].choiceList);
        
        /*//make user friendly names
        f = ["A3 Portrait", "A3 Landscape", "A4 Portrait", "A4 Landscape", "Letter ANSI A Portrait", "Letter ANSI A Landscape", "Tabloid ANSI B Portrait", "Tabloid ANSI B Landscape", "MAP_ONLY"];
        r = ["A3 Portrait - 11.69 x 16.54 (in)", "A3 Landscape - 16.54 x 11.69 (in)", "A4 Portrait - 8.3 x 11.7 (in)", "A4 Landscape - 11.7 x 8.3 (in)", "ANSI A Portrait - 8.5 x 11 (in)", "ANSI A Landscape 11 x 8.5 (in)", "ANSI B Portrait 11 x 17 (in)", "ANSI B Landscape 17 x 11 (in)", "Map Image (No Text) 8.3 x 11.46 (in)"];

        re = $.map(f, function (v, i) {
            return new RegExp('\\b' + v + '\\b', 'g');
        });

        //jQuery('#colCenterAddress').val(function (i, val) {
        $.each(templateLabels, function (i, val) {
            $.each(f, function (j, v) {
                val = val.replace(re[j], r[j]);
            });
            templateLabels[i] = val;
        });*/

        // create a print template for each choice
        templates = dojo.map(templateNames, function (ch, index) {
            var plate = new esri.tasks.PrintTemplate();
            plate.layout = ch;
            plate.label = templateLabels[index];
            plate.format = "PDF";
            plate.layoutOptions = {
                "authorText": "Source: UC Davis Center for Regional Change",
                "copyrightText": "http://mappingregionalchange.ucdavis.edu/roi",
                "legendLayers": [], //params.legendLayers,
                "scalebarUnit": "Miles",
                "customTextElements": [{
                        "PanelTitle": params.customText.panelTitle
                    },{
                        "LayerTitle": params.customText.layerTitle
                    }, {
                        "SourceUrl": params.customText.sourceUrl
                    }, {
                        "LayerDescription": wordwrap(params.customText.description, 35, '\n', false)
                    }]
            };
            return plate;
        });

        // create the print dijit
        printDijit = new esri.dijit.Print({
            map: maps[printMapIndex],
            templates: templates,
            url: PRINT_URL
        }, dojo.byId(params.divToAttachTo));
        printDijit.on('print-complete', function(evt) {
            if (PRINT_PROXY_REPLACE !== null) {
                evt.result.url = evt.result.url.replace(PRINT_PROXY_REPLACE[0], PRINT_PROXY_REPLACE[1]);
            } 
        });
        printDijit.startup();
    }

    function handleError(err) {
        console.log("Printer failed: ", err);
    }
    
    function wordwrap( str, width, brk, cut ) {     
        brk = (brk || '\n');
        width = (width || 75);
        cut = (cut || false);
     
        if (!str) { return str; }
     
        var regex = '.{1,' +width+ '}(\\s|$)' + (cut ? '|.{' +width+ '}|.+$' : '|\\S+?(\\s|$)');
     
        return str.match( new RegExp(regex, 'g') ).join( brk );     
    }

    return {
        start: start,
        end: end
    };
};
