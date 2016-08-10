import completionProvider = require('./completionProvider');
import completionProviderInterfaces = require('./completionProviderInterfaces');

/**
 * Editor state.
 */
export type IEditorState = completionProviderInterfaces.IEditorState;

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

/**
 * Finds suggestions.
 * @param editorState - editor state.
 * @param fsProvider - file system data provier.
 * @returns {Suggestion[]} - list of suggestions
 */
export function suggest(editorState: IEditorState, fsProvider: IFSProvider) : Suggestion[] {
    return completionProvider.suggest(editorState, fsProvider);
}

/**
 * Converts extended fs resolver to FS provider.
 * @param resolver
 * @returns {IFSProvider}
 */
export function getContentProvider(resolver: FSResolverExt): IFSProvider {
    return completionProvider.getContentProvider(resolver);
}