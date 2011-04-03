/*!
* Flocking - Creative audio synthesis for the Web!
* http://github.com/colinbdclark/flocking
*
* Copyright 2011, Colin Clark
* Dual licensed under the MIT or GPL Version 2 licenses.
*/

/*global module, test, expect, ok, equals, deepEqual, Float32Array*/

var flock = flock || {};

(function () {
    "use strict";
    
    flock.tests = function () {
        var simpleSynthDef = {
            ugen: "flock.ugen.stereoOut",
            inputs: {
                source: {
                    id: "sine",
                    ugen: "flock.ugen.sinOsc",
                    inputs: {
                        freq: 440,
                        mul: {
                            id: "mod",
                            ugen: "flock.ugen.sinOsc",
                            inputs: {
                                freq: 1.0
                            }
                        }
                    }
                }
            }
        };
        
        var createSynth = function (synthDef) {
            return flock.synth(synthDef || simpleSynthDef, 1, 1);
        };
        
        var countKeys = function (obj) {
            var numKeys = 0,
                key;
            for (key in obj) {
                numKeys++;
            }
            return numKeys;
        };
        
        module("Utility tests");
        
        test("flock.fillBuffer()", function () {
            var actual = flock.fillBuffer(new Float32Array(3), 42);
            var expected = new Float32Array([42, 42, 42]);
            deepEqual(actual, expected, 
                "fillBuffer() should fill a three-element buffer with three instance of the specified value of 42.");
        });
        
        test("flock.minBufferSize()", function () {
            var minSize = flock.minBufferSize(44100, 2, 500);
            equals(minSize, 44100, 
                "The mininum buffer size for a 44100 KHz stereo signal with 500ms latency should be 44100");
            minSize = flock.minBufferSize(44100, 1, 500);
            equals(minSize, 22050, 
                "The mininum buffer size for a 44100 KHz mono signal with 500ms latency should be 22050");
            minSize = flock.minBufferSize(48000, 2, 250);
            equals(minSize, 24000, 
                "The mininum buffer size for a 48000 KHz stereo signal with 250ms latency should be 24000");
                
        });
        
        module("Synth tests");
        
        test("Get input values", function () {
            var synth = createSynth();
            
            expect(5);
            
            // Getting simple values.
            equals(synth.input("sine.freq"), 440, "Getting 'sine.freq' should return the value set in the synthDef.");
            equals(synth.input("sine.freq"), 440, "Getting 'sine.freq' a second time should return the same value.");
            equals(synth.input("mod.freq"), 1.0, "Getting 'carrier.freq' should also return the initial value.");
            
            // Get a ugen.
            var ugen = synth.input("mod");
            ok(ugen.gen, "A ugen returned from synth.input() should have a gen() property...");
            equals(typeof (ugen.audio), "function", "...of type function");
        });
        
        test("Set input values", function () {
            var synth = createSynth(),
                sineUGen = synth.ugens.sine,
                modUGen = synth.ugens.mod;
            
            // Setting simple values.
            synth.input("sine.freq", 220);
            equals(synth.input("sine.freq"), 220, "Setting 'sine.freq' should update the input value accordingly.");
            equals(sineUGen.inputs.freq.model.value, 220, "And the underlying value ugen should also be updated.");
            synth.input("sine.freq", 110);
            equals(synth.input("sine.freq"), 110, "Setting 'sine.freq' a second time should also work.");
            equals(sineUGen.inputs.freq.model.value, 110, "And the underlying value ugen should also be updated.");
            synth.input("mod.freq", 2.0);
            equals(synth.input("mod.freq"), 2.0, "Setting 'mod.freq' should update the input value.");
            equals(modUGen.inputs.freq.model.value, 2.0, "And the underlying value ugen should also be updated.");
            equals(modUGen.inputs.freq.output[0], 2.0, "Even the ugen's output buffer should contain the new value.");
            
            // Set a ugen def.
            var testUGenDef = {
                ugen: "flock.ugen.dust",
                inputs: {
                    density: 200
                }
            };
            var dust = synth.input("sine.mul", testUGenDef);
            equals(synth.ugens.sine.inputs.mul, dust, "The 'mul' ugen should be set to our test Dust ugen.");
            equals(synth.ugens.sine.inputs.mul.inputs.density.model. value, 200, 
                "The ugen should be set up correctly.");
        });


        module("Parsing tests");
        
        var checkParsedTestSynthDef = function (synthDef) {
            var parsedUGens = flock.parse.synthDef(synthDef, 1, 1, 2); // One sample buffer and sampleRate. Stereo output.
                      
            equals(countKeys(parsedUGens), 3, "There should be three named ugens.");            
            ok(parsedUGens[flock.OUT_UGEN_ID], "The output ugen should be at the reserved key flock.OUT_UGEN_ID.");
            
            ok(parsedUGens.sine, "The sine ugen should be keyed by its id....");
            ok(parsedUGens.sine.wavetable, "...and it should be a real sine ugen.");
            
            ok(parsedUGens.mul, "The mul ugen should be keyed by its id...");
            ok(parsedUGens.mul.model.value, "...and it should be a real value ugen.");
        };
        
        test("flock.parse.synthDef(), no output specified", function () {
            var condensedTestSynthDef = {
                id: "sine",
                ugen: "flock.ugen.sinOsc",
                inputs: {
                    freq: 440,
                    mul: {
                        id: "mul",
                        ugen: "flock.ugen.value",
                        inputs: {
                            value: 1.0
                        }
                    }
                }
            };

            checkParsedTestSynthDef(condensedTestSynthDef);
        });
        
        test("flock.parse.synthDef(), output specified", function () {
            var expandedTestSynthDef = {
                id: flock.OUT_UGEN_ID,
                ugen: "flock.ugen.stereoOut",
                inputs: {
                    source: {
                        id: "sine",
                        ugen: "flock.ugen.sinOsc",
                        inputs: {
                            freq: 440,
                            mul: {
                                id: "mul",
                                ugen: "flock.ugen.value",
                                inputs: {
                                    value: 1.0
                                }
                            }
                        }
                    }
                }
            };
            checkParsedTestSynthDef(expandedTestSynthDef);
        });
    };
})();