(function (nx) {
    var EXPORT = nx.define("devme.manage.main.List", nx.ui.Element, {
        view: {
            cssclass: "glance-main-list",
            content: [{
                cssclass: "empty-prompt",
                cssstyle: {
                    display: nx.binding("boards.length", function (count) {
                        return count ? "none" : "block";
                    })
                },
                content: [{
                    content: "Look like you don’t have any boards yet, by creating a board you could start to experience the power of GLANCE."
                }, {
                    type: "nx.ui.tag.HyperLink",
                    content: "Learn about board",
                    events: {
                        click: function (sender, evt) {
                            var dialog = new devme.manage.guide.MapFlow();
                            this.retain("popup", dialog.appendTo(global));
                            dialog.on("close", function (sender, data) {
                                this.release("popup");
                                if (data.create) {
                                    this.creater().dom().click();
                                }
                            }.bind(this));
                        }
                    }
                }, {
                    type: "nx.ui.tag.HyperLink",
                    content: "Create a new board",
                    events: {
                        click: function (sender, evt) {
                            this.creater().dom().click();
                        }
                    }
                }]
            }, {
                repeat: "{boards}",
                cssclass: "cell board",
                content: [{
                    cssclass: "snapshot"
                }, {
                    cssclass: "name",
                    content: "{scope.model.name}"
                }]
            }, {
                name: "creater",
                cssclass: "cell board-add",
                type: "nx.lib.component.FileLabel",
                properties: {
                    name: "newmap",
                    accept: "image/*"
                },
                events: {
                    change: function (sender, input) {
                        if (input.value) {
                            this.openEditor(input.files[0].name);
                        }
                    }
                }
            }]
        },
        properties: {
            boards: function () {
                return new nx.List([]);
            }
        },
        methods: {
            openEditor: function (model) {
                var editor = new devme.manage.editor.Editor();
                if (typeof model === "string") {
                    editor.model().name(model);
                } else if (model) {
                    editor.model(model);;
                }
                this.retain("editor", editor.appendTo(global));
                editor.on("close", function (sender, map) {
                    this.release("editor");
                    // TODO update the UI
                    this.boards().push(map);
                }.bind(this));
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-main-list": {
                    "position": "absolute",
                    "left": "0px",
                    "right": "0px",
                    "top": "2em",
                    "bottom": "0px",
                    "background": "#eeeeee"
                },
                ".glance-main-list > .empty-prompt": {
                    "position": "absolute",
                    "font-size": "0.7em",
                    "color": "#b3b3b3",
                    "left": "0px",
                    "right": "0px",
                    "top": "0px",
                    "bottom": "0px",
                    "width": "30em",
                    "height": "10em",
                    "margin": "auto"
                },
                ".glance-main-list > .empty-prompt:before": {
                    "content": "\\f03e",
                    "display": "block",
                    "text-align": "center",
                    "font-family": "FontAwesome",
                    "font-size": "5em"
                },
                ".glance-main-list > .empty-prompt > *": {
                    "display": "block",
                    "text-align": "center"
                },
                ".glance-main-list > .empty-prompt > a": {
                    "color": "#00bab0",
                    "cursor": "pointer"
                },
                ".glance-main-list > .cell": {
                    "display": "inline-block",
                    "vertical-align": "top",
                    "margin": "1em 0 0 1em",
                    "width": "6em",
                    "height": "7em",
                    "border": "1px dashed #b3b3b3",
                    "background": "#e8e8e8",
                    "text-align": "center"
                },
                ".glance-main-list > .cell:hover": {
                    "background": "#d7d7d7"
                },
                ".glance-main-list > .cell:active": {
                    "background": "#e0e0e0"
                },
                ".glance-main-list > .board-add:before": {
                    "content": " ",
                    "display": "block",
                    "margin": "1.5em auto 0.5em",
                    "width": "2em",
                    "height": "2em",
                    "background": 'url(\'data:image/svg+xml;charset=utf-8,<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="64px" height="64px" viewBox="0 0 64 64" enable-background="new 0 0 64 64" xml:space="preserve"><path fill="#09BAB0" d="M32,0.045c-17.673,0-32,14.326-32,32c0,17.673,14.327,32,32,32s32-14.326,32-32C64,14.372,49.673,0.045,32,0.045 M51,33.402c0,0.396-0.127,0.721-0.381,0.975s-0.58,0.383-0.977,0.383H34.714v14.929c0,0.396-0.126,0.72-0.381,0.976c-0.255,0.254-0.58,0.381-0.976,0.381h-2.714c-0.396,0-0.721-0.127-0.975-0.381-0.255-0.256-0.382-0.58-0.382-0.976V34.76H14.357c-0.396,0-0.721-0.129-0.975-0.383C13.128,34.123,13,33.799,13,33.402v-2.715c0-0.395,0.128-0.72,0.382-0.975c0.254-0.254,0.579-0.382,0.975-0.382h14.929V14.402c0-0.396,0.127-0.721,0.382-0.975c0.254-0.256,0.579-0.382,0.975-0.382h2.714c0.396,0,0.721,.126,0.976,0.382c0.255,0.254,0.381,0.579,0.381,0.975v14.928h14.929c0.396,0,0.723,0.128,0.977,0.382C50.873,29.968,51,30.292,51,30.688V33.402z"/></svg>\')',
                    "background-repeat": "no-repeat",
                    "background-size": "100%"
                },
                ".glance-main-list > .board-add:after": {
                    "content": "CREATE A NEW BOARD",
                    "font-size": "0.4em",
                    "color": "#333333"
                },
                ".glance-main-list > .board-add > input": {
                    "width": "0px",
                    "height": "0px"
                },
                ".glance-main-list > .board > .snapshot": {
                    "display": "block",
                    "width": "6em",
                    "height": "6em",
                    "background-image": "url(manage/fake-map.png)",
                    "background-position": "center",
                    "background-repeat": "no-repeat",
                    "background-size": "90% auto"
                },
                ".glance-main-list > .board > .name": {
                    "text-align": "center",
                    "color": "black",
                    "font-size": ".7em"
                }
            })
        }
    });
})(nx);
