(function(nx) {
    var EXPORT = nx.define("glance.perspective.DialogThingDetail", glance.perspective.DialogPortrait, {
        view: {
            cssclass: "glance-dialog-thing",
            extend: {
                title: {
                    content: "{model.name}"
                },
                portrait: {
                    properties: {
                        src: nx.binding("model.category", function(category) {
                            return "icons/" + category + ".png";
                        })
                    }
                },
                subtitle: {
                    content: ["SN: ", "C02PH22RG3QN"]
                },
                content: {
                    content: "<bullet>DEVICE INFO</bullet><br/>" +
                        "<bullet>•</bullet> Mode: A1526/M8244G/B-616-0119-MB771*/A,Mid 2014<br/>" +
                        "<bullet>•</bullet> Processor: 2.2 GHz <br/>" +
                        "<bullet>•</bullet> Memory: 2 GB 1600 MHz DDR3<br/>" +
                        "<bullet>•</bullet> Graphics: Intel Iris Pro 1536 MB"
                }
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-dialog-thing > .body > .content > bullet": {
                    "color": "#00bab0",
                    "font-weight": "bold"
                }
            })
        }
    });
})(nx);
