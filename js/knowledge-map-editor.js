(function() {

    var Tree = {

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
                modifyNode:     "e",
                deleteNode:     "del",
                goParentNode:   "left",
                goChildNode:    "right",
                goLastSibling:  "up",
                goNextSibling:  "down"
            };
            this.jsonModelDefault = {
                name: "",
                parent: "",
                value: 10,
                color: "",
                type: ""
            };
            this.modal_comment_edit_hint_glyph = {
                新增: 'glyphicon-plus',
                修改: 'glyphicon-pencil'
            };
            /* Global variables */
            this.newNodeDefaultValue = '新增節點';
            this.map = {};
            this.targetNode = null;
            this.rootNode = null;
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
            Node.add(childNodeType);
            Plugin.modal.build('新增', '知識節點......', '');
            $('#modal-edit-node').modal('show');
        },

        modifyNode: function () {
            // Cache the content so that if user hit 'Cancel', we can recover the original content
            Node.contentCache = $(Tree.targetNode).text();
            Plugin.modal.build('修改', $(Tree.targetNode).text(), $(Tree.targetNode).attr('data-content'));
            $('#modal-edit-node').modal('show');
        },

        deleteNode: function () {
            // remove the node from tree
            Node.remove($(Tree.targetNode).parent());

            // remove the node from our data ( which will be exported )
            Data.export.remove(Node.getContent().text())
        },

        goParentNode: function () {
            Node.changeFocusingNode( $(Tree.targetNode).closest('ul').siblings('.editor-node') );
        },
        goChildNode: function () {
            Plugin.toggleCollapsible(Tree.targetNode);
            Node.changeFocusingNode( $(Tree.targetNode).siblings('ul').find('.editor-node:first') );
        },
        goLastSibling: function () {
            Node.changeFocusingNode( $(Tree.targetNode).closest('li').prev().children('.editor-node') );
        },
        goNextSibling: function () {
            Node.changeFocusingNode( $(Tree.targetNode).closest('li').next().children('.editor-node') );
        }
    };

    var Data = {

        init: function(data) {
            Tree.html = "";
            Tree.rootNode = this.import.buildTree(data);
            this.import.buildHTML(Tree.rootNode);
        },

        import: {

            /*
             * Recursively tranverse the children array of each node and turn them into HTML
             */
            buildNode: function _buildNode (node, dept) {

                node.comment = node.comment || "";

                Tree.html += (
                    '<span tabindex="0" class="editor-node node-' + dept + '" data-toggle="context" data-content="' + node.comment + '"><i class="glyphicon ' + Tree.getIcon(node) + '"></i>' + node.name + '</span> ');

                dept = dept + 1;
                Tree.html += '<ul data-dept=' + dept + ' >';

                if (node.children) {
                    $.each(node.children, function (index, child) {
                        Tree.html += '<li>';
                        _buildNode( child, dept);
                        Tree.html += '</li>';
                    });
                }

                Tree.html += '</ul>';

            },

            buildTree: function(data) {

                var rootNode = "";

                // Transform the input data into a map, whose key is the name of the node 
                $.each(data, function(key, node) {
                    Tree.map[node.name] = node;
                });

                // Build `children` array for each node
                $.each(data, function(index, node) {

                    var parentNode = Tree.map[node.parent];

                    if (parentNode) {

                        // If parentNode still doesn't have children, initialize it as empty array and push in a new one.
                        (parentNode.children || (parentNode.children = [])).push(node);

                    } else {
                        // If a node does not have parent, it is the root.
                        node.root = true;
                        rootNode = node;
                    }
                });


                return rootNode;
            },

            buildHTML: function(rootNode) {

                Tree.html += "<ul><li>";
                this.buildNode(rootNode, 0);
                Tree.html += "</li></ul>";

                // Apply the collected HTML into our page
                $(".tree").append(Tree.html);

            },


            loadJSON: function (jsonFilePath) {
                
                $.getJSON(jsonFilePath, function(data) {

                    // Before transforming our data, we shall initialize the necessary utililies
                    Data.init(data);

                    // Initialize context menu and other plugins.
                    Plugin.init();

                    // Start listening for click event on nodes.
                    Node.clickListener();

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
            add: function(you, yourParent, yourComment) {

                var newNode = {};
                
                // Assign default value to the new node
                $.extend(newNode, Tree.jsonModelDefault);

                newNode.name = you;
                newNode.parent = yourParent;

                // Add it into our map ( which will be exported )
                Tree.map[you] = newNode;
                
                return true;
            },

            /*
             * remove node from our map
             */
            remove: function _remove (you) {

                if( you && Tree.map[ you ].children ){
                    // Recursively remove your children
                    $.each(Tree.map[ you ].children, function(index, child) {
                            _remove(child);
                    });
                }
                delete Tree.map[you];
            },

            /*
             * Transform the values of data map into plain array 
             */
            transformIntoArray: function () {
                console.log(Tree.map);
                return $.map(Tree.map, function(value, key) {
                    // We don't need children in our JSON
                    delete value.children;
                    return [value];
                });
            },

            /*
             * Export the JSON and throw it into the export textarea
             */
            prepareJSON: function () {
                $('#textarea-JSON-export')
                    .val( JSON.stringify( this.transformIntoArray() ) )
                    .focus(function () {
                        this.select();
                    });
            }
        },

        cleanUp: function () {
            Tree.map = {}; 

            // Clean the HTML
            $(".tree").html("");
        }

    };


    var Plugin = {

        init: function() {
            this.contextMenu();
            this.hotkey();
            this.modal.processInput();
            this.collapsible($('.editor-node'));
            this.popOver($('.editor-node'));
        },

        /*
         * A node is collapsible if it is not a leaf
         * When user click on a collapsible node, we toggle opening/closing the node
         */
        collapsible: function() {

            Node.makeCollapsible($('.tree li').has('li'));

            var toggle = this.toggleCollapsible;
            $('.tree').on('click', ' li.collapsible > span', function(e) {
                toggle(this,"clicked");
                e.stopPropagation();
            });
        },

        toggleCollapsible: function (targetNode ,isClicked) {
            var children = $(targetNode).parent('li.collapsible').find(' > ul > li');
            if ( children.is(":visible") && isClicked ) {
                children.hide('fast');
                $(targetNode).find(' > i').addClass(Tree.node_plus_icon).removeClass(Tree.node_minus_icon);
            } else {
                children.show('fast');
                $(targetNode).find(' > i').addClass(Tree.node_minus_icon).removeClass(Tree.node_plus_icon);
            }
        },

        /*
         * popover shows the comment on the node.
         */
        popOver: function (target) {
            $(target).popover({
                animation: true,
                trigger: 'hover',
            });
        },

        /*
         * context menu is activated when user right click on a node
         */
        contextMenu: function(target) {

            // When user activate the contextmenu, we update the targetNode here
            // Most of the operations apply changes to targetNode
            $('.editor-node').on('contextmenu', function() {
                /* Update targetNode ( the one on which user is right clicking ) */
                Tree.targetNode = this;
            });

            // Bind the modal object into a local variable, 
            // so it can be seen inside contextmenu callback function
            var $modal = this.modal;

            $('.editor-node').contextmenu({

                parent: this,

                target: '#context-menu',

                
                /*
                 * This function is activated when user click an option on the context menu.
                 */
                onItem: function(context, e) {

                    var operation = e.target.id;

                    switch(operation) {
                        case "delete-node":
                            Tree.deleteNode();
                            break;
                        case "add-child-node":
                            Tree.addNode('child');
                            break;
                        case "add-sibling-node":
                            Tree.addNode('sibling');
                            break;
                        default:
                            Tree.modifyNode();
                    }
                }
            })
        },

        modal: {

            build: function(title, defaultValue, defaultComment) {
                

                // Change the title of the modal 新增 or 修改
                $('#modal-title').html(title);

                var comment_hint = $('#modal-add-comment');
                comment_hint.children('span').html(title + '註解');
                comment_hint.children('i')
                            .removeClass()
                            .addClass('glyphicon ' + Tree.modal_comment_edit_hint_glyph[title]);

                $('#modal-input')
                    .val(defaultValue)
                    .on('click', function() {
                        $(this).select();
                    });
                $('#modal-textarea')
                    .val(defaultComment)
                    .on('click', function() {
                        $(this).select();
                    });

                $('#modal-edit-node').on('show.bs.modal', function (e) {
                    $('#duplicate-node').hide();
                });

            },
            processInput: function() {

                function processSubmission () {
                    var you = $('#modal-input').val();
                    var yourComment = $('#modal-textarea').val();

                    if( yourComment ){
                        $('#modal-textarea').hide();
                    }

                    switch($('#modal-title').text()){
                        case '新增':

                            var yourParent = Node.getParentContent().text();

                            // If user does not modify the default value when submitting, purge the newly created node.
                            if (!you || you == this.newNodeDefaultValue) {
                            // The name newly created node already exists!!!
                                Node.remove($(Tree.targetNode).closest('li'));
                                return false;
                            }
                            if( Tree.map[you] ){
                                UI.exportWarnAgainstDuplicateName(you);
                                return false;
                            }

                            Data.export.add( you,yourParent );

                            break;

                        case '修改':
                            
                            if( you != Node.contentCache ){
                                if( Tree.map[you] ){
                                    // The name has already existed!
                                    UI.exportWarnAgainstDuplicateName(you);
                                    return false;
                                }
                                else{
                                    Tree.map[you] = Tree.map[ Node.contentCache ];
                                    delete Tree.map[ Node.contentCache ] ;
                                }
                            }
                    };

                    // Update node comment if it's not empty
                    if( yourComment ){
                        $(Tree.targetNode).attr('data-content',yourComment);
                        Tree.map[you].comment = yourComment;
                    } 

                    // Close the edit modal
                    $('#modal-edit-node').modal('hide');
                    return false;
                }

                /* Update the value of new field constantly */
                $('#modal-input').keyup(function() {
                    var input = $('#modal-input').val();
                    Node.getContent().replaceWith(input);
                });

                $('#modal-edit-node form').submit(function (e) {
                    e.stopImmediatePropagation()
                    e.preventDefault();
                    return processSubmission();
                });
                $('#modal-submit').click(function(e) {
                    processSubmission();
                });

                $('#modal-cancel').click(function(e) {

                    e.preventDefault();

                    // If there is content cache, the user is giving up an edit.  
                    // So we recover the content of node he is editing.
                    if( Node.contentCache ){
                        Node.getContent().replaceWith(Node.contentCache);
                        Node.contentCache = "";
                    }
                    // The user is giving up creating a new node,
                    // so we simply remove the newly created node.
                    else{
                        Node.remove($(Tree.targetNode).closest('li'));
                    }
                });
            }
        },

        hotkey: function () {

            $('.tree').on('keydown','.editor-node', Tree.hotkey.addChildNode, function(event){
                event.preventDefault();
                Tree.addNode('child');
            }).on('keydown','.editor-node', Tree.hotkey.addSiblingNode, function(event){
                event.preventDefault();
                Tree.addNode('sibling');
            }).on('keydown','.editor-node', Tree.hotkey.modifyNode, function(event){
                event.preventDefault();
                Tree.modifyNode();
            }).on('keydown','.editor-node', Tree.hotkey.deleteNode, function(event){
                event.preventDefault();
                Tree.deleteNode();
            }).on('keydown','.editor-node', Tree.hotkey.goParentNode, function(event){
                event.preventDefault();
                Tree.goParentNode();
            }).on('keydown','.editor-node', Tree.hotkey.goChildNode, function(event){
                event.preventDefault();
                Tree.goChildNode();
            }).on('keydown','.editor-node', Tree.hotkey.goNextSibling, function(event){
                event.preventDefault();
                Tree.goNextSibling();
            }).on('keydown','.editor-node', Tree.hotkey.goLastSibling, function(event){
                event.preventDefault();
                Tree.goLastSibling();
            });
        }
    };

    var Node = {

        init: function() {
            this.newNodeTemplate = "<li><span tabindex='0' class='editor-node' data-toggle='context' >" + Tree.newNodeDefaultValue + "</span><ul></ul></li> ";
            this.contentCache = "";
        },

        // targetType could be "child" or "sibling", all relative to the current selected node.
        add: function(targetType) {
             // Get current dept
            var dept = $(Tree.targetNode).siblings('ul').attr('data-dept');
            var newParentNode;

            // Adding a child node
            if( targetType == "child" ){
                // If parent was a leaf, turn it into a normal node
                this.removeLeafIcon();

                // Make the parent collapsible
                this.makeCollapsible($(Tree.targetNode).parent('li'));

                newParentNode = $(Tree.targetNode).siblings('ul')
            }   
            // Adding a sibling node
            else{
                newParentNode = $(Tree.targetNode).closest('ul');
            }

            // Append to target ul and change the focus
            this.changeFocusingNode( $(this.newNodeTemplate).appendTo(newParentNode).children('.editor-node') );

            // Set next dept
            $(Tree.targetNode).siblings('ul').attr('data-dept', parseInt(dept) + 1);

            // Add icon
            Tree.targetNode
                .addClass('node-' + dept)
                .prepend('<i class="glyphicon ' + Tree.getIcon({}) + '"></i>'); // Prepend leaf glyph

            // Restart context menu
            Plugin.contextMenu(Tree.targetNode);
            Plugin.popOver(Tree.targetNode);
        },

        remove: function($node) {
            // Remove node with animation
            $node.hide('slow', function() {
                $node.remove();
            });
            this.makeUncollapsible($node);
        },

        getContent: function() {
            return $(Tree.targetNode).contents().last();
        },

        getParentContent: function() {
            return $(Tree.targetNode).closest('ul').siblings('.editor-node').contents().last();
        },

        removeLeafIcon: function() {
            $(Tree.targetNode).children("." + Tree.node_leaf_icon).removeClass(Tree.node_leaf_icon).addClass(Tree.node_minus_icon);
        },

        makeCollapsible: function($node) {
            $node.addClass('collapsible');
        },

        makeUncollapsible: function($node) {
            $node.has('li').removeClass('collapsible');
        },

        clickListener: function () {
            var changeFocus = this.changeFocusingNode;
            $('.tree').on('click', '.editor-node', function () {
                changeFocus(this);
            })
        },

        changeFocusingNode: function (focusingNode) {
            if( $(focusingNode).length ){
                $(Tree.targetNode).removeClass('target-node');
                Tree.targetNode = focusingNode;
                $(focusingNode).addClass('target-node');
            }
        },

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
                if( ! $.isEmptyObject(Tree.map) ){
                    $("#modal-export-prompt").modal('show');
                }
                else{
                    var importModal = $('#modal-JSON-import');
                    importModal.modal('show');  
                    importModal.find('.alert').hide();
                    importModal.find('#form-load-custom').hide();
                    importModal.find('#hide-if-load-custom').show(); 
                }
            });

                    
        },
        
        importWarning: function () {
            $("#modal-export-prompt .btn-danger").click(function (e) {
                e.preventDefault();

                // Clean our map immediately ( the user choose not to preserve it. )
                Data.cleanUp();

                $('#modal-export-prompt').on('hidden.bs.modal', function (e) {
                  $('#import').trigger('click');
                });
                
            });

            $("#modal-export-prompt .btn-success").click(function (e) {
                e.preventDefault();

                $('#export').trigger('click');

                // Clean our map when export is done 
                setTimeout(Data.cleanUp,1);
            })
        },
        
        importDialogChooseCustom: function () {
            /*
             * Read custom JSON URL and import it
             */
            $( "#form-load-custom > .btn" ).on( "click" , function(e) {
                e.preventDefault();
                Data.import.loadJSON($("#form-load-custom > input").val());
            });
        },

        importDialogForm: function () {
            /*
             * Load default JSON file
             */
            $( "#load-blank" ).on( "click", function() {
                Data.import.loadJSON(Tree.blankJSONFilePath);
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
                Data.import.loadJSON(Tree.defaultJSONFilePath);
            });

        },

        export: function () {
            /*
             * Export JSON
             */
            $('#export').on('click', function() {
                Data.export.prepareJSON();
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
                });
        },

        showHotKey: function () {
            $('#show-hotkey').click(function () {
                $('#hotkeys').fadeIn('fast');
            });
            $('#hide-hotkey').click(function () {
                $('#hotkeys').fadeOut('fast');
            });
        },

        showPreview: function () {

            $('#show-preview').click(function () {
                var clonedRoot = $.extend(true, {}, Tree.rootNode );
                createPreview( clonedRoot );
                $('#knowledge-map').fadeIn('fast');
                $('#hide-preview').fadeIn('fast');
                $(this).fadeOut('fast');
            });
            $('#hide-preview').click(function () {
                $('#show-preview').fadeIn('fast');
                $('#knowledge-map').fadeOut('fast');
                $(this).fadeOut('fast');
            })
        },

        showCommentTextArea: function () {
            $('#modal-edit-node')
            .on('click', '#modal-add-comment', function () {
                $('#modal-textarea').slideToggle('fast'); 
            });
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
        Tree.init();

        /* Initializing node operations */
        Node.init();

        /* ----------  UI  ---------- */
        UI.importDialogTrigger();
        UI.importDialogForm();
        UI.importDialogChooseCustom();
        UI.importWarning();
        UI.showCommentTextArea();
        UI.showHotKey();
        UI.showPreview();
        UI.export();

        /* Trigger import prompt automatically at startup */
        $('#import').trigger('click');
    });

}());
