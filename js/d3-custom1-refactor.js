/****
***
**
*

1. remove k_array
2. seperate node open/collapse into seperate functions.
3. wrap the whole file into a self-calling anomynous function to prevent global variable pollution.
4. remove some console.log
5. seperate line color manipulation into seperate function.
6. rename variable/function names  
*
**
***
****/



(function(){ 

  var width = 750,
      height = 450,
      root;

  var force = d3.layout.force()
      .linkDistance(80)
      .charge(-200)
      .gravity(.05)
      .size([width, height])
      .on("tick", tick);

  var svg = d3.select("#km").append("svg")
      .attr("width", width)
      .attr("height", height);

  var link = svg.selectAll(".link"),
      node = svg.selectAll(".node");
  
  var knowledge_map_session;

  // *********** Convert flat data into a nice tree ***************
  var dataMap = data.reduce(function(map, node) {
    map[node.name] = node;
    return map;
  }, {});

  data.forEach(function(node) {
    var parent = dataMap[node.parent];
    if (parent) {
      // create child array if it doesn't exist
      (parent.children || (parent.children = []))
        // add node to child array
        .push(node);
    } else {
      root = node;
    }
  });

  var nodes = getAllChildrenNode(root);
  collapseRoot();
  update();
    
  function update() {

    var nodes = getAllChildrenNode(root),
        links = d3.layout.tree().links(nodes);

    // Restart the force layout.
    force
        .nodes(nodes)
        .links(links)
        .start();
    

    // Update links.
    link = link.data(links, function(d) { return d.target.id; });

    link.exit().remove();
    var linkEnter = link.enter().insert("line", ".node").attr("class", "link");

  	if( linkEnter != null ){
    		linkEnter.classed("selected",true);
    }

    // Update nodes.
    node = node.data(nodes, function(d) { return d.id; });

    node.exit().remove();

    var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .on("click", click)
        .call(force.drag)
        .on("touchend", fix_node)  /* 45, 增加 touch end 事件, 2015 - 07 - 15 */
  	    .on("mouseup", fix_node);  /* Fox, 增加 Mouse Up 事件, 2015 - 04 - 21 */
    //圈圈大小
    nodeEnter.append("circle")
        .attr("r", function(d) { return d.size / 10 || 15; });

    nodeEnter.append("text")
        .attr("x", 13)  
        .attr("dy", ".35em")
        .text(function(d) { return d.name; });

    node.select("circle")
        .style("fill", function(d) { return d._children ? "lightsteelblue" : d.color; });

  }

  function tick() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  }

  // Toggle children on click.
  function click(node) {
    if (d3.event.defaultPrevented){
    	force.stop();
    	return; // ignore drag
    } 

    // If the node has uncollapsed nodes
    if (node.children) {
      collapseNode(node);
    } else {
      openNode(node);
      node.children.forEach( collapseNodeRecursively );
    }
    
    toggleLineColor();

    setSession(node.name);

    update();

  }

  function fix_node(node) {
  	node.fixed = true;             /* 設 node.fixed = true 就可以固定節點 */
  }

  function toggleLineColor () {
    //清除預設
    d3.selectAll("line.selected").classed("selected", false);

    //剩下的連結變色
    d3.selectAll("line")       
        .classed("selected", function(d2) { 

        if(d2.source.name == d.name || d2.target.name == d.name){
          return true; 
        }else{
          return false; 
        }

        });
    }

    d3.select("g.selected").classed("selected", false);
    d3.select(this).classed("selected", true);
    d3.select("g.selected").select("circle");
  }

  function collapseRoot() {
    root.children.forEach(function (childNode) {
      if(childNode){
        collapseNode(childNode);
      }
    });
  }

  function collapseNode (node) {
    node._children = node.children;
    node.children = null;
  }

  function openNode (node) {
    node.children = node._children;
    node._children = null;
  }

  function collapseNodeRecursively (node) {
    if( node.children ){
      node.children.forEach( collapseNodeRecursively );
      collapseNode(node);
    }
  }

  // Returns a list of all nodes under the root.
  function getAllChildrenNode(root) {
    var nodes = [], i = 0;

    function recurse(node) {
      if (node.children) node.children.forEach(recurse);
      if (!node.id) node.id = ++i;
      nodes.push(node);
    }

    recurse(root);
    return nodes;
  }

  function setSession(knowledge_map_name){
    $.ajax({
        type: 'POST',
        url: base_url+"kmap/setSession",
        data: {knowledge_map_name: knowledge_map_name},
        success: function(){
        	$(".hideData").empty();
          showData(knowledge_map_name);
        }
    });
  }

})();