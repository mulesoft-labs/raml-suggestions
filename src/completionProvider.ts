/// <reference path="../typings/main.d.ts" />
declare function require(s:string):any;

import parserApi = require("raml-1-parser");

import def = parserApi.ds;
import search= parserApi.search;
import universeModule = parserApi.universes;
import universeHelpers = parserApi.universeHelpers;
import services = def;

import _ = require("underscore");

import {IFSProvider} from "./completionProviderInterfaces";
import {IEditorStateProvider} from "./completionProviderInterfaces";
import {IASTProvider} from "./completionProviderInterfaces";
import {FSResolverExt} from "./completionProviderInterfaces";
import {Suggestion} from "./completionProviderInterfaces";

var categories = require("../resources/categories.json");

export class CompletionRequest {
    content: IEditorStateProvider;

    private prefixValue: string;

    async: boolean = false;

    promises: Promise<any[]>[];

    constructor(content: IEditorStateProvider) {
        this.content = content;
    }

    prefix(): string {
        if(typeof this.prefixValue !== 'undefined') {
            return this.prefixValue;
        }

        return getPrefix(this);
    }

    setPrefix(value: string): void {
        this.prefixValue = value;
    }

    valuePrefix(): string {
        var offset = this.content.getOffset();

        var text = this.content.getText();

        for(var i = offset - 1; i >= 0; i--) {
            var c = text.charAt(i);

            if(c === '\r' || c === '\n' || c=== ' ' || c=== '\t' || c ==='"' || c=== '\'' || c === ':' || c === '(') {
                return text.substring(i+1,offset);
            }

        }

        return "";
    }
}

export class CompletionProvider {
    contentProvider: IFSProvider

    currentRequest : CompletionRequest = null;

    astProvider: IASTProvider = null;

    level: number = 0;

    constructor(contentProvider: IFSProvider, astProvider: IASTProvider = null) {
        this.contentProvider = contentProvider;
    }

    suggest(request: CompletionRequest, doPostProcess: boolean = false) : any[] {
        var suggestions: any[] = doSuggest(request, this);

        return doPostProcess ? postProcess(suggestions, request) : suggestions;
    }

    suggestAsync(request: CompletionRequest, doPostProcess: boolean = false): Promise<any[]> {
        return doSuggestAsync(request, this).then(suggestions => doPostProcess ? postProcess(suggestions, request) : suggestions, error => error);
    }
}

export function suggest(editorState: IEditorStateProvider, fsProvider: IFSProvider, astProvider: IASTProvider = null) : Suggestion[] {
    var completionRequest = new CompletionRequest(editorState);
    var completionProvider = new CompletionProvider(fsProvider, astProvider);

    return completionProvider.suggest(completionRequest, true);
}

export function suggestAsync(editorState: IEditorStateProvider, fsProvider: IFSProvider) : Promise<Suggestion[]> {
    var completionRequest = new CompletionRequest(editorState);
    var completionProvider = new CompletionProvider(fsProvider);

    return completionProvider.suggestAsync(completionRequest, true);
}

function categoryByRanges(suggestion: string, parentRange: services.ITypeDefinition, propertyRange: services.ITypeDefinition): string {
    var categoryNames:string[] = Object.keys(categories);

    for(var i = 0; i < categoryNames.length; i++) {
        var categoryName = categoryNames[i];

        var issues = Object.keys(categories[categoryName]);
        
        for(var j = 0; j < issues.length; j++) {
            var issueName = issues[j];
            
            if(issueName !== suggestion) {
                continue;
            }
            
            var issue = categories[categoryName][issueName];

            var propertyIs = issue.is || [];
            var parentIs = issue.parentIs || [];

            if(propertyRange && _.find(propertyIs, (name: string) => isRangeAssignable(propertyRange, name))) {
                return categoryName;
            }

            if(parentRange && _.find(parentIs, (name: string) => isRangeAssignable(parentRange, name))) {
                return categoryName;
            }
        }
    }

    return 'unknown';
}

function isRangeAssignable(type: services.ITypeDefinition, defCode: string) {

    var keys = defCode.split(".");

    var defObject: any = parserApi.universes;

    for(var i = 0; i < keys.length; i++) {
        defObject = defObject[keys[i]];
    }

    return type.isAssignableFrom(defObject.name);
}

function doSuggest(request: CompletionRequest, provider: CompletionProvider) : Suggestion[] {
    var preParsedAST : parserApi.hl.IParseResult = null;

    if (provider.astProvider) {
        preParsedAST = provider.astProvider.getASTRoot();
    }

    var result = getSuggestions(request, provider, preParsedAST);
    if (result) return result;
    return [];
}

function doSuggestAsync(request: CompletionRequest, provider: CompletionProvider): Promise<Suggestion[]> {
    request.async = true;
    request.promises = [];

    var apiPromise = parserApi.parseRAML(modifiedContent(request), {
        fsResolver: (<any>provider.contentProvider).fsResolver,
        filePath: request.content.getPath()
    });

    var suggestionsPromise = apiPromise.then(api => getSuggestions(request, provider, findAtOffsetInNode(request.content.getOffset(), api.highLevel())));

    var requestSuggestionsPromise = suggestionsPromise.then((suggestions: Suggestion[]) => {
        return Promise.all([suggestions].concat(request.promises));
    });

    var finalPromise = requestSuggestionsPromise.then((arrays: Suggestion[][]) => {
        var result: Suggestion[] = [];

        arrays.forEach((suggestions => {
            result = result.concat(suggestions);
        }));

        return result;
    });

    return finalPromise;
}

function getSuggestions(request: CompletionRequest, provider: CompletionProvider,
                        preParsedAst: parserApi.hl.IParseResult = undefined, project?: parserApi.ll.IProject): Suggestion[] {
    provider.currentRequest = request;

    try {
        if(provider.level > 100){
            return;
        }

        provider.level ++;

        var offset = request.content.getOffset();

        var text = request.content.getText();

        var kind = completionKind(request);

        var node: parserApi.hl.IHighLevelNode =
            <parserApi.hl.IHighLevelNode>(preParsedAst ? preParsedAst : getAstNode(request, provider.contentProvider, true, true, project));

        var hlnode: parserApi.hl.IHighLevelNode = node;

        if(kind === parserApi.search.LocationKind.DIRECTIVE_COMPLETION) {
            return [{text: "include"}];
        }

        if(kind === parserApi.search.LocationKind.ANNOTATION_COMPLETION) {
            var declarations = parserApi.search.globalDeclarations(hlnode).filter(x => parserApi.universeHelpers.isAnnotationTypesProperty(x.property()));

            return declarations.map(x => {
                return {
                    text:parserApi.search.qName(x,hlnode),

                    annotation:true
                };
            });
        }

        if(kind === parserApi.search.LocationKind.VERSION_COMPLETION) {
            return ramlVersionCompletion(request);
        }

        if(kind === parserApi.search.LocationKind.INCOMMENT) {
            return [];
        }

        if(node === null) {
            return [];
        }

        var hasNewLine = false;

        for(var position = offset - 1; position >= hlnode.lowLevel().start(); position--) {
            var ch = text[position];

            if(ch == '\r' || ch == '\n') {
                hasNewLine = true;

                break;
            }
        }

        var cmi = offset;

        for(var pm = offset - 1; pm >= 0; pm--) {
            var c = text[pm];

            if(c === ' ' || c === '\t') {
                cmi = pm;

                continue;
            }

            break;
        }

        var attr = _.find(hlnode.attrs(), x=>x.lowLevel().start() < cmi && x.lowLevel().end() >= cmi && !x.property().getAdapter(parserApi.ds.RAMLPropertyService).isKey());

        if(!attr) {
            var p = _.find(hlnode.definition().allProperties(), p=>(<parserApi.ds.Property>p).canBeValue());

            if (!hasNewLine) {
                if (p && kind == parserApi.search.LocationKind.VALUE_COMPLETION &&
                    parserApi.universeHelpers.isTypeProperty(p)) {
                    if (hlnode.children().length == 1) {
                        attr = parserApi.stubs.createASTPropImpl(hlnode.lowLevel(), hlnode, p.range(), p);
                    }
                }
            }
            else {

                var cm = _.find(hlnode.lowLevel().children(), x=>x.start() < offset && x.end() >= offset)
                if (cm) {
                    var p = _.find(hlnode.definition().allProperties(), p=>p.nameId() == cm.key());
                    if (p) {
                        var il = getIndent(cm.keyStart(), cm.unit().contents());
                        var il2 = getIndent(offset, cm.unit().contents());
                        if (il2.length > il.length + 1) {
                            var isValue = p.range().hasValueTypeInHierarchy();
                            if (isValue) {
                                attr = parserApi.stubs.createVirtualASTPropImpl(cm, hlnode, p.range(), p);
                            }
                            else {
                                if (cm.children().length > 0) {
                                    hlnode =parserApi.stubs.createVirtualNodeImpl(cm.children()[0], hlnode, <any>p.range(), p);
                                }
                            }
                        }
                    }
                    //console.log(cm.key())
                }
            }
        }
        if (kind == parserApi.search.LocationKind.PATH_COMPLETION) {
            return pathCompletion(request, provider.contentProvider, attr, hlnode, false)
        }


        if(attr && (kind === parserApi.search.LocationKind.KEY_COMPLETION || kind === parserApi.search.LocationKind.SEQUENCE_KEY_COPLETION)) {
            var txt = "";

            for(var position = offset - 1; position >= 0; position--) {
                var ch = text[position];

                if (ch == '\r' || ch == '\n') {
                    break;
                }

                txt = ch + txt;
            }

            txt = txt.trim();

            if(txt != attr.name()) {
                kind = parserApi.search.LocationKind.VALUE_COMPLETION;
            }
        }

        if(kind == parserApi.search.LocationKind.VALUE_COMPLETION) {
            var parentPropertyOfAttr = attr && (<any>attr).parent && (<any>attr).parent() && (<any>attr).parent().property && (<any>attr).parent().property();
            
            if(parentPropertyOfAttr && (<any>universeHelpers).isUsesProperty(parentPropertyOfAttr)) {
                return pathCompletion(request, provider.contentProvider, attr, hlnode, false);
            }

            var proposals = valueCompletion(node, attr, request, provider);

            if(!attr){
                if (!proposals||proposals.length==0) {
                    if (!hasNewLine) {
                        if (hlnode.definition().getAdapter(parserApi.ds.RAMLService).isUserDefined()) {
                            return propertyCompletion(hlnode, request, mv, defNode, hasNewLine/*we can get 'k' only if we are completing the start of node key*/)
                        }
                    }
                }
            }
            if (attr && attr.property() && ((<def.Property>attr.property()).getAdapter(parserApi.ds.RAMLPropertyService).isTypeExpr() ||
                (<def.Property>attr.property()).isAnnotation())) {
                if (!proposals) {
                    proposals = [];
                }

                proposals = proposals.filter(x=> {
                    var proposalText = getProposalText(x);

                    if(proposalText === hlnode.name()) {
                        return false;
                    }

                    return true;
                });

                var pref = request.valuePrefix();
                var nmi = pref.lastIndexOf(".");
                if (nmi) {
                    pref = pref.substr(0, nmi + 1);
                }
                else {
                    pref = null;
                }
                if (pref) {
                    proposals = proposals.filter(x=>getProposalText(x).indexOf(pref) == 0);
                    proposals.forEach(x=>updateProposalText(x, getProposalText(x).substring(pref.length)));
                }
            }
            if (proposals) {
                if (text[offset - 1] == ':') {
                    proposals.forEach(x=> {
                        if (x.extra) {
                            x.extra = " " + x.extra;
                        }
                        else {
                            x.extra = " ";
                        }

                    })
                }

                if(request.prefix().indexOf("[") != -1) {
                    request.setPrefix("");
                    proposals.forEach(x=> {
                        x.text = ": [ " + x.displayText;
                    })
                } else if(isSquareBracketExpected(attr)) {
                    proposals = proposals.filter(proposed => !isSiblingExists(attr, proposed.displayText));


                    var ending = "";

                    var initialPosition = offset;

                    for(var i = initialPosition; i < text.length && !/[\t\n\r]/.test(text[i]); i++) {
                        ending += text[i];

                        if(ending.replace(/\s/g, '') === ":") {
                            proposals.forEach(x=> {
                                x.text = x.displayText;
                                x.snippet = null;
                                x.extra = null;
                            });

                            break;
                        }
                    }

                    var isOpenSquarePresent = false;

                    initialPosition = offset - 1;

                    for(var i = initialPosition; i >= 0 && !/[\t\n\r]/.test(text[i]); i--) {
                        if(text[i] === "[") {
                            isOpenSquarePresent = true;
                            break;
                        }
                    }

                    if(!isOpenSquarePresent) {
                        proposals.forEach(x=> {
                            if(!request.valuePrefix() && x.snippet) {
                                x.text = x.displayText;
                                x.snippet = "[" + x.snippet + "]";
                                return;
                            }

                            x.extra = " [";
                            x.text = (x.snippet || x.displayText) + "]";
                            x.snippet = null;
                        })
                    }


                } else {
                    var ending = "";

                    var initialPosition = offset;

                    for(var i = initialPosition; i < text.length && !/[\t\n\r]/.test(text[i]); i++) {
                        ending += text[i];

                        if(ending.replace(/\s/g, '') === ":") {
                            proposals.forEach(x=> {
                                x.text = x.displayText;
                                x.snippet = null;
                                x.extra = null;
                            });

                            break;
                        }
                    }

                    proposals.forEach(x=> {
                        if(x.isResourceType && !request.valuePrefix() && x.snippet) {
                            x.snippet = x.extra + x.snippet;
                            x.extra = null;
                            x.text = x.displayText;
                        }
                    })
                }

            }
            if (!hasNewLine && proposals && proposals.length > 0) {
                proposals = addDefineInlineProposal2(proposals, hlnode.lowLevel().start(), text);
            }

            if(proposals && isInResourceDescription(attr) && request.prefix() && request.prefix().length > 0) {
                var canBeTemplate = false;
                var canBeTransform1 = 0;
                var canBeTransform2 = 0;

                var txt = "";

                for (var position = offset - 1; position >= 0; position--) {
                    var ch = text[position];

                    if (ch === '\r' || ch === '\n') {
                        break;
                    }

                    if (ch === '<' && text[position - 1] === '<') {
                        canBeTemplate = true;

                        break;
                    }

                    if(ch === '!') {
                        canBeTransform1 ++;
                    }

                    if(ch === '|' && canBeTransform1 === 1) {
                        canBeTransform2 ++;
                    }

                    txt = ch + txt;
                }

                if(canBeTemplate && canBeTransform1 === 1 && canBeTransform2 === 1) {
                    var leftPart = new RegExp(/\|\s*!\s*/.source + request.prefix());

                    if(leftPart.test(txt)) {
                        proposals = addTransformers(proposals, request.prefix());
                    }
                }
            }

            return proposals;
        }
        if (kind == search.LocationKind.KEY_COMPLETION ||
            (kind == search.LocationKind.SEQUENCE_KEY_COPLETION && offset > 0 && text.charAt(offset - 1) != '-'
            && text.charAt(offset - 1) != ' ')) {
            if (node.isAttr() || node.isImplicit()) {
                throw new Error("Should be highlevel node at this place")
            }

            if (search.isExampleNode(hlnode)) {
                return examplePropertyCompletion(hlnode, request, provider);
            }
            
            if (hlnode.property()
                && universeHelpers.isUriParametersProperty(hlnode.property())
                && hlnode.definition() instanceof def.NodeClass) {
                var nm = hlnode.parent().attr("relativeUri");
                if (nm && hlnode.name().substring(0, hlnode.name().length - 1) == request.valuePrefix()) {
                    var runtime:string[] = parserApi.utils.parseUrl(nm.value());
                    if (runtime instanceof Array) {
                        if (runtime) {
                            if (isColonNeeded(offset, text)) {
                                var rs:{text:string}[] = runtime.map(x=> {
                                    return {text: x + ": \n" + getIndent2(offset, text) + "  "}
                                });
                            }
                            else {
                                var rs:{text:string}[] = runtime.map(x=> {
                                    return {text: x}
                                });
                            }
                            return rs;
                        }
                    }
                }
            }
            if (hlnode.property() && universeHelpers.isBaseUriParametersProperty(hlnode.property()) && hlnode.definition() instanceof def.NodeClass) {
                var nm = hlnode.root().attr(universeModule.Universe10.Api.properties.baseUri.name);
                if (nm && hlnode.name().substring(0, hlnode.name().length - 1) == request.valuePrefix()) {
                    var runtime:string[] = parserApi.utils.parseUrl(nm.value());
                    if (runtime instanceof Array) {
                        if (runtime) {
                            if (isColonNeeded(offset, text)) {
                                var rs:{text:string}[] = runtime.map(x=> {
                                    return {text: x + ": \n" + getIndent2(offset, text) + "  "}
                                });
                            }
                            else {
                                var rs:{text:string}[] = runtime.map(x=> {
                                    return {text: x}
                                });
                            }
                            return rs;
                        }
                    }
                }
            }
            //FIXME It still should be improved
            if (hlnode.property() &&
                universeHelpers.isResourcesProperty(hlnode.property())) {
                var nm = hlnode.attr("relativeUri");
                if (nm && hlnode.name().substring(0, hlnode.name().length - 1) == request.valuePrefix()) {
                    if (nm && nm.value().indexOf("{") != -1) {
                        return [{text: "mediaTypeExtension}"}]
                    }
                    return [];
                }
            }
            var mv = hlnode.property() && hlnode.property().isMultiValue();
            if (hlnode.lowLevel().keyEnd() < offset) {
                mv = false;
            }
            //extra test /*FIXME*/
            var defNode = true;
            if (mv) {
                var ce = (<def.NodeClass>hlnode.definition()).getAdapter(services.RAMLService).getCanInherit();
                if (ce) {
                    var context = hlnode.computedValue(ce[0]);
                    if (context) {
                        defNode = true;
                        mv = false;
                    }
                }
            }
            return propertyCompletion(hlnode, request, mv, defNode/*we can get 'k' only if we are completing the start of node key*/);
            //now we need node context to get list of available properties:
        }
        return []
    }finally{
        provider.level--;
    }

    //return [];
}

function ramlVersionCompletion(request: CompletionRequest): Suggestion[] {
    var prop = ["RAML 0.8", "RAML 1.0"];

    var rs: Suggestion[] = [];

    var text = request.content.getText();

    var offset = request.content.getOffset();

    var start = text.substr(0, offset);

    if(start.indexOf("#%RAML 1.0 ")==0 ){
        var list=[
            "DocumentationItem",
            "DataType",
            "NamedExample",
            "ResourceType",
            "Trait",
            "SecurityScheme",
            "AnnotationTypeDeclaration",
            "Library",
            "Overlay",
            "Extension"]
        return list.map(x=> {return {text:x}});
    }
    prop.forEach(x=> {

        if (("#%"+x).indexOf(start)!=0){
            return;
        }

        if (text.trim().indexOf("#%") == 0) {
            if (request.prefix().indexOf("R") != -1) {
                rs.push({displayText: x, text: x});
            }
            else {
                var pref = text.substring(2, offset);

                if (x.indexOf(pref) == 0) {
                    if (request.prefix() == "1" || request.prefix() == '0') {
                        rs.push({displayText: x, text: request.prefix() + x.substr(offset - 2)});
                    }
                    else {
                        rs.push(<Suggestion>{displayText: x, text: x.substr(offset - 2)});
                    }
                }
            }
        }
        else {
            rs.push(<Suggestion>{displayText: x, text: x, extra: "%"});
        }
    })
    return rs;
};

function completionKind(request: CompletionRequest) {
    return parserApi.search.determineCompletionKind(request.content.getText(), request.content.getOffset());
}

function getAstNode(request: CompletionRequest, contentProvider: IFSProvider, clearLastChar: boolean = true, allowNull: boolean = true, oldProject?: parserApi.ll.IProject): parserApi.hl.IParseResult {
    var newProjectId: string = contentProvider.contentDirName(request.content);

    var project: any = oldProject || parserApi.project.createProject(newProjectId, <FSResolverExt>(<any>contentProvider).fsResolver);

    var offset = request.content.getOffset();

    var text = request.content.getText();

    var kind = completionKind(request);

    if(kind === parserApi.search.LocationKind.KEY_COMPLETION && clearLastChar){
        text = text.substring(0, offset) + "k:" + text.substring(offset);
    }

    var unit = project.setCachedUnitContent(request.content.getBaseName(), text);

    var ast = <parserApi.hl.IHighLevelNode>unit.highLevel();

    var actualOffset = offset;

    for(var currentOffset = offset - 1; currentOffset >= 0; currentOffset--){
        var symbol = text[currentOffset];

        if(symbol === ' ' || symbol === '\t') {
            actualOffset = currentOffset - 1;

            continue;
        }

        break;
    }

    var astNode=ast.findElementAtOffset(actualOffset);

    if(!allowNull && !astNode){
        return ast;
    }

    if(astNode && search.isExampleNode(astNode)) {
        var exampleEnd = astNode.lowLevel().end();

        if(exampleEnd === actualOffset && text[exampleEnd] === '\n') {
            astNode = astNode.parent();
        }
    }

    return astNode;
}

function modifiedContent(request: CompletionRequest): string {
    var offset = request.content.getOffset();

    var text = request.content.getText();

    var kind = completionKind(request);

    if(kind === parserApi.search.LocationKind.KEY_COMPLETION){
        text = text.substring(0, offset) + "k:" + text.substring(offset);
    }

    return text;
}

function findAtOffsetInNode(offset: number, node: parserApi.hl.IHighLevelNode): parserApi.hl.IParseResult {
    var actualOffset = offset;

    var text = node.lowLevel().unit().contents();

    for(var currentOffset = offset - 1; currentOffset >= 0; currentOffset--){
        var symbol = text[currentOffset];

        if(symbol === ' ' || symbol === '\t') {
            actualOffset = currentOffset - 1;

            continue;
        }

        break;
    }

    return node.findElementAtOffset(actualOffset);
}

function getIndent(offset:number,text:string): string {
    var spaces = "";
    for (var i = offset - 1; i >= 0; i--) {
        var c = text.charAt(i);
        if (c == ' ' || c == '\t') {
            if (spaces) {
                spaces += c;
            }
            else {
                spaces = c;
            }
        }
        else if (c == '\r' || c == '\n') {
            return spaces;
        }
        else if (spaces) {
            return "";
        }
    }
    return "";
}

function getIndentWithSequenc(offset:number,text:string): string {
    var spaces = "";
    for (var i = offset - 1; i >= 0; i--) {
        var c = text.charAt(i);
        if (c == ' ' || c == '\t' || c == '-') {
            if (spaces) {
                spaces += c;
            }
            else {
                spaces = c;
            }
        }
        else if (c == '\r' || c == '\n') {
            return spaces;
        }
        else if (spaces) {
            return "";
        }
    }
    return "";
}

function getIndent2(offset:number,text:string): string {
    var spaces = "";
    for (var i = offset - 1; i >= 0; i--) {
        var c = text.charAt(i);
        if (c == ' ' || c == '\t') {
            if (spaces) {
                spaces += c;
            }
            else {
                spaces = c;
            }
        }
        else if (c == '\r' || c == '\n') {
            return spaces;
        }

    }
}

function pathCompletion(request:CompletionRequest, contentProvider: IFSProvider, attr: parserApi.hl.IAttribute, hlNode: parserApi.hl.IHighLevelNode, custom: boolean) {
    var prefix = request.valuePrefix();

    if(prefix.indexOf("#") === -1) {
        return pathPartCompletion(request, contentProvider, attr, hlNode, custom);
    } else {
        return pathReferencePartCompletion(request, contentProvider, attr, hlNode, custom);
    }
}

function pathPartCompletion(request:CompletionRequest, contentProvider: IFSProvider, attr: parserApi.hl.IAttribute, hlNode: parserApi.hl.IHighLevelNode, custom:boolean) {
    var prefix = request.valuePrefix();

    var dn: string | Promise<string> = contentProvider.contentDirName(request.content);

    var ll = contentProvider.resolve(<string>dn, prefix.indexOf('/') === 0 ? ('.' + prefix) : prefix);
    
    var indexOfDot = ll.lastIndexOf('.');

    var indexOfSlash = ll.lastIndexOf('/');
    
    if(!(indexOfDot > 0 && (indexOfDot > indexOfSlash || indexOfSlash < 0))) {
        indexOfDot = -1;
    }

    var typedPath = ll;

    if(ll) {
        dn = contentProvider.dirName(ll);
        
        if(request.async) {
            dn = contentProvider.existsAsync(ll).then(isExists => {
                if(!isExists) {
                    return contentProvider.dirName(ll);
                }
                
                return contentProvider.isDirectoryAsync(ll).then(isDirectory => {
                    if(!isDirectory) {
                        return contentProvider.dirName(ll);
                    }
                    
                    return ll;
                })
            })
        } else if(contentProvider.exists(ll) && contentProvider.isDirectory(ll)){
            dn=ll;
        }
    }

    var res: any[] = [];

    var known = !custom;

    if(attr) {
        if(custom) {
            if(attr.name() === 'example') {
                res = res.concat(fromDir(prefix, dn, "examples", contentProvider, request.promises));
                known = true;
            }

            if(attr.name() === 'value' &&
                parserApi.universeHelpers.isGlobalSchemaType(attr.parent().definition())) {

                res = res.concat(fromDir(prefix, dn, "schemas", contentProvider, request.promises));

                known = true;
            }
        }

    }
    if (!attr) {
        if (custom) {
            if (parserApi.universeHelpers.isTraitType(hlNode.definition())) {
                res = res.concat(fromDir(prefix, dn, "traits", contentProvider, request.promises));
                known = true;
            }
            if (parserApi.universeHelpers.isResourceTypeType(hlNode.definition())) {
                res = res.concat(fromDir(prefix, dn, "resourceTypes", contentProvider, request.promises));
                known = true;
            }
            if (parserApi.universeHelpers.isSecuritySchemaType(hlNode.definition())) {
                res = res.concat(fromDir(prefix, dn, "securitySchemes", contentProvider, request.promises));
                known = true;
            }
            if (parserApi.universeHelpers.isGlobalSchemaType(hlNode.definition())) {
                res = res.concat(fromDir(prefix, dn, "schemas", contentProvider, request.promises));
                known = true;
            }
        }
    }

    if(!known || !custom) {
        if(request.async) {
            filtredDirContentAsync(dn, typedPath, indexOfDot, contentProvider, request.promises);
        } else if(contentProvider.exists(<string>dn) && contentProvider.isDirectory(<string>dn)) {
            var dirContent = contentProvider.readDir(<string>dn);



            res = res.concat(dirContent.filter(x => {
                try {
                    var fullPath = contentProvider.resolve(<string>dn, x);

                    if(fullPath.indexOf(typedPath) === 0) {
                        return true;
                    }
                } catch(exception) {
                    return false;
                }
            }).map(x=> {
                return {text: indexOfDot > 0 ? contentProvider.resolve(<string>dn, x).substr(indexOfDot + 1) : x}
            }));
        }
    }

    return res;
}

function filtredDirContentAsync(dirName: string | Promise<string>, typedPath: string, indexOfDot: number, contentProvider: IFSProvider, promises: Promise<any[]>[]): void {
    if(promises) {
        var asString: string;

        var exists = (<Promise<string>>dirName).then(dirNameStr => {
            asString = <string>dirNameStr;

            return contentProvider.existsAsync(dirNameStr)
        });

        var dirContent = exists.then(isExists => {
            if(!isExists) {
                return [];
            }

            return contentProvider.isDirectoryAsync(asString).then(isDir => {
                if(!isDir) {
                    return [];
                }

                return contentProvider.readDirAsync(asString).then(dirContent => {
                    return dirContent.filter(x => {
                        try {
                            var fullPath = contentProvider.resolve(asString, x);

                            if(fullPath.indexOf(typedPath) === 0) {
                                return true;
                            }
                        } catch(exception) {
                            return false;
                        }
                    }).map(x=> {
                        return {text: indexOfDot > 0 ? contentProvider.resolve(<string>dirName, x).substr(indexOfDot + 1) : x}
                    });
                });
            });
        });

        promises.push(dirContent);
    }
}

function fromDir(prefix: string, dn:string | Promise<string>, dirToLook: string, contentProvider: IFSProvider, promises?: Promise<any[]>[]){
    if(promises) {
        var existsPromise = (<Promise<string>>dn).then(dirName => {
            var pss = contentProvider.resolve(<string>dirName, dirToLook);

            return contentProvider.existsAsync(pss);
        });

        var proposalsPromise = existsPromise.then(result => {
            if(result) {
                return contentProvider.readDirAsync(pss).then(dirNames => {
                    var proposals = dirNames.map(x => {return {text:x,replacementPrefix:prefix,extra:"./"+dirToLook+"/"}});

                    return proposals;
                })
            }

            return [];
        });

        promises.push(proposalsPromise);

        return [];
    }

    var pss = contentProvider.resolve(<string>dn,dirToLook);

    if(contentProvider.exists(pss)) {
        var dirContent = contentProvider.readDir(pss);

        var proposals = dirContent.map(x=>{return {text:x,replacementPrefix:prefix,extra:"./"+dirToLook+"/"}});

        return proposals;
    }

    return [];
}

function pathReferencePartCompletion(request:CompletionRequest, contentProvider: IFSProvider, attr:parserApi.hl.IAttribute, hlNode:parserApi.hl.IHighLevelNode, custom:boolean){
    var prefix = request.valuePrefix();

    var includePath = parserApi.schema.getIncludePath(prefix);
    var includeReference =  parserApi.schema.getIncludeReference(prefix);

    if (!includePath || !includeReference) {
        return [];
    }

    var includeUnit = attr.lowLevel().unit().resolve(includePath);
    if (!includeUnit) {
        return [];
    }

    var content = includeUnit.contents();
    if (!content) {
        return [];
    }

    try {
        var proposals =  parserApi.schema.completeReference(includePath, includeReference, content);

        return proposals.map(proposal=>{
            return {
                text: proposal
            };
        })
    } catch (Error) {
        console.log(Error);
    }

    return [];
}

function isColonNeeded(offset:number, text:string): boolean {
    var needColon = true;

    for (var i = offset > 0 ? offset - 1 : 0; i < text.length; i++) {
        var chr = text.charAt(i);
        if (chr == ' ' || chr == '\r' || chr == '\n') {
            break;
        }
        if (chr == ':') {
            needColon = false;
        }
    }

    return needColon;
}

function isAllowed(node: parserApi.hl.IHighLevelNode, x: parserApi.hl.IProperty){
    var ok=true;

    (<parserApi.ds.Property>x).getContextRequirements().forEach(y=>{
        if(y.name.indexOf('(') !== -1) {
            return ;
        }
        var vl=node.computedValue(y.name);

        if (vl){
            ok=ok&&(vl==y.value);
        }
        else{
            if (y.value){
                ok=false;
            }
        }
    })
    return ok;
}

/**
 * Returns true if property should be left in the completion proposals, false if the property should be removed
 * @param node
 * @param property
 * @param existing
 */
function filterPropertyCompletion(node: parserApi.hl.IHighLevelNode, property: parserApi.hl.IProperty,
    existing:{[name:string]:boolean}) : boolean {

    //basic filtering
    if (!(!property.getAdapter(parserApi.ds.RAMLPropertyService).isKey() && !property.getAdapter(parserApi.ds.RAMLPropertyService).isMerged()&&!property.getAdapter(services.RAMLPropertyService).isSystem())) {
        return false;
    }

    //contextual filtering
    if (!(isAllowed(node,property))) {
        return false;
    }

    //duplicate filtering
    if (!(!existing[property.nameId()])) {
        return false;
    }

    //annotation filtering
    if (!(!(<def.Property>property).isAnnotation())) {
        return false;
    }

    if (
        property.nameId() == parserApi.universes.Universe10.TypeDeclaration.properties.allowedTargets.name &&
        property.domain().key() &&
        property.domain().key() == parserApi.universes.Universe10.TypeDeclaration &&
        node.localType() &&
        !node.localType().isAnnotationType()
    ) {

        return false;
    }

    return true;
}

function propertyCompletion(node: parserApi.hl.IHighLevelNode, request: CompletionRequest, mv:boolean, c:boolean, hasNewLine: boolean = true) {
    var hlnode = node;
    var notAKey=false;
    var onlyKey=false;

    var text = request.content.getText();
    var offset = request.content.getOffset();

    if (hasNewLine) {
        var is = getIndentWithSequenc(node.lowLevel().keyStart(), text);
        if (is == undefined) {
            is = "";
        }
        var i2s = getIndentWithSequenc(offset, text);
        var i1 = is.length;
        var i2 = i2s.length
        if (i1 == i2 && node.parent()) {
            if (node.property().getAdapter(parserApi.ds.RAMLPropertyService).isMerged()) {
                hlnode = hlnode.parent();
            }
            else {
                notAKey = false;
                onlyKey = true;
            }
        }
        if (i2 > i1) {
            notAKey = true;
            if (i2 >= i1 + 4) {
                onlyKey = true;
                notAKey = false;
            }
        }
        while (i2 < i1 && hlnode.parent()) {
            hlnode = hlnode.parent();
            i1 = i1 - 2;
        }
    }
    var needColon = isColonNeeded(offset, text);
    var ks = needColon ? ": " : "";

    var props = hlnode.definition().allProperties();

    var existing:{[name:string]:boolean} = {};
    hlnode.attrs().forEach(x=> {
        existing[x.name()] = true;
    });

    props = props.filter(x=>filterPropertyCompletion(hlnode,x, existing))

    if (node.definition().isAssignableFrom(parserApi.universes.Universe10.TypeDeclaration.name)){
        if (!node.definition().isAssignableFrom("ObjectTypeDeclaration")){
            if (!node.attr("type")){
                var q=node.definition().universe().type("ObjectTypeDeclaration")
                if (q) {
                    props.push((<def.NodeClass>q).property("properties"))
                }
            }
        }

    }

    //TODO MAKE IT BETTER (actually we need to filter out and guess availabe keys)
    var rs : Suggestion[]=[];
    if (!mv&&!onlyKey) {
        rs=props.map(x=> {
            var complextionText = x.nameId() + ks;
            if(x.range().isAssignableFrom(universeModule.Universe10.ExampleSpec.name)) {
                complextionText = complextionText.trim();
            } else if(!x.range().hasValueTypeInHierarchy() && needColon) {
                complextionText += "\n" + getIndent(offset, text) + "  ";
            }
            return {text: complextionText, displayText: x.nameId(), description: x.description(), category: categoryByRanges(x.nameId(), node.definition(), x.range())}
        });
    }
    if (c) {

        hlnode.definition().allProperties().filter(x=>x.getAdapter(parserApi.ds.RAMLPropertyService).isMerged() || (<parserApi.ds.Property>x).isFromParentKey()).forEach(
            p=> {
                if (onlyKey){
                    if (!(<parserApi.ds.Property>p).isFromParentKey()){
                        return;
                    }
                }
                if (notAKey){
                    if ((<parserApi.ds.Property>p).isFromParentKey()){
                        return;
                    }
                }

                var prop=(<parserApi.ds.Property>p);
                var oftenKeys = (<parserApi.ds.Property>p).getOftenKeys();
                if (!oftenKeys){
                    var sug= (<parserApi.ds.Property>p).suggester();
                    if (sug){
                        oftenKeys=sug(hlnode);
                    }
                }
                if (!oftenKeys){
                    oftenKeys=p.enumOptions();
                }

                if (hlnode.property()&&
                    parserApi.universeHelpers.isBodyProperty(hlnode.property())){
                    if (!oftenKeys){
                        if (parserApi.universeHelpers.isResponseType(hlnode.property().domain())) {
                            oftenKeys = ["application/json", "application/xml"]
                        }
                        if (parserApi.universeHelpers.isMethodBaseType(hlnode.property().domain())
                            || parserApi.universeHelpers.isMethodType(hlnode.property().domain())) {
                            oftenKeys = ["application/json", "application/xml", "multipart/form-data", "application/x-www-form-urlencoded"]
                        }
                    }
                }
                if (oftenKeys) {
                    oftenKeys.forEach(y=> {
                        var original = y;
                        
                        var cs=prop.valueDocProvider();
                        var description=""
                        if (cs){
                            description=cs(y);
                        }
                        if (needColon) {
                            rs.push({
                                text: y + ":" + "\n" + getIndent(offset, text) + "  ",
                                description: description,
                                displayText: y,
                                prefix: y.indexOf("/") >= 0  ? request.valuePrefix() : null,
                                category: categoryByRanges(original, hlnode.definition(), prop.range())
                            })
                        }
                        else{
                            rs.push({
                                text: y ,
                                description: description,
                                displayText: y,
                                prefix: y.indexOf("/") >= 0  ? request.valuePrefix() : null,
                                category: categoryByRanges(original, hlnode.definition(), prop.range())
                            })
                        }
                    });
                }
            }
        )
    }
    return rs;
}

function isUnexspected(symbol: string): boolean {
    if(symbol === "'") {
        return true;
    }

    if(symbol === '"') {
        return true;
    }
    
    return false;
}

function isValueBroken(request: CompletionRequest) {
    var text = request.content.getText();
    var offset = request.content.getOffset();
    var prefix = request.prefix();

    var beginning = text.substring(0, offset);
    
    var value = beginning.substring(beginning.lastIndexOf(':') + 1).trim();
    
    if(!value.length) {
        return false;
    }
    
    if(value[value.length - 1] === ',') {
        if(value.indexOf('[') < 0) {
            return true;
        }
    }
    
    if(beginning[beginning.length - 1] === ' ') {
        if(/^\w$/.test(value[value.length - 1])) {
            return true;
        } else if(value[value.length - 1] === ',') {
            if(value.indexOf('[') < 0) {
                return true;
            }
        }
    }
    
    if(/^\w+$/.test(prefix)) {
        value = value.substring(0, value.lastIndexOf(prefix)).trim();

        if(/^\w$/.test(value[value.length - 1])) {
            return true;
        } else if(value[value.length - 1] === ',') {
            if(value.indexOf('[') < 0) {
                return true;
            }
        }
    }
    
    if(isUnexspected(value[value.length - 1])) {
        return true;
    }

    return false;
}

export function valueCompletion(node: parserApi.hl.IParseResult, attr: parserApi.hl.IAttribute, request: CompletionRequest, provider: CompletionProvider) {
    var hlnode = <parserApi.hl.IHighLevelNode>node;

    var text = request.content.getText();
    var offset = request.content.getOffset();

    if(isValueBroken(request)) {
        return [];
    }

    if(attr) {
        var p: parserApi.hl.IProperty = attr.property();

        var vl=attr.value();
        if(typeof vl ==="object"&&vl) {
            var innerNode=<parserApi.hl.IHighLevelNode>vl.toHighLevel();

            if (innerNode) {
                return getSuggestions(provider.currentRequest, provider, findASTNodeByOffset(innerNode, request));
            } else if(parserApi.search.isExampleNodeContent(attr)){
                var contentType = parserApi.search.findExampleContentType(attr)
                if (contentType) {
                    var documentationRoot : parserApi.hl.IHighLevelNode = parserApi.search.parseDocumentationContent(attr, <parserApi.hl.INodeDefinition>contentType);

                    if(documentationRoot) {
                        return getSuggestions(provider.currentRequest, provider, findASTNodeByOffset(documentationRoot, request));
                    }
                }
            }

        }
        if (p) {

            var vls = enumValues(<def.Property>p,hlnode)
            if ((<def.Property>p).isAllowNull()){
                vls.push({text:'null',description:'null means - that no value is allowed'})
            }
            if (!vls||vls.length==0){
                var oftenKeys=(<def.Property>p).getOftenKeys();
                if (oftenKeys){
                    return oftenKeys.map(x=>{
                        return {text:x,displayText:x}
                    })
                }
            }
            if (universeHelpers.isExampleProperty(p)
                && universeHelpers.isBodyLikeType(hlnode.definition())){

                if (!testVal(attr.value(),offset,text)){
                    return
                }
                var rs= pathCompletion(request, provider.contentProvider, attr,hlnode,true).map(x=>{(<any>x).extra= "!include ./examples/"; x.displayText="!include ./examples/"+x.text; return x})
                rs = addDefineInlineProposal(rs,attr.lowLevel().start(),text);
                return rs;
            }

            if (universeHelpers.isValueProperty(p)
                && universeHelpers.isGlobalSchemaType(hlnode.definition())){
                if (!testVal(attr.value(),offset,text)){
                    return
                }
                rs= pathCompletion(request, provider.contentProvider,attr,hlnode,true).map(x=>{(<any>x).extra= "!include ./schemas/"; x.displayText="!include ./schemas/"+x.text; return x})
                rs = addDefineInlineProposal(rs,attr.lowLevel().start(),text);
            }
            if (vls) {
                return vls;
            }
        }
        return []
    }
    else{
        //FIXME (To DEF)
        if (universeHelpers.isGlobalSchemaType(hlnode.definition())){

            rs= pathCompletion(request, provider.contentProvider,attr,hlnode,true).map(x=>{(<any>x).extra= "!include ./schemas/"; x.displayText="!include ./schemas/"+x.text; return x})
            rs = addDefineInlineProposal(rs,hlnode.lowLevel().start(),text);
        }
        if (universeHelpers.isTraitType(hlnode.definition())){
            rs= pathCompletion(request, provider.contentProvider,attr,hlnode,true).map(x=>{(<any>x).extra= "!include ./traits/"; x.displayText="!include ./traits/"+x.text;return x})
            rs = addDefineInlineProposal2(rs,hlnode.lowLevel().start(),text);
            return rs;
        }
        if (universeHelpers.isResourceTypeType(hlnode.definition())){
            var rs= pathCompletion(request, provider.contentProvider,attr,hlnode,true).map(x=>{(<any>x).extra= "!include ./resourceTypes/";x.displayText="!include ./resourceTypes/"+x.text;return x})
            rs = addDefineInlineProposal2(rs,hlnode.lowLevel().start(),text);
            return rs;

        }
        if (universeHelpers.isSecuritySchemaType(hlnode.definition())){
            var rs= pathCompletion(request,provider.contentProvider,attr,hlnode,true).map(x=>{(<any>x).extra= "!include ./securitySchemes/";x.displayText="!include ./securitySchemes/"+x.text;return x})
            rs = addDefineInlineProposal2(rs,hlnode.lowLevel().start(),text);
            return rs;
        }
        if (universeHelpers.isExampleSpecType(hlnode.definition())){
            return examplePropertyCompletion(hlnode, request, provider);
        }
    }
}

function findASTNodeByOffset(ast : parserApi.hl.IHighLevelNode, request: CompletionRequest) : parserApi.hl.IParseResult {
    var text = request.content.getText();
    var cm = request.content.getOffset();

    for (var pm=cm-1;pm>=0;pm--){
        var c=text[pm];
        if (c==' '||c=='\t'){
            cm=pm;
            continue;
        }
        break;
    }
    var astNode=ast.findElementAtOffset(cm);


    return astNode;
}

function enumValues(property: parserApi.ds.Property, parentNode: parserApi.hl.IHighLevelNode): Suggestion[] {
    if(parentNode) {
        if(property.getAdapter(parserApi.ds.RAMLPropertyService).isTypeExpr()) {


            var associatedType = parentNode.associatedType();

            var parentDefinition = parentNode.definition();

            var noArraysOrPrimitives: any;

            var typeProperty = parentNode.attr(parserApi.universes.Universe10.TypeDeclaration.properties.type.name);

            var typePropertyValue = typeProperty && typeProperty.value();

            var typeProperties = parentNode.children() && parentNode.children().filter(child => child.isAttr() && parserApi.universeHelpers.isTypeProperty(child.property()));

            var visibleScopes: string[] = [];

            var api: any = parentNode && parentNode.root && parentNode.root();

            api &&  api.lowLevel() &&  api.lowLevel().unit() && visibleScopes.push(api.lowLevel().unit().absolutePath());

            api && api.wrapperNode && api.wrapperNode() && api.wrapperNode().uses && api.wrapperNode().uses().forEach((usesDeclaration: any) => {
                if(usesDeclaration && usesDeclaration.value && usesDeclaration.value()) {
                    var resolvedUnit = api.lowLevel().unit().resolve(usesDeclaration.value())
                    
                    if(resolvedUnit) {
                        visibleScopes.push(resolvedUnit.absolutePath());
                    }
                }
            })

            var definitionNodes = parserApi.search.globalDeclarations(parentNode).filter(node => {
                var nodeLocation = node.lowLevel().unit().absolutePath();

                if(visibleScopes.indexOf(nodeLocation) < 0) {
                    return false;
                }

                if(parserApi.universeHelpers.isGlobalSchemaType(node.definition())) {
                    return true;
                }

                var superTypesOfProposed = node.definition().allSuperTypes();

                if(_.find(superTypesOfProposed, supertype => parserApi.universeHelpers.isTypeDeclarationType(supertype))) {
                    var isMultiValue = typePropertyValue && property && property.isMultiValue() && typeProperties && typeProperties.length > 1;

                    if(isMultiValue) {
                        if(!associatedType) {
                            try {
                                associatedType = parentNode.localType();
                            } catch (exception) {
                                console.log(exception);
                            }
                        }

                        if(associatedType && !parentDefinition.hasUnionInHierarchy()) {
                            var supertypes = associatedType.superTypes().filter(supertype => !supertype.isAssignableFrom('unknown'));

                            if(supertypes) {
                                var isExtendsObject = _.find(supertypes, supertype => isObject(supertype));
                                var isExtendsPrimitive = _.find(supertypes, supertype => isPrimitive(supertype));
                                var isExtendsArray = _.find(supertypes, supertype => isArray(supertype)) || (parentDefinition && isArray(parentDefinition));

                                var noObjects = isExtendsArray || isExtendsPrimitive;

                                noArraysOrPrimitives = isExtendsObject || noObjects;

                                if(_.find(supertypes, supertype => parserApi.search.qName(node, parentNode) === supertype.nameId())) {
                                    return false;
                                }

                                if(noArraysOrPrimitives && (isPrimitive(node.definition()) || isArray(node.definition()))) {
                                    return false;
                                }

                                if(noObjects && isObject(node.definition())) {
                                    return false;
                                }
                            }
                        }

                        if(parentDefinition.hasUnionInHierarchy()) {
                            var unionClasses = allClassesForUnion(parentDefinition);

                            if(_.find(unionClasses, unionPart => parserApi.search.qName(node, parentNode) === (<def.NodeClass>unionPart).nameId())) {
                                return false;
                            }
                        }
                    }

                    return true;
                }

                return universeHelpers.isTypeDeclarationType(node.definition()) && node.property().nameId() === 'models'
            });

            var result = definitionNodes.map(node => {
                return {
                    text: search.qName(node, parentNode),

                    description: ""
                }
            });

            var typeDeclarationType = property.domain().universe().type("TypeDeclaration");
            //var annotationTypeDeclaration = property.domain().universe().type("AnnotationTypeDeclaration");

            if(typeDeclarationType) {
                var subTypes = typeDeclarationType.allSubTypes();

                result = result.concat(subTypes.filter(subType => {
                    if(noArraysOrPrimitives && (isPrimitive(subType) || isArray(subType))) {
                        return false;
                    }



                    return true;
                }).map(subType => {
                    return {
                        text: (<def.NodeClass>subType).getAdapter(services.RAMLService).descriminatorValue(),

                        description: (<def.NodeClass>subType).description()
                    }
                }));
            }

            return result;
        }

        if(universeHelpers.isSchemaStringType(property.range())) {
            if(property.range().universe().version() === "RAML10") {
                var definitionNodes = search.globalDeclarations(parentNode).filter(node => {
                    if(universeHelpers.isGlobalSchemaType(node.definition())) {
                        return true;
                    }

                    var superTypesOfProposed = node.definition().allSuperTypes();

                    if(_.find(superTypesOfProposed, x=>universeHelpers.isTypeDeclarationType(x))) {
                        return true;
                    }

                    return universeHelpers.isTypeDeclarationType(node.definition()) && node.property().nameId() === 'models';
                });

                var result = definitionNodes.map(node => {
                    return {text: search.qName(node, parentNode), description: ""}
                });

                var subTypes = search.subTypesWithLocals(property.domain().universe().type("TypeDeclaration"), parentNode);

                result = result.concat(subTypes.map(subType => {
                    return {
                        text: (<def.NodeClass>subType).getAdapter(services.RAMLService).descriminatorValue(),

                        description: (<def.NodeClass>subType).description()
                    }
                }));

                return result;
            }
        }

        if(property.isDescriminator()) {
            var subTypes = search.subTypesWithLocals(property.domain(), parentNode);

            return subTypes.map(subType => {
                var suggestionText = (<def.NodeClass>subType).getAdapter(services.RAMLService).descriminatorValue();
                
                return {
                    text: suggestionText,

                    description: (<def.NodeClass>subType).description(),
                    
                    category: categoryByRanges(suggestionText, property.domain(), null)
                }
            });
        }

        if(property.isReference()) {
            return <any>search.nodesDeclaringType(property.referencesTo(), parentNode).map(subType => {
                    return nodeToProposalInfo(subType, parentNode);
                }
            );
        }

        if(property.range().hasValueTypeInHierarchy()) {
            var valueTypeAdapter = property.range().getAdapter(services.RAMLService);

            if(valueTypeAdapter.globallyDeclaredBy().length > 0) {
                var definitionNodes = search.globalDeclarations(parentNode).filter(proposedNode => {
                    var proposedDefinition = proposedNode.definition();

                    return _.find(valueTypeAdapter.globallyDeclaredBy(), globalDefinition => globalDefinition == proposedDefinition) != null;
                });

                return <any>definitionNodes.map(proposedNode => nodeToProposalInfo(proposedNode, parentNode));
            }

            if(universeHelpers.isBooleanTypeType(property.range())) {
                return <any>["false", "true"].map(value => {
                    return {
                        text: value
                    };
                });
            }
            
            var propertyNode = (<any>property).node && (<any>property).node();

            if(propertyNode) {
                var suggestions: any[] = _.filter(propertyNode.children(), (child: any) => {
                    return child.name && child.value && child.property() && universeHelpers.isEnumProperty(child.property());
                }).map((child: any) => ({text: (<any>child).value()}));
                
                return suggestions;
            }
        }
    }

    return <Suggestion[]>search.enumValues(property,parentNode).map(proposed => {
        return {
            text: proposed,
            category: categoryByRanges(proposed, parentNode && parentNode.definition(), null)
        }
    });
}

function isPrimitive(definition: any) {
    var isPrimitive = !definition.isArray() && !isObject(definition) && !definition.hasUnionInHierarchy() && definition.key() !== universeModule.Universe10.TypeDeclaration;

    return isPrimitive;
}

function isObject(definition: any) {
    return definition.isAssignableFrom(universeModule.Universe10.ObjectTypeDeclaration.name) || definition.isAssignableFrom('object');
}

function isArray(definition: any) {
    return definition.isAssignableFrom(universeModule.Universe10.ArrayTypeDeclaration.name);
}

function allClassesForUnion(definition: any): any[] {
    var result: any[] = [];

    if(!definition || !definition.isUnion()) {
        return definition ? [definition] : result;
    }

    if(definition.left) {
        result.push(definition.left);

        return result.concat(allClassesForUnion(definition.right));
    }
}

function addDefineInlineProposal(rs: any[], offset:number,text:string) {
    rs = [{displayText: "Define Inline", text: "|\n"+leadingIndent(offset-1,text)+"  "}].concat(rs)
    return rs;
}

function addDefineInlineProposal2(rs: any[],offset:number,text:string) {
    rs = [{displayText: "Define Inline", text: "\n"+leadingIndent(offset-1,text)+"  "}].concat(rs)
    return rs;
}

function leadingIndent(pos:number, text:string) {
    var leading = "";
    while (pos > 0) {
        var ch = text[pos];
        if (ch == '\r' || ch == '\n' || (ch != ' '&& ch!='-')) break;
        leading = leading + ' ';
        pos--;
    }
    return leading;
};

function getProposalText(proposal:
                             {
                                 text? : string
                                 snippet? : string
                                 displayText?: string
                             }
) : string {
    if (proposal.text) {
        return proposal.text;
    }

    if (proposal.snippet) {
        return proposal.snippet;
    }

    return proposal.displayText;
}

function updateProposalText(proposal:
                                {
                                    text? : string
                                    snippet? : string
                                    displayText?: string
                                }
    ,textToUpdateWith: string
) {

    if (proposal.text) {
        proposal.text = textToUpdateWith;
        return;
    }

    if (proposal.snippet) {
        proposal.snippet = textToUpdateWith;
        return;
    }

    proposal.displayText = textToUpdateWith;
}

function isSiblingExists(attr: any, siblingName: any) {
    var parent = attr.parent &&  attr.parent();

    if(!parent) {
        return false;
    }

    var propertyName = attr.name && attr.name();

    if(!propertyName) {
        return false;
    }

    var siblings = parent.attributes && parent.attributes(propertyName);

    if(!siblings) {
        return false;
    }

    if(siblings.length === 0) {
        return false;
    }

    var names: any[] = [];

    siblings.forEach((sibling: any) => {
        var name = sibling.value && sibling.value() && sibling.value().valueName && sibling.value().valueName();

        if(!name) {
            return;
        }

        names.push(name);
    });

    return _.find(names, name => siblingName === name);
}

function isSquareBracketExpected(attr: any) {
    if(!attr) {
        return false;
    }

    if(!attr.definition()) {
        return false;
    }

    if(!attr.property()) {
        return false;
    }

    if(!attr.definition().isAssignableFrom(universeModule.Universe10.TraitRef.name)) {
        return false;
    }

    return true;
}

function isInResourceDescription(obj: any): any {
    var definition = obj && obj.definition ? obj.definition() : null;

    if(definition) {
        var name = definition.nameId();

        if(name === 'Api') {
            return false;
        }

        if(name === 'ResourceType' || name === 'Trait') {
            return true;
        }

        var parent = obj.parent();

        if(!parent) {
            return false;
        }

        return isInResourceDescription(parent);
    }

    return false;
}

var transformers = parserApi.utils.getTransformerNames();

var addTransformers = function (proposals: any, prefix: any) {
    var result: any[] = [];

    transformers.filter(transformer => {
        return transformer.indexOf(prefix) === 0;
    }).forEach(transformer => {
        result.push({displayText: transformer, text: transformer});
    });

    return result.concat(proposals);
}

function testVal(vl:string,offset: number,text:string){
    if (vl&&vl.length>0) {
        var q=vl.trim()
        if (q.indexOf("{")==0){
            return false;
        }
        if (q.indexOf("<")==0){
            return false;
        }
        if (q.indexOf("[")==0){
            return false;
        }
    }
    for (var i=offset;i>=0;i--){
        var c=text[i];
        if (c==':'){
            return true;
        }
        if (c=='|'){
            return false;
        }
        if (c=="'"){
            return false;
        }
        if (c=='"'){
            return false;
        }
    }
    return true;
}

function nodeToProposalInfo(x: parserApi.hl.IHighLevelNode, c: parserApi.hl.IHighLevelNode) {
    var isResourceType = false;
    var d = x.attr("description");
    var ds = "";
    if (d) {
        ds = d.value()
    }
    else {
        d = x.attr("usage");
        if (d) {
            ds = d.value();
        }
    }
    var tr= x.localType();
    var req=tr.allProperties().filter(x=>x.isRequired()&&!x.getAdapter(services.RAMLPropertyService).isKey());
    var txt=search.qName(x, c);
    if (!universeHelpers.isAnnotationTypeType(x.definition())) {
        if (req.length > 0) {
            txt += ": {"
            txt += req.map(x=>x.nameId() + " : ").join(", ") + "}"
            var extra = ""
            if (universeHelpers.isResourceTypeType(x.definition())) {
                txt = "" + txt + " }";
                extra = " { ";

                isResourceType = true;
            }
        }
    }
    return {
        displayText:search.qName(x, c),
        snippet: txt,
        description: ds,
        extra:extra,
        isResourceType: isResourceType
    }
}

function examplePropertyCompletion(node: any, request:CompletionRequest, provider: CompletionProvider) {
    if (!search.isExampleNode(node)) {
        return [];
    }

    var contentType = search.findExampleContentType(node);
    if (!contentType) return [];

    var parsedExample = search.parseStructuredExample(node, contentType);
    if (!parsedExample) return [];
    
    var project = node && node.lowLevel() && node.lowLevel().unit() && node.lowLevel().unit().project();

    return getSuggestions(request, provider, findASTNodeByOffset(parsedExample, request), project)
}

export function postProcess(providerSuggestions: any, request: CompletionRequest) {
    var prepared: any[] = postProcess1(providerSuggestions, request);

    var added: string[] = [];

    var result: any[] = [];

    prepared.forEach(item => {
        var value = suggestionValue(item);

        if(added.indexOf(value) < 0) {
            result.push(item);

            added.push(value);
        }
    });

    return result;
}

function postProcess1(providerSuggestions: any, request: CompletionRequest) {
    var hasDeprecations: any, hasEmpty: any, suggestion: any, _i: any, _len: any;
    if (providerSuggestions == null) {
        return;
    }

    if (hasDeprecations) {
        providerSuggestions = providerSuggestions.map(function(suggestion: any) {
            var newSuggestion: any, _ref1: any, _ref2: any;
            newSuggestion = {
                text: (_ref1 = suggestion.text) != null ? _ref1 : suggestion.word,
                snippet: suggestion.snippet,
                replacementPrefix: (_ref2 = suggestion.replacementPrefix) != null ? _ref2 : suggestion.prefix,
                className: suggestion.className,
                type: suggestion.type
            };
            if ((newSuggestion.rightLabelHTML == null) && suggestion.renderLabelAsHtml) {
                newSuggestion.rightLabelHTML = suggestion.label;
            }
            if ((newSuggestion.rightLabel == null) && !suggestion.renderLabelAsHtml) {
                newSuggestion.rightLabel = suggestion.label;
            }
            return newSuggestion;
        });
    }
    hasEmpty = false;
    for (_i = 0, _len = providerSuggestions.length; _i < _len; _i++) {
        suggestion = providerSuggestions[_i];
        if (!(suggestion.snippet || suggestion.text)) {
            hasEmpty = true;
        }
        if (suggestion.replacementPrefix == null) {
            suggestion.replacementPrefix = getDefaultReplacementPrefix(request.prefix());
        }
    }
    if (hasEmpty) {
        providerSuggestions = (function() {
            var _j: any, _len1: any, _results: any;
            _results = [];
            for (_j = 0, _len1 = providerSuggestions.length; _j < _len1; _j++) {
                suggestion = providerSuggestions[_j];
                if (suggestion.snippet || suggestion.text) {
                    _results.push(suggestion);
                }
            }
            return _results;
        })();
    }

    providerSuggestions = filterSuggestions(providerSuggestions, request);

    return providerSuggestions;
}

var fuzzaldrinProvider = require('fuzzaldrin-plus');

function filterSuggestions(suggestions: any[], _arg: any) {
    var firstCharIsMatch: any, i: any, prefix: any, prefixIsEmpty: any, results: any, score: any, suggestion: any, suggestionPrefix: any, text: any, _i: any, _len: any, _ref1: any;

    prefix = _arg.prefix();

    results = [];

    for (i = _i = 0, _len = suggestions.length; _i < _len; i = ++_i) {
        suggestion = suggestions[i];
        suggestion.sortScore = Math.max(-i / 10 + 3, 0) + 1;
        suggestion.score = null;
        text = suggestion.snippet || suggestion.text;
        suggestionPrefix = (_ref1 = suggestion.replacementPrefix) != null ? _ref1 : prefix;
        prefixIsEmpty = !suggestionPrefix || suggestionPrefix === ' ';
        firstCharIsMatch = !prefixIsEmpty && suggestionPrefix[0].toLowerCase() === text[0].toLowerCase();
        if (prefixIsEmpty) {
            results.push(suggestion);
        }
        if (firstCharIsMatch && (score = fuzzaldrinProvider.score(text, suggestionPrefix)) > 0) {
            suggestion.score = score * suggestion.sortScore;
            results.push(suggestion);
        }
    }
    results.sort(reverseSortOnScoreComparator);
    return results;
}

var wordPrefixRegex = /^\w+[\w-]*$/;

function reverseSortOnScoreComparator(a: any, b: any) {
    var _ref1: any, _ref2: any;
    return ((_ref1 = b.score) != null ? _ref1 : b.sortScore) - ((_ref2 = a.score) != null ? _ref2 : a.sortScore);
};

function getDefaultReplacementPrefix(prefix: any) {
    if (wordPrefixRegex.test(prefix)) {
        return prefix;
    } else {
        return '';
    }
};

function suggestionValue(suggestion: any): string {
    return (suggestion && (suggestion.displayText || suggestion.text)) || null;
}

var prefixRegex = /(\b|['"~`!@#\$%^&*\(\)\{\}\[\]=\+,\/\?>])((\w+[\w-]*)|([.:;[{(< ]+))$/;

export function getPrefix(request: CompletionRequest): string {
    var line: string, _ref1: any;

    line = getLine(request);

    return ((_ref1 = prefixRegex.exec(line)) != null ? _ref1[2] : void 0) || '';
}

function getLine(request: CompletionRequest): string {
    var offset: number = request.content.getOffset();

    var text: string = request.content.getText();

    for(var i = offset - 1; i >= 0; i--) {
        var c = text.charAt(i);

        if(c === '\r' || c === '\n' || c=== ' ' || c=== '\t') {
            return text.substring(i+1,offset);
        }

    }

    return "";
}

class ResolvedProvider implements IFSProvider {
    fsResolver: FSResolverExt;
    
    constructor(private resolver: FSResolverExt) {
        this.fsResolver = resolver;
    }

    contentDirName(content: IEditorStateProvider): string {
        return this.resolver.dirname(content.getPath());
    }

    dirName(path: string): string {
        return this.resolver.dirname(path);
    }

    exists(path: string): boolean {
        return this.resolver.exists(path);
    }

    resolve(contextPath: string, relativePath: string): string {
        return this.resolver.resolve(contextPath, relativePath);
    }

    isDirectory(path: string): boolean {
        return this.resolver.isDirectory(path);
    }

    isDirectoryAsync(path: string): Promise<boolean> {
        return this.resolver.isDirectoryAsync(path);
    }

    readDir(path: string): string[] {
        return this.resolver.list(path);
    }

    existsAsync(path: string): Promise<boolean> {
        return this.resolver.existsAsync(path);
    }

    readDirAsync(path: string): Promise<string[]> {
        return this.resolver.listAsync(path);
    }
}

export function getContentProvider(resolver: FSResolverExt): IFSProvider {
    return new ResolvedProvider(resolver);
}