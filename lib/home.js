/**
 * Created by Saikrishna on 5/1/2017.
 */
var element = d3.select('.sunburst').node();

var width = element.getBoundingClientRect().width-20,
    height = element.getBoundingClientRect().width-20,
    radius = (Math.min(width, height) / 2) - 10;

var formatNumber = d3.format(",d");

var x = d3.scaleLinear()
    .range([0, 2 * Math.PI]);

var y = d3.scaleSqrt()
    .range([0, radius]);

var color = d3.scaleOrdinal(d3.schemeCategory20b);

var partition = d3.partition();

var arc = d3.arc()
    .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x0))); })
    .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x1))); })
    .innerRadius(function(d) { return Math.max(0, y(d.y0)); })
    .outerRadius(function(d) { return Math.max(0, y(d.y1)); });

var svg = d3.select(".sunburst").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + (height / 2) + ")");

d3.csv("data/Log.csv", function(d) {
    var maindata = d;
    convertToHierarchy(d);
    d.forEach(function(row){
        main.children.filter(function(ele,ind){if(ele.name==row.Medium){medInx=ind;} return ele.name==row.Medium});
        main.children[medInx].children.filter(function(ele,ind){if(ele.name==row.SCAP){scpInx=ind;}return ele.name==row.SCAP});
        main.children[medInx].children[scpInx].children.filter(function(ele,ind){if(ele.name==row.Type){tyInx=ind;}return ele.name==row.Type});
        main.children[medInx].children[scpInx].children[tyInx].children.filter(function(ele,ind){if(ele.name==row.Speaker){spInx=ind;}return ele.name==row.Speaker});
        main.children[medInx].children[scpInx].children[tyInx].children[spInx].size++;
    });
    root = main;
    dump=[];
    maindata.forEach(function(ele){
        ele.Month = fetchMonth(ele.TimeStamp);
        ele.count = 1;
        dump.push(ele.Resource);
    });
    my = [];
    dump.forEach(function(ele){
        var search = _.find(my, function(b) { return b.Resource === ele; });
        if (!search) {
            my.push({ Resource: ele, count: 1 });
        } else {
            _.each(my, function(b){
                if (b.Resource === ele) {
                    b.count += 1;
                }
            });
        }
    });
    my.sort(function(a, b) {
        return -a.count+b.count;
    });
    my.splice(10, my.length-10);
    document.getElementById("loading").style.display = 'none';
    document.getElementById("wrap").style.visibility = 'visible';
    root = d3.hierarchy(root);
    root.sum(function(d) { return d.size; });
    svg.selectAll("path")
        .data(partition(root).descendants())
        .enter().append("path")
        .attr("d", arc)
        .style("fill", function(d) { return color((d.children ? d : d.parent).data.name); })
        .on("click", click)
        .append("title")
        .text(function(d) { return (d.data.name==""?"No Data":d.data.name) + "\n" + formatNumber(d.value); })
        .on("mouseover",function(){console.log(1)});

    var svg1 = dimple.newSvg(".scatter1", width, width/2);
    var svg2 = dimple.newSvg(".scatter2", width, width/2);


    var myChart = new dimple.chart(svg1, maindata);
    myChart.setBounds(30, 30, width-50, (width/2)-100);
    var x = myChart.addCategoryAxis("x", "Month");
    x.addOrderRule("TimeStamp");
    myChart.addMeasureAxis("y", "count");
    myChart.addSeries("SCAP", dimple.plot.bubble);
    myChart.addLegend(180, 10, 360, 20, "right");
    myChart.draw();


    var myChart1 = new dimple.chart(svg2, my);
    myChart1.setBounds(210, 30, width-280, (width/2)-100);
    var x1 = myChart1.addMeasureAxis("x", "count");
    myChart1.addCategoryAxis("y", "Resource");
    x1.addOrderRule("count");
    myChart1.addSeries("count", dimple.plot.bar);
    myChart1.draw();
});

function click(d) {
    svg.transition()
        .duration(750)
        .tween("scale", function() {
            var xd = d3.interpolate(x.domain(), [d.x0, d.x1]),
                yd = d3.interpolate(y.domain(), [d.y0, 1]),
                yr = d3.interpolate(y.range(), [d.y0 ? 20 : 0, radius]);
            return function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); };
        })
        .selectAll("path")
        .attrTween("d", function(d) { return function() { return arc(d); }; });

    document.getElementById("clickTut").style.display='none';
    document.getElementById("clickImg").style.display='none';
}

function convertToHierarchy(d) {
    var uniMed = (fetchUnique(d,"Medium"));
    var uniSC = (fetchUnique(d,"SCAP"));
    var uniTy = (fetchUnique(d,"Type"));
    var uniSp = (fetchUnique(d,"Speaker"));
    main={
        name:"Resources",
        children:[]
    };
    uniMed.forEach(function(ele){
        main.children.push({
            "name":ele,
            "children":[]
        });
    });
    uniSC.forEach(function(ele){
        main.children.forEach(function(item){
            item.children.push({
                "name":ele,
                "children":[]
            });
        })

    });
    uniTy.forEach(function(ele){
        main.children.forEach(function(item){
            item.children.forEach(function(item1){
                item1.children.push({
                    "name":ele,
                    "children":[]
                });
            })
        })
    });
    uniSp.forEach(function(ele){
        main.children.forEach(function(item){
            item.children.forEach(function(item1){
                item1.children.forEach(function(item2){
                    item2.children.push({
                        "name":ele,
                        "size":0
                    });
                })
            })
        })
    });
};

function fetchUnique(d,qu){
    var a = _.uniq(d, function(x){
        return x[qu];
    });

    return (a.map(function(ele){
        return ele[qu];
    }));
}

var fetchMonth = function(str){
    var list=["Jan","Feb","Mar","Apr","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    var month = str.split("/")[0],date = str.split("/")[1];
    return list[Number(month)-1]+"-"+date;
}