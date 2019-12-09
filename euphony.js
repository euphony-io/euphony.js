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
            VERSION: '0.2.1',
            AUTHOR: "Ji-woong Choi"
        };
        this.BUFFERSIZE = 2048;

        this.PI = 3.141592653589793;
        this.PI2 = this.PI * 2;
        this.SAMPLERATE = 44100;
        this.SPAN = 86;
        this.BASE_FREQUENCY = 18000; 
        this.CHANNEL = 1;
        this.setModulation("CPFSK");

        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.isSABAvailable = true;
        this.isAudioWorkletAvailable = Boolean(
            this.context.audioWorklet && typeof this.context.audioWorklet.addModule === 'function');

        this.isPlaying = false;
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

        this.initBuffers();
    };

    euphony.prototype = {
        initBuffers: function() {
            let T = this;

            T.scriptProcessor = null;
            T.outBuffer = new Array();
            T.playBuffer = new Array();
            T.playBufferIdx = 0;

            T.startPointBuffer = T.crossfadeStaticBuffer(T.makeStaticFrequency(T.BASE_FREQUENCY - T.SPAN));
            T.zeroBuffer = T.makeZeroSource();
            /*
              CHANNEL 1 : 0 ~ 16
              CHANNEL 2 : 17 ~ 32
            */
            for(let i = 0; i < 32; i++) {
                T.outBuffer[i] = T.crossfadeStaticBuffer(T.makeStaticFrequency(T.BASE_FREQUENCY + i * T.SPAN));
            }
            T.playBufferIdx = 0;
            T.progressIdx = 0;
            T.cp_index = 0;
            T.cp_last_theta = 0;
        },
        setCode: function(data) {
            let T = this;

            /* 1) Ss is starting buffer to use trigger point
               S includes starting buffer with crossfade effect.
               s is only starting buffer.
             */
            let code = "Ss";

            /* 2) Generate pure data code */
            let data_code = "";
            for (let i = 0; i < data.length; i++)
                data_code += data.charCodeAt(i).toString(16);
            code += data_code;

            /* 3) Generate checksum & parity code */
            code += T.makeChecksum(data_code).toString(16);
            code += T.makeParallelParity(data_code);

            /* 4) Setting Euphony Code */
            T.setInnerCode(code);
            
            /* 4) copy playBuffer to web audio buffer to use Web Audio API */
            T.applyAudioBuffer();
        },
        /*
          Function Name :setInnerCode
          Description : Code Interpreter
         */
        setInnerCode: function(code) {
            let T = this;

            console.log(code);
            switch(T.MODULATION_TYPE) {
            case 0: // ASK
                for(let i = 0; i < code.length; i++) {
                    let c = code[i];
                    switch(c) {
                        /* STARTING PART */
                    case 'S':
                    case 's':
                        T.playBuffer[T.playBufferIdx++] = T.crossfadeStaticBuffer(T.makeStaticFrequency(T.BASE_FREQUENCY - T.SPAN), 3);
                        break;
                        /* DATA CODE PART */
                    case '0': case '1': case '2':
                    case '3': case '4': case '5':
                    case '6': case '7': case '8':
                    case '9': case 'a': case 'b':
                    case 'c': case 'd': case 'e':
                    case 'f': {
                        let code_idx = parseInt(c, 16);
                        // change hexa to binary
                        let code_idx_binary = code_idx.toString(2);
                        for(let ci = 0; ci < code_idx_binary.length; ci++) {
                            T.playBuffer[T.playBufferIdx++] = T.getOutBuffer(code_idx_binary[ci] - '0');
                        }
                    }
                        break;
                    }
                }
                break;
            case 1: // FSK
                for(let i = 0; i < code.length; i++) {
                    let c = code[i];
                    switch(c) {
                        /* STARTING PART */
                    case 'S': case 's': 
                        T.playBuffer[T.playBufferIdx++] = T.crossfadeStaticBuffer(T.makeStaticFrequency(T.BASE_FREQUENCY - T.SPAN), 3);
                        break;
                        /* DATA CODE PART */
                    case '0': case '1': case '2':
                    case '3': case '4': case '5':
                    case '6': case '7': case '8':
                    case '9': case 'a': case 'b':
                    case 'c': case 'd': case 'e':
                    case 'f': {
                        let code_idx = parseInt(c, 16);
                        T.playBuffer[T.playBufferIdx++] = T.getOutBuffer(code_idx);
                    }
                        break;
                    }
                }
                break;
            case 2: // CPFSK
                for(let i = 0; i < code.length; i++) {
                    let c = code[i];
                    switch(c) {
                        /* STARTING PART */
                    case 'S':
                        T.playBuffer[T.playBufferIdx++] = T.crossfadeStaticBuffer(T.makeFrequencyByCP(T.BASE_FREQUENCY - T.SPAN), 2);
                        break;
                    case 's':
                        T.playBuffer[T.playBufferIdx++] = T.makeFrequencyByCP(T.BASE_FREQUENCY - T.SPAN);
                        break;
                        /* DATA CODE PART */
                    case '0': case '1': case '2':
                    case '3': case '4': case '5':
                    case '6': case '7': case '8':
                    case '9': case 'a': case 'b':
                    case 'c': case 'd': case 'e':
                    case 'f': {
                        let code_idx = parseInt(c, 16);
                        T.playBuffer[T.playBufferIdx++] = T.getOutBuffer(code_idx);
                    }
                        break;
                    }
                }
                // fade out
                T.playBuffer[T.playBufferIdx - 1] = T.crossfadeStaticBuffer(T.playBuffer[T.playBufferIdx -1], 1);
                break;
            }
        },
        /*
          modulation_types
          0) ASK (Amplitude Shift Keying)
          1) FSK (Frequency Shift Keying)
          2) CPFSK (Continuous Phase Frequency Shift Keying)
        */
        setModulation: function(mode) {
            let T = this;

            switch(mode) {
            case "ASK": case "ask":
                T.MODULATION_TYPE = 0;
                break;
            case "FSK": case "fsk":
                T.MODULATION_TYPE = 1;
                break;
            case "CPFSK": case "cpfsk":
            default: // if abnormal mode is inserted, default type is CPFSK.
                T.MODULATION_TYPE = 2;
                break;
            }
        },
        applyAudioBuffer: function() {
            let T = this;

            console.log(T.playBuffer);
            let frameIndex = 0;
            let frameCount = T.BUFFERSIZE * T.playBufferIdx;
            T.EuphonyArrayBuffer = T.context.createBuffer(T.CHANNEL, frameCount, T.SAMPLERATE);

            let buffering = [];
            let bufferingIdx = [];
            for(let i = 0; i < T.CHANNEL; i++){
                buffering[i] = T.EuphonyArrayBuffer.getChannelData(i);
                bufferingIdx[i] = 0;
            }
            
            for(let i = 0; i < T.playBuffer.length; i+=T.CHANNEL) {
                for(let j = 0; j < T.BUFFERSIZE; j++) {
                    for(let c = 0; c < T.CHANNEL; c++) {
                        if(T.playBuffer[i+c]) buffering[c][bufferingIdx[c]++] = T.playBuffer[i + c][j];
                    }
                }
            }
        },
        play: function(isLoop = true) {
            let T = this;
            if(T.isPlaying)
                return;
            /* scriptProcessor is deprecated. so apply to AudioWorklet */
            if(T.isAudioWorkletAvailable) {
                /* AudioWorkletNode Declaration */
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
                T.source.loop = isLoop;
                T.context.audioWorklet.addModule('https://cdn.jsdelivr.net/gh/designe/euphony.js/euphony-processor.js').then(() => {
                    let euphonyWorkletNode = new EuphonyNode(T.context);
                    T.source.connect(euphonyWorkletNode).connect(T.context.destination);
                    T.source.start();
                    T.isPlaying = true;
                });
            }
            else
            {
                T.source = T.context.createBufferSource();
                T.source.buffer = T.context.createBuffer(2, T.SAMPLERATE*2, T.SAMPLERATE);
                T.scriptProcessor = T.context.createScriptProcessor(T.BUFFERSIZE, 0, 2);
                T.scriptProcessor.loop = isLoop;
                T.scriptProcessor.onaudioprocess = function(e) {
                    var outputBuf = e.outputBuffer.getChannelData(0);
                    var outputBuf2 = e.outputBuffer.getChannelData(1);
                    
                    outputBuf.set(T.playBuffer[T.progressIdx]);
                    outputBuf2.set(T.playBuffer[T.progressIdx]);

                    if(T.playBuffer.length == ++(T.progressIdx)) T.progressIdx = 0;
                };

                T.source.connect(T.scriptProcessor);
                T.scriptProcessor.connect(T.context.destination);
                T.source.start();
                T.isPlaying = true;
            }
        },
        
        stop: function() {
            let T = this;
            T.source.stop();
            if(T.source.onended){
                T.source.onended = function(e) {
                    if(T.scriptProcessor){
                        T.scriptProcessor.disconnect(T.context);
                        T.source.disconnect(T.scriptProcessor);
                    }
                };
            } else {
                /* Firefox does not have an onended callback function */
                if(T.scriptProcessor) {
                    T.scriptProcessor.disconnect(T.context);
                    T.source.disconnect(T.scriptProcessor);
                }
            }
            T.playBuffer = new Array();
            T.playBufferIdx = 0;
            T.isPlaying = false;
        },

        makeZeroSource: function() {
            let T = this;
            let buffer = new Float32Array(T.BUFFERSIZE);

            for(let i = 0; i < T.BUFFERSIZE; i++)
                buffer[i] = 0;

            return buffer;
        },
        
        makeStaticFrequency: function(freq){
            let T = this;
            let buffer = new Float32Array(T.BUFFERSIZE);
            
            for (let i = 0; i < T.BUFFERSIZE; i++)
                buffer[i] = Math.sin(T.PI2 * freq * (i / T.SAMPLERATE));
            return buffer;
        },

        /* Continuous Phase Frequency */
        makeFrequencyByCP: function(freq) {
            let T = this;
            let buffer = new Float32Array(T.BUFFERSIZE);
            let buffer_idx = 0;

            let x = T.PI2 * freq;
            let i = T.cp_index;
            let buffer_size = T.cp_index + T.BUFFERSIZE;
            let theta_diff = x * (T.cp_index / T.SAMPLERATE) - T.cp_last_theta;
            for (; i < buffer_size; i++) {
                let theta = x * i / T.SAMPLERATE - theta_diff;
                buffer[buffer_idx++] = Math.sin(theta);
            }
            T.cp_index = i;
            T.cp_last_theta = x * T.cp_index / T.SAMPLERATE - theta_diff;
            
            return buffer;
        },

        /* 18000, 18100, 18200, 18300 */
        makeTestFrequency:function(f1, f2, f3, f4) {
            let T = this;
            let pBuffer = new Float32Array(T.BUFFERSIZE);

            let x = 0;
            let last_x = 0;
            let offset = T.BUFFERSIZE >> 2;
            let i = 0;
            let x_diff = 0;
            for(; i < offset; i++) {
                x = T.PI2 * f1 * (i / T.SAMPLERATE);
                pBuffer[i] = Math.sin(x);
            }
            last_x = T.PI2 * f1 * (i / T.SAMPLERATE) - x_diff;
            x_diff = T.PI2 * f2 * (i / T.SAMPLERATE) - last_x;
            for(; i < offset*2; i++) {
                x = T.PI2 * f2 * (i / T.SAMPLERATE) - x_diff;//last_x;
                pBuffer[i] = Math.sin(x);
            }
            last_x = T.PI2 * f2 * (i / T.SAMPLERATE) - x_diff;
            x_diff = T.PI2 * f3 * (i / T.SAMPLERATE) - last_x;
            for(; i < offset*3; i++) {
                x = T.PI2 * f3 * (i / T.SAMPLERATE) - x_diff;
                pBuffer[i] = Math.sin(x);
            }
            last_x = T.PI2 * f3 * (i / T.SAMPLERATE) - x_diff;
            x_diff = T.PI2 * f4 * (i / T.SAMPLERATE) - last_x;
            for(; i < offset*4; i++) {
                x = T.PI2 * f4 * (i / T.SAMPLERATE) - x_diff;
                pBuffer[i] = Math.sin(x);
            }

            pBuffer = T.crossfadeStaticBuffer(pBuffer, 3);

            T.playBuffer[T.playBufferIdx++] = pBuffer;
            return pBuffer;
        },

        makeStaticFrequencyBySAB: function(freq, buffer) {
            let T = this;
            let pBuffer = new Float32Array(buffer);
                        
            for (let i = 0; i < T.BUFFERSIZE; i++)
                pBuffer[i] = Math.sin(T.PI2 * freq * (i / T.SAMPLERATE));
            return buffer;
        },

        /* 
           cf_type = 1(01), 2(10), 3(11)
         */
        crossfadeStaticBuffer: function(buffer, cf_type = 3) {
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
                switch(cf_type) {
                case 1:
                    pBuffer[T.BUFFERSIZE - 1 - i] *= mini_window;
                    break;
                case 2:
                    pBuffer[i] *= mini_window;                    
                    break;
                case 3:
                    pBuffer[i] *= mini_window;
                    pBuffer[T.BUFFERSIZE - 1 - i] *= mini_window;
                    break;
                }
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
	},

        setChannel: function(ch) {
            /* 1 and 2 channels are only available now. */
            if(ch > 2) ch = 2;
            this.CHANNEL = ch;
        },

        getChannel: function() {
            return this.CHANNEL;
        },

        setBufferSize: function(size) {
            this.BUFFERSIZE = size;
            this.initBuffers();
        },

        getBufferSize: function() {
            return this.BUFFERSIZE;
        },

        setBaseFrequency: function(freq) {
            this.BASE_FREQUENCY = freq;
            this.initBuffers();
        }

        getOutBuffer: function(outBufferIdx) {
            let T = this;
            switch(T.MODULATION_TYPE) {
            case 0: // ASK
                switch(T.CHANNEL) {
                case 1:
                default:
                    return (outBufferIdx == 1) ? T.outBuffer[0] : T.zeroBuffer;
                case 2:
                    if(T.playBufferIdx & 1) {
                        return (outBufferIdx == 1) ? T.outBuffer[0] : T.zeroBuffer;
                    } else {
                        return (outBufferIdx == 1) ? T.outBuffer[16] : T.zeroBuffer;
                    }
                }
                break;
            case 1: // FSK
                switch(T.CHANNEL) {
                case 1:
                default:
                    return T.outBuffer[outBufferIdx];
                case 2:
                    if(T.playBufferIdx & 1) {
                        return T.outBuffer[outBufferIdx];
                    } else {
                        return T.outBuffer[outBufferIdx + 16];
                    }
                }
                break;
            case 2: // CPFSK
                switch(T.CHANNEL) {
                case 1:
                case 2: // Channel of CPFSK Modulation is not supported yet.
                    /*
                      TODO: CPFSK's multi channel concept.
                     */
                default:
                    return T.makeFrequencyByCP(T.BASE_FREQUENCY + outBufferIdx * T.SPAN);
                }
                break;                
            }
        }
    };
    
    return euphony;
}());
