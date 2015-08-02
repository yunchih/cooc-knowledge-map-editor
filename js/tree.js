
var tree = {

    /* Configurations */
    jsonFilePath:       'data/tree-data-taiwan-history.json',
    root_icon:          "glyphicon-folder-open",
    node_minus_icon:    "glyphicon-minus",
    node_plus_icon:     "glyphicon-plus",
    leaf_icon:          "glyphicon-leaf", 
    newNodeDefaultValue: '新增節點',

    /* Global variables */
    newNode: "",
    map: {},
    html: "",
    targetNode: null
};

tree.newNode = "<li><span class='node' data-toggle='context' >" + tree.newNodeDefaultValue + "</span></li> ";

function getIcon(node) {
    var icon = tree.node_minus_icon;
    if( node.root )
        icon = tree.root_icon;
    else if( !node.children )
        icon = tree.leaf_icon;
    return icon;
};

function insertNode( node, dept ) {
 
    tree.html += '<span class="node node-' + dept + '" data-toggle="context"><i class="glyphicon ' + getIcon(node) + '"></i>' + node.name + '</span> ';
    
    dept = dept + 1;
    tree.html += '<ul data-dept=' + dept + ' >';

    if( node.children ){       
        $.each( node.children, function(index, child){
            tree.html += '<li>';
            insertNode( tree.map[child], dept, tree.html );
            tree.html += '</li>';
        });
    }

    tree.html += '</ul>';
};

function buildTree(data){

    var rootNode = "";

    $.each( data, function( key, node ) {
        tree.map[ node.name ] = node;
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

function buildHTML (rootNode) {

    tree.html += "<ul><li>";
    insertNode(tree.map[rootNode],0);
    tree.html += "</li></ul>";
    $(".tree").append(tree.html);

}

function addCollapsibility () {

    $('.tree li:has(ul)').addClass('parent_li').find(' > span').attr('title', '關閉');
    $('.tree li.parent_li > span').on('click', function (e) {
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

}

function addNewNode () {

    var dept = $(tree.targetNode).siblings('ul').attr('data-dept');

    tree.targetNode = $(tree.newNode).appendTo($(tree.targetNode).siblings('ul'));

    tree.targetNode.children('.node')
                    .addClass( 'node-' + dept )
                    .prepend('<i class="glyphicon ' + getIcon({}) + '"></i>');  // Prepend leaf glyph

}

function removeNode (node) {
    // Remove node with animation
    node.hide('slow', function(){ node.remove(); });
}

function processModalInput () {
    /* Update the value of new field constantly */
    $('#modal-input').keyup(function(){
        var input = $('#modal-input').val();
        $(tree.targetNode).children('.node').contents().last().replaceWith(input);
    });

    $('#modal-submit').click(function(){
        // If user does not modify the default value when submitting, purge the newly created node.
        if( $(tree.targetNode).children('.node').text() == tree.newNodeDefaultValue )
            removeNode( $(tree.targetNode) );
    });

    $('#modal-cancel').click(function(){
        removeNode( $(tree.targetNode) );
    });
}

function addContextMenu () {

    $('.node').on('contextmenu', function () {
        /* Update targetNode ( the one on which user is right clicking ) */
        tree.targetNode = this;
    });

    $('.node').contextmenu({

        target: '#context-menu',

        onItem: function (context, e) {

            var operation = e.target.id;

            if( operation == "add" ){

                addNewNode();
                $('#modal-title').html('新增');

                /* Add default value to input field */
                $('#modal-input').val("知識節點......").on('click',function(){
                    $(this).select();
                });

            }  
            else if( operation == "delete" ){

                removeNode( $(tree.targetNode).parent() );               
                return;

            }  
            else{

                $('#modal-title').html('修改');
                $('#modal-input').val($(tree.targetNode).text());

            }
                

            
            $('#modal').modal('show'); 
        }
    });

}

$(function () {

    $.getJSON( tree.jsonFilePath, function( data ) {

        var rootNode = buildTree(data);
        buildHTML(rootNode);
        addCollapsibility();
        addContextMenu();  
        processModalInput();

    }).fail(function() {
        console.log( tree.jsonFilePath + " is not found!");
    });

});


