(function (nx) {
    var EXPORT = nx.define("sanvy.UniformMatrix", {
        properties: {
            sanvy: null,
            matrix: {
                value: function () {
                    return EXPORT.I;
                }
            },
            data: {
                dependencies: "matrix",
                value: function (matrix) {
                    return matrix.reduce(function (a, b) {
                        return a.concat(b);
                    }, []);
                }
            }
        },
        methods: {
            init: function (sanvy, matrix) {
                this.inherited();
                this.sanvy(sanvy);
                this.matrix(matrix);
            },
            draw: function (uniform) {
                var context = this.sanvy().context();
                var data = this.data();
                context.uniformMatrix4fv(uniform, false, data);
            }
        },
        statics: {
            I: [
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 1]
            ]
        }
    });
})(nx);
