# Task List: Zoia Patch Web Editor

## Relevant Files

- `src/lib/zoia/types.ts` - TypeScript definitions for Zoia Patch, Module, Connection, and Parameter structures.
- `src/lib/zoia/parser.ts` - Logic for parsing raw binary `.bin` files into the Patch object.
- `src/lib/zoia/serializer.ts` - Logic for converting the Patch object back into binary format.
- `src/services/db.ts` - Wrapper for `IndexedDB` to handle storing and retrieving patches.
- `src/store/patchStore.ts` - Global state management (Zustand) for the currently active patch.
- `src/components/editor/NodeGraph.tsx` - Main React Flow canvas component for visualization.
- `src/components/editor/ModuleNode.tsx` - Custom Node component representing a Zoia module.
- `src/components/library/PatchLibrary.tsx` - Sidebar component for managing stored patches.
- `src/components/library/PatchUploader.tsx` - Component handling file upload and initial parsing.

### Notes

- The binary specification is in `Binary Format.pdf`. Ensure all parsing logic strictly follows this spec (handling endianness, likely Little Endian).
- Unit tests for the parser/serializer are critical and should be comprehensive.
- Use `npx jest` to run tests.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch for this feature (e.g., `git checkout -b feature/zoia-editor`)

- [x] 1.0 Project Infrastructure & Storage Setup
  - [x] 1.1 Install required dependencies: `idb` (for IndexedDB), `zustand` (state), and `@xyflow/react` (or `reactflow`).
  - [x] 1.2 Create `src/services/db.ts` to initialize IndexedDB with a store for patches.
  - [x] 1.3 Define TypeScript interfaces for `Patch`, `Module`, `Connection`, and `Param` in `src/lib/zoia/types.ts`.
  - [x] 1.4 Create `src/store/patchStore.ts` using Zustand to hold the current loaded patch state.
  - [x] 1.5 Create the main Layout shell (Sidebar for Library + Main Content area for Graph).

- [x] 2.0 Binary Parsing & Serialization Engine
  - [x] 2.1 Implement `parsePatch(arrayBuffer): Patch` in `src/lib/zoia/parser.ts` (referencing `Binary Format.pdf`).
  - [x] 2.2 Implement `serializePatch(patch): ArrayBuffer` in `src/lib/zoia/serializer.ts`.
  - [x] 2.3 Write unit tests `src/lib/zoia/parser.test.ts` to verify parsing of sample `.bin` files (mock data if needed).
  - [x] 2.4 Write unit tests `src/lib/zoia/serializer.test.ts` to verify round-trip consistency (Parse -> Serialize -> Parse equals original).

- [x] 3.0 Patch Library Management & UI
  - [x] 3.1 Create `PatchUploader` component to accept `.bin` files, parse them using the engine, and validate.
  - [x] 3.2 Implement `savePatchToLibrary` in `db.ts` and connect it to the Uploader (save parsed data + metadata).
  - [x] 3.3 Create `PatchLibrary` sidebar component to list patches stored in IndexedDB.
  - [x] 3.4 Implement loading a patch from Library into the global `patchStore`.
  - [x] 3.5 Implement deleting a patch from the Library.
  - [x] 3.6 Implement "Download Patch" button to serialize current store state and trigger file download.

- [x] 4.0 Interactive Node Graph Visualization
  - [x] 4.1 Initialize React Flow canvas in `src/components/editor/NodeGraph.tsx`.
  - [x] 4.2 Create custom node component `ModuleNode.tsx` to display module name and basic info.
  - [x] 4.3 Implement a transformer/selector to map `patchStore` data (modules/connections) to React Flow `nodes` and `edges`.
  - [x] 4.4 Handle `onNodesChange` to support dragging nodes (updating position in the store).

- [x] 5.0 Patch Editor Logic & State Management
  - [x] 5.1 Implement "Add Connection" logic (validating inputs/outputs and updating store).
  - [x] 5.2 Implement "Remove Connection" logic (UI interaction and store update).
  - [x] 5.3 Create a "Module Palette" or "Add Module" button to allow adding new modules to the patch.
  - [x] 5.4 Implement "Remove Module" logic.
  - [x] 5.5 Create a `ParameterEditor` component (side panel or modal) to view and edit module parameters.
