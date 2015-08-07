

function createPreview (data) {

  var width = window.innerWidth,
      height = window.innerHeight,
      root;

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

  // *********** Convert flat data into a nice tree ***************
  // create a name: node map

  var dataMap = data.reduce(function(map, node) {
    map[node.name] = node;
    return map;
  }, {});

  // create the tree array
  var treeData = [];
  data.forEach(function(node) {
    // add to parent
    var parent = dataMap[node.parent];
      //console.log(node.name);
    if (parent) {
      // create child array if it doesn't exist
      (parent.children || (parent.children = []))
        // add node to child array
        .push(node);
      k_array = [node.name];
      var next = dataMap[node.parent];
      while(next){
        // console.log(next.name);
        k_array.push(next.name);
        var next = dataMap[next.parent];
      }
    } else {
      // parent is null or missing
      k_array = [];
      treeData.push(node);
    }
  });
  k_array = k_array.reverse();

  root = treeData[0];
  var nodes = flatten(root);


  root.children.forEach(function(d) {
    if(d.name == k_array[1]){
      d.children.forEach(function(d) {
        if(d.name == k_array[2]){
          
        }else{
          d._children = d.children;
          d.children = null;
        }
      });
    }else{
      d._children = d.children;
      d.children = null;
    }
    
  });
  update();
  var linkEnter = null;



  function update() {

        var nodes = flatten(root),
            links = d3.layout.tree().links(nodes);
        //console.log(links);
        

        // Restart the force layout.
        force
            .nodes(nodes)
            .links(links)
            .start();
        

        // Update links.
        link = link.data(links, function(d) { return d.target.id; });

        link.exit().remove();
        linkEnter = link.enter().insert("line", ".node").attr("class", "link");
        //新增的線變色
      	console.log("linkEnter:"+linkEnter);
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
  
}

function enableResponsive () {
  var chart = $("#knowledge-map > svg"),
      container = chart.parent();
      
  $(window).on("resize", function() {
      chart.attr("width", container.width());
      chart.attr("height", container.height());
  }).trigger("resize");

}
