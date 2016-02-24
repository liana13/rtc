/*
 * Vostan CMS
 * Copyright (c) 2005-2015 Instigate CJSC
 * E-mail: info@instigatedesign.com
 * 58/1 Karapet Ulnetsi St.,
 * Yerevan, 0069, Armenia
 * Tel:  +1-408-625-7509
 * +49-893-8157-1771
 * +374-60-464700
 * +374-10-248411

 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

(function() {
    var VostanController = function(config) {

        var History = function(root) {
            var _this = this, _history = [root], _curr = 0;

            this.current = function() {
                return _history[_curr];
            };

            this.prev = function() {
                return _curr ? _history[_curr-1] : "";
            };

            this.next = function() {
                return (_curr < _history.length-1) ? _history[_curr+1] : "";
            };

            this.back = function() {
                return _curr ? _history[--_curr] : "";
            };

            this.fwd = function() {
                return (_curr < _history.length-1) ? _history[++_curr] : "";
            };

            this.reset = function() {
                for (var i = _history.length-1; i > _curr; i--) {
                    _history.pop();
                }
            };

            this.add = function(nodeID) {
                if (nodeID == _this.current()) {
                    return _history[_curr];
                }
                _this.reset();
                _history.push(nodeID);
                return _history[++_curr];
            };

            this.navigate = function(nodeID) {
                if (nodeID == _this.prev()) {
                    _this.back();
                } else if (nodeID == _this.next()) {
                    _this.fwd();
                } else {
                    _this.add(nodeID);
                }
            };
        };

        var Cookie = function() {
            var set = function(cname, cvalue, exdays) {
                var d = new Date();
                d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
                var expires = "expires=" + d.toGMTString();
                document.cookie = cname + "=" + cvalue + "; " + expires;
            };

            var get = function(cname) {
                var ca = document.cookie.split(';');
                for (var i = 0; i < ca.length; i++) {
                    var c = ca[i].trim();
                    var data = c.split("=");
                    if (data[0] == cname) {
                        return data[1];
                    }
                }
                return "";
            };

            this.lang = function(val, force) {
                var cname = "lang";
                if (!get(cname) || get(cname).indexOf("=") >=0 || force) {
                    set(cname, val, 365);
                }
                var dname = "def_lang";
                if (!get(dname) || get(dname).indexOf("=") >=0 || force) {
                    set(dname, config.defaultLang, 365);
                }
                return get(cname);
            };

            this.v_root = function() {
                return parseInt(get("v_root"));
            };
        };

        var _cookie = new Cookie();

        var _lang = _cookie.lang(config.defaultLang) || config.defaultLang;
        var _Vostan = this, _host = config.host, _title = document.title, _root = parseInt(document.location.hash.substring(1)) || _cookie.v_root() || config.root, _prevRoot = _root, _mode = "view", _editStage = null, _editLayer = null, _stage = null, _linkAdds = [], _animationDelay = config.animationDelayMin, _animationDelayMax = config.animationDelayMax, _linkColor = "", _linkWidth = "", _mouseoverindex = 1, _activeUpdates = 0, _circles = [], _dblClicked = false, _rootTitle, _rootUser = "viewer", _touchTimer, _capturing = false, _exportAll = false, _dragging = false, _exports = [];

        var _history = new History(_root);

        config.getMsg = function() {
            return (_lang == "en") ? config.msg : config["msg_" + _lang];
        };

        document.location.hash = _root;

        var clearTouchTimer = function() {
            clearTimeout(_touchTimer);
            _touchTimer = null;
        };

        this.getTouchTimer = function() {
            return _touchTimer;
        };

        this.toggleMode = function() {
            toggleMode();
        };

        this.getRootID = function() {
            return _root;
        };

        this.getNodeByID = function(nodeID) {
            return Map.nodeById(nodeID);
        };

        this.isEditMode = function() {
            return isEditMode();
        };

        this.toggleRootByID = function(nodeID) {
            toggleRootByID(nodeID);
        };

        var toggleRootByID = function(nodeID) {
            if (nodeID == _root) {
                return;
            }
            var tmp = new Node({
                "nodeID" : nodeID
            });
            Map.toggleRoot(tmp);
        };

        var canEditRoot = function() {
            return _rootUser == "editor";
        };

        var canEditNode = function(node) {
            return node.attributes().user == "editor";
        };

        var isExport = function() {
            return config.data;
        };

        var addForExport = function(id) {
            if (_capturing && _exports.indexOf(id) == -1) {
                _exports.push(id);
            }
        };

        var getExported = function(id) {
            return config.data[id];
        };

        var getExportedQueryData = function(rootID, queryID) {
            var nodes = config.data[rootID].nodes;
            for(var i = 0; i < nodes.length; i++) {
                if(queryID == nodes[i].nodeID) {
                    return { nodes: nodes[i].nodes };
                }
            }
        };

        var isValid = function(data) {
            if (data && data.error) {
                if (data.error == "logout") {
                    alert(config.getMsg().alert.session);
                }
                return false;
            }
            return true;
        };

        var isEditMode = function() {
            return _mode === "edit";
        };

        var setDelayValue = function() {
            _animationDelay = _animationDelayMax;
        };

        var resetSearchBox = function() {
            try{
                if ($("#vostanNodeToggle")[0]) {
                $("#vostanNodeToggle").val('');
                $('#vostanNodeToggle').autocomplete('close');
            }
            } catch(e) {
            }
        };

        var disableScroll = function() {
            if (window.addEventListener) {
                window.addEventListener('DOMMouseScroll', preventDefaultScroll, false);
            }
            window.onwheel = preventDefaultScroll;
            window.onmousewheel = document.onmousewheel = preventDefaultScroll;
            window.ontouchmove  = preventDefaultScroll;
            document.onkeydown  = preventDefaultForScrollArrowKeys;
        };

        var enableScroll = function() {
            if (window.removeEventListener) {
                window.removeEventListener('DOMMouseScroll', preventDefaultScroll, true);
            }
            window.onwheel = null;
            window.onmousewheel = document.onmousewheel = null;
            window.ontouchmove = null;
            document.onkeydown = true;
        };

        var preventDefaultScroll = function(e) {
            e = e || window.event;
            if (e.preventDefaultScroll) {
                e.preventDefault();
            }
            e.returnValue = false;
        };

        var preventDefaultForScrollArrowKeys = function(e) {
            if (e.keyCode==37 || e.keyCode==38 || e.keyCode==39 || e.keyCode==40) {
                preventDefaultScroll(e);
                return false;
            }
        };

        var initTheMap = function() {
            var inlineHTML = $('<div id="viewTab"></div>');
            var vostanContainer = $('<div id="vostanContainer"></div>');
            var vostanApp = $('<div id="vostanApp" class="presentation"></div>');
            var vostanAccountControls = $('<div id="vostanAccountControls"></div>');
            var section = $('<section id="vostanMain"></section>')
                   .append('<div id="vostanStage"></div>')
                   .append('<div id="vostanMap"></div>')
                   .append(vostanAccountControls)
                   .append('<div id="editControls"></div>')
                   .append('<div id="link_editControls"></div>');
            vostanApp.append('<div id="vostanAppSize">1024x768</div>')
                     .append('<div id="vostanAppSmall"><div id="vostanAppSmallSize">800x600</div></div>')
                     .append(section);
            vostanContainer.append(vostanApp);
            inlineHTML.append(vostanContainer);

            $("body").append(inlineHTML);

            if (config.share) {
                var shareNode = $('<node id="shareNode"></node>');
                vostanAccountControls.append(shareNode);

                var resetShare = function() {
                    if ($("#share_clone")[0]) {
                        $("#share_clone").remove();
                    }
                };

                var get_path = function(str) {
                    var index = str.lastIndexOf("/");
                    var base_url = str.substr(0, index);
                    return base_url;
                };

                $("body").on("vostanToggle", function() {
                    resetShare();
                });

                $("#shareNode").click( function(e) {
                    if (!isEditMode()) {
                        e.stopImmediatePropagation();
                        e.stopPropagation();
                        $(this).clone()
                               .attr("id", "share_clone")
                               .attr("class", "share")
                               .appendTo("#vostanApp")
                               .css({"top": this.offsetTop,
                                     "left": this.offsetLeft});

                        $("#share_clone").click( function(e) {
                            $("#share_clone").remove();
                        });

                        $("#share_clone").append('<input type="text" id="share" type="text"></input>');
                        var path = get_path(location.pathname);
                        var shareLink = (location.origin + path + '/share.php?id=' + _root + "&lang=" + _lang);
                        $("#share").val(shareLink).select();
                        $("#share").click(function(e) {
                            if (!isEditMode()){
                                e.stopImmediatePropagation();
                                e.stopPropagation();
                            }
                        });
                    }
                });
            }

            if (config.toggle) {
                var toggleNode = $('<node id="toggleNode"></node>');
                vostanAccountControls.append(toggleNode);
                $("#toggleNode").append('<input placeholder="' + config.getMsg().btn.search + '" id="vostanNodeToggle"/>');
                $("#vostanNodeToggle").autocomplete({
                    source : function(request, callback) {
                        var searchParam = request.term;
                        getAllNodes(searchParam, callback);
                    },
                    minLength : 1,
                    select : function(event, ui) {
                        if (isEditMode()) {
                            var el = ui;
                            Map.appendNewNode(ui.item, "append");
                        } else {
                            var tmp = new Node({
                                "nodeID" : ui.item.nodeID
                            });
                            Map.toggleRoot(tmp);
                        }
                        $(this).val('');
                        return false;
                    }
                });

                $("body").on("langChange", function() {
                    $("#vostanNodeToggle").attr("placeholder", config.getMsg().btn.search);
                });

                $("body").on("vostanToggle", function() {
                    resetSearchBox();
                });

                var getCurrentLanguage = function() {
                    return _lang;
                };

                var getAllNodes = function(searchParam, callback) {
                    $.ajax({
                        type : "GET",
                        url : _host + "/nodes/search/" + searchParam + "/lang/" + getCurrentLanguage(),
                        dataType : "json",
                        success : function(data) {
                            var dataLength = data.length;
                            for (var i = 0; i < dataLength; ++i) {
                                if (data[i].value == "") {
                                    data[i].value = data[i].defaultTitle;
                                    data[i].label = data[i].defaultTitle + " [" + data[i].tags + "]";
                                }
                            }
                            callback.call(null, data);
                        },
                        error : function(data) {
                            console.log("Error in /nodes", data);
                        }
                    });
                };
            }

            if (config.locales && Object.keys(config.locales).length > 1) {
                for (var key in config.locales) {
                    var lang = $('<node id="' + key  + '" class="lang">' + config.locales[key]  + '</node>');
                    vostanAccountControls.append(lang);
                }

                $("#" + _lang).addClass("active-lang");
                $("#en, #hy, #ru").bind("click", function() {
                    if (!isEditMode() && $(this).attr("id") != _lang) {
                        _lang = $(this).attr("id");
                        _cookie.lang(_lang, true);
                        $(".active-lang").removeClass("active-lang");
                        $(this).addClass("active-lang");
                        $("#vostanMap").html("");
                        $("body").trigger({
                            type:"langChange",
                            l_data:{"lang": _lang},
                        });
                        loadTheMap();
                    }
                });
            }

            if (config.export) {
                var capture = $('<node id="startCapturing" class="export">'
                        + config.getMsg().btn.start_capturing + '</node>');
                vostanAccountControls.append(capture);

                $("#startCapturing").bind("click", function(e) {
                    var vop = $('<node id="exportVop" class="export">'
                        + config.getMsg().btn.export_vop + '</node>');
                    var html = $('<node id="exportHtml" class="export">' +
                        config.getMsg().btn.export_html + '</node>');
                    _capturing = ! _capturing;
                    var btn = config.getMsg().btn;
                    if (_capturing) {
                        $("#startCapturing").text(btn.cancel_capturing);
                        $("#exportAll").hide();
                        vostanAccountControls.append(vop).append(html);
                        addForExport(_root);
                        registerExportVopHandler();
                    } else {
                        $("#exportAll").show();
                        $("#startCapturing").text(btn.start_capturing);
                        $("#exportVop").remove();
                        $("#exportHtml").remove();
                        _exports = [];
                    }
                });

                $("body").on("langChange", function() {
                    $("#startCapturing").text(config.getMsg().btn.start_capturing);
                });

                var registerExportVopHandler = function() {
                    $("#exportVop, #exportHtml").bind("click", function(r) {
                        var rout = _host + '/export';
                        rout += "exportVop" == $(this).attr("id") ? '/vop' : '';
                        $("body").toggleClass("wait");
                        $.ajax({
                            type : 'POST',
                            url : rout + '/root/' + _root + '/lang/' + _lang,
                            dataType : 'json',
                            contentType : 'application/json',
                            data : JSON.stringify(_exports),
                            success : function(data) {
                                if(isValid(data)) {
                                    toggleRootByID(data.id);
                                } else {
                                    alert(config.getMsg().alert.export_failed);
                                }
                            },
                            error : function(xhr) {
                                console.log("Error in export", xhr);
                                alert(config.getMsg().alert.export_failed);
                            },
                            complete : function() {
                                $("#exportVop").remove();
                                $("#exportHtml").remove();
                                $("#exportAll").show();
                                $("#startCapturing").text(
                                    config.getMsg().btn.start_capturing);
                                _capturing = false;
                                _exports = [];
                                $("body").toggleClass("wait");
                            }
                        });
                    });
                };
            }

            if (config.export_full) {
                var exportAll = $('<node id="exportAll" class="export">'
                        + config.getMsg().btn.export_all + '</node>');
                vostanAccountControls.append(exportAll);

                $("#exportAll").bind("click", function(e) {
                    var vop = $('<node id="exportVop" class="export">'
                        + config.getMsg().btn.export_vop + '</node>');
                    var html = $('<node id="exportHtml" class="export">' +
                        config.getMsg().btn.export_html + '</node>');
                    _exportAll = ! _exportAll;
                    if (_exportAll) {
                        $("#exportAll").text(config.getMsg().btn.cancel_export_all);
                        $("#startCapturing").hide();
                        vostanAccountControls.append(vop).append(html);
                        registerExportAllHandler();
                    } else {
                        $("#startCapturing").show();
                        $("#exportAll").text(config.getMsg().btn.export_all);
                        $("#exportVop").remove();
                        $("#exportHtml").remove();
                    }
                });

                $("body").on("langChange", function() {
                    $("#exportAll").text(config.getMsg().btn.export_all);
                });

                var registerExportAllHandler = function() {
                    $("#exportVop, #exportHtml").bind("click", function(r) {
                        var rout = _host + '/export/all';
                        rout += "exportVop" == $(this).attr("id") ? '/vop' : '';
                        $("body").toggleClass("wait");
                        $.ajax({
                            type : 'GET',
                            url : rout + '/root/' + _root + '/lang/' + _lang,
                            dataType : 'json',
                            success : function(data) {
                                if(isValid(data)) {
                                    toggleRootByID(data.id);
                                } else {
                                    alert(config.getMsg().alert.export_failed);
                                }
                            },
                            error : function(xhr) {
                                console.log("Error in export", xhr);
                                alert(config.getMsg().alert.export_failed);
                            },
                            complete : function() {
                                $("#exportVop").remove();
                                $("#exportHtml").remove();
                                $("#startCapturing").show();
                                $("#exportAll").text(config.getMsg().btn.export_all);
                                _exportAll = false;
                                $("body").toggleClass("wait");
                            }
                        });
                    });
                };
            }

            $("#vostanMain").show();
            loadTheMap();

            _linkColor = $("#vostanStage").css("color");
            _linkWidth = $("#vostanStage").css("line-height").replace("px", "");
        };

        var loadTheMap = function(item) {
            var root = !item ? _root : item.nodeID();
            if (isExport()) {
                processTheMapData(item, getExported(root));
                return;
            }
            $("body").toggleClass("wait");
            $("body").trigger({
                type:"vostanToggle",
                v_data:{"type": "vostan", "root":root},
            });
            $.ajax({
                type : 'GET',
                url : _host + '/map/root/' + root + '/lang/' + _lang + '?t=' + Date.now(),
                dataType : 'json',
                success : function(data) {
                    if(isValid(data)) {
                        processTheMapData(item, data);
                        $("#viewTab").scrollTop(0);
                    } else {
                        console.log("Error in /map/", data.error);
                    }
                },
                error : function(xhr) {
                    console.log("Error in /map/", xhr);
                },
                complete : function() {
                    $("body").toggleClass("wait");
                }
            });
        };

        var setTheRoot = function(item) {
                addForExport(item.nodeID());
            _linkAdds = [];
            _prevRoot = _root;
            _root = item.nodeID();
            _history.add(_root);
            $(".view").unbind("click");
        };

        var processTheMapData = function(item, data) {
            if (isValid(data) && data.nodes) {
                if (data.nodes.length == 0) {
                    var tmp = new Node({ "nodeID" : config.root });
                    loadTheMap(tmp);
                } else {
                    _rootUser = data.rootuser ? data.rootuser : "viewer";
                    var nodesLength = data.nodes.length;
                    for (var i = 0; i < nodesLength; ++i) {
                        if (!data.nodes[i].title || data.nodes[i].title.length === 0) {
                            data.nodes[i].title = data.nodes[i].defaultTitle;
                        }
                        if (!data.nodes[i].txt || data.nodes[i].txt.length === 0) {
                            data.nodes[i].txt = data.nodes[i].defaultTxt;
                        }
                        if (!data.nodes[i].tags || data.nodes[i].tags.length === 0) {
                            data.nodes[i].tags = data.nodes[i].defaultTags;
                        }
                    }
                    if (item) {
                        setTheRoot(item);
                    }
                    Map.showTheMap(data);
                    var root_attr = Map.nodeById(_root).attributes();
                    document.title = _title + " - " + root_attr.title;
                    document.location.hash = root_attr.nodeID;
                }
            }
        };

        var toggleMode = function() {
            resetSearchBox();
            if (!canEditRoot()) {
                alert(config.getMsg().alert.permission);
                return;
            }
            $.ajax({
                type : 'GET',
                url : _host + '/users?term=check',
                dataType : 'json',
                success : function(data) {
                    if (isValid(data)) {
                        if (isEditMode()) {
                            _mode = "view";
                            $("#vostanEditStage").remove();
                            EditControls.setCircles();
                            $("#startCapturing").show();
                            $("#exportAll").show();
                            $('.inline-input').closest('node').find('.info').show();
                            $('.inline-input').remove();
                        } else {
                            _mode = "edit";
                            $("#vostanMain").append($('<div id="vostanEditStage"></div>'));
                            $("#vostanNodeToggle").val('');
                            EditControls.setCircles();
                            $("#startCapturing").hide();
                            $("#exportAll").hide();
                        }
                        $("#vostanApp").toggleClass("presentation");
                        $("#viewTab").toggleClass("editMode");
                        Map.toggleMode();
                    }
                },
                error : function(xhr) {
                    isValid({"error":"logout"}, xhr);
                }
            });
        };

        /**** Start EditController */

        var EditController = function() {

            var _this = this;
            var _node = null;
            var _mouseMoveTimeout = null;

            var getPosition = function(el) {
                var shift = 10;
                var width = $('#editControls').width();
                var style = {
                    'top': el.top,
                    'left': el.left + el.width + shift
                };
                if ((el.left + el.width + width + shift > $(window).width()) &&
                    (el.left - width - shift > 0)) {
                    style.left = el.left - width - shift * 2;
                }
                return style;
            };

            this.setNode = function(node) {
                _node = node;
                this.initControlsClick();
                if (_node.attributes().imgInclude) {
                    $("#editControls").find(".edit-include-img").prop('checked', true);
                } else {
                    $("#editControls").find(".edit-include-img").prop('checked', false);
                }

                if (_node.attributes().titleInclude) {
                    $("#editControls").find(".edit-include-title").prop('checked', true);
                } else {
                    $("#editControls").find(".edit-include-title").prop('checked', false);
                }

                if (_node.attributes().txtInclude) {
                    $("#editControls").find(".edit-include-txt").prop('checked', true);
                } else {
                    $("#editControls").find(".edit-include-txt").prop('checked', false);
                }
                $("#editControls").find(".edit-exp").prop('checked', _node.attributes().leaf == 0);
                $("#editControls").css({
                    "top" : getPosition(_node.attributes()).top,
                    "left" : getPosition(_node.attributes()).left
                });
                $("#editControls").show();
            };

            this.setCircles = function() {
                var opacity = isEditMode() ? 1: 0;
                for (var i = 0; i < _circles.length; i++) {
                    _circles[i].setOpacity(opacity);
                }
                _stage.draw();
            };

            this.getScreenCenter = function () {
                return {
                    width: $('#vostanStage').width() / 2,
                    height: $('#vostanStage').height() / 2
                };
            };

            this.bindTagClose = function(field) {
                // bind click to tag item close element to remove tag item
                _this.$elEdit.on('click', field, function(e) {
                    $(this).parent().fadeOut("fast", function() {
                        $(this).remove();
                    });
                });
            };

            this.bindSaveClick = function(callback) {
                $('#vostanEditStage').find('#edit-save').bind("click", function(e) {
                    e.stopPropagation();
                    window.sOverlay.remove();
                    callback();
                    _node.setElAttributes(_node.$el);
                    EditControls.setNode(_node);
                    _this.clearDescription();
                    $("#vostanEditStage").html("");
                });
            };

            this.bindCancel = function() {
                $('#vostanEditStage').find('#edit-cancel').bind("click", function() {
                    _this.clearDescription();
                    window.sOverlay.remove();
                    EditControls.setNode(_node);
                    $("#vostanEditStage").html("");
                });
            };

            this.clearDescription = function() {
                var desc = $(".description");
                if (desc) {
                    desc.remove();
                }
                clearTimeout(_mouseMoveTimeout);
            };

            this.bindMouseMoveEvent = function(el, txt) {
                _mouseMoveTimeout = null;
                el.on("mousemove", function(e) {
                    _this.clearDescription();
                    _mouseMoveTimeout = setTimeout(function() {
                        var description = $('<node class="description">' + txt + '</node>')
                                          .css({
                                            "left": e.pageX + $("#viewTab").scrollLeft() + 10,
                                            "top": e.pageY + $("#viewTab").scrollTop() + 10,
                                            "padding-left": 5,
                                            "padding-right": 5,
                                            "padding-bottom": 2,
                                            "font-size": 15,
                                            "z-index": 3000
                                          });
                        $("#vostanEditStage").append(description);
                    }, 700);
                });
                el.on("mouseout", function() {
                    _this.clearDescription();
                });
            };

            // Add overlay for vostan edit stage
            this.addWindowOverlay = function() {
                window.sOverlay = $("<div id='sOverlay'></div>");
                sOverlay.css({
                    "position": "absolute",
                    "top": "0",
                    "left": "0",
                    "right": "0",
                    "bottom": "0",
                    "background-color": "#666",
                    "opacity": "0.9",
                    "z-index": "2900"
                });
                $("body").append(window.sOverlay);
                sOverlay.bind("click", function() {
                    $('#uplContainer').remove();
                    $('#uplDialog').remove();
                });
            };

            this.initVostanEditStage = function(width, height, title, wrapEl, offset) {
                _this.addWindowOverlay();
                $("#editControls").hide();
                var center = this.getScreenCenter();
                var parTop = 50;
                offset = offset || 0;
                var node = $('<node class="edits"></node>')
                           .css({
                                 "top": center.height - height / 2 - offset,
                                 "left": center.width - width / 2,
                                 "height": height,
                                 "width": width
                             });
                var view = $('<div class="view"></div>');
                var info = $('<div class="info"><div class="title-box"></div></div>')
                           .css({
                               "font-size": 18,
                               "top": 10,
                               "left": 15,
                               "right": 15,
                               "height": 10
                           })
                info.find(".title-box").html(title);
                var par = $('<div class="par"><div class="wrap"></div></div>')
                          .css({
                              "top": parTop,
                              "width": width,
                              "height": (height - parTop)
                          });
                par.find('.wrap').append(wrapEl);
                view.append(info)
                    .append(par);
                _this.$elEdit = node.append(view);
                $("#vostanEditStage").append(_this.$elEdit);
                view.find('input').focus();
                view.find('input').select();
                _this.addSaveAndCancelNodes(node);
                _this.bindCancel();
            };

            this.addSaveAndCancelNodes = function(node) {
                var editCancel = $('<node id="edit-cancel" class="btn-edit"></node>')
                    .css({
                        "top": parseInt(node.css('top')),
                        "left": parseInt(node.css('left')) + node.width() + 15,
                        "width": 40,
                        "height": 40,
                        "z-index": 3000
                    });
                _this.bindMouseMoveEvent(editCancel, config.getMsg().btn.cancel);
                var editSave = $('<node id="edit-save" class="btn-edit"></node>')
                               .css({
                                   "top": parseInt(node.css('top')) + parseInt(editCancel.css('width')) + 15,
                                   "left": parseInt(node.css('left')) + node.width() + 15,
                                   "width": 40,
                                   "height": 40,
                                   "z-index": 3000
                               })
                _this.bindMouseMoveEvent(editSave, config.getMsg().btn.save);
                $("#vostanEditStage").append(editSave)
                                     .append(editCancel);
            };

            // Edit Tags
            this.editTags = function() {
                var tmpVal = _node.isQuery() ? [_node.attributes().tags] : _node.attributes().tags.split(',');
                var tagVal = "";
                if (tmpVal != "") {
                    $.each(tmpVal, function(i, l) {
                        tagVal += '<li class="tagit-choice"><span class="tagit-label">' + $.trim(l) + '</span><a class="tagit-close"><span class="text-icon">×</span></a></li>';
                    });
                }
                var editTag = $('<input type="text" class="edit-tag" id="inputSingleField" value=""/>')
                              .css({
                                  "width": 550
                              });
                var tagitNew = $('<li class="tagit-new"></li>')
                               .append(editTag);
                var tagField = $('<ul class="singleFieldTags"></ul>')
                               .css({
                                   "width": 560,
                                   "margin-left": 15
                               })
                               .append(tagVal)
                               .append(tagitNew);
                _this.initVostanEditStage(600, 140, config.getMsg().btn.tags, tagField);
                this.tagsAutocomplete();
                this.bindTagClose('.tagit-close');
                var tagsList = _this.$elEdit.find('.singleFieldTags');
                this.dragTags(tagsList);
                this.editTag(tagsList);
                this.bindSaveClick(this.saveTags);
                $("#vostanEditStage").show();
            };

            this.tagsAutocomplete = function() {
                $(".edit-tag").autocomplete({
                    source : function(request, callback) {
                        var searchParam = request.term;
                        if ($.trim(searchParam).slice(-1) == "," && $.trim(searchParam) != "," && ! _node.isQuery(searchParam)) {
                            var item = '<li class="tagit-choice"><span class="tagit-label">' + $.trim(searchParam).slice(0, -1) + '</span><a class="tagit-close"><span class="text-icon">×</span></a></li>';
                            $('.tagit-new').before($(item));
                            $('.tagit-new input').val('');
                            $( ".edit-tag" ).autocomplete( "close");
                        } else {
                            $.ajax({
                                type : 'GET',
                                url : _host + '/tags/lang/' + _lang + '?term=' + searchParam,
                                dataType : 'json',
                                success : function(data) {
                                    callback($.map(data, function(item) {
                                        return {
                                            label : item.tag
                                        };
                                    }));
                                },
                                error : function(xhr) {
                                    console.log("Error in /tags", xhr);
                                }
                            });
                        }
                    },
                    minLength : 1,
                    select : function(event, ui) {
                        if (! _node.isQuery(ui.item.label)) {
                            var item = '<li class="tagit-choice"><span class="tagit-label">' + $.trim(ui.item.label) + '</span><a class="tagit-close"><span class="text-icon">×</span></a></li>';
                            $('.tagit-new').before($(item));
                            $('.tagit-new input').val('');
                            $( ".edit-tag" ).autocomplete( "close");
                            return false;
                        }
                    }
                });
            };

            this.dragTags = function(tags) {
                tags.sortable({
                    containment: "parent",
                    scroll: false,
                    items: "li:not(.tagit-new)",
                    dropOnEmpty: false,
                    start: function() {
                        disableScroll();
                        $(this).addClass("tag-drag");
                    },
                    stop: function() {
                        enableScroll();
                        $(this).removeClass("tag-drag");
                    }
                });
            };

            this.editTag = function (tagsField) {
                var tags = tagsField.find(".tagit-choice");
                tags.bind("dblclick", function(e) {
                    e.stopImmediatePropagation();
                    e.stopPropagation();
                    if (_node.isQuery($(this).text())) {
                        tagsField.find(".tagit-new input").val($(this).text().slice(0,-1));
                        $(this).hide();
                        $(this).remove();
                    }
                });
            };

            this.saveTags = function() {
                var tagAttrVal = "";
                var attributes = _node.attributes();
                _node.setModified(true);
                $.each(_this.$elEdit.find('.tagit-choice'), function() {
                    var tag = $(this).find('.tagit-label');
                    tagAttrVal += tag.text() + ",";
                });
                var extraTag = _this.$elEdit.find("#inputSingleField").val();
                if (extraTag != "") {
                    tagAttrVal += extraTag;
                    attributes.tags = tagAttrVal;
                } else {
                    attributes.tags = tagAttrVal.slice(0, -1);
                }
            };

            // Edit viewers
            this.editViewers = function() {
                var viewerTmpVal = _node.attributes().viewers.split(',');
                var viewerVal = "";
                if (viewerTmpVal != "") {
                    $.each(viewerTmpVal, function(i, l) {
                        viewerVal += '<li class="viewers-choice"><span class="viewers-label">' + $.trim(l) + '</span><a class="viewers-close"><span class="text-icon">×</span></a></li>';
                    });
                }
                var editViewer = $('<input type="text" class="edit-viewer" id="inputSingleFieldViewers" value=""/>')
                                 .css({
                                     "width": 550
                                 });
                var viewerNew = $('<li class="viewers-new"></li>')
                                .append(editViewer);
                var viewerField = $('<ul class="singleFieldViewers"></ul>')
                                  .css("width", 560)
                                  .css("margin-left", 15)
                                  .append(viewerVal)
                                  .append(viewerNew);
                _this.initVostanEditStage(600, 140, config.getMsg().btn.users_view, viewerField);
                this.viewerAutocomplete();
                this.bindTagClose('.viewers-close');
                this.bindSaveClick(this.saveViewers);
                $("#vostanEditStage").show();
            };

            this.viewerAutocomplete = function() {
                $(".edit-viewer").autocomplete({
                    source : function(request, callback) {
                        var searchParam = request.term;
                        if ($.trim(searchParam).slice(-1) == "," && $.trim(searchParam) != ",") {
                            var item = '<li class="viewers-choice"><span class="viewers-label">' + $.trim(searchParam).slice(0, -1) + '</span><a class="viewers-close"><span class="text-icon">×</span></a></li>';
                            $('.viewers-new').before($(item));
                            $('.viewers-new input').val('');
                            $( ".edit-viewer" ).autocomplete( "close");
                        } else {
                            $.ajax({
                                type : 'GET',
                                url : _host + '/users?term=' + searchParam,
                                dataType : 'json',
                                success : function(data) {
                                    callback($.map(data, function(item) {
                                        return {
                                            label : item.user
                                        };
                                    }));
                                },
                                error : function(xhr) {
                                    console.log("Error in /viewers", xhr);
                                }
                            });
                        }
                    },
                    minLength : 1,
                    select : function(event, ui) {
                        var item = '<li class="viewers-choice"><span class="viewers-label">' + $.trim(ui.item.label) + '</span><a class="viewers-close"><span class="text-icon">×</span></a></li>';
                        $('.viewers-new').before($(item));
                        $('.viewers-new input').val('');
                        $( ".edit-viewer" ).autocomplete( "close");
                        return false;
                    }
                });
            };

            this.saveViewers = function() {
                var viewerAttrVal = "";
                var attributes = _node.attributes();
                _node.setModified(true);
                $.each(_this.$elEdit.find('.viewers-choice'), function() {
                    viewerAttrVal += $(this).find('.viewers-label').text() + ",";
                });

                var extraViewers = _this.$elEdit.find("#inputSingleFieldViewers").val();
                if (extraViewers != "") {
                    viewerAttrVal += extraViewers + ",";
                }
                attributes.viewers = viewerAttrVal.slice(0, -1);
            };

            // Edit editors
            this.editEditors = function() {
                var userTmpVal = _node.attributes().users.split(',');
                var userVal = "";
                if (userTmpVal != "") {
                    $.each(userTmpVal, function(i, l) {
                        userVal += '<li class="users-choice"><span class="users-label">' + $.trim(l) + '</span><a class="users-close"><span class="text-icon">×</span></a></li>';
                    });
                }
                var editUser = $('<input type="text" class="edit-user" id="inputSingleFieldUsers" value=""/>')
                                 .css({
                                     "width": 550
                                 });
                var usersNew = $('<li class="users-new"></li>').append(editUser);
                var userField = $('<ul class="singleFieldUsers"></ul>')
                                .css("width", 560)
                                .css("margin-left", 15)
                                .append(userVal)
                                .append(usersNew);
                _this.initVostanEditStage(600, 140, config.getMsg().btn.users_edit, userField);
                this.editorAutocomplete();
                this.bindTagClose('.users-close');
                this.bindSaveClick(this.saveEditors);
                $("#vostanEditStage").show();
            };

            this.editorAutocomplete = function() {
                $(".edit-user").autocomplete({
                    source : function(request, callback) {
                        var searchParam = request.term;
                        if ($.trim(searchParam).slice(-1) == "," && $.trim(searchParam) != ",") {
                            var item = '<li class="users-choice"><span class="users-label">' + $.trim(searchParam).slice(0, -1) + '</span><a class="users-close"><span class="text-icon">×</span></a></li>';
                            $('.users-new').before($(item));
                            $('.users-new input').val('');
                            $( ".edit-user" ).autocomplete( "close");
                        } else {
                            $.ajax({
                                type : 'GET',
                                url : _host + '/users?term=' + searchParam,
                                dataType : 'json',
                                success : function(data) {
                                    callback($.map(data, function(item) {
                                        return {
                                            label : item.user
                                        };
                                    }));
                                },
                                error : function(xhr) {
                                    console.log("Error in /users", xhr);
                                }
                            });
                        }
                    },
                    minLength : 1,
                    select : function(event, ui) {
                        var item = '<li class="users-choice"><span class="users-label">' + $.trim(ui.item.label) + '</span><a class="users-close"><span class="text-icon">×</span></a></li>';
                        $('.users-new').before($(item));
                        $('.users-new input').val('');
                        $( ".edit-user" ).autocomplete( "close");
                        return false;
                    }
                });
            };

            this.saveEditors = function() {
                var userAttrVal = "";
                var attributes = _node.attributes();
                _node.setModified(true);
                $.each(_this.$elEdit.find('.users-choice'), function() {
                    userAttrVal += $(this).find('.users-label').text() + ",";
                });

                var extraUser = _this.$elEdit.find("#inputSingleFieldUsers").val();
                if (extraUser != "") {
                    userAttrVal += extraUser + ",";
                }
                attributes.users = userAttrVal.slice(0, -1);
            };

            // Edit location
            this.editLocation = function () {
                var editLocation = $('<input class="edit-location" type="text"/>')
                                   .attr("value", _node.attributes().location)
                                   .css("width", 562)
                                   .css("height", 30)
                                   .css("margin-left", 15);
                _this.initVostanEditStage(600, 110, config.getMsg().btn.location, editLocation);
                this.bindSaveClick(function() {
                    var attributes = _node.attributes();
                    _node.setModified(true);
                    var locationValue = _this.$elEdit.find(".edit-location").val();
                    attributes.location = locationValue;
                });
                $("#vostanEditStage").show();
            };

            // Edit Title
            this.editTitle = function () {
                var editTitle = $('<input class="edit-title" type="text"/>')
                                .attr("value", _node.attributes().title)
                                .css("width", 562)
                                .css("height", 30)
                                .css("margin-left", 15);
                _this.initVostanEditStage(600, 110, config.getMsg().btn.edit_title, editTitle);
                this.bindSaveClick(function() {
                    var attributes = _node.attributes();
                    _node.setModified(true);
                    attributes.title = _this.$elEdit.find(".edit-title").val();
                });
                $("#vostanEditStage").show();
            };

            // Edit image
            this.editImg = function () {
                var editImg = $('<input type="text" class="edit-img"/>')
                              .attr("value", _node.attributes().img)
                              .css("width", 562)
                              .css("height", 30)
                              .css("margin-left", 15);
                var width = 600;
                var height = 110;
                var offset = 150;
                _this.initVostanEditStage(width, height, config.getMsg().btn.edit_img, editImg, offset);
                var center = this.getScreenCenter();
                var top = center.height + height / 2 - offset + 15;
                var left = center.width - width / 2;
                if (!_node.isAttachment()) {
                    var editImgURL = $('<node id="edit-img-url" class="btn-edit"></node>')
                                     .css({
                                         "top": top,
                                         "left": left,
                                         "width": 40,
                                         "height": 40,
                                         "z-index": 3000
                                     });
                    _this.bindMouseMoveEvent(editImgURL, config.getMsg().btn.upload_from_url);
                    var editImgList = $('<node id="edit-img-list" class="btn-edit"></node>')
                                      .css({
                                          "top": top,
                                          "left": left + editImgURL.width() + 15,
                                          "width": 40,
                                          "height": 40,
                                          "z-index": 3000
                                      });
                    _this.bindMouseMoveEvent(editImgList, config.getMsg().btn.select);
                    left = parseInt(editImgList.css('left')) + editImgList.width() + 15;
                    $('#vostanEditStage').append(editImgURL)
                                         .append(editImgList);

                }
                var chooseFile = $('<node id="choose-file" class="btn-edit"></node>')
                               .css({
                                   "top": top,
                                   "left": left,
                                   "width": 40,
                                   "height": 40,
                                   "z-index": 3000
                               });
                _this.bindMouseMoveEvent(chooseFile, config.getMsg().btn.choose_file);
                var hidedChooseFile = $('<input type="file" id="hided-choose-file"/>')
                                      .css("visibility", "hidden");
                $('#vostanEditStage').append(chooseFile)
                                     .append(hidedChooseFile);
                this.bindImgClicks();
                this.bindSaveClick(function () {
                    _node.setModified(true);
                    _node.attributes().img = $(".edit-img").val().trim();
                });
                $("#vostanEditStage").show();
            };

            this.bindImgClicks = function() {
                var center = _this.getScreenCenter();
                $("#choose-file").bind("click", function() {
                    _this.clearDescription();
                    $("#uplContainer").remove();
                    $("#uplDialog").remove();
                    $("#hided-choose-file").trigger("click");
                });

                $("#hided-choose-file").bind("change", function(e) {
                    var formdata = new FormData();
                    $.each(e.currentTarget.files, function(i, file) {
                        formdata.append(i, file);
                    });
                    var url = _host + '/upload';
                    if (_node.isAttachment()) {
                        url = _host + '/attach';
                    }
                    $("#choose-file").toggleClass("btn-edit-wait");
                    $.ajax({
                        type : 'POST',
                        url : url,
                        data : formdata,
                        cache : false,
                        contentType : false,
                        processData : false,
                        success : function(data) {
                            if (isValid(data) && data.url) {
                                $(".edit-img").val(data.url);
                            } else {
                                alert(config.getMsg().alert.duplicatename);
                            }
                        },
                        error : function(xhr) {
                            console.log("Error in File Upload", xhr);
                        },
                        complete : function() {
                            $("#choose-file").toggleClass("btn-edit-wait");
                        }
                    });
                });

                $('#edit-img-url').bind("click", function(e) {
                    e.stopPropagation();
                    _this.clearDescription();
                    $('#uplContainer').remove();
                    $('#uplDialog').remove();
                    var input = $('<input id="img-url" type="text" style="width:300px">')
                                .css({
                                    "top": 20,
                                    "height": 15
                                });
                    var button = $('<node id="img-url-save">OK</node>')
                                 .css({
                                     "width": 40,
                                     "height": 20,
                                     "left": 330,
                                     "top": 5,
                                     "text-align": "center"
                                 })
                                 .attr('value', 'OK');
                    var uplDialog = $('<node id="uplDialog"></node>')
                                    .css({
                                        "top": parseInt($("#edit-img-list").css("top")) + $("#edit-img-list").height() + 15,
                                        "left": parseInt($(".edits").css("left")),
                                        "padding": 5
                                    })
                                    .append(input)
                                    .append(button);
                    $('#vostanEditStage').append(uplDialog);
                    $('#img-url-save').bind("click", function(e) {
                        e.stopImmediatePropagation();
                        var url = $('#img-url').val();
                        $('#uplDialog').remove();
                        $("#edit-img-url").toggleClass("btn-edit-wait");
                        $.ajax({
                            type : 'POST',
                            url : _host + '/upload/url',
                            data : {
                                url : url
                            },
                            dataType : 'json',
                            success : function(data) {
                                if (isValid(data)) {
                                   $(".edit-img").val(data.url);
                                } else {
                                    alert(data.error.uploadFromURL);
                                }
                            },
                            error : function(xhr) {
                                console.log("Error in Uploading image from URL", xhr);
                            },
                            complete : function() {
                                $("#edit-img-url").toggleClass("btn-edit-wait");
                            }
                        });
                    });
                });

                $('#edit-img-list').bind("click", function(e) {
                    e.stopPropagation();
                    _this.clearDescription();
                    $('#uplContainer').remove();
                    $('#uplDialog').remove();
                    $(this).toggleClass("btn-edit-wait");
                    $.ajax({
                        type : 'GET',
                        url : _host + '/uploads',
                        dataType : 'json',
                        success : function(data) {
                            if (isValid(data) && data.length > 0) {
                                var uplContainer = $('<div id="uplContainer"></div>')
                                                   .css({
                                                        "top": parseInt($("#edit-img-list").css("top")) + $("#edit-img-list").height() + 15,
                                                        "left": parseInt($(".edits").css("left"))
                                                   })
                                $("#vostanEditStage").append(uplContainer);
                                $('#uplContainer').show("fast");
                                var uplList = $('<ul id="uplList"></ul>');
                                $("#uplContainer").append(uplList);
                                for (var i = 0; i < data.length; i++) {
                                    $('#uplList').append("<li> <a> <img class='uploads' src='" + data[i].url + "' /> </a><br><span class='imagetooltip'>" + data[i].name + "</li>");
                                }
                                $('.uploads').bind("click", function() {
                                    $(".edit-img").val($(this).attr("src"));
                                    $("#uplContainer").remove();
                                });
                            } else {
                                alert(config.getMsg().alert.no_upload);
                            }
                        },
                        error : function(xhr) {
                            console.log("Error in File Listing", xhr);
                        },
                        complete : function() {
                            $("#edit-img-list").toggleClass("btn-edit-wait");
                        }
                    });
                });
            };

            // Edit description
            this.editTxt = function () {
                var editTxt = $('<textarea rows="5" id="edit-text-area" class="edit-txt "></textarea>')
                              .val(_node.attributes().txt);
                _this.initVostanEditStage(670, 500, config.getMsg().btn.edit_txt, editTxt);
                $(".edits").find(".par").css("padding-left", 9);
                tinymce.init({
                    auto_focus : "edit-text-area",
                    selector : "textarea.edit-txt",
                    plugins : [
                        "advlist autolink lists link image charmap print preview anchor",
                        "searchreplace visualblocks code fullscreen",
                        "insertdatetime table contextmenu paste"
                    ],
                    toolbar : "insertfile undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image",
                    extended_valid_elements : "flag[class]",
                    height: 338,
                    width: 650
                });
                this.bindSaveClick(function() {
                    var attributes = _node.attributes();
                    _node.setModified(true);
                    attributes.txt = tinymce.activeEditor && tinymce.activeEditor.getContent({
                        format : 'raw'
                    }) || "";
                    _node.setElTextAttrs(_node.$el);
                });
                $("#vostanEditStage").show();
            };

            this.initControlsClick = function() {
                $(".link-edits").html("");
                this.initControls($("#editControls").html(""));

                // Title edit control
                $(".title-edit-control").bind("click", function(e) {
                    e.stopPropagation();
                    _this.editTitle();
                });

                // Tag edit control
                $(".tags-edit-control").bind("click", function(e) {
                    e.stopPropagation();
                    _this.editTags();
                });

                // Viewers edit control
                $(".viewer-edit-control").bind("click", function(e) {
                    e.stopPropagation();
                    _this.editViewers();
                });

                // Editor edit control
                $(".editor-edit-control").bind("click", function(e) {
                    e.stopPropagation();
                    _this.editEditors();
                });

                // Location edit control
                $(".location-edit-control").bind("click", function(e) { e.stopPropagation();
                    _this.editLocation();
                });

                // Image edit control
                $(".img-edit-control").bind("click", function(e) {
                    e.stopPropagation();
                    _this.editImg();
                });

                // Txt edit control
                $(".txt-edit-control").bind("click", function(e) {
                    e.stopPropagation();
                    _this.editTxt();
                });

                $(".edit-include-img").bind("click", function(e) {
                    e.stopPropagation();
                    _node.setImgInclude();
                });

                $(".edit-include-title").bind("click", function(e) {
                    e.stopPropagation();
                    _node.setTitleInclude();
                });

                $(".edit-include-txt").bind("click", function(e) {
                    e.stopPropagation();
                    _node.setTxtInclude();
                });

                $(".edit-exp").bind("click", function(e) {
                    e.stopPropagation();
                    _node.setNonExpandable();
                });

                $(".script").bind("click", function(e) {
                    if (isEditMode()) {
                        _node.vEditScript();
                        $("#editControls").hide();
                    }
                });

                $(".hide").bind("click", function(e) {
                    if (isEditMode()) {
                        var r;
                        if (_node.isModified()) {
                            r = confirm(config.getMsg().alert.hide_unsaved_node);
                        } else {
                            r = confirm(config.getMsg().alert.hide_node);
                        }
                        if (r == true) {
                            e.stopPropagation();
                            Map.removeNode(_node);
                            _node.hideFromPage();
                            $("#editControls").hide();
                        }
                    }
                });

                $(".delete").bind("click", function(e) {
                    if (isEditMode()) {
                        var r = confirm(config.getMsg().alert.dlt_node);
                        if (r == true) {
                            e.stopPropagation();
                            Map.removeNode(_node);
                            _node.deleteFromPage();
                            $("#editControls").hide();
                        }
                    }
                });

                $(".expand").bind("click", function(e) {
                    if (isEditMode()) {
                        var r = confirm(config.getMsg().alert.expand_node);
                        if (r == true) {
                            e.stopPropagation();
                            _node.expandNode();
                        }
                    }
                });
                $(".collapse").bind("click", function(e) {
                    if (isEditMode()) {
                        var r = confirm(config.getMsg().alert.collapse_node);
                        if (r == true) {
                            e.stopPropagation();
                            Map.collapseNode(_node);
                        }
                    }
                });
                $(".appendtoall").bind("click", function(e) {
                    if (isEditMode()) {
                        var r = confirm(config.getMsg().alert.show_in_all);
                        if (r == true) {
                            _node.appendNodeToAll();
                        }
                    }
                });
                $(".deletefromall").bind("click", function(e) {
                    if (isEditMode()) {
                        var r = confirm(config.getMsg().alert.hide_in_all);
                        if (r == true) {
                            _node.deleteNodeFromAll();
                        }
                    }
                });
                $(".add").bind("click", function(e) {
                    if (isEditMode()) {
                        e.stopPropagation();
                        _node.defineNewNode(_lang);
                    }
                });

                $('.attach').bind("change", function(e) {
                    _rootTitle = _node.attributes().title;
                    var formdata = new FormData();
                    $.each(e.currentTarget.files, function(i, file) {
                        formdata.append(i, file);
                    });
                    var url = _host + '/attach';
                    $.ajax({
                        type : 'POST',
                        url : url,
                        data : formdata,
                        cache : false,
                        contentType : false,
                        processData : false,
                        success : function(data) {
                            if (isValid(data) && data.url) {
                                _node.defineNewAttach(_lang, data);
                            } else {
                                alert(config.getMsg().alert.duplicatename);
                            }
                        },
                        error : function(xhr) {
                                    console.log("Error in File Attach", xhr);
                                },
                        complete : function() {
                                   }
                    });
                });

                $(".copysettings").bind("click", function(e) {
                    if (isEditMode()) {
                        var r = confirm(config.getMsg().alert.apply_settings);
                        if (r === true) {
                            e.stopPropagation();
                            _node.copySettings();
                        }
                    }
                });
                $(".copy").bind("click", function(e) {
                    if (isEditMode()) {
                        window.vostan_tmpAttributes = _node.attributes();
                    }
                });
                $(".paste").bind("click", function(e) {
                    if (window.vostan_tmpAttributes) {
                        _node.pasteAttributes(window.vostan_tmpAttributes);
                    }
                });
                $(".copynode").bind("click", function(e) {
                    window.copiedNode = _node.attributes();
                    window.copiedNodeID = _node.attributes().nodeID;
                    window.copiedRootID = _root;
                });
                $(".pastenode").bind("click", function(e) {
                    if(!(window.copiedNodeID && window.copiedRootID)){
                        alert(config.getMsg().alert.copy_node);
                        return;
                    }
                    $.ajax({
                        type : 'GET',
                        url : _host + '/paste/node/' + window.copiedNodeID + '/from/' + copiedRootID + '/to/' +_root,
                        dataType : 'json',
                        contentType: 'application/json',
                        success : function(data) {
                            if (isValid(data)) {
                                Map.appendNewNode(copiedNode, "paste");
                            }
                        },
                        error : function(xhr) {
                            console.log("Error in Paste Node", xhr);
                        }
                    });
                });
                $(".link").bind("click", function(e) {
                    if (isEditMode() && (_linkAdds.length === 0 || _linkAdds[0] != _node.attributes().nodeID)) {
                        $("#editControls").hide();
                        e.stopPropagation();
                        _linkAdds.push(_node.attributes().nodeID);
                        $("body").toggleClass("connect");
                    }
                });
            };

            this.initControls = function(controlsNode) {
                controls = {
                    link: '<a class="link">' + config.getMsg().btn.link + '</a>',
                    hideinall: '<a class="deletefromall">' + config.getMsg().btn.hide_in_all + '</a>',
                    showinall: '<a class="appendtoall">' + config.getMsg().btn.show_in_all + '</a>',
                    copysettings: '<a class="copysettings">' + config.getMsg().btn.apply_settings + '</a>',
                    expand: '<a class="expand">' + config.getMsg().btn.expand + '</a>',
                    collapse: '<a class="collapse">' + config.getMsg().btn.collapse + '</a>',
                    hide: '<a class="hide">' + config.getMsg().btn.hide + '</a>',
                    add: '<a class="add">' + config.getMsg().btn.add + '</a>',
                    copy: '<a class="copy">' + config.getMsg().btn.copy_settings + '</a>',
                    paste: '<a class="paste">' + config.getMsg().btn.paste_settings + '</a>',
                    copynode: '<a class="copynode">' + config.getMsg().btn.copy_node + '</a>',
                    pastenode: '<a class="pastenode">' + config.getMsg().btn.paste_node + '</a>',
                    script: '<a class="script">' + config.getMsg().btn.script + '</a>',
                    incl_img: '<a><label><input type="checkbox" class="edit-include-img" >' + config.getMsg().btn.incl_image + '</label></a>',
                    incl_title: '<a><label><input type="checkbox" class="edit-include-title">' + config.getMsg().btn.incl_title + '</label></a>',
                    incl_txt: '<a><label><input type="checkbox" class="edit-include-txt">' + config.getMsg().btn.incl_txt + '</label></a>',
                    exp: '<a><label><input type="checkbox" class="edit-exp">' + config.getMsg().btn.exp + '</label></a>',
                    deleteAttach: '<a class="delete">' + config.getMsg().btn.dlt + '</a>',
                    attach: '<a><input class="attach" type="file"/></a>',
                    clear: '<a class="clear"></a>',
                    clear_delimiter: '<a class="clear" style="width:95%;border-top:#369 1px solid;"></a>',
                    edit_txt: '<a class="txt-edit-control">' + config.getMsg().btn.edit_txt + '</a>',
                    edit_img: '<a class="img-edit-control">' + config.getMsg().btn.edit_img + '</a>',
                    edit_tags: '<a class="tags-edit-control">' + config.getMsg().btn.edit_tags + '</a>',
                    edit_viewers: '<a class="viewer-edit-control">' + config.getMsg().btn.edit_viewers + '</a>',
                    edit_editor: '<a class="editor-edit-control">' + config.getMsg().btn.edit_editor + '</a>',
                    edit_location: '<a class="location-edit-control">' + config.getMsg().btn.edit_location + '</a>',
                    edit_title: '<a class="title-edit-control">' + config.getMsg().btn.edit_title + '</a>'
                };
                controlsNode.append(controls.link);
                if (_node.isRoot()) {
                    controlsNode.append(controls.add);
                }

                if (_node.isAttachment()) {
                    controlsNode.append(controls.deleteAttach);
                }

                if (!_node.isRoot()) {
                    controlsNode.append(controls.exp);
                }
                // TODO - think about checking
                controlsNode.append(controls.clear_delimiter)
                            .append(controls.edit_title)
                            .append(controls.incl_title)
                            .append(controls.clear)
                            .append(controls.edit_img)
                            .append(controls.incl_img)
                            .append(controls.clear)
                            .append(controls.edit_txt)
                            .append(controls.incl_txt);

                controlsNode.append(controls.clear)
                            .append(controls.edit_tags)
                            .append(controls.script);

                if (!_node.isAttachment()) {
                    controlsNode.append(controls.edit_location);
                }

                if (_node.isRoot()) {
                    controlsNode.append(controls.attach);
                }

                controlsNode.append(controls.clear_delimiter);

                if (!_node.isRoot()) {
                    controlsNode.append(controls.hide);
                }

                controlsNode.append(controls.hideinall)
                            .append(controls.showinall)
                            .append(controls.expand)
                            .append(controls.collapse);

                controlsNode.append(controls.clear_delimiter)
                            .append(controls.copysettings)
                            .append(controls.copy)
                            .append(controls.paste);

                if (!_node.isAttachment()) {
                    controlsNode.append(controls.copynode);
                }
                if (_node.isRoot()) {
                    controlsNode.append(controls.pastenode);
                }

                controlsNode.append(controls.clear_delimiter)
                            .append(controls.edit_viewers)
                            .append(controls.edit_editor);
            };

            if ($.ui) {
                $.ui.autocomplete.prototype._renderItem = function(ul, item) {
                    var re = new RegExp(this.term, "ig");
                    var t = item.label.replace(re, "<span style='font-weight:bold;color:#1B6CB8;'>" + "$&" + "</span>");
                    return $("<li></li>").data("item.autocomplete", item).append("<a>" + t + "</a>").appendTo(ul);
                };
            }

            /* End Nodes collection object */
        };

        /**** End EditController */

        /**** Start Node object */

        var Node = function(obj) {
            var _this = this;

            var modified = false;

            var attributes = {
                nodeID : obj.nodeID ? parseInt(obj.nodeID) : 0,
                title : obj.title || "New Node",
                img : obj.img || "",
                txt : obj.txt || "",
                script : obj.script || "",
                tags : obj.tags ? obj.tags : "",
                location : obj.location ? obj.location : "",
                user : obj.user ? obj.user : "",
                users : obj.users ? obj.users : "",
                viewers : obj.viewers ? obj.viewers : "",
                top : obj.top ? parseFloat(obj.top) : 10,
                left : obj.left ? parseFloat(obj.left) : 10,
                width : obj.width ? parseFloat(obj.width) : 160,
                height : obj.height ? parseFloat(obj.height) : 70,
                imgTop : obj.imgTop ? parseFloat(obj.imgTop) : 10,
                imgLeft : obj.imgLeft ? parseFloat(obj.imgLeft) : 10,
                imgWidth : obj.imgWidth ? parseFloat(obj.imgWidth) : 40,
                imgHeight : obj.imgHeight ? parseFloat(obj.imgHeight) : 40,
                titleTop : obj.titleTop ? parseFloat(obj.titleTop) : 15,
                titleLeft : obj.titleLeft ? parseFloat(obj.titleLeft) : 15,
                titleWidth : obj.titleWidth ? parseFloat(obj.titleWidth) : 110,
                titleHeight : obj.titleHeight ? parseFloat(obj.titleHeight) : 40,
                txtTop : obj.txtTop ? parseFloat(obj.txtTop) : 50,
                txtLeft : obj.txtLeft ? parseFloat(obj.txtLeft) : 10,
                txtWidth : obj.txtWidth ? parseFloat(obj.txtWidth) : 230,
                txtHeight : obj.txtHeight ? parseFloat(obj.txtHeight) : 40,
                titleInclude : (obj.titleInclude != undefined && parseInt(obj.titleInclude) == 1) ? true : false,
                imgInclude : (obj.imgInclude != undefined && parseInt(obj.imgInclude) == 1) ? true : false,
                txtInclude : (obj.txtInclude != undefined && parseInt(obj.txtInclude) == 1) ? true : false,
                leaf : (obj.leaf != undefined && parseInt(obj.leaf) == 1) ? true : false,
                carousel : (obj.carousel != undefined && parseInt(obj.carousel) == 1) ? true : false
            };

            var clickedStep = 0;
            var handleNodeClick = true;

            this.isModified = function () {
                return modified;
            };

            this.setModified = function (value) {
                modified = value;
            };

            this.changeClickedStep = function (step) {
                clickedStep = step;
            };

            var getNodeClass = function() {
                var tmp = "node-";
                if (attributes.nodeID === _root) {
                    tmp = "node-root " + tmp;
                }
                if (attributes.nodeID === _history.prev()) {
                    tmp = "node-proot " + tmp;
                } else if (attributes.nodeID === _history.next()) {
                    tmp = "node-nroot " + tmp;
                } else if (_this.isExternal() && !_this.isGGG()) {
                    tmp = "node-url " + tmp;
                }
                if (attributes.titleInclude) {
                    tmp += "n";
                }
                if (attributes.imgInclude) {
                    tmp += "i";
                }

                if (attributes.txtInclude) {
                    tmp += "t";
                }

                if (attributes.leaf) {
                    tmp += " leaf";
                }

                return tmp == "node-" ? "node-n" : tmp;
            };

            var getUpdateData = function() {
                return JSON.stringify({
                    "title" : attributes.title,
                       "img" : attributes.img,
                       "txt" : attributes.txt,
                       "script" : attributes.script,
                       "tags" : attributes.tags,
                       "location" : attributes.location,
                       "users" : attributes.users,
                       "viewers" : attributes.viewers,
                       "top" : attributes.top,
                       "left" : attributes.left,
                       "width" : attributes.width,
                       "height" : attributes.height,
                       "imgInclude" : attributes.imgInclude ? 1 : 0,
                       "titleInclude" : attributes.titleInclude ? 1 : 0,
                       "txtInclude" : attributes.txtInclude ? 1 : 0,
                       "leaf" : attributes.leaf ? 1 : 0,
                       "carousel" : attributes.carousel ? 1 : 0,
                       "imgWidth" : attributes.imgWidth,
                       "imgHeight" : attributes.imgHeight,
                       "imgLeft" : attributes.imgLeft,
                       "imgTop" : attributes.imgTop,
                       "titleWidth" : attributes.titleWidth,
                       "titleHeight" : attributes.titleHeight,
                       "titleLeft" : attributes.titleLeft,
                       "titleTop" : attributes.titleTop,
                       "txtWidth" : attributes.txtWidth,
                       "txtHeight" : attributes.txtHeight,
                       "txtLeft" : attributes.txtLeft,
                       "txtTop" : attributes.txtTop
                });
            };

            var getNewData = function(lang) {
                var title = "New Node";
                if (lang == "hy") {
                    title = "Նոր գագաթ";
                } else if (lang == "ru") {
                    title = "Новый узел";
                }
                return JSON.stringify({
                    "title" : title,
                    "img" : "",
                    "txt" : "",
                    "script" : "",
                    "location" : ""
                });
            };

            var updateInfo = function() {
                if (!modified) {
                    return;
                }
                _activeUpdates++;
                $.ajax({
                    type : 'POST',
                    url : _host + '/update/node/' + attributes.nodeID + '/root/' + _root + '/lang/' + _lang + '?t=' + Date.now(),
                    dataType : 'json',
                    contentType : 'application/json',
                    data : getUpdateData(),
                    async : false,
                    success : function(data) {
                        isValid(data);
                    },
                    error : function(xhr) {
                        console.log("Error in Update Node", xhr);
                    },
                    complete : function(xhr) {
                        modified = false;
                        _activeUpdates--;
                    }
                });
            };

            this.pasteAttributes = function(attr) {
                attributes.width = attr.width;
                attributes.height = attr.height;
                attributes.imgInclude = attr.imgInclude;
                attributes.titleInclude = attr.titleInclude;
                attributes.txtInclude = attr.txtInclude;
                attributes.imgWidth = attr.imgWidth;
                attributes.imgHeight = attr.imgHeight;
                attributes.imgLeft = attr.imgLeft;
                attributes.imgTop = attr.imgTop;
                attributes.titleWidth = attr.titleWidth;
                attributes.titleHeight = attr.titleHeight;
                attributes.titleLeft = attr.titleLeft;
                attributes.titleTop = attr.titleTop;
                attributes.txtWidth = attr.txtWidth;
                attributes.txtHeight = attr.txtHeight;
                attributes.txtLeft = attr.txtLeft;
                attributes.txtTop = attr.txtTop;
                var r = confirm(config.getMsg().alert.change_position);
                if (r === true) {
                    attributes.top = attr.top;
                    attributes.left = attr.left;
                }
                this.setElAttributes(_this.$el, true);
                this.setElTextAttrs(_this.$el);
                modified = true;
            };

            this.setImgInclude = function() {
                attributes.imgInclude = $(".edit-include-img").prop("checked");
                if (!attributes.imgInclude) {
                    this.$el.find(".img:first").hide();
                } else {
                    this.$el.find(".img:first").show();
                    this.setElAttributes(this.$el);
                    this.setElTextAttrs(this.$el);
                }
                modified = true;
            };

            this.setTitleInclude = function() {
                attributes.titleInclude = $(".edit-include-title").prop("checked");
                if (!attributes.titleInclude) {
                    this.$el.find(".info:first").hide();
                    this.$el.find(".inline-input").remove();
                } else {
                    this.$el.find(".info:first").show();
                    this.setElAttributes(this.$el);
                    this.setElTextAttrs(this.$el);
                }
                modified = true;
            };

            this.setTxtInclude = function() {
                attributes.txtInclude = $(".edit-include-txt").prop("checked");
                if (!attributes.txtInclude) {
                    this.$el.find(".par").hide();
                } else {
                    this.$el.find(".par").show();
                    this.setElAttributes(this.$el);
                    this.setElTextAttrs(this.$el);
                }
                modified = true;
            };

            this.setNonExpandable = function() {
                attributes.leaf = ($(".edit-exp").prop("checked")) ? 0 : 1;
                modified = true;
            };

            this.vEditScript = function() {
                var cmDiv = $("<div class='cm' style='background-color:#ababab;z-index:20000000;position:absolute;top:0;left:0;width:100%;height:100%;'><textarea></textarea><input type='button' id='cmClose' value='X' style='position:absolute;right:5px;top:5px;padding:5px 10px;'></div>");
                $("body").append(cmDiv);
                cmDiv.find("#cmClose").click(function(){
                    attributes.script = txtArea.value;
                    modified = true;
                    cmDiv.remove();
                    window.cmActive = false;
                });
                var txtArea = cmDiv.find("textarea")[0];
                txtArea.value = attributes.script;
                var codeMirror = CodeMirror.fromTextArea(txtArea, {
                    mode : "javascript",
                    tabMode : "indent",
                    keyMap: "vim",
                    matchBrackets: true,
                    showCursorWhenSelecting: true,
                    tabSize : 4,
                    indentUnit: 4
                });
                codeMirror.setOption("extraKeys", {
                    Tab: function(cm) {
                             var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
                             cm.replaceSelection(spaces);
                         }
                });
                codeMirror.setSize("95%", "100%");
                codeMirror.setValue(attributes.script);
                window.cmActive = true;
            };

            /**
             * Utility function for destroying jquery draggable and resizable
             **/

            var destroyDraggablesResizables = function(preserveHandlers) {
                $(".img, .info, .par").each(function() {
                    if ($(this).hasClass("ui-resizable")) {
                        $(this).resizable("destroy");
                    }
                    if ($(this).hasClass("ui-draggable")) {
                        $(this).draggable("destroy");
                    }
                });
                if (!preserveHandlers) {
                    $(".ui-resizable-handle").css("display", "none");
                    $(".img, .info, .par").find(".ui-resizable-handle").css("display", "none");
                    $(".img, .info, .par").css("border", "0px");
                    $("#editControls,.link-edits").hide();
                }
            };

            var isOverlapped = function (area, pointer) {
                var points = {
                    X1 : area.offset().left,
                    Y1 : area.offset().top,
                    X2 : area.offset().left + area.width(),
                    Y2 : area.offset().top + area.height(),
                };
                return ((pointer.X > points.X1) && (pointer.X < points.X2) &&
                        (pointer.Y > points.Y1) && (pointer.Y < points.Y2));
            };

            var isFrameOverlapped = function (pointer) {
                var minShift = 20;
                var maxShift = 100;
                var percent = 0.20;
                var shiftX = Math.max(Math.min((_this.$el.width() * percent),
                             maxShift), minShift);
                var shiftY = Math.max(Math.min((_this.$el.height() * percent),
                             maxShift), minShift);
                shift = Math.min(shiftX, shiftY);
                var node = {
                    left : _this.$el.offset().left,
                    top : _this.$el.offset().top,
                    right : _this.$el.offset().left + _this.$el.width(),
                    bottom : _this.$el.offset().top +  _this.$el.height(),
                };
                return (((pointer.X + shift) > node.right) ||
                        ((pointer.X - shift) < node.left) ||
                        ((pointer.Y + shift) > node.bottom) ||
                        ((pointer.Y - shift) < node.top));
            };

            var getInterseptionAreas = function(pointer) {
                var els = [
                    {'name' : 'titleInclude', 'val' : '.info'},
                    {'name' : 'txtInclude', 'val' : '.par'},
                    {'name' : 'imgInclude', 'val' : '.img'}
                ];
                var areas = [];
                for (var i = 0; i < els.length; i++) {
                    if (attributes[els[i].name]) {
                       var el = _this.$el.find(els[i].val + ':first');
                       if (isOverlapped(el, pointer)) {
                            areas.push(el);
                       }
                    }
                }
                if (0 != areas.length) {
                    if (isFrameOverlapped(pointer)) {
                        areas.push(_this.$el.find('.view:first'));
                    }
                }
                return areas;
            };

            var getEditingElement = function(pointer) {
                var areas = getInterseptionAreas(pointer);
                if (0 != areas.length) {
                    if (1 == areas.length) {
                        clickedStep = 0;
                    }
                    var element = areas[clickedStep];
                    clickedStep = (clickedStep >= areas.length - 1) ? 0 : ++clickedStep;
                    return element;
                }
            };

            var setNodeEditStyle = function(_self) {
                if (!_dragging) {
                    EditControls.setNode(_this);
                    $(_self).closest("node").find(".ui-resizable-handle").css("display", "block");
                }
            };

            this.expandNode = function() {
                var url = _host + '/expand/node/' + attributes.nodeID + '/root/' + _root + '/lang/' + _lang;
                $.ajax({
                    type : 'GET',
                    url : url,
                    dataType : 'json',
                    success : function(data) {
                        if (isValid(data)) {
                            if (data.nodes) {
                                for (var i = 0; i < data.nodes.length; i++) {
                                    Map.appendNewNode(data.nodes[i], "expand");
                                }
                            }
                            if (data.links) {
                                for (var j = 0; j < data.links.length; j++) {
                                    Map.appendNewLink(data.links[j], "expand");
                                }
                            }
                        } else {
                            alert(config.getMsg().alert.expand_conflict);
                        }
                    },
                    error : function(xhr) {
                                console.log("Error in Expand Node", xhr);
                            }
                });
            };

            this.copySettings = function() {
                $.ajax({
                    type : 'GET',
                    url : _host + '/copysettings/node/' + attributes.nodeID + '/root/' + _root,
                    dataType : 'json',
                    success : function(data) {
                        console.log("Success in Copy Settings", data);
                    },
                    error : function(xhr) {
                        console.log("Error in Copy Settings", xhr);
                    }
                });
            };

            this.appendNodeToAll = function() {
                $.ajax({
                    type : 'GET',
                    url : _host + '/appendtoall/node/' + attributes.nodeID + '/root/' + _root,
                    dataType : 'json',
                    success : function(data) {
                        if (isValid(data)) {
                        } else {
                            alert(config.getMsg().alert.expand_conflict);
                        }
                    },
                    error : function(xhr) {
                        console.log("Error in appendtoall Node", xhr);
                    }
                });
            };

            this.deleteNodeFromAll = function() {
                $.ajax({
                    type : 'GET',
                    url : _host + '/hidefromall/node/' + attributes.nodeID + '/root/' + _root,
                    dataType : 'json',
                    success : function(data) {
                        if (isValid(data)) {
                        } else {
                            alert(config.getMsg().alert.expand_conflict);
                        }
                    },
                    error : function(xhr) {
                        console.log("Error in deletefromall Node", xhr);
                    }
                });
            };

            this.defineNewNode = function(_lang) {
                var node = JSON.parse(getNewData(_lang));
                Map.appendNewNode(node, "add");
            };

            this.defineNewAttach = function(_lang, data) {
                var node = JSON.parse(getNewData(_lang));
                node.tags = 'attachment';
                node.title = _rootTitle + "_" + data.name;
                node.titleInclude = 1;
                node.img = data.url;
                Map.appendNewNode(node, "add");
            };

            this.addNewNode = function() {
                $.ajax({
                    type : 'POST',
                    url : _host + '/add/node/' + _root + '/root/' + _root + '/lang/' + _lang,
                    dataType : 'json',
                    contentType : 'application/json',
                    data : getUpdateData(),
                    success : function(data) {
                        if (isValid(data) && data.node) {
                            var node = JSON.parse(getUpdateData());
                            node.nodeID = data.node;
                            Map.appendNewNode(node, "show");
                            var linkAttr = {};
                            linkAttr.nodeID = _root;
                            linkAttr.linkedNodeID = node.nodeID;
                            Map.appendNewLink(linkAttr, "add");
                            $("#editControls").hide();
                        }
                    },
                    error : function(xhr) {
                        console.log("Error in Add Node", xhr);
                    }
                });
            };

            this.appendNewNode = function() {
                $.ajax({
                    type : 'POST',
                    url : _host + '/append/node/' + attributes.nodeID + '/root/' + _root,
                    dataType : 'json',
                    contentType : 'application/json',
                    data : getUpdateData(),
                    success : function(data) {
                        isValid(data);
                    },
                    error : function(xhr) {
                        console.log("Error in Append Node", xhr);
                    }
                });
            };

            this.hideFromPage = function() {
                $.ajax({
                    type : 'GET',
                    url : _host + '/hide/node/' + attributes.nodeID + '/root/' + _root,
                    dataType : 'json',
                    success : function(data) {
                        if (isValid(data)) {
                            Map.removeLinks(attributes.nodeID);
                        }
                    },
                    error : function(xhr) {
                        console.log("Error in Delete Node", xhr);
                    }
                });
            };

            this.deleteFromPage = function() {
                $.ajax({
                    type : 'GET',
                    url : _host + '/delete/node/' + attributes.nodeID,
                    dataType : 'json',
                    success : function(data) {
                        if (isValid(data)) {
                            Map.removeLinks(attributes.nodeID);
                        }
                    },
                    error : function(xhr) {
                        console.log("Error in Delete Node", xhr);
                    }
                });
            };

            this.editNodeContent = function(selector) {
                selector.css('z-index', this.$el.zIndex() + 20);
                selector.find(".par").css("overflow", "hidden");
                if (selector.hasClass("par") && !selector.children().hasClass("wrap")) {
                    selector.css("overflow", "hidden");
                }
                if (selector.find(".resizable-element").length === 0) {
                    selector.wrapInner("<div  class='resizable-element'> </div>");
                }
                $(selector).css("overflow", "visible");
                selector.resizable({
                    containment : 'parent',
                    resize : function(event, ui) {
                        $(this).closest('.node').find('.params').appendTo($(this));
                        selector.find(".params").text("w:" + selector.outerWidth() + " h:" + selector.outerHeight());
                        selector.find(".params").css("display", "block");
                    },
                    handles : "all",
                    stop : function(event, ui) {
                        $(this).find(".params").css("display", "none");
                        if (selector.hasClass("img")) {
                            attributes.imgWidth = $(this).width();
                            attributes.imgHeight = $(this).height();
                            attributes.imgLeft = $(this).position().left;
                            attributes.imgTop = $(this).position().top;
                        } else if (selector.hasClass("info")) {
                            attributes.titleWidth = $(this).width();
                            attributes.titleHeight = $(this).height();
                            attributes.titleLeft = $(this).position().left;
                            attributes.titleTop = $(this).position().top;
                        } else if (selector.hasClass("par")) {
                            attributes.txtWidth = $(this).width();
                            attributes.txtHeight = $(this).height();
                            attributes.txtLeft = $(this).position().left;
                            attributes.txtTop = $(this).position().top;
                        }
                        modified = true;
                    }
                });
                selector.draggable({
                    containment : 'parent',
                    start : function(e) {
                        $(".link-edits").hide();
                        $('.inline-input').closest('node').find('.info').show();
                        $('.inline-input').remove();
                        $(".ui-resizable-handle").css("display", "none");
                        selector.find(".ui-resizable-handle").css("display", "block");
                        selector.css("border", '1px solid').css('border-color', _linkColor);
                    },
                    drag : function() {
                        $(this).closest('node').find('.params').appendTo($(this));
                        $(this).find(".params").text("x:" + this.offsetLeft + " y:" + this.offsetTop);
                        $(this).find(".params").css("display", "block");
                    },
                    stop : function(event, ui) {
                        $(this).find(".params").css("display", "none");
                        if (selector.hasClass("img")) {
                            attributes.imgLeft = $(this).position().left;
                            attributes.imgTop = $(this).position().top;
                        } else if (selector.hasClass("info")) {
                            attributes.titleLeft = $(this).position().left;
                            attributes.titleTop = $(this).position().top;
                        } else if (selector.hasClass("par")) {
                            attributes.txtLeft = $(this).position().left;
                            attributes.txtTop = $(this).position().top;
                        }
                        modified = true;
                    }
                });
                selector.css('border', '1px solid').css('border-color', _linkColor);
                selector.find('.par').css('overflow-y', 'hidden');
                selector.find(".ui-resizable-handle").css("display", "block");
            };

            this.nodeClick = function(_self, pointer) {
                $(".link-edits").hide();
                Map.updateNodesClickedStep(attributes.nodeID);
                $('.inline-input').closest('.view').find('.info').show();
                $('.inline-input').remove();
                destroyDraggablesResizables();
                $(_self).closest("node").find(".ui-resizable-handle")
                        .css("display", "none");
                $(_self).find('.info, .par, .img').css('z-index', 'auto');
                $(_self).find(".img:first, .info:first, .par:first").css("border", '1px dotted #666');
                var el = getEditingElement(pointer);
                if (!el) {
                    setNodeEditStyle(_self);
                } else if (el.hasClass('view')) {
                    setNodeEditStyle(_self);
                } else {
                    _this.editNodeContent(el);
                }
            };

            this.nodeInfoClick = function(_this) {
                viewClass = _this.$el.find(".view:first");
                viewClass.append('<input class = "inline-input" type="text">');
                viewClass.find(".inline-input").keyup(function(e) {
                    e.stopImmediatePropagation();
                    e.stopPropagation();
                    viewClass.find(".title-box").text(viewClass.find('.inline-input').val());
                    _this.attributes().title = viewClass.find('.title-box').text();
                    if (e.keyCode == 13) {
                        viewClass.find('.info').show();
                        $('.inline-input').remove();
                        handleNodeClick = true;
                    }
                    modified = true;
                }).click(function(e) {
                    e.stopImmediatePropagation();
                    e.stopPropagation();
                });
                viewClass.find('.inline-input').val(viewClass.find(".title-box").text()).focus();
                var fontSize = viewClass.find(".info").css("font-size");
                var width = viewClass.find(".info").width();
                var left = viewClass.find(".info").position().left;
                var top = viewClass.find(".info").position().top;
                viewClass.find(".inline-input").css({
                    "padding" : "3px",
                    "font-size" : fontSize,
                    "position" : "absolute",
                    "width" : width,
                    "left" : left,
                    "top" : top,
                    "z-index" : 4600
                });
                viewClass.find(".info").hide();
                clickedStep = 0;
                handleNodeClick = false;
            };

            this.nodeID = function() {
                return attributes.nodeID;
            };

            this.isRoot = function() {
                return attributes.nodeID === _root;
            };

            this.isYoutube = function(url) {
                return url && (url.indexOf("youtube.com") >= 0);
            };

            this.isVideo = function() {
                return (attributes.tags.length > 0) && (attributes.tags.split(",").indexOf("video") >= 0);
            };

            this.isPDF = function() {
                return (attributes.tags.length > 0) && (attributes.tags.split(",").indexOf("pdf") >= 0);
            };

            this.isExternal = function() {
                return (attributes.location && attributes.location.length > 0);
            };

            this.isGGG = function() {
                return (attributes.location.length > 0) && (attributes.location.indexOf("ggg") >= 0);
            };

            this.isAttachment = function() {
                return (attributes.tags.length > 0) && (attributes.tags.split(",").indexOf("attachment") >= 0);
            };

            this.isQuery = function(tag) {
                var tmp = "vostan::query";
                if (tag) {
                    return (tag.indexOf(tmp) >= 0);
                } else {
                    return ((attributes.tags.length > 0) && (attributes.tags.indexOf(tmp) === 0));
                }
            };

            this.isPrevRoot = function() {
                return attributes.nodeID === _prevRoot;
            };

            this.attributes = function() {
                return attributes;
            };

            this.render = function(rootAttr) {
                var node = $('<node></node>').attr('id', attributes.nodeID);
                var view = $('<div class="view"></div>');
                var queryView = $('<div class="view queryView"></div>');
                var exp = $('<div class="exp"></div>');
                var tags = $('<div class="tags"></div>');
                var img = $('<div class="img"></div>');
                var file = $('<div class="file"></div>');
                var info = $('<div class="info"><div class="title-box"></div></div>');
                var par = $('<div class="par"><div class="wrap"></div></div>');
                var params = $('<div class="params"></div>');

                if (this.isAttachment()) {
                    if (! isExport()) {
                        file.append('<a href="' + _host + '/download/node/' +
                                attributes.nodeID + '" target="_blank"></a>');
                    }
                    view.append(exp)
                        .append(tags)
                        .append(file)
                        .append(info)
                        .append(par)
                        .append(params);
                    node.append(view);
                    this.$el = node;
                } else if (this.isVideo() || this.isPDF()) {
                    view.append(exp)
                        .append(tags)
                        .append(img)
                        .append(info)
                        .append(par)
                        .append(params);
                    node.append(view);
                    this.$el = node;
                } else if (this.isQuery()) {
                    queryView.append(tags)
                             .append(info)
                             .append(img)
                             .append(par)
                             .append(params)
                             .append('<div class="count"></div>');
                    node.append(queryView);
                    this.$el = node;
                } else {
                    view.append(exp)
                        .append(tags)
                        .append(img)
                        .append(info)
                        .append(par)
                        .append(params);
                    node.append(view);
                    this.$el = node;
                }
                if (attributes.leaf == true || isExport() && !getExported(attributes.nodeID)) {
                    this.$el.find(".exp").hide();
                }
                if (_root === attributes.nodeID) {//if node is root
                    this.$el.css({
                        'top': rootAttr.top + "px",
                        'left': rootAttr.left + "px",
                        'width': rootAttr.width + "px",
                        'height': rootAttr.height + "px"
                    });
                } else {
                    this.$el.css({
                        'top': (parseFloat(rootAttr.top) + parseFloat(rootAttr.height / 2)) + "px",
                        'left': (parseFloat(rootAttr.left) + parseFloat(rootAttr.width / 2)) + "px",
                        'width': 0,
                        'height': 0
                    });
                }
                if (_this.isQuery()) {
                    this.$el.find(".par .wrap").append("<div class='query-nodes'></div>");
                }
                this.setElAttributes(this.$el);
                if (attributes.nodeID !== 0) {
                    $("#vostanMap").append(this.$el);
                }
            };

            this.setQueryNodeData = function() {
                var queryNode = this.$el.find(".query-nodes").html("");
                var linkedNodeID = Map.getQueryRelatedNodes(
                                            _this.attributes().nodeID);
                if (linkedNodeID > 0) {
                    if (isExport()) {
                        var nodes = getExportedQueryData(linkedNodeID,
                                _this.attributes().nodeID);
                        _this.drawQueryResult(queryNode, nodes);
                    } else {
                        $.ajax({
                            type : 'POST',
                            url : _host + '/query/lang/' + _lang + '/root/' + linkedNodeID,
                            dataType : 'json',
                            data: attributes.tags,
                            success : function(data) {
                                if (isValid(data)) {
                                    _this.drawQueryResult(queryNode, data);
                                }
                            },
                            error : function(xhr) {
                                console.log("Error in query node", xhr);
                            }
                        });
                    }
                } else {
                    queryNode.append('<div style= "font-style: italic;"></div>')
                             .val(config.getMsg().alert && config.getMsg().alert.query_link || '');

                }
            };

            this.drawQueryResult = function(queryNode, data) {
                if (! isExport()) {
                    _this.$el.find('.count').text(
                            config.getMsg().btn.nodescount + data.nodes.length);
                }
                var scrollID = 0;
                for (var i = 0; i < data.nodes.length; i++) {
                    if (data.nodes[i].tags == "") {
                        data.nodes[i].tags = data.nodes[i].defaultTags;
                    }
                    if (data.nodes[i].title == "") {
                        data.nodes[i].title = data.nodes[i].defaultTitle;
                    }
                    var node = $('<node id ="' + data.nodes[i].nodeID + '" class = "query-node"></node>');
                    var view = $('<div class="view "></div>')
                               .append('<div class="exp"></div>');
                    var info = $('<div class="info info_query"></div>');
                    if (data.nodes[i].img != "" &&
                        data.nodes[i].tags.indexOf("pdf") == -1 &&
                        data.nodes[i].tags.indexOf("video") == -1 &&
                        data.nodes[i].tags.indexOf("attachment") == -1 &&
                        data.nodes[i].tags.indexOf("fileversion") == -1) {
                        var img = $('<div class="img img_qi"></div>')
                                  .css({
                                      'background': 'url(' + data.nodes[i].img + ')',
                                      'background-size': 'contain',
                                      'background-repeat': 'no-repeat',
                                      'background-position': 'center',
                                      'top': 10,
                                      'left': '5%',
                                      'width': '20%',
                                      'height': 40
                                  });
                        info.toggleClass('info_qi');
                        view.append(img);
                    }
                    view.append(info);
                    info.append('<div class="title-box">' + data.nodes[i].title + '</div>');
                    node.append(view);
                    queryNode.append(node);
                    if (parseInt(data.nodes[i].nodeID) == _history.prev()) {
                        node.addClass("node-proot");
                        scrollID = i;
                    } else if (parseInt(data.nodes[i].nodeID) == _history.next()) {
                        node.addClass("node-nroot");
                        scrollID = i;
                    }
                    node.css('height', "60px");
                    node.css('position', "relative");
                    _this.bindNode(node, data.nodes[i]);
                }
                if (scrollID) {
                    queryNode.scrollTop((queryNode.find("node")[0].offsetHeight + 10)*scrollID);
                }
            };

            this.bindNode = function(_node, attributes) {
                _node.bind("click", function(e) {
                    e.stopImmediatePropagation();
                    e.stopPropagation();
                    if (attributes.location && attributes.location.length > 0) {
                        var url = ((attributes.location.lastIndexOf("http") >=0) ? "" : "http://") + attributes.location;
                        window.open(url, '_blank');
                    } else {
                        var id = $(this).attr("id");
                        var nodeObj = new Node({
                            "nodeID" : id
                        });
                        if (!isEditMode()) {
                            Map.toggleRoot(nodeObj);
                        }
                    }
                });
            };

            this.setElAttributes = function(el, isCopy) {
                el.removeClass("node-n node-ni node-nit node-nt node-it node-i node-t node-i");
                el.addClass(getNodeClass());
                var tags = (attributes.tags && attributes.tags.replace("attachment", config.getMsg() && config.getMsg().btn.attachmenttag || "attachment")) || "";
                if (this.isQuery()) {
                    el.find(".tags:first").html("").append("<a><span class='tag-icon'></span><span class='tag-info'>" + tags + "</span></a>");
                } else {
                    el.find(".tags:first").html("").append("<span>" + tags + "</span>");
                }
                if (attributes.titleInclude) {
                    el.find(".title-box:first").html(attributes.title);
                    el.find(".info:first").css('width', attributes.titleWidth + "px");
                    el.find(".info:first").show();
                } else {
                    el.find(".title-box:first").html("");
                    el.find(".info:first").hide();
                }

                if (el.find(".title-box").height() !== 0 && !this.isQuery()) {
                    attributes.titleHeight = el.find(".title-box").height();
                }
                if (attributes.imgInclude && 0 != attributes.img) {
                    if (!this.isVideo() && ! this.isPDF()) {
                        el.find(".img").html("").append('<img src="' + attributes.img + '" />');
                    el.find(".img").show();
                    }
                } else {
                    el.find(".img").hide();
                }
                if (isCopy) {
                    el.css({
                        'width': attributes.width + "px",
                        'height': attributes.height + "px",
                        'left': attributes.left + "px",
                        'top': attributes.top + "px"
                    });
                }
                el.find(".img").css({
                    'width': attributes.imgWidth + "px",
                    'height': attributes.imgHeight + "px",
                    'left': attributes.imgLeft + "px",
                    'top': attributes.imgTop + "px"
                });
                el.find(".info").css({
                    'height': attributes.titleHeight + "px",
                    'left': attributes.titleLeft + "px",
                    'top': attributes.titleTop + "px"
                });
            };

            this.setElTextAttrs = function(el) {
                if (attributes.txtInclude) {
                    if (!_this.isQuery()) {
                        el.find(".par .wrap").html(attributes.txt);
                    }
                    el.find(".par").show();
                } else {
                    el.find(".par .wrap").html("");
                    el.find(".par").hide();
                }
                if (attributes.script) {
                    try {
                        eval(attributes.script);
                    } catch (e) {
                        console.log(e);
                    }
                }
                el.find(".par").css({
                    'width': attributes.txtWidth + "px",
                    'height': attributes.txtHeight + "px",
                    'left': attributes.txtLeft + "px",
                    'top': attributes.txtTop + "px"
                    });
                if(_this.isQuery()) {
                    _this.setQueryNodeData();
                }
                if (attributes.imgInclude && 0 != attributes.img && (this.isVideo() || this.isPDF())) {
                    var urls = attributes.img && attributes.img.split(',') || [];
                    if (urls.length > 0 ) {
                        if (this.isPDF()) {
                            var youtubeFrame = $('<iframe></iframe>');
                            youtubeFrame.attr({
                                "width": attributes.imgWidth - 20,
                                "height": attributes.imgHeight - 20,
                                "frameborder": 0,
                                "allowfullscreen": "true",
                                "src": urls[0]
                            });
                            youtubeFrame.css("margin", "10px");
                            el.find(".img").html("").append(youtubeFrame);
                        } else if (this.isYoutube(urls[0])) {
                            var youtubeFrame = $('<iframe></iframe>');
                            youtubeFrame.attr({
                                "width": attributes.imgWidth - 20,
                                "height": attributes.imgHeight - 20,
                                "frameborder": 0,
                                "allowfullscreen": "true",
                                "src": urls[0]
                            });
                            youtubeFrame.css("margin", "10px");
                            el.find(".img").html("").append(youtubeFrame);
                        } else {
                            var video = $('<video></video>');
                            video.attr({
                                "poster": (urls[1] || ""),
                                "controls": "true",
                                "src" : urls[0],
                                "type" : "video/mp4"
                            });
                            video.css({
                                "margin": "10px",
                                "width": attributes.imgWidth - 20,
                                "height": attributes.imgHeight - 20
                            });
                            el.find(".img").html("").append(video);
                        }
                    }
                    el.find(".img").show();
                }
            };

            this.checkForLinks = function() {
                if ((_linkAdds.length == 1 && _linkAdds[0] != _this.attributes().nodeID)) {
                    _linkAdds.push(_this.attributes().nodeID);
                    Map.linkNodes();
                    return true;
                }
                return false;
            };

            this.show = function() {
                var top, left, width, height;
                top = attributes.top;
                left = attributes.left;
                width = attributes.width;
                height = attributes.height;
                this.$el.animate({
                    top : top,
                    left : left,
                    height : height,
                    width : width
                }, _animationDelay, function() {
                    _this.setElTextAttrs(_this.$el);
                    _this.$el.find(".view:first").bind("click", function(e) {
                        var _self = this;
                        if (! handleNodeClick) {
                            handleNodeClick = true;
                            return;
                        }
                        e.stopImmediatePropagation();
                        e.stopPropagation();
                        if (!isEditMode()) {
                            if (_this.isExternal()) {
                                var url = ((attributes.location.lastIndexOf("http") >=0) ? "" : "http://") + attributes.location;
                                window.open(url, _this.isGGG() ? '_self' : '_blank');
                            } else if (!_this.isRoot() && !attributes.leaf) {
                                Map.toggleRoot(_this);
                            }
                        } else {
                            if (canEditNode(_this) && !_this.checkForLinks() && canEditRoot()) {
                                var pointer = {X : e.pageX, Y : e.pageY};
                                _this.nodeClick(_self, pointer);
                            }
                        }
                    });
                });
            };

            this.renderInEditMode = function() {
                this.render(attributes);
                this.show();
                this.toggleMode();
            };

            this.hide = function(attr) {
                this.$el.find(".par .wrap").html("");
                this.$el.find(".img").html("");
                if (this.isPrevRoot()) {
                    this.$el.removeClass("node-root");
                }
                var top = attr ? (parseFloat(attr.top) + parseFloat(attr.height) / 2) : 0;
                var left = attr ? (parseFloat(attr.left) + parseFloat(attr.width) / 2) : 0;
                var width = 0;
                var height = 0;
                this.$el.animate({
                    top : top,
                    left : left,
                    width : width,
                    height : height
                }, _animationDelay, function() {
                    _this.$el.remove();
                });
            };

            this.destroy = function() {
                if (this.$el) {
                    this.$el.remove();
                }
            };

            this.getCenter = function() {
                var pos = {};
                pos.x = parseFloat(attributes.left) + parseFloat(attributes.width) / 2 + $("#vostanMap")[0].offsetLeft;
                pos.y = parseFloat(attributes.top) + parseFloat(attributes.height) / 2;
                return pos;
            };

            this.toggleMode = function() {
                if (!this.$el) {
                    return;
                }
                if (isEditMode()) {
                    if (!canEditRoot()) {
                        return;
                    }
                    if (this.$el.find(".resizable-node").length === 0) {
                        this.$el.wrapInner("<div class='resizable-node'> </div>");
                    }
                    this.$el.css("overflow", "visible");
                    $("canvas").click(function() {
                        $("#editControls, .link-edits").hide();
                        _this.$el.find(".ui-resizable-handle").css("display", "none");
                        _this.$el.find(".img, .info, .par, .view").css("border", "0px");
                        clickedStep = 0;
                    });
                    this.$el.draggable({
                        scroll : false,
                        start : function() {
                            _dragging = true;
                            $('.inline-input').closest('node').find('.info').show();
                            $('.inline-input').remove();
                            destroyDraggablesResizables();
                            $(this).find(".ui-resizable-handle").css("display", "block");
                            $("body").append('<div class="h-line top"></div>');
                            $("body").append('<div class="h-line bottom"></div>');
                            $("body").append('<div class="v-line left"></div>');
                            $("body").append('<div class="v-line right"></div>');
                        },
                        drag : function(event, ui) {
                                   attributes.top = ui.position.top;
                                   attributes.left = ui.position.left;
                                   Map.redrawLinks(_this.nodeID());
                                   var offset = $("#vostanApp").offset();
                                   $(".v-line.left").css("left", ui.position.left + offset.left);
                                   $(".v-line.right").css("left", ui.position.left + offset.left + attributes.width + 3);
                                   $(".h-line.top").css("top", ui.position.top + offset.top);
                                   $(".h-line.bottom").css("top", ui.position.top + offset.top + attributes.height + 3);
                                   $(this).find('.view').find('.params').appendTo($(this));
                                   $(this).find(".params").text("x:" + this.offsetLeft + " y:" + this.offsetTop);
                                   $(this).find(".params").css("display", "block");
                        },
                        stop : function() {
                                    $(this).find(".params").css("display", "none");
                                    $(".v-line").remove();
                                    $(".h-line").remove();
                                    EditControls.setNode(_this);
                                    handleNodeClick = false;
                                    _dragging = false;
                                    clickedStep = 0;
                                    modified = true;
                        }
                    });

                    this.$el.resizable({
                        start : function() {
                                    destroyDraggablesResizables(true);
                                    $("body").append('<div class="h-line top"></div>');
                                    $("body").append('<div class="h-line bottom"></div>');
                                    $("body").append('<div class="v-line left"></div>');
                                    $("body").append('<div class="v-line right"></div>');
                                },
                        resize : function(event, ui) {
                                     $("#editControls,.link-edits").hide();
                                     $(this).closest('node').find('.params').appendTo($(this));
                                     $(this).find(".params").text("w:" + $(this).outerWidth() + " h:" + $(this).outerHeight());
                                     $(this).find(".params").css("display", "block");
                                     attributes.width = ui.size.width;
                                     attributes.height = ui.size.height;
                                     attributes.top = ui.position.top;
                                     attributes.left = ui.position.left;
                                     var offset = $("#vostanApp").offset();
                                     $(".v-line.left").css("left", ui.position.left + offset.left);
                                     $(".v-line.right").css("left", ui.position.left + offset.left + ui.size.width + 3);
                                     $(".h-line.top").css("top", ui.position.top + offset.top);
                                     $(".h-line.bottom").css("top", ui.position.top + offset.top + ui.size.height + 3);
                                     Map.redrawLinks(_this.nodeID());
                                 },
                        handles : "all",
                        stop : function() {
                            $(this).find(".params").css("display", "none");
                            $(".v-line").remove();
                            $(".h-line").remove();
                            EditControls.setNode(_this);
                            modified = true;
                            clickedStep = 0;
                        }
                    });
                    $(".ui-resizable-handle").css("display", "none");
                } else {
                    $(".title-box").attr('contenteditable', false);
                    $(".img, .info, .par").css('border', '0px');
                    $('.par').css("overflow", "auto");
                    this.$el.find(".img, .info, .par").each(function(key, item) {
                        $(item).css("z-index", "auto");
                        try {
                            $(item).resizable("destroy");
                            $(item).draggable("destroy");
                        } catch (e) {
                        }
                    });
                    try {
                        this.$el.draggable("destroy");
                        this.$el.resizable("destroy");
                    } catch (e) {
                    }
                    $(".resizable-element").children().unwrap();
                    $(".resizable-node").children().unwrap();
                    this.$el.css("overflow", "hidden");
                    this.$el.find(".img, .info, .par").css("overflow", "hidden");
                    updateInfo();
                }
            };

            this.save = function() {
                this.appendNewNode();
            };

            this.call = function() {
              var videoElement = document.getElementById("localVideo");
              if(!isEditMode() && videoElement != null){
                createOffer();
              }
            };

            this.joinLeaveRoom = function() {
                if(!isEditMode()) {
                    if($("#" + attributes.nodeID + " .info .title-box").html() === "Join Room" ||
                        $("#" + attributes.nodeID + " .info .title-box").html() === "Re-join Room") {
                        var person = prompt("Please enter your name");
                        if(person != null) {
                            if(person != '') {
                                $("#" + _root).find(".par .wrap p").append(person).css("color", "green").addClass("localName");
                                $("#" + _root).find(".par .wrap")
                                              .append("<video id='localVideo' autoplay></video><video id='remoteVideo' autoplay></video>");
                                $("#" + attributes.nodeID + " .info .title-box")
                                    .html("Leave Room")
                                    .css("color", "red");
                                $("#" + attributes.nodeID).css("border", "1px solid red");
                                joinRoom();
                            }
                        }
                    } else {
                        $("#" + _root).find(".par .wrap p").html("");
                        $("#" + attributes.nodeID + " .info .title-box")
                            .html("Re-join Room")
                            .css("color", "green");
                        $("#" + attributes.nodeID).css("border", "1px solid green");
                        leaveRoom();
                    }
                }
            };

            this.pauseResumeVideo = function() {
                var videoElement = document.getElementById("localVideo");
                if(!isEditMode() && videoElement != null){
                    if($("#" + attributes.nodeID + " .info .title-box").html() === "Pause Video") {
                        $("#" + attributes.nodeID + " .info .title-box")
                            .html("Resume Video")
                            .css("color", "red");
                        $("#" + attributes.nodeID).css("border", "1px solid red");
                        pauseVideo();
                    } else {
                        $("#" + attributes.nodeID + " .info .title-box")
                            .html("Pause Video")
                            .css("color", "green");
                        $("#" + attributes.nodeID).css("border", "1px solid green");
                        resumeVideo();
                    }
                }
            };

            this.pauseResume = function() {
                var videoElement = document.getElementById("localVideo");
                if(!isEditMode() && videoElement != null) {
                    if($("#" + attributes.nodeID + " .info .title-box").html() === "Pause") {
                        $("#" + attributes.nodeID + " .info .title-box")
                            .html("Resume")
                            .css("color", "red");
                        $("#" + attributes.nodeID).css("border", "1px solid red");
                        pause();
                    } else {
                        $("#" + attributes.nodeID + " .info .title-box")
                            .html("Pause")
                            .css("color", "green");
                        $("#" + attributes.nodeID).css("border", "1px solid green");
                        resume();
                    }
                }
            };

            this.muteUnmute = function() {
                var videoElement = document.getElementById("localVideo");
                if(!isEditMode() && videoElement != null) {
                    if($("#" + attributes.nodeID + " .info .title-box").html() === "Mute") {
                        $("#" + attributes.nodeID + " .info .title-box")
                            .html("Unmute")
                            .css("color", "red");
                        $("#" + attributes.nodeID).css("border", "1px solid red");
                        mute();
                    } else {
                        $("#" + attributes.nodeID + " .info .title-box")
                            .html("Mute")
                            .css("color", "green");
                        $("#" + attributes.nodeID).css("border", "1px solid green");
                        unMute();
                    }
                }
            };

            this.lockUnlockRoom = function() {
                var videoElement = document.getElementById("localVideo");
                if(!isEditMode() && videoElement != null) {
                    if($("#" + attributes.nodeID + " .info .title-box").html() == "Lock Room") {
                        $("#" + attributes.nodeID + " .info .title-box")
                            .html("Unlock Room")
                            .css("color", "red");
                        $("#" + attributes.nodeID + " .tags span")
                            .html("locked");
                        attributes.tags = "locked";
                        $("#" + attributes.nodeID).css("border", "1px solid red");
                    }else {
                        $("#" + attributes.nodeID + " .info .title-box")
                            .html("Lock Room")
                            .css("color", "green");
                        $("#" + attributes.nodeID + " .tags span")
                            .html("unlocked");
                        attributes.tags = "unlocked";
                        $("#" + attributes.nodeID).css("border", "1px solid green");
                    }
                }
            };
        };

        /* End Node object */

        /**** Start Link object */

        var Link = function(obj) {
            var _this = this;
            var link_modified = false;
            var attributes = {
                nodeID : obj.nodeID ? parseInt(obj.nodeID) : 0,
                linkedNodeID : obj.linkedNodeID ? parseInt(obj.linkedNodeID) : 0,
                linkTags : obj.linkTags ? obj.linkTags : "",
            };

            var getUpdateData = function() {
                return JSON.stringify({
                    "nodeID" : attributes.nodeID,
                    "linkedNodeID" : attributes.linkedNodeID,
                    "linkTags" : attributes.linkTags
                });
            };

            var updateInfo = function() {
                if (!link_modified) {
                    return;
                }
                $.ajax({
                    type : 'POST',
                    url : _host + '/update/link/root/' + _root + '/lang/' +
                            _lang + '?t=' + Date.now(),
                    dataType : 'json',
                    contentType : 'application/json',
                    data : getUpdateData(),
                    async : false,
                    success : function(data) {
                        isValid(data);
                    },
                    error : function(xhr) {
                        console.log("Error in Update Link", xhr);
                    },
                    complete : function(xhr) {
                    }
                });
            };

            var appendNewLink = function() {
                $.ajax({
                    type : 'POST',
                    url : _host + '/add/link/root/' + _root + '/lang/' +
                            _lang + '?t=' + Date.now(),
                    dataType : 'json',
                    contentType : 'application/json',
                    data : getUpdateData(),
                    success : function(data) {
                    },
                    error : function(xhr) {
                    },
                    complete : function(xhr) {
                    }
                });
            };

            var deleteLink = function() {
                $.ajax({
                    type : 'POST',
                    url : _host + '/delete/link/root/' + _root,
                    dataType : 'json',
                    contentType : 'application/json',
                    data : getUpdateData(),
                    success : function(data) {
                    },
                    error : function(xhr) {
                    },
                    complete : function(xhr) {
                        Map.removeLinks(attributes.nodeID, attributes.linkedNodeID);
                    }
                });
            };

            this.nodeID = function() {
                return attributes.nodeID;
            };

            this.linkedNodeID = function() {
                return attributes.linkedNodeID;
            };

            this.isRelated = function(nID) {
                return attributes.nodeID === nID || attributes.linkedNodeID === nID;
            };

            this.attributes = function() {
                return attributes;
            };

            this.getPointsWithArrows = function(pointsArray) {
                var headlen = 6;
                var angle = Math.atan2(pointsArray[3] - pointsArray[1], pointsArray[2] - pointsArray[0]);
                var points = [
                    pointsArray[0], pointsArray[1],
                    pointsArray[2], pointsArray[3],
                    pointsArray[2] - headlen * Math.cos(angle - Math.PI / 6),
                    pointsArray[3] - headlen * Math.sin(angle - Math.PI / 6),
                    pointsArray[2] - headlen * Math.cos(angle + Math.PI / 6),
                    pointsArray[3] - headlen * Math.sin(angle + Math.PI / 6),
                    pointsArray[2], pointsArray[3]
                ];
                return points;
            };

            this.render = function(layer, pointsArray) {
                var group = new Kinetic.Group({});
                var line = new Kinetic.Line({
                    points : _this.getPointsWithArrows(pointsArray),
                    closed: true,
                    fill: _linkColor,
                    stroke : _linkColor,
                    strokeWidth : _linkWidth
                });

                var circle = new Kinetic.Circle({
                    x : (pointsArray[0] + pointsArray[2]) / 2,
                    y : (pointsArray[1] + pointsArray[3]) / 2,
                    radius : 10,
                    stroke : _linkColor,
                    strokeWidth : 2,
                    opacity : 0
                });

                var lineWidth = Math.sqrt(Math.pow(pointsArray[2] - pointsArray[0], 2) + Math.pow(pointsArray[3] - pointsArray[1], 2)).toFixed(0);
                var TextCoordinates = this.setTextPosition(pointsArray);
                var corner = TextCoordinates.corner;
                var text = new Kinetic.Text({
                    x : TextCoordinates.textX,
                    y : TextCoordinates.textY,
                    width : lineWidth,
                    align : 'center',
                    text : attributes.linkTags || "",
                    fill : _linkColor,
                    fontSize : '15'
                });
                text.rotate(corner);
                _circles.push(circle);
                group.add(line);
                group.add(text);
                group.add(circle);
                layer.add(group);

                this.addCircleEvent(circle, line);

                this.$el = group;
            };

            this.redraw = function(stage, layer, pointsArray) {
                if (this.$el) {
                    this.$el.destroy();
                }
                var group = new Kinetic.Group({});
                var line = new Kinetic.Line({
                    points : _this.getPointsWithArrows(pointsArray),
                    closed: true,
                    fill: _linkColor,
                    stroke : _linkColor,
                    strokeWidth : _linkWidth
                });
                var circle = new Kinetic.Circle({
                    x : (pointsArray[0] + pointsArray[2]) / 2,
                    y : (pointsArray[1] + pointsArray[3]) / 2,
                    radius : 10,
                    stroke : _linkColor,
                    strokeWidth : 2,
                    opacity : 0
                });
                if (isEditMode()) {
                    circle.opacity(1);
                }
                var lineWidth = Math.sqrt(Math.pow(pointsArray[2] - pointsArray[0], 2) + Math.pow(pointsArray[3] - pointsArray[1], 2)).toFixed(0);
                var TextCoordinates = this.setTextPosition(pointsArray);
                var corner = TextCoordinates.corner;
                var text = new Kinetic.Text({
                    x : TextCoordinates.textX,
                    y : TextCoordinates.textY,
                    width : lineWidth,
                    align : 'center',
                    text : attributes.linkTags || "",
                    fill : _linkColor,
                    fontSize : '15'
                });
                text.rotate(corner);

                _circles.push(circle);

                group.add(line);
                group.add(text);
                group.add(circle);
                layer.add(group);

                this.$el = group;
                this.addCircleEvent(circle, line);
                _stage.draw();
            };

            this.destroyLink = function() {
                var x = confirm(config.getMsg().alert.dlt_link);
                if (x === true) {
                    this.destroy();
                    deleteLink();
                    _stage.draw();
                } else {
                    return;
                }
            };

            this.setTextPosition = function(pointsArray) {
                if (pointsArray[0] < pointsArray[2]) {
                    if (pointsArray[1] > pointsArray[3]) {
                        textX = pointsArray[0];
                        textY = pointsArray[1];
                        corner = 360 - (Math.atan((pointsArray[1] - pointsArray[3]) / (pointsArray[2] - pointsArray[0])) * (180 / Math.PI));
                    } else {
                        textX = pointsArray[0];
                        textY = pointsArray[1];
                        corner = Math.atan((pointsArray[3] - pointsArray[1]) / (pointsArray[2] - pointsArray[0])) * (180 / Math.PI);
                    }
                } else {
                    if (pointsArray[1] > pointsArray[3]) {
                        textX = pointsArray[2];
                        textY = pointsArray[3];
                        corner = Math.atan((pointsArray[1] - pointsArray[3]) / (pointsArray[0] - pointsArray[2])) * (180 / Math.PI);
                    } else {
                        textX = pointsArray[2];
                        textY = pointsArray[3];
                        corner = 360 - (Math.atan((pointsArray[3] - pointsArray[1]) / (pointsArray[0] - pointsArray[2])) * (180 / Math.PI));
                    }
                }
                return {
                    textX : textX,
                    textY : textY,
                    corner : corner
                };
            };

            this.addCircleEvent = function(circle, line) {
                circle.on("touchstart mousedown", function(event) {
                    if (!isEditMode() || event.which == 3) {
                        event.preventDefault();
                        return;
                    }
                    _touchTimer = setTimeout(function() {
                        clearTouchTimer();
                        $(".img, .info, .par").css("border", "none");
                        $(".ui-resizable-handle").css("display", "none");
                        $("#editControls").hide();
                        $(".link-edits").hide();
                        circle.stroke('#800000');
                        _stage.draw();
                        _this.destroyLink();
                        circle.stroke(_linkColor);
                        _stage.draw();
                    }, 800);
                });
                circle.on("click touchstart", function(event) {
                    if (!isEditMode()) {
                        return;
                    }
                    _touchTimer = setTimeout(function() {
                        clearTouchTimer();
                        $("#editControls").hide();
                        $(".ui-resizable-handle").css("display", "none");
                        $(".img, .info, .par").css("border", "none");
                        var tagAttrVal = "";
                        var extraTag = "";
                        var tmpVal = attributes.linkTags.split(',');
                        var tagVal = "";
                        if (tmpVal != "") {
                            $.each(tmpVal, function(i, l) {
                                tagVal += '<li class="tagit-choice"><span class="tagit-label">' + $.trim(l) + '</span><a class="tagit-close"><span class="text-icon">×</span></a></li>';
                            });
                        }
                        this.$elEdit = $('<node class="link-edits"></node>');
                        var linkTagInput = $('<input type="text" class="link_edit-tag" id="inputSingleField" value=""/>');
                        var tagitNew = $('<li class="tagit-new"></li>');
                        var singleFieldTags = $('<ul class="singleFieldTags">' + tagVal + '</ul>');
                        var linkEdits = $('<div class="link-edits">' + config.getMsg().btn.tags + '</div>')
                        tagitNew.append(linkTagInput);
                        singleFieldTags.append(tagitNew);
                        linkEdits.append('<br>').append(singleFieldTags);
                        this.$elEdit.append(linkEdits);
                        this.$elEdit.find('.edit-tags').val(attributes.linkTags);
                        this.$elEdit.css({
                            "top" : circle.y() + 20 + "px",
                            "left" : circle.x() - 75 + "px"
                        });
                        $("#vostanEditStage").append(this.$elEdit);
                        linkTagInput.focus();
                        this.$elEdit.find(".link_edit-tag").autocomplete({
                            source : function(request, callback) {
                                         var searchParam = request.term;
                                         if ($.trim(searchParam).slice(-1) == "," && $.trim(searchParam) != ",") {
                                             var item = '<li class="tagit-choice"><span class="tagit-label">' + $.trim(searchParam).slice(0, -1) + '</span><a class="tagit-close"><span class="text-icon">×</span></a></li>';
                                             $('.tagit-new').before($(item));
                                             $('.tagit-new input').val('');
                                             var tagAttrVal = "";
                                             $.each(currentTagField.find('.tagit-choice'), function() {
                                                 tagAttrVal += $(this).find('.tagit-label').text() + ",";
                                             });
                                             attributes.linkTags = tagAttrVal.slice(0, -1);
                                             link_modified = true;
                                             $(".ui-front").hide();
                                             Map.redrawLinks(_this.nodeID());
                                         } else {
                                             $.ajax({
                                                 type : 'GET',
                                                 url : _host + '/tags/links/lang/' + _lang + '?term=' + searchParam,
                                                 dataType : 'json',
                                                 success : function(data) {
                                                     callback($.map(data, function(item) {
                                                         return {
                                                             label : item.tag
                                                         };
                                                     }));
                                                 },
                                                 error : function(xhr) {
                                                     console.log("Error in /tags", xhr);
                                                 }
                                             });
                                         }
                                     },
                                   minLength : 1,
                                   select : function(event, ui) {
                                       var item = '<li class="tagit-choice"><span class="tagit-label">' + $.trim(ui.item.label) + '</span><a class="tagit-close"><span class="text-icon">×</span></a></li>';
                                       $('.tagit-new').before($(item));
                                       $('.tagit-new input').val('');
                                       var tagAttrVal = "";
                                       $.each(currentTagField.find('.tagit-choice'), function() {
                                           tagAttrVal += $(this).find('.tagit-label').text() + ",";
                                       });
                                       attributes.linkTags = tagAttrVal.slice(0, -1);
                                       Map.redrawLinks(attributes.nodeID);
                                       link_modified = true;
                                       return false;
                                   },
                                   change : function(event, ui) {
                                                var tagAttrVal = "";
                                                $.each(currentTagField.find('.tagit-choice'), function() {
                                                    tagAttrVal += $(this).find('.tagit-label').text() + ",";
                                                });
                                                extraTag = currentTagField.find("#inputSingleField").val();
                                                tagAttrVal += extraTag + ",";
                                                attributes.linkTags = tagAttrVal.slice(0, -1);
                                                link_modified = true;
                                                $(".ui-front").hide();
                                            }
                        });
                        var currentTagField = this.$elEdit;
                        // bind click to tag item close element to remove tag item
                        this.$elEdit.find('.link-edits').on('click', '.tagit-close', function(e) {
                            $(this).parent().fadeOut("fast", function() {
                                $(this).remove();
                                var tagAttrVal = "";
                                $.each(currentTagField.find('.tagit-choice'), function() {
                                    tagAttrVal += $(this).find('.tagit-label').text() + ",";
                                });
                                attributes.linkTags = tagAttrVal.slice(0, -1);
                                link_modified = true;
                                Map.redrawLinks(attributes.nodeID);
                            });
                        });
                        $("canvas").on("click", function() {
                            if (isEditMode()) {
                                var tagAttrVal = "";
                                extraTag = attributes.linkTags;
                                $.each(currentTagField.find('.tagit-choice'), function() {
                                    tagAttrVal += $(this).find('.tagit-label').text() + ",";
                                });
                                if(currentTagField.find("#inputSingleField").length != 0){
                                    extraTag = currentTagField.find("#inputSingleField").val();
                                }
                                if (extraTag !== "") {
                                    tagAttrVal += extraTag + ",";
                                }
                                attributes.linkTags = tagAttrVal.slice(0, -1);
                                Map.redrawLinks(attributes.nodeID);
                                $("#vostanEditStage").html("");
                                link_modified = true;
                            }
                            $(".ui-front").hide();
                            currentTagField.css('display', "none");
                        });
                    }, 30);
                });
                circle.on("touchend mouseup", function() {
                    clearTouchTimer();
                });
            };

            this.show = function(layer) {
            };

            this.destroy = function(stage, layer) {
                if (this.$el) {
                    this.$el.destroy();
                }
                _stage.draw();
            };

            this.toggleMode = function() {
                if (!isEditMode()) {
                    updateInfo();
                }
            };
            this.save = function() {
                appendNewLink();
            };
        };

        /* End Link object */

        /**** Start Nodes collection object */

        var MapController = function() {
            window.addEventListener("hashchange", function(e) {
                e.stopImmediatePropagation();
                var newID = (e.newURL.lastIndexOf("#") == -1) ? false : e.newURL.substring(e.newURL.lastIndexOf("#") + 1, e.newURL.length);
                if (!newID) {
                    newID = _prevRoot;
                }
                if (newID == _root) {
                    return;
                } else {
                    var tmp = new Node({
                        "nodeID" : newID
                    });
                    _history.navigate(newID);
                    Map.toggleRoot(nodeByID(newID) || tmp);
                }
            }, false);
            var _nodes = [];
            var _links = [];
            var animationarray = {};
            var nodes = [];
            var links = [];
            var stage = null;
            var layer = null;
            var rootAttributes = null;
            var newRootAttributes = null;
            var nodeClicked = null;

            var nodeByID = function(id) {
                for (var i in nodes) {
                    if (nodes[i].nodeID() === parseInt(id)) {
                        return nodes[i];
                    }
                }
                return null;
            };

            this.nodeById = function(id) {
                var node = nodeByID(id);
                return node;
            };

            var linkByID = function(id1, id2) {
                for (var i in links) {
                    if (links[i].isRelated(id1) && links[i].isRelated(id2)) {
                        return links[i];
                    }
                }
                return null;
            };

            this.linkByID = function(id1, id2) {
                return linkByID(id1, id2);
            };

            this.getQueryRelatedNodes = function(queryNodeID) {
                var counter = 0;
                var linkedNodeID;
                for (var i = 0; i < _links.length; ++i) {
                    if (queryNodeID == _links[i].linkedNodeID) {
                        linkedNodeID = _links[i].nodeID;
                        counter++;
                    }
                    if (queryNodeID == _links[i].nodeID) {
                        linkedNodeID = _links[i].linkedNodeID;
                        counter++;
                    }
                }
                if (counter == 1) {
                    return linkedNodeID;
                }
                return -1;
            };


            var createNode = function(item) {
                var newNode = new Node(item);
                nodes.push(newNode);
                return newNode;
            };

            var createLink = function(item) {
                var newLink = new Link(item);
                links.push(newLink);
                return newLink;
            };

            var createAnimationArray = function() {
                animationarray = {};
                for (var i in nodes) {
                    animationarray[nodes[i].nodeID()] = {};
                    animationarray[nodes[i].nodeID()].oldAttr = nodes[i].attributes();
                }
                for (var j = 0; j < _nodes.length; j++) {
                    var nid = parseInt(_nodes[j].nodeID);
                    if (!animationarray[nid]) {
                        animationarray[nid] = {};
                    }
                    animationarray[nid].newAttr = new Node(_nodes[j]).attributes();
                }
            };

            var hideNodes = function() {
                // TODO: Animation - change position instead of redrawing the existing nodes which should be shown in the new layout.
                var attr = null;
                var newAttr = null;
                for (var i = 0; i < _nodes.length; i++) {
                    if (parseInt(_nodes[i].nodeID) === _prevRoot) {
                        attr = _nodes[i];
                    } else if (parseInt(_nodes[i].nodeID) === _root) {
                        newAttr = _nodes[i];
                    }
                }
                for (var j in nodes) {
                    var rootAttr = animationarray[nodes[j].nodeID()].newAttr || attr || newAttr;
                    nodes[j].hide(rootAttr);
                }
            };
            var setRoot = function() {
                for (var i = 0; i < _nodes.length; i++) {
                    if (parseInt(_nodes[i].nodeID) === _root) {
                        newRootAttributes = _nodes[i];
                    }
                }
            };
            var resetNodes = function() {
                nodes = [];
                rootAttributes = $.extend({}, newRootAttributes);
            };
            var createNodes = function() {
                for (var i = 0; i < _nodes.length; i++) {
                    createNode(_nodes[i]);
                }
            };
            var renderNodes = function() {
                var attr = nodeClicked ? nodeClicked.attributes() : rootAttributes;
                var rootAttr = {};
                for (var i in nodes) {
                    rootAttr = animationarray[nodes[i].nodeID()].oldAttr || attr;
                    nodes[i].render(rootAttr);
                }
                if (nodeClicked) {
                    nodeClicked.destroy();
                    nodeClicked = null;
                }
            };
            var showNodes = function() {
                for (var i in nodes) {
                    nodes[i].show();
                }
            };

            var initTheStage = function() {
                stage = new Kinetic.Stage({
                    container : 'vostanStage',
                      width : $("#vostanContainer")[0].offsetWidth,
                      height : $("#vostanContainer")[0].offsetHeight
                });
                _stage = stage;
            };

            var createLinks = function() {
                links = [];
                for (var i in _links) {
                    if (! _links[i].linkTags || _links[i].linkTags.length === 0) {
                        _links[i].linkTags = _links[i].defaultLinkTags;
                    }
                    createLink(_links[i]);
                }
            };

            var getPointsAttributes = function(id1, id2) {
                var top1 = nodeByID(id1).attributes().top;
                //top of node1
                var left1 = nodeByID(id1).attributes().left;
                //left of node1
                var top2 = nodeByID(id2).attributes().top;
                //top of node2
                var left2 = nodeByID(id2).attributes().left;
                //left of node2
                var width1 = nodeByID(id1).attributes().width;
                //width of node1
                var width2 = nodeByID(id2).attributes().width;
                //width of node2
                var height1 = nodeByID(id1).attributes().height;
                //height of node1
                var height2 = nodeByID(id2).attributes().height;
                //height of node2
                var center1 = nodeByID(id1).getCenter();
                //center of node1
                var center2 = nodeByID(id2).getCenter();
                //center of node2

                var getLineBK = function(x1, y1, x2, y2) {//sets line's 2 points and gets line's b & k (y=kx+b)
                    var b = (y2 * x1 - y1 * x2) / (x1 - x2);
                    if (x1 !== x2) {
                        var k = (y1 - y2) / (x1 - x2);
                    }
                    return {
                        b : b,
                        k : k
                    };
                };

                var linkAndNodeCrossingPoints = function(b0, k0, b1, k1, b2, k2, center, left, width, top, height) {//set node's diagonal's and likn's b&k,other node's center,top,left,width & height and get crossing point coordinates of link & node.
                    /*I*/
                    if ((center.y < (k1 * center.x + b1)) && (center.y <= (k2 * center.x + b2))) {
                        var x;
                        var y = top;
                        if ( typeof k0 == 'undefined') {
                            x = left + width / 2;
                        } else {
                            x = (y - b0) / k0;
                        }
                        /*II*/
                    } else if ((center.y < (k1 * center.x + b1)) && (center.y >= (k2 * center.x + b2))) {
                        var x = left + width + 2;
                        var y = x * k0 + b0;
                        /*III*/
                    } else if ((center.y >= (k1 * center.x + b1)) && (center.y > (k2 * center.x + b2))) {
                        var x;
                        var y = top + height + 2;
                        if ( typeof k0 == 'undefined') {
                            x = left + width / 2;
                        } else {
                            x = (y - b0) / k0;
                        }
                        /*IV*/
                    } else if ((center.y >= (k1 * center.x + b1)) && (center.y < (k2 * center.x + b2))) {
                        var x = left;
                        var y = x * k0 + b0;
                    }
                    return {
                        x : x,
                        y : y
                    };
                };

                //For link
                var b0 = getLineBK(center1.x, center1.y, center2.x, center2.y).b;
                var k0 = getLineBK(center1.x, center1.y, center2.x, center2.y).k;

                ///For node1's 1st diagonal
                var b11 = getLineBK(left1, top1, center1.x, center1.y).b;
                var k11 = getLineBK(left1, top1, center1.x, center1.y).k;

                ////For node1's 2nd diagonal
                var b12 = getLineBK(center1.x, center1.y, left1 + width1, top1).b;
                ///!!!
                var k12 = getLineBK(center1.x, center1.y, left1 + width1, top1).k;

                ///For node2's 1st diagonal
                var b21 = getLineBK(left2, top2, center2.x, center2.y).b;
                var k21 = getLineBK(left2, top2, center2.x, center2.y).k;

                ////For node2's 2nd diagonal
                var b22 = getLineBK(center2.x, center2.y, left2 + width2, top2).b;
                //!!!
                var k22 = getLineBK(center2.x, center2.y, left2 + width2, top2).k;

                var link1stPoint = linkAndNodeCrossingPoints(b0, k0, b11, k11, b12, k12, center2, left1, width1, top1, height1);
                var link2ndPoint = linkAndNodeCrossingPoints(b0, k0, b21, k21, b22, k22, center1, left2, width2, top2, height2);

                return [link1stPoint.x, link1stPoint.y, link2ndPoint.x, link2ndPoint.y];
            };

            var renderLinks = function() {
                layer = new Kinetic.Layer();
                layer.setOpacity(1);

                for (var i in links) {
                    if (nodeByID(links[i].nodeID()) && nodeByID(links[i].linkedNodeID())) {
                        links[i].render(layer, getPointsAttributes(links[i].nodeID(), links[i].linkedNodeID()));
                    }
                }
                stage.removeChildren();
                stage.add(layer);
            };

            var removeLinks = function() {
                if (layer) {
                    layer.destroy();
                }
            };

            this.redrawLinks = function(nID) {
                for (var i in links) {
                    if (links[i].isRelated(nID) &&
                            nodeByID(links[i].nodeID()) &&
                            nodeByID(links[i].linkedNodeID())) {
                        links[i].redraw(stage, layer, getPointsAttributes(links[i].nodeID(), links[i].linkedNodeID()));
                    }
                }
            };

            this.destroyLinks = function(nID) {
                for (var i in links) {
                    if (links[i].isRelated(nID)) {
                        links[i].destroy(stage, layer);
                    }
                }
            };

            this.removeLinks = function(nID, lnID) {
                for (var i in links) {
                    if (links[i].isRelated(nID) && (!lnID || links[i].isRelated(lnID))) {
                        delete links[i];
                    }
                }
            };

            this.showTheMap = function(mapitems) {
                if (!stage) {
                    initTheStage();
                }
                _nodes = mapitems.nodes;
                _links = mapitems.links ? mapitems.links : [];
                createAnimationArray();
                removeLinks();
                hideNodes();
                setRoot();
                setDelayValue();
                resetNodes();
                createNodes();
                renderNodes();
                showNodes();
                //Links
                setTimeout(function() {
                    createLinks();
                    renderLinks();
                    $("#viewTab").scrollTop(0);
                }, _animationDelay * 0.75);
            };

            this.toggleRoot = function(item) {
                if (isExport() && !getExported(item.nodeID())) {
                    return;
                }
                nodeClicked = item;
                loadTheMap(item);
            };

            this.toggleMode = function() {
                for (var i in nodes) {
                    nodes[i].toggleMode();
                }
                for (var j in links) {
                    links[j].toggleMode();
                }
                if (!isEditMode()) {
                    $("#editControls,.link-edits").hide();
                }
            };

            this.appendNewNode = function(item, mode) {
                if (item && nodeByID(item.nodeID)) {
                    return;
                }

                var newNode = createNode(item);
                newNode.attributes().titleInclude = true;
                if (mode == "append") {
                    newNode.renderInEditMode();
                    newNode.save();
                } else if (mode == "add") {
                    newNode.attributes().user = "editor";
                    newNode.attributes().users = nodeByID(_root).attributes().users;
                    newNode.attributes().viewers = nodeByID(_root).attributes().viewers;
                    newNode.renderInEditMode();
                    newNode.addNewNode();
                } else if (mode == "show") {
                    newNode.attributes().user = "editor";
                    newNode.attributes().users = nodeByID(_root).attributes().users;
                    newNode.attributes().viewers = nodeByID(_root).attributes().viewers;
                    newNode.renderInEditMode();
                } else {
                    newNode.renderInEditMode();
                }
            };

            this.appendNewLink = function(item, mode) {
                if (item && linkByID(parseInt(item.nodeID), parseInt(item.linkedNodeID))) {
                    return;
                }
                var newLink = createLink(item);
                this.redrawLinks(newLink.linkedNodeID());
                if (mode == "add") {
                    newLink.save();
                }
            };

            this.removeNode = function(node) {
                node.destroy();
                for (var i in nodes) {
                    if (nodes[i].nodeID() == node.nodeID()) {
                        delete nodes[i];
                    }
                }
                this.destroyLinks(node.nodeID());
            };

            this.collapseNode = function(node) {
                for (var i in links) {
                    if (links[i].isRelated(node.nodeID()) && (node.nodeID() === _root || !links[i].isRelated(_root))) {
                        var _nodeID = links[i].nodeID() == node.nodeID() ? links[i].linkedNodeID() : links[i].nodeID();
                        var _node = nodeByID(_nodeID);
                        this.removeNode(_node);
                        _node.hideFromPage();
                    }
                }
            };

            this.linkNodes = function() {
                if (_linkAdds.length === 2) {
                    if (!linkByID(_linkAdds[0], _linkAdds[1])) {
                        var linkAttr = {};
                        linkAttr.nodeID = _linkAdds[0];
                        linkAttr.linkedNodeID = _linkAdds[1];
                        var newLink = createLink(linkAttr);
                        this.redrawLinks(newLink.linkedNodeID());
                        newLink.save();
                    }
                    _linkAdds = [];
                    $("body").toggleClass("connect");
                }
            };

            this.updateNodesClickedStep = function (besidesNodeID) {
                for (var i = 0; i < nodes.length; i++) {
                    if (nodes[i] && nodes[i].nodeID() != besidesNodeID) {
                        nodes[i].changeClickedStep(0);
                    }
                }
            };
        };
        var EditControls = new EditController();
        var Map = new MapController();

        initTheMap();
    };

    window.Vostan = VostanController;
})();
