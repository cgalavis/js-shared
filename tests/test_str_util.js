"use strict";

let str_util = require("../str_util");
let expect = require("chai").expect;

describe("'str_util' Class Test Suite", function () {
    it("str_util.fill", function () {
        expect(str_util.fill(10)).to.have.length(10).and.equal("          ");
        expect(str_util.fill(10, "-")).to.have.length(10).and.equal("----------");
        expect(str_util.fill(10, "-123")).to.have.length(10).and.equal("----------");
        expect(str_util.fill).to.throw(Error);
        expect(str_util.fill(10, 12)).to.have.length(10).and.equal("1111111111");
    });

    it("str_util.capitalize", function () {
        expect(str_util.capitalize("this is a sample text")).to.equal("This Is A Sample Text");
    });

    it("str_util.format", function () {
        expect(str_util.format("{{0}},{{1}},{{2}}", "test", 1, 1.5)).to.equal("test,1,1.5");
        expect(str_util.format("{{ 0   }},{{ 1 }},{{2   }}", "test", 1, 1.5)).to.equal("test,1,1.5");
        expect(str_util.format("{{0}},{{1}},{{3}}", "test", 1, 1.5)).to.equal("test,1,{{3}}");
        expect(str_util.format("{{0}},{{1}},{{0}}", "test", 1, 1.5)).to.equal("test,1,test");
        expect(str_util.format("{{0}},{{0}},{{0}}", "test", 1, 1.5)).to.equal("test,test,test");
        expect(str_util.format("{{0}},{{1}},{{2}}, {{text}}", "test", 1, 1.5)).to.equal("test,1,1.5, {{text}}");
    });

    describe("str_util.expand", function () {
        it("Without token arguments", function () {
            expect(str_util.expand("{{name}} - {{last}} - {{age}}", function (token) {
                if ("name" == token.name) return "John";
                if ("last" == token.name) return "Doe";
                if ("age" == token.name) return 43;
                return null;
            })).to.equal("John - Doe - 43");

            expect(str_util.expand("{{ name}} - {{ last }} - {{#age   }}",
                function (token) {
                    if ("name" == token.name) return "John";
                    if ("last" == token.name) return "Doe";
                    if ("#age" == token.name) return 43;
                    return null;
                }
            )).to.equal("John - Doe - 43");

            expect(str_util.expand("{{ name}} - {{ last }} - {{#age   }} - {{Address}}",
                function (token) {
                    if ("name" == token.name) return "John";
                    if ("last" == token.name) return "Doe";
                    if ("#age" == token.name) return 43;
                    return null;
                }
            )).to.equal("John - Doe - 43 - {{Address}}");

            function getName(name) {
                return "Name: " + name;
            }
        });

        it("With token arguments", function () {
            let person = {
                Name: "John",
                Last: "Doe",
                Age: 43,
                Birth: new Date(1972, 10, 7)
            };

            expect(str_util.expand("{{name}} - {{last}} - {{age}}",
                function (token, person) {
                    return person[str_util.capitalize(token.name)] || null;
                }, person)).to.equal("John - Doe - 43");

            expect(str_util.expand(
                "{{name}} - {{last}} - {{age}} - {{birth, yyyy, MM, dd}}",
                function (token, person) {
                    if ("birth" == token.name)
                        return person[str_util.capitalize(token.name)].format(
                            token.args[0] + "/" + token.args[1] + "/" + token.args[2]);
                    return person[str_util.capitalize(token.name)] || null;
                }, person)).to.equal("John - Doe - 43 - 1972/11/07");
        });
    });

    it("str_util.align", function () {
        expect(str_util.alignL("Hello", 10)).to.equal("Hello     ");
        expect(str_util.alignC("Hello", 10)).to.equal("  Hello   ");
        expect(str_util.alignR("Hello", 10)).to.equal("     Hello");

        expect(str_util.alignL("Hello", 10, "*")).to.equal("Hello*****");
        expect(str_util.alignC("Hello", 10, "*")).to.equal("**Hello***");
        expect(str_util.alignR("Hello", 10, "*")).to.equal("*****Hello");

        expect(str_util.alignR("Hello", 10, "123")).to.equal("11111Hello");
        expect(str_util.alignR("Hello", 10, 123)).to.equal("11111Hello");

        // Default parameters
        expect(str_util.alignR("Hello", 10)).to.equal("     Hello");
        expect(str_util.alignL("Hello", 10)).to.equal("Hello     ");

        // Error conditions
        expect(str_util.alignL).to.throw("the \'str\' argument is not optional");
    });

    it ("str_util.subst", function () {
        let date = new Date(2016, 2, 28, 13, 45, 32);
        let today_str = new Date().format("yyyy/MM/dd");
        expect(str_util.subst.date("The date is: {{date, yyyy/MM/dd}}"))
            .to.equal("The date is: " + today_str);
        expect(str_util.subst.date("The date is: {{date, yyyy/MM/dd}}", date))
            .to.equal("The date is: " +
            date.format("yyyy/MM/dd"));

        let obj = {
            proc: {
                id: 100,
                cpus: [
                    {
                        index: 0,
                        name: "Haswell"
                    },
                    {
                        index: 1,
                        name: "Sandybride"
                    }
                ]
            }
        };

        expect(str_util.subst.prop("First CPU Name: {{proc.cpus.0.name}}", obj))
            .to.equal("First CPU Name: Haswell");

    });

    it("str_util.buildTable", function () {
        let data =
        '{' +
            '"columns": [' +
                '{ "width": "auto", "align": "left" },' +
                '{ "width": "fit", "align": "left" },' +
                '{ "width": "auto", "align": "right" }' +
            '],' +
            '"rows": [' +
                '[ ' +
                    '"ObservatoryName", ' +
                    '"Monter Hills Observatory", ' +
                    '"varchar(50)"' +
                '],' +
                '[ ' +
                    '"Address", ' +
                    '"10250 Constellation Blvd. Suite 2650 Los Angeles, CA 90067", ' +
                    '"varchar(100)"' +
                '],' +
                '"=",' +
                '"General Details:",' +
                '"=",' +
                '[ ' +
                    '"LastAccessed", ' +
                    '"December 21st 2015 at 19:34:12", ' +
                    '"varchar(50)"' +
                '],' +
                '[ ' +
                    '"Owner", ' +
                    '"Carlos Galavis",' +
                    '"vachar(50)"' +
                '],' +
                '[ ' +
                    '"Quota", ' +
                    '"23",' +
                    '"number"' +
                ']' +
            ']' +
        '}';
    });
});