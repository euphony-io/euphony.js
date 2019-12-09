const expect = require('chai').expect;

const myEuphony = require('../euphony.js');

describe('MY EUPHONY TEST', function () {
    it('Channel Setting', function () {
        let euphy = new myEuphony();
        euphy.setChannel(1);
        let expected = euphy.CHANNEL;

        expect(expected).to.equal(1);
    });
});
