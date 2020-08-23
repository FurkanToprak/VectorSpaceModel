import { cloneDeep } from "lodash";

/**
 * Instead of representing a document as an arbitrarily ordered tuple of values (because dimensions can be arbitrarily ordered),
 * Each document contains a field, vector, which is represented as a Map<string, number>
 * where the key represents a term/dimension and number represents the tf-idf score.
 * @field vector represents the vector representation of the document.
 * @field meta allows for the user to attach any desired metadata to the document.
 * This is especially useful for indexing documents in relation to the rest of the collection.
 */
export class VectorizedDocument {
  private _vector: Map<string, number>;
  private _meta: Map<string, any>;
  /** Constructs a Document from a RawDocument, populating the document with term frequencies.
   *  @param raw RawDocument to be converted to Document
   */
  public constructor(vector: Map<string, number>, meta?: Map<string, any>) {
    this._vector = new Map(vector);
    this._meta = meta ? cloneDeep(meta) : new Map<string, any>();
  }

  /** @returns vectorized form of the Document */
  public get vector(): Map<string, number> {
    return this._vector;
  }

  /** @param vector vectorized form of the document. */
  public set vector(vector: Map<string, number>) {
    this._vector = new Map(vector);
  }

  /** @returns metadata of the Document */
  public get meta(): Map<string, any> {
    return this._meta;
  }

  /** @param meta metadata of the document. */
  public set meta(meta: Map<string, any>) {
    this._meta = meta ? cloneDeep(meta) : new Map<string, any>();
  }
}

/**
 * Instead of representing a document as an arbitrarily ordered tuple of values (because dimensions can be arbitrarily ordered),
 * Each document contains a field, vector, which is represented as a Map<string, number>
 * where the key represents a term/dimension and number represents the tf-idf score.
 * @field content is the text of the document.
 * @field meta allows for the user to attach any desired metadata to the document.
 * This is especially useful for indexing documents in relation to the rest of the collection.
 */
export interface RawDocument {
  content: string;
  meta?: Map<string, any>;
}

/**
 * @definition Defines the various functions defining component weights in the vector space model.
 * @param collection A non-empty list of vectorized documents.
 * @param dictionary A set enumerating the dimensions (all unique terms of the collection). The constructor of VectorSpaceModel computes the dictionary for the user;
 * All that must be specified is how to use the dictionary in the vector normalization function. See SimilaritySchemas enum for examples.
 */
export type WeighingSchema = (
  collection: VectorizedDocument[],
  dictionary: Set<string>
) => VectorizedDocument[];

/** Defines the various functions comparing vectors in the vector space model.
 */
export type SimilaritySchema = (
  a: VectorizedDocument,
  b: VectorizedDocument
) => number;

/** Defines a function, f_word, that maps a word so that similar variations are documented as the same word.
 *  Typically used for case/punctuation-insensitive models.
 *  @example A case-insensitive word mapping would be as following: f_word("Example") -> "example"
 */
export type WordMappingSchema = (word: string) => string;

/**
 * @description A class that turns a collection of documents as a vector space model.
 */
export class VectorSpaceModel {
  private _vectors: VectorizedDocument[];
  private _dimensions: Set<string>;
  /**
   * @description Creates a vector space out of a collection of documents and customizable mathematical functions.
   * @param collection Collection of documents to construct a vector space of. The query should not be included.
   * @param weighingSchema Function determining the weight of each term component of each document. If not specified (unadvisable), the document vectors will be
   * prepopulated with term frequencies. See WeighingSchemas enum for examples.
   * @param wordMappingSchema Function that maps variations of words into a specific word. See WordMappings enum for examples.
   */
  public constructor(
    collection: RawDocument[],
    weighingSchema?: WeighingSchema,
    wordMappingSchema?: WordMappingSchema
  ) {
    this._dimensions = new Set<string>();
    const vectors = collection.map((document: RawDocument) => {
      const vector = new Map<string, number>();
      (document.content || "").match(/\w+/g)?.forEach((rawWord: string) => {
        const word = wordMappingSchema ? wordMappingSchema(rawWord) : rawWord;
        this._dimensions.add(word);
        const wordCount = vector.get(word) || 0;
        vector.set(word, 1 + wordCount);
      });
      return new VectorizedDocument(vector, document.meta);
    });
    this._vectors = weighingSchema
      ? weighingSchema(vectors, this._dimensions)
      : vectors;
  }

  /** @returns The vectors in the vector space model. */
  public get vectors(): VectorizedDocument[] {
    return this._vectors;
  }

  /** @returns The dimensions of the vector space model. */
  public get dimensions(): Set<string> {
    return this._dimensions;
  }

  public query(
    query: string,
    k: number,
    similarityFunction: SimilaritySchema
  ): RawDocument[] {
    return [];
  }
}

/** A weighting function that utilizes term frequency and inverse document frequency. */
export function tfidf(
  vectorSpace: VectorizedDocument[],
  dimensions: Set<string>
): VectorizedDocument[] {
  const normalizedVectorSpace = cloneDeep(vectorSpace);
  const dictionary = dimensions;
  dictionary.forEach((dimension: string) => {
    // Number of documents in the collection that contain a term t
    let documentFrequency = 0;
    vectorSpace.forEach((document: VectorizedDocument) => {
        documentFrequency += document.vector.has(dimension) ? 1 : 0;
    });

    const idf = Math.log(
      normalizedVectorSpace.length / documentFrequency
    );
    normalizedVectorSpace.forEach(
      (vector: VectorizedDocument, index: number) => {
        // The frequency of a term in a document
        const tf = vector.vector.get(dimension) || 0;
        const idftf = idf * tf;
        normalizedVectorSpace[index].vector.set(dimension, idftf);
      }
    );
  });
  return normalizedVectorSpace;
}

/** A word mapping function that makes all words case insensitive. */
export function caseInsensitive(word: string): string {
    return word.toLowerCase();
}

export function cosineSimilarity(a: VectorizedDocument, b: VectorizedDocument): number {
    let score = 0;
    // A dot product between vectors a & b.
    Array.from(a.vector.entries()).forEach((aNthDimension: [string, number]) => {
        const bNthDimension = b.vector.get(aNthDimension[0]);
        if (bNthDimension) {
            score += aNthDimension[1] * bNthDimension;
        }
    });
    return score / (euclideanLength(a) * euclideanLength(b));
}

/** @description Computes the euclidean length of a vectorized document.
 *  @param vector Vector to compute euclidean length of.
 */
export function euclideanLength(vector: VectorizedDocument): number {
    let length = 0;
    Array.from(vector.vector.values()).forEach((component: number) => {
        length += Math.pow(component, 2);
    });
    return Math.sqrt(length);
}

// export enum WordMappings {

// }

// export enum WeighingSchema {

// }