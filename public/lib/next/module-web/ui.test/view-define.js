module("element");

test("basic define", function() {
    var Class = nx.define(nx.ui.Element, {
        view: {
            cssclass: "test-class",
            cssstyle: {
                display: "block",
                backgroundColor: "red"
            },
            attributes: {
                "test-attribute": "test-attribute"
            },
            content: {
                name: "child",
                attributes: {
                    class: "child-class-1 child-class-2",
                    style: {
                        "border-width": "1px"
                    }
                }
            }
        }
    });
    var instance = new Class();
    var child, element = instance.dom();
    equal(element.tagName.toLowerCase(), "nx-element", "default tag name");
    equal(element.className, "test-class", "css class");
    equal(element.getAttribute("test-attribute"), "test-attribute", "attribute");
    equal(element.style.display, "block", "style");
    equal(element.style.backgroundColor, "red", "style with camel spell");
    child = instance.child().dom();
    ok(child && child.parentNode === element, "content");
    equal(child.className, "child-class-1 child-class-2", "multiple css class");
    equal(child.style.borderWidth, "1px", "style with dash spell");
});

test("extend", function() {
    var Insider = nx.define(nx.ui.Element, {
        view: {
            cssclass: "insider",
            content: {
                name: "body",
                cssclass: "insider-body",
                content: {
                    content: "insider-body-0"
                }
            }
        }
    });
    var Base = nx.define(nx.ui.Element, {
        view: {
            content: [{
                name: "header",
                cssclass: "header",
                content: {
                    content: "base-header-0"
                }
            }, {
                name: "insider",
                type: Insider,
                content: {
                    content: "base-insider-0"
                }
            }]
        }
    });
    var Class = nx.define(Base, {
        view: {
            extend: {
                header: {
                    content: "header"
                },
                insider: {
                    extend: {
                        body: {
                            content: "body"
                        }
                    }
                }
            }
        }
    });
    var instance = new Class();
    var element = instance.dom();
    equal(element.innerHTML, "<nx-element class=\"header\"><nx-element>base-header-0</nx-element>header</nx-element>" +
        "<nx-element class=\"insider\">" +
        "<nx-element class=\"insider-body\">" +
        "<nx-element>insider-body-0</nx-element>body</nx-element>" +
        "<nx-element>base-insider-0</nx-element>" +
        "</nx-element>", "extend ok");
});

test("literal binding", function() {
    var Model = nx.define({
        properties: {
            disabled: "disabled",
            active: "active",
            color: "red",
            border: "1px",
            display: "block"
        }
    });
    var Base = nx.define(nx.ui.Element, {
        view: {
            content: {
                name: "header"
            }
        }
    });
    var Class = nx.define(Base, {
        view: {
            cssclass: "{cssClassA} {self.model.active}",
            cssstyle: {
                display: "{display}",
                backgroundColor: "{model.color}"
            },
            properties: {
                display: "{model.display}"
            },
            content: {
                name: "child",
                attributes: {
                    class: ["{cssClassC}", "{model.disabled}"],
                    style: {
                        "border-width": "{model.border}"
                    }
                }
            },
            extend: {
                header: {
                    content: "{textHeader}"
                }
            }
        },
        properties: {
            textHeader: "header",
            cssClassA: "outer",
            cssClassC: "inner",
            display: "inline",
            model: function() {
                return new Model();
            }
        }
    });
    var instance = new Class();
    var element = instance.dom();
    var child = instance.child();
    var el = child.dom();
    ok(instance.hasClass("outer"), "bound css class");
    ok(instance.hasClass("active"), "bound self model css class");
    equal(element.style.display, "block", "bound model to property to style");
    equal(element.style.backgroundColor, "red", "bound model style");
    ok(child.hasClass("inner"), "bound child css class");
    ok(child.hasClass("disabled"), "bound child model css class");
    equal(el.style.borderWidth, "1px", "bound child model style");
    equal(instance.header().dom().innerHTML, "header", "bound extend");
    // change
    instance.cssClassA("parent");
    ok(instance.hasClass("parent") && !instance.hasClass("outer"), "bound model css classes changed");
    instance.model().active(null);
    ok(!instance.hasClass("active"), "bound model css class changed");
    instance.model().display("none");
    equal(element.style.display, "none", "bound model to property to style changed");
    instance.model().color("transparent");
    equal(element.style.backgroundColor, "transparent", "bound model style changed");
    instance.cssClassC("child");
    ok(child.hasClass("child") && !child.hasClass("inner"), "bound child css class changed");
    instance.model().disabled(false);
    ok(!child.hasClass("disabled"), "bound child model css class changed");
    instance.model().border("2px");
    equal(el.style.borderWidth, "2px", "bound child model style changed");
    instance.textHeader("HEADER");
    equal(instance.header().dom().innerHTML, "HEADER", "bound extend");
});


test("literal template", function() {
    var getContent = function(element) {
        var text = "",
            children = element.childNodes;
        var i, n = children.length;
        for (i = 0; i < n; i++) {
            if (children[i] instanceof Text) {
                text += children[i].textContent;
            } else if (children[i] instanceof Element) {
                text += getContent(children[i]);
            }
        }
        return text;
    };
    var Class = nx.define(nx.ui.Element, {
        view: {
            content: ["digits:", {
                repeat: "{digits}",
                content: "{scope.model}"
            }, ",letters:", {
                repeat: "{letters}",
                content: "{scope.model}"
            }]
        },
        properties: {
            digits: function() {
                return new nx.List([0, 1, 2, 3]);
            },
            letters: function() {
                return new nx.List(["a", "b", "c"]);
            }
        }
    });
    var instance = new Class();
    var element = instance.dom();
    equal(getContent(element), "digits:0123,letters:abc", "init");
    ok(element.firstChild instanceof Text, "init text");
    instance.digits().push(4);
    equal(getContent(element), "digits:01234,letters:abc", "add front list");
    instance.digits().shift();
    equal(getContent(element), "digits:1234,letters:abc", "remove front list");
    instance.letters().splice(1, 1, "B");
    equal(getContent(element), "digits:1234,letters:aBc", "splice back list");
});

test("template on array", function() {
    var Class = nx.define(nx.ui.Element, {
        view: {
            content: {
                repeat: "digits",
                content: "{scope.model}"
            }
        },
        properties: {
            digits: function() {
                return [1, 2, 3, 4];
            }
        }
    });
    var instance = new Class();
    var element = instance.dom();
    equal(element.innerHTML, "<nx-element>1</nx-element><nx-element>2</nx-element><nx-element>3</nx-element><nx-element>4</nx-element>", "initial with array");
});
