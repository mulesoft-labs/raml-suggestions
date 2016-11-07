import completionProvider = require('./completionProvider');
import completionProviderInterfaces = require('./completionProviderInterfaces');

/**
 * Editor state provider.
 */
export type IEditorStateProvider = completionProviderInterfaces.IEditorStateProvider;

/**
 * AST provider.
 */
export type IASTProvider = completionProviderInterfaces.IASTProvider;

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

var _astProvider: IASTProvider = null;

/**
 * Sets default editor state provider
 * @param editorStateProvider
 */
export function setDefaultEditorStateProvider(editorStateProvider: IEditorStateProvider) : void {
    _editorStateProvider = editorStateProvider;
}

/**
 * Sets default AST provider
 * @param astProvider
 */
export function setDefaultASTProvider(astProvider: IASTProvider) : void {
    _astProvider = astProvider;
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
 * Finds suggestions.
 * @param editorState - editor state.
 * @param fsProvider - file system data provider.
 * @returns {Promise<Suggestion[]>}
 */
export function suggestAsync(editorState: IEditorStateProvider, fsProvider: IFSProvider) : Promise<Suggestion[]> {
    return completionProvider.suggestAsync(editorState, fsProvider);
}

/**
 * Converts extended fs resolver to FS provider.
 * @param resolver
 * @returns {IFSProvider}
 */
export function getContentProvider(resolver: FSResolverExt): IFSProvider {
    return completionProvider.getContentProvider(resolver);
}
