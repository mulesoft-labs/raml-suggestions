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
        testCompletionByEntryEnd('basic/test7.raml', '\n  TestType1: Tes', 'TestType, TestTypeUnion, TestType2, TestTypePrimitive');
    });

    it("User-defined types reference completion for a type definition", function () {
        testCompletionByEntryEnd('basic/test7.raml', '\n    type: Tes', 'TestType, TestType1, TestTypeUnion, TestTypePrimitive');
    });

    it("User-defined types reference completion for a property shortcut definition", function () {
        testCompletionByEntryEnd('basic/test7.raml', '\n      property: Tes', 'TestType, TestTypeUnion, TestType1, TestTypePrimitive, TestType2');
    });

    it("User-defined types reference completion for a property definition", function () {
        testCompletionByEntryEnd('basic/test7.raml', '\n        type: Tes', 'TestType, TestTypeUnion, TestType1, TestTypePrimitive, TestType2');
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
