import d3 from 'd3';

export const container = document.createElement('div');
const networkWidth = 800;
const networkHeight = 800;
const modules = patch.modules;
const svg = d3.select(container)
    .append('svg');
const net = svg
    .attr('width',networkWidth)
    .attr('height', networkHeight)
    .append('g');

const linkNode = net
    .selectAll("line")
    .data(patch.connections)
    .enter()
    .append("g");
const link = linkNode
    .append("line")
    .style("stroke", "#aaa")
    //.style("stroke-width", d => d.strength / 1000)
    .style("stroke-dasharray", ("5, 3"))
    .style("transition", "stroke-dashoffset 0s")
    .style("stroke-dashoffset", "0")
    .attr('data-to', d => 'graph' + d.origin.id)
    .attr('data-from', d => 'graph' + d.destination.id)
    .style('stroke-width', d => d.strength / 5000)

const node = net
    .selectAll("circle")
    .data(modules)
    .enter()
    .append("g");

const circles = node
    .append("circle")
    .attr("r", "10")
    .style("fill", function(d) {return patch.colors[d.color].hexColor;})
    .attr("id", function(d) {return "graph" + d.id})
    .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
    .on('click', function(d) {
        document.querySelectorAll("[data-to='graph" + d.id +"']").forEach(c => {
            c.classList.add('animateTo');
            setTimeout(() => {c.classList.remove('animateTo')}, 3000);
        });
        document.querySelectorAll("[data-from='graph" + d.id +"']").forEach(c => {
            c.classList.add('animateFrom');
            setTimeout(() => {c.classList.remove('animateFrom')}, 3000);
        });
    });

const labels = node
    .append("text")
    .attr("class", "node-labels")
    .text(function(d) { return d.typeName})
    .attr('x', 12)
    .attr('y', 3)

const simulation = d3.forceSimulation(modules)
    .force("link", d3.forceLink()
        .id(function(d) { return d.id})
        .links(patch.connections)
    )
    .force("charge", d3.forceManyBody().strength(-500))
    .force("center", d3.forceCenter(networkWidth / 2, networkHeight / 2))
    .on("tick", ticked);

const drag_handler = d3.drag()
    .on("start", drag_start)
    .on("drag", drag_drag)
    .on("end", drag_end);

drag_handler(node);

const zoom = d3.zoom();
const zoom_handler = zoom
    .on("zoom", zoom_actions);

zoom_handler(svg);

function ticked(){
    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
    })
}
function dragstarted(d) {
    if (!d.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(d) {
    d.fx = d.x;
    d.fy = d.y;
}

function dragended(d) {
    if (!d.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}
function drag_start(d) {
    d3.select(this)
        .attr("cx", d.x )
        .attr("cy", d.y );
}

//make sure you can't drag the circle outside the box
function drag_drag(d) {
    d.fx = d.x;
    d.fy = d.y;
}

function drag_end(d) {
    if (!d.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}
function zoom_actions(){
    net.attr("transform", d3.event.transform)
}