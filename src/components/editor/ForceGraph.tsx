
import React from "react";
import { runForceGraph } from "./ForceGraphGenerator";
import {usePatchStore} from "@/store/patchStore";
import {Connection, Module} from "@/lib/zoia/types";

export function ForceGraph({ linksData, nodesData }: {linksData: Connection[], nodesData: Module[]}) {
    const containerRef = React.useRef(null);
    const setActivePage = usePatchStore((state) => state.setActivePage);

    React.useEffect(() => {
        let destroyFn;

        if (containerRef.current) {
            const { destroy } = runForceGraph(containerRef.current, linksData, nodesData, (page: number) => {setActivePage(page)});
            destroyFn = destroy;
        }

        return destroyFn;
    });

    return <div ref={containerRef} className="flex-1 overflow-y-auto svgContainer" style={{ height: "100%" }} />;
}