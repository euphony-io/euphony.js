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
