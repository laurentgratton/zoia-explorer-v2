# ZOIA Patch Preview — Product and Implementation Plan

## Status

Proposed. This document captures the product decisions and technical work required to preview the currently edited ZOIA patch in the browser using [Zoia2PD](https://github.com/laurentgratton/Zoia2PD) and `libpd-wasm`.

## 1. Summary

Add a `Preview` workspace beside the existing `Patch` workspace. Preview converts the current in-memory patch to Pure Data, runs it through `libpd-wasm`, and presents a page-based performance surface.

The performance surface is intentionally smaller than the editor. It contains only:

1. Starred parameters and starred connections, because stars identify controls intended for MIDI mapping.
2. Inherently interactive interface modules, such as Pushbuttons, Stompswitches, UI Buttons, and Keyboards, whether or not they are starred.

Ordinary unstarred parameters are not shown.

Audio never starts automatically. Every new playback session and every patch replacement starts with master output at exactly 0% (muted).

## 2. Reference Design

![Page-based Preview with configured-note pads](https://ampcode.com/user-content/attachments/a87e8efa6f62601626ff47ab955dbe6d91452557770f45c4e5729b0121047f2f-file.png)

The mockup is directional rather than an implementation screenshot. Exact labels and values must come from the loaded patch and the converter manifest.

## 3. Goals

- Let users audition the currently edited patch without exporting it to hardware.
- Preserve an explicit, safe audio startup flow with no autoplay and no initial output volume.
- Provide the patch's intended performance controls without duplicating the full editor.
- Organize controls by the same pages and module names used in Patch view.
- Represent each ZOIA Keyboard as its configured ordered note pads rather than as a chromatic piano keyboard.
- Surface conversion, compatibility, and Pure Data runtime diagnostics honestly.
- Cleanly stop or replace audio sessions when the user changes patches, leaves Preview, or closes the page.

## 4. Non-goals

- Firmware-identical ZOIA emulation.
- Displaying every editable module parameter in Preview.
- Editing module configuration or patch structure from Preview.
- Browser MIDI or MIDI learn in the first version. Existing MIDI CC assignments are metadata only.
- Microphone, audio-file, sampler-file, or hardware I/O bridging.
- Recording, waveform timelines, presets, or automation.
- Treating successful engine startup or audible output as proof that every generated Pd object loaded correctly.

## 5. Workspace and Navigation

### 5.1 Top-level workspace

- Add `Patch | Preview` workspace tabs beside the patch name.
- `Patch` continues to show the existing page selector and graph.
- `Preview` shows the Preview page selector and performance surface.
- Both workspaces share `activePage`, so switching workspaces preserves page context.
- Preview must not initialize audio merely because the tab was opened.

### 5.2 Preview pages

- Show all patch pages in patch order, including pages with no eligible Preview controls.
- Group eligible controls by module, preserving module order within the page.
- Preserve module names and colors to make controls easy to correlate with Patch view.
- A page with no eligible controls displays: `No mapped or interactive controls on this page.`
- Page summaries report mapped and interactive counts separately.

For a starred connection that crosses pages, assign it to the destination module's page. This avoids duplication and places modulation strength beside the module it affects. Revisit this rule if hardware behavior or user testing indicates that source-page ownership is more intuitive.

## 6. Control Inclusion Rules

For each page, Preview renders the union of the following sets.

### 6.1 Starred elements

- **Starred parameter:** render a slider or discrete control appropriate to its manifest metadata.
- **Starred connection:** render a connection-strength control.
- Show the yellow star and optional `CC N` badge as passive MIDI-mapping metadata.
- A missing MIDI CC assignment still renders the starred control, without a CC badge.

### 6.2 Interactive interface modules

Initial browser-interactive module types:

| Type ID | Module | Preview control |
| --- | --- | --- |
| 15 | Pushbutton | Momentary hold or latching toggle, according to module options |
| 16 | Keyboard | Ordered grid of configured-note pads |
| 44 | Stompswitch | Large momentary or latching switch labelled with left, middle, right, or external assignment |
| 56 | UI Button | Host-written base state with effective-state feedback; options describe output enabled/disabled and basic/extended range, not momentary/latching action |
| 97 | Euro Pushbutton 1 | Momentary hold or latching toggle |
| 98 | Euro Pushbutton 2 | Momentary hold or latching toggle |

Hardware-dependent interface modules may be listed in a collapsed unavailable section when doing so helps explain missing behavior. MIDI, audio input, CPort, device-control, sampler-file, and other unsupported bridges must not appear enabled.

### 6.3 Deduplication

If an interactive interface element is also starred, render it once as an interface control and add its star/CC metadata. Never create separate mapped and interface copies of the same runtime control.

## 7. Keyboard Representation

A ZOIA Keyboard is not a chromatic piano. It contains 1–40 user-configured notes.

- The configured note count is `module.options[0] + 1`.
- Preserve configured order using parameter indexes `0..N-1`.
- Render one equal-sized rectangular pad per configured note.
- Pads wrap responsively for larger note counts.
- The primary label is the decoded configured pitch, for example `C3`, `D#3`, or `A4`.
- Pointer down sends note press; pointer up, pointer cancel, and lost capture send note release.
- Keyboard activation must provide equivalent press and release behavior for accessibility.
- Multiple pads may be held concurrently; output follows the highest-note priority and retrigger policy in Section 9.3.

### 7.1 Provisional note decoding

The current parser exposes each configured note as a raw unsigned parameter, but neither this repository nor Zoia2PD currently establishes a verified raw-value-to-MIDI-note transformation or octave-label convention. `parameterMax: 65535` is range metadata, not proof of a linear mapping.

Preview may use a clearly identified provisional note/octave decoder so configured pads can display pitch labels. Clamp decoded note and octave values to supported display bounds rather than generating a chromatic layout or allowing invalid labels. Preserve the raw value in the manifest and diagnostics so a corrected transform can be introduced without losing evidence.

To replace the provisional decoder with a verified transform:

1. Collect real ZOIA patch fixtures with known configured Keyboard notes.
2. Determine and test the raw-to-note transformation.
3. Confirm the octave convention used by ZOIA's display.
4. Add shared test vectors to the parser/converter integration tests.

When a value cannot be decoded even provisionally, fall back to `Note 1`, `Note 2`, and so on rather than presenting an invalid pitch name.

## 8. Audio and Interaction Lifecycle

### 8.1 States

```text
converting -> ready -> initializing -> initializedMuted <-> playing <-> paused
                 \             \                         \
                  +-------------+--------------------------> error
```

- **converting:** serialize and convert the current in-memory patch.
- **ready:** Pd source and the control manifest are available; no `AudioContext` exists.
- **initializing:** a direct user gesture creates/resumes audio and starts `libpd-wasm`.
- **initializedMuted:** the engine is running and controls are enabled, but master gain remains zero.
- **playing:** the engine is running with user-selected gain above zero.
- **paused:** the existing `AudioContext` is suspended, preserving Pd state.
- **error:** conversion, worklet startup, context, or runtime failure is visible and retryable.

### 8.2 Safe startup

On a direct Initialize gesture:

1. Create the host-owned `AudioContext`.
2. Create a `GainNode` in that context and set its gain to exactly `0`.
3. Connect the gain node to `audioContext.destination`.
4. Resume the context before awaiting unrelated work.
5. Create the Pd runtime with the already-converted source.
6. Connect with `pd.connect(masterGain)`, never bare `pd.connect()`.
7. Enable performance controls while leaving output muted.

The audio graph is:

```text
Pd AudioWorkletNode -> master GainNode (initially 0) -> AudioContext destination
```

Changing volume should use a short Web Audio gain ramp to avoid clicks. The UI must never restore a non-zero master volume across patch sessions.

### 8.3 Pause, replacement, and cleanup

- Pause and resume reuse the same context and Pd node.
- Leaving Preview pauses playback so audio cannot continue invisibly in Patch view.
- Any patch mutation invalidates the current generated source. Close the active Preview session and return to conversion/ready state rather than playing stale patch data.
- Loading a different patch invalidates pending initialization before closing the prior session.
- Cleanup calls `pd.close()` and then closes the host-owned `AudioContext`.
- Use a generation token to prevent a late async initialization from connecting after replacement or unmount.
- Serialize pause, resume, replacement, and close operations; do not run lifecycle operations concurrently.

## 9. Zoia2PD Changes

Zoia2PD currently returns only a Pd source string. Its generated interactive toggles have no public receive symbols, saved parameters are not generally restored, starred parameters are emitted as text annotations, and starred connections are not emitted as controls. The browser therefore cannot implement this plan without converter work.

Use this compiler flow:

```text
binary parser
  -> pure Preview planner
     (eligible controls, metadata, deduplication, support, warnings)
  -> mapping/group compiler with public control bridges
  -> Pd emitter
```

Add a dedicated `src/zoia2pd/preview.cljc` namespace for manifest planning, schema construction, and address helpers. Do not mix JavaScript response construction into module mapping. The Preview planner should compile a Preview-enabled Pd variant; it must not silently add bridges or otherwise change legacy converter output.

### 9.1 Preserve the existing API

Keep the existing API and its generated output byte-for-byte compatible:

```ts
convertBinary(bytes: ArrayBuffer | Uint8Array): string;
```

Add a browser-oriented conversion API:

```ts
interface BrowserConversion {
  apiVersion: 1;
  pdText: string;
  controls: PreviewControl[];
  warnings: ConversionWarning[];
}

convertBinaryForBrowser(
  bytes: ArrayBuffer | Uint8Array,
): BrowserConversion;
```

Names are provisional, but the returned manifest must be structured and versioned rather than inferred by parsing generated Pd text. Export the new function through `src/zoia2pd/api.cljs` and `shadow-cljs.edn`, declare all public V1 types in `index.d.ts`, and release it as an additive package minor version.

### 9.2 Control manifest

Each eligible control needs enough information for rendering, routing, initial state, and diagnostics. A discriminated union should represent continuous controls, buttons, keyboards, and connection strength rather than one object with many optional fields.

Common fields:

```ts
interface PreviewControlBase {
  id: string;
  page: number;
  moduleIndex: number;
  moduleName: string;
  moduleColor: number;
  label: string;
  receiver: string;
  feedbackSender?: string;
  starred: boolean;
  midiCc?: number;
}
```

Additional kind-specific metadata includes:

- parameter/block index;
- continuous range, units, curve, and initial value only when the transform is known;
- raw saved value separately from the actual Pd-unit base value;
- mapping/support status for controls whose stored-value transform is unknown;
- momentary versus latching action and normal polarity;
- Stompswitch assignment;
- UI Button range and output-enabled options;
- Euro Pushbutton number;
- Keyboard configured-note order and decoded note values when known;
- connection index, source/destination labels, and strength mapping.

Stable IDs and Pd receiver names must derive from patch identities such as module index, block index, and connection index. Do not expose `$0`-expanded symbols because JavaScript cannot know Pd's runtime `$0` value.

Use deterministic global single-token symbols with an API-version prefix. Recommended shapes are:

```text
z2p-v1-param-m<M>-b<B>-base-in
z2p-v1-param-m<M>-b<B>-base-out
z2p-v1-param-m<M>-b<B>-effective-out
z2p-v1-connection-c<C>-strength-in
z2p-v1-connection-c<C>-strength-out
z2p-v1-connection-c<C>-gain-out
z2p-v1-module-m<M>-press-in
z2p-v1-module-m<M>-state-out
z2p-v1-keyboard-m<M>-event-in
z2p-v1-keyboard-m<M>-note-out
z2p-v1-keyboard-m<M>-gate-out
z2p-v1-keyboard-m<M>-trigger-out
```

These identifiers are deterministic for the same serialized patch but are not immutable across module insertion because the binary format contains no module UUID. Module/block/connection indexes are sufficient for Preview; editor-stable UUIDs are not required.

### 9.3 Runtime bridges

- Add a stable `[receive]` path for each eligible parameter.
- Replace the current fixed `[+ base]` path with held modulation plus a held mutable base. Recompute whenever either input changes.
- Browser parameter updates replace the held manual/base value rather than becoming another modulation source.
- Use separate float sends for base-value and effective-value feedback.
- Keep `savedRawValue` distinct from a Pd-unit base. An unknown raw-to-Pd transform must mark a control unavailable and emit a warning rather than infer a mapping from `parameterMax`.
- Add mutable gain stages for starred connections, including unity cords that currently omit the multiplier.
- CV connection stages must hold both source value and raw strength and recompute on either update so held fan-in merge slots receive the new weighted value.
- Audio connections use `[*~]` with a mutable coefficient.
- Preserve the strength conversion `dB = (raw - 10000) / 100` and `gain = 10^((raw - 10000) / 2000)`. Official factory patches prove the valid raw range is at least `0..11200`, mapping to `-100..+12 dB` and gains up to approximately `3.981`.
- Expose raw connection strength with range `0..11200`, step `1`, a dB-amplitude curve, raw-strength feedback, and optional linear-gain feedback. Update both Preview and legacy validation so valid over-unity factory cords are not rejected.
- Cable gain is nonnegative. A negative CV is signal value, remains negative after multiplication by the positive gain, and does not indicate reverse direction or a separate negative cable-polarity field. Preserve the existing source-to-destination connection direction.
- Buttons accept explicit numeric press (`1`) and release (`0`) edges.
- Momentary output is `pressed` for normally-zero and `1 - pressed` for normally-one.
- Latching controls toggle only on a deduplicated `0 -> 1` edge; release does not toggle. Initialize to the normal value without synthesizing a press.
- Stompswitch assignment is metadata; addressing remains per module to avoid collisions.
- UI Button host updates write base state. Subscription callbacks update React state but must never echo the received value back to Pd, preserving the existing `set`-without-output intent.
- Keyboard events use `pd.sendMessage(eventReceiver, "note", [zeroBasedKeyIndex, pressed])`, where `pressed` is `1` or `0`. This remains within `libpd-wasm`'s reliable four-atom message limit.
- Keyboard controls require held-key state and explicit releases, replacing the current one-millisecond pulse fallback. Preserve configured pad order for rendering, but choose the highest decoded/configured note value among held pads for output. Any press or release that changes the selected highest note emits that note, gate `1`, and an ordered trigger `1 -> 0`; final release emits gate `0`. Ignore duplicate presses. Retrigger is required when fallback selects a different held note.

### 9.4 Browser communication

The Explorer uses the public `libpd-wasm` APIs:

```ts
pd.sendFloat(receiver, value);
pd.sendMessage(receiver, selector, values);
pd.subscribe(feedbackSender, handleMessage);
```

`subscribe` returns an unsubscribe closure. Stock `libpd-wasm@0.1.6` worklet subscriptions should be designed around float feedback. Binding is asynchronous and startup telemetry sent from `loadbang` can be missed, so the host subscribes first and then resends manifest initial values. Control messages are asynchronous and are not sample-accurate.

Do not rely on `libpd-wasm` internal control-rewriting helpers or unstable generated GUI positions. Browser audio input remains unsupported by the stock zero-input, stereo-output worklet.

## 10. Explorer Changes

### 10.1 Proposed ownership

```text
src/app/page.tsx
  Workspace tabs and Patch/Preview switching

src/components/preview/PatchPreview.tsx
  Preview layout, page selector, empty/error states

src/components/preview/PreviewModuleCard.tsx
  Module grouping and eligible control dispatch

src/components/preview/controls/*
  Parameter, connection, button, stompswitch, and note-pad controls

src/components/preview/PreviewTransport.tsx
  Initialize, play/pause, output gain, meters, diagnostics

src/lib/preview/controlManifest.ts
  Manifest types, grouping, deduplication, and page ownership

src/lib/preview/pdSession.ts
  AudioContext, GainNode, libpd lifecycle, message bridge, cleanup
```

Use the repository's existing component and test conventions. Adjust file boundaries if implementation shows that fewer components are clearer.

### 10.2 Conversion input

Always preview the current editor state:

```text
Zustand Patch -> serializePatch(patch) -> convertBinaryForBrowser(bytes)
```

Do not reconvert the originally uploaded IndexedDB buffer after the user edits the patch.

Conversion is synchronous in the current Zoia2PD API. Start on the client and measure representative large patches. Move conversion to a module worker only if it blocks interaction noticeably; audio setup and user-gesture handling remain in the client playback controller.

### 10.3 Dependencies and assets

- Pin `libpd-wasm` to exactly `0.1.6` unless the integration is revalidated against a newer release.
- Install a reproducibly built and pinned Zoia2PD package artifact.
- Copy the matching `node_modules/libpd-wasm/assets/libpd-worklet.js` to `public/libpd-wasm/libpd-worklet.js` during install/build.
- Configure `packages: ["vanilla"]` and the deployment-aware worklet URL.
- Keep runtime and worklet versions identical.
- Verify that the deployed worklet URL serves JavaScript rather than an HTML fallback.
- Preserve required third-party license notices.

## 11. Diagnostics and Unsupported Behavior

Keep three error channels distinct:

1. Conversion exceptions.
2. Rejected initialization/context/worklet promises.
3. Pd runtime output from `onPrint` and `onError`.

Diagnostics should remain available after failure, and retry must not require reconverting unless the patch changed. Retain generated Pd source for inspection/download when startup fails.

Structured warnings contain severity, stable code, message, and applicable module, block, or connection references. Initial warning codes should cover:

- `connection-skipped`;
- `unsupported-module`;
- `unsupported-option`;
- `unsupported-host-bridge`;
- `unrestored-parameter`;
- `unknown-parameter-transform`;
- `unsupported-star-target`;
- `keyboard-note-encoding-unknown`;
- `unknown-connection-polarity`;
- `missing-sample`.

Use the same typed warnings as the source for legacy Pd comments and CLI warning strings so the two outputs do not drift.

Display compatibility limitations explicitly. Silence may be valid when a VCA is closed, sample data is absent, or a module is unsupported. A resolved initialization promise does not prove that every Pd object or connection loaded successfully.

## 12. Accessibility and Input Safety

- Every control has an accessible name containing module and control labels.
- Sliders expose current value, minimum, maximum, and units.
- Momentary controls send release on pointer cancel, lost pointer capture, blur, and unmount to avoid stuck gates.
- Latching controls expose pressed state.
- Note pads support focus and keyboard press/release without retriggering from key repeat.
- Focus order follows page, module, and control order.
- Disabled pre-initialization controls explain that audio must be initialized first.
- Color is not the only indication of mapped, active, disabled, or unavailable state.

## 13. Verification Strategy

### 13.1 Zoia2PD unit and integration tests

- Manifest includes only starred elements plus supported interactive interface modules.
- A starred interactive module is emitted once with mapping metadata.
- Controls have stable, collision-free IDs and receiver names.
- Page, module, block, connection, label, and color metadata are correct.
- Cross-page starred connection ownership follows the destination-page rule.
- Momentary controls emit press and release edges.
- Latching and normal-polarity options produce correct Pd behavior.
- Starred connection updates change the intended gain stage across the full `0..11200` factory-observed range, including unity and +12 dB.
- Keyboard manifests contain 1, several, and 40 notes in configured order.
- Keyboard overlap uses highest-note priority, retriggers when selection changes, and does not leave stuck notes.
- Known raw Keyboard fixtures produce independently verified pitch labels.
- Mutable parameter probes verify base updates, modulation updates, and distinct base/effective feedback numerically.
- Mutable CV and audio connection probes cover non-unity, unity, and multi-cord fan-in.
- Duplicate endpoint layouts do not collide in manifest IDs or public symbols.
- UI Button feedback updates do not echo into Pd.
- Legacy `convertBinary` output remains byte-for-byte compatible.
- Public package exports and TypeScript declarations match the runtime API.
- Browser smoke coverage exercises `sendFloat`, `sendMessage`, and float subscriptions against the real worklet.
- Unsupported hardware/MIDI modules produce structured warnings, not false live controls.

### 13.2 Explorer unit/component tests

- Controls group by page and module in patch order.
- Ordinary unstarred parameters are absent.
- Stars and CC badges are metadata and do not reorder controls.
- Deduplication merges starred metadata into interactive controls.
- Empty pages render the correct message.
- Keyboard pads preserve manifest order and wrap responsively.
- Pointer cancel and unmount release held buttons and notes.
- Manifest feedback updates visible control state without feedback loops.
- Conversion always uses the serialized current patch.

### 13.3 Audio/session tests

- Opening Preview creates no `AudioContext` and produces no sound.
- Initialization happens only from a direct user gesture.
- Gain is exactly zero before the Pd node is connected.
- The Pd node connects to the master gain, never directly to destination.
- Pause/resume does not create another context or worklet node.
- Leaving Preview pauses audio.
- Patch mutation/replacement closes the prior engine and resets gain to zero.
- Failed worklet loading closes resources, retains diagnostics, and permits retry.
- A stale pending initialization cannot connect after replacement or unmount.

### 13.4 Browser smoke test

Use a deterministic generated patch that provides asymmetric left/right output and representative controls. Verify initialization, muted startup, gain changes, stereo routing, starred parameter updates, connection strength, momentary/latching buttons, configured-note pads, pause/resume, replacement, diagnostics, and cleanup in a real browser.

### 13.5 Official factory fixture inventory

Source archive: [ZOIA 5 factory patches](https://cdn.shopify.com/s/files/1/0028/5462/files/zoia_5_factory_patches.zip?v=1733755979)

Inspection found 63 parseable patches with 4,580 connections. Of those connections, 161 have strengths above 10,000 and the maximum is 11,200. Use the following focused regression fixtures:

| Fixture | Coverage | SHA-256 |
| --- | --- | --- |
| `045_zoia_With_The_Fish.bin` | 24-key Keyboard with ordered asymmetric scale values | `35797a2d1dad9b53f3101a4ff9447fed8c2f961af40c413e7e776a12d3402620` |
| `049_zoia_VoiVoi.bin` | Three four-pad Keyboards with ascending, descending, and non-note control values | `698f9b75bb180e6d4b80bcbff8533a731c8bf17f71c6c67087b1d00587e7b783` |
| `019_zoia_Fake_Beard.bin` | Pushbutton, Stompswitch, UI Buttons, and both Euro buttons | `71bbca3ddadc8f932cf88c9c3f5428e7cb4b62f1bcde68173d9b2548b5d5b59d` |
| `039_zoia_Duskwalker.bin` | Euro latching normally-one and momentary normally-zero variants | `f7200d11471aba2809c1b8b088cbd403b145098df6980663bfe16301d10f2a42` |
| `004_zoia_Abyss.bin` | Latching Pushbuttons, extended/output-enabled UI Buttons, momentary Stompswitch, and stars | `8169afe076f3d5fe07deca29f3cd115d8043b4644d751459127ebf32bfc044af` |
| `001_zoia_1978_Plate_v2.bin` | UI Button, multiple momentary stomp assignments, and +12 dB connections | `c710e9689fcd0a6563652699d64a1423f8d30c7893ce208979406b9d5ac4c060` |

If binaries are committed, record the archive URL, exact filename, and SHA-256 beside each fixture. The factory set does not cover 1/40-key boundaries or starred interactive-control deduplication; retain synthetic fixtures and add purpose-built real fixtures later.

## 14. Implementation Phases

### Phase 1 — Prove conversion and muted playback

- Package Zoia2PD reproducibly and install pinned `libpd-wasm`.
- Add the worklet asset pipeline.
- Convert the current serialized patch.
- Implement safe session lifecycle and master gain at zero.
- Add transport, diagnostics, cleanup, and browser smoke coverage.

### Phase 2 — Define and implement the converter control contract

- Add the versioned browser conversion result and manifest.
- Add stable receivers/feedback senders.
- Implement starred parameter and starred connection bridges.
- Implement button and Stompswitch semantics.
- Add converter tests before Explorer control UI depends on the contract.

### Phase 3 — Build the page-based performance surface

- Add workspace and Preview page navigation.
- Group and deduplicate manifest controls.
- Render mapped controls and interface controls.
- Implement unavailable and empty states.
- Add accessibility and component coverage.

### Phase 4 — Complete configured-note Keyboard support

- Establish the raw note transformation and octave convention from fixtures.
- Add note metadata and browser press/release support to Zoia2PD.
- Render responsive configured-note pads.
- Test 1-note, multi-note, maximum-note, overlapping, cancellation, and replacement cases.

## 15. Acceptance Criteria

- A loaded patch exposes `Patch` and `Preview` workspaces.
- Preview pages follow the patch's page names and shared active page.
- A page shows only starred parameters/connections and supported interactive interface modules.
- Ordinary unstarred parameters do not appear.
- Starred controls display optional MIDI CC metadata without receiving priority or duplication.
- Keyboards render configured notes as ordered boxes, not piano keys.
- Opening Preview never initializes or plays audio.
- Initialization requires a direct user gesture and connects through a master gain already set to zero.
- Each new or replaced patch session starts muted.
- Leaving Preview pauses audio; changing the patch closes stale playback.
- Conversion, startup, and runtime diagnostics are distinguishable and retryable.
- Automated tests cover control selection, runtime messages, muted startup, races, and cleanup.
- The rendered Preview is visually inspected in ready, initialized-muted, playing, paused, empty-page, unavailable-control, and error states.

## 16. Open Questions and Prerequisites

1. **Verified Keyboard decoding:** replace the permitted provisional decoder with a fixture-backed raw transform and authoritative octave convention.
2. **Saved parameter restoration:** Zoia2PD currently does not generally restore raw saved parameters. Define and validate transforms required for faithful initial playback and displayed values.
3. **UI Button semantics:** factory patches confirm output-enabled/disabled and basic/extended variants, but not a momentary/latching option. Validate host base/effective-feedback behavior without treating UI Button like types 15/44/97/98.
4. **Latch persistence:** button modules have no parameter slots. Their action option is saved, but persisted runtime latch state is not evidenced and should not be inferred.
5. **Control feedback:** decide which controls require effective-value feedback versus base/manual-value feedback.
6. **Package distribution:** choose a reproducible source for the private Zoia2PD package artifact in local development and deployment.
7. **Boundary fixtures:** add purpose-built real fixtures for 1-key and 40-key Keyboards and starred interactive-control deduplication.
8. **Option-dependent star identity:** verify raw block-index behavior under module options that alter visible block layout.

These questions should be resolved with fixtures and tests rather than inferred solely from the `0..65535` stored ranges.
