function createPreview(root) {
  console.log(root);
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

  enableResponsive();

  /**************************************/

root.children.forEach(function(d) {
    d._children = d.children;
    d.children = null;
});
console.log(root);
update(root);

var linkEnter = null;
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
  linkEnter = link.enter().insert("line", ".node").attr("class", "link");

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


  // alert(d.name);
  // alert(d);
  if (d.children) {
    //目測還有子節點  收縮 節點
    d._children = d.children;
    
    d.children = null;
  } else {
    // console.log(d._children.children );
    //目測無子節點 ex：縮起來的root節點也算
    d.children = d._children;
    //150202 一次只開一層
    if(d.children!=null ){
      d.children.forEach(toggleAll);
    }
    
    d._children = null;

    
    
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

  update();
}

/* Fox, Mouse Up 事件, 2015 - 04 - 21 */
function fix_node(d) {
  d.fixed = true;             /* 設 d.fixed = true 就可以固定節點 */
  console.log(this);
}

//關閉以下全部節點
function toggleAll(d) {
  if (d.children) {
    d._children = d.children;
    d._children.forEach(toggleAll);
    d.children = null;
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


  // collapseChildren(root);

  // update();

  // function update() {

  //   var nodes = flatten(root),
  //     links = d3.layout.tree().links(nodes);
  //   //console.log(links);


  //   // Restart the force layout.
  //   force
  //     .nodes(nodes)
  //     .links(links)
  //     .start();


  //   // Update links.
  //   link = link.data(links, function(d) {
  //     return d.target.id;
  //   });

  //   link.exit().remove();

  //   var linkEnter = link.enter().insert("line", ".node").attr("class", "link");
  //   //新增的線變色
  //   if (linkEnter != null) {
  //     linkEnter.classed("selected", true);
  //   }

  //   // Update nodes.
  //   node = node.data(nodes, function(d) {
  //     return d.id;
  //   });

  //   node.exit().remove();

  //   var nodeEnter = node.enter().append("g")
  //     .attr("class", "node")
  //     .on("click", click)
  //     .call(force.drag)
  //     .on("touchend", fix_node) /* 45, 增加 touch end 事件, 2015 - 07 - 15 */
  //     .on("mouseup", fix_node); /* Fox, 增加 Mouse Up 事件, 2015 - 04 - 21 */
  //   //圈圈大小
  //   nodeEnter.append("circle")
  //     .attr("r", function(d) {
  //       return d.size / 10 || 15;
  //     });

  //   nodeEnter.append("text")
  //     .attr("x", 13)
  //     .attr("dy", ".35em")
  //     .text(function(d) {
  //       return d.name;
  //     });

  //   node.select("circle")
  //     .style("fill", function(d) {
  //       return d._children ? "lightsteelblue" : d.color;
  //     });
  // }

  // function tick() {
  //   link.attr("x1", function(d) {
  //       return d.source.x;
  //     })
  //     .attr("y1", function(d) {
  //       return d.source.y;
  //     })
  //     .attr("x2", function(d) {
  //       return d.target.x;
  //     })
  //     .attr("y2", function(d) {
  //       return d.target.y;
  //     });

  //   node.attr("transform", function(d) {
  //     return "translate(" + d.x + "," + d.y + ")";
  //   });
  // }

  // // Toggle children on click.
  // function click(d) {
  //   if (d3.event.defaultPrevented) {
  //     force.stop();
  //     return; // ignore drag
  //   }

  //   //清除預設
  //   d3.selectAll("line.selected").classed("selected", false);

  //   console.log("clicked: ");
  //   console.log(d);
  //   if (d.children) {
  //     //目測還有子節點  收縮 節點
  //     d._children = d.children;

  //     d.children = null;

  //   } else {

  //     d.children = d._children;

  //     // 一次只開一層
  //     if (d.children != null) {
  //       d.children.forEach(collapseChildrenRecursively);
  //     }

  //     //剩下的連結變色
  //     d3.selectAll("line")
  //       .classed("selected", function(d2) {

  //         if (d2.source.name == d.name || d2.target.name == d.name) {
  //           return true;
  //         } else {
  //           return false;
  //         }

  //       });
  //   }
  //   d3.select("g.selected").classed("selected", false);
  //   d3.select(this).classed("selected", true);
  //   d3.select("g.selected").select("circle");

  //   update();
  // }

  // /* Fox, Mouse Up 事件, 2015 - 04 - 21 */
  // function fix_node(d) {
  //   d.fixed = true; /* 設 d.fixed = true 就可以固定節點 */
  // }

  // function collapseChildren(node) {
  //   console.log("Callapse root:");
  //   console.log(node);
  //   node.children.forEach(function(d) {
  //     d._children = d.children;
  //     d.children = null;
  //   });
  // }
  // //關閉以下全部節點
  // function collapseChildrenRecursively(node) {
  //   console.log("Callapse recursively:");
  //   console.log(node);
  //   if (node.children) {
  //     node._children = node.children;
  //     node._children.forEach(collapseChildrenRecursively);
  //     node.children = null;
  //   }

  // }

  // // Returns a list of all nodes under the root.
  // function flatten(root) {
  //   console.log("flattening root: ");
  //   console.log(root);

  //   var nodes = [],
  //     i = 0;

  //   function recurse(node) {
  //     if (node.children) node.children.forEach(recurse);
  //     if (!node.id) node.id = ++i;
  //     nodes.push(node);
  //   }

  //   recurse(root);
  //   return nodes;
  // }
  // // function flatten(dataMap, rootName) {
  // //       var nodes = [], i = 0;

  // //       function recurse(nodeName) {
  // //         var node = dataMap[ nodeName ];
  // //         if (node.children){
  // //           node._children = [];
  // //           node.children.forEach(function( child, index, children ){
  // //             node._children.push( recurse(child) );
  // //           });
  // //           delete node.children;
  // //         } 

  // //         if (!node.id) node.id = ++i;

  // //         nodes.push(node);
  // //         return node;
  // //       }

  // //       recurse(rootName);
  // //         console.log(nodes);
  // //       return nodes;
  // // }

}

function enableResponsive() {
  var chart = $("#knowledge-map > svg"),
    container = chart.parent();

  $(window).on("resize", function() {
    chart.attr("width", container.width());
    chart.attr("height", container.height());
  }).trigger("resize");

}