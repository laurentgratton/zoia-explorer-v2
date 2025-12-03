import * as d3 from "d3";
import {getModuleDefinition} from "@/lib/zoia/moduleLib";
import {Connection} from "@/lib/zoia/types";


export function runForceGraph(
    container,
    linksData,
    nodesData,
    onPageChange,
) {
    const transformToLink = (d: Connection) => ({
        source: d.sourceModuleIndex,
        target: d.destModuleIndex,
        strength: d.strength
    });
    const links = linksData.map((d) => Object.assign({}, transformToLink(d)));
    const nodes = nodesData.map((d) => Object.assign({}, d));

    const containerRect = container.getBoundingClientRect();
    const height = containerRect.height;
    const width = containerRect.width;

    function getColorHex(colorIndex: number): string {
        // Based on Binary Format.md (old colors 0-7, extended 8+)
        // We'll just map the basic ones for now or a default.
        const colors: Record<number, string> = {
            0: '#6b7280', // Unknown (Gray)
            1: '#3b82f6', // Blue
            2: '#22c55e', // Green
            3: '#ef4444', // Red
            4: '#eab308', // Yellow
            5: '#06b6d4', // Aqua
            6: '#d946ef', // Magenta
            7: '#ffffff', // White
            // Extended
            8: '#f97316', // Orange
            9: '#84cc16', // Lime
            10: '#14b8a6', // Surf (Teal)
            11: '#0ea5e9', // Sky
            12: '#a855f7', // Purple
            13: '#ec4899', // Pink
            14: '#f43f5e', // Peach (Rose)
            15: '#f59e0b', // Mango (Amber)
        };
        return colors[colorIndex] || '#9ca3af'; // Default Gray
    }

    const onMouseClick = (d, node) => {
        onPageChange(node.page);
        document.querySelectorAll("[data-to='module-" + node.id +"']").forEach(c => {
            c.classList.add('animateTo');
            setTimeout(() => {c.classList.remove('animateTo')}, 3000);
        });
        document.querySelectorAll("[data-from='module-" + node.id +"']").forEach(c => {
            c.classList.add('animateFrom');
            setTimeout(() => {c.classList.remove('animateFrom')}, 3000);
        });
        document.querySelectorAll("." + node.id).forEach(c => {
            c.classList.add('highlighted');
            setTimeout(() => {c.classList.remove('highlighted')}, 3000);
        })
    }

    const drag = (simulation) => {
        const dragstarted = (d) => {
            if (!d.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        };

        const dragged = (d) => {
            if (!d.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        };

        const dragended = (d) => {
            if (!d.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        };

        return d3
            .drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    };

    const simulation = d3
        .forceSimulation(nodes)
        .force("link",
            d3.forceLink(links)
                .id((d,i) => d.index))
        .force("charge", d3.forceManyBody().strength(-500))
        .force("x", d3.forceX())
        .force("y", d3.forceY());
    container.innerHTML = "";
    const svg = d3
        .select(container)
        .append("svg")
        .attr("viewBox", [-width / 2, -height / 2, width, height]);

    const net = svg
        .append("g")
        .attr('width', width)
        .attr('height', height);

    const zoom = d3.zoom();
    const zoom_handler = zoom
        .on("zoom", zoom_actions);

    function zoom_actions(d){
        net.attr("transform", d.transform)
    }

    zoom_handler(svg);

    const linkNode = net
        .selectAll("line")
        .data(links)
        .enter()
        .append("g");

    const link = linkNode
        .append("line")
        .attr("class", "link-group")
        .attr("stroke", "#fff")
        .attr("stroke-opacity", 0.6)
        .style("stroke-dasharray", ("5, 3"))
        .style("transition", "stroke-dashoffset 0s")
        .style("stroke-dashoffset", "0")
        .attr('data-from', (d) => 'module-' + d.source.id)
        .attr('data-to', (d) => 'module-' + d.target.id);



    const node = net
        .selectAll("circle")
        .data(nodes)
        .enter()
        .append("g");

    const d3Nodes = node
        .append("circle")
        .attr("r", 10)
        .attr("fill", (d) => getColorHex(d.color))
        .on("click", onMouseClick)
        .call(drag(simulation));

    const label = node
        .append("text")
        .attr("class", "node-labels")
        .text(function(d) { return getModuleDefinition(d.typeId)?.name})
        .attr('font-size', '10px')
        .attr('fill', '#fff');

    simulation.on("tick", () => {
        //update link positions
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        // update node positions
        d3Nodes
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        // update label positions
        label
            .attr("x", d => { return d.x; })
            .attr("y", d => { return d.y; })
    });

    return {
        destroy: () => {
            simulation.stop();
        },
        nodes: () => {
            return svg.node();
        }
    };
}