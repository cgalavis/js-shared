"use strict";

const extend = require("../extend");


function Person(data) {
    if (!data) data = {};

    this.name = data.name;
    this.last_name = data.last_name;
    this.age = data.age;
}

Person.prototype.print = function () {
    console.log("Printing 'Person':");
    console.log("  First Name: " + this.name);
    console.log("  Last Name:  " + this.last_name);
    console.log("  Age:        " + this.age);
};

//

function Programmer(data) {
    this.super$constructor(data);
    this.languages = data.languages;
} extend(Programmer, Person);


Programmer.prototype.print = function () {
    this.super$print();
    console.log("  Languages:  ");
    for (let l of this.languages)
        console.log("    " + l);
};


let data = { 
    name: "Carlos", 
    last_name: "Galavis", 
    age: 44, 
    languages: [ "C/C++", "Javascript", "C#", "Delphi", "Swift", "Asm"] 
};

let prog = new Programmer(data);

prog.print();