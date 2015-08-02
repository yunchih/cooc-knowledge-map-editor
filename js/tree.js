
(function(){

var tree = {

    init: function  () {
      /* Configurations */
        this.jsonFilePath        = 'data/tree-data-taiwan-history.json';
        this.root_icon           = "glyphicon-folder-open";
        this.node_minus_icon     = "glyphicon-minus";
        this.node_plus_icon      = "glyphicon-plus";
        this.leaf_icon           = "glyphicon-leaf";
        

        /* Global variables */
        this.newNodeDefaultValue = '新增節點';
        this.map        = {};
        this.targetNode = null;
        this.html       = "";
    },


    getIcon: function (node) {
        var icon = this.node_minus_icon;
        if( node.root )
            icon = this.root_icon;
        else if( !node.children )
            icon = this.leaf_icon;
        return icon;
    },
};

var dataImport = {

    init: function (data) {
        var rootNode = this.buildTree(data);
        this.buildHTML(rootNode);
    },

    buildNode: function build ( node, dept ) {

        tree.html += ('<span class="node node-' + dept + '" data-toggle="context"><i class="glyphicon ' + tree.getIcon(node) + '"></i>' + node.name + '</span> ');
        
        dept = dept + 1;
        tree.html += '<ul data-dept=' + dept + ' >';

        if( node.children ){       
            $.each( node.children, function(index, child){
                tree.html += '<li>';
                build( tree.map[child], dept );
                tree.html += '</li>';
            });
        }

        tree.html += '</ul>';

    },


    buildHTML: function (rootNode) {

        tree.html += "<ul><li>";
        this.buildNode(tree.map[rootNode],0);
        tree.html += "</li></ul>";

        $(".tree").append(tree.html);

    },

    buildTree: function(data){

        var rootNode = "";

        $.each( data, function( key, node ) {
            tree.map[ node.name ] = node;
            console.log(node);
        });     

        $.each( data, function( index, node ) {
            
            var parentNode = tree.map[ node.parent ];

            if (parentNode) {

                // If parentNode still doesn't have children, initialize it as empty array and push in a new one.
                ( parentNode.children || (parentNode.children = []) ).push(node.name);
                
            } 
            else {
                // If a node does not have parent, it is the root.
                node.root = true;
                rootNode = node.name;
            }
        });

     
        return rootNode;
    }
};

var dataExport = {

};

var plugin = {

    init: function  () {
        this.collapsible();
        this.contextMenu(); 
        this.modal.process(); 
    },

    collapsible: function (){

        $('.tree li:has(ul)').addClass('parent_li').find(' > span').attr('title', '關閉');
        $('.tree li.parent_li > span').on('click', function (e) {
            var children = $(this).parent('li.parent_li').find(' > ul > li');
            if (children.is(":visible")) {
                children.hide('fast');
                $(this).attr('title', '開啟').find(' > i').addClass(this.node_plus_icon).removeClass(this.node_minus_icon);
            } else {
                children.show('fast');
                $(this).attr('title', '關閉').find(' > i').addClass(this.node_minus_icon).removeClass(this.node_plus_icon);
            }
            e.stopPropagation();
        });
    },

    contextMenu: function() {

        $('.node').on('contextmenu', function () {
            /* Update targetNode ( the one on which user is right clicking ) */
            tree.targetNode = this;
        });

        var $modal = this.modal;

        $('.node').contextmenu({

            parent: this,

            target: '#context-menu',

            onItem: function (context, e) {

                var operation = e.target.id;

                if( operation == "add" ){
                    nodeOp.add();
                    $modal.build('新增','知識節點......');
                }  
                else if( operation == "delete" ){
                    nodeOp.remove( $(tree.targetNode).parent() );               
                    return;
                }  
                else{
                    $modal.build('修改',$(tree.targetNode).text())
                }
                
                $('#modal').modal('show'); 
            }
        })
    },

    modal: {
        
        build: function (title,defaultValue) {
                $('#modal-title').html(title);
                $('#modal-input')
                    .val(defaultValue)
                    .on('click',function(){
                        $(this).select();
                    });
        },

        process: function() {
            /* Update the value of new field constantly */
            $('#modal-input').keyup(function(){
                var input = $('#modal-input').val();
                nodeOp.getContent().replaceWith(input);
            });

            $('#modal-submit').click(function(){
                // If user does not modify the default value when submitting, purge the newly created node.
                if( $(tree.targetNode).text() == this.newNodeDefaultValue ){
                    nodeOp.remove( $(tree.targetNode).closest('li') );
                }
                else{
                    // map[ getNodeContent() ]
                    // insertMap(getNodeContent(), getParentNodeContent())
                }

            });

            $('#modal-cancel').click(function(){
                nodeOp.remove( $(tree.targetNode).closest('li') );
            });
        }
    },
};

var nodeOp = {
    
    init: function () {
        this.newNode = "<li><span class='node' data-toggle='context' >" + tree.newNodeDefaultValue + "</span><ul></ul></li> ";
    },

    add: function () {

        var dept = $(tree.targetNode).siblings('ul').attr('data-dept');

        tree.targetNode = $(this.newNode).appendTo($(tree.targetNode).siblings('ul'));

        tree.targetNode = tree.targetNode.children('.node')
                          .addClass( 'node-' + dept )
                          .prepend('<i class="glyphicon ' + tree.getIcon({}) + '"></i>');  // Prepend leaf glyph

        plugin.contextMenu();
    },

    remove: function (node) {
        // Remove node with animation
        node.hide('slow', function(){ node.remove(); });
    },

    getContent: function () {
        return $(tree.targetNode).contents().last();
    },
};

$(function () {

    tree.init();
    nodeOp.init();
    $.getJSON( tree.jsonFilePath, function( data ) {

        dataImport.init(data);
        plugin.init();

    }).fail(function() {
        console.log( tree.jsonFilePath + " is not found!");
    });

});

}());
