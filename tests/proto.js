"use strict";

require("../proto");
var expect = require("chai").expect;

// ===========================
// Object Prototype Test Suite
// ===========================
describe("Object Prototype Test Suite", function() {
    function TestObj() {}
    var obj = new TestObj;
    describe("Object.className", function ()
    {
        it("[TestObj].className()", function () { expect(obj.className()).to.equal("TestObj"); });
        it("[String].className()", function () { expect("".className()).to.equal("String"); });
        it("[Date].className()", function () { expect(new Date().className()).to.equal("Date"); });
        it("[Function].className()", function () { expect(Date.className()).to.equal("Function"); });
    });

    describe("Object.copy", function () {
        it("Copy object with children", function () {
            var obj = {
                Name: "John", Last: "Doe",
                Children: [
                    { Name: "Foo", Last: "Bar" },
                    { Name: "Hello", Last: "World"}
                ]
            };
            var obj2 = Object.copy(obj);

            // Equality
            expect(obj2).to.deep.equal(obj);

            // Inequality
            obj2.Age = 43;
            expect(obj).not.to.equal(obj2);
        });

        it("Copy primitive types", function () {
            var val = Object.copy(23);
            expect(23).to.equal(Object.copy(23));
            expect("text").to.equal(Object.copy("text"));
            expect(undefined).to.equal(Object.copy(undefined));
        });

        it("Copy null value", function () {
            expect(null).to.equal(Object.copy(null));
        });
    });

    it("Object.prototype.is", function () {
        expect((23).is(Number)).to.equal(true);
        expect((23).is(Date)).to.equal(false);

        expect("".is(String)).to.equal(true);
        expect(''.is(Date)).to.equal(false);

        expect(new Date().is(Date)).to.equal(true);
        expect(new Date().is(Number)).to.equal(false);

        expect([].is(Array)).to.equal(true);
        expect([].is(Number)).to.equal(false);

        function TestObj() {}
        expect(new TestObj().is(TestObj)).to.equal(true);
        expect(new TestObj().is(Object)).to.equal(true);
        expect(new TestObj().is(Number)).to.equal(false);

        expect(TestObj.is(Function)).to.equal(true);
        expect(TestObj.is(Number)).to.equal(false);
    });

    it("Object.property.isPrimitive", function () {
        expect((23).isPrimitive()).to.equal(true);
        expect("".isPrimitive()).to.equal(true);
        expect((true).isPrimitive()).to.equal(true);
        expect((false).isPrimitive()).to.equal(true);
        expect(new Date().isPrimitive()).to.equal(false);
        expect([].isPrimitive()).to.equal(false);
        expect({}.isPrimitive()).to.equal(false);
    });

    describe("Object.prototype.clone", function () {
        it("Clone object with children", function () {
            var obj = {
                Name: "John", Last: "Doe",
                Children: [
                    { Name: "Foo", Last: "Bar" },
                    { Name: "Hello", Last: "World"}
                ]
            };
            var obj2 = obj.clone();
            expect(obj).to.deep.equal(obj2);
        });

        it("Shallow clone object", function () {
            var obj = { Name: "John", Last: "Doe" };
            var children = [
                { Name: "Foo", Last: "Bar" },
                { Name: "Hello", Last: "World"}
            ];
            var obj_with_children = obj.clone();
            obj_with_children.children = children;
            var obj2 = obj_with_children.clone(false);
            expect(obj).to.not.deep.equal(obj_with_children);
            expect(obj).to.deep.equal(obj2);
        });

        it("Clone primitives and dates", function () {
            expect((23).clone()).to.equal(23);
            expect("test".clone()).to.equal("test");
            var now = new Date();
            expect(now.clone()).to.not.equal(now);
            expect(now.clone().getTime()).to.equal(now.getTime());
        });
    });

    describe("Object.prototype.merge", function () {
        var obj1 = {
            Name: "John", Last: "Doe", HomeState: "California",
            Children: [
                { Name: "Jonh", Last: "Doe Jr" },
                { Name: "Jane", Last: "Doe Jr" }
            ]
        };

        var obj2 = { Name: "Jane", Last: "Smith" };

        var obj3 = { Name: "Carlos", Last: "Galavis", Age: 43, Children:  [
            {Name: "Same", Age: 18},
            {Name: "Agatha", Age: 27}
        ]};
        var merged_obj;

        it("Deep merge with no overwrite", function () {
            merged_obj = Object.copy(obj2).merge(obj1);
            expect(obj1.HomeState).to.equal(merged_obj.HomeState);
            expect(obj1.Children).to.deep.equal(merged_obj.Children);
            expect(obj1.Name).to.not.equal(merged_obj.Name);
            expect(obj1.Last).to.not.equal(merged_obj.Last);

        });

        it("Deep Merge with overwrite", function () {
            expect(obj1).to.deep.equal(obj2.clone().merge(obj1, true));
        });

        it("Deep merge with partial child object overwrite", function () {
            merged_obj = obj1.clone().merge(obj3, false);
            expect(merged_obj.contains(obj1)).to.equal(true, "obj1 not contained");
            expect(merged_obj.contains(obj3)).to.equal(false, "obj3 is contained");
            expect(merged_obj.Children[0].Age).to.equal(18, "Missing 'Age' from obj3");
            expect(merged_obj.Children[1].Age).to.equal(27, "Missing 'Age' from obj3");

            merged_obj = obj1.clone().merge(obj3, true);
            expect(merged_obj.contains(obj1)).to.equal(false, "obj1 is contained");
            expect(merged_obj.contains(obj3)).to.equal(true, "obj3 not contained");
            expect(merged_obj.Children[0].Last).to.equal("Doe Jr",
                "Missing 'Age' from obj3");
            expect(merged_obj.Children[1].Last).to.equal("Doe Jr",
                "Missing 'Age' from obj3");
        });

        it("Shallow merge no overwrite", function () {
            merged_obj = Object.copy(obj2).merge(obj1, false, false);
            expect(obj1.HomeState).to.equal(merged_obj.HomeState);
            expect(obj1.Name).to.not.equal(merged_obj.Name);
            expect(obj1.Last).to.not.equal(merged_obj.Last);
            expect(merged_obj).to.not.have.deep.property("Children");
        });
    });
});


// ===========================
// Number Prototype Test Suite
// ===========================
var epsilon = 0.000001;
describe("Number Prototype Test Suite", function() {
    it("Number.prototype.roundToInt", function () {
        var num = 23;
        expect(num.roundToInt(2)).to.equal(24);
        expect(num.roundToInt(5)).to.equal(25);
        expect(num.roundToInt(6)).to.equal(24);
        expect(num.roundToInt(7)).to.equal(21);
    });

    it("Number.prototype.truncToInt", function () {
        var num = 23;
        expect(num.truncToInt(2)).to.equal(22);
        expect(num.truncToInt(5)).to.equal(20);
        expect(num.truncToInt(6)).to.equal(18);
        expect(num.truncToInt(7)).to.equal(21);
    });

    it ("Number.prototype.zeroPadd", function () {
        expect((23).zeroPadd(1)).to.equal("23");
        expect((23).zeroPadd(2)).to.equal("23");
        expect((23).zeroPadd(3)).to.equal("023");
        expect((23).zeroPadd(4)).to.equal("0023");
    });
});

describe("Date Prototype Test Suite", function () {
    describe("Date Formatting", function () {
        it("Date.format", function () {
            var dt = new Date(2016, 6, 1, 18, 32, 5, 123);
            expect(Date.format(dt, "yyyy/MM/dd")).to.equal("2016/07/01");
            expect(Date.format(dt, "hh:mm:ss")).to.equal("06:32:05");
            expect(Date.format(dt, "HH:mm:ss")).to.equal("18:32:05");
            expect(Date.format(dt, "hh:mm:ssTT")).to.equal("06:32:05PM");
            expect(Date.format(dt, "yyyy/MM/dd hh:mm:ssTT - {month:} MMMM")).to.equal(
                "2016/07/01 06:32:05PM - month: July");
            expect(Date.format(dt, "yyyy/MM/dd hh:mm:ssTT - {month:} MMMM", function (dt, token) {
                if (token === "MMMM")
                    return "It is July"
            })).to.equal( "2016/07/01 06:32:05PM - month: It is July");
        });
    });
});


// ===========================
// Date Prototype Test Suite
// ===========================
describe("Date Prototype Test Suite", function () {

});