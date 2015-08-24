function createPreview(root) {

  var width = window.innerWidth,
      height = window.innerHeight;

  var force = d3.layout.force()
    .linkDistance(80)
    .charge(-200)
    .gravity(.05)
    .size([width, height])
    .on("tick", tick);

  var svg = d3.select("#knowledge-map").append("svg")
    .attr("width", width)
    .attr("height", height);

  var link = svg.selectAll(".link"),
      node = svg.selectAll(".node");

  var nodes = flatten(root);
  collapseRoot();
  update();

  function update() {



    var nodes = flatten(root),
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

    if(linkEnter!=null){
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
        // .attr("r", function(d) { return 12; });
        // .style("stroke", function(d) { return d.type; })
        .attr("r", function(d) { return d.size / 10 || 15; });

    nodeEnter.append("text")
        .attr("x", 13)  
        .attr("dy", ".35em")
        .text(function(d) { return d.name; });

    node.select("circle")
        //.style("fill", function(d) { return d.color; });
        .style("fill", function(d) { return d._children ? "lightsteelblue" : d.color; });
        //.style("stroke-width", function(d) { return d.width;} );

  }

  function tick() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  }

  // Toggle children on click.
  function click(d) {
    if (d3.event.defaultPrevented){
      force.stop();
      return; // ignore drag
    } 

  //清除預設
    d3.selectAll("line.selected").classed("selected", false);

    // If the node has uncollapsed nodes
    if (d.children) {
      collapseNode(d);
    } else {
      openNode(d);
      d.children.forEach( collapseNodeRecursively );
    }
      
    //剩下的連結變色
    d3.selectAll("line")       
        .classed("selected", function(d2) { 

        if(d2.source.name == d.name || d2.target.name == d.name){
          return true; 
        }else{
          return false; 
        }

        });
    d3.select("g.selected").classed("selected", false);
    d3.select(this).classed("selected", true);
    d3.select("g.selected").select("circle");

    update();
  }

  /* Fox, Mouse Up 事件, 2015 - 04 - 21 */
  function fix_node(d) {
    d.fixed = true;             /* 設 d.fixed = true 就可以固定節點 */
  }

  function collapseRoot() {
    if( root.children ){
      root.children.forEach(function (childNode) {
        if(childNode){
          collapseNode(childNode);
        }
      }); 
    }
    
  }

  function collapseNode (node) {
    node._children = node.children;
    node.children = null;
  }

  function openNode (node) {
    node.children = node._children;
    node._children = null;
  }

  function collapseNodeRecursively (child) {
    if( child.children ){
      child.children.forEach( collapseNodeRecursively );
      collapseNode(child);
    }
  }

  // Returns a list of all nodes under the root.
  function flatten(root) {
    var nodes = [], i = 0;

    function recurse(node) {
      if (node.children) node.children.forEach(recurse);
      if (!node.id) node.id = ++i;
      nodes.push(node);
    }

    recurse(root);
    return nodes;
  }


}


