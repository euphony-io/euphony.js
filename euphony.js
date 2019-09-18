/*
 * Copyright 2013-2019 EUPHONY. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export var Euphony = (function() {
    function euphony() {
        var about = {
            VERSION: '0.1.4',
            AUTHOR: "Ji-woong Choi"
        };

        this.FFTSIZE = 2048;
        this.BUFFERSIZE = 2048;

        this.PI = 3.141592653589793;
        this.PI2 = this.PI * 2;
        this.SAMPLERATE = 44100;
        this.SPAN = 86;
        this.ZEROPOINT = 18000;

        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.isSABAvailable = true;
        this.isAudioWorkletAvailable = Boolean(
            this.context.audioWorklet && typeof this.context.audioWorklet.addModule === 'function');

        /*
          DATE : 190916
          Firefox does not support SharedArrayBuffer due to the spectre set of vulnerabilties.
          */
        try {
            let sab = SharedArrayBuffer;
        } catch (e) {
            console.log(e instanceof ReferenceError);
            this.isAudioWorkletAvailable = false;
            this.isSABAvailable = false;
        }
        
        this.scriptProcessor = null;
        this.outBuffer = new Array();
        this.playBuffer = new Array();
        this.playBufferIdx = 0;

        this.startPointBuffer = this.crossfadeStaticBuffer(this.makeStaticFrequency(this.ZEROPOINT - this.SPAN));

        for(let i = 0; i < 16; i++)
            this.outBuffer[i] = this.crossfadeStaticBuffer(this.makeStaticFrequency(this.ZEROPOINT + i * this.SPAN));
//        }
        this.playBufferIdx = 0;
    };

    euphony.prototype = {
        setCode: function(data) {
            let T = this;
            T.playBuffer[0] = T.startPointBuffer;

            var code = "";
            console.log(data);
            for (let i = 0; i < data.length; i++)
                code += data.charCodeAt(i).toString(16);

            console.log(code);
            for (let i = 0; i < code.length; i++) {
                switch (code.charAt(i)) {
                    case '0': case '1': case '2':
                    case '3': case '4': case '5':
                    case '6': case '7': case '8':
                    case '9':
                    T.playBuffer[i + 1] = T.outBuffer[code.charCodeAt(i) - '0'.charCodeAt()];
                    break;
                    case 'a': case 'b': case 'f':
                    case 'c': case 'd': case 'e':
                    T.playBuffer[i + 1] = T.outBuffer[code.charCodeAt(i) - 'a'.charCodeAt() + 10];
                    break;    
                }
                console.log(code.charAt(i));
            }

	    T.playBuffer[code.length+1] = T.outBuffer[T.makeChecksum(code)];
            T.playBuffer[code.length+2] = T.outBuffer[T.makeParallelParity(code)];

            let frameIndex = 0;
            let frameCount = T.BUFFERSIZE * (code.length + 3);
            T.EuphonyArrayBuffer = T.context.createBuffer(2, frameCount, T.SAMPLERATE);
            let buffering1 = T.EuphonyArrayBuffer.getChannelData(0);
            let buffering2 = T.EuphonyArrayBuffer.getChannelData(1);

            for(let i = 0; i < T.playBuffer.length; i++) { // playBuffer's length
                for(let j = 0; j < T.BUFFERSIZE; j++) {
                    buffering2[frameIndex] = buffering1[frameIndex] = T.playBuffer[i][j];
                    frameIndex++;
                }
            }
        },
        play: function() {
            let T = this;
            /* scriptProcessor is deprecated. so apply to AudioWorklet */
            if(T.isAudioWorkletAvailable) {
                /*
                  AudioWorkletNode Declaration
                */
                class EuphonyNode extends AudioWorkletNode {
                    constructor(context) {
                        super(context, 'euphony-processor');
                        this.port.onmessage = e => {
                            console.log(e);
                        };
                        this.port.postMessage({
                            'message': 'created EuphonyNode'
                        });
                    }
                }
                
                let audioWorklet = T.context.audioWorklet;
                T.source = T.context.createBufferSource();
                T.source.buffer = T.EuphonyArrayBuffer;
                T.source.loop = true;
                T.context.audioWorklet.addModule('https://cdn.jsdelivr.net/gh/designe/euphony.js/euphony-processor.js').then(() => {
                    let euphonyWorkletNode = new EuphonyNode(T.context);
                    T.source.connect(euphonyWorkletNode).connect(T.context.destination);
                    T.source.start();
                });
            }
            else
            {
                T.source = T.context.createBufferSource();
                T.source.buffer = T.EuphonyArrayBuffer;
                console.log(T.EuphonyArrayBuffer.length);
                T.scriptProcessor = T.context.createScriptProcessor(0, 0, 2);
                T.scriptProcessor.loop = true;
                T.scriptProcessor.onaudioprocess = function(e) {
                    var outputBuf = e.outputBuffer.getChannelData(0);
                    var outputBuf2 = e.outputBuffer.getChannelData(1);
                    
                    outputBuf.set(T.playBuffer[T.playBufferIdx]);
                    outputBuf2.set(T.playBuffer[T.playBufferIdx]);

                    if(T.playBuffer.length == ++(T.playBufferIdx)) T.playBufferIdx = 0;
                };

                T.source.connect(T.scriptProcessor);
                T.scriptProcessor.connect(T.context.destination);
                T.source.start();
            }
        },
        
        stop: function() {
            let T = this;
            T.source.stop();
            T.source.onended = e => {
                if(T.scriptProcessor){
                    T.scriptProcessor.disconnect(T.context);
                    T.source.disconnect(T.scriptProcessor);
                }
                T.playBuffer = new Array();
                T.playBufferIdx = 0;
            };
        },
        
        makeStaticFrequency: function(freq){
            let T = this;
            let buffer = new Float32Array(T.BUFFERSIZE);
            let pBuffer = buffer;
            
            for (let i = 0; i < T.BUFFERSIZE; i++)
                pBuffer[i] = Math.sin(T.PI2 * freq * (i / T.SAMPLERATE));
            return buffer;
        },

        makeStaticFrequencyBySAB: function(freq, buffer) {
            let T = this;
            let pBuffer = new Float32Array(buffer);
                        
            for (let i = 0; i < T.BUFFERSIZE; i++)
                pBuffer[i] = Math.sin(T.PI2 * freq * (i / T.SAMPLERATE));
            return buffer;
        },
        
        crossfadeStaticBuffer: function(buffer) {
            let T = this;
            var mini_window,
                fade_section = T.BUFFERSIZE / 8;

            let pBuffer = null;
            if(buffer.constructor === Float32Array)
                pBuffer = buffer;
            else
                pBuffer = new Float32Array(buffer);

            for (let i = 0; i < fade_section; i++) {
                mini_window = i / fade_section;
                pBuffer[i] *= mini_window;
                pBuffer[T.BUFFERSIZE - 1 - i] *= mini_window;
            }
            return buffer;
        },
        
        mixRawData: function() {
            let T = this;
            for (let i = 0, n = arguments.length; i < n; i++) {
                t_buffer = T.makeStaticFrequency(arguments[i]);
                for (var j = 0; j < T.BUFFERSIZE; j++) {
                    T.outBuffer[j] = (outBuffer[j] + t_buffer[j])/2;    
                }
            }
        },
        
        maximizeVolume: function() {
            let T = this;
            //SCAN FOR VOLUME UP
            var max = 0;
            for (let i = 0; i < T.BUFFERSIZE; i++) {
                if (max < Math.abs(outBuffer[i]))
                    max = T.outBuffer[i];
            }
            
            if (32767 == max)
                T.outBuffer[i] *= 32767/max;
        },
        
        makeChecksum: function(code){
            var sum = 0;
            for (let i=0; i < code.length; i++) {
                switch (code.charAt(i)) {
                    case '0': case '1': case '2':
                    case '3': case '4': case '5':
                    case '6': case '7': case '8':
                    case '9':
                    sum += code.charCodeAt(i) - '0'.charCodeAt();
                    break;
                    case 'a': case 'b': case 'c':
                    case 'd': case 'e': case 'f':
                    sum += code.charCodeAt(i) - 'a'.charCodeAt() + 10;
                    break;
                }
            }
            sum &= 0xF;
            var checksum = (~sum + 1) & 0xF;
            return checksum;
        },
		
	makeParallelParity: function(code) {
	    let parity1 = 0,
		parity2 = 0,
		parity3 = 0,
		parity4 = 0,
		parity;
	    
	    for(let i=0; i < code.length; i++) {
		let snippet;
		switch (code.charAt(i)) {
                case '0': case '1': case '2':
                case '3': case '4': case '5':
                case '6': case '7': case '8':
                case '9':
                    snippet = code.charCodeAt(i) - '0'.charCodeAt();
                    break;
                case 'a': case 'b': case 'c':
                case 'd': case 'e': case 'f':
                    snippet = code.charCodeAt(i) - 'a'.charCodeAt() + 10;
                    break;
                }
		parity1 += ((0x8 & snippet) >> 3);
		parity2 += ((0x4 & snippet) >> 2);
		parity3 += ((0x2 & snippet) >> 1);
		parity4 += (0x1 & snippet);
	    }
	    
	    parity = (parity1&0x1)*8 + (parity2&0x1)*4 + (parity3&0x1)*2 + (parity4&0x1);
	    console.log("P Parity :: " + parity1 + " " + parity2 + " " + parity3 + " " + parity4 + " = " + parity);
	    return parity;
	}
    };
    
    return euphony;
}());
