import completionProvider = require('./completionProvider');

export interface ICompletionContentProvider {
    contentDirName(content: IContent): string;

    dirName(string: string): string;

    exists(path: string): boolean;

    resolve(contextPath: string, relativePath: string): string;

    isDirectory(path: string): boolean;

    readDir(path: string): string[];
}

export interface Suggestion {
    text?: string;
    description?: string;
    displayText?: string;
    prefix?: string
}

export interface IContent {
    getText(): string;

    getPath(): string;

    getBaseName(): string;
}

export interface IPosition {
    getOffset(): number;
}

export class CompletionRequest {
    content: IContent;

    position: IPosition;

    private prefixValue: string;

    constructor(content: IContent, position: IPosition) {
        this.content = content;
        this.position = position;
    }

    prefix(): string {
        if(typeof this.prefixValue !== 'undefined') {
            return this.prefixValue;
        }

        return completionProvider.getPrefix(this);
    }

    setPrefix(value: string): void {
        this.prefixValue = value;
    }

    valuePrefix(): string {
        var offset = this.position.getOffset();

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
    contentProvider: ICompletionContentProvider

    currentRequest : CompletionRequest = null;

    level: number = 0;

    constructor(contentProvider: ICompletionContentProvider) {
        this.contentProvider = contentProvider;
    }

    suggest(request: CompletionRequest, doPostProcess: boolean = false) {
        var suggestions: any[] = completionProvider.suggest(request, this);

        return doPostProcess ? completionProvider.postProcess(suggestions, request) : suggestions;
    }
}

export interface FSResolver {
    content(path:string): string;
    
    list(path: string): string[];

    exists(path: string): boolean;

    contentAsync(path:string):Promise<string>;
    
    dirname(path: string): string;

    resolve(contextPath: string, relativePath: string): string;
    
    extname(path: string): string;
    
    isDirectory(path: string): boolean;
}

export function getContentProvider(resolver: FSResolver): ICompletionContentProvider {
    return completionProvider.getContentProvider(resolver);
}