/// <reference path="../../typings/main.d.ts" />

import chai = require("chai");
import assert = chai.assert;

import testApi = require('./completionTestApi');

describe("Basic completion tests", function() {
    it("test0", function () {
        testCompletionByEntryEnd('basic/LibraryExample/slack.raml', 'CH11\n    ', 'queryParameters, headers, queryString, responses, body, protocols, is, securedBy, displayName, properties, get, put, post, delete, options, head, patch');
    });
    
    it("test1", function () {
        testCompletionByEntryEnd('basic/test1.raml', 'juan: s', 'string, SimpleType1, SimpleType2, SimpleType');
    });

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
        testCompletionByEntryEnd('basic/test3.raml', '\n                type: ', 'TestType, array, union, object, string, boolean, number, integer, date-only, time-only, datetime-only, datetime, file');
    });

    it("Built-in types reference completion for a property shortcut definition", function () {
        testCompletionByEntryEnd('basic/test4.raml', '\n            property: ', 'Define Inline, TestType, array, union, object, string, boolean, number, integer, date-only, time-only, datetime-only, datetime, file');
    });

    it("Built-in types reference completion for a type definition", function () {
        testCompletionByEntryEnd('basic/test5.raml', '\n      type: ', 'array, union, object, string, boolean, number, integer, date-only, time-only, datetime-only, datetime, file');
    });

    it("Built-in types reference completion for a type shortcut definition", function () {
        testCompletionByEntryEnd('basic/test6.raml', '\n    TestType: ', 'Define Inline, array, union, object, string, boolean, number, integer, date-only, time-only, datetime-only, datetime, file');
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
        testCompletionByEntryEnd('basic/test10.raml', '\n    type: [PartOne, Tes', 'TestTypeObject, TestType1, TestType3, TestTypeWithInheritance');
    });

    //this test contains impossible suggestions
    it("User-defined types reference completion for a property shortcut inheritance definition. BUG#2611. FIXME", function () {
        testCompletionByEntryEnd('basic/test10.raml', '\n      property: [PartOne, Tes', 'TestTypeObject, TestType, TestTypeUnion, TestTypePrimitive, TestType1, TestTypeWithInheritance, TestType2, TestType3');
    });

    //this test contains impossible suggestions
    it("User-defined types reference completion for a property inheritance definition. BUG#2612 #2611. FIXME", function () {
        //testCompletionByEntryEnd('basic/test10.raml', '\n        type: [PartOne, Tes', 'TestTypeObject, TestType, TestTypeUnion, TestType1, TestTypeWithInheritance, TestType2, TestType3');
        testCompletionByEntryEnd('basic/test10.raml', '\n        type: [PartOne, Tes', 'TestTypeObject, TestType1, TestType2, TestType3, TestTypeWithInheritance');
    });

    it("Using Discriminator. BUG#1820 FIXME", function () {
        //testCompletionByEntryEnd('basic/test24.raml', '\n    discriminator: k', 'kind');
    });

    it("User-defined Facets.", function () {
        testCompletionByEntryEnd('basic/test25.raml', '\n    no', 'noHolidays, notOnlyFutureDates');
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

    it("Resource type parameters schema reference completion.", function () {
        testCompletionByEntryEnd('basic/test14.raml', '\n  type:  { TestResorceType: {objectName : Tes', 'TestSchema');
    });

    it("Resource type parameters function singularize", function () {
        testCompletionByEntryEnd('basic/test28.raml', '\n            type: <<resourcePathName | !singu', 'singularize');
    });

    it("Resource type parameters function pluralize", function () {
        testCompletionByEntryEnd('basic/test28.raml', '\n            type: <<resourcePathName | !pl', 'pluralize');
    });

    it("Resource type parameters functions: uppercase, uppercamelcase, upperhyphencase, upperunderscorecase", function () {
        testCompletionByEntryEnd('basic/test28.raml', '\n            type: <<resourcePathName | !upp', 'uppercase, uppercamelcase, upperhyphencase, upperunderscorecase');
    });

    it("Resource type parameters functions: lowercase, lowercamelcase, lowerhyphencase, lowerunderscorecase", function () {
        testCompletionByEntryEnd('basic/test28.raml', '\n            type: <<resourcePathName | !low', 'lowercase, lowercamelcase, lowerhyphencase, lowerunderscorecase');
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

    it("Multiple Examples Properties", function () {
        testCompletionByEntryEnd('basic/test26.raml', '\n        des', 'description');
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

    it("required facet completion", function () {
        testCompletionByEntryEnd('basic/test19.raml', '\n        req', 'required');
    });

    it("pattern facet completion", function () {
        testCompletionByEntryEnd('basic/test19.raml', '\n        patte', 'pattern');
    });

    it("Root nodes: types, traits, title", function () {
        testCompletionByEntryEnd('basic/test20.raml', '\nt', 'types, traits, title');
    });

    it("Root nodes: description, documentation", function () {
        testCompletionByEntryEnd('basic/test20.raml', '\nd', 'description, documentation');
    });

    it("Root node: version", function () {
        testCompletionByEntryEnd('basic/test20.raml', '\nv', 'version');
    });

    it("Root nodes: baseUri, baseUriParameters", function () {
        testCompletionByEntryEnd('basic/test20.raml', '\nb', 'baseUri, baseUriParameters');
    });

    it("Root node: protocols", function () {
        testCompletionByEntryEnd('basic/test20.raml', '\np', 'protocols');
    });

    it("Root node: mediaType", function () {
        testCompletionByEntryEnd('basic/test20.raml', '\nm', 'mediaType');
    });

    it("Root nodes: schemas, securitySchemes, securedBy", function () {
        testCompletionByEntryEnd('basic/test20.raml', '\ns', 'schemas, securitySchemes, securedBy');
    });

    it("Root node: resourceTypes", function () {
        testCompletionByEntryEnd('basic/test20.raml', '\nr', 'resourceTypes');
    });

    it("Root node: annotationTypes", function () {
        testCompletionByEntryEnd('basic/test20.raml', '\na', 'annotationTypes');
    });

    it("Root node: uses", function () {
        testCompletionByEntryEnd('basic/test20.raml', '\nu', 'uses');
    });

    it("Base URI parameter used in the baseUri node", function () {
        testCompletionByEntryEnd('basic/test21.raml', '\n  b', 'bucketName: \n    ');
    });

    it("URI parameter used in the resource path", function () {
        testCompletionByEntryEnd('basic/test21.raml', '\n    se', 'serverId: \n      , serviceId: \n      ');
    });

    it("Allowed protocols: ", function () {
        testCompletionByEntryEnd('basic/test21.raml', '\nprotocols: H', 'HTTP, HTTPS');
    });

    it("Default Media Types", function () {
        testCompletionByEntryEnd('basic/test22.raml', '\nmediaType: ', 'application/json, application/xml, application/x-www-form-urlencoded, multipart/form-data');
    });

    it("Several Default Media Types", function () {
        testCompletionByEntryEnd('basic/test23.raml', '\nmediaType: [multipart/form-data, a', 'application/json, application/xml, application/x-www-form-urlencoded');
    });

    it("Request body media type 1", function () {
        testCompletionByEntryEnd('basic/test24.raml', '\n      appl', 'application/xml, application/json, application/x-www-form-urlencoded');
    });

    it("Request body media type 2", function () {
        testCompletionByEntryEnd('basic/test24.raml', '\n      mul', 'multipart/form-data');
    });

    it("Response body media type", function () {
        testCompletionByEntryEnd('basic/test24.raml', '\n          app', 'application/json, application/xml');
    });

    it("Default Security", function () {
        testCompletionByEntryEnd('basic/test23.raml', '\nsecuredBy: [ o', 'oauth_2_0, oauth_1_0');
    });

    it("Resource Security", function () {
        testCompletionByEntryEnd('basic/test23.raml', '\n  securedBy: o', 'oauth_2_0, oauth_1_0');
    });

    //2613 Completion suggests already used trait items
    it("Resource several Security BUG#2613 FIXME", function () {
        //testCompletionByEntryEnd('basic/test23.raml', '\n  securedBy: [oauth_2_0, oa', 'oauth_1_0');
        testCompletionByEntryEnd('basic/test23.raml', '\n  securedBy: [oauth_2_0, oa', 'oauth_2_0, oauth_1_0');
    });

    it("Resource node 'is:'", function () {
        testCompletionByEntryEnd('basic/test27.raml', '\n  i', 'is');
    });

    it("Resource node 'type:'", function () {
        testCompletionByEntryEnd('basic/test27.raml', '\n  t', 'type');
    });

    it("Resource nodes 'description, displayName, delete'", function () {
        testCompletionByEntryEnd('basic/test27.raml', '\n  d', 'description, displayName, delete');
    });

    it("Resource node 'get:'", function () {
        testCompletionByEntryEnd('basic/test27.raml', '\n  g', 'get');
    });

    it("Resource nodes 'put, post, patch'", function () {
        testCompletionByEntryEnd('basic/test27.raml', '\n  p', 'put, post, patch');
    });

    it("Resource node 'uriParameters'", function () {
        testCompletionByEntryEnd('basic/test27.raml', '\n  u', 'uriParameters');
    });

    it("Resource node 'options'", function () {
        testCompletionByEntryEnd('basic/test27.raml', '\n  o', 'options');
    });

    it("Resource node 'head'", function () {
        testCompletionByEntryEnd('basic/test27.raml', '\n  h', 'head');
    });

    it("Resource annotation", function () {
        testCompletionByEntryEnd('basic/test27.raml', '\n  (annot', 'annotaion');
    });

    it("Method Security", function () {
        testCompletionByEntryEnd('basic/test23.raml', '\n    securedBy: o', 'oauth_2_0, oauth_1_0');
    });

    //2613 Completion suggests already used trait items
    it("Method several Security  BUG#2613 FIXME", function () {
        //testCompletionByEntryEnd('basic/test23.raml', '\n      securedBy: [oauth_2_0, o', 'oauth_1_0');
        testCompletionByEntryEnd('basic/test23.raml', '\n      securedBy: [oauth_2_0, o', 'oauth_2_0, oauth_1_0');
    });

    it("Method nodes 'queryString, queryParameters'", function () {
        testCompletionByEntryEnd('basic/test27.raml', '\n    q', 'queryParameters, queryString');
    });

    it("Method request 'headers'", function () {
        testCompletionByEntryEnd('basic/test27.raml', '\n    h', 'headers');
    });

    it("Method request 'headers' items completion", function () {
        testCompletionByEntryEnd('basic/test27.raml', '\n      Las', 'Last-Modified, Last-Event-ID');
    });

    it("Method request 'body'", function () {
        testCompletionByEntryEnd('basic/test27.raml', '\n    b', 'body');
    });

    it("Method node 'responses'", function () {
        testCompletionByEntryEnd('basic/test27.raml', '\n    re', 'responses');
    });

    it("Method node 'protocols'", function () {
        testCompletionByEntryEnd('basic/test27.raml', '\n    pro', 'protocols');
    });

    it("Method node 'is'", function () {
        testCompletionByEntryEnd('basic/test27.raml', '\n    i', 'is');
    });

    it("Method node 'description, displayName'", function () {
        testCompletionByEntryEnd('basic/test27.raml', '\n    d', 'description, displayName');
    });

    it("Method annotation", function () {
        testCompletionByEntryEnd('basic/test27.raml', '\n    (annot', 'annotaion');
    });

    it("Response codes", function () {
        testCompletionByEntryEnd('basic/test27.raml', '\n      1', '100, 101, 102');
    });

    it("Response headers", function () {
        testCompletionByEntryEnd('basic/test27.raml', '\n        he', 'headers');
    });

    it("Method response 'headers' items completion", function () {
        testCompletionByEntryEnd('basic/test27.raml', '\n          Las', 'Last-Modified, Last-Event-ID');
    });

    it("Response body", function () {
        testCompletionByEntryEnd('basic/test27.raml', '\n        bo', 'body');
    });

    it("Response body mimeTypes", function () {
        testCompletionByEntryEnd('basic/test27.raml', '\n          app', 'application/json, application/xml');
    });

    it("Response description", function () {
        testCompletionByEntryEnd('basic/test27.raml', '\n        des', 'description');
    });

    it("Security Scheme Declaration: type", function () {
        testCompletionByEntryEnd('basic/test29.raml', '\n    ty', 'type');
    });

    it("Security Scheme Declaration: type value test 1", function () {
        testCompletionByEntryEnd('basic/test29.raml', '\n    type: O', 'OAuth 2.0, OAuth 1.0');
    });

    it("Security Scheme Declaration: type value test 2", function () {
        testCompletionByEntryEnd('basic/test29.raml', '\n    type: P', 'Pass Through');
    });

    it("Security Scheme Declaration: type value test 3", function () {
        testCompletionByEntryEnd('basic/test29.raml', '\n    type: Ba', 'Basic Authentication');
    });

    it("Security Scheme Declaration: type value test 4", function () {
        testCompletionByEntryEnd('basic/test29.raml', '\n    type: Dig', 'Digest Authentication');
    });

    it("Security Scheme Declaration: type value test 5", function () {
        testCompletionByEntryEnd('basic/test29.raml', '\n    type: x', 'x-{other}');
    });

    it("Security Scheme Declaration: settings", function () {
        testCompletionByEntryEnd('basic/test29.raml', '\n    sett', 'settings');
    });

    it("Security Scheme Declaration: OAuth 2.0 settings nodes authorizationGrants, accessTokenUri, authorizationUri", function () {
        testCompletionByEntryEnd('basic/test29.raml', '\n      au', 'authorizationGrants, accessTokenUri, authorizationUri');
    });

    it("Security Scheme Declaration: OAuth 2.0 settings node scopes", function () {
        testCompletionByEntryEnd('basic/test29.raml', '\n      sco', 'scopes');
    });

    it("Security Scheme Declaration: OAuth 2.0 settings node authorizationGrants item authorization_code", function () {
        testCompletionByEntryEnd('basic/test29.raml', '\n      authorizationGrants: [ au', 'authorization_code');
    });

    it("Security Scheme Declaration: OAuth 2.0 settings node authorizationGrants item password", function () {
        testCompletionByEntryEnd('basic/test29.raml', '\n      authorizationGrants: [ authorization_code, pas', 'password');
    });

    it("Security Scheme Declaration: OAuth 2.0 settings node authorizationGrants item implicit", function () {
        testCompletionByEntryEnd('basic/test29.raml', '\n      authorizationGrants: [ authorization_code, password, impl', 'implicit');
    });

    it("Security Scheme Declaration: OAuth 2.0 settings node authorizationGrants item client_credentials", function () {
        testCompletionByEntryEnd('basic/test29.raml', '\n      authorizationGrants: [ authorization_code, password, implicit, cli', 'client_credentials');
    });

    it("Security Scheme Declaration: description, describedBy", function () {
        testCompletionByEntryEnd('basic/test29.raml', '\n    descr', 'description, describedBy');
    });

    it("Security Scheme Declaration: OAuth 2.0 describedBy node headers", function () {
        testCompletionByEntryEnd('basic/test29.raml', '\n      hea', 'headers');
    });

    it("Security Scheme Declaration: OAuth 2.0 describedBy node headers item", function () {
        testCompletionByEntryEnd('basic/test29.raml', '\n        X', 'X-Frame-Options');
    });

    it("Security Scheme Declaration: OAuth 2.0 describedBy nodes querySring, queryParameters", function () {
        testCompletionByEntryEnd('basic/test29.raml', '\n      quer', 'queryParameters, queryString');
    });

    it("Security Scheme Declaration: OAuth 2.0 describedBy node responses", function () {
        testCompletionByEntryEnd('basic/test29.raml', '\n      respo', 'responses');
    });

    it("Security Scheme Declaration: OAuth 1.0 settings node requestTokenUri", function () {
        testCompletionByEntryEnd('basic/test30.raml', '\n      req', 'requestTokenUri');
    });

    it("Security Scheme Declaration: OAuth 1.0 settings node authorizationUri", function () {
        testCompletionByEntryEnd('basic/test30.raml', '\n      aut', 'authorizationUri');
    });

    it("Security Scheme Declaration: OAuth 1.0 settings node tokenCredentialsUri", function () {
        testCompletionByEntryEnd('basic/test30.raml', '\n      tok', 'tokenCredentialsUri');
    });

    it("Security Scheme Declaration: OAuth 1.0 settings node signatures", function () {
        testCompletionByEntryEnd('basic/test30.raml', '\n      sig', 'signatures');
    });

    it("Security Scheme Declaration: OAuth 1.0 settings node signatures item PLAINTEXT", function () {
        testCompletionByEntryEnd('basic/test30.raml', '\n      signatures: [ PLAI', 'PLAINTEXT');
    });

    it("Security Scheme Declaration: OAuth 1.0 settings node signatures item HMAC-SHA1", function () {
        testCompletionByEntryEnd('basic/test30.raml', '\n      signatures: [ PLAINTEXT, HM', 'HMAC-SHA1');
    });

    it("Security Scheme Declaration: OAuth 1.0 settings node signatures item RSA-SHA1", function () {
        testCompletionByEntryEnd('basic/test30.raml', '\n      signatures: [ PLAINTEXT, HMAC-SHA1, RS', 'RSA-SHA1');
    });

    it("Declaring Annotation Type node 'type'", function () {
        testCompletionByEntryEnd('basic/test31.raml', '\n    ty', 'type');
    });

    it("Declaring Annotation Type node 'type' values", function () {
        testCompletionByEntryEnd('basic/test31.raml', '\n    type: str', 'strong, string');
    });

    it("Declaring Annotation Type node 'displayName'", function () {
        testCompletionByEntryEnd('basic/test31.raml', '\n    disp', 'displayName');
    });

    it("Declaring Annotation Type node 'allowedTargets'", function () {
        testCompletionByEntryEnd('basic/test31.raml', '\n    allow', 'allowedTargets');
    });

    it("Declaring Annotation Type node 'allowedTargets' items", function () {
        testCompletionByEntryEnd('basic/test31.raml', '\n    allowedTargets: Resou', 'Resource, ResourceType');
    });

    it("Typed Fragments: DataType, DocumentationItem", function () {
        testCompletionByEntryEnd('basic/test32.raml', '\n#%RAML 1.0 D', 'DataType, DocumentationItem');
    });

    it("Typed Fragments: DocumentationItem fragment node 'title'", function () {
        testCompletionByEntryEnd('basic/test32.raml', '\ntit', 'title');
    });

    it("Typed Fragments: DocumentationItem fragment node 'content'", function () {
        testCompletionByEntryEnd('basic/test32.raml', '\ncont', 'content');
    });

    it("Typed Fragments: DocumentationItem fragment node 'uses'", function () {
        testCompletionByEntryEnd('basic/test32.raml', '\nus', 'uses');
    });

    it("Typed Fragments: DataType fragment node 'uses'", function () {
        testCompletionByEntryEnd('basic/test33.raml', '\nus', 'uses');
    });

    it("Typed Fragments: NamedExample", function () {
        testCompletionByEntryEnd('basic/test34.raml', '\n#%RAML 1.0 Nam', 'NamedExample');
    });

    it("Typed Fragments: ResourceType", function () {
        testCompletionByEntryEnd('basic/test35.raml', '\n#%RAML 1.0 ResourceT', 'ResourceType');
    });

    it("Typed Fragments: Trait", function () {
        testCompletionByEntryEnd('basic/test36.raml', '\n#%RAML 1.0 Tra', 'Trait');
    });

    it("Typed Fragments: SecurityScheme", function () {
        testCompletionByEntryEnd('basic/test37.raml', '\n#%RAML 1.0 SecuritySc', 'SecurityScheme');
    });

    it("Typed Fragments: SecurityScheme node 'type'", function () {
        testCompletionByEntryEnd('basic/test37.raml', '\nty', 'type');
    });

    it("Typed Fragments: AnnotationTypeDeclaration", function () {
        testCompletionByEntryEnd('basic/test38.raml', '\n#%RAML 1.0 AnnotationTyp', 'AnnotationTypeDeclaration');
    });

    it("Typed Fragments: Library", function () {
        testCompletionByEntryEnd('basic/test39.raml', '\n#%RAML 1.0 Li', 'Library');
    });

    it("Typed Fragments: Overlay", function () {
        testCompletionByEntryEnd('basic/test40.raml', '\n#%RAML 1.0 Ove', 'Overlay');
    });

    it("Typed Fragments: Overlay node 'extends'", function () {
        testCompletionByEntryEnd('basic/test40.raml', '\next', 'extends');
    });

    it("Typed Fragments: Extension", function () {
        testCompletionByEntryEnd('basic/test41.raml', '\n#%RAML 1.0 Exte', 'Extension');
    });

    it("Typed Fragments: Extension node 'extends'", function () {
        testCompletionByEntryEnd('basic/test41.raml', '\next', 'extends');
    });
    
    it("test43", function () {
        testCompletionByEntryEnd('basic/test43.raml', 'X', 'XKCD');
    });

    it("Reference completion for a property definition", function () {
        testCompletionByEntryStart('basic/test3.raml', 'string', 'TestType, array, union, object, string, boolean, number, integer, date-only, time-only, datetime-only, datetime, file');
    });

    it("Reference completion for a type definition", function () {
        testCompletionByEntryStart('basic/test5.raml', 'object', 'array, union, object, string, boolean, number, integer, date-only, time-only, datetime-only, datetime, file');
    });

    it("Reference completion for a type shortcut definition", function () {
        testCompletionByEntryStart('basic/test6.raml', 'boolean', 'Define Inline, array, union, object, string, boolean, number, integer, date-only, time-only, datetime-only, datetime, file');
    });

    it("Type shortcut definition", function () {
        testCompletionByEntryStart('basic/test7.raml', 'tType\n', 'TestType, TestTypeUnion, TestTypePrimitive, TestType2, TestTypeWithInheritance');
    });

    it("Custom facets.", function () {
        testCompletionByEntryStart('basic/test25.raml', 'Holidays: true', 'noHolidays, notOnlyFutureDates');
    });

    it("Resource type with parameters reference completion", function () {
        testCompletionByEntryStart('basic/test42.raml', 'stResource\n', 'TestResorceType');
    });

    it("Resource type parameter value reference completion.", function () {
        testCompletionByEntryStart('basic/test42.raml', 'tSchema} }', 'TestSchema');
    });

    it("Include folders names", function () {
        testCompletionByEntryStart('basic/test44.raml', 'chemas/comic-schema.json', 'schemas');
    });

    it("Include file name", function () {
        testCompletionByEntryStart('basic/test44.raml', 'ic-schema.json', 'comic-schema.json');
    });

    it("Inherited type example completion", function () {
        testCompletionByEntryStart('basic/test53.raml', 'pe: user', 'type');
    });

    it("Inherited type multiple examples properties completion", function () {
        testCompletionByEntryStart('basic/test53.raml', 'pe: admin', 'type');
    });

    it("Parameter facet minLength completion", function () {
        testCompletionByEntryStart('basic/test45.raml', 'ngth: 4', 'minLength');
    });

    it("Parameter facet maxLength completion", function () {
        testCompletionByEntryStart('basic/test45.raml', 'xLength: 8', 'maxLength');
    });

    it("Parameter facet example completion", function () {
        testCompletionByEntryStart('basic/test45.raml', 'ple: stat', 'example');
    });

    it("Parameter facet enum completion", function () {
        testCompletionByEntryStart('basic/test45.raml', 'num:', 'enum');
    });

    it("Parameter facet default completion", function () {
        testCompletionByEntryStart('basic/test45.raml', 'fault: user', 'default');
    });

    it("Parameter facet displayName completion", function () {
        testCompletionByEntryStart('basic/test45.raml', 'playName:', 'displayName');
    });

    it("Parameter facet description completion", function () {
        testCompletionByEntryStart('basic/test45.raml', 'cription:', 'description');
    });

    it("Parameter facet required completion", function () {
        testCompletionByEntryStart('basic/test45.raml', 'uired: false', 'required');
    });

    it("Parameter facet repeat completion", function () {
        testCompletionByEntryStart('basic/test45.raml', 'peat: false', 'repeat');
    });

    it("Parameter facet pattern completion", function () {
        testCompletionByEntryStart('basic/test45.raml', 'tern: ^[a-zA-Z0-9][-a-zA-Z0-9]*$', 'pattern');
    });

    it("Parameter facet type completion", function () {
        testCompletionByEntryStart('basic/test45.raml', 'pe: string', 'type');
    });

    it("RAML nodes: types, traits, title", function () {
        testCompletionByEntryStart('basic/test46.raml', 'itle: API SPEC', 'title, traits');
    });

    it("RAML nodes: description, documentation", function () {
        testCompletionByEntryStart('basic/test46.raml', 'mentation:', 'documentation');
    });

    it("RAML node: version", function () {
        testCompletionByEntryStart('basic/test46.raml', 'ersion: V2', 'version');
    });

    it("RAML nodes: baseUri, baseUriParameters", function () {
        testCompletionByEntryStart('basic/test46.raml', 'aseUriParameters:', 'baseUri, baseUriParameters');
    });

    it("RAML node: protocols", function () {
        testCompletionByEntryStart('basic/test46.raml', 'otocols:', 'protocols');
    });

    it("RAML node: mediaType", function () {
        testCompletionByEntryStart('basic/test46.raml', 'iaType: application/json', 'mediaType');
    });

    it("RAML nodes: schemas, securitySchemes, securedBy", function () {
        testCompletionByEntryStart('basic/test46.raml', 'chemas:', 'schemas, securedBy, securitySchemes');
    });

    it("RAML node resourceTypes", function () {
        testCompletionByEntryStart('basic/test46.raml', 'ourceTypes:', 'resourceTypes');
    });

    it("Spec allowed protocols: ", function () {
        testCompletionByEntryStart('basic/test47.raml', 'TTP', 'HTTP, HTTPS');
    });

    it("Spec several default media types", function () {
        testCompletionByEntryStart('basic/test48.raml', 'pplication/json', 'application/json, application/xml, application/x-www-form-urlencoded');
    });

    it("Request body 'application/xml', 'application/json', 'application/x-www-form-urlencoded' media types", function () {
        testCompletionByEntryStart('basic/test49.raml', 'ication/x-www-form-urlencoded:', 'application/xml, application/json, application/x-www-form-urlencoded');
    });

    it("Request body 'multipart/form-data' media type", function () {
        testCompletionByEntryStart('basic/test49.raml', 'tipart/form-data:', 'multipart/form-data');
    });

    it("Response body media type", function () {
        testCompletionByEntryStart('basic/test49.raml', 'ication/json:', 'application/xml, application/json, application/x-www-form-urlencoded');
    });

    it("Default Spec Security", function () {
        testCompletionByEntryStart('basic/test48.raml', 'auth_2_0, oauth_1_0 ]', 'oauth_2_0, oauth_1_0');
    });

    it("Resource Security", function () {
        testCompletionByEntryStart('basic/test48.raml', 'auth_1_0', 'oauth_2_0, oauth_1_0');
    });

    it("Resource Security schemes BUG#2613 FIXME", function () {
        testCompletionByEntryStart('basic/test48.raml', 'uth_1_0]', 'oauth_2_0, oauth_1_0');
    });

    it("Resource nodes 'description, displayName, delete'", function () {
        testCompletionByEntryStart('basic/test50.raml', 'escription:', 'displayName, description, delete');
    });

    it("Method 'get:'", function () {
        testCompletionByEntryStart('basic/test50.raml', 'et:', 'get');
    });

    it("Methods 'put, post, patch'", function () {
        testCompletionByEntryStart('basic/test50.raml', 'ut:', 'put, post, patch');
    });

    it("Resource 'uriParameters'", function () {
        testCompletionByEntryStart('basic/test50.raml', 'riParameters:', 'uriParameters');
    });

    it("Method 'options'", function () {
        testCompletionByEntryStart('basic/test50.raml', 'ptions:', 'options');
    });

    it("Method 'head'", function () {
        testCompletionByEntryStart('basic/test50.raml', 'ead:', 'head');
    });

    it("Method Security", function () {
        testCompletionByEntryStart('basic/test48.raml', 'auth_1_0', 'oauth_2_0, oauth_1_0');
    });

    it("Method several Security  BUG#2613 FIXME", function () {
        testCompletionByEntryStart('basic/test48.raml', 'auth_1_0]', 'oauth_2_0, oauth_1_0');
    });

    it("Method nodes 'queryString, queryParameters'", function () {
        testCompletionByEntryStart('basic/test50.raml', 'ueryParameters:', 'queryParameters');
    });

    it("Method request 'headers'", function () {
        testCompletionByEntryStart('basic/test50.raml', 'eaders:', 'headers');
    });

    it("Method request 'headers' items completion", function () {
        testCompletionByEntryStart('basic/test50.raml', 't-Modified:', 'Last-Modified, Last-Event-ID');
    });

    it("Method request 'body'", function () {
        testCompletionByEntryStart('basic/test50.raml', 'ody:', 'body, baseUriParameters');
    });

    it("Method node 'responses'", function () {
        testCompletionByEntryStart('basic/test50.raml', 'sponses:', 'responses');
    });

    it("Method node 'protocols'", function () {
        testCompletionByEntryStart('basic/test50.raml', 'tocols:', 'protocols');
    });

    it("Response codes", function () {
        testCompletionByEntryStart('basic/test50.raml', '01:', '100, 101, 102');
    });

    it("Response body mimeTypes", function () {
        testCompletionByEntryStart('basic/test50.raml', 'lication/json:', 'application/json, application/xml, application/x-www-form-urlencoded');
    });

    it("Security Scheme node 'type'", function () {
        testCompletionByEntryStart('basic/test51.raml', 'pe: x-{other}', 'type');
    });

    it("Security Scheme 'type' values OAuth 2.0, OAuth 1.0", function () {
        testCompletionByEntryStart('basic/test51.raml', 'uth 2.0\n', 'OAuth 2.0, OAuth 1.0');
    });

    it("Security Scheme 'type' value Basic Authentication", function () {
        testCompletionByEntryStart('basic/test51.raml', 'sic Authentication', 'Basic Authentication');
    });

    it("Security Scheme 'type' value Digest Authentication", function () {
        testCompletionByEntryStart('basic/test51.raml', 'est Authentication', 'Digest Authentication');
    });

    it("Security Scheme 'type' value x-{other}", function () {
        testCompletionByEntryStart('basic/test51.raml', '-{other}', 'x-{other}');
    });

    it("Security Scheme node: settings", function () {
        testCompletionByEntryStart('basic/test51.raml', 'ings', 'settings');
    });

    it("Oauth 2.0 settings nodes authorizationGrants, accessTokenUri, authorizationUri", function () {
        testCompletionByEntryStart('basic/test51.raml', 'thorizationGrants: [ authorization_code, password, implicit, client_credentials ]', 'authorizationGrants, accessTokenUri, authorizationUri');
    });

    it("Oauth 2.0 settings node scopes", function () {
        testCompletionByEntryStart('basic/test51.raml', 'pes:', 'scopes');
    });

    it("Security Scheme nodes: description, describedBy", function () {
        testCompletionByEntryStart('basic/test51.raml', 'ription:', 'description, describedBy');
    });

    it("Oauth 2.0 describedBy node headers", function () {
        testCompletionByEntryStart('basic/test51.raml', 'ders:', 'headers');
    });

    it("Oauth 2.0 describedBy node headers item", function () {
        testCompletionByEntryStart('basic/test51.raml', '-Frame-Options:', 'X-Frame-Options');
    });

    it("Oauth 2.0 describedBy node queryParameters", function () {
        testCompletionByEntryStart('basic/test51.raml', 'yParameters:', 'queryParameters');
    });

    it("Oauth 2.0 describedBy node responses", function () {
        testCompletionByEntryStart('basic/test51.raml', 'ponses:', 'responses');
    });

    it("Oauth 1.0 settings node requestTokenUri", function () {
        testCompletionByEntryStart('basic/test52.raml', 'uestTokenUri: https://api.dropbox.com/1/oauth/request_token', 'requestTokenUri');
    });

    it("Oauth 1.0 node authorizationUri", function () {
        testCompletionByEntryStart('basic/test52.raml', 'horizationUri: https://www.dropbox.com/1/oauth/authorize', 'authorizationUri');
    });

    it("Oauth 1.0 node tokenCredentialsUri", function () {
        testCompletionByEntryStart('basic/test52.raml', 'enCredentialsUri: https://api.dropbox.com/1/oauth/access_token', 'tokenCredentialsUri');
    });

    it("Function singularize", function () {
        testCompletionByEntryStart('basic/test54.raml', 'larize>>', 'singularize');
    });

    it("Function pluralize", function () {
        testCompletionByEntryStart('basic/test54.raml', 'uralize>>', 'pluralize');
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
