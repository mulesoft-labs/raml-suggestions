/// <reference path="../../typings/main.d.ts" />

import completion = require('../index');

import path = require('path');
import fs = require('fs');

class SyncContentProvider implements completion.IFSProvider {
    contentDirName(content: completion.IEditorStateProvider): string {
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
    
    existsAsync(path: string): Promise<boolean> {
        return Promise.reject("method disabled");
    }
    
    readDirAsync(path: string): Promise<string[]> {
        return Promise.reject("method disabled");
    }
    
    isDirectoryAsync(path: string): Promise<boolean> {
        return Promise.reject("method disabled");
    }
}

class FSContent implements completion.IEditorStateProvider {
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

    var content: completion.IEditorStateProvider = new FSContent(resolve(filePath), offset);

    var result = completion.suggest(content, new SyncContentProvider());

    return result.map((suggestion: any) => suggestion.displayText || suggestion.text).join(', ');
}

export function completionByOffsetAsync(filePath: string, offset: number, callback: (result: string) => void): void {
    var content: completion.IEditorStateProvider = new FSContent(resolve(filePath), offset);

    var result = completion.suggestAsync(content, new SyncContentProvider());

    result.then(result => {
        callback(result.map((suggestion: any) => suggestion.displayText || suggestion.text).join(', '));
    })
}

export function completionByUniqueEntry(filePath: string, entry: string, begin: boolean = false): string {


    var content = new FSContent(resolve(filePath), 0);
    var position = begin ? (content.getText().indexOf(entry)) : offsetForEntry(entry, content.getText());
    content.offset = position;

    var result = completion.suggest(content, new SyncContentProvider());

    return result.map((suggestion: any) => suggestion.displayText || suggestion.text).join(', ');
}

export function completionByUniqueEntryAsync(filePath: string, entry: string, begin: boolean = false, callback: (result: string) => void): void {
    var content = new FSContent(resolve(filePath), 0);
    var position = begin ? (content.getText().indexOf(entry)) : offsetForEntry(entry, content.getText());
    content.offset = position;

    var result = completion.suggestAsync(content, completion.getContentProvider(new AsyncFSResolver()));
    result.then(result => {
        callback(result.map((suggestion: any) => suggestion.displayText || suggestion.text).join(', '));
    })
}

class AsyncFSResolver {
    content(path:string): string{
        return null;
    }

    list(path: string): string[] {
        return null;
    };

    exists(path: string): boolean {
        return false;
    }

    contentAsync(path:string):Promise<string> {
        return new Promise((resolve: any, reject: any) => {
            fs.readFile(path, (err: any, content: any) => {
                if(err) {
                    reject(err);

                    return;
                }

                resolve(content.toString());
            })
        });
    }

    dirname(filePath: string): string {
        return path.dirname(filePath);
    }

    resolve(contextPath: string, relativePath: string): string {
        return path.resolve(contextPath, relativePath);
    }

    extname(filePath: string): string {
        return path.extname(filePath);
    }

    isDirectory(filePath: string): boolean {
        return fs.statSync(filePath).isDirectory();
    }

    existsAsync(path: string): Promise<boolean> {
        return new Promise(resolve => {
            fs.exists(path, (result) => {
                resolve(result);
            })
        });
    }

    listAsync(path: string): Promise<string[]> {
        return new Promise(resolve => {
            fs.readdir(path, (err, result) => {
                resolve(result);
            })
        });
    }

    isDirectoryAsync(path: string): Promise<boolean> {
        return new Promise(resolve => {
            fs.stat(path, (err, stats) => {
                resolve(stats.isDirectory());
            })
        });
    }
}