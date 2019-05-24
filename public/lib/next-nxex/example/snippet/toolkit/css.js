/*
result(in Chrome and Safari):
.my-css-class { -webkit-transform: scale(1); }
.anonymous-inline-animation { -webkit-animation: keyframes-45B4924E-6D05-41D8-9317-2C28BBE2FCA6 1s ease 0s infinite normal none running; }
.inline-animation { -webkit-animation: my-inline-keyframes 1s ease 0s infinite normal none running; }
@-webkit-keyframes keyframes-45B4924E-6D05-41D8-9317-2C28BBE2FCA6 {0%{opacity:0;}100%{opacity:1;}}
@-webkit-keyframes my-inline-keyframes {0%{opacity:0;}100%{opacity:1;}}
@-webkit-keyframes my-keyframes {0%{opacity:0;}100%{opacity:1;}}
*/
nxex.toolkit.css({
    ".my-css-class": {
        "transform": "scale(1)"
    },
    ".anonymous-inline-animation": {
        "animation": nxex.toolkit.css.keyframes({
            definition: {
                "0%": {
                    opacity: 0
                },
                "100%": {
                    opacity: 1
                }
            },
            "duration": "1s"
        })
    },
    ".inline-animation": {
        "animation": nxex.toolkit.css.keyframes({
            name: "my-inline-keyframes",
            definition: {
                "0%": {
                    opacity: 0
                },
                "100%": {
                    opacity: 1
                }
            },
            "duration": "1s"
        })
    },
    ".my-keyframes": nxex.toolkit.css.keyframes({
        definition: {
            "0%": {
                opacity: 0
            },
            "100%": {
                opacity: 1
            }
        }
    })
});

/*
result(in Chrome and Safari):
<div style="-webkit-user-select:none;"></div>
*/
nx.define(nxex.struct.Element, {
    struct: {
	properties: {
	    style: {
		"user-select": "none"
	    }
	}
    }
});
