(function (nx, ui, toolkit, annotation, global) {
    nx.define("nxex.geometry.MatrixSupport", nx.Observable, {
        properties: {
            matrix: {
                value: function () {
                    return nxex.geometry.Matrix.I;
                }
            },
            transform_internal_: {
                value: {
                    x: 0,
                    y: 0,
                    scale: 1,
                    rotate: 0
                },
                cascade: {
                    source: "matrix",
                    output: function (matrix) {
                        var scale = NaN,
                            rotate = NaN;
                        if (nxex.geometry.Matrix.isometric(matrix)) {
                            scale = Math.sqrt(matrix[0][0] * matrix[0][0] + matrix[0][1] * matrix[0][1]);
                            rotate = Math.atan2(matrix[1][0], matrix[0][0]);
                        }
                        return {
                            x: matrix[2][0],
                            y: matrix[2][1],
                            scale: scale,
                            rotate: rotate
                        };
                    }
                }
            },
            x: {
                value: 0,
                set: function (v) {
                    this._applyTransform("x", v);
                    return false;
                },
                cascade: {
                    source: "transform_internal_.x",
                    update: function (v) {
                        if (!isNaN(this._transform_internal_.x) && this._x !== this._transform_internal_.x) {
                            this._x = this._transform_internal_.x;
                            this.notify("x");
                        }
                    }
                }
            },
            y: {
                value: 0,
                set: function (v) {
                    this._applyTransform("y", v);
                    return false;
                },
                cascade: {
                    source: "transform_internal_.y",
                    update: function (v) {
                        if (!isNaN(this._transform_internal_.y) && this._y !== this._transform_internal_.y) {
                            this._y = this._transform_internal_.y;
                            this.notify("y");
                        }
                    }
                }
            },
            scale: {
                value: 1,
                set: function (v) {
                    this._applyTransform("scale", v);
                    return false;
                },
                cascade: {
                    source: "transform_internal_.scale",
                    update: function (v) {
                        if (!isNaN(this._transform_internal_.scale) && this._scale !== this._transform_internal_.scale) {
                            this._scale = this._transform_internal_.scale;
                            this.notify("scale");
                        }
                    }
                }
            },
            rotate: {
                value: 0,
                set: function (v) {
                    this._applyTransform("rotate", v);
                    return false;
                },
                cascade: {
                    source: "transform_internal_.rotate",
                    update: function (v) {
                        if (!isNaN(this._transform_internal_.rotate) && this._rotate !== this._transform_internal_.rotate) {
                            this._rotate = this._transform_internal_.rotate;
                            this.notify("rotate");
                        }
                    }
                }
            }
        },
        methods: {
            getMatrixInversion: function () {
                var matrix = this.matrix();
                if (!matrix) {
                    return null;
                }
                return nxex.geometry.Matrix.inverse(matrix);
            },
            applyTranslate: function (x, y) {
                this.matrix(nxex.geometry.Matrix.multiply(this.matrix(), [
                    [1, 0, 0],
                    [0, 1, 0],
                    [x, y, 1]
                ]));
            },
            applyScale: function (s, accord) {
                if (accord) {
                    this.matrix(nxex.geometry.Matrix.multiply(this.matrix(), [
                        [1, 0, 0],
                        [0, 1, 0],
                        [-accord[0], -accord[1], 1]
                    ], [
                        [s, 0, 0],
                        [0, s, 0],
                        [0, 0, 1]
                    ], [
                        [1, 0, 0],
                        [0, 1, 0],
                        [accord[0], accord[1], 1]
                    ]));
                } else {
                    this.matrix(nxex.geometry.Matrix.multiply(this.matrix(), [
                        [s, 0, 0],
                        [0, s, 0],
                        [0, 0, 1]
                    ]));
                }
            },
            applyRotate: function (r, accord) {
                var x = this.x(),
                    y = this.y(),
                    sin = Math.sin(r),
                    cos = Math.cos(r);
                if (accord) {
                    this.matrix(nxex.geometry.Matrix.multiply(this.matrix(), [
                        [1, 0, 0],
                        [0, 1, 0],
                        [-accord[0], -accord[1], 1]
                    ], [
                        [cos, sin, 0],
                        [-sin, cos, 0],
                        [0, 0, 1]
                    ], [
                        [1, 0, 0],
                        [0, 1, 0],
                        [accord[0], accord[1], 1]
                    ]));
                } else {
                    this.matrix(nxex.geometry.Matrix.multiply(this.matrix(), [
                        [cos, sin, 0],
                        [-sin, cos, 0],
                        [0, 0, 1]
                    ]));
                }
            },
            applyMatrix: function () {
                var matrices = Array.prototype.slice.call(arguments);
                matrices = toolkit.query({
                    array: matrices,
                    mapping: function (matrix) {
                        return nx.is(matrix, nxex.geometry.Matrix) ? matrix.matrix() : matrix;
                    }
                });
                matrices.unshift(this.matrix());
                this.matrix(nxex.geometry.Matrix.multiply.apply(this, matrices));
            },
            _applyTransform: function (key, value) {
                if (this["_" + key] === value || isNaN(value)) {
                    return;
                }
                if (value === this._transform_internal_[key]) {
                    this["_" + key] = value;
                    this.notify(key);
                } else {
                    switch (key) {
                    case "x":
                        this.applyTranslate(value - this._transform_internal_.x, 0);
                        break;
                    case "y":
                        this.applyTranslate(0, value - this._transform_internal_.y);
                        break;
                    case "scale":
                        this.applyScale(value / this._transform_internal_.scale, [this._transform_internal_.x, this._transform_internal_.y]);
                        break;
                    case "rotate":
                        this.applyRotate(value - this._transform_internal_.rotate, [this._transform_internal_.x, this._transform_internal_.y]);
                        break;
                    }
                }
            }
        }
    })
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
