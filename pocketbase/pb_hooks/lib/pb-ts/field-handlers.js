"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectionIdSchema = collectionIdSchema;
exports.collectionNameSchema = collectionNameSchema;
exports.textFieldSchema = textFieldSchema;
exports.passwordFieldSchema = passwordFieldSchema;
exports.editorFieldSchema = editorFieldSchema;
exports.numberFieldSchema = numberFieldSchema;
exports.boolFieldSchema = boolFieldSchema;
exports.emailFieldSchema = emailFieldSchema;
exports.urlFieldSchema = urlFieldSchema;
exports.dateFieldSchema = dateFieldSchema;
exports.autodateFieldSchema = autodateFieldSchema;
exports.selectFieldSchema = selectFieldSchema;
exports.fileFieldSchema = fileFieldSchema;
exports.relationFieldSchema = relationFieldSchema;
exports.jsonFieldSchema = jsonFieldSchema;
exports.geoPointSchema = geoPointSchema;
const utils_1 = require("../utils");
const config_json_1 = __importDefault(require("../../config.json"));
function collectionIdSchema(collectionId) {
    const typeDef = `collectionId: '${collectionId}'\n`;
    if (!config_json_1.default.tsSchema.includeDocs)
        return typeDef;
    const rows = [
        ['type', 'text'],
        ['min', `1`],
        ['min', `100`],
    ];
    const docs = (0, utils_1.generateMDTable)(rows);
    return `${docs}\n${typeDef}`;
}
function collectionNameSchema(collectionName) {
    const typeDef = `collectionName: '${collectionName}' | (string & {})\n`;
    if (!config_json_1.default.tsSchema.includeDocs)
        return typeDef;
    const rows = [
        ['type', 'text'],
        ['min', `1`],
        ['min', `255`],
        ['current value', `${collectionName}`],
    ];
    const docs = (0, utils_1.generateMDTable)(rows);
    return `${docs}\n${typeDef}`;
}
function textFieldSchema({ name, hidden, min, max, pattern, autogeneratePattern, required, }) {
    const typeDef = `${name}: string`;
    if (!config_json_1.default.tsSchema.includeDocs)
        return [typeDef, ''];
    const rows = [
        ['type', 'text'],
        ['hidden', `${hidden}`],
        ['required', `${required}`],
    ];
    if (min > 0)
        rows.push(['min', `${min}`]);
    rows.push(['max', `${max || 5000}`]);
    if (pattern)
        rows.push(['pattern', pattern]);
    if (autogeneratePattern)
        rows.push(['autogeneratePattern', autogeneratePattern]);
    const docs = (0, utils_1.generateMDTable)(rows);
    return [typeDef, docs];
}
function passwordFieldSchema({ name, hidden, min, max, pattern, required, }) {
    const typeDef = `${name}: string`;
    if (!config_json_1.default.tsSchema.includeDocs)
        return [typeDef, ''];
    const rows = [
        ['type', 'password'],
        ['hidden', `${hidden}`],
        ['required', `${required}`],
    ];
    if (min > 0)
        rows.push(['min', `${min}`]);
    rows.push(['max', `${max || 71}`]);
    if (pattern)
        rows.push(['pattern', pattern]);
    const docs = (0, utils_1.generateMDTable)(rows);
    return [typeDef, docs];
}
function editorFieldSchema({ name, hidden, maxSize, convertURLs, required, }) {
    const typeDef = `${name}: string`;
    if (!config_json_1.default.tsSchema.includeDocs)
        return [typeDef, ''];
    const rows = [
        ['type', 'editor'],
        ['hidden', `${hidden}`],
        ['required', `${required}`],
        ['convertURLs', `${convertURLs}`],
    ];
    if (maxSize > 0)
        rows.push(['maxSize', `${maxSize}`]);
    const docs = (0, utils_1.generateMDTable)(rows);
    return [typeDef, docs];
}
function numberFieldSchema({ name, hidden, min, max, onlyInt, required, }) {
    const typeDef = `${name}: number`;
    if (!config_json_1.default.tsSchema.includeDocs)
        return [typeDef, ''];
    const rows = [
        ['type', 'number'],
        ['hidden', `${hidden}`],
        ['required', `${required}`],
        ['onlyInt', `${onlyInt}`],
    ];
    if (min !== null)
        rows.push(['min', `${min}`]);
    if (max !== null)
        rows.push(['max', `${max}`]);
    const docs = (0, utils_1.generateMDTable)(rows);
    return [typeDef, docs];
}
function boolFieldSchema({ name, hidden, required }) {
    const typeDef = `${name}: ${required ? 'true' : 'boolean'}`;
    if (!config_json_1.default.tsSchema.includeDocs)
        return [typeDef, ''];
    const docs = (0, utils_1.generateMDTable)([
        ['type', 'bool'],
        ['hidden', `${hidden}`],
    ]);
    return [typeDef, docs];
}
function emailFieldSchema({ name, hidden, exceptDomains, onlyDomains, required, }) {
    const typeDef = `${name}: string`;
    if (!config_json_1.default.tsSchema.includeDocs)
        return [typeDef, ''];
    const rows = [
        ['type', 'email'],
        ['hidden', `${hidden}`],
        ['required', `${required}`],
    ];
    if ((exceptDomains === null || exceptDomains === void 0 ? void 0 : exceptDomains.length) > 0)
        rows.push(['exceptDomains', exceptDomains.join('`, `')]);
    if ((onlyDomains === null || onlyDomains === void 0 ? void 0 : onlyDomains.length) > 0)
        rows.push(['onlyDomains', onlyDomains.join('`, `')]);
    const docs = (0, utils_1.generateMDTable)(rows);
    return [typeDef, docs];
}
function urlFieldSchema({ name, hidden, exceptDomains, onlyDomains, required, }) {
    const typeDef = `${name}: string`;
    if (!config_json_1.default.tsSchema.includeDocs)
        return [typeDef, ''];
    const rows = [
        ['type', 'email'],
        ['hidden', `${hidden}`],
        ['required', `${required}`],
    ];
    if ((exceptDomains === null || exceptDomains === void 0 ? void 0 : exceptDomains.length) > 0)
        rows.push(['exceptDomains', exceptDomains.join('`, `')]);
    if ((onlyDomains === null || onlyDomains === void 0 ? void 0 : onlyDomains.length) > 0)
        rows.push(['onlyDomains', onlyDomains.join('`, `')]);
    const docs = (0, utils_1.generateMDTable)(rows);
    return [typeDef, docs];
}
function dateFieldSchema({ name, hidden, min, max, required }) {
    const typeDef = `${name}: string`;
    if (!config_json_1.default.tsSchema.includeDocs)
        return [typeDef, ''];
    const minDateStr = min.toString();
    const maxDateStr = max.toString();
    const rows = [
        ['type', 'date'],
        ['hidden', `${hidden}`],
        ['required', `${required}`],
    ];
    if (minDateStr)
        rows.push(['min', minDateStr]);
    if (maxDateStr)
        rows.push(['max', maxDateStr]);
    const docs = (0, utils_1.generateMDTable)(rows);
    return [typeDef, docs];
}
function autodateFieldSchema({ name, hidden, onCreate, onUpdate, }) {
    const typeDef = `${name}: string`;
    if (!config_json_1.default.tsSchema.includeDocs)
        return [typeDef, ''];
    const docs = (0, utils_1.generateMDTable)([
        ['type', 'autodate'],
        ['hidden', `${hidden}`],
        ['onCreate', `${onCreate}`],
        ['onUpdate', `${onUpdate}`],
    ]);
    return [typeDef, docs];
}
function selectFieldSchema({ name, hidden, values, maxSelect, required, isMultiple, }) {
    const multiple = isMultiple();
    const options = values.map((v) => `'${v.replace(/([\\'])/g, '\\$1')}'`).join(' | ');
    const typeDef = `${name}: ${multiple ? (required ? `[${options}, ...(${options})[]]` : `(${options})[]`) : options}`;
    if (!config_json_1.default.tsSchema.includeDocs)
        return [typeDef, ''];
    const rows = [
        ['type', `select${multiple ? ' (multiple)' : '(single)'}`],
        ['hidden', `${hidden}`],
        ['required', `${required}`],
    ];
    if (multiple && maxSelect > 0)
        rows.push(['maxSelect', `${maxSelect}`]);
    const docs = (0, utils_1.generateMDTable)(rows);
    return [typeDef, docs];
}
function fileFieldSchema({ name, hidden, maxSize, maxSelect, mimeTypes, thumbs, protected: $protected, required, isMultiple, }) {
    const multiple = isMultiple();
    const typeDef = `${name}: ${multiple ? (required ? `[string, ...string[]]` : `string[]`) : 'string'}`;
    if (!config_json_1.default.tsSchema.includeDocs)
        return [typeDef, ''];
    const rows = [
        ['type', `file${multiple ? ' (multiple)' : '(single)'}`],
        ['hidden', `${hidden}`],
        ['required', `${required}`],
        ['protected', `${$protected}`],
        ['maxSize', `${maxSize}`],
    ];
    if (multiple && maxSelect > 0)
        rows.push(['maxSelect', `${maxSelect}`]);
    if ((mimeTypes === null || mimeTypes === void 0 ? void 0 : mimeTypes.length) > 0)
        rows.push(['mimeTypes', mimeTypes.join('`, `')]);
    if ((thumbs === null || thumbs === void 0 ? void 0 : thumbs.length) > 0)
        rows.push(['thumbs', thumbs.join('`, `')]);
    const docs = (0, utils_1.generateMDTable)(rows);
    return [typeDef, docs];
}
function relationFieldSchema({ name, hidden, collectionId, collectionName, cascadeDelete, minSelect, maxSelect, required, isMultiple, }) {
    const multiple = isMultiple();
    const typeDef = `${name}: ${multiple ? (required ? `[string, ...string[]]` : `string[]`) : 'string'}`;
    if (!config_json_1.default.tsSchema.includeDocs)
        return [typeDef, ''];
    const rows = [
        ['type', `relation${multiple ? ' (multiple)' : '(single)'}`],
        ['hidden', `${hidden}`],
        ['required', `${required}`],
        ['collectionId', `${collectionId}`],
        ['collectionName', `${collectionName}`],
        ['cascadeDelete', `${cascadeDelete}`],
    ];
    if (minSelect > 0)
        rows.push(['minSelect', `${minSelect}`]);
    if (multiple && maxSelect > 0)
        rows.push(['maxSelect', `${maxSelect}`]);
    const docs = (0, utils_1.generateMDTable)(rows);
    return [typeDef, docs];
}
function jsonFieldSchema({ name, hidden, maxSize, required, override, }) {
    const typeDef = `${name}: ${override !== null && override !== void 0 ? override : 'any'}`;
    if (!config_json_1.default.tsSchema.includeDocs)
        return [typeDef, ''];
    const docs = (0, utils_1.generateMDTable)([
        ['type', 'json'],
        ['hidden', `${hidden}`],
        ['maxSize', `${maxSize}`],
        ['required', `${required}`],
    ]);
    return [typeDef, docs];
}
function geoPointSchema({ name, hidden, required }) {
    const typeDef = `${name}: { lon: number; lat: number }`;
    if (!config_json_1.default.tsSchema.includeDocs)
        return [typeDef, ''];
    const docs = (0, utils_1.generateMDTable)([
        ['type', 'geoPoint'],
        ['hidden', `${hidden}`],
        ['required', `${required}`],
    ]);
    return [typeDef, docs];
}
