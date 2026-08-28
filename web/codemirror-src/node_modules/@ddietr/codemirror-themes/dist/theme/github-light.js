import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

const config = {
    name: 'githubLight',
    dark: false,
    background: '#fff',
    foreground: '#444d56',
    selection: '#0366d625',
    cursor: '#044289',
    dropdownBackground: '#fff',
    dropdownBorder: '#e1e4e8',
    activeLine: '#c6c6c622',
    lineNumber: '#1b1f234d',
    lineNumberActive: '#24292e',
    matchingBracket: '#34d05840',
    keyword: '#d73a49',
    storage: '#d73a49',
    variable: '#e36209',
    parameter: '#24292e',
    function: '#005cc5',
    string: '#032f62',
    constant: '#005cc5',
    type: '#005cc5',
    class: '#6f42c1',
    number: '#005cc5',
    comment: '#6a737d',
    heading: '#005cc5',
    invalid: '#cb2431',
    regexp: '#032f62',
};
const githubLightTheme = EditorView.theme({
    '&': {
        color: config.foreground,
        backgroundColor: config.background,
    },
    '.cm-content': { caretColor: config.cursor },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: config.cursor },
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': { backgroundColor: config.selection },
    '.cm-panels': { backgroundColor: config.dropdownBackground, color: config.foreground },
    '.cm-panels.cm-panels-top': { borderBottom: '2px solid black' },
    '.cm-panels.cm-panels-bottom': { borderTop: '2px solid black' },
    '.cm-searchMatch': {
        backgroundColor: config.dropdownBackground,
        outline: `1px solid ${config.dropdownBorder}`
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
        backgroundColor: config.selection
    },
    '.cm-activeLine': { backgroundColor: config.activeLine },
    '.cm-selectionMatch': { backgroundColor: config.selection },
    '&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket': {
        backgroundColor: config.matchingBracket,
        outline: 'none'
    },
    '.cm-gutters': {
        backgroundColor: config.background,
        color: config.foreground,
        border: 'none'
    },
    '.cm-activeLineGutter': { backgroundColor: config.background },
    '.cm-lineNumbers .cm-gutterElement': { color: config.lineNumber },
    '.cm-lineNumbers .cm-activeLineGutter': { color: config.lineNumberActive },
    '.cm-foldPlaceholder': {
        backgroundColor: 'transparent',
        border: 'none',
        color: config.foreground
    },
    '.cm-tooltip': {
        border: `1px solid ${config.dropdownBorder}`,
        backgroundColor: config.dropdownBackground,
        color: config.foreground,
    },
    '.cm-tooltip .cm-tooltip-arrow:before': {
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent'
    },
    '.cm-tooltip .cm-tooltip-arrow:after': {
        borderTopColor: config.foreground,
        borderBottomColor: config.foreground,
    },
    '.cm-tooltip-autocomplete': {
        '& > ul > li[aria-selected]': {
            background: config.selection,
            color: config.foreground,
        }
    }
}, { dark: config.dark });
const githubLightHighlightStyle = HighlightStyle.define([
    { tag: tags.keyword, color: config.keyword },
    { tag: [tags.name, tags.deleted, tags.character, tags.macroName], color: config.variable },
    { tag: [tags.propertyName], color: config.function },
    { tag: [tags.processingInstruction, tags.string, tags.inserted, tags.special(tags.string)], color: config.string },
    { tag: [tags.function(tags.variableName), tags.labelName], color: config.function },
    { tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)], color: config.constant },
    { tag: [tags.definition(tags.name), tags.separator], color: config.variable },
    { tag: [tags.className], color: config.class },
    { tag: [tags.number, tags.changed, tags.annotation, tags.modifier, tags.self, tags.namespace], color: config.number },
    { tag: [tags.typeName], color: config.type, fontStyle: config.type },
    { tag: [tags.operator, tags.operatorKeyword], color: config.keyword },
    { tag: [tags.url, tags.escape, tags.regexp, tags.link], color: config.regexp },
    { tag: [tags.meta, tags.comment], color: config.comment },
    { tag: tags.strong, fontWeight: 'bold' },
    { tag: tags.emphasis, fontStyle: 'italic' },
    { tag: tags.link, textDecoration: 'underline' },
    { tag: tags.heading, fontWeight: 'bold', color: config.heading },
    { tag: [tags.atom, tags.bool, tags.special(tags.variableName)], color: config.variable },
    { tag: tags.invalid, color: config.invalid },
    { tag: tags.strikethrough, textDecoration: 'line-through' },
]);
const githubLight = [
    githubLightTheme,
    syntaxHighlighting(githubLightHighlightStyle),
];

export { config, githubLight, githubLightHighlightStyle, githubLightTheme };
