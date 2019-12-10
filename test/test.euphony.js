var expect = chai.expect;

let euphy = new Euphony();
describe('#Euphony Setting Test', function () {
    let expected = NaN;
    it('Channel Setting', function () {
        euphy.setChannel(1);
        expected = euphy.CHANNEL;
        expect(expected).to.equal(1);

        euphy.setChannel(2);
        expected = euphy.CHANNEL;
        expect(expected).to.equal(2);
    });

    it('Modulation Setting', function () {
        euphy.setModulation("ASK");
        expected = euphy.MODULATION_TYPE;
        expect(expected).to.equal(0);

        euphy.setModulation("FSK");
        expected = euphy.MODULATION_TYPE;
        expect(expected).to.equal(1);

        euphy.setModulation("CPFSK");
        expected = euphy.MODULATION_TYPE;
        expect(expected).to.equal(2);
    });

    it('Base Frequency Setting', function () {
        euphy.setBaseFrequency(19000);
        expected = euphy.BASE_FREQUENCY;
        expect(expected).to.equal(19000);
    });
    
    it('Buffer Size Setting', function () {
        // DEFAULT CHECK
        expect(euphy.outBuffer).to.be.an.instanceOf(Array);
        expect(euphy.outBuffer[0]).to.have.lengthOf(2048);
        expect(euphy.outBuffer).to.be.an('array').that.is.not.empty;
        expect(euphy.outBuffer).to.have.lengthOf(32);
        
        euphy.setBufferSize(44100); // 1 sec
        expected = euphy.BUFFERSIZE;
        expect(expected).to.equal(44100);

        // After Setting
        expect(euphy.outBuffer).to.be.an.instanceOf(Array);
        expect(euphy.outBuffer).to.be.an('array').that.is.not.empty;
        expect(euphy.outBuffer).to.have.lengthOf(32);
        expect(euphy.outBuffer[0]).to.have.lengthOf(44100);
        
    });

    it('Setting Input Data', function() {
        euphy.setCode("Euphony is acoustic data communication library");
        expect(euphy.playBufferIdx).to.equal(96);
    });
});

describe('#Euphony Error Correction', function() {
    let expected = NaN;
    it('Checksum', function() {
        expected = euphy.makeChecksum("abcdef");
        expect(expected).to.equal(5);
    });
    it('Parity Check', function() {
        expected = euphy.makeParallelParity("abcdef");
        expect(expected).to.equal(1);
    });
});
