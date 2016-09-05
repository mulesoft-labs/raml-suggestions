# RAML Suggestions <sup>(beta)</sup>

[![Build Status](https://travis-ci.org/raml-org/raml-suggestions.svg?branch=master)](https://travis-ci.org/raml-org/raml-suggestions)

This module provides auto-completion suggestions for RAML.
See http://raml.org for more information about RAML.

## Usage

Implement `IEditorStateProvider` interface to create editor state provider

* `getText` method should return text of the document opened in the editor
* `getPath` method should return full path to the document opened in the editor
* `getBaseName` method should return file name of the document opened in the editor
* `getOffset` method should return editor cursor offset 

Implement `IFSProvider` interface to create File System data provider.

* `contentDirName` method should return directory name of the file, opened in the specific editor
* `dirName` method should directory name by full path
* `exists` method should check whether an item exists by full path 
* `resolve` method should resolves one path against another 
* `isDirectory` method should check whether the path points to a directory 
* `readDir` method should return return directory content list

Set default `IEditorStateProvider` and `IFSProvider` using `setDefaultEditorStateProvider` and `setDefaultFSProvider` methods.

Call `suggestDefault` method to get default suggestions list using default providers or call `suggest` method taking `IEditorStateProvider` and `IFSProvider` as arguments.

Suggestions are categorized (optional field "category" in suggestion) as described in "resources/categories.json" file.
