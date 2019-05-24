(function (nx, position, dom, ui, global) {
    // TODO more events: keydown, keyup, keypress, etc.
    var CLASS = nx.define("nxex.common.FocusGroup", {
        events: ["focus", "blur"],
        methods: {
            init: function () {
                this.focus = false;
                this.elements = [];
                this.marks = [];
            },
            hasFocus: function () {
                var i;
                for (i = 0; i < this.marks.length; i++) {
                    if (this.marks[i]) {
                        return true;
                    }
                }
                return false;
            },
            indexOf: function (element) {
                var i;
                for (i = 0; i < this.elements.length; i++) {
                    if (this.elements[i] === element) {
                        return i;
                    }
                    if (this.elements[i].dom().$dom === element.dom().$dom) {
                        return i;
                    }
                }
                return -1;
            },
            add: function (element) {
                if (this.indexOf(element) >= 0) {
                    return;
                }
                element.on("focus", this._handle_element_focus, this);
                element.on("blur", this._handle_element_blur, this);
                this.elements.push(element);
                // FIXME how to check focus status
                this.marks.push(false);
            },
            remove: function (element) {
                var idx = this.indexOf(element);
                if (idx == -1) {
                    return;
                }
                element.off("focus", this._handle_element_focus, this);
                element.off("blur", this._handle_element_blur, this);
                this.elements.splice(idx, 1);
                this.marks.splice(idx, 1);
            },
            _handle_element_focus: function (sender, edata) {
                var idx = this.indexOf(sender);
                if (idx == -1) {
                    return;
                }
                this.marks[idx] = true;
                if (!this.focus) {
                    this.focus = true;
                    this.fire("focus");
                }
            },
            _handle_element_blur: function (sender, edata) {
                var idx = this.indexOf(sender);
                if (idx == -1) {
                    return;
                }
                this.marks[idx] = false;
                setTimeout(function () {
                    if (!this.hasFocus()) {
                        this.focus = false;
                        this.fire("blur");
                    }
                }.bind(this), 10);
            }
        }
    });
})(nx, nx.position, nx.dom, nx.ui, window);
