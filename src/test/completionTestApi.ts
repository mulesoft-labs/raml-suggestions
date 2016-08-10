/// <reference path="../../typings/main.d.ts" />

import completion = require('../index');

import path = require('path');
import fs = require('fs');

class ContentProvider implements completion.IFSProvider {
    contentDirName(content: completion.IEditorState): string {
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

class FSContent implements completion.IEditorState {
    text: string;
        
    constructor(private filePath: string, public offset: number) {
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

    var content: completion.IEditorState = new FSContent(resolve(filePath), offset);

    var result = completion.suggest(content, new ContentProvider());

    return result.map((suggestion: any) => suggestion.displayText || suggestion.text).join(', ');
}

export function completionByUniqueEntry(filePath: string, entry: string, begin: boolean = false): string {


    var content = new FSContent(resolve(filePath), 0);
    var position = begin ? (content.getText().indexOf(entry)) : offsetForEntry(entry, content.getText());
    content.offset = position;

    var result = completion.suggest(content, new ContentProvider());

    return result.map((suggestion: any) => suggestion.displayText || suggestion.text).join(', ');
}