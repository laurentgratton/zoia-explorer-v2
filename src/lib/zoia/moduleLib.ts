export interface BlockDefinition {
  name: string;
  direction: number; // 0: input, 1: output
  type: number; // 0: audio, 1: cv
  hasParameter?: boolean;
  parameterMax?: number;
  parameterMin?: number;
}

export interface OptionDefinition {
  name: string;
  values: string[]|number[];
}

export interface BlockCalcOptions {
  blocks: BlockDefinition[];
  options: number[];
}

export interface ModuleDefinition {
  typeId: number;
  name: string;
  category: string;
  minBlocks: number;
  maxBlocks: number;
  blocks: BlockDefinition[];
  options: OptionDefinition[];
  calcBlocks: (options: BlockCalcOptions) => BlockDefinition[];
}

export const MODULE_DEFINITIONS: Record<number, ModuleDefinition> = {
  0: { typeId: 0, name: "SV Filter", category: "Audio", blocks: [{"name": "audio in", "direction": 0, "type": 0}, {"name": "frequency", "direction": 0, "hasParameter": true, "type": 1}, {"name": "resonance", "direction": 0, "hasParameter": true, "type": 1}, {"name": "lowpass output", "direction": 1, "type": 0}, {"name": "hipass output", "direction": 1, "type": 0}, {"name": "bandpass output", "direction": 1, "type": 0}], options: [{"name": "low pass output", "values": ["on", "off"]}, {"name": "hipass output", "values": ["off", "on"]}, {"name": "bandpass output", "values": ["off", "on"]}], minBlocks: 3, maxBlocks: 6, "calcBlocks": (d) => {
      const blocks = [d.blocks[0],d.blocks[1],d.blocks[2]];
      if(d.options[0] === 0){
        blocks.push(d.blocks[3])
      }
      if (d.options[1] === 1) {
        blocks.push(d.blocks[4])
      }
      if(d.options[2] === 1){
        blocks.push(d.blocks[5])
      }

      return blocks;
    } },
  1: { typeId: 1, name: "Audio Input", category: "Interface", blocks: [{"name": "pedal input L", "direction": 1, "type": 0}, {"name": "pedal input R", "direction": 1, "type": 0}], options: [{"name": "channels", "values": ["left input", "right input", "both"]}], minBlocks: 1, maxBlocks: 2, "calcBlocks": (d) => {
      switch(d.options[0]){
        case 0:
          return [d.blocks[0]]
        case 1:
          return [d.blocks[1]]
        case 2:
          return d.blocks
        default:
          return []
      }
    } },
  2: { typeId: 2, name: "Audio Output", category: "Interface", blocks: [{"name": "pedal output L", "direction": 0, "type": 0}, {"name": "pedal output R", "direction": 0, "type": 0}, {"name": "gain", "direction": 0, "hasParameter": true, "type": 1}], options: [{"name": "gain control", "values": ["true", "false"]}, {"name": "channels", "values": ["left output", "right output", "both"]}], minBlocks: 1, maxBlocks: 3, "calcBlocks": (d) => {
      const blocks = []
      switch(d.options[1]){
        case 0:
          blocks.push(d.blocks[0]);
          break;
        case 1:
          blocks.push(d.blocks[1]);
          break;
        case 2:
          blocks.push(d.blocks[0]);
          blocks.push(d.blocks[1]);
          break;
        default:
          blocks.push(d.blocks[0]);
          break;
      }
      if(d.options[0] === 1){
        blocks.push(d.blocks[2]);
      }
      return blocks;
    } },
  3: { typeId: 3, name: "Aliaser", category: "Audio", blocks: [{"name": "audio in", "direction": 0, "type": 0}, {"name": "alias amount", "direction": 0, "hasParameter": true, "type": 1}, {"name": "audio out", "direction": 0, "type": 0}], options: [], minBlocks: 1, maxBlocks: 3, "calcBlocks": (d) => {return d.blocks} },
  4: { typeId: 4, name: "Sequencer", category: "Control", blocks: [{"name": "step ", "direction": 0, "hasParameter": true, "type": 1}, {"name": "gate in", "direction": 0, "hasParameter": true, "type": 1}, {"name": "queue start", "direction": 0, "hasParameter": true, "type": 1}, {"name": "key input note", "direction": 0, "hasParameter": true, "type": 1}, {"name": "key input gate", "direction": 0, "hasParameter": true, "type": 1}, {"name": "out track ", "direction": 1, "type": 1}], options: [{"name": "number of steps", "values": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32]}, {"name": "num of tracks", "values": [1, 2, 3, 4, 5, 6, 7, 8]}, {"name": "restart jack", "values": ["off", "on"]}, {"name": "behaviour", "values": ["loop", "one-shot", "cv_step"]}, {"name": "key input", "values": ["off", "selected", "increment", "active"]}, {"name": "number of pages", "values": [1, 2, 3, 4, 5, 6, 7, 8]}], minBlocks: 4, maxBlocks: 44, "calcBlocks": (d) => {
      const blocks = [];
      for(let i = 0; i < d.options[0]; i++){
        const tempBlock = Object.assign({}, d.blocks[0]);
        tempBlock.name += (i + 1);
        blocks.push(tempBlock);
      }
      blocks.push(d.blocks[1]);
      if(d.options[2] === 1){
        blocks.push(d.blocks[2]);
      }
      if (d.options[4] !== 0){
        blocks.push(d.blocks[3]);
        blocks.push(d.blocks[4]);
      }
      for(let j = 0; j < d.options[1]; j++){
        const tempBlock = Object.assign({}, d.blocks[5]);
        tempBlock.name += (j + 1);
        blocks.push(tempBlock);
      }

      return blocks;
    } },
  5: { typeId: 5, name: "LFO", category: "Control", blocks: [{"name": "frequency/trigger in", "direction": 0, "hasParameter": true, "type": 1}, {"name": "swing amount", "direction": 0, "hasParameter": true, "type": 1}, {"name": "phase input", "direction": 0, "hasParameter": true, "type": 1}, {"name": "phase reset", "direction": 0, "hasParameter": true, "type": 1}, {"name": "output", "direction": 1, "type": 1}], options: [{"name": "waveform", "values": ["square", "sine", "triangle", "ramp", "sawtooth", "random"]}, {"name": "swing control", "values": ["off", "on"]}, {"name": "output", "values": ["0 to 1", "-1 to 1"]}, {"name": "input", "values": ["cv control", "tap"]}, {"name": "phase input", "values": ["off", "on"]}, {"name": "phase reset", "values": ["off", "on"]}], minBlocks: 2, maxBlocks: 3, "calcBlocks": (d) => {
      const blocks = [d.blocks[0]];
      if(d.options[1] === 1){
        blocks.push(d.blocks[1]);
      }
      if(d.options[4] === 1) {
        blocks.push(d.blocks[2]);
      }
      if(d.options[5] === 1){
        blocks.push(d.blocks[3]);
      }
      blocks.push(d.blocks[4]);

      return blocks;
    } },
  6: { typeId: 6, name: "ADSR", category: "Control", blocks: [{"name": "cv input", "direction": 0, "hasParameter": true, "type": 1}, {"name": "retrigger", "direction": 0, "hasParameter": true, "type": 1}, {"name": "delay", "direction": 0, "hasParameter": true, "type": 1}, {"name": "attack", "direction": 0, "hasParameter": true, "type": 1}, {"name": "hold attack decay", "direction": 0, "hasParameter": true, "type": 1}, {"name": "decay", "direction": 0, "hasParameter": true, "type": 1}, {"name": "sustain", "direction": 0, "hasParameter": true, "type": 1}, {"name": "hold sustain release", "direction": 0, "hasParameter": true, "type": 1}, {"name": "release", "direction": 0, "hasParameter": true, "type": 1}, {"name": "cv output", "direction": 1, "type": 1}], options: [{"name": "retrigger input", "values": ["off", "on"]}, {"name": "initial delay", "values": ["off", "on"]}, {"name": "hold attack/decay", "values": ["off", "on"]}, {"name": "str", "values": ["on", "off"]}, {"name": "immediate release", "values": ["on", "off"]}, {"name": "hold sustain/release", "values": ["off", "on"]}], minBlocks: 5, maxBlocks: 10, "calcBlocks": (d) => {
      const blocks = [d.blocks[0]];
      if(d.options[0] === 1) {
        blocks.push(d.blocks[1]);
      }
      if(d.options[1] === 1) {
        blocks.push(d.blocks[2]);
      }
      blocks.push(d.blocks[3]);
      if(d.options[2] === 1) {
        blocks.push(d.blocks[4]);
      }
      blocks.push(d.blocks[5]);
      blocks.push(d.blocks[6]);
      if(d.options[4] === 1){
        blocks.push(d.blocks[7]);
      }
      blocks.push(d.blocks[8]);
      blocks.push(d.blocks[9]);

      return blocks;
    } },
  7: { typeId: 7, name: "VCA", category: "Audio", blocks: [{"name": "audio in 1", "direction": 0, "type": 0}, {"name": "audio in 2", "direction": 0, "type": 0}, {"name": "level control", "parameterMax": 65535, "parameterMin": 0, "direction": 0, "hasParameter": true, "type": 1}, {"name": "audio out 1", "direction": 1, "type": 0}, {"name": "audio out 2", "direction": 1, "type": 0}], options: [{"name": "channels", "values": [1, 2]}], minBlocks: 3, maxBlocks: 5, "calcBlocks": (d) => {
      const blocks = [d.blocks[0]];
      if(d.options[0] === 1){
        blocks.push(d.blocks[1]);
      }
      blocks.push(d.blocks[2]);
      blocks.push(d.blocks[3]);
      if(d.options[0] === 1){
        blocks.push(d.blocks[4])
      }

      return blocks;
    } },
  8: { typeId: 8, name: "Audio Multiply", category: "Audio", blocks: [{"name": "audio in 1", "direction": 0, "type": 0}, {"name": "audio in 2", "direction": 0, "type": 0}, {"name": "audio out", "direction": 1, "type": 0}], options: [], minBlocks: 3, maxBlocks: 3, "calcBlocks": (d) => {return d.blocks} },
  9: { typeId: 9, name: "Bit Crusher", category: "Audio", blocks: [{"name": "audio in", "direction": 0, "type": 0}, {"name": "crushed bits", "direction": 0, "hasParameter": true, "type": 1}, {"name": "audio out", "direction": 1, "type": 0}], options: [{"name": "fractions", "values": ["off", "on"]}], minBlocks: 3, maxBlocks: 3, "calcBlocks": (d) => {return d.blocks} },
  10: { typeId: 10, name: "Sample & Hold", category: "Control", blocks: [{"name": "CV input", "direction": 0, "hasParameter": true, "type": 1}, {"name": "trigger", "direction": 0, "hasParameter": true, "type": 1}, {"name": "CV output", "direction": 1, "type": 1}], options: [], minBlocks: 3, maxBlocks: 3, "calcBlocks": (d) => {return d.blocks} },
  11: { typeId: 11, name: "OD & Distortion", category: "Effect", blocks: [{"name": "audio in", "direction": 0, "type": 0}, {"name": "input gain", "direction": 0, "hasParameter": true, "type": 1}, {"name": "output gain", "direction": 0, "hasParameter": true, "type": 1}, {"name": "audio out", "direction": 1, "type": 0}], options: [{"name": "model", "values": ["plexi", "germ", "classic", "pushed", "edgy"]}], minBlocks: 4, maxBlocks: 4, "calcBlocks": (d) => {return d.blocks} },
  12: { typeId: 12, name: "Env Follower", category: "Analysis", blocks: [{"name": "audio in", "direction": 0, "type": 0}, {"name": "rise time", "direction": 0, "hasParameter": true, "type": 1}, {"name": "fall time", "direction": 0, "hasParameter": true, "type": 1}, {"name": "CV output", "direction": 1, "type": 1}], options: [{"name": "rise/fall time", "values": ["off", "on"]}, {"name": "output scale", "values": ["log", "linear"]}], minBlocks: 2, maxBlocks: 4, "calcBlocks": (d) => {
      const blocks = [d.blocks[0]];
      if(d.options[0] === 1){
        blocks.push(d.blocks[1]);
        blocks.push(d.blocks[2]);
      }
      blocks.push(d.blocks[3]);

      return blocks;
    } },
  13: { typeId: 13, name: "Delay Line", category: "Audio", blocks: [{"name": "audio in", "direction": 0, "type": 0}, {"name": "delay time", "direction": 0, "hasParameter": true, "parameterMax": 65535, "type": 1}, {"name": "modulation in", "direction": 0, "hasParameter": true, "parameterMax": 65535, "type": 1}, {"name": "tap tempo in", "direction": 0, "hasParameter": true, "parameterMax": 65535, "type": 1}, {"name": "audio out", "direction": 1, "type": 0}], options: [{"name": "max time", "values": ["100ms", "16s"]}, {"name": "tap tempo in", "values": ["off", "in"]}], minBlocks: 3, maxBlocks: 4, "calcBlocks": (d) => {
      const blocks = [d.blocks[0]];
      if(d.options[1] === 1){
        blocks.push(d.blocks[2])
        blocks.push(d.blocks[3])
      } else {
        blocks.push(d.blocks[1])
      }

      blocks.push(d.blocks[4])

      return blocks;
    } },
  14: { typeId: 14, name: "Oscillator", category: "Audio", blocks: [{"name": "frequency", "direction": 0, "hasParameter": true, "type": 1}, {"name": "FM input", "direction": 0, "type": 0}, {"name": "duty cycle", "direction": 0, "hasParameter": true, "type": 1}, {"name": "audio out", "direction": 1, "type": 0}], options: [{"name": "waveform", "values": ["square", "triangle", "sawtooth", "sine"]}, {"name": "fm in", "values": ["off", "on"]}, {"name": "duty cycle", "values": ["off", "on"]}, {"name": "upsampling", "values": ["off", "on"]}], minBlocks: 2, maxBlocks: 4, "calcBlocks": (d) => {
      const blocks = [d.blocks[0]];
      if(d.options[1] === 1) {
        blocks.push(d.blocks[1])
      }
      if(d.options[2] === 1) {
        blocks.push(d.blocks[2])
      }
      blocks.push(d.blocks[3])


      return blocks;
    } },
  15: { typeId: 15, name: "Pushbutton", category: "Interface", blocks: [{"name": "switch", "direction": 1, "type": 1}], options: [{"name": "action", "values": ["momentary", "latching"]}, {"name": "normally", "values": ["zero", "one"]}], minBlocks: 1, maxBlocks: 1, "calcBlocks": (d) => {return d.blocks} },
  16: { typeId: 16, name: "Keyboard", category: "Interface", blocks: [{"name": "note #", "direction": 0, "hasParameter": true, "type": 1}, {"name": "note out", "direction": 1, "type": 1}, {"name": "gate out", "direction": 1, "type": 1}, {"name": "trigger out", "direction": 1, "type": 1}], options: [{"name": "# of notes", "values": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40]}], minBlocks: 4, maxBlocks: 26, "calcBlocks": (d) => {
      const numNotes = d.options[0];
      const originalName = d.blocks[0].name;
      const blocks = [];
      for(let i = 1; i <= numNotes; i++){
        const tempNode = Object.assign({}, d.blocks[0]);
        tempNode.name = originalName + i;
        blocks.push(tempNode)
      }
      blocks.push(d.blocks[1]);
      blocks.push(d.blocks[2]);
      blocks.push(d.blocks[3]);

      return blocks;
    } },
  17: { typeId: 17, name: "CV Invert", category: "Control", blocks: [{"name": "CV input", "direction": 0, "hasParameter": true, "type": 1}, {"name": "CV output", "direction": 1, "type": 1}], options: [], minBlocks: 2, maxBlocks: 2, "calcBlocks": (d) => {return d.blocks} },
  18: { typeId: 18, name: "Steps", category: "Control", blocks: [{"name": "CV input", "direction": 0, "hasParameter": true, "type": 1}, {"name": "quant steps", "direction": 0, "hasParameter": true, "type": 1}, {"name": "CV output", "direction": 1, "type": 1}], options: [], minBlocks: 3, maxBlocks: 3, "calcBlocks": (d) => {return d.blocks} },
  19: { typeId: 19, name: "Slew Limiter", category: "Control", blocks: [{"name": "CV input", "direction": 0, "hasParameter": true, "type": 1}, {"name": "slew rate", "direction": 0, "hasParameter": true, "type": 1}, {"name": "rising lag", "direction": 0, "hasParameter": true, "type": 1}, {"name": "falling lag", "direction": 0, "hasParameter": true, "type": 1}, {"name": "CV output", "direction": 1, "type": 1}], options: [{"name": "control", "values": ["combined", "separate"]}], minBlocks: 3, maxBlocks: 4, "calcBlocks": (d) => {
      const blocks = [d.blocks[0]];
      if( d.options[0] === 0) {
        blocks.push(d.blocks[1]);
      } else {
        blocks.push(d.blocks[2]);
        blocks.push(d.blocks[3]);
      }
      blocks.push(d.blocks[4]);

      return blocks;
    } },
  20: { typeId: 20, name: "MIDI Notes in", category: "Interface", blocks: [{"name": "note out", "direction": 1, "type": 1}, {"name": "gate out", "direction": 1, "type": 1}, {"name": "velocity out", "direction": 1, "type": 1}, {"name": "trigger out", "direction": 1, "type": 1}], options: [{"name": "midi channel", "values": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]}, {"name": "# of outputs", "values": [1, 2, 3, 4, 5, 6, 7, 8]}, {"name": "priority", "values": ["newest", "oldest", "highest", "lowest"]}, {"name": "greedy", "values": ["no", "yes"]}, {"name": "velocity output", "values": ["off", "on"]}, {"name": "low note", "values": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127]}, {"name": "high note", "values": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127]}, {"name": "trigger pulse", "values": ["off", "on"]}], minBlocks: 4, maxBlocks: 32, "calcBlocks": (d) => {
      const blocks = [];
      const vel = d.options[4] === 1;
      const trig = d.options[7] === 1;
      for(let i = 0; i < d.options[1]; i++){
        blocks.push(d.blocks[0]);
        blocks.push(d.blocks[1]);
        if (vel) {
          blocks.push(d.blocks[2]);
        }
        if(trig) {
          blocks.push(d.blocks[3]);
        }
      }
      return blocks;
    } },
  21: { typeId: 21, name: "MIDI CC in", category: "Interface", blocks: [{"name": "cc value", "direction": 1, "type": 1}], options: [{"name": "midi channel", "values": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]}, {"name": "controller", "values": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127]}, {"name": "output", "values": ["0 to 1", "-1 to 1"]}], minBlocks: 1, maxBlocks: 1, "calcBlocks": (d) => {return d.blocks} },
  22: { typeId: 22, name: "Multiplier", category: "Control", blocks: [{"name": "CV input", "direction": 0, "hasParameter": true, "type": 1}, {"name": "CV output", "direction": 1, "type": 1}], options: [{"name": "num inputs", "values": [2, 3, 4, 5, 6, 7, 8]}], minBlocks: 3, maxBlocks: 9, "calcBlocks": (d) => {
      const blocks = [d.blocks[0], d.blocks[0]];
      for(let i = 0; i < d.options[0]; i++){
        blocks.push(d.blocks[0]);
      }
      blocks.push(d.blocks[1]);

      return blocks;
    } },
  23: { typeId: 23, name: "Compressor", category: "Effect", blocks: [{"name": "audio in", "direction": 0, "type": 0}, {"name": "audio inR", "direction": 0, "type": 0}, {"name": "threshold", "direction": 0, "hasParameter": true, "type": 1}, {"name": "attack", "direction": 0, "hasParameter": true, "type": 1}, {"name": "release", "direction": 0, "hasParameter": true, "type": 1}, {"name": "ratio", "direction": 0, "hasParameter": true, "type": 1}, {"name": "sidechain in", "direction": 0, "type": 0}, {"name": "audio out", "direction": 1, "type": 0}, {"name": "audio outR", "direction": 1, "type": 0}], options: [{"name": "attack ctrl", "values": ["off", "on"]}, {"name": "release ctrl", "values": ["off", "on"]}, {"name": "ratio ctrl", "values": ["off", "on"]}, {"name": "channels", "values": ["1in->1out", "stereo"]}, {"name": "sidechain", "values": ["internal", "external"]}], minBlocks: 3, maxBlocks: 8, "calcBlocks": (d) => {
      const blocks = [d.blocks[0]];
      if(d.options[3] === 1){
        blocks.push(d.blocks[1]);
      }
      blocks.push(d.blocks[2]);
      if(d.options[0] === 1) {
        blocks.push(d.blocks[3]);
      }
      if(d.options[1] === 1){
        blocks.push(d.blocks[4]);
      }
      if(d.options[2] === 1){
        blocks.push(d.blocks[5]);
      }
      if(d.options[4] === 1){
        blocks.push(d.blocks[6]);
      }
      blocks.push(d.blocks[7]);
      if(d.options[3] === 1){
        blocks.push(d.blocks[8]);
      }

      return blocks;
    } },
  24: { typeId: 24, name: "Multi-Filter", category: "Audio", blocks: [{"name": "audio in", "direction": 0, "type": 0}, {"name": "gain", "direction": 0, "hasParameter": true, "type": 1}, {"name": "frequency", "direction": 0, "hasParameter": true, "type": 1}, {"name": "q", "direction": 0, "hasParameter": true, "type": 1}, {"name": "audio out", "direction": 1, "type": 0}], options: [{"name": "filter shape", "values": ["high pass", "low pass", "band pass", "bell", "hi shelf", "low shelf"]}], minBlocks: 4, maxBlocks: 5, "calcBlocks": (d) => {
      const blocks = [d.blocks[0]];
      if(d.options[0] > 2 ) {
        blocks.push(d.blocks[1]);
      }
      blocks.push(d.blocks[2]);
      blocks.push(d.blocks[3]);
      blocks.push(d.blocks[4]);

      return blocks;
    } },
  25: { typeId: 25, name: "Plate Reverb", category: "Effect", blocks: [{"name": "input L", "direction": 0, "type": 0}, {"name": "input R", "direction": 0, "type": 0}, {"name": "decay time", "direction": 0, "hasParameter": true, "type": 1}, {"name": "low eq", "direction": 0, "hasParameter": true, "type": 1}, {"name": "high eq", "direction": 0, "hasParameter": true, "type": 1}, {"name": "mix", "direction": 0, "hasParameter": true, "type": 1}, {"name": "output L", "direction": 1, "type": 0}, {"name": "output R", "direction": 1, "type": 0}], options: [], minBlocks: 8, maxBlocks: 8, "calcBlocks": (d) => {return d.blocks} },
  26: { typeId: 26, name: "Buffer Delay", category: "Audio", blocks: [{"name": "audio in", "direction": 0, "type": 0}, {"name": "audio out", "direction": 1, "type": 0}], options: [{"name": "buffer length", "values": [0, 1, 2,3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]}], minBlocks: 2, maxBlocks: 2, "calcBlocks": (d) => {return d.blocks} },
  27: { typeId: 27, name: "All-Pass Filter", category: "Audio", blocks: [{"name": "audio in", "direction": 0, "type": 0}, {"name": "filter gain", "direction": 0, "hasParameter": true, "type": 1}, {"name": "audio out", "direction": 1, "type": 0}], options: [{"name": "# of poles", "values": [1, 2, 3, 4, 5, 6, 7, 8]}], minBlocks: 3, maxBlocks: 3, "calcBlocks": (d) => {return d.blocks} },
  28: { typeId: 28, name: "Quantizer", category: "Control", blocks: [{"name": "CV input", "direction": 0, "hasParameter": true, "type": 1}, {"name": "key", "direction": 0, "hasParameter": true, "type": 1}, {"name": "scale", "direction": 0, "hasParameter": true, "type": 1}, {"name": "CV output", "direction": 1, "type": 1}], options: [{"name": "key/scale jacks", "values": ["off", "on"]}], minBlocks: 2, maxBlocks: 4, "calcBlocks": (d) => {
      const blocks = [d.blocks[0]];
      if(d.options[0] === 1){
        blocks.push(d.blocks[1]);
        blocks.push(d.blocks[2]);
      }
      blocks.push(d.blocks[3]);

      return blocks;
    } },
  29: { typeId: 29, name: "Phaser", category: "Effect", blocks: [{"name": "input left", "direction": 0, "type": 0}, {"name": "input right", "direction": 0, "type": 0}, {"name": "control in", "direction": 0, "hasParameter": true, "type": 1}, {"name": "resonance", "direction": 0, "hasParameter": true, "type": 1}, {"name": "width", "direction": 0, "hasParameter": true, "type": 1}, {"name": "mix", "direction": 0, "hasParameter": true, "type": 1}, {"name": "output left", "direction": 1, "type": 1}, {"name": "output right", "direction": 1, "type": 1}], options: [{"name": "channels", "values": ["1in->1out", "1in->2out", "2in->2out"]}, {"name": "control", "values": ["rate", "tap tempo", "cv direct"]}, {"name": "number of stages", "values": [4, 2, 3, 1, 6, 8]}], minBlocks: 6, maxBlocks: 8, "calcBlocks": (d) => {
      const blocks = [d.blocks[0]];
      if(d.options[0] === 2){
        blocks.push(d.blocks[1]);
      }
      blocks.push(d.blocks[2]);
      blocks.push(d.blocks[3]);
      blocks.push(d.blocks[4]);
      blocks.push(d.blocks[5]);
      blocks.push(d.blocks[6]);
      if(d.options[0] > 0){
        blocks.push(d.blocks[7]);
      }
      return blocks;
    } },
  30: { typeId: 30, name: "Looper", category: "Audio", blocks: [{"name": "audio in", "direction": 0, "type": 0}, {"name": "record", "direction": 0, "hasParameter": true, "type": 1}, {"name": "restart playback", "direction": 0, "hasParameter": true, "type": 1}, {"name": "stop/play", "direction": 0, "hasParameter": true, "type": 1}, {"name": "speed/pitch", "direction": 0, "hasParameter": true, "type": 1}, {"name": "start position", "direction": 0, "hasParameter": true, "type": 1}, {"name": "loop length", "direction": 0, "hasParameter": true, "type": 1}, {"name": "reverse playback", "direction": 0, "hasParameter": true, "type": 1}, {"name": "audio out", "direction": 1, "type": 0}], options: [{"name": "max rec time", "values": ["1s", "2s", "4s", "8s", "16s"]}, {"name": "length edit", "values": ["off", "on"]}, {"name": "playback", "values": ["once", "loop"]}, {"name": "length", "values": ["fixed", "pre-speed"]}, {"name": "hear while rec", "values": ["no", "yes"]}, {"name": "play reverse", "values": ["no", "yes"]}, {"name": "overdub", "values": ["no", "yes"]}, {"name": "stop/play but", "values": ["no", "yes"]}], minBlocks: 5, maxBlocks: 9, "calcBlocks": (d) => {
      const blocks = [d.blocks[0], d.blocks[1], d.blocks[2]];

      if(d.options[2] === 1) {
        blocks.push(d.blocks[3]);
      }
      blocks.push(d.blocks[4]);
      if(d.options[1]===1){
        blocks.push(d.blocks[5]);
        blocks.push(d.blocks[6]);
      }
      if(d.options[5]===1){
        blocks.push(d.blocks[7]);
      }
      blocks.push(d.blocks[8]);

      return blocks;
    } },
  31: { typeId: 31, name: "In Switch", category: "Control", blocks: [{"name": "CV input ", "direction": 0, "hasParameter": true, "type": 1}, {"name": "in select", "direction": 0, "hasParameter": true, "type": 1}, {"name": "CV output", "direction": 1, "type": 1}], options: [{"name": "num inputs", "values": [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]}], minBlocks: 4, maxBlocks: 18, "calcBlocks": (d) => {
      const blocks = [];
      for(let i = 0; i < d.options[0] + 2; i++){
        const tempBlock = Object.assign({}, d.blocks[0]);
        tempBlock.name += (i+1);
        blocks.push(tempBlock);
      }
      blocks.push(d.blocks[1]);
      blocks.push(d.blocks[2]);

      return blocks;
    } },
  32: { typeId: 32, name: "Out Switch", category: "Control", blocks: [{"name": "CV Input", "direction": 0, "hasParameter": true, "type": 1}, {"name": "out select", "direction": 0, "hasParameter": true, "type": 1}, {"name": "CV output ", "direction": 1, "type": 1}], options: [{"name": "# of outputs", "values": [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]}], minBlocks: 4, maxBlocks: 18, "calcBlocks": (d) => {
      const blocks = [d.blocks[0], d.blocks[1]];
      for(let i = 0; i < d.options[0] + 1; i++){
        const tempBlock = Object.assign({}, d.blocks[2]);
        tempBlock.name += (i+1);
        blocks.push(tempBlock);
      }

      return blocks;
    } },
  33: { typeId: 33, name: "Audio In Switch", category: "Audio", blocks: [{"name": "audio in", "direction": 0, "type": 0}, {"name": "in select", "direction": 0, "hasParameter": true, "type": 1}, {"name": "audio out", "direction": 1, "type": 0}], options: [{"name": "# of inputs", "values": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]}], minBlocks: 3, maxBlocks: 18, "calcBlocks": (d) => {
      const blocks = [d.blocks[0]];
      for(let i = 0; i < d.options[0]; i++){
        const tempBlock = Object.assign({}, d.blocks[0]);
        tempBlock.name += i;
        blocks.push(tempBlock);
      }
      blocks.push(d.blocks[1]);
      blocks.push(d.blocks[2]);

      return blocks;
    } },
  34: { typeId: 34, name: "Audio Out Switch", category: "Audio", blocks: [{"name": "audio in", "direction": 0, "type": 0}, {"name": "out select", "direction": 0, "hasParameter": true, "type": 1}, {"name": "audio out", "direction": 1, "type": 0}], options: [{"name": "# of inputs", "values": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]}], minBlocks: 4, maxBlocks: 18, "calcBlocks": (d) => {
      const blocks = [d.blocks[0], d.blocks[1]];

      for(let i = 0; i < d.options[0]; i++){
        const tempBlock = Object.assign({}, d.blocks[2]);
        tempBlock.name += (i + 1);
        blocks.push(tempBlock);
      }
      return blocks;
    } },
  35: { typeId: 35, name: "Midi Pressure", category: "Interface", blocks: [{"name": "channel pressure", "direction": 1, "type": 1}], options: [{"name": "midi channel", "values": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]}], minBlocks: 1, maxBlocks: 1, "calcBlocks": (d) => {return d.blocks} },
  36: { typeId: 36, name: "Onset Detector", category: "Analysis", blocks: [{"name": "audio in", "direction": 0, "type": 0}, {"name": "sensitivity", "direction": 0, "hasParameter": true, "type": 1}, {"name": "CV output", "direction": 1, "type": 1}], options: [{"name": "sensitivity", "values": ["off", "on"]}], minBlocks: 2, maxBlocks: 3, "calcBlocks": (d) => {
      const blocks = [d.blocks[0]];
      if(d.options[0] === 1){
        blocks.push(d.blocks[1]);
      }
      blocks.push(d.blocks[2]);

      return blocks;
    } },
  37: { typeId: 37, name: "Rhythm", category: "Control", blocks: [{"name": "Record Start Stop", "direction": 0, "hasParameter": true, "type": 1}, {"name": "Rhythm In", "direction": 0, "hasParameter": true, "type": 1}, {"name": "Play", "direction": 0, "hasParameter": true, "type": 1}, {"name": "Done out", "direction": 1, "type": 1}, {"name": "Rhythm out", "direction": 1, "type": 1}], options: [{"name": "done_ctrl", "values": ["off", "on"]}], minBlocks: 4, maxBlocks: 5, "calcBlocks": (d) => {
      const blocks = [d.blocks[0], d.blocks[1], d.blocks[2]];
      if(d.options[0] === 1) {
        blocks.push(d.blocks[3]);
      }
      blocks.push(d.blocks[4]);

      return blocks;
    } },
  38: { typeId: 38, name: "Noise", category: "Audio", blocks: [{"name": "audio out", "direction": 1, "type": 0}], options: [], minBlocks: 1, maxBlocks: 1, "calcBlocks": (d) => {return d.blocks} },
  39: { typeId: 39, name: "Random", category: "Control", blocks: [{"name": "trigger in", "direction": 0, "hasParameter": true, "type": 1}, {"name": "CV output", "direction": 1, "type": 1}], options: [{"name": "output", "values": ["0 to 1", "-1 to 1"]}, {"name": "new val on trig", "values": ["on", "off"]}], minBlocks: 1, maxBlocks: 2, "calcBlocks": (d) => {
      let blocks = [];
      if(d.options[1] === 0){
        blocks = d.blocks;
      } else {
        blocks = [d.blocks[1]];
      }
      return blocks;
    } },
  40: { typeId: 40, name: "Gate", category: "Effect", blocks: [{"name": "audio inL", "direction": 0, "type": 0}, {"name": "audio inR", "direction": 0, "type": 0}, {"name": "threshold", "direction": 0, "hasParameter": true, "type": 1}, {"name": "attack", "direction": 0, "hasParameter": true, "type": 1}, {"name": "release", "direction": 0, "hasParameter": true, "type": 1}, {"name": "sidechain in", "direction": 0, "hasParameter": true, "type": 1}, {"name": "audio outL", "direction": 1, "type": 0}, {"name": "audio outR", "direction": 1, "type": 0}], options: [{"name": "attack ctrl", "values": ["off", "on"]}, {"name": "release ctrl", "values": ["off", "on"]}, {"name": "channels", "values": ["1in->1out", "stereo"]}, {"name": "sidechain", "values": ["internal", "external"]}], minBlocks: 5, maxBlocks: 8, "calcBlocks": (d) => {
      const blocks = [d.blocks[0]];
      if(d.options[2] === 1){
        blocks.push(d.blocks[1]);
      }
      blocks.push(d.blocks[2]);
      if(d.options[0] === 1){
        blocks.push(d.blocks[3]);
      }
      if(d.options[1] === 1){
        blocks.push(d.blocks[4]);
      }
      if(d.options[3] === 1) {
        blocks.push(d.blocks[5]);
      }
      blocks.push(d.blocks[6]);
      if(d.options[2] === 1){
        blocks.push(d.blocks[7]);
      }
      return blocks;
    } },
  41: { typeId: 41, name: "Tremolo", category: "Effect", blocks: [{"name": "audio inL", "direction": 0, "type": 0}, {"name": "audio inR", "direction": 0, "type": 0}, {"name": "control in", "direction": 0, "hasParameter": true, "type": 1}, {"name": "depth", "direction": 0, "hasParameter": true, "type": 1}, {"name": "audio outL", "direction": 1, "type": 0}, {"name": "audio outR", "direction": 1, "type": 0}], options: [{"name": "channels", "values": ["1in->1out", "1in->2out", "2in->2out"]}, {"name": "control", "values": ["rate", "tap tempo", "cv direct"]}, {"name": "waveform", "values": ["fender'ish", "vox'ish", "triangle", "sine", "square"]}], minBlocks: 4, maxBlocks: 6, "calcBlocks": (d) => {
      const blocks = [d.blocks[0]];
      if(d.options[0] === 2){
        blocks.push(d.blocks[1]);
      }
      blocks.push(d.blocks[2]);
      blocks.push(d.blocks[3]);
      blocks.push(d.blocks[4]);
      if(d.options[0] > 0){
        blocks.push(d.blocks[5]);
      }
      return blocks;
    } },
  42: { typeId: 42, name: "Tone Control", category: "Effect", blocks: [{"name": "aud in L", "direction": 0, "type": 0}, {"name": "aud in R", "direction": 0, "type": 0}, {"name": "low shelf", "direction": 0, "hasParameter": true, "type": 1}, {"name": "mid gain 1", "direction": 0, "hasParameter": true, "type": 1}, {"name": "mid frequency 1", "direction": 0, "hasParameter": true, "type": 1}, {"name": "mid gain 2", "direction": 0, "hasParameter": true, "type": 1}, {"name": "mid frequency 2", "direction": 0, "hasParameter": true, "type": 1}, {"name": "high shelf", "direction": 0, "hasParameter": true, "type": 1}, {"name": "output L", "direction": 1, "type": 0}, {"name": "output R", "direction": 1, "type": 0}], options: [{"name": "channels", "values": ["1in->1out", "stereo"]}, {"name": "num mid bands", "values": [1, 2]}], minBlocks: 6, maxBlocks: 10, "calcBlocks": (d) => {
      const blocks = [d.blocks[0]];
      if(d.options[0] === 1){
        blocks.push(d.blocks[1]);
      }
      blocks.push(d.blocks[2]);
      blocks.push(d.blocks[3]);
      blocks.push(d.blocks[4]);
      if(d.options[1] === 1){
        blocks.push(d.blocks[5]);
        blocks.push(d.blocks[6]);
      }
      blocks.push(d.blocks[7]);
      blocks.push(d.blocks[8]);
      if(d.options[0] === 1){
        blocks.push(d.blocks[9]);
      }
      return blocks;
    } },
  43: { typeId: 43, name: "Delay w/Mod", category: "Effect", blocks: [{"name": "audio in 1", "direction": 0, "type": 0}, {"name": "audio in 2", "direction": 0, "type": 0}, {"name": "delay time", "direction": 0, "hasParameter": true, "type": 1}, {"name": "feedback", "direction": 0, "hasParameter": true, "type": 1}, {"name": "mod rate", "direction": 0, "hasParameter": true, "type": 1}, {"name": "mod depth", "direction": 0, "hasParameter": true, "type": 1}, {"name": "mix", "direction": 0, "hasParameter": true, "type": 1}, {"name": "audio out1", "direction": 1, "type": 0}, {"name": "audio out2", "direction": 1, "type": 0}], options: [{"name": "channels", "values": ["1in->1out", "1in->2out", "2in->2out"]}, {"name": "control", "values": ["rate", "tap tempo"]}, {"name": "type", "values": ["clean", "tape", "old tape", "bbd"]}, {"name": "tap ratio", "values": ["1:1", "2:3", "1:2", "1:3", "3:8", "1:4", "3:16", "1:8", "1:16", "1:32"]}], minBlocks: 7, maxBlocks: 9, "calcBlocks": (d) => {
      const blocks = [d.blocks[0]];
      if(d.options[0] === 2){
        blocks.push(d.blocks[1]);
      }
      blocks.push(d.blocks[2]);
      blocks.push(d.blocks[3]);
      blocks.push(d.blocks[4]);
      blocks.push(d.blocks[5]);
      blocks.push(d.blocks[6]);
      blocks.push(d.blocks[7]);
      if(d.options[0] > 0){
        blocks.push(d.blocks[8]);
      }

      return blocks;
    } },
  44: { typeId: 44, name: "Stompswitch", category: "Interface", blocks: [{"name": "cv output", "direction": 1, "type": 1}], options: [{"name": "stompswitch", "values": ["left", "middle", "right", "ext"]}, {"name": "action", "values": ["momentary", "latching"]}, {"name": "normally", "values": ["zero", "one"]}], minBlocks: 1, maxBlocks: 1, "calcBlocks": (d) => {return d.blocks} },
  45: { typeId: 45, name: "Value", category: "Control", blocks: [{"name": "value", "direction": 0, "hasParameter": true, "type": 1}, {"name": "CV output", "direction": 1, "type": 1}], options: [{"name": "input range", "values": ["0 to 1", "-1 to 1"]}], minBlocks: 2, maxBlocks: 2, "calcBlocks": (d) => {return d.blocks} },
  46: { typeId: 46, name: "CV Delay", category: "Control", blocks: [{"name": "CV input", "direction": 0, "hasParameter": true, "type": 1}, {"name": "delay time", "direction": 0, "hasParameter": true, "type": 1}, {"name": "CV output", "direction": 1, "type": 1}], options: [], minBlocks: 3, maxBlocks: 3, "calcBlocks": (d) => {return d.blocks} },
  47: { typeId: 47, name: "CV Loop", category: "Control", blocks: [{"name": "CV Input", "direction": 0, "hasParameter": true, "type": 1}, {"name": "record", "direction": 0, "hasParameter": true, "type": 1}, {"name": "play", "direction": 0, "hasParameter": true, "type": 1}, {"name": "playback speed", "direction": 0, "hasParameter": true, "type": 1}, {"name": "start position", "direction": 0, "hasParameter": true, "type": 1}, {"name": "stop position", "direction": 0, "hasParameter": true, "type": 1}, {"name": "restart loop", "direction": 0, "hasParameter": true, "type": 1}, {"name": "cv output", "direction": 1, "type": 1}], options: [{"name": "max rec time", "values": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]}, {"name": "length edit", "values": ["off", "on"]}], minBlocks: 6, maxBlocks: 8, "calcBlocks": (d) => {
      const blocks = [d.blocks[0],d.blocks[1], d.blocks[2], d.blocks[3]];
      if(d.options[1] === 1){
        blocks.push(d.blocks[4]);
        blocks.push(d.blocks[5]);
        blocks.push(d.blocks[6]);
      }
      blocks.push(d.blocks[7]);
      blocks.push(d.blocks[8]);

      return blocks;
    } },
  48: { typeId: 48, name: "CV Filter", category: "Control", blocks: [{"name": "CV input", "direction": 0, "hasParameter": true, "type": 1}, {"name": "time constant", "direction": 0, "hasParameter": true, "type": 1}, {"name": "CV output", "direction": 1, "type": 1}], options: [], minBlocks: 3, maxBlocks: 3, "calcBlocks": (d) => {return d.blocks} },
  49: { typeId: 49, name: "Clock Divider", category: "Control", blocks: [{"name": "CV input", "direction": 0, "hasParameter": true, "type": 1}, {"name": "reset switch", "direction": 0, "hasParameter": true, "type": 1}, {"name": "clock ratio", "direction": 0, "hasParameter": true, "type": 1}, {"name": "CV output", "direction": 1, "type": 1}], options: [], minBlocks: 4, maxBlocks: 4, "calcBlocks": (d) => {return d.blocks} },
  50: { typeId: 50, name: "Comparator", category: "Control", blocks: [{"name": "CV positive input", "direction": 0, "hasParameter": true, "type": 1}, {"name": "CV negative input", "direction": 0, "hasParameter": true, "type": 1}, {"name": "CV output", "direction": 1, "type": 1}], options: [{"name": "output", "values": ["0 to 1", "-1 to 1"]}], minBlocks: 3, maxBlocks: 3, "calcBlocks": (d) => {return d.blocks} },
  51: { typeId: 51, name: "CV Rectify", category: "Control", blocks: [{"name": "CV input", "direction": 0, "hasParameter": true, "type": 1}, {"name": "CV output", "direction": 1, "type": 1}], options: [], minBlocks: 2, maxBlocks: 2, "calcBlocks": (d) => {return d.blocks} },
  52: { typeId: 52, name: "Trigger", category: "Control", blocks: [{"name": "CV input", "direction": 0, "hasParameter": true, "type": 1}, {"name": "CV output", "direction": 1, "type": 1}], options: [], minBlocks: 2, maxBlocks: 2, "calcBlocks": (d) => {return d.blocks} },
  53: { typeId: 53, name: "Stereo Spread", category: "Audio", blocks: [{"name": "audio in", "direction": 0, "type": 0}, {"name": "audio in 1", "direction": 0, "type": 0}, {"name": "audio in 2", "direction": 0, "type": 0}, {"name": "delay time", "direction": 0, "type": 0}, {"name": "side gain", "direction": 0, "type": 0}, {"name": "audio out 1", "direction": 1, "type": 0}, {"name": "audio out 2", "direction": 1, "type": 0}], options: [{"name": "method", "values": ["Mid-Side", "Haas"]}], minBlocks: 4, maxBlocks: 5, "calcBlocks": (d) => {
      let blocks = [];
      if(d.options[0] === 0) {
        blocks = [d.blocks[0], d.blocks[3], d.blocks[5], d.blocks[6]]
      } else {
        blocks = [d.blocks[1], d.blocks[2], d.blocks[4], d.blocks[5], d.blocks[6]];
      }

      return blocks;
    } },
  54: { typeId: 54, name: "Cport Exp/CV in", category: "Interface", blocks: [{"name": "cv output", "direction": 1, "type": 1}], options: [{"name": "output range", "values": ["0 to 1", "-1 to 1"]}], minBlocks: 1, maxBlocks: 1, "calcBlocks": (d) => {return d.blocks;} },
  55: { typeId: 55, name: "Cport CV out", category: "Interface", blocks: [{"name": "cv input", "direction": 0, "hasParameter": true, "type": 1}], options: [{"name": "output range", "values": ["0 to 1", "-1 to 1"]}], minBlocks: 1, maxBlocks: 1, "calcBlocks": (d) => {return d.blocks;} },
  56: { typeId: 56, name: "UI Button", category: "Interface", blocks: [{"name": "in", "direction": 0, "hasParameter": true, "type": 1}, {"name": "CV Output", "direction": 1, "type": 1}], options: [{"name": "cv output", "values": ["disabled", "enabled"]}, {"name": "range", "values": ["extended", "basic"]}], minBlocks: 1, maxBlocks: 2, "calcBlocks": (d) => {
      const blocks = [d.blocks[0]];
      if(d.options[0] === 1){
        blocks.push(d.blocks[1])
      }

      return blocks;
    } },
  57: { typeId: 57, name: "Audio Panner", category: "Audio", blocks: [{"name": "audio in 1", "direction": 0, "type": 0}, {"name": "audio in 2", "direction": 0, "type": 0}, {"name": "pan", "direction": 0, "hasParameter": true, "type": 1}, {"name": "audio out 1", "direction": 1, "type": 0}, {"name": "audio out 2", "direction": 1, "type": 0}], options: [{"name": "channels", "values": ["1in->2out", "stereo"]}, {"name": "pan type", "values": ["equal pwr", "linear", "-4.5db"]}], minBlocks: 4, maxBlocks: 5, "calcBlocks": (d) => {
      const blocks = [d.blocks[0]];
      if(d.options[0] === 1){
        blocks.push(d.blocks[1]);
      }
      blocks.push(d.blocks[2]);
      blocks.push(d.blocks[3]);
      blocks.push(d.blocks[4]);

      return blocks;
    } },
  58: { typeId: 58, name: "Pitch Detector", category: "Analysis", blocks: [{"name": "audio in", "direction": 0, "type": 0}, {"name": "pitch out", "direction": 1, "type": 1}], options: [], minBlocks: 2, maxBlocks: 2, "calcBlocks": (d) => {return d.blocks} },
  59: { typeId: 59, name: "Pitch Shifter", category: "Audio", blocks: [{"name": "audio in", "direction": 0, "type": 0}, {"name": "pitch shift", "direction": 0, "hasParameter": true, "type": 1}, {"name": "audio out", "direction": 1, "type": 0}], options: [], minBlocks: 3, maxBlocks: 3, "calcBlocks": (d) => {return d.blocks} },
  60: { typeId: 60, name: "Midi Note Out", category: "Interface", blocks: [{"name": "note in", "direction": 0, "hasParameter": true, "type": 1}, {"name": "gate in", "direction": 0, "hasParameter": true, "type": 1}, {"name": "velocity", "direction": 0, "hasParameter": true, "type": 1}], options: [{"name": "midi channel", "values": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]}, {"name": "velocity output", "values": ["off", "on"]}], minBlocks: 2, maxBlocks: 3, "calcBlocks": (d) => {
      const blocks = [d.blocks[0], d.blocks[1]];
      if(d.options[1] === 1){
        blocks.push(d.blocks[2]);
      }
      return blocks;
    } },
  61: { typeId: 61, name: "Midi CC Out", category: "Interface", blocks: [{"name": "cc out", "direction": 0, "hasParameter": true, "type": 1}], options: [{"name": "midi channel", "values": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]}, {"name": "controller", "values": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127]}], minBlocks: 1, maxBlocks: 1, "calcBlocks": (d) => { return d.blocks } },
  62: { typeId: 62, name: "Midi PC Out", category: "Interface", blocks: [{"name": "pc out", "direction": 0, "hasParameter": true, "type": 1}, {"name": "trigger in", "direction": 0, "hasParameter": true, "type": 1}], options: [{"name": "midi channel", "values": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]}], minBlocks: 2, maxBlocks: 2, "calcBlocks": (d) => { return d.blocks } },
  63: { typeId: 63, name: "Bit Modulator", category: "Audio", blocks: [{"name": "audio in 1", "direction": 0, "type": 0}, {"name": "audio in 2", "direction": 0, "type": 0}, {"name": "audio out", "direction": 1, "type": 0}], options: [{"name": "type", "values": ["xor", "and", "or", ""]}], minBlocks: 3, maxBlocks: 3, "calcBlocks": (d) => { return d.blocks } },
  64: { typeId: 64, name: "Audio Balance", category: "Audio", blocks: [{"name": "audio in1", "direction": 0, "type": 0}, {"name": "audio in2", "direction": 0, "type": 0}, {"name": "audio in1 L", "direction": 0, "type": 0}, {"name": "audio in1 R", "direction": 0, "type": 0}, {"name": "audio in2 L", "direction": 0, "type": 0}, {"name": "audio in2 R", "direction": 0, "type": 0}, {"name": "mix", "direction": 0, "hasParameter": true, "type": 1}, {"name": "audio out1", "direction": 1, "type": 0}, {"name": "audio outL", "direction": 1, "type": 0}, {"name": "audio outR", "direction": 1, "type": 0}], options: [{"name": "output", "values": ["mono", "stereo"]}], minBlocks: 4, maxBlocks: 7, "calcBlocks": (d) => {
      let blocks = [];
      if(d.options[0] === 0){
        blocks = [d.blocks[0], d.blocks[1], d.blocks[6], d.blocks[7]]
      } else {
        blocks = [d.blocks[2],d.blocks[3],d.blocks[4],d.blocks[5],d.blocks[6],d.blocks[8],d.blocks[9]]
      }
      return blocks;
    } },
  65: { typeId: 65, name: "Inverter", category: "Audio", blocks: [{"name": "audio in", "direction": 0, "type": 0}, {"name": "audio out", "direction": 1, "type": 0}], options: [], minBlocks: 2, maxBlocks: 2, "calcBlocks": (d) => {return d.blocks;} },
  66: { typeId: 66, name: "Fuzz", category: "Effect", blocks: [{"name": "audio in", "direction": 0, "type": 0}, {"name": "input gain", "direction": 0, "hasParameter": true, "type": 1}, {"name": "output gain", "direction": 0, "hasParameter": true, "type": 1}, {"name": "audio out", "direction": 1, "type": 0}], options: [{"name": "mode", "values": ["efuzzy", "burly", "scoopy", "ugly"]}], minBlocks: 4, maxBlocks: 4, "calcBlocks": (d) => {return d.blocks;} },
  67: { typeId: 67, name: "Ghostverb", category: "Effect", blocks: [{"name": "audio in1", "direction": 0, "type": 0}, {"name": "audio in2", "direction": 0, "type": 0}, {"name": "decay/feedback", "direction": 0, "hasParameter": true, "type": 1}, {"name": "rate", "direction": 0, "hasParameter": true, "type": 1}, {"name": "resonance", "direction": 0, "hasParameter": true, "type": 1}, {"name": "mix", "direction": 0, "hasParameter": true, "type": 1}, {"name": "audio out1", "direction": 1, "type": 0}, {"name": "audio out2", "direction": 1, "type": 0}], options: [{"name": "channels", "values": ["1in->1out", "1in->2out", "2in->2out"]}], minBlocks: 6, maxBlocks: 8, "calcBlocks": (d) => {
      const blocks = [d.blocks[0]];
      if(d.options[0] === 2){
        blocks.push(d.blocks[1]);
      }
      blocks.push(d.blocks[2]);
      blocks.push(d.blocks[3]);
      blocks.push(d.blocks[4]);
      blocks.push(d.blocks[5]);
      blocks.push(d.blocks[6]);
      if(d.options[0] > 0){
        blocks.push(d.blocks[7]);
      }
      return blocks;
    } },
  68: { typeId: 68, name: "Cabinet Sim", category: "Effect", blocks: [{"name": "audio in1", "direction": 0, "type": 0}, {"name": "audio in2", "direction": 0, "type": 0}, {"name": "audio out1", "direction": 1, "type": 0}, {"name": "audio out2", "direction": 1, "type": 0}], options: [{"name": "", "values": ["mono", "stereo", "stereo_out"]}, {"name": "", "values": ["4x12 full", "2x12 dark", "2x12 modern", "1x12", "1x8 lofi", "1x12 vint", "4x12 hifi"]}], minBlocks: 2, maxBlocks: 4, "calcBlocks": (d) => {
      const blocks = [d.blocks[0]];
      if(d.options[0] === 1) {
        blocks.push(d.blocks[1]);
      }
      blocks.push(d.blocks[2]);
      if(d.options[0] > 0){
        blocks.push(d.blocks[3]);
      }
      return blocks;
    } },
  69: { typeId: 69, name: "Flanger", category: "Effect", blocks: [{"name": "input left", "direction": 0, "type": 0}, {"name": "input right", "direction": 0, "type": 0}, {"name": "control in", "direction": 0, "hasParameter": true, "type": 1}, {"name": "regeneration", "direction": 0, "hasParameter": true, "type": 1}, {"name": "width", "direction": 0, "hasParameter": true, "type": 1}, {"name": "tone tilt eq", "direction": 0, "hasParameter": true, "type": 1}, {"name": "mix", "direction": 0, "hasParameter": true, "type": 1}, {"name": "output left", "direction": 1, "type": 0}, {"name": "output right", "direction": 1, "type": 0}], options: [{"name": "channels", "values": ["1in->1out", "1in->2out", "2in->2out"]}, {"name": "control", "values": ["rate", "tap tempo", "cv dirct"]}, {"name": "type", "values": ["1960s", "1970s", "thru-0"]}], minBlocks: 7, maxBlocks: 9, "calcBlocks": (d) => {
      const blocks = [d.blocks[0]];
      if(d.options[0] === 2){
        blocks.push(d.blocks[1]);
      }
      blocks.push(d.blocks[2]);
      blocks.push(d.blocks[3]);
      blocks.push(d.blocks[4]);
      blocks.push(d.blocks[5]);
      blocks.push(d.blocks[6]);
      blocks.push(d.blocks[7]);
      if(d.options[0] > 0){
        blocks.push(d.blocks[8]);
      }
      return blocks;
    } },
  70: { typeId: 70, name: "Chorus", category: "Effect", blocks: [{"name": "input left", "direction": 0, "type": 0}, {"name": "input right", "direction": 0, "type": 0}, {"name": "control in", "direction": 0, "hasParameter": true, "type": 1}, {"name": "width", "direction": 0, "hasParameter": true, "type": 1}, {"name": "tone tilt eq", "direction": 0, "hasParameter": true, "type": 1}, {"name": "mix", "direction": 0, "hasParameter": true, "type": 1}, {"name": "output left", "direction": 1, "type": 0}, {"name": "output right", "direction": 1, "type": 0}], options: [{"name": "channels", "values": ["1in->1out", "1in->2out", "2in->2out"]}, {"name": "control", "values": ["rate", "tap tempo", "cv dirct"]}, {"name": "type", "values": ["classic"]}], minBlocks: 6, maxBlocks: 8, "calcBlocks": (d) => {
      const blocks = [d.blocks[0]];
      if(d.options[0] === 2){
        blocks.push(d.blocks[1]);
      }
      blocks.push(d.blocks[2]);
      blocks.push(d.blocks[3]);
      blocks.push(d.blocks[4]);
      blocks.push(d.blocks[5]);
      blocks.push(d.blocks[6]);
      if(d.options[0] > 0){
        blocks.push(d.blocks[7]);
      }

      return blocks;
    } },
  71: { typeId: 71, name: "Vibrato", category: "Effect", blocks: [{"name": "input left", "direction": 0, "type": 0}, {"name": "input right", "direction": 0, "type": 0}, {"name": "control in", "direction": 0, "hasParameter": true, "type": 1}, {"name": "width", "direction": 0, "hasParameter": true, "type": 1}, {"name": "output left", "direction": 1, "type": 0}, {"name": "output right", "direction": 1, "type": 0}], options: [{"name": "channels", "values": ["1in->1out", "1in->2out", "2in->2out"]}, {"name": "control", "values": ["rate", "tap tempo", "cv direct"]}, {"name": "waveform", "values": ["sine", "triangle", "swung sine", "swung"]}], minBlocks: 4, maxBlocks: 6, "calcBlocks": (d) => {
      const blocks = [d.blocks[0]];
      if(d.options[0] === 2){
        blocks.push(d.blocks[1]);
      }
      blocks.push(d.blocks[2]);
      blocks.push(d.blocks[3]);
      blocks.push(d.blocks[4]);
      if(d.options[0] > 0){
        blocks.push(d.blocks[5]);
      }

      return blocks
    } },
  72: { typeId: 72, name: "Env Filter", category: "Effect", blocks: [{"name": "audio in1", "direction": 0, "type": 0}, {"name": "audio in2", "direction": 0, "type": 0}, {"name": "sensitivity", "direction": 0, "hasParameter": true, "type": 1}, {"name": "min freq", "direction": 0, "hasParameter": true, "type": 1}, {"name": "max freq", "direction": 0, "hasParameter": true, "type": 1}, {"name": "filter Q", "direction": 0, "hasParameter": true, "type": 1}, {"name": "audio out1", "direction": 1, "type": 0}, {"name": "audio out2", "direction": 1, "type": 0}], options: [{"name": "channels", "values": ["1in->1out", "1in->2out", "2in->2out"]}, {"name": "filter type", "values": ["bpf", "hpf", "lpf"]}, {"name": "direction", "values": ["up", "down"]}], minBlocks: 6, maxBlocks: 8, "calcBlocks": (d) => {
      const blocks = [d.blocks[0]];
      if(d.options[0] === 2) {
        blocks.push(d.blocks[1]);
      }
      blocks.push(d.blocks[2]);
      blocks.push(d.blocks[3]);
      blocks.push(d.blocks[4]);
      blocks.push(d.blocks[5]);
      blocks.push(d.blocks[6]);
      if(d.options[0] > 0) {
        blocks.push(d.blocks[7]);
      }
      return blocks;
    } },
  73: { typeId: 73, name: "Ring Modulator", category: "Effect", blocks: [{"name": "audio in", "direction": 0, "type": 0}, {"name": "frequency or ext in", "direction": 0, "hasParameter": true, "type": 1}, {"name": "duty cycle", "direction": 0, "hasParameter": true, "type": 1}, {"name": "mix", "direction": 0, "hasParameter": true, "type": 1}, {"name": "audio out", "direction": 1, "type": 0}], options: [{"name": "waveform", "values": ["sine", "square", "triangle", "sawtooth"]}, {"name": "ext audio in", "values": ["off", "on"]}, {"name": "duty cycle", "values": ["off", "on"]}, {"name": "upsampling", "values": ["none", "2X"]}], minBlocks: 4, maxBlocks: 5, "calcBlocks": (d) => {
      const blocks = [d.blocks[0], d.blocks[1]];
      if(d.options[2] === 1){
        blocks.push(d.blocks[2]);
      }
      blocks.push(d.blocks[3]);
      blocks.push(d.blocks[4]);

      return blocks;
    } },
  74: { typeId: 74, name: "Hall Reverb", category: "Effect", blocks: [{"name": "input L", "direction": 0, "type": 0}, {"name": "input R", "direction": 0, "type": 0}, {"name": "decay time", "direction": 0, "type": 0}, {"name": "low eq", "direction": 0, "type": 0}, {"name": "high eq (lpf freq)", "direction": 0, "type": 0}, {"name": "mix", "direction": 0, "type": 0}, {"name": "output L", "direction": 1, "type": 0}, {"name": "output R", "direction": 1, "type": 0}], options: [], minBlocks: 8, maxBlocks: 8, "calcBlocks": (d) => {return d.blocks} },
  75: { typeId: 75, name: "Ping Pong Delay", category: "Effect", blocks: [{"name": "audio in1", "direction": 0, "type": 0}, {"name": "audio in2", "direction": 0, "type": 0}, {"name": "delay time", "direction": 0, "hasParameter": true, "type": 1}, {"name": "feedback", "direction": 0, "hasParameter": true, "type": 1}, {"name": "mod rate", "direction": 0, "hasParameter": true, "type": 1}, {"name": "mod depth", "direction": 0, "hasParameter": true, "type": 1}, {"name": "mix", "direction": 0, "hasParameter": true, "type": 1}, {"name": "audio out1", "direction": 1, "type": 0}, {"name": "audio out2", "direction": 1, "type": 0}], options: [{"name": "channels", "values": ["1in->2out", "2in->2out"]}, {"name": "control", "values": ["rate", "tap tempo"]}, {"name": "type", "values": ["clean", "tape", "old tape", "bbd"]}, {"name": "tap ratio", "values": ["1:1", "2:3", "1:2", "1:3", "3:8", "1:4", "3:16", "1:8", "1:16", "1:32"]}], minBlocks: 8, maxBlocks: 9, "calcBlocks": (d) => {
      let blocks = d.blocks;
      if(d.options[0] === 0){
        blocks = blocks.filter((item, index) => index !== 1)
      }
      return blocks;
    } },
  76: { typeId: 76, name: "Audio Mixer", category: "Audio", blocks: [{"name": "inL 1", "direction": 0, "type": 0}, {"name": "inR 1", "direction": 0, "type": 0}, {"name": "inL 2", "direction": 0, "type": 0}, {"name": "inR 2", "direction": 0, "type": 0}, {"name": "gain 1", "direction": 0, "hasParameter": true, "type": 1}, {"name": "gain 2", "direction": 0, "hasParameter": true, "type": 1}, {"name": "pan 1", "direction": 0, "hasParameter": true, "type": 1}, {"name": "pan 2", "direction": 0, "hasParameter": true, "type": 1}, {"name": "out L", "direction": 1, "type": 0}, {"name": "out R", "direction": 1, "type": 0}], options: [{"name": "num channels", "values": [2, 3, 4, 5, 6, 7, 8]}, {"name": "inputs", "values": ["mono", "stereo"]}, {"name": "panning", "values": ["off", "on"]}], minBlocks: 5, maxBlocks: 34, "calcBlocks": (d) => {return d.blocks} },
  77: { typeId: 77, name: "CV Flip Flop", category: "Control", blocks: [{"name": "CV input", "direction": 0, "hasParameter": true, "type": 1}, {"name": "CV output", "direction": 1, "type": 1}], options: [], minBlocks: 2, maxBlocks: 2, "calcBlocks": (d) => {return d.blocks} },
  78: { typeId: 78, name: "Diffuser", category: "Audio", blocks: [{"name": "audio in", "direction": 0, "type": 0}, {"name": "gain", "direction": 0, "hasParameter": true, "type": 1}, {"name": "size", "direction": 0, "hasParameter": true, "type": 1}, {"name": "mod width", "direction": 0, "hasParameter": true, "type": 1}, {"name": "mod rate", "direction": 0, "hasParameter": true, "type": 1}, {"name": "audio out", "direction": 1, "type": 0}], options: [], minBlocks: 6, maxBlocks: 6, "calcBlocks": (d) => {return d.blocks} },
  79: { typeId: 79, name: "Reverb Lite", category: "Effect", blocks: [{"name": "input L", "direction": 0, "type": 0}, {"name": "input R", "direction": 0, "type": 0}, {"name": "decay time", "direction": 0, "hasParameter": true, "type": 1}, {"name": "mix", "direction": 0, "hasParameter": true, "type": 1}, {"name": "output L", "direction": 1, "type": 0}, {"name": "output R", "direction": 1, "type": 0}], options: [{"name": "channels", "values": ["1in->1out", "1in->2out", "2in->2out"]}], minBlocks: 4, maxBlocks: 6, "calcBlocks": (d) => {
      const blocks = [d.blocks[0]];
      if(d.options[0] === 2){
        blocks.push(d.blocks[1]);
      }
      blocks.push(d.blocks[2]);
      blocks.push(d.blocks[3]);
      blocks.push(d.blocks[4]);
      if(d.options[0] > 0){
        blocks.push(d.blocks[5]);
      }
      return blocks;
    } },
  80: { typeId: 80, name: "Room Reverb", category: "Effect", blocks: [{"name": "input L", "direction": 0, "type": 0}, {"name": "input R", "direction": 0, "type": 0}, {"name": "decay time", "direction": 0, "hasParameter": true, "type": 1}, {"name": "low eq", "direction": 0, "hasParameter": true, "type": 1}, {"name": "high eq (lpf freq)", "direction": 0, "hasParameter": true, "type": 1}, {"name": "mix", "direction": 0, "hasParameter": true, "type": 1}, {"name": "output L", "direction": 1, "type": 0}, {"name": "output R", "direction": 1, "type": 0}], options: [], minBlocks: 8, maxBlocks: 8, "calcBlocks": (d) => {return d.blocks;} },
  81: { typeId: 81, name: "Pixel", category: "Interface", blocks: [{"name": "cv in/audio in", "direction": 0, "type": 0}], options: [{"name": "control", "values": ["cv", "audio"]}], minBlocks: 1, maxBlocks: 1, "calcBlocks": (d) => {return d.blocks;} },
  82: { typeId: 82, name: "Midi Clock In", category: "Interface", blocks: [{"name": "cc value", "direction": 1, "type": 1}], options: [{"name": "midi channel", "values": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]}], minBlocks: 1, maxBlocks: 1, "calcBlocks": (d) => {return d.blocks;} },
  83: { typeId: 83, name: "Granular", category: "Audio", blocks: [{"name": "audio in", "direction": 0, "type": 0}, {"name": "audio inR", "direction": 0, "type": 0}, {"name": "grain size", "direction": 0, "hasParameter": true, "type": 1}, {"name": "grain position", "direction": 0, "hasParameter": true, "type": 1}, {"name": "density", "direction": 0, "hasParameter": true, "type": 1}, {"name": "texture", "direction": 0, "hasParameter": true, "type": 1}, {"name": "speed/pitch", "direction": 0, "hasParameter": true, "type": 1}, {"name": "freeze", "direction": 0, "hasParameter": true, "type": 1}, {"name": "audio out", "direction": 1, "type": 0}, {"name": "audio outR", "direction": 1, "type": 0}], options: [{"name": "num grains", "values": [0, 1, 2, 3, 4, 5, 6, 7]}, {"name": "channels", "values": ["mono", "stereo"]}, {"name": "pos control", "values": ["cv", "tap"]}, {"name": "size control", "values": ["cv", "tap"]}], minBlocks: 8, maxBlocks: 10, "calcBlocks": (d) => {
      const blocks = [d.blocks[0]];
      if(d.options[1]) {
        blocks.push(d.blocks[1]);
      }
      blocks.push(d.blocks[2]);
      blocks.push(d.blocks[3]);
      blocks.push(d.blocks[4]);
      blocks.push(d.blocks[5]);
      blocks.push(d.blocks[6]);
      blocks.push(d.blocks[7]);
      blocks.push(d.blocks[8]);
      if(d.options[1]) {
        blocks.push(d.blocks[9]);
      }

      return blocks;
    } },
  84: { typeId: 84, name: "Midi Clock Out", category: "Interface", blocks: [{"name": "tap/cv control", "direction": 0, "hasParameter": true, "type": 1}, {"name": "sent", "direction": 0, "hasParameter": true, "type": 1}, {"name": "reset", "direction": 0, "hasParameter": true, "type": 1}, {"name": "send position", "direction": 0, "hasParameter": true, "type": 1}, {"name": "song position", "direction": 0, "hasParameter": true, "type": 1}], options: [{"name": "input", "values": ["tap", "cv_control"]}, {"name": "run_in", "values": ["enabled", "disabled"]}, {"name": "reset_in", "values": ["enabled", "disabled"]}, {"name": "position", "values": ["disabled", "enabled"]}], minBlocks: 3, maxBlocks: 5, "calcBlocks": (d) => {
      const blocks = [d.blocks[0], d.blocks[1]];

      if(d.options[1] === 1){
        blocks.push(d.blocks[2]);
      }
      if(d.options[2] === 1){
        blocks.push(d.blocks[3]);
      }
      if(d.options[3] === 1){
        blocks.push(d.blocks[4]);
      }

      return blocks;
    } },
  85: { typeId: 85, name: "Tap to CV", category: "Control", blocks: [{"name": "tap input", "direction": 0, "hasParameter": true, "type": 1}, {"name": "min time", "direction": 0, "hasParameter": true, "type": 1}, {"name": "max time", "direction": 0, "hasParameter": true, "type": 1}, {"name": "output", "direction": 1, "type": 1}], options: [{"name": "range", "values": ["off", "on"]}, {"name": "output", "values": ["linear", "exponential"]}], minBlocks: 2, maxBlocks: 4, "calcBlocks": (d) => {
      const blocks = [d.blocks[0]];

      if(d.options[0] === 1){
        blocks.push(d.blocks[1]);
        blocks.push(d.blocks[2]);
      }

      blocks.push(d.blocks[3]);

      return blocks
    } },
  86: { typeId: 86, name: "MIDI Pitch Bend In", category: "Interface", blocks: [{"name": "pitch bend", "direction": 1, "type": 1}], options: [{"name": "midi channel", "values": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]}], minBlocks: 1, maxBlocks: 1, "calcBlocks": (d) => {return d.blocks;} },
  87: { typeId: 87, name: "Euro CV Out 4", category: "System", blocks: [{"name": "CV in", "direction": 0, "hasParameter": true, "type": 1}], options: [{"name": "out_range", "values": ["0 to 10V", "0 to 5V", "-5 to 5V"]}, {"name": "in_range", "values": ["0 to 1", "-1 to 1"]}, {"name": "transpose", "values": ["A", "C"]}], minBlocks: 1, maxBlocks: 1, "calcBlocks": (d) => {return d.blocks;} },
  88: { typeId: 88, name: "Euro CV In 1", category: "System", blocks: [{"name": "CV out", "direction": 0, "hasParameter": true, "type": 1}], options: [{"name": "in_range", "values": ["0 to 10V", "0 to 5V", "-5 to 5V"]}, {"name": "out_range", "values": ["0 to 1", "-1 to 1"]}, {"name": "clock_filter", "values": ["none", "2,8", "1,4", "5,5"]}, {"name": "transpose", "values": ["A", "C"]}], minBlocks: 1, maxBlocks: 1, "calcBlocks": (d) => {return d.blocks;} },
  89: { typeId: 89, name: "Euro CV In 2", category: "System", blocks: [{"name": "CV out", "direction": 0, "hasParameter": true, "type": 1}], options: [{"name": "in_range", "values": ["0 to 10V", "0 to 5V", "-5 to 5V"]}, {"name": "out_range", "values": ["0 to 1", "-1 to 1"]}, {"name": "clock_filter", "values": ["none", "2,8", "1,4", "5,5"]}, {"name": "transpose", "values": ["A", "C"]}], minBlocks: 1, maxBlocks: 1, "calcBlocks": (d) => {return d.blocks;} },
  90: { typeId: 90, name: "Euro CV In 3", category: "System", blocks: [{"name": "CV out", "direction": 0, "hasParameter": true, "type": 1}], options: [{"name": "in_range", "values": ["0 to 10V", "0 to 5V", "-5 to 5V"]}, {"name": "out_range", "values": ["0 to 1", "-1 to 1"]}, {"name": "clock_filter", "values": ["none", "2,8", "1,4", "5,5"]}, {"name": "transpose", "values": ["A", "C"]}], minBlocks: 1, maxBlocks: 1, "calcBlocks": (d) => {return d.blocks;} },
  91: { typeId: 91, name: "Euro CV In 4", category: "System", blocks: [{"name": "CV out", "direction": 0, "hasParameter": true, "type": 1}], options: [{"name": "in_range", "values": ["0 to 10V", "0 to 5V", "-5 to 5V"]}, {"name": "out_range", "values": ["0 to 1", "-1 to 1"]}, {"name": "clock_filter", "values": ["none", "2,8", "1,4", "5,5"]}, {"name": "transpose", "values": ["A", "C"]}], minBlocks: 1, maxBlocks: 1, "calcBlocks": (d) => {return d.blocks;} },
  92: { typeId: 92, name: "Euro Headphone Amp", category: "System", blocks: [{"name": "Level", "direction": 0, "hasParameter": true, "type": 1}], options: [], minBlocks: 1, maxBlocks: 1, "calcBlocks": (d) => {return d.blocks;} },
  93: { typeId: 93, name: "Euro Audio Input 1", category: "System", blocks: [{"name": "output", "direction": 1, "type": 0}], options: [{"name": "input_pad", "values": ["6dB", "12dB", "no_pad"]}], minBlocks: 1, maxBlocks: 1, "calcBlocks": (d) => {return d.blocks;} },
  94: { typeId: 94, name: "Euro Audio Input 2", category: "System", blocks: [{"name": "output", "direction": 1, "type": 0}], options: [{"name": "input_pad", "values": ["6dB", "12dB", "no_pad"]}], minBlocks: 1, maxBlocks: 1, "calcBlocks": (d) => {return d.blocks;} },
  95: { typeId: 95, name: "Euro Audio Output 1", category: "System", blocks: [{"name": "output", "direction": 0, "type": 0}], options: [], minBlocks: 1, maxBlocks: 1, "calcBlocks": (d) => {return d.blocks;} },
  96: { typeId: 96, name: "Euro Audio Output 2", category: "System", blocks: [{"name": "output", "direction": 0, "type": 0}], options: [], minBlocks: 1, maxBlocks: 1, "calcBlocks": (d) => {return d.blocks;} },
  97: { typeId: 97, name: "Euro Pushbutton 1", category: "System", blocks: [{"name": "cv_output", "direction": 1, "type": 1}], options: [{"name": "action", "values": ["momentary", "latching"]}, {"name": "normally", "values": ["zero", "one"]}], minBlocks: 1, maxBlocks: 1, "calcBlocks": (d) => {return d.blocks;} },
  98: { typeId: 98, name: "Euro Pushbutton 2", category: "System", blocks: [{"name": "cv_output", "direction": 1, "type": 1}], options: [{"name": "action", "values": ["momentary", "latching"]}, {"name": "normally", "values": ["zero", "one"]}], minBlocks: 1, maxBlocks: 1, "calcBlocks": (d) => {return d.blocks;} },
  99: { typeId: 99, name: "Euro CV Out 1", category: "System", blocks: [{"name": "CV in", "direction": 0, "hasParameter": true, "type": 1}], options: [{"name": "out_range", "values": ["0 to 10V", "0 to 5V", "-5 to 5V"]}, {"name": "in_range", "values": ["0 to 1", "-1 to 1"]}, {"name": "transpose", "values": ["A", "C"]}], minBlocks: 1, maxBlocks: 1, "calcBlocks": (d) => {return d.blocks;} },
  100: { typeId: 100, name: "Euro CV Out 2", category: "System", blocks: [{"name": "CV in", "direction": 0, "hasParameter": true, "type": 1}], options: [{"name": "out_range", "values": ["0 to 10V", "0 to 5V", "-5 to 5V"]}, {"name": "in_range", "values": ["0 to 1", "-1 to 1"]}, {"name": "transpose", "values": ["A", "C"]}], minBlocks: 1, maxBlocks: 1, "calcBlocks": (d) => {return d.blocks;} },
  101: { typeId: 101, name: "Euro CV Out 3", category: "System", blocks: [{"name": "CV in", "direction": 0, "hasParameter": true, "type": 1}], options: [{"name": "out_range", "values": ["0 to 10V", "0 to 5V", "-5 to 5V"]}, {"name": "in_range", "values": ["0 to 1", "-1 to 1"]}, {"name": "transpose", "values": ["A", "C"]}], minBlocks: 1, maxBlocks: 1, "calcBlocks": (d) => {return d.blocks;} },
  102: { typeId: 102, name: "Sampler", category: "Audio", blocks: [{"name": "audio in", "direction": 0, "type": 0}, {"name": "record", "direction": 0, "hasParameter": true, "type": 1}, {"name": "sample playback", "direction": 0, "hasParameter": true, "type": 1}, {"name": "playback speed", "direction": 0, "hasParameter": true, "type": 1}, {"name": "start", "direction": 0, "hasParameter": true, "type": 1}, {"name": "length", "direction": 0, "hasParameter": true, "type": 1}, {"name": "cv output", "direction": 1, "type": 1}, {"name": "audio out", "direction": 1, "type": 0}], options: [{"name": "out_range", "values": ["0 to 10V", "0 to 5V", "-5 to 5V"]}, {"name": "in_range", "values": ["0 to 1", "-1 to 1"]}, {"name": "transpose", "values": ["A", "C"]}], minBlocks: 6, maxBlocks: 7, "calcBlocks": (d) => {return d.blocks;} },
  103: { typeId: 103, name: "Device Control", category: "Interface", blocks: [{"name": "bypass", "direction": 0, "hasParameter": true, "type": 1}, {"name": "aux", "direction": 0, "hasParameter": true, "type": 1}, {"name": "performance", "direction": 0, "hasParameter": true, "type": 1}], options: [{"name": "control", "values": ["bypass", "aux", "performance"]}], minBlocks: 1, maxBlocks: 1, "calcBlocks": (d) => {return [d.blocks[d.options[0]]];} },
  104: { typeId: 104, name: "CV Mixer", category: "Control", blocks: [{"name": "CV In 1", "direction": 0, "hasParameter": true, "type": 1}, {"name": "CV In 2", "direction": 0, "hasParameter": true, "type": 1}, {"name": "CV In 3", "direction": 0, "hasParameter": true, "type": 1}, {"name": "CV In 4", "direction": 0, "hasParameter": true, "type": 1}, {"name": "CV In 5", "direction": 0, "hasParameter": true, "type": 1}, {"name": "CV In 6", "direction": 0, "hasParameter": true, "type": 1}, {"name": "CV In 7", "direction": 0, "hasParameter": true, "type": 1}, {"name": "CV In 8", "direction": 0, "hasParameter": true, "type": 1}, {"name": "Attenuator 1", "direction": 0, "hasParameter": true, "type": 1}, {"name": "Attenuator 2", "direction": 0, "hasParameter": true, "type": 1}, {"name": "Attenuator 3", "direction": 0, "hasParameter": true, "type": 1}, {"name": "Attenuator 4", "direction": 0, "hasParameter": true, "type": 1}, {"name": "Attenuator 5", "direction": 0, "hasParameter": true, "type": 1}, {"name": "Attenuator 6", "direction": 0, "hasParameter": true, "type": 1}, {"name": "Attenuator 7", "direction": 0, "hasParameter": true, "type": 1}, {"name": "Attenuator 8", "direction": 0, "hasParameter": true, "type": 1}, {"name": "CV Output", "direction": 1, "type": 1}], options: [{"name": "Number of Channels", "values": [1, 2, 3, 4, 5, 6, 7, 8]}, {"name": "levels", "values": ["summing", "average"]}], minBlocks: 5, maxBlocks: 17, "calcBlocks": (d) => {
      const numInputs = d.options[0] + 1;
      const blocks = [];

      for(let i = 0; i < numInputs; i++){
        blocks.push(d.blocks[i]);
      }
      for(let j = 0; j < numInputs; j++){
        blocks.push(d.blocks[j + 8]);
      }

      blocks.push(d.blocks[16]);

      return blocks;
    } },
  105: { typeId: 105, name: "Logic Gate", category: "Control", blocks: [{"name": "in", "direction": 0, "hasParameter": true, "type": 1}, {"name": "threshold", "direction": 0, "hasParameter": true, "type": 1}, {"name": "CV Out", "direction": 1, "type": 1}], options: [{"name": "operation", "values": ["AND", "OR", "NOR", "NAND", "XOR", "XNOR", "NOT"]}, {"name": "Number of Inputs", values: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39]}, {"name": "threshold", "values": ["off", "on"]}], minBlocks: 4, maxBlocks: 40, "calcBlocks": (d) => {
    const blocks = [];
    for (let i=0; i < d.options[1] - 2; i++) {
      const tempBlock = Object.assign({}, d.blocks[0]);
      tempBlock.name += (i + 1);
      blocks.push(tempBlock);
    }
    blocks.push(d.blocks[1]);
    blocks.push(d.blocks[2]);
    return blocks;
    } },
  106: { typeId: 106, name: "Reverse Delay", category: "Effect", blocks: [{"name": "audio in L", "direction": 0, "type": 0}, {"name": "audio in R", "direction": 0, "type": 0}, {"name": "delay time", "direction": 0, "hasParameter": true, "type": 1}, {"name": "tap tempo in", "direction": 0, "hasParameter": true, "type": 1}, {"name": "tap ratio", "direction": 0, "hasParameter": true, "type": 1}, {"name": "feedback", "direction": 0, "hasParameter": true, "type": 1}, {"name": "pitch", "direction": 0, "hasParameter": true, "type": 1}, {"name": "mix", "direction": 0, "hasParameter": true, "type": 1}, {"name": "audio out L", "direction": 1, "type": 0}, {"name": "audio out R", "direction": 1, "type": 0}], options: [{"name": "channels", "values": ["mono", "stereo"]}, {"name": "control", "values": ["rate", "tap tempo"]}], minBlocks: 6, maxBlocks: 9, "calcBlocks": (d) => {
      const blocks = [d.blocks[0]];
      if (d.options[0] === 1) {
        blocks.push(d.blocks[1]);
      }
      blocks.push(d.blocks[2]);
      blocks.push(d.blocks[3]);
      if (d.options[1] === 1) {
        blocks.push(d.blocks[4]);
      }
      blocks.push(d.blocks[5]);
      blocks.push(d.blocks[6]);
      blocks.push(d.blocks[7]);
      blocks.push(d.blocks[8]);
      if (d.options[0] === 1) {
        blocks.push(d.blocks[9]);
      }

      return blocks;
    } },
  107: { typeId: 107, name: "Univibe", category: "Effect", blocks: [{"name": "audio in L", "direction": 0, "type": 0}, {"name": "audio in R", "direction": 0, "type": 0}, {"name": "rate", "direction": 0, "hasParameter": true, "type": 1}, {"name": "tap tempo in", "direction": 0, "hasParameter": true, "type": 1}, {"name": "direct", "direction": 0, "hasParameter": true, "type": 1}, {"name": "depth", "direction": 0, "hasParameter": true, "type": 1}, {"name": "resonance", "direction": 0, "hasParameter": true, "type": 1}, {"name": "mix", "direction": 0, "hasParameter": true, "type": 1}, {"name": "audio out L", "direction": 1, "type": 0}, {"name": "audio out R", "direction": 1, "type": 0}], options: [{"name": "channels", "values": ["1in->1out", "1in->2out", "stereo"]}, {"name": "control", "values": ["rate", "tap tempo", "cv direct"]}], minBlocks: 6, maxBlocks: 8, "calcBlocks": (d) => {
    const blocks = [d.blocks[0]];
    if (d.options[0] === 2) {
      blocks.push(d.blocks[1]);
    }
    blocks.push(d.blocks[2]);
    blocks.push(d.blocks[3]);
    blocks.push(d.blocks[4]);
    blocks.push(d.blocks[5]);
    blocks.push(d.blocks[6]);
    blocks.push(d.blocks[7]);
    blocks.push(d.blocks[8]);
    if (d.options[0] !== 0) {
      blocks.push(d.blocks[9]);
    }

    return blocks;
    }}
};

export function getModuleDefinition(typeId: number): ModuleDefinition | undefined {
  return MODULE_DEFINITIONS[typeId];
}
