(function (nx, position, dom, ui, global) {
    var DETECTTIMER = 10;
    var CLASS = nx.define("nxex.common.CommonContenteditable", nx.ui.Component, {
        events: ["common_contenteditable_change", "common_contenteditable_caret", "common_contenteditable_keydown"],
        properties: {
            textHTML: {
                get: function () {
                    return this.dom().$dom.innerHTML;
                }
            },
            textPlain: {
                get: function () {
                    return CLASS.dom.plainate(this.dom().$dom).text;
                },
                set: function (value) {
                    value = value || "";
                    var node;
                    while (this.dom().$dom.firstChild) {
                        this.dom().$dom.removeChild(this.dom().$dom.firstChild);
                    }
                    node = document.createTextNode(value);
                    this.dom().$dom.appendChild(node);
                    this.notify("textPlain");
                    // reset caret
                    this._caret = {
                        node: node,
                        text: value,
                        offset: value ? value.length : 0
                    };
                    // notify event
                    this.fire("common_contenteditable_change");
                }
            },
            caret: {
                get: function () {
                    if (!this._caret) {
                        this._caret = {
                            node: this.dom().$dom,
                            text: "",
                            offset: 0
                        };
                    }
                    return this._caret;
                }
            },
            captureKeyCodeList: {
                value: []
            }
        },
        view: {
            props: {
                spellcheck: "false",
                tabindex: 0,
                contenteditable: "true"
            },
            events: {
                input: "{#_handle_input}",
                keydown: "{#_handle_keydown}",
                keypress: "{#_handle_keypress}",
                focus: "{#_handle_focus_on}",
                blur: "{#_handle_focus_off}",
                mouseup: "{#_handle_mouseup}",
                click: "{#_handle_click}"
            }
        },
        methods: {
            empty: function () {
                this.inherited(arguments);
                // reset caret
                this._caret = null;
                // notify event
                this.fire("common_contenteditable_change");
            },
            displace: function (options) {
                var parent = this.dom().$dom;
                var caret = this._caret || {
                    node: parent,
                    text: "",
                    offset: 0
                };
                var text, textnode, node, area, value = options.value;
                if (caret.node === parent) { // caret on the root element
                    if (caret.offset == parent.childNodes.length) { // caret at the end of root element
                        if (typeof value == "string") {
                            textnode = document.createTextNode(value);
                            parent.appendChild(textnode);
                            this.collapse(textnode, value.length);
                        } else if (CLASS.is.element(value)) {
                            value.setAttribute("contenteditable", "false");
                            // add the element
                            parent.appendChild(value);
                            this.collapse(parent, offset + 1);
                        }
                    } else { // caret before a node
                        node = parent.childNodes[caret.offset];
                        if (typeof value == "string") {
                            textnode = document.createTextNode(value);
                            parent.insertBefore(textnode, node);
                            this.collapse(textnode, value.length);
                        } else if (CLASS.is.element(value)) {
                            value.setAttribute("contenteditable", "false");
                            // add the element
                            parent.insertBefore(value, node);
                            this.collapse(parent, offset + 1);
                        }
                    }
                } else if (CLASS.is.text(caret.node)) { // caret on text node
                    // initialize displace area
                    area = options.deltaArea ? options.deltaArea.slice() : [0, 0];
                    area[0] += caret.offset;
                    area[1] += caret.offset;
                    // displace
                    if (typeof value == "string") {
                        text = caret.text.substring(0, area[0]) + value + caret.text.substring(area[1]);
                        caret.node.textContent = text;
                        // collapse the focus
                        this.collapse(caret.node, area[0] + value.length);
                    } else if (CLASS.is.element(value)) {
                        value.setAttribute("contenteditable", "false");
                        // add the element
                        text = caret.text;
                        if (area[0] > 0) {
                            parent.insertBefore(document.createTextNode(text.substring(0, area[0])), node);
                        } else if (CLASS.is.element(node.previousSibling)) {
                            parent.insertBefore(textnode = document.createTextNode(" "), node);
                        }
                        parent.insertBefore(value, node);
                        if (area[1] < text.length) {
                            textnode = document.createTextNode(text.substring(area[1]));
                            parent.insertBefore(textnode, node);
                            parent.removeChild(node);
                            // collapse the focus
                            this.collapse(textnode, 0);
                        } else {
                            textnode = document.createTextNode("\u200D");
                            parent.insertBefore(textnode, node);
                            parent.removeChild(node);
                            // collapse the focus
                            this.collapse(textnode, 0);
                        }
                    }
                }
                // trigger event
                CLASS.dom.purify(this.dom().$dom);
                this.fire("common_contenteditable_change");
            },
            detector: function (on) {
                if (on) {
                    // set a timer to check the caret position
                    if (!this._timer_detector) {
                        this._timer_detector = setInterval(function () {
                            if (this._lock_detector) {
                                // the content currently is not detectable
                                return;
                            }
                            this.updateCaret();
                        }.bind(this), DETECTTIMER);
                    }
                } else {
                    // clear the timer
                    if (this._timer_detector) {
                        clearInterval(this._timer_detector);
                        this._timer_detector = false;
                    }
                }
            },
            collapse: function (node, index) {
                window.getSelection().collapse(node, index);
                this.updateCaret();
            },
            updateCaret: function () {
                (function () {
                    if (nx.Env.browser().name == "firefox") {
                        // FIXME firefox bug
                        var selection = window.getSelection();
                        var focusNode = selection.isCollapsed && selection.focusNode;
                        var focusOffset = selection.isCollapsed && selection.focusOffset;
                        if (CLASS.is.text(focusNode) && focusNode === this.dom().$dom.lastChild) {
                            if (focusOffset == focusNode.textContent.length) {
                                if (/\s$/.test(focusNode.textContent)) {
                                    window.getSelection().collapse(focusNode, focusOffset - 1);
                                } else {
                                    focusNode.textContent += " ";
                                    window.getSelection().collapse(focusNode, focusOffset);
                                }
                            }
                        }
                    }
                }).call(this);
                var selection = window.getSelection().getRangeAt(0);
                var focusNode = selection.startContainer;
                var plain = CLASS.dom.plainate(focusNode);
                var node = this._caret && this._caret.node;
                var text = this._caret && this._caret.text;
                var offset = this._caret && this._caret.offset;
                var range = this._caret && this._caret.range;
                if (node === focusNode && offset === plain.offset && text === plain.text && range === plain.range) {
                    return;
                }
                this._caret = {
                    node: focusNode,
                    text: plain.text,
                    offset: plain.offset,
                    range: plain.range
                };
                this.fire("common_contenteditable_caret", {
                    node: focusNode,
                    text: plain.text,
                    offset: plain.offset,
                    range: plain.range
                });
            },
            _handle_input: function () {
                this._lock_detector = true;
                // wrap in a timeout: the caret moved AFTER the event "input" processed
                setTimeout(function () {
                    // update
                    CLASS.dom.purify(this.dom().$dom);
                    // trigger event
                    this.updateCaret();
                    this.fire("common_contenteditable_change");
                    // release the lock, let the detection be available
                    this._lock_detector = false;
                }.bind(this), 5);
            },
            _handle_focus_on: function () {
                this.detector(true);
            },
            _handle_focus_off: function () {
                this.detector(false);
            },
            _handle_keypress: function (sender, edata) {
                edata.stopPropagation();
            },
            _handle_keydown: function (sender, evt) {
                var link, node;
                var i, captureKeyCodeList = this.captureKeyCodeList();
                for (i = 0; i < captureKeyCodeList.length; i++) {
                    if (evt.which == captureKeyCodeList[i]) {
                        this.fire("common_contenteditable_keydown", evt);
                        break;
                    } else if (evt.which == 13) {
                        evt.preventDefault();
                        evt.stopPropagation();
                        break;
                    }
                }
            },
            _handle_mouseup: function (sender, evt) {
                if (evt.target.tagName == "A" && evt.target.parentNode === this.dom().$dom) {
                    window.getSelection().collapse(this.dom().$dom, CLASS.dom.index(evt.target) + 1);
                }
            },
            _handle_click: function (sender, evt) {
                if (evt.target.tagName == "A" && evt.target.parentNode === this.dom().$dom) {
                    evt.preventDefault();
                }
            }
        },
        statics: {
            is: {
                contain: function (parent, child) {
                    while (child.parentNode && child.parentNode !== child) {
                        if (parent === child.parendNode) {
                            return true;
                        }
                        child = child.parentNode;
                    }
                    return false;
                },
                text: function (node) {
                    // FIXME
                    return !!node && !node.tagName;
                },
                element: function (node) {
                    // FIXME
                    return !!node && !!node.tagName;
                }
            },
            dom: {
                index: function (el) {
                    var i = 0;
                    while (el.previousSibling) {
                        i++;
                        el = el.previousSibling;
                    }
                    return i;
                },
                plainate: function (parent) {
                    var sobj = window.getSelection();
                    var robj = sobj.rangeCount ? sobj.getRangeAt(0) : {};
                    var plainate = function (parent) {
                        var text = "", offset = -1, range = -1;
                        if (CLASS.is.text(parent)) {
                            text = parent.textContent;
                            if (robj.startContainer === parent) {
                                offset = robj.startOffset;
                                if (robj.endContainer === parent) {
                                    range = robj.endOffset - robj.startOffset;
                                }
                            }
                        } else if (CLASS.is.element(parent)) {
                            var i, node, plain, len = parent.childNodes.length;
                            for (i = 0; i < len; i++) {
                                node = parent.childNodes[i];
                                plain = plainate(node);
                                if (offset >= 0) {
                                    text += plain.text;
                                } else {
                                    if (plain.offset >= 0) {
                                        offset = text.length + plain.offset;
                                        range = plain.range;
                                    }
                                    text += plain.text;
                                }
                            }
                            if (robj.startContainer === parent) {
                                offset = text.length;
                                range = 0;
                            }
                        }
                        return {
                            text: text,
                            offset: offset,
                            range: range
                        };
                    }
                    var plain = plainate(parent);
                    // clear "\u200D"
                    var index;
                    while ((index = plain.text.indexOf("\u200D")) >= 0) {
                        if (index < plain.offset) {
                            plain.offset--;
                        }
                        plain.text = plain.text.substring(0, index) + plain.text.substring(index + 1);
                    }
                    return plain;
                },
                purify: function (parent) {
                    function mergeText (text1, text2) {
                        var selection = window.getSelection();
                        var focusNode = selection.isCollapsed && selection.focusNode;
                        var focusOffset = selection.isCollapsed && selection.focusOffset;
                        var caret = (focusNode === text1 ? focusOffset : (focusNode === text2 ? text1.textContent.length + focusOffset : -1));
                        text1.textContent = text1.textContent + text2.textContent;
                        if (caret >= 0) {
                            selection.collapse(text1, caret);
                        }
                    }
                    var i, children = [], len, node, text, plain, textnode;
                    len = parent.childNodes.length;
                    // purify elements
                    for (i = len - 1; i >= 0; i--) {
                        node = parent.childNodes[i];
                        if (CLASS.is.text(node)) {
                            continue;
                        }
                        if (CLASS.is.element(node)) {
                            plain = CLASS.dom.plainate(node);
                            if (node.tagName.toUpperCase() == "A" && node.getAttribute("href") && node.getAttribute("contenteditable") == "false") {
                                continue;
                            }
                            if (plain.text) {
                                // plainate all element into text nodes
                                textnode = document.createTextNode(plain.text);
                                parent.insertBefore(textnode, node);
                                if (plain.offset >= 0) {
                                    window.getSelection().collapse(textnode, plain.offset);
                                }
                            }
                        }
                        parent.removeChild(node);
                    }
                    // merge text nodes
                    len = parent.childNodes.length;
                    for (i = len - 1; i >= 0; i--) {
                        node = parent.childNodes[i];
                        if (CLASS.is.text(node)) {
                            plain = CLASS.dom.plainate(node);
                            if (plain.text) {
                                if (node.textContent !== plain.text) {
                                    node.textContent = plain.text;
                                }
                                if (plain.offset >= 0) {
                                    window.getSelection().collapse(node, plain.offset);
                                }
                                if (CLASS.is.text(node.nextSibling)) {
                                    mergeText(node, node.nextSibling);
                                    parent.removeChild(node.nextSibling);
                                }
                            } else {
                                parent.removeChild(node);
                                if (plain.offset >= 0) {
                                    window.getSelection().collapse(parent, i);
                                }
                            }
                        }
                    }
                    // give a default value
                    if (nx.Env.browser().name == "chrome") {
                        // fix chrome bug
                        var selection = window.getSelection();
                        var focusNode = selection.isCollapsed && selection.focusNode;
                        var focusOffset = selection.isCollapsed && selection.focusOffset;
                        if (focusNode === parent && CLASS.is.element(parent.lastChild) && focusOffset == parent.childNodes.length) {
                            node = document.createTextNode("\u200D");
                            parent.appendChild(node);
                            window.getSelection().collapse(parent, focusOffset);
                        }
                    } else if (nx.Env.browser().name == "firefox") {
                        node = document.createTextNode("\u200D");
                        parent.appendChild(node);
                    }
                }
            }
        }
    });
})(nx, nx.position, nx.dom, nx.ui, window);
