(function(nx) {
    var EXPORT = nx.define("glance.editor.interact.ResponsorOfTemporaryShape", glance.editor.interact.Responsor, {
        properties: {
            shapeClose: true,
            shapeListKey: "regions",
            shapeType: function() {
                return glance.editor.model.SvgPathModel;
            }
        },
        methods: {
            tap: function(sender, evt) {
                // TODO shapeClose
                var editor = this.owner();
                var editorBound = editor.getBound();
                var editorModel = editor.model();
                var [list, type, matrix] = [nx.path(editorModel, nx.path(this, "shapeListKey")), nx.path(this, "shapeType"), nx.geometry.Matrix.inverse(editorModel.matrixActual())];
                var temp = editorModel.temporary();
                var segment, point;
                if (evt.button == 2) {
                    editorModel.release("temporary");
                    this.owner().mode("idle");
                } else {
                    point = nx.geometry.Vector.transform([evt.capturedata.position[0] - editorBound.left, evt.capturedata.position[1] - editorBound.top], matrix);
                    if (!temp) {
                        // add first vertex
                        segment = new glance.editor.model.SvgPathModel.SEGMENTS.M();
                        segment.start(new glance.editor.model.VertexModel(0, 0));
                        segment.end(new glance.editor.model.VertexModel(point[0], point[1]));
                        // create temporary shap
                        temp = new type();
                        temp.segments().push(segment);
                        // add for temporary
                        list.push(temp);
                        editorModel.active(temp);
                        editorModel.temporary(temp);
                        editorModel.retain("temporary", {
                            release: function() {
                                editorModel.temporary(null);
                                editorModel.active(null);
                                if (temp.vertices().length() <= 2) {
                                    list.remove(temp);
                                }
                            }
                        });
                    } else {
                        if (this.shapeClose()) {
                            // close shape
                            if (temp.segments().length() === 1) {
                                // p0 to p1
                                segment = new glance.editor.model.SvgPathModel.SEGMENTS.L();
                                segment.start(temp.segments().get(0).end());
                                segment.end(new glance.editor.model.VertexModel(point[0], point[1]));
                                temp.segments().push(segment);
                                // p1 to p0
                                segment = new glance.editor.model.SvgPathModel.SEGMENTS.L();
                                segment.start(temp.segments().get(temp.segments().length() - 1).end());
                                segment.end(temp.segments().get(0).end());
                                temp.segments().push(segment);
                            } else {
                                // p(n-1) to pn
                                temp.segments().get(temp.segments().length() - 1).end(new glance.editor.model.VertexModel(point[0], point[1]));
                                // pn to p0
                                segment = new glance.editor.model.SvgPathModel.SEGMENTS.L();
                                segment.start(temp.segments().get(temp.segments().length() - 1).end());
                                segment.end(temp.segments().get(0).end());
                                temp.segments().push(segment);
                            }
                        } else {
                            // open shape
                            point = nx.geometry.Vector.transform([evt.capturedata.position[0] - editorBound.left, evt.capturedata.position[1] - editorBound.top], matrix);
                            segment = new glance.editor.model.SvgPathModel.SEGMENTS.L();
                            segment.start(temp.segments().get(temp.segments().length() - 1).end());
                            segment.end(new glance.editor.model.VertexModel(point[0], point[1]));
                            temp.segments().push(segment);
                        }
                        if (temp.vertices().length() > 2) {
                            // clear as temporary
                            editorModel.release("temporary");
                            // commit the wall
                            editorModel.active(temp);
                            editorModel.temporary(temp);
                        }
                    }
                }
            }
        }
    });
})(nx);
