(function (nx, position, dom, ui, global) {
    var CLASS = nx.define("nx.lib.component.AutoComplete", nx.ui.Element, {
        view: {
            attributes: {
                class: "position-parent"
            },
            content: [{
                name: "input",
                type: "nx.lib.component.CommonContenteditable",
                attributes: {
                    class: "input form-control",
                    tabindex: nx.binding("tabindex"),
                    contenteditable: nx.binding("contenteditable")
                },
                events: {
                    common_contenteditable_caret: "_handle_input_caret",
                    common_contenteditable_keydown: "_handle_input_keydown",
                    common_contenteditable_change: "_handle_input_change"
                }
            }, {
                name: "list",
                attributes: {
                    tabindex: 0,
                    class: ["list", nx.binding("listVisibilityClass_internal_")],
                    style: {
                        position: "absolute"
                    }
                },
                content: nx.binding("listItemTemplate", function (listItemTemplate) {
                    if (listItemTemplate) {
                        return nx.template({
                            source: "listData",
                            pattern: listItemTemplate
                        });
                    }
                })
            }]
        },
        properties: {
            value: {
                get: function () {
                    return this.input().textPlain();
                },
                set: function (value) {
                    this.input().textPlain(value);
                    this.notify("value");
                }
            },
            contenteditable: {
                value: true
            },
            tabindex: {
                value: -1
            },
            promptMode: {
                // caret, input, select
                value: "input"
            },
            inputCaret_internal_: {
                value: null
            },
            inputCaretReplaceInfo_internal_: {
                value: nx.binding({
                    context: true,
                    source: "promptMode, inputCaret_internal_",
                    callback: function (promptMode, inputCaret_internal_) {
                        if (!inputCaret_internal_ || inputCaret_internal_.offset < 0 || typeof inputCaret_internal_.text !== "string") {
                            return null;
                        }
                        var text = inputCaret_internal_.text,
                            offset = inputCaret_internal_.offset,
                            range = inputCaret_internal_.range;
                        if (range < 0 || range + offset > text.length) {
                            range = text.length - offset;
                        }
                        var target = null,
                            keyword;
                        var text0 = text.substring(0, offset);
                        var text1 = text.substring(offset, offset + range);
                        var text2 = text.substring(offset + range);
                        switch (promptMode) {
                        case "select":
                            target = {
                                keyword: text0,
                                deltaStart: -text0.length,
                                deltaEnd: text.length - text0.length
                            };
                            break;
                        case "caret":
                        case "input":
                        default:
                            if (!text2 || /^\s/.test(text2)) {
                                if (/^(.*\s)?([^\s]+)$/.test(text0)) {
                                    keyword = text0.replace(/^(.*\s)?([^\s]*)$/, "$2");
                                    target = {
                                        keyword: keyword,
                                        deltaStart: -keyword.length,
                                        deltaEnd: range
                                    };
                                }
                            }
                            break;
                        }
                        return target;
                    }
                })
            },
            inputFocus: {
                value: false
            },
            inputCaptureKeyCodeList_internal_: {
                value: [],
                value: nx.binding({
                    context: true,
                    source: "listVisibility_internal_",
                    callback: function (listVisibility_internal_) {
                        return listVisibility_internal_ ? CLASS.captureKeyCodeList : [];
                    }
                }),
                watcher: function () {
                    this.input().captureKeyCodeList(this.inputCaptureKeyCodeList_internal_());
                }
            },
            listData: {
                value: [],
                watcher: function () {
                    var list = this.list();
                    setTimeout(function () {
                        nxex.toolkit.collectionItemHandle(list.content(), function (collection, child) {
                            child.dom().addClass("item");
                            var handleMouseEnter, handleMouseLeave, handleClick;
                            handleMouseEnter = function () {
                                this.listItemActivated(child);
                            }.bind(this);
                            handleMouseLeave = function () {
                                this.listItemActivated(null);
                            }.bind(this);
                            handleClick = function () {
                                this._executeSelection(child.template().model());
                            }.bind(this);
                            child.on("mouseenter", handleMouseEnter);
                            child.on("mouseleave", handleMouseLeave);
                            child.on("click", handleClick);
                            return {
                                release: function () {
                                    child.off("mouseenter", handleMouseEnter);
                                    child.off("mouseleave", handleMouseLeave);
                                    child.off("click", handleClick);
                                }
                            };
                        }.bind(this)).notify();
                    }.bind(this), 1);
                }
            },
            listDataKeyPath: {
                value: ""
            },
            listDataFilter: {
                value: null
            },
            listDataSelector_internal_: {
                value: null,
                value: nx.binding({
                    context: true,
                    source: "listDataKeyPath,listDataFilter",
                    callback: function (listDataKeyPath, listDataFilter) {
                        if (listDataFilter) {
                            return listDataFilter;
                        }
                        return CLASS.selectorByPath(listDataKeyPath);
                    }
                })
            },
            listItemCountLimit: {
                value: 0
            },
            listDataSelected_internal_: {
                value: [],
                value: nx.binding({
                    context: true,
                    source: "inputCaretReplaceInfo_internal_,listData,listDataSelector_internal_,listItemCountLimit",
                    callback: function (inputCaretReplaceInfo_internal_, listData, listDataSelector_internal_, listItemCountLimit) {
                        if (!listDataSelector_internal_) {
                            return [];
                        }
                        var selected = listDataSelector_internal_.call(this, inputCaretReplaceInfo_internal_, listData);
                        if (selected && selected.length > 0 && listItemCountLimit > 0) {
                            selected = selected.slice(0, listItemCountLimit);
                        }
                        return selected;
                    }
                }),
                watcher: function () {
                    var list = this.list();
                    var selected = this.listDataSelected_internal_();
                    if (selected && selected.length) {
                        nx.each(list.content(), function (child) {
                            var i;
                            for (i = 0; i < selected.length; i++) {
                                if (child.template().model() === selected[i]) {
                                    break;
                                }
                            }
                            child.dom().setClass("hidden", i >= selected.length);
                        }.bind(this));
                    }
                }
            },
            listItemActivated: {
                value: -1,
                get: function () {
                    var i, child, children = this.list().content().toArray();
                    for (i = 0; i < children.length; i++) {
                        child = children[i];
                        if (child.dom().hasClass("active")) {
                            return child;
                        }
                    }
                    return null;
                },
                set: function (value) {
                    var i, child, children = this.list().content().toArray();
                    for (i = 0; i < children.length; i++) {
                        child = children[i];
                        if (value === child && !child.dom().hasClass("hidden")) {
                            child.dom().addClass("active");
                        } else {
                            child.dom().removeClass("active");
                        }
                    }
                },
                value: nx.binding({
                    context: true,
                    source: "listDataSelected_internal_",
                    callback: function (listDataSelected_internal_) {
                        // clear the activation if the item is hidden
                        var listItemActivated = this.listItemActivated();
                        if (!listItemActivated || !listItemActivated.dom().hasClass("hidden")) {
                            return null;
                        }
                        return listItemActivated;
                    }
                }),
                watcher: function (pname, pvalue) {
                    if (pvalue) {
                        this._scrollTo(pvalue);
                    }
                }
            },
            listVisibility_internal_: {
                value: true,
                value: nx.binding({
                    context: true,
                    source: "inputFocus,listDataSelected_internal_",
                    callback: function (inputFocus, listDataSelected_internal_) {
                        if (listDataSelected_internal_ && listDataSelected_internal_.length) {
                            if (inputFocus) {
                                return true;
                            }
                        }
                        return false;
                    }
                }),
                watcher: function () {
                    var promptMode = this.promptMode();
                    CLASS.adjustListPosition(promptMode, this, this.list());
                }
            },
            listVisibilityClass_internal_: {
                value: nx.binding("listVisibility_internal_", function (b) {
                    return b ? "" : "hidden";
                })
            },
            listItemTemplate: {
                value: {
                    content: nx.binding("model")
                }
            },
            listDataSelectedItem: {
                value: null,
                value: nx.binding({
                    context: true,
                    source: "promptMode, listData, inputCaretReplaceInfo_internal_, listDataKeyPath",
                    callback: function (promptMode, listData, inputCaretReplaceInfo_internal_, listDataKeyPath) {
                        var result = this.listDataSelectedItem(),
                            value = this.value();
                        if (listData && inputCaretReplaceInfo_internal_) {
                            switch (promptMode) {
                            case "select":
                                var i, item, text, matches = [];
                                for (i = 0; listData && i < listData.length; i++) {
                                    item = listData[i];
                                    text = nx.path(item, listDataKeyPath);
                                    if ((text || "").toLowerCase() === (value || "").toLowerCase()) {
                                        matches.push(item);
                                    }
                                }
                                if (matches.length == 1) {
                                    result = matches[0];
                                } else {
                                    result = null;
                                }
                                break;
                            default:
                                break;
                            }
                        }
                        return result;
                    }
                }),
                watcher: function () {
                    this.fire("execute_selection", this.listDataSelectedItem());
                }
            }
        },
        methods: {
            init: function () {
                this.inherited();
                // handler the focus
                this.focusGroup = new nxex.common.FocusGroup();
                this.focusGroup.add(this.input());
                this.focusGroup.add(this.list());
                this.focusGroup.on("focus", this._handle_group_focus, this);
                this.focusGroup.on("blur", this._handle_group_blur, this);
            },
            clear: function () {
                this.input().empty();
                this.fire("execute_change");
            },
            _scrollTo: function (item) {
                var idx = this._getListItemIndex(item);
                var list = this.list();
                var ei = item.dom(),
                    el = list.dom();
                var bi = item.dom().getBound(),
                    bl = list.dom().getBound();
                var hi = ei.offsetHeight,
                    ti = bi.top,
                    hl = el.clientHeight,
                    tl = bl.top,
                    sl = el.scrollTop;
                if (ti + hi > tl + hl) {
                    el.scrollTop += (ti + hi) - (tl + hl);
                }
                if (ti < tl) {
                    el.scrollTop -= tl - ti;
                }
            },
            _executeSelection: function (model) {
                var info = this.inputCaretReplaceInfo_internal_();
                if (info) {
                    var path = this.listDataKeyPath();
                    var text = nx.path(model, path);
                    this.input().displace({
                        deltaArea: [info.deltaStart, info.deltaEnd],
                        value: text
                    });
                    this.listDataSelectedItem(model);
                }
            },
            _getListItemIndex: function (item) {
                var i, child, children = this.list().content().toArray();
                for (i = 0; i < children.length; i++) {
                    child = children[i];
                    if (child === item) {
                        return i;
                    }
                }
                return -1;
            },
            _getListItemRelative: function (item, relation) {
                var result = null;
                var i, children = this.list().content().toArray();
                switch (relation) {
                case "previous-visible":
                    i = this._getListItemIndex(item);
                    while (--i >= 0) {
                        if (!children[i].dom().hasClass("hidden")) {
                            result = children[i];
                            break;
                        }
                    }
                    break;
                case "next-visible":
                    i = this._getListItemIndex(item);
                    while (++i < children.length) {
                        if (!children[i].dom().hasClass("hidden")) {
                            result = children[i];
                            break;
                        }
                    }
                    break;
                case "first":
                case "last":
                case "first-visible":
                case "last-visible":
                case "previous":
                case "next":
                default:
                    // TODO
                    break;
                }
                return result;
            },
            _handle_focus: function () {
                this.input().dom().focus();
            },
            _handle_group_focus: function () {
                this.inputFocus(true);
                this.fire("focus");
            },
            _handle_group_blur: function () {
                this.inputFocus(false);
                this.fire("blur");
            },
            _handle_input_caret: function () {
                this.inputCaret_internal_(this.input().caret());
            },
            _handle_input_change: function () {
                this.inputCaret_internal_(this.input().caret());
                this.fire("execute_change");
            },
            _handle_input_keydown: function (sender, evt) {
                var i, item, items, idx;
                switch (evt.which) {
                case 13:
                    // ENTER
                    if (this.listVisibility_internal_()) {
                        evt.preventDefault();
                        item = this.listItemActivated();
                        if (!item) {
                            item = this._getListItemRelative(item, "next-visible");
                        }
                        if (item && item.model()) {
                            this._executeSelection(item.model());
                        }
                    }
                    break;
                case 38:
                    // UP
                    if (this.listVisibility_internal_()) {
                        evt.preventDefault();
                        item = this.listItemActivated();
                        item = this._getListItemRelative(item, "previous-visible");
                        if (item) {
                            this.listItemActivated(item);
                        }
                    }
                    break;
                case 40:
                    // DOWN
                    if (this.listVisibility_internal_()) {
                        evt.preventDefault();
                        item = this.listItemActivated();
                        item = this._getListItemRelative(item, "next-visible");
                        if (item) {
                            this.listItemActivated(item);
                        }
                    }
                    break;
                }
            }
        },
        statics: {
            captureKeyCodeList: [13, 38, 40],
            caretRect: function () {
                var selection = window.getSelection(),
                    rect;
                if (selection.rangeCount) {
                    rect = selection.getRangeAt(0).getClientRects()[0];
                }
                if (rect) {
                    rect = {
                        left: rect.left,
                        top: rect.top,
                        width: rect.width,
                        height: rect.height
                    };
                }
                return rect;
            },
            adjustListPosition: function (mode, input, list) {
                var parent = input.dom().offsetParent;
                if (!parent) {
                    return;
                }
                var rect, prect = parent.getBoundingClientRect();
                var pleft = parent.scrollLeft,
                    ptop = parent.scrollTop;
                switch (mode) {
                case "caret":
                    var rect = CLASS.caretRect();
                    rect.top += ptop - prect.top;
                    rect.left += pleft - prect.left;
                    // set the list position
                    // FIXME to the document's bound, the list position should be fixed
                    list.dom().setStyle("left", rect.left);
                    list.dom().setStyle("top", rect.top + rect.height);
                    break;
                case "input":
                case "select":
                default:
                    // get the correct rect
                    var rect = input.dom().getBound();
                    rect.top += ptop - prect.top;
                    rect.left += pleft - prect.left;
                    // set the list position
                    // FIXME to the document's bound, the list position should be fixed
                    list.dom().setStyle("left", rect.left);
                    list.dom().setStyle("top", rect.top + rect.height);
                    list.dom().setStyle("width", rect.width);
                    break;
                }
            },
            selectorByPath: function (path) {
                function getKeys(data) {
                    var i, item, keys = [];
                    for (i = 0; i < data.length; i++) {
                        item = data[i];
                        keys.push(nx.path(item, path));
                    }
                    return keys;
                }

                function match(keyword, key) {
                    return key && key.toLowerCase().replace(/\s/g, "").indexOf(keyword.toLowerCase().replace(/\s/g, "")) == 0 && key.length > keyword.length;
                }
                return function (replaceInfo, data) {
                    var i, keys, rslt = [];
                    if (replaceInfo) {
                        keys = getKeys(data);
                        keyword = replaceInfo.keyword;
                        for (i = 0; i < data.length; i++) {
                            if (match(keyword, keys[i])) {
                                rslt.push(data[i]);
                            }
                        }
                    }
                    return rslt;
                };
            }
        }
    });
})(nx, nx.position, nx.dom, nx.ui, window);
