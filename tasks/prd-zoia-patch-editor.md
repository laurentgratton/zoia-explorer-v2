# Product Requirements Document: Zoia Patch Web Editor

## 1. Introduction/Overview
This project aims to build a web-based application for the Empress Effects Zoia pedal. It allows users to upload binary patch files, visualize the internal signal routing using an interactive node graph, manage a local library of patches, and edit the patch contents (modules, connections, parameters).

## 2. Goals
- **Parsing:** Correctly read and write Zoia binary patch files.
- **Visualization:** Provide a clear, interactive graphical representation of the patch structure (Node Graph).
- **Editing:** Enable users to modify patch data (add/remove modules, change connections, edit parameters).
- **Persistence:** Persist the user's patch library within the browser so data is retained between sessions.

## 3. User Stories
- **US.1:** As a user, I want to upload a `.bin` file from my computer so that I can view its contents.
- **US.2:** As a user, I want to view my patch as a graph of connected nodes so that I can understand the signal flow.
- **US.3:** As a user, I want to drag nodes around the canvas to organize the visualization.
- **US.4:** As a user, I want to change a parameter value (e.g., LFO frequency) and save the patch.
- **US.5:** As a user, I want to download the modified patch as a `.bin` file to load it back to my Zoia.
- **US.6:** As a user, I want my uploaded patches to remain in the app when I reload the page (using browser storage).
- **US.7:** As a user, I want to delete patches I no longer need from my library.

## 4. Functional Requirements

### 4.1 File Handling
1.  The system MUST allow users to select and upload local `.bin` Zoia patch files.
2.  The system MUST parse the binary format as defined in `Binary Format.pdf` (or provided spec).
3.  The system MUST serialize the internal state back to a valid `.bin` file for download.

### 4.2 Visualization (Node Graph)
4.  The system MUST represent each Module in the patch as a "Node" on the canvas.
5.  The system MUST represent signal connections as "Wires" or lines between Nodes.
6.  The system MUST allow users to pan and zoom the graph canvas.
7.  The system MUST allow users to drag Nodes to new positions.

### 4.3 Editing
8.  The system MUST allow users to edit the values of Module parameters.
9.  The system MUST allow users to create new connections between compatible ports.
10. The system MUST allow users to delete existing connections.
11. The system MUST allow users to add new Modules from a list of available Zoia modules.
12. The system MUST allow users to remove Modules.

### 4.4 Library Management (Persistence)
13. The system MUST store the binary data and metadata of uploaded patches in the browser (e.g., using IndexedDB).
14. The system MUST display a list of stored patches ("Library").
15. The system MUST allow users to load a patch from the Library into the Editor.
16. The system MUST allow users to delete patches from the Library.

## 5. Non-Goals (Out of Scope)
- **Cloud Sync:** No user accounts or server-side storage.
- **Audio Synthesis:** The app will not generate sound or emulate the DSP.
- **Hardware Interface:** No direct MIDI/USB communication with the pedal; file transfer is manual (SD card style).
- **Firmware Updates:** The app does not handle firmware files, only patches.

## 6. Design Considerations
- **UI Layout:** Sidebar for Patch Library and Module Palette; Main area for Node Graph.
- **Graph Library:** Consider using a library like `React Flow` or `xyflow` for the node graph implementation to handle dragging, zooming, and connections out-of-the-box.
- **Performance:** Zoia patches can have many modules. The graph rendering should remain performant.

## 7. Technical Considerations
- **Tech Stack:** Next.js (React) as per the project structure.
- **Storage:** Use `IndexedDB` (via a wrapper like `idb` or `Dexie.js`) because `localStorage` has a small size limit (usually 5MB) which might fill up with multiple binary patches.
- **Binary Parsing:** Use `ArrayBuffer` and `DataView` in TypeScript to strictly parse the binary structure. Ensure endianness is handled correctly (likely Little Endian, check spec).
- **State Management:** A global store (e.g., Zustand or Redux) is recommended to manage the complex state of the patch (modules list, connections list) separate from the UI.

## 8. Success Metrics
- Users can upload a valid patch, make a change (e.g., rename a module), download it, and the file works correctly on the physical Zoia hardware.
- The application loads the library instantly on page refresh.

## 9. Open Questions
- **Binary Format Spec:** `Binary Format.pdf` was not readable by the AI. The developer must verify they have access to the correct specification.
- **Validation:** How do we validate that a connection is "legal" (e.g. audio to CV)? Does the binary format enforce this, or must the UI prevent it? (Assume UI should try to prevent obvious mismatches if possible).
