/// <reference path="../../typings/main.d.ts" />

import completion = require('../index');

import path = require('path');
import fs = require('fs');
import {CompletionProvider} from "../index";

class ContentProvider implements completion.ICompletionContentProvider {
    contentDirName(content: completion.IContent): string {
        var contentPath = content.getPath();
        
        return path.dirname(contentPath);
    }
    
    dirName(childPath: string): string {
        return path.dirname(childPath);
    }

    exists(checkPath: string): boolean {
        return fs.existsSync(checkPath);
    }

    resolve(contextPath: string, relativePath: string): string {
        return path.resolve(contextPath, relativePath);
    }

    isDirectory(dirPath: string): boolean {
        var stat = fs.statSync(dirPath);
        
        return stat && stat.isDirectory();
    }

    readDir(dirPath: string): string[] {
        return fs.readdirSync(dirPath);
    }
}

class FSContent implements completion.IContent {
    text: string;
        
    constructor(private filePath: string) {
        this.text = fs.readFileSync(filePath).toString();
    }
    
    getText(): string {
        return this.text;
    }

    getPath(): string {
        return this.filePath;
    }

    getBaseName(): string {
        return path.basename(this.filePath);
    }
}

class Position implements completion.IPosition {
    constructor(private offset: number) {
        
    }
    
    getOffset(): number {
        return this.offset;
    }
}

export function testCompletion(filePath: string, offset: number, expected: string[]) {
    var completionProvider: CompletionProvider = new CompletionProvider(new ContentProvider());

    var content: completion.IContent = new FSContent(filePath);
    var position: completion.IPosition = new Position(offset);

    var result = completionProvider.suggest(new completion.CompletionRequest(content, position), true);

    console.log(JSON.stringify(result, null, '\t'));
}

testCompletion('/Users/dreamflyer/newRamlProject/api.raml', 1018, []);