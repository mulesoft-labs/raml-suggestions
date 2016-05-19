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

    // #2603 This completion kind DOES NOT WORK in the api-workbench rc2
    it("User-defined types reference completion for a object type shortcut inheritance definition. BUG#2603. SWITCHED OFF. FIXME", function () {
        //testCompletionByEntryEnd('basic/test10.raml', '\n  TestType1: [PartTwo, Tes', 'TestTypeObject, TestType, TestTypeWithInheritance, TestType2');
    });

    // #2609 this completion does not contains all items.
    it("User-defined types reference completion for a object type inheritance definition. BUG#2609 #2612. FIXME", function () {
        //Correct test
        //testCompletionByEntryEnd('basic/test10.raml', '\n    type: [PartOne, Tes', 'TestTypeObject, TestType, TestTypeUnion, TestType1, TestTypeWithInheritance, TestType2, TestType3');
        testCompletionByEntryEnd('basic/test10.raml', '\n    type: [PartOne, Tes', 'TestTypeObject, TestType3, TestTypeWithInheritance');
    });

    //this test contains impossible suggestions
    it("User-defined types reference completion for a property shortcut inheritance definition. BUG#2611. FIXME", function () {
        testCompletionByEntryEnd('basic/test10.raml', '\n      property: [PartOne, Tes', 'TestTypeObject, TestType, TestTypeUnion, TestTypePrimitive, TestType1, TestTypeWithInheritance, TestType2, TestType3');
    });

    //this test contains impossible suggestions
    it("User-defined types reference completion for a property inheritance definition. BUG#2612 #2611. FIXME", function () {
        //testCompletionByEntryEnd('basic/test10.raml', '\n        type: [PartOne, Tes', 'TestTypeObject, TestType, TestTypeUnion, TestType1, TestTypeWithInheritance, TestType2, TestType3');
        testCompletionByEntryEnd('basic/test10.raml', '\n        type: [PartOne, Tes', 'TestTypeObject, TestType2, TestType3, TestTypeWithInheritance');
    });

    it("Resource types reference completion", function () {
        testCompletionByEntryEnd('basic/test11.raml', '\n  type: ', 'resourceTypeType, resourceTypeAnother');
    });

    it("Traits reference completion", function () {
        testCompletionByEntryEnd('basic/test12.raml', '\n    is: ', 'TestTrait, TraitWithBody');
    });

    // #2613, completion shouldn't contain used traits.
    it("Traits reference completion without used traits. BUG#2613. FIXME", function () {
        //Correct test
        //testCompletionByEntryEnd('basic/test12.raml', '\n      is:  [TestTrait, T', 'TraitWithBody');
        testCompletionByEntryEnd('basic/test12.raml', '\n      is:  [TestTrait, T', 'TestTrait, TraitWithBody');
    });

    it("Resource type with parameters reference completion", function () {
        testCompletionByEntryEnd('basic/test13.raml', '\n  type: T', 'TestResorceType, TestResorceTypeTwo');
    });

    it("Resource type parameters type reference completion", function () {
        testCompletionByEntryEnd('basic/test13.raml', '\n    type:  { TestResorceTypeTwo: {objectName : Tes', 'TestTypeObject, TestType, TestTypeUnion, TestTypePrimitive, TestType1, TestTypeWithInheritance, TestType2, TestType3');
    });

    //bug #2614
    it("Resource type parameters schema reference completion. BUG#2614 SWITCHED OFF. FIXME", function () {
    //    testCompletionByEntryEnd('basic/test14.raml', '\n  type:  { TestResorceType: {objectName : Tes', 'TestSchema');
    });

    it("Trait parameters reference completion", function () {
        testCompletionByEntryEnd('basic/test15.raml', '\n    is: ', 'TestTrait');
    });

    it("Annotation reference completion", function () {
        testCompletionByEntryEnd('basic/test16.raml', '\n (tes', 'testAnnotation');
    });

    it("Completion for include keyword", function () {
        testCompletionByEntryEnd('basic/test17.raml', '\n  include: !i', 'include');
    });

    it("Completion for include path", function () {
        testCompletionByEntryEnd('basic/test17.raml', '\n  comic: !include ./XKCD/s', 'schemas');
    });

    it("Completion for include files", function () {
        testCompletionByEntryEnd('basic/test17.raml', '\n  comic: !include ./XKCD/schemas/com', 'comic-schema.json');
    });

    it("Example completion", function () {
        testCompletionByEntryEnd('basic/test18.raml', '\n      k', 'kind');
    });

    it("minLength facet completion", function () {
        testCompletionByEntryEnd('basic/test19.raml', '\n        minLen', 'minLength');
    });

    it("maxLength facet completion", function () {
        testCompletionByEntryEnd('basic/test19.raml', '\n        maxLen', 'maxLength');
    });

    it("example facet completion", function () {
        testCompletionByEntryEnd('basic/test19.raml', '\n        exa', 'example, examples');
    });

    it("enum facet completion", function () {
        testCompletionByEntryEnd('basic/test19.raml', '\n        enu', 'enum');
    });

    it("default facet completion", function () {
        testCompletionByEntryEnd('basic/test19.raml', '\n        defa', 'default');
    });

    it("displayName facet completion", function () {
        testCompletionByEntryEnd('basic/test19.raml', '\n        displ', 'displayName');
    });

    it("description facet completion", function () {
        testCompletionByEntryEnd('basic/test19.raml', '\n        descri', 'description');
    });

    it("repeat facet completion", function () {
        testCompletionByEntryEnd('basic/test19.raml', '\n        rep', 'repeat');
    });

    it("required facet completion", function () {
        testCompletionByEntryEnd('basic/test19.raml', '\n        req', 'required');
    });

    it("pattern facet completion", function () {
        testCompletionByEntryEnd('basic/test19.raml', '\n        patte', 'pattern');
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
