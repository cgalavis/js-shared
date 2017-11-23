"use strict";

const extend = require("../extend");


function Person(data) {
    if (!data) data = {};

    this.name = data.name;
    this.last_name = data.last_name;
    this.age = data.age;
}

Person.prototype.print = function () {
    console.log("First Name    => " + this.name);
    console.log("Last Name     => " + this.last_name);
    console.log("Age           => " + this.age);
};

Person.prototype.setAge = function (na) {
    if (isNaN(na))
        throw new Error("Invalid number use in call to 'setAge'.");

    this.age = Number(na);
};

//

function Employee(data) {
    Employee.super$constructor.call(this, data);
    this.start_date = new Date(data.start_date);
} extend(Employee, Person);

Employee.prototype.print = function () {
    Employee.super$print.call(this);
    console.log("Start Date    => " + this.start_date.toDateString());
};

Employee.prototype.setStartDate = function (nsd) {
    this.start_date = new Date(nsd);
};

//

function Programmer(data) {
    Programmer.super$constructor.call(this, data);
    this.languages = data.languages;
} extend(Programmer, Employee);


Programmer.prototype.print = function () {
    Programmer.super$print.call(this);
    let ind = "Languages     => ";
    for (let l of this.languages) {
        console.log(ind + l);
        ind = "              => ";
    }
};


let data = { 
    name: "Carlos", 
    last_name: "Galavis", 
    age: 44,
    start_date: "05/14/2004",
    languages: [ "C/C++", "Javascript", "C#", "Delphi", "Swift" ] 
};

let prog = new Programmer(data);

prog.print();