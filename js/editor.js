
var tree = {
	jsonFilePath: 'data/tree-data.json',
	root_icon: "icon-folder-open",
	node_icon: "icon-minus-sign",
	leaf_icon: "icon-leaf",	
	map: {},
	html: ""
};

function getIcon(node) {
	var icon = tree.node_icon;
	if( node.root )
		icon = tree.root_icon;
	else if( !node.children )
		icon = tree.leaf_icon;
	return icon;
};

function insertNode( node, dept ) {

	console.log("Current: " + node.name);
	

	tree.html += '<span class="node" data-toggle="context"><i class="' + getIcon(node) + ' node-' + dept + '"></i>' + node.name + '</span> ';

	if( node.children ){
		tree.html += '<ul>';
		console.log(node.children);
		$.each( node.children, function(index, child){
			tree.html += '<li>';
			insertNode( tree.map[child], dept+1, tree.html );
			tree.html += '</li>';
		});

		tree.html += '</ul>';
		
	}
	else{
		console.log("Leaf");
	}

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
	console.log(tree.html);
}

$(function () {

	$.getJSON( tree.jsonFilePath, function( data ) {

		var rootNode = buildTree(data);
		buildHTML(rootNode);
		
	});
	
});


