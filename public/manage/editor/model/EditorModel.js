(function (nx) {
    var EXPORT = nx.define("devme.manage.editor.model.EditorModel", devme.manage.editor.model.EdgeModel, {
        properties: {
            name: null,
            matrix: function () {
                return nx.geometry.Matrix.I;
            },
            percentage: {
                dependencies: "matrix.0.0"
            },
            backgroundVisible: true,
            walls: {
                dependencies: "edgeList, polygonList",
                value: function (edgeList, polygonList) {
                    if (edgeList && polygonList) {
                        var polygonWallsList = nx.List.mapping(polygonList, "edges");
                        var polygonWalls = nx.List.union(polygonWallsList);
                        var walls = nx.List.union([edgeList, polygonWalls]);
                        this.retain("walls", walls);
                        return walls;
                    }
                }
            },
            activeAction: null,
            historyPosition: 0,
            history: function () {
                return new nx.List();
            }
        }
    });
})(nx);
