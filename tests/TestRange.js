"use strict";

var Range = require("../range").Range;
var ArrayRange = require("../range").ArrayRange;
var expect = require("chai").expect;

describe("Test ArrayRange object", function () {

    it("Test range construction", function () {
        var ar = new ArrayRange();
        expect(ar.intervals.length).to.equal(0, "Initial intervals in range is not 0");
        expect(ar.empty()).to.equal(true, "Empty property did not match state of the " +
            "range");

        ar.add([10, 20]);
        expect(ar.empty()).to.equal(false, "Empty property did not match state of the " +
            "range");
        expect(ar.intervals.length).to.equal(1, "Length of interval did not change " +
            "after call to 'add'");
        expect(ar.length).to.equal(ar.intervals.length, "Length of range did not " +
            "match length of intervals");
        expect(ar.from(0)).to.equal(10);
        expect(ar.to(0)).to.equal(20);
        expect(ar.inRange(15)).to.be.true;
        expect(ar.inRange(20)).to.be.true;
        expect(ar.inRange(10)).to.be.true;
        expect(ar.inRange(9)).to.be.false;
        expect(ar.inRange(21)).to.be.false;

        ar.add([30, 40]);
        expect(ar.length).to.equal(2, "Length mismatch after adding a second interval");
        expect(ar.inRange(30)).to.be.true;
        expect(ar.inRange(40)).to.be.true;
        expect(ar.inRange(29)).to.be.false;
        expect(ar.inRange(41)).to.be.false;

        // Extend the first interval at the beginning[10, 20] => [5, 20]
        ar.add([5, 12]);
        expect(ar.from(0)).to.equal(5);
        expect(ar.to(0)).to.equal(20);

        // Extend the first interval at the end[5, 20] => [5, 25]
        ar.add([14, 25]);
        expect(ar.from(0)).to.equal(5);
        expect(ar.to(0)).to.equal(25);

        // Extend the first interval on both ends[5, 25] => [3, 27]
        ar.add([3, 27]);
        expect(ar.from(0)).to.equal(3);
        expect(ar.to(0)).to.equal(27);

        // Merge the intervals by insertion
        ar.add([20, 30]);
        expect(ar.length).to.equal(1, "Length mismatch after adding a connecting range.");
        expect(ar.from(0)).to.equal(3);
        expect(ar.to(0)).to.equal(40);

        // Subtract at the beginning
        ar.subtract(1, 5);
        expect(ar.length).to.equal(1, "Length mismatch after subtracting an interval.");
        expect(ar.from(0)).to.equal(5);
        expect(ar.to(0)).to.equal(40);

        // Subtract at the end
        ar.subtract(35, 40);
        expect(ar.length).to.equal(1, "Length mismatch after subtracting an interval.");
        expect(ar.from(0)).to.equal(5);
        expect(ar.to(0)).to.equal(35);

        // Subtract from the middle
        ar.subtract(15, 25);

        // Multi arguments addition and subtraction
        ar.clear();
        ar.add([10, 20], [40, 60], [80, 100]);
        ar.subtract([12, 18], [30, 45], [90, 110]);
        expect(ar.inRange(10)).to.be.equal(true, ar.intervals.toJSONEx());
        expect(ar.inRange(20)).to.be.equal(true, ar.intervals.toJSONEx());
        expect(ar.inRange(15)).to.be.equal(false, ar.intervals.toJSONEx());
        expect(ar.inRange(45)).to.be.equal(true, ar.intervals.toJSONEx());
        expect(ar.inRange(60)).to.be.equal(true, ar.intervals.toJSONEx());
        expect(ar.inRange(42)).to.be.equal(false, ar.intervals.toJSONEx());
        expect(ar.inRange(80)).to.be.equal(true, ar.intervals.toJSONEx());
        expect(ar.inRange(90)).to.be.equal(true, ar.intervals.toJSONEx());
        expect(ar.inRange(95)).to.be.equal(false, ar.intervals.toJSONEx());

        ar.clear();
        expect(ar.length).to.equal(0, "Intervals were not remove after call to clear");

        // Test combine
        ar.add([10, 20], [30, 40]);
        let ar2 = new ArrayRange();
        ar2.add ([15, 30], [60, 70]);
        ar.combine(ar2);
        expect(ar.inRange(10)).to.be.equal(true, ar.intervals.toJSONEx());
        expect(ar.inRange(30)).to.be.equal(true, ar.intervals.toJSONEx());
        expect(ar.inRange(40)).to.be.equal(true, ar.intervals.toJSONEx());
        expect(ar.inRange(60)).to.be.equal(true, ar.intervals.toJSONEx());
        expect(ar.inRange(70)).to.be.equal(true, ar.intervals.toJSONEx());
        expect(ar.inRange(29)).to.be.equal(true, ar.intervals.toJSONEx());
        expect(ar.inRange(31)).to.be.equal(true, ar.intervals.toJSONEx());
        expect(ar.inRange(9)).to.be.equal(false, ar.intervals.toJSONEx());
        expect(ar.inRange(41)).to.be.equal(false, ar.intervals.toJSONEx());
        expect(ar.inRange(59)).to.be.equal(false, ar.intervals.toJSONEx());
        expect(ar.inRange(71)).to.be.equal(false, ar.intervals.toJSONEx());

        // Test exclude
        ar.clear();
        ar.add([10, 20], [30, 40]);
        ar2 = new ArrayRange();
        ar2.add([15, 17], [35, 37]);
        ar.exclude(ar2).toString();
        expect(ar.length).to.equal(4);
        expect(ar.inRange(10)).to.be.true;
        expect(ar.inRange(15)).to.be.true;
        expect(ar.inRange(17)).to.be.true;
        expect(ar.inRange(20)).to.be.true;
        expect(ar.inRange(30)).to.be.true;
        expect(ar.inRange(35)).to.be.true;
        expect(ar.inRange(37)).to.be.true;
        expect(ar.inRange(40)).to.be.true;
        expect(ar.inRange(16)).to.be.false;
        expect(ar.inRange(25)).to.be.false;
        expect(ar.inRange(36)).to.be.false;

        // Test same
        ar.clear();
        ar.add([10, 20], [40, 60], [80,100]);
        ar2.clear();
        ar2.add(10, 100);
        ar2.subtract([20, 40], [60, 80]);
        expect(ar.same(ar2)).to.equal(true, "Range '" + ar.intervals.toJSONEx() +
            "' is not equal to '" +
            ar2.intervals.toJSONEx() + "'");
        ar2.subtract(80, 85);
        expect(ar.same(ar2)).to.equal(false, "Range '" + ar.intervals.toJSONEx() +
            "' is equal to '" +
            ar2.intervals.toJSONEx() + "'");

        // Test exceptions
        expect(function() { ar.add(10) }).to.throw();
        expect(function() { ar.add(10, 5) }).to.throw();
        expect(function() { ar.add(10, 20, 10) }).to.throw();
        expect(function() { ar.add({}); }).to.throw();
        expect(function() { ar.combine([10, 20]) }).to.throw();
        expect(Range).to.throw();
        expect(function() { ar.from(100); }).to.throw();
        expect(function() { ar.to(100); }).to.throw();
        expect(function() { ar.inRange(); }).to.throw();
    });



});
