export import parser=require("raml-1-parser");
import hl=parser.hl;

/**
 * Editor state provider.
 */
export interface IEditorStateProvider {

    /**
     * Text of the document opened in the editor.
     */
    getText(): string;

    /**
     * Full path to the document opened in the editor.
     */
    getPath(): string;

    /**
     * File name of the document opened in the editor.
     */
    getBaseName(): string;

    /**
     * Editor cursor offset.
     */
    getOffset(): number;
}

/**
 * Provides current AST state.
 * If set via setASTProvider method, will be used instead of a new AST calculation
 * by parsing the text provided by IEditorProvider.
 */
export interface IASTProvider {

    /**
     * Gets current AST root.
     */
    getASTRoot() : hl.IHighLevelNode;

    /**
     * Gets current AST node
     */
    getSelectedNode() : hl.IParseResult;
}

/**
 * Provides virtual file system data
 */
export interface IFSProvider {

    /**
     * Directory name of the file, opened in the specific editor.
     * @param content
     */
    contentDirName(content: IEditorStateProvider): string;

    /**
     * Directory name by full path
     * @param fullPath - full file path.
     */
    dirName(fullPath: string): string;

    /**
     * Checks whether an item exists by full path.
     * @param fullPath
     */
    exists(fullPath: string): boolean;

    /**
     * Checks whether an item exists by full path.
     * @param path
     */
    existsAsync(path: string): Promise<boolean>;

    /**
     * Resolves one path against another.
     * @param contextPath - path to resolve against.
     * @param relativePath - relative path to resolve.
     */
    resolve(contextPath: string, relativePath: string): string;

    /**
     * Check whether the path points to a directory.
     * @param fullPath
     */
    isDirectory(fullPath: string): boolean;

    /**
     * Returns directory content list.
     * @param fullPath
     */
    readDir(fullPath: string): string[];

    /**
     * Returns directory content list.
     * @param fullPath
     */
    readDirAsync(path: string): Promise<string[]>;

    /**
     * Check whether the path points to a directory.
     * @param fullPath
     */
    isDirectoryAsync(path: string): Promise<boolean>;
}

/**
 * Completion suggestion.
 *
 * Suggestion may have all of text, description and displayText filled,
 * but may have only some of them.
 * Priority of the field to use for display: displayText, text.
 * Priority of the field to use for text replacement: text, displayText.
 */
export interface Suggestion {
    /**
     * Full text to insert, including the index.
     */
    text?: string;

    /**
     * Description of the suggestion.
     */
    description?: string;

    /**
     * Text to display.
     */
    displayText?: string;

    /**
     * Detected suggestion prefix.
     */
    prefix?: string

    /**
     * Suggestion category.
     */
    category?: string
}

/**
 * Direct analogue of JS parser FSResolver, introduced for compatibility.
 */
export interface FSResolver {

    /**
     * File contents by full path, synchronously.
     * @param fullPath
     */
    content(fullPath:string): string;

    /**
     * File contents by full path, asynchronously.
     * @param fullPath
     */
    contentAsync(fullPath:string):Promise<string>;

}

/**
 * Extended JS parser FSResolver, being able to provide more FS data.
 */
export interface FSResolverExt extends FSResolver {

    /**
     * Lists directory contents.
     * @param fullPath
     */
    list(fullPath: string): string[];

    /**
     * Checks item existance.
     * @param fullPath
     */
    exists(fullPath: string): boolean;

    /**
     * Gets directory name by full path.
     * @param fullPath
     */
    dirname(fullPath: string): string;

    /**
     * Resolves one path against another.
     * @param contextPath - path to resolve against.
     * @param relativePath - relative path to resolve.
     */
    resolve(contextPath: string, relativePath: string): string;

    /**
     * Returns file extension name.
     * @param fullPath
     */
    extname(fullPath: string): string;

    /**
     * Check whether the path points to a directory.
     * @param fullPath
     */
    isDirectory(fullPath: string): boolean;

    /**
     * Check whether the path points to a directory.
     * @param fullPath
     */
    isDirectoryAsync(path: string): Promise<boolean>;

    /**
     * Checks item existance.
     * @param fullPath
     */
    existsAsync(path: string): Promise<boolean>;

    /**
     * Lists directory contents.
     * @param fullPath
     */
    listAsync(path: string): Promise<string[]>;
}