(function(nx) {
    var EXPORT = nx.define("glance.common.Dialog", nx.ui.Element, {
        view: {
            cssclass: "glance-dialog",
            cssstyle: {
                display: "{visible}"
            },
            content: [{
                cssclass: "mask"
            }, {
                name: "body",
                cssclass: "body"
            }]
        },
        properties: {
            model: null,
            routable: false,
            visible: true,
            fixHeight: {
                dependencies: "parent, model",
                async: true,
                value: function(property, parent, model) {
                    // console.log(model);   //clientModel
                    var body = this.body();
                    body.removeStyle("top");
                    body.removeStyle("bottom");
                    body.removeStyle("height");
                    // FIXME may not work correctly
                    nx.timer(0, function() {
                        var height = body.getBound().height;
                        body.setStyle({
                            top: "0px",
                            bottom: "0px",
                            height: height + "px"
                        });
                    }.bind(this));
                }
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-dialog": {
                    "position": "fixed",
                    "left": "0",
                    "top": "0",
                    "width": "100%",
                    "height": "100%"
                },
                ".glance-dialog > .mask": {
                    "position": "absolute",
                    "left": "0",
                    "top": "0",
                    "width": "100%",
                    "height": "100%",
                    "background": "rgba(0,0,0,0.2)"
                },
                ".glance-dialog > .body": {
                    "position": "absolute",
                    "left": "0px",
                    "right": "0px",
                    "width": "25em",
                    "margin": "auto",
                    "font-size": "1.5em",
                    "background": "#f7f7f7"
                }
            })
        }
    });
})(nx);
