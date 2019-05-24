(function(nx) {
    /**
     * @class Matrix
     * @namespace nx.geometry
     */
    var EXPORT = nx.define("nx.geometry.Matrix", {
        mixins: [nx.geometry.MatrixSupport],
        methods: {
            init: function(matrix) {
                this.inherited();
                // TODO better pre-check
                this.matrix(matrix ? nx.clone(matrix) : EXPORT.I);
            },
            equal: function(matrix) {
                return EXPORT.equal(this.matrix(), (nx.is(matrix, EXPORT) ? matrix.matrix() : matrix));
            }
        },
        statics: {
            I: [
                [1, 0, 0],
                [0, 1, 0],
                [0, 0, 1]
            ],
            isometric: function(m) {
                return m && (m[0][0] || m[0][1]) && m[0][0] === m[1][1] && m[0][1] === -m[1][0];
            },
            approximate: function(m1, m2, precision) {
                if (!m1 || !m2 || m1.length != m2.length) {
                    return false;
                }
                var i;
                for (i = 0; i < m1.length; i++) {
                    if (!nx.geometry.Vector.approximate(m1[i], m2[i], precision)) {
                        return false;
                    }
                }
                return true;
            },
            equal: function(m1, m2) {
                if (!m1 || !m2 || m1.length != m2.length) {
                    return false;
                }
                var i;
                for (i = 0; i < m1.length; i++) {
                    if (!nx.geometry.Vector.equal(m1[i], m2[i])) {
                        return false;
                    }
                }
                return true;
            },
            multiply: function() {
                var matrixes = Array.prototype.slice.call(arguments);
                var m1, m2, m, mr, mc, r, c, n, row, col, num;
                var i, j, k;
                while (matrixes.length > 1) {
                    m1 = matrixes[0], m2 = matrixes[1];
                    if (m1[0].length != m2.length) {
                        return null;
                    }
                    row = m1.length, col = m2[0].length, num = m2.length;
                    m = [];
                    for (r = 0; r < row; r++) {
                        mr = [];
                        for (c = 0; c < col; c++) {
                            mc = 0;
                            for (n = 0; n < num; n++) {
                                mc += m1[r][n] * m2[n][c];
                            }
                            mr.push(mc);
                        }
                        m.push(mr);
                    }
                    matrixes.splice(0, 2, m);
                }
                return matrixes[0];
            },
            transpose: function(m) {
                var t = [],
                    r, c, row = m.length,
                    col = m[0].length;
                for (c = 0; c < col; c++) {
                    t[c] = [];
                    for (r = 0; r < row; r++) {
                        t[c].push(m[r][c]);
                    }
                }
                return t;
            },
            cofactor: function(m, r, c) {
                var mc = m.map(function(row, index) {
                    if (index !== r) {
                        row = row.slice();
                        row.splice(c, 1);
                        return row;
                    }
                });
                mc.splice(r, 1);
                return mc;
            },
            determinant: function(m) {
                if (m.length == 1) {
                    return m[0][0];
                }
                // optimize for m of 2
                if (m.length == 2) {
                    return m[0][0] * m[1][1] - m[0][1] * m[1][0];
                }
                // optimize for m of 3
                if (m.length == 3) {
                    return (
                        m[0][0] * m[1][1] * m[2][2] +
                        m[0][1] * m[1][2] * m[2][0] +
                        m[0][2] * m[1][0] * m[2][1] -
                        m[0][0] * m[1][2] * m[2][1] -
                        m[0][1] * m[1][0] * m[2][2] -
                        m[0][2] * m[1][1] * m[2][0]
                    );
                }
                // Laplace Theorem
                var rests = m.map(function(row) {
                    return row.slice(1);
                });
                var result, i, cofactor, cv, sign;
                for (result = 0, i = 0, cofactor = rests.slice(1), sign = 1; i < m.length; cofactor.splice(i, 1, rests[i]), i++, sign = -sign) {
                    if (m[i][0]) {
                        var cv = EXPORT.determinant(cofactor);
                        result += sign * m[i][0] * cv;
                    }
                }
                return result;
            },
            inverse: function(m) {
                var d = EXPORT.determinant(m);
                if (!d) {
                    return null;
                }
                return m.map(function(row, r) {
                    return row.map(function(value, c) {
                        var sign = (r + c) % 2 ? -1 : 1;
                        var cofactor = EXPORT.cofactor(m, c, r);
                        return sign * EXPORT.determinant(cofactor) / d;
                    });
                });
            },
            getHomogeneousLinearEquationsResults: function(equations) {
                // Cramer Rule
                var d = EXPORT.determinant(equations.map(function(row) {
                    return row.slice(0, row.length - 1);
                }));
                if (!d) {
                    return null;
                }
                return equations.map(function(row, index) {
                    return EXPORT.determinant(equations.map(function(row) {
                        row = row.slice();
                        row.splice(index, 1, row.pop());
                        return row;
                    })) / d;
                });
            },
            getEstimateGeometricTransformMatrix2D: function(reflects) {
                var i, j, k, tuple, marg, margs = [];
                // for each tuple of 3
                i = 0, j = 1, k = 2;
                while (true) {
                    // get the tuple
                    tuple = [reflects[i], reflects[j], reflects[k]];
                    // calculate the matrix
                    marg = EXPORT.getHomogeneousLinearEquationsResults([
                        [tuple[0][0][0], tuple[0][0][1], 1, 0, 0, 0, tuple[0][1][0]],
                        [0, 0, 0, tuple[0][0][0], tuple[0][0][1], 1, tuple[0][1][1]],
                        [tuple[1][0][0], tuple[1][0][1], 1, 0, 0, 0, tuple[1][1][0]],
                        [0, 0, 0, tuple[1][0][0], tuple[1][0][1], 1, tuple[1][1][1]],
                        [tuple[2][0][0], tuple[2][0][1], 1, 0, 0, 0, tuple[2][1][0]],
                        [0, 0, 0, tuple[2][0][0], tuple[2][0][1], 1, tuple[2][1][1]]
                    ]);
                    // store the matrix arguments
                    marg && margs.push(marg);
                    // next loop
                    if (++k > reflects.length - 1) {
                        if (++j > reflects.length - 2) {
                            if (++i > reflects.length - 3) {
                                break;
                            }
                            j = i + 1;
                            k = j + 1;
                        } else {
                            k = j + 1;
                        }
                    }
                }
                // check if the reflects are linear-correlation
                if (!margs.length) {
                    return null;
                }
                // check the variance of these matrices
                marg = margs[0].map(function(x, index) {
                    var values, expectation, variance;
                    values = margs.map(function(marg) {
                        return marg[index];
                    })
                    expectation = values.reduce(function(sum, v) {
                        return sum + v;
                    }, 0) / values.length;
                    variance = values.reduce(function(sum, v) {
                        return sum + v * v;
                    }, 0) / values.length - expectation * expectation;
                    // TODO check the variance
                    return expectation;
                });
                // get the average matrix
                return Array([marg[0], marg[3], 0], [marg[1], marg[4], 0], [marg[2], marg[5], 1]);
            }
        }
    });
})(nx);
