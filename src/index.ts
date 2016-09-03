import completionProvider = require('./completionProvider');
import completionProviderInterfaces = require('./completionProviderInterfaces');

/**
 * Editor state provider.
 */
export type IEditorStateProvider = completionProviderInterfaces.IEditorStateProvider;

/**
 * Provides virtual file system data
 */
export type IFSProvider = completionProviderInterfaces.IFSProvider;

/**
 * Completion suggestion.
 *
 * Suggestion may have all of text, description and displayText filled,
 * but may have only some of them.
 * Priority of the field to use for display: displayText, text.
 * Priority of the field to use for text replacement: text, displayText.
 */
export type Suggestion = completionProviderInterfaces.Suggestion;

/**
 * Direct analogue of JS parser FSResolver, introduced for compatibility.
 */
export type FSResolver = completionProviderInterfaces.FSResolver;

/**
 * Extended JS parser FSResolver, being able to provide more FS data.
 */
export type FSResolverExt = completionProviderInterfaces.FSResolverExt;

var _editorStateProvider: IEditorStateProvider = null;

/**
 * Sets default editor state provider
 * @param editorStateProvider
 */
export function setDefaultEditorStateProvider(editorStateProvider: IEditorStateProvider) : void {
    _editorStateProvider = editorStateProvider;
}

var _fsProvider: IFSProvider = null;

/**
 * Sets default FS provider.
 * @param fsProvider
 */
export function setDefaultFSProvider(fsProvider: IFSProvider) : void {
    _fsProvider = fsProvider;
}

/**
 * Finds suggestions. Requires setDefaultEditorStateProvider and setDefaultFSProvider methods to be called first.
 * @returns {Suggestion[]} - list of suggestions
 */
export function suggestDefault() : Suggestion[] {
    return completionProvider.suggest(_editorStateProvider, _fsProvider);
}

/**
 * Finds suggestions.
 * @param editorState - editor state.
 * @param fsProvider - file system data provider.
 * @returns {Suggestion[]} - list of suggestions
 */
export function suggest(editorStateProvider: IEditorStateProvider, fsProvider: IFSProvider) : Suggestion[] {
    return completionProvider.suggest(editorStateProvider, fsProvider);
}

/**
 * Converts extended fs resolver to FS provider.
 * @param resolver
 * @returns {IFSProvider}
 */
export function getContentProvider(resolver: FSResolverExt): IFSProvider {
    return completionProvider.getContentProvider(resolver);
}


export interface ICompletionContentProvider {
    contentDirName(content: IContent): string;

    dirName(string: string): string;

    exists(path: string): boolean;

    existsAsync(path: string): Promise<boolean>;

    resolve(contextPath: string, relativePath: string): string;

    isDirectory(path: string): boolean;

    readDir(path: string): string[];

    readDirAsync(path: string): Promise<string[]>;

    isDirectoryAsync(path: string): Promise<boolean>;
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

    async: boolean = false;

    promises: Promise<any[]>[];

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

    suggest(request: CompletionRequest, doPostProcess: boolean = false): any[] {
        var suggestions: any[] = completionProvider.suggest(request, this);

        return doPostProcess ? completionProvider.postProcess(suggestions, request) : suggestions;
    }

    suggestAsync(request: CompletionRequest, doPostProcess: boolean = false): Promise<any[]> {
        return completionProvider.suggestAsync(request, this).then(suggestions => doPostProcess ? completionProvider.postProcess(suggestions, request) : suggestions, error => error);
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

    isDirectoryAsync(path: string): Promise<boolean>;

    existsAsync(path: string): Promise<boolean>;

    listAsync(path: string): Promise<string[]>;
}

export function getContentProvider(resolver: FSResolver): ICompletionContentProvider {
    return completionProvider.getContentProvider(resolver);
}