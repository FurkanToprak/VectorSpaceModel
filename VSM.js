"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tfidf = exports.VectorSpaceModel = exports.VectorizedDocument = void 0;
const lodash_1 = require("lodash");
/**
 * Instead of representing a document as an arbitrarily ordered tuple of values (because dimensions can be arbitrarily ordered),
 * Each document contains a field, vector, which is represented as a Map<string, number>
 * where the key represents a term/dimension and number represents the tf-idf score.
 * @field vector represents the vector representation of the document.
 * @field meta allows for the user to attach any desired metadata to the document.
 * This is especially useful for indexing documents in relation to the rest of the collection.
 */
class VectorizedDocument {
    /** Constructs a Document from a RawDocument, populating the document with term frequencies.
     *  @param raw RawDocument to be converted to Document
     */
    constructor(vector, meta) {
        this._vector = new Map(vector);
        this._meta = meta ? lodash_1.cloneDeep(meta) : new Map();
    }
    /** @returns vectorized form of the Document */
    get vector() {
        return this._vector;
    }
    /** @param vector vectorized form of the document. */
    set vector(vector) {
        this._vector = new Map(vector);
    }
    /** @returns metadata of the Document */
    get meta() {
        return this._meta;
    }
    /** @param meta metadata of the document. */
    set meta(meta) {
        this._meta = meta ? lodash_1.cloneDeep(meta) : new Map();
    }
}
exports.VectorizedDocument = VectorizedDocument;
/**
 * @description A class that turns a collection of documents as a vector space model.
 */
class VectorSpaceModel {
    /**
     * Creates a vector space out of a collection of documents and customizable mathematical functions.
     * @param collection Collection of documents to construct a vector space of. The query should not be included.
     * @param weighingSchema Function determining the weight of each term component of each document. See WeighingSchemas enum for examples.
     * @param wordMappingSchema Function that maps variations of words into a specific word. See WordMappings enum for examples.
     */
    constructor(collection, weighingSchema, wordMappingSchema) {
        this._dimensions = new Set();
        const vectors = collection.map((document) => {
            const vector = new Map();
            (document.content || "").match(/\w+/g)?.forEach((rawWord) => {
                const word = wordMappingSchema ? wordMappingSchema(rawWord) : rawWord;
                this._dimensions.add(word);
                const wordCount = vector.get(word) || 0;
                vector.set(word, 1 + wordCount);
            });
            return new VectorizedDocument(vector, document.meta);
        });
        this._vectors = weighingSchema ? weighingSchema(vectors, this._dimensions) : vectors;
    }
    /** @returns The vectors in the vector space model. */
    get vectors() {
        return this._vectors;
    }
    /** @returns The dimensions of the vector space model. */
    get dimensions() {
        return this._dimensions;
    }
    query(query, k, similarityFunction) {
        return [];
    }
}
exports.VectorSpaceModel = VectorSpaceModel;
/** Number of documents in the collection that contain a term t
 *  Often represented in information retrieval as `df_t`
 *  @param term The specific term searched for.
 *  @param collection The collection of documents to search.
*/
function documentFrequency(term, collection) {
    let freq = 0;
    collection.forEach((document) => {
        freq += document.vector.has(term) ? 1 : 0;
    });
    return freq;
}
;
/** The inverse document frequency of a a term in a collection.
 *  @param term The term to be queried among the documents.
 *  @param collection The collection of documents to be queried.
*/
function inverseDocumentFrequency(term, collection) {
    return Math.log(collection.length / documentFrequency(term, collection));
}
/** The frequency of a term in a document
 *  @param term The term to be counted for occurences.
 *  @param document The document to be searched
 */
function termFrequency(term, document) {
    return document.vector.get(term) || 0;
}
/** A weighting function that utilizes term frequency and inverse document frequency. */
function tfidf(vectorSpace, dimensions) {
    const dictionary = dimensions;
    dictionary.forEach((dimension) => {
        const idf = inverseDocumentFrequency(dimension, vectorSpace);
        vectorSpace.forEach((vector, index) => {
            const tf = termFrequency(dimension, vector);
            const idftf = idf * tf;
            vectorSpace[index].vector.set(dimension, idftf);
        });
    });
    return vectorSpace;
}
exports.tfidf = tfidf;
