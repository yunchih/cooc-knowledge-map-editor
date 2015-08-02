(function() {

    var tree = {

        init: function() {
            /* Configurations */
            this.jsonFilePath     = 'data/tree-data-taiwan-history.json';
            this.root_icon        = "glyphicon-folder-open";
            this.node_minus_icon  = "glyphicon-minus";
            this.node_plus_icon   = "glyphicon-plus";
            this.node_leaf_icon   = "glyphicon-leaf";
            this.jsonModelDefault = {
                name: "",
                parent: "",
                value: 10,
                color: "",
                type: ""
            };

            /* Global variables */
            this.newNodeDefaultValue = '新增節點';
            this.map = {};
            this.targetNode = null;
            this.html = "";
        },


        getIcon: function(node) {
            var icon = this.node_minus_icon;
            if (node.root)
                icon = this.root_icon;
            else if (!node.children)
                icon = this.node_leaf_icon;
            return icon;
        },
    };

    var dataOp = {

        init: function(data) {
            var rootNode = this.import.buildTree(data);
            this.import.buildHTML(rootNode);
            this.export.prepareJSON();
        },

        import: {

            buildNode: function _buildNode(node, dept) {

                tree.html += ('<span class="node node-' + dept + '" data-toggle="context"><i class="glyphicon ' + tree.getIcon(node) + '"></i>' + node.name + '</span> ');

                dept = dept + 1;
                tree.html += '<ul data-dept=' + dept + ' >';

                if (node.children) {
                    $.each(node.children, function(index, child) {
                        tree.html += '<li>';
                        _buildNode(tree.map[child], dept);
                        tree.html += '</li>';
                    });
                }

                tree.html += '</ul>';

            },


            buildHTML: function(rootNode) {

                tree.html += "<ul><li>";
                this.buildNode(tree.map[rootNode], 0);
                tree.html += "</li></ul>";

                $(".tree").append(tree.html);

            },

            buildTree: function(data) {

                var rootNode = "";

                $.each(data, function(key, node) {
                    tree.map[node.name] = node;
                    console.log(node);
                });

                $.each(data, function(index, node) {

                    var parentNode = tree.map[node.parent];

                    if (parentNode) {

                        // If parentNode still doesn't have children, initialize it as empty array and push in a new one.
                        (parentNode.children || (parentNode.children = [])).push(node.name);

                    } else {
                        // If a node does not have parent, it is the root.
                        node.root = true;
                        rootNode = node.name;
                    }
                });


                return rootNode;
            },

            loadJSON: function (jsonFilePath) {
                        
                $.getJSON(jsonFilePath, function(data) {

                    dataOp.init(data);
                    plugin.init();

                }).fail(function() {
                    $(".alert").show('fast');
                }).success(function(){
                    $('modal-JSON-import').modal('hide');
                });
            }
        },

        export: {
            add: function(you, yourParent) {
                var newNode = {};
                $.extend(newNode, tree.jsonModelDefault);

                newNode.name = you.text();
                newNode.parent = yourParent.text();

                tree.map[you.text()] = newNode;
            },

            remove: function _remove (you) {

                if( you && tree.map[ you ].children ){
                    // Recursively remove your children
                    $.each(tree.map[ you ].children, function(index, child) {
                            _remove(child);
                    });
                }
                delete tree.map[you];
            },

            transformIntoArray: function () {
                return $.map(tree.map, function(value, key) {
                    return [value];
                });
            },

            prepareJSON: function () {
                var that = this;
                $( "#export" ).on( "click", function() {
                    $('#textarea-JSON-export').val( JSON.stringify( that.transformIntoArray() ) );
                });
            }
        }

    };


    var plugin = {

        init: function() {
            this.collapsible();
            this.contextMenu();
            this.modal.process();
        },

        collapsible: function() {

            nodeOp.makeCollapsible($('.tree li').has('li'));
            $('.tree').on('click', ' li.parent_li > span', function(e) {
                var children = $(this).parent('li.parent_li').find(' > ul > li');
                if (children.is(":visible")) {
                    children.hide('fast');
                    $(this).attr('title', '開啟').find(' > i').addClass(tree.node_plus_icon).removeClass(tree.node_minus_icon);
                } else {
                    children.show('fast');
                    $(this).attr('title', '關閉').find(' > i').addClass(tree.node_minus_icon).removeClass(tree.node_plus_icon);
                }
                e.stopPropagation();
            });
        },

        contextMenu: function() {

            $('.node').on('contextmenu', function() {
                /* Update targetNode ( the one on which user is right clicking ) */
                tree.targetNode = this;
            });

            var $modal = this.modal;

            $('.node').contextmenu({

                parent: this,

                target: '#context-menu',

                onItem: function(context, e) {

                    var operation = e.target.id;

                    if (operation == "add") {
                        nodeOp.add();
                        $modal.build('新增', '知識節點......');
                    } else if (operation == "delete") {
                        nodeOp.remove($(tree.targetNode).parent());
                        dataOp.export.remove(nodeOp.getContent().text())
                        console.log(tree.map);
                        return;
                    } else {
                        $modal.build('修改', $(tree.targetNode).text());
                    }

                    $('#modal').modal('show');
                }
            })
        },

        modal: {

            build: function(title, defaultValue) {
                $('#modal-title').html(title);
                $('#modal-input')
                    .val(defaultValue)
                    .on('click', function() {
                        $(this).select();
                    });
            },

            process: function() {
                /* Update the value of new field constantly */
                $('#modal-input').keyup(function() {
                    var input = $('#modal-input').val();
                    nodeOp.getContent().replaceWith(input);
                });

                $('#modal-submit').click(function() {
                    // If user does not modify the default value when submitting, purge the newly created node.
                    if (!$(tree.targetNode).text() || $(tree.targetNode).text() == this.newNodeDefaultValue) {
                        nodeOp.remove($(tree.targetNode).closest('li'));
                    } else {
                        dataOp.export.add(nodeOp.getContent(), nodeOp.getParentContent())
                    }

                });

                $('#modal-cancel').click(function() {
                    nodeOp.remove($(tree.targetNode).closest('li'));
                });
            }
        },
    };

    var nodeOp = {

        init: function() {
            this.newNode = "<li><span class='node' data-toggle='context' >" + tree.newNodeDefaultValue + "</span><ul></ul></li> ";
        },

        add: function() {

            // If parent was a leaf, turn it into a normal node
            this.removeLeafIcon();

            // Make the parent collapsible
            this.makeCollapsible($(tree.targetNode).parent('li'));

            // Get current dept
            var dept = $(tree.targetNode).siblings('ul').attr('data-dept');

            // Append to ul sibling to the target span
            tree.targetNode = $(this.newNode).appendTo($(tree.targetNode).siblings('ul'));

            // Set next dept
            $(tree.targetNode).children('ul').attr('data-dept', parseInt(dept) + 1);

            // Add icon
            tree.targetNode = tree.targetNode.children('.node')
                .addClass('node-' + dept)
                .prepend('<i class="glyphicon ' + tree.getIcon({}) + '"></i>'); // Prepend leaf glyph

            plugin.contextMenu();
        },

        remove: function($node) {
            // Remove node with animation
            $node.hide('slow', function() {
                $node.remove();
            });
            this.makeUncollapsible($node);
        },

        getContent: function() {
            return $(tree.targetNode).contents().last();
        },

        getParentContent: function() {
            return $(tree.targetNode).closest('ul').siblings('.node').contents().last();
        },

        removeLeafIcon: function() {
            $(tree.targetNode).children("." + tree.node_leaf_icon).removeClass(tree.node_leaf_icon).addClass(tree.node_minus_icon);
        },

        makeCollapsible: function($node) {
            $node.addClass('parent_li').find(' > span').attr('title', '關閉');
        },

        makeUncollapsible: function($node) {
            $node.has('li').removeClass('parent_li').find(' > span').attr('title', '');
        }
    };


    $(function() {

        $('#modal-JSON-import').on('show.bs.modal', function() {
            $(this).find('.alert').hide();
            $(this).find('#form-load-custom').hide();
            $(this).find('#load-default').show();
            $(this).find('#load-custom').show();
        })

        $('#modal-JSON-import').modal('show');

        tree.init();
        nodeOp.init();

        $( "#load-custom" ).on( "click", function() {
            $("#form-load-custom").show('fast');
            $("#load-default").hide('fast');
            $(this).hide('fast');
        });
        $( "#form-load-custom > button" ).on( "click" , function() {
            console.log($("#form-load-custom > input").val());
            dataOp.import.loadJSON($("#form-load-custom > input").val());
        });
        $( "#load-default" ).on( "click", function() {
            dataOp.import.loadJSON(tree.jsonFilePath);
            $('#modal-JSON-import').modal('hide');
        });


    });

}());