var expect = chai.expect;


describe('#MY_EUPHONY_TEST', function () {
    let euphy = new Euphony();
    it('Channel Setting', function () {
        let euphy = new myEuphony();
        euphy.setChannel(1);
        let expected = euphy.CHANNEL;

        expect(expected).to.equal(1);
    });
});
