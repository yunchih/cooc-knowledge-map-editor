(function() {

    var tree = {

        init: function() {
            /* Configurations */
            this.defaultJSONFilePath = 'data/tree-data.json';
            this.blankJSONFilePath   = 'data/default-new-data.json';
            this.root_icon           = "glyphicon-folder-open";
            this.node_minus_icon     = "glyphicon-minus";
            this.node_plus_icon      = "glyphicon-plus";
            this.node_leaf_icon      = "glyphicon-leaf";
            this.hotkey = {
                addChildNode:   "c",
                addSiblingNode: "v",
                modifyNode:     "return",
                deleteNode:     "del"
            };
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

        addNode: function (childNodeType) {
            nodeOp.add(childNodeType);
            plugin.modal.build('新增', '知識節點......');
            $('#modal-edit-node').modal('show');
        },

        modifyNode: function () {
            // Cache the content so that if user hit 'Cancel', we can recover the original content
            nodeOp.contentCache = $(tree.targetNode).text();
            plugin.modal.build('修改', $(tree.targetNode).text());
            $('#modal-edit-node').modal('show');
        },

        deleteNode: function () {
            // remove the node from tree
            nodeOp.remove($(tree.targetNode).parent());

            // remove the node from our data ( which will be exported )
            dataOp.export.remove(nodeOp.getContent().text())
        }
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

                tree.html += ('<span tabindex="0" class="node node-' + dept + '" data-toggle="context"><i class="glyphicon ' + tree.getIcon(node) + '"></i>' + node.name + '</span> ');

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

                    // Initialize context menu and other plugins.
                    plugin.init();

                    // Start listening for click event on nodes.
                    nodeOp.clickListener();

                    $('#modal-JSON-import').modal('hide');

                }).fail(function() {
                    $("#file-not-found").show('fast',function(){
                        UI.triggerShakeAnimation($(this));
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

                newNode.name = you;
                newNode.parent = yourParent;

                // Add it into our map ( which will be exported )
                tree.map[you] = newNode;
                
                return true;
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
                $('#textarea-JSON-export').val( JSON.stringify( this.transformIntoArray() ) );
            }
        }

    };


    var plugin = {

        init: function() {
            this.collapsible();
            this.contextMenu();
            this.hotkey();
            this.modal.processInput();
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

            // Bind the modal object into a local variable, 
            // so it can be seen inside contextmenu callback function
            var $modal = this.modal;

            $('.node').contextmenu({

                parent: this,

                target: '#context-menu',

                
                /*
                 * This function is activated when user click an option on the context menu.
                 */
                onItem: function(context, e) {

                    var operation = e.target.id;

                    switch(operation) {
                        case "delete-node":
                            tree.deleteNode();
                            break;
                        case "add-child-node":
                            tree.addNode('child');
                            break;
                        case "add-sibling-node":
                            tree.addNode('sibling');
                            break;
                        default:
                            tree.modifyNode();
                    }
                }
            })
        },

        modal: {

            build: function(title, defaultValue) {
                

                // If a title is given, change it
                if( title )
                    $('#modal-title').html(title);

                $('#modal-input')
                    .val(defaultValue)
                    .on('click', function() {

                        $(this).select();

                        // Hide the duplicate warning ( if any )
                        $('#duplicate-node').hide('fast');

                    });
            },
            processInput: function() {
                /* Update the value of new field constantly */
                $('#modal-input').keyup(function() {
                    var input = $('#modal-input').val();
                    nodeOp.getContent().replaceWith(input);
                });

                $('#modal-submit').click(function(e) {

                    e.preventDefault();
                    
                    var you = nodeOp.getContent().text();
                    var yourParent = nodeOp.getParentContent().text();
                            
                    // If user does not modify the default value when submitting, purge the newly created node.
                    if (!you || you == this.newNodeDefaultValue) {
//                        if (!$(tree.targetNode).text() || $(tree.targetNode).text() == this.newNodeDefaultValue) {
                        nodeOp.remove($(tree.targetNode).closest('li'));
                    // The name newly created node already exists!!!
                    } else if( tree.map[you] ){
                        UI.exportWarnAgainstDuplicateName(you);
                    }
                    else{
                        dataOp.export.add( you,yourParent );
                        $('#modal-edit-node').modal('hide');
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

        hotkey: function () {

            $('.node').bind('keydown', tree.hotkey.addChildNode, function(event){
                event.preventDefault();
                tree.addNode('child');
                console.log("Key event! Adding new node");
            });
            $('.node').bind('keydown', tree.hotkey.addSiblingNode, function(event){
                event.preventDefault();
                tree.addNode('sibling');
            });
            $('.node').bind('keydown', tree.hotkey.modifyNode, function(event){
                event.preventDefault();
                tree.modifyNode();
            });
            $('.node').bind('keydown', tree.hotkey.deleteNode, function(event){
                event.preventDefault();
                tree.deleteNode();
            });
        }
    };

    var nodeOp = {

        init: function() {
            this.newNode = "<li><span tabindex='0' class='node' data-toggle='context' >" + tree.newNodeDefaultValue + "</span><ul></ul></li> ";
            this.contentCache = "";
        },

        // targetType could be "child" or "sibling", all relative to the current selected node.
        add: function(targetType) {
             // Get current dept
            var dept = $(tree.targetNode).siblings('ul').attr('data-dept');

            // Adding a child node
            if( targetType == "child" ){
                // If parent was a leaf, turn it into a normal node
                this.removeLeafIcon();

                // Make the parent collapsible
                this.makeCollapsible($(tree.targetNode).parent('li'));

                // Append to ul sibling to the target span
                tree.targetNode = $(this.newNode).appendTo($(tree.targetNode).siblings('ul'));
            }   
            // Adding a sibling node
            else{

                // Append to ul sibling to the target span
                tree.targetNode = $(this.newNode).appendTo($(tree.targetNode).closest('ul'));

            }

            // Set next dept
            $(tree.targetNode).children('ul').attr('data-dept', parseInt(dept) + 1);

            // Add icon
            tree.targetNode = 
            tree.targetNode
                .children('.node')
                .addClass('node-' + dept)
                .prepend('<i class="glyphicon ' + tree.getIcon({}) + '"></i>'); // Prepend leaf glyph

            // Restart context menu
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
        },

        clickListener: function () {
            $('.node').on('click', function () {
                $(tree.targetNode).removeClass('target-node');
                tree.targetNode = this;
                $(this).addClass('target-node');
                console.log("clicked");
            })
        }
    };

    var UI = {

        importDialogTrigger: function () {
             /*
              * Show initial import prompt 
              */
            $('#import').on('click', function(e) {

                e.preventDefault();

                // If there is unexported data, prompt 
                // user to export them first.
                if( ! $.isEmptyObject(tree.map) ){
                    $("#modal-export-prompt").modal('show');
                }
                else{
                    var importModal = $('#modal-JSON-import');
                    importModal.modal('show');  
                    importModal.find('.alert').hide();
                    importModal.find('#form-load-custom').hide();
                    importModal.find('#load-default').show();
                    importModal.find('#load-custom').show(); 
                }
            });

                    
        },
        
        importWarning: function () {
            $("#modal-export-prompt .btn-danger").click(function (e) {
                e.preventDefault();
                // Clean our map
                tree.map = {}; 
                $('#modal-export-prompt').on('hidden.bs.modal', function (e) {
                  $('#import').trigger('click');
                });
                
            });

            $("#modal-export-prompt .btn-success").click(function (e) {
                e.preventDefault();
                $('#export').trigger('click');
            })
        },
        
        importDialogChooseCustom: function () {
            /*
             * Read custom JSON URL and import it
             */
            $( "#form-load-custom > .btn" ).on( "click" , function(e) {
                e.preventDefault();
                dataOp.import.loadJSON($("#form-load-custom > input").val());
            });
        },

        importDialogForm: function () {
            /*
             * Load default JSON file
             */
            $( "#load-blank" ).on( "click", function() {
                dataOp.import.loadJSON(tree.blankJSONFilePath);
            });
             /*
              * Show input field when user choose to import custom JSON
              */
            $( "#load-custom" ).on( "click", function() {
                $("#form-load-custom").show('fast');
                $("#hide-if-load-custom").hide('fast');
                $(this).hide('fast');
            });             
            /*
             * Load default JSON file
             */
            $( "#load-default" ).on( "click", function() {
                dataOp.import.loadJSON(tree.defaultJSONFilePath);
            });

        },

        export: function () {
            /*
             * Export JSON
             */
            $('#export').on('click', function() {
                dataOp.export.prepareJSON();
                $('#modal-JSON-export').modal('show');
            });
        },
        
        exportWarnAgainstDuplicateName: function (nodeName) {
            var warning = $('<span></span>')
                            .text(nodeName)
                            .addClass('duplicate-node-name')
                            
            var animate = this.triggerShakeAnimation;                
            $('#duplicate-node > #alert-body')
                .html( warning )
                .prepend('已經有節點叫做 ')
                .append('! 請換一個名字吧~')
                .parent()
                .show('fast',function(){

                    animate($(this));

                    // Rebuild a modal
                    // plugini.modal.build('',nodeName);
                });
        },

        showHotKey: function () {
            $('#show-hotkey').click(function () {
                $('#hotkeys').fadeIn('fast');
            })
            $('#hide-hotkey').click(function () {
                $('#hotkeys').fadeOut('fast');
            })
        },

        triggerShakeAnimation: function ($target) {
            
            $target.addClass('shake');
            setTimeout( function() {
                $target.removeClass('shake');
            }, 750 );

        }     
    };



    // Executed on document ready
    $(function() {
        
        /* Initializing global configurations */
        tree.init();

        /* Initializing node operations */
        nodeOp.init();

        /* ----------  UI  ---------- */
        UI.importDialogTrigger();
        UI.importDialogForm();
        UI.importDialogChooseCustom();
        UI.importWarning();
        UI.showHotKey()
        UI.export();

        $('#import').trigger('click');
    });

}());
