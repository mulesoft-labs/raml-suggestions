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

function offsetForEntry(entry: string, text: string): number {
    return text.indexOf(entry) + entry.length;
}

function resolve(testPath: string): string {
    return path.resolve(__dirname, '../../tests/' + testPath);
}

export function completionByOffset(filePath: string, offset: number): string {
    var completionProvider: CompletionProvider = new CompletionProvider(new ContentProvider());

    var content: completion.IContent = new FSContent(resolve(filePath));
    var position: completion.IPosition = new Position(offset);

    var result = completionProvider.suggest(new completion.CompletionRequest(content, position), true);

    return result.map((suggestion: any) => suggestion.displayText || suggestion.text).join(', ');
}

export function completionByUniqueEntry(filePath: string, entry: string, begin: boolean = false): string {
    var completionProvider: CompletionProvider = new CompletionProvider(new ContentProvider());

    var content: completion.IContent = new FSContent(resolve(filePath));

    var position: completion.IPosition = new Position(begin ? (content.getText().indexOf(entry)) : offsetForEntry(entry, content.getText()));

    var result = completionProvider.suggest(new completion.CompletionRequest(content, position), true);

    return result.map((suggestion: any) => suggestion.displayText || suggestion.text).join(', ');
}