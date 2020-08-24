"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorOperations = exports.SimilaritySchemas = exports.WeighingSchemas = exports.WordMappings = exports.VectorSpaceModel = exports.VectorizedDocument = void 0;
const lodash_1 = require("lodash");
/**
 * Instead of representing a document as an arbitrarily ordered tuple of values (because dimensions can be arbitrarily ordered),
 * Each document contains a field, vector, which is represented as a Map<string, number>
 * where the key represents a term/dimension and number represents the tf-idf score.
 * @field vector represents the vector representation of the document.
 * @field content is the text of the original document.
 * @field meta allows for the user to attach any desired metadata to the document.
 * This is especially useful for indexing documents in relation to the rest of the collection.
 */
class VectorizedDocument {
    /** Constructs a Document from a RawDocument, populating the document with term frequencies.
     *  @param raw RawDocument to be converted to Document
     */
    constructor(vector, content, meta) {
        this._vector = new Map(vector);
        this._meta = meta ? lodash_1.cloneDeep(meta) : new Map();
        this._content = content;
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
    /** @returns content of the Document */
    get content() {
        return this._content;
    }
    /** @param content content of the document. */
    set content(content) {
        this._content = content;
    }
}
exports.VectorizedDocument = VectorizedDocument;
/**
 * @description A class that models collections of documents into vector space models.
 */
class VectorSpaceModel {
    /**
     * @param similaritySchema Function determining the metric of relevance between two vectorized documents. See SimilaritySchemas library for examples.
     * @param weighingSchema Function determining the weight of each term component of each document. If not specified (unadvisable), the document vectors will be
     * prepopulated with term frequencies. See WeighingSchemas library for examples.
     * @param wordMappingSchema Function that maps variations of words into a specific word. See WordMappings library for examples.
     */
    constructor(similaritySchema, weighingSchema, wordMappingSchema) {
        this._similaritySchema = similaritySchema;
        this._wordMappingSchema = wordMappingSchema;
        this._weighingSchema = weighingSchema;
    }
    /**
     * @description Performs a query on a collection of documents, returning the top k results.
     * @param query Query to perform on the collection.
     * @param collection Collection of documents to construct a vector space of. The query should not be included.
     * @param k Positive integer representing the top k number of results to return.
     */
    query(query, collection, k) {
        if (k > collection.length) {
            throw Error("Parameter k cannot be greater than collection size.");
        }
        else if (k <= 0 || k !== Math.floor(k)) {
            throw Error("Parameter k must be a positive integer.");
        }
        else if (query === "") {
            throw Error("Empty query not allowed.");
        }
        else if (collection.length === 0) {
            return [];
        }
        // Each term is a dimension
        const dimensions = new Set();
        // Mapping documents and query to vectors.
        let vectors = collection
            .concat([{ content: query }])
            .map((document) => {
            const vector = new Map();
            const rawWords = (document.content || "").match(/\w+/g);
            rawWords &&
                rawWords.forEach((rawWord) => {
                    const word = this._wordMappingSchema
                        ? this._wordMappingSchema(rawWord)
                        : rawWord;
                    dimensions.add(word);
                    const wordCount = vector.get(word) || 0;
                    vector.set(word, 1 + wordCount);
                });
            return new VectorizedDocument(vector, document.content, document.meta);
        });
        // Assigning weights of the vectors based on a bag-of-words function
        vectors = this._weighingSchema
            ? this._weighingSchema(vectors, dimensions)
            : vectors;
        const queryVector = vectors.pop();
        // Score vectors
        const scoredVectors = vectors.map((documentVector) => {
            return {
                vd: documentVector,
                score: queryVector
                    ? this._similaritySchema(queryVector, documentVector)
                    : 0,
            };
        });
        scoredVectors.sort((a, b) => {
            return a.score === b.score ? 0 : a.score > b.score ? 1 : -1;
        });
        const cream = scoredVectors.slice(0, k);
        return cream.map((scoredVector) => {
            return { content: scoredVector.vd.content, meta: scoredVector.vd.meta };
        });
    }
}
exports.VectorSpaceModel = VectorSpaceModel;
exports.WordMappings = {
    caseInsensitive: (word) => word.toLowerCase(),
    noPunctuation: (word) => {
        return word.replace(/[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g, "");
    },
};
exports.WeighingSchemas = {
    /** A weighing function that utilizes term frequency and inverse document frequency. */
    tfidf: (vectorSpace, dimensions) => {
        const normalizedVectorSpace = lodash_1.cloneDeep(vectorSpace);
        const dictionary = dimensions;
        dictionary.forEach((dimension) => {
            // Number of documents in the collection that contain a term t
            let documentFrequency = 0;
            vectorSpace.forEach((document) => {
                documentFrequency += document.vector.has(dimension) ? 1 : 0;
            });
            const idf = Math.log(normalizedVectorSpace.length / documentFrequency);
            normalizedVectorSpace.forEach((vector, index) => {
                // The frequency of a term in a document
                const tf = vector.vector.get(dimension) || 0;
                const idftf = idf * tf;
                normalizedVectorSpace[index].vector.set(dimension, idftf);
            });
        });
        return normalizedVectorSpace;
    },
};
exports.SimilaritySchemas = {
    cosineSimilarity: (a, b) => {
        return (exports.VectorOperations.dotProduct(a, b) /
            (exports.VectorOperations.euclideanLength(a) *
                exports.VectorOperations.euclideanLength(b)));
    },
};
/** A collection of vector operations that may be helpful when constructing similarity schemas. */
exports.VectorOperations = {
    /**
     * @returns The euclidiean length of a document.
     * @param vector Vectorized document to find length of.
     */
    euclideanLength: (vector) => {
        let length = 0;
        Array.from(vector.vector.values()).forEach((component) => {
            length += Math.pow(component, 2);
        });
        return Math.sqrt(length);
    },
    /**
     * @returns Calculates the dot product between two documents.
     * @param a First vector.
     * @param b Second vector.
     */
    dotProduct: (a, b) => {
        let dp = 0;
        Array.from(a.vector.entries()).forEach((aNthDimension) => {
            const bNthDimension = b.vector.get(aNthDimension[0]);
            if (bNthDimension) {
                dp += aNthDimension[1] * bNthDimension;
            }
        });
        return dp;
    },
};
