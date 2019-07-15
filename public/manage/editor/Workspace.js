(function (nx) {
    var Rectangle = nx.geometry.Rectangle;
    var Matrix = nx.geometry.Matrix;
    var Image = nx.ui.tag.Image;
    // a 100x100 svg
    var defaultBackgroundUrl = 'data:image/svg+xml;utf8,<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="100px" height="100px" viewBox="0 0 100 100" style="background: #ddd;"></svg>';
    var EXPORT = nx.define("devme.manage.editor.Workspace", nx.ui.Element, {
        mixins: [glance.common.BoundMixin],
        view: {
            cssclass: "glance-workspace",
            content: {
                name: "background",
                cssclass: "background",
                content: [{
                    name: "image",
                    type: "nx.ui.tag.Image",
                    cssstyle: {
                        transform: "{matrix}",
                        display: "{model.backgroundVisible}"
                    },
                    attributes: {
                        src: "{backgroundUrl}"
                    }
                }, {
                    type: "devme.manage.editor.Stage",
                    properties: {
                        matrix: "{matrix}",
                        model: "{model}",
                        bound: "{bound}"
                    }
                }]
            }
        },
        properties: {
            backgroundUrl: {
                value: defaultBackgroundUrl,
                watcher: function (pname, url) {
                    if (!url) {
                        return;
                    }
                    var self = this;
                    Image.load(url, function (data) {
                        self.imageSize(data.size);
                    });
                }
            },
            model: null,
            imageSize: null,
            matrix: nx.binding("model", function (model) {
                if (!model) {
                    return null;
                }
                return nx.binding("bound, imageSize", true, function (property, bound, imageSize) {
                    if (!bound || !imageSize) {
                        property.set(Matrix.I);
                        return;
                    }
                    var matrix = this.matrix();
                    var transform = Rectangle.calcCentralizeMatrix(matrix, bound, imageSize, 10);
                    if (!Matrix.approximate(transform, Matrix.I)) {
                        matrix = Matrix.multiply(matrix, transform);
                        property.set(matrix);
                        model.matrix(matrix);
                    }
                });
            })
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-workspace": {
                    "position": "absolute",
                    "left": "0px",
                    "right": "10em",
                    "top": "0px",
                    "bottom": "0px"
                },
                ".glance-workspace > .background": {
                    "position": "relative",
                    "width": "100%",
                    "height": "100%"
                },
                ".glance-workspace > .background > img": {
                    "position": "absolute",
                    "transform-origin": "0 0"
                },
                ".glance-workspace > .background > svg": {
                    "position": "absolute",
                    "width": "100%",
                    "height": "100%"
                }
            })
        }
    });
})(nx);
