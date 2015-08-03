(function() {

    var tree = {

        init: function() {
            /* Configurations */
            this.jsonFilePath     = 'data/tree-data.json';
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
        },

        import: {

            /*
             * Recursively tranverse the children array of each node and turn them into HTML
             */
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

            buildTree: function(data) {

                var rootNode = "";

                // Transform the input data into a map, whose key is the name of the node 
                $.each(data, function(key, node) {
                    tree.map[node.name] = node;
                });

                // Build `children` array for each node
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

            buildHTML: function(rootNode) {

                tree.html += "<ul><li>";
                this.buildNode(tree.map[rootNode], 0);
                tree.html += "</li></ul>";

                // Apply the collected HTML into our page
                $(".tree").append(tree.html);

            },


            loadJSON: function (jsonFilePath) {
                
                $.getJSON(jsonFilePath, function(data) {

                    // Before transforming our data, we shall initialize the necessary utililies
                    dataOp.init(data);
                    plugin.init();
                    $('#modal-JSON-import').modal('hide');

                }).fail(function() {
                    $(".alert").show('fast',function(){
                        $(this).addClass('shake');
                    });
                });
            }
        },

        export: {

            /*
             * Add new node into our map
             */
            add: function(you, yourParent) {
                var newNode = {};

                // Assign default value to the new node
                $.extend(newNode, tree.jsonModelDefault);

                newNode.name = you.text();
                newNode.parent = yourParent.text();

                // Add it into our map ( which will be exported )
                tree.map[you.text()] = newNode;
            },

            /*
             * remove node from our map
             */
            remove: function _remove (you) {

                if( you && tree.map[ you ].children ){
                    // Recursively remove your children
                    $.each(tree.map[ you ].children, function(index, child) {
                            _remove(child);
                    });
                }
                delete tree.map[you];
            },

            /*
             * Transform the values of data map into plain array 
             */
            transformIntoArray: function () {
                return $.map(tree.map, function(value, key) {
                    // We don't we children in our JSON
                    delete value.children;
                    return [value];
                });
            },

            /*
             * Export the JSON and throw it into the export textarea
             */
            prepareJSON: function () {
                var that = this;
                $( "#export" ).on( "click", function() {
                    $('#textarea-JSON-export').val( JSON.stringify( that.transformIntoArray() ) );
                    console.log("Exporting: ");
                    console.log(that.transformIntoArray());
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

        /*
         * A node is collapsible if it is not a leaf
         * When user click on a collapsible node, we toggle opening/closing the node
         */
        collapsible: function() {

            nodeOp.makeCollapsible($('.tree li').has('li'));
            $('.tree').on('click', ' li.collapsible > span', function(e) {
                var children = $(this).parent('li.collapsible').find(' > ul > li');
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

        /*
         * context menu is activated when user right click on a node
         */
        contextMenu: function() {

            // When user activate the contextmenu, we update the targetNode here
            // Most of the operations apply changes to targetNode
            $('.node').on('contextmenu', function() {
                /* Update targetNode ( the one on which user is right clicking ) */
                tree.targetNode = this;
            });

            var $modal = this.modal;

            $('.node').contextmenu({

                parent: this,

                target: '#context-menu',

                
                /*
                 * This function is activated when user click an option on the context menu.
                 */
                onItem: function(context, e) {

                    var operation = e.target.id;

                    if (operation == "delete"){

                        // remove the node from tree
                        nodeOp.remove($(tree.targetNode).parent());

                        // remove the node from our data ( which will be exported )
                        dataOp.export.remove(nodeOp.getContent().text())

                    }
                    else {

                        if (operation == "add") {

                            nodeOp.add();
                            $modal.build('新增', '知識節點......');

                        } else {

                            // Cache the content so that if user hit 'Cancel', we can recover the original content
                            nodeOp.contentCache = $(tree.targetNode).text();
                            $modal.build('修改', $(tree.targetNode).text());

                        }

                        // Show modal so that user can edit a node
                        $('#modal').modal('show');
                    }

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

                $('#modal-submit').click(function(e) {

                    e.preventDefault();

                    // If user does not modify the default value when submitting, purge the newly created node.
                    if (!$(tree.targetNode).text() || $(tree.targetNode).text() == this.newNodeDefaultValue) {
                        nodeOp.remove($(tree.targetNode).closest('li'));
                    } else {
                        dataOp.export.add(nodeOp.getContent(), nodeOp.getParentContent())
                    }

                });

                $('#modal-cancel').click(function(e) {

                    e.preventDefault();

                    // If there is content cache, the user is giving up an edit.  
                    // So we recover the content of node he is editing.
                    if( nodeOp.contentCache ){
                        nodeOp.getContent().replaceWith(nodeOp.contentCache);
                        nodeOp.contentCache = "";
                    }
                    // The user is giving up creating a new node,
                    // so we simply remove the newly created node.
                    else{
                        nodeOp.remove($(tree.targetNode).closest('li'));
                    }
                });
            }
        },
    };

    var nodeOp = {

        init: function() {
            this.newNode = "<li><span class='node' data-toggle='context' >" + tree.newNodeDefaultValue + "</span><ul></ul></li> ";
            this.contentCache = "";
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
            $node.addClass('collapsible').find(' > span').attr('title', '關閉');
        },

        makeUncollapsible: function($node) {
            $node.has('li').removeClass('collapsible').find(' > span').attr('title', '葉節點');
        }
    };

    var UI = {

        importDialog: function () {
             /*
              * Show initial import prompt 
              */
            $('#import').on('click', function(e) {

                e.preventDefault();

                // If there is unexported data
                if( ! $.isEmptyObject(tree.map) ){
                    $("#modal-export-prompt").modal('show');
                }

                var importModal = $('#modal-JSON-import');
                importModal.modal('show');  
                importModal.find('.alert').hide();
                importModal.find('#form-load-custom').hide();
                importModal.find('#load-default').show();
                importModal.find('#load-custom').show(); 
            });

                    
        },

        importWarning: function () {
            $("#modal-export-prompt .btn-danger").click(function (e) {
                e.preventDefault();
                // Clean our map
                map = {}; 
            });

            $("#modal-export-prompt .btn-success").click(function (e) {
                e.preventDefault();
                $('#export').trigger('click');
            })
        },
        
        importDialogChooseCustom: function () {
             /*
              * Show input field when user choose to import custom JSON
              */
            $( "#load-custom" ).on( "click", function() {
                $("#form-load-custom").show('fast');
                $("#load-default").hide('fast');
                $(this).hide('fast');
            });            
        },

        importCustom: function () {
            /*
             * Read custom JSON URL and import it
             */
            $( "#form-load-custom > .btn" ).on( "click" , function(e) {
                e.preventDefault();
                console.log("Loading custom JSON");
                dataOp.import.loadJSON($("#form-load-custom > input").val());
            });
        },

        importDefault: function () {
            /*
             * Load default JSON file
             */
            $( "#load-default" ).on( "click", function() {
                console.log("Loading default JSON");
                dataOp.import.loadJSON(tree.jsonFilePath);
            });
        },

        export: function () {
            /*
             * Export JSON
             */
            $('#export').on('click', function() {
                dataOp.export.prepareJSON();
                $('modal-JSON-export').modal('show');
            });
        }
    };

    // Executed on document ready
    $(function() {
        
        /* Initializing global configurations */
        tree.init();

        /* Initializing node operations */
        nodeOp.init();

        /* ----------  UI  ---------- */
        UI.importDialog();
        UI.importDialogChooseCustom();
        UI.importWarning();
        UI.importCustom();
        UI.importDefault();
        UI.export();

        $('#import').trigger('click');
    });

}());
