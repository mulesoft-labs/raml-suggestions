/// <reference path="../../typings/main.d.ts" />

import chai = require("chai");
import assert = chai.assert;

import testApi = require('./completionTestApi');

describe("Basic completion tests", function() {
    it("test1", function () {
        testCompletionByEntryEnd('basic/test1.raml', 'juan: s', 'string, SimpleType1, SimpleType2, SimpleType');
    });

    it("test2", function () {
        testCompletionByEntryStart('basic/test1.raml', 'ost:', 'put, post, patch');
    });

    it("test3", function () {
        testCompletionByEntryEnd('basic/test2.raml', '\n              a', 'age, addresses');
    });

    it("Built-in types reference completion for a property definition", function () {
        testCompletionByEntryEnd('basic/test3.raml', '\n                type: ', 'TestType, array, union, object, string, boolean, number, integer, date-only, time-only, datetime-only, datetime, date, file');
    });

    it("Built-in types reference completion for a property shortcut definition", function () {
        testCompletionByEntryEnd('basic/test4.raml', '\n            property: ', 'Define Inline, TestType, array, union, object, string, boolean, number, integer, date-only, time-only, datetime-only, datetime, date, file');
    });

    it("Built-in types reference completion for a type definition", function () {
        testCompletionByEntryEnd('basic/test5.raml', '\n      type: ', 'array, union, object, string, boolean, number, integer, date-only, time-only, datetime-only, datetime, date, file');
    });

    it("Built-in types reference completion for a type shortcut definition", function () {
        testCompletionByEntryEnd('basic/test6.raml', '\n    TestType: ', 'Define Inline, array, union, object, string, boolean, number, integer, date-only, time-only, datetime-only, datetime, date, file');
    });

    it("User-defined types reference completion for a type shortcut definition", function () {
        testCompletionByEntryEnd('basic/test7.raml', '\n  TestType1: Tes', 'TestType, TestTypeUnion, TestTypePrimitive, TestType2, TestTypeWithInheritance');
    });

    it("User-defined types reference completion for a type definition", function () {
        testCompletionByEntryEnd('basic/test7.raml', '\n    type: Tes', 'TestType, TestTypeUnion, TestTypePrimitive, TestType1, TestTypeWithInheritance');
    });

    it("User-defined types reference completion for a property shortcut definition", function () {
        testCompletionByEntryEnd('basic/test7.raml', '\n      property: Tes', 'TestType, TestTypeUnion, TestTypePrimitive, TestType1, TestTypeWithInheritance, TestType2');
    });

    it("User-defined types reference completion for a property definition", function () {
        testCompletionByEntryEnd('basic/test7.raml', '\n        type: Tes', 'TestType, TestTypeUnion, TestTypePrimitive, TestType1, TestType2, TestTypeWithInheritance');
    });

    it("User-defined types reference completion for a object union type shortcut definition", function () {
        testCompletionByEntryEnd('basic/test8.raml', '\n  TestType1: TestTypePrimitive | Tes', 'TestTypeObject, TestType, TestTypeUnion, TestTypePrimitive, TestType2, TestTypeWithInheritance');
    });

    it("User-defined types reference completion for a object union type definition", function () {
        testCompletionByEntryEnd('basic/test9.raml', '\n    type: TestTypeUnion | Tes', 'TestTypeObject, TestType, TestTypeUnion, TestTypePrimitive, TestType2, TestTypeWithInheritance');
    });

    it("User-defined types reference completion for a property union type shortcut definition", function () {
        testCompletionByEntryEnd('basic/test9.raml', '\n      property: TestTypeUnion | Tes', 'TestTypeObject, TestType, TestTypeUnion, TestTypePrimitive, TestType1, TestTypeWithInheritance, TestType2');
    });

    it("User-defined types reference completion for a property union type definition", function () {
        testCompletionByEntryEnd('basic/test9.raml', '\n        type: TestTypeUnion | Tes', 'TestTypeObject, TestType, TestTypeUnion, TestTypePrimitive, TestType1, TestTypeWithInheritance, TestType2');
    });

    //this comletion does not work in the api-workbench rc2
    it("User-defined types reference completion for a object type shortcut inheritance definition", function () {
        testCompletionByEntryEnd('basic/test10.raml', '\n  TestType1: [PartTwo, Tes', 'TestTypeObject, TestType, TestTypeWithInheritance, TestType2');
    });

    //this completion does not contains `TestType2` bug #2609
    it("User-defined types reference completion for a object type inheritance definition", function () {
        testCompletionByEntryEnd('basic/test10.raml', '\n    type: [PartOne, Tes', 'TestTypeObject, TestType3, TestType, TestTypeWithInheritance');
    });

    //this test contains impossible suggestions
    it("User-defined types reference completion for a property shortcut inheritance definition", function () {
        testCompletionByEntryEnd('basic/test10.raml', '\n      property: [PartOne, Tes', 'TestTypeObject, TestType, TestTypeUnion, TestTypePrimitive, TestType1, TestTypeWithInheritance, TestType2, TestType3');
    });

    //this test contains impossible suggestions
    it("User-defined types reference completion for a property inheritance definition", function () {
        testCompletionByEntryEnd('basic/test10.raml', '\n        type: [PartOne, Tes', 'TestTypeObject, TestType, TestTypeUnion, TestTypePrimitive, TestType1, TestTypeWithInheritance, TestType2, TestType3');
    });
});

function testCompletionByEntryStart(testPath: string, entry: string, expected: string) {
    var result = testApi.completionByUniqueEntry(testPath, entry, true);

    assert.equal(result, expected);
}

function testCompletionByEntryEnd(testPath: string, entry: string, expected: string) {
    var result = testApi.completionByUniqueEntry(testPath, entry);
    
    assert.equal(result, expected);
}

function testCompletionByOffset(testPath: string, offset: number, expected: string) {
    var result = testApi.completionByOffset(testPath, offset);

    assert.equal(result, expected);
}
