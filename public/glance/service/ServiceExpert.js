(function (nx) {

    var EXPORT = nx.define("glance.common.ServiceExpert", glance.common.Service, {
        properties: {
            uiconfig: {
                value: {
                    layout: "vertical"
                }
            },
            guestCount: 0,
            meetingHours: 0,
            mapName: "",
            mapScale: 1,
            terminals: function () {
                return new nx.List();
            },
            experts: function () {
                return new nx.List();
            },
            expertsOnline: {
                dependencies: "experts",
                value: function (experts) {
                    if (!experts) {
                        return;
                    }
                    var list = nx.List.select(experts, "online");
                    this.retain("expertsOnlineMonitor", list);
                    return list;
                }
            },
            expertIdLocating: null,
            expertLocating: {
                dependencies: "expertsOnline, expertIdLocating",
                async: true,
                value: function (property, experts, expertIdLocating) {
                    this.release("expertLocatingMonitor");
                    if (experts && expertIdLocating) {
                        this.retain("expertLocatingMonitor", function () {
                            return experts.monitorContaining(function (expert) {
                                if (nx.path(expert, "id") === expertIdLocating) {
                                    property.set(expert);
                                    expert.locating(true);
                                    return function () {
                                        property.set(null);
                                        expert.locating(false);
                                    };
                                }
                            });
                        });
                    }
                }
            },
            expertsSelected: {
                dependencies: "expertsOnline",
                value: function (experts) {
                    var selected = new nx.List();
                    this.retain("expertsSelectedMonitor", experts.monitorContaining(function (item) {
                        return function () {
                            selected.toggle(item, false);
                        };
                    }));
                    return selected;
                }
            },
            expertsUnselected: {
                dependencies: "expertsOnline, expertsSelected",
                value: function (online, selected) {
                    this.release("expertsUnselectedMonitor");
                    if (online && selected) {
                        var unselected = nx.List.complement([online, selected]);
                        this.retain("expertsUnselectedMonitor", unselected);
                        return unselected;
                    }
                }
            },
            expertMovementManager: {
                value: function () {
                    return new glance.common.ExpertMovementManager({
                        mapMaskUrl: "map/glance-mask-quarter.png"
                    });
                }
            },
            expertises: {
                dependencies: "expertsOnline",
                value: function (experts) {
                    this.release("expertisesMonitor");
                    var list = new nx.List();
                    var counter = new nx.Counter();
                    this.retain("expertisesMonitor", experts.monitorContaining(function (expert) {
                        var skills = expert.skills();
                        nx.each(skills, function (skill) {
                            if (counter.increase(skill) === 1 && !list.contains(skill)) {
                                list.add(skill);
                            }
                        });
                        return function () {
                            nx.each(skills, function (skill) {
                                if (counter.decrease(skill) === 0) {
                                    list.remove(skill);
                                }
                            });
                        };
                    }));
                    return list;
                }
            }
        },
        methods: {
            init: function (options) {
                this.inherited();
                nx.sets(this, options);
                var self = this;
                var experts = this.experts();
                // start listen the socket
                var socket = new glance.common.Client(self.getSocketUrl());
                socket.on("connect", function (sender, data) {
                    socket.emit('client_notification', {
                        id: nx.path(global.app, "terminal")
                    });
                });
                socket.on("ipad", function (sender, data) {
                    self.processTerminal(data);
                });
                socket.on("update", function (sender, data) {
                    self.processExpert(data);
                });
                socket.on("staff", function (sender, data) {
                    self.experts(new nx.List());
                    self.terminals(new nx.List());
                    // data.join = data.join.slice(0, 1);
                    if (data.uiconfig) {
                        self.uiconfig(data.uiconfig);
                    }
                    if (data.map) {
                        self.mapName(data.map.name || "glance");
                        self.mapScale(data.map.scale || 1);
                    }
                    self.processTerminal({
                        join: data.ipad
                    });
                    self.processExpert(data);
                });
                this._socket = socket;
            },
            sendLocate: function (idTerm, idExpert) {
                this._socket.emit("ipad", {
                    locate: {
                        terminal: idTerm,
                        expert: idExpert
                    }
                });
            },
            processExpert: function (data) {
                var experts = this.experts();
                var movementManager = this.expertMovementManager();
                if (data.guestCount >= 0) {
                    this.guestCount(data.guestCount);
                }
                if (data.meetingHours >= 0) {
                    this.meetingHours(data.meetingHours);
                }
                if (data.register && data.register.length) {
                    nx.each(data.register, function (item) {
                        var expert = EXPORT.getItemById(experts, item.id);
                        if (!expert) {
                            experts.push(new glance.common.Expert(item));
                        } else {
                            nx.each(item, function (value, key) {
                                nx.path(expert, key, value);
                            })
                        }
                    });
                }
                if (data.movement && data.movement.length) {
                    nx.each(data.movement, function (item) {
                        nx.each(experts, function (expert) {
                            if (expert.id() === item.id) {
                                if (global.app.terminal()) {
                                    expert.position(item.position);
                                } else {
                                    movementManager.setMovement(expert, item.position);
                                }
                                return false;
                            }
                        });
                    });
                }
                if (data.withdraw && data.withdraw.length) {
                    nx.each(data.withdraw, function (item) {
                        nx.each(experts, function (expert, index) {
                            if (expert.id() === item.id) {
                                movementManager.clearMovement(expert);
                                expert.online(false);
                                return false;
                            }
                        });
                    });
                }
                if (data.avatar && data.avatar.length) {
                    nx.each(data.avatar, function (id) {
                        nx.each(experts, function (expert, index) {
                            if (expert.id() === id) {
                                expert.avatarVersion(Date.now());
                                return false;
                            }
                        });
                    });
                }
                if (data.join && data.join.length) {
                    nx.each(data.join, function (item) {
                        var expert = new glance.common.Expert(item);
                        if (!EXPORT.getItemById(experts, item.id)) {
                            experts.push(expert);
                            expert.online(true);
                            movementManager.setPosition(expert, item.position);
                        } else {
                            nx.each(experts, function (expert, index) {
                                if (expert.id() === item.id) {
                                    expert.online(true);
                                    movementManager.setPosition(expert, item.position);
                                    return false;
                                }
                            });
                        }
                    });
                }
            },
            processTerminal: function (data) {
                var terminals = this.terminals();
                var movementManager = this.expertMovementManager();
                if (data.locate) {
                    this.expertIdLocating(data.locate.expert);
                }
                if (data.movement && data.movement.length) {
                    nx.each(data.movement, function (item) {
                        nx.each(terminals, function (terminal) {
                            if (terminal.id() === item.id) {
                                if (global.app.terminal()) {
                                    terminal.position(item.position);
                                } else {
                                    movementManager.setMovement(terminal, item.position);
                                }
                                return false;
                            }
                        });
                    });
                }
                if (data.withdraw && data.withdraw.length) {
                    nx.each(data.withdraw, function (item) {
                        item.name = item.id;
                        nx.each(terminals, function (terminal, index) {
                            if (terminal.id() === item.id) {
                                movementManager.clearMovement(terminal);
                                terminal.remove(terminal);
                                return false;
                            }
                        });
                    });
                }
                if (data.join && data.join.length) {
                    nx.each(data.join, function (item) {
                        item.name = item.id;
                        var terminal = EXPORT.getItemById(terminals, item.id);
                        if (!terminal) {
                            terminals.push(new glance.common.Movable(item));
                        } else {
                            terminal.sets(item);
                        }
                    });
                }
            }
        },
        statics: {
            getItemById: function (coll, id) {
                var result;
                nx.each(coll, function (item) {
                    if (nx.path(item, "id") === id) {
                        result = item;
                        return false;
                    }
                });
                return result;
            }
        }
    });
})(nx);
