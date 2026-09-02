import React, {useEffect, useRef, useState} from 'react';
import { usePatchStore } from '@/store/patchStore';
import {ForceGraph} from "@/components/editor/ForceGraph";

const DEFAULT_PANEL_WIDTH = 720;
const MIN_PANEL_WIDTH = 320;
const MAX_PANEL_WIDTH = 1200;

export default function SignalSection() {

    const { patch } = usePatchStore();
    const [isOpen, setIsOpen] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_WIDTH);
    const [nodes, setNodes] = useState(patch?.modules || []);
    const [links, setLinks] = useState(patch?.connections || []);
    const [patchId, setPatchId] = useState(patch?.name);
    const panelRef = useRef<HTMLDivElement>(null);
    const resizeStart = useRef<{ x: number; width: number } | null>(null);

    useEffect(() => {
        if (isOpen) {
            setNodes(patch?.modules || []);
            setLinks(patch?.connections || []);
        }
    }, [isOpen, patch]);

    useEffect(() => {
        if (patch?.name !== patchId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsOpen(false);
            setPatchId(patch?.name);
            setNodes(patch?.modules || []);
            setLinks(patch?.connections || []);
        }
    }, [patch, patchId]);

    const constrainWidth = (width: number) => Math.min(
        Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, window.innerWidth - 48)),
        Math.max(MIN_PANEL_WIDTH, width),
    );

    const startResize = (event: React.PointerEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        resizeStart.current = {
            x: event.clientX,
            width: panelRef.current?.getBoundingClientRect().width ?? panelWidth,
        };
        setIsResizing(true);
    };

    const resize = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!resizeStart.current) return;
        const { x, width } = resizeStart.current;
        setPanelWidth(constrainWidth(width + x - event.clientX));
    };

    const stopResize = () => {
        resizeStart.current = null;
        setIsResizing(false);
    };

    const resizeWithKeyboard = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        setPanelWidth((width) => constrainWidth(width + (event.key === 'ArrowLeft' ? 20 : -20)));
    };

    return (
        <div
            ref={panelRef}
            className={`absolute top-0 right-0 h-full max-w-[calc(100vw-3rem)] bg-gray-900 border-l border-gray-700 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'} ${isResizing ? 'select-none' : ''}`}
            style={{width: panelWidth}}
        >
            {isOpen && (
                <div
                    role="separator"
                    aria-label="Resize Signal Path panel"
                    aria-orientation="vertical"
                    aria-valuemin={MIN_PANEL_WIDTH}
                    aria-valuemax={MAX_PANEL_WIDTH}
                    aria-valuenow={panelWidth}
                    tabIndex={0}
                    title="Drag to resize Signal Path"
                    className="absolute inset-y-0 -left-1.5 z-10 w-3 cursor-ew-resize touch-none focus:outline-none group"
                    onPointerDown={startResize}
                    onPointerMove={resize}
                    onPointerUp={stopResize}
                    onPointerCancel={stopResize}
                    onLostPointerCapture={stopResize}
                    onKeyDown={resizeWithKeyboard}
                >
                    <div className={`mx-auto h-full w-0.5 transition-colors ${isResizing ? 'bg-yellow-500' : 'bg-transparent group-hover:bg-yellow-500 group-focus:bg-yellow-500'}`} />
                </div>
            )}

            {/* Toggle Handle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="absolute top-15 -left-10 w-10 h-10 bg-gray-800 border-y border-l border-gray-700 rounded-l-md flex items-center justify-center text-yellow-500 hover:text-yellow-400 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)] focus:outline-none cursor-pointer"
                title={isOpen ? "Close Signal Path" : "Open Signal Path"}
            >
                <span className="text-lg leading-none">
                    <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true"
                         xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 22 21">
                        <path stroke="#F0B100" strokeLinecap="round" strokeWidth="2"
                              d="M7.24 7.194a24.16 24.16 0 0 1 3.72-3.062m0 0c3.443-2.277 6.732-2.969 8.24-1.46 2.054 2.053.03 7.407-4.522 11.959-4.552 4.551-9.906 6.576-11.96 4.522C1.223 17.658 1.89 14.412 4.121 11m6.838-6.868c-3.443-2.277-6.732-2.969-8.24-1.46-2.054 2.053-.03 7.407 4.522 11.959m3.718-10.499a24.16 24.16 0 0 1 3.719 3.062M17.798 11c2.23 3.412 2.898 6.658 1.402 8.153-1.502 1.503-4.771.822-8.2-1.433m1-6.808a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/>
                    </svg>
                </span>
            </button>

            {/* Header */}
            <div className="p-4 border-b border-gray-700 bg-gray-800 flex justify-between items-center shrink-0">
                <h3 className="text-sm font-bold text-gray-200 uppercase flex items-center gap-2">
                    Signal Path
                </h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4" id="signal-path-container" style={{height: 'calc(100% - 100px)'}}>
                {isOpen && (<ForceGraph linksData={links} nodesData={nodes} />)}
            </div>
        </div>
    );
}
