import { cloneDeep } from "lodash";

/**
 * Instead of representing a document as an arbitrarily ordered tuple of values (because dimensions can be arbitrarily ordered),
 * Each document contains a field, vector, which is represented as a Map<string, number>
 * where the key represents a term/dimension and number represents the tf-idf score.
 * @field vector represents the vector representation of the document.
 * @field content is the text of the original document.
 * @field meta allows for the user to attach any desired metadata to the document.
 * This is especially useful for indexing documents in relation to the rest of the collection.
 */
export class VectorizedDocument {
  private _vector: Map<string, number>;
  private _meta: Map<string, any>;
  private _content: string;
  /** Constructs a Document from a RawDocument, populating the document with term frequencies.
   *  @param raw RawDocument to be converted to Document
   */
  public constructor(
    vector: Map<string, number>,
    content: string,
    meta?: Map<string, any>
  ) {
    this._vector = new Map(vector);
    this._meta = meta ? cloneDeep(meta) : new Map<string, any>();
    this._content = content;
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

  /** @returns content of the Document */
  public get content(): string {
    return this._content;
  }

  /** @param content content of the document. */
  public set content(content: string) {
    this._content = content;
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
 * @definition Defines the family of functions defining component weights in the vector space model.
 * @param collection A non-empty list of vectorized documents.
 * @param dictionary A set enumerating the dimensions (all unique terms of the collection). The constructor of VectorSpaceModel computes the dictionary for the user;
 * @returns a normalized vector space.
 * All that must be specified is how to use the dictionary in the vector normalization function. See Weighing Schema library for examples.
 */
export type WeighingSchema = (
  collection: VectorizedDocument[],
  dictionary: Set<string>
) => VectorizedDocument[];

/**
 * @definition Defines the family of functions that provide a numerical comparison between two vectors.
 * @param a A vectorized document
 * @param b A vectorized document
 * @return a metric of distance between the two vectors.
 */
export type SimilaritySchema = (
  a: VectorizedDocument,
  b: VectorizedDocument
) => number;

/** Defines the family of functions that map a word to another word, typically used as a heuristic for equivalence among similar variations of the same word.
 *  Typically used for case/punctuation-insensitive models.
 *  @example A case-insensitive word mapping would be as following: F("Example") -> "example"
 */
export type WordMappingSchema = (word: string) => string;

/**
 * @description A class that models collections of documents into vector space models.
 */
export class VectorSpaceModel {
  private _similaritySchema: SimilaritySchema;
  private _weighingSchema: WeighingSchema | undefined;
  private _wordMappingSchema: WordMappingSchema | undefined;
  /**
   * @param similaritySchema Function determining the metric of relevance between two vectorized documents. See SimilaritySchemas library for examples.
   * @param weighingSchema Function determining the weight of each term component of each document. If not specified (unadvisable), the document vectors will be
   * prepopulated with term frequencies. See WeighingSchemas library for examples.
   * @param wordMappingSchema Function that maps variations of words into a specific word. See WordMappings library for examples.
   */
  public constructor(
    similaritySchema: SimilaritySchema,
    weighingSchema?: WeighingSchema,
    wordMappingSchema?: WordMappingSchema
  ) {
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
  public query(
    query: string,
    collection: RawDocument[],
    k: number
  ): RawDocument[] {
    if (k > collection.length) {
      throw Error("Parameter k cannot be greater than collection size.");
    } else if (k <= 0 || k !== Math.floor(k)) {
      throw Error("Parameter k must be a positive integer.");
    } else if (query === "") {
      throw Error("Empty query not allowed.");
    } else if (collection.length === 0) {
      return [];
    }
    // Each term is a dimension
    const dimensions = new Set<string>();
    // Mapping documents and query to vectors.
    let vectors = collection
      .concat([{ content: query }])
      .map((document: RawDocument) => {
        const vector = new Map<string, number>();
        const rawWords = (document.content || "").match(/\w+/g);
        rawWords &&
          rawWords.forEach((rawWord: string) => {
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
    const scoredVectors: {
      vd: VectorizedDocument;
      score: number;
    }[] = vectors.map((documentVector: VectorizedDocument) => {
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

export const WordMappings = {
  caseInsensitive: (word: string) => word.toLowerCase(),
  noPunctuation: (word: string) => {
    return word.replace(/[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g, "");
  },
};

export const WeighingSchemas = {
  /** A weighing function that utilizes term frequency and inverse document frequency. */
  tfidf: (vectorSpace: VectorizedDocument[], dimensions: Set<string>) => {
    const normalizedVectorSpace = cloneDeep(vectorSpace);
    const dictionary = dimensions;
    dictionary.forEach((dimension: string) => {
      // Number of documents in the collection that contain a term t
      let documentFrequency = 0;
      vectorSpace.forEach((document: VectorizedDocument) => {
        documentFrequency += document.vector.has(dimension) ? 1 : 0;
      });
      const idf = Math.log(normalizedVectorSpace.length / documentFrequency);
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
  },
};

export const SimilaritySchemas = {
  cosineSimilarity: (a: VectorizedDocument, b: VectorizedDocument) => {
    return (
      VectorOperations.dotProduct(a, b) /
      (VectorOperations.euclideanLength(a) *
        VectorOperations.euclideanLength(b))
    );
  },
};

/** A collection of vector operations that may be helpful when constructing similarity schemas. */
export const VectorOperations = {
  /**
   * @returns The euclidiean length of a document.
   * @param vector Vectorized document to find length of.
   */
  euclideanLength: (vector: VectorizedDocument) => {
    let length = 0;
    Array.from(vector.vector.values()).forEach((component: number) => {
      length += Math.pow(component, 2);
    });
    return Math.sqrt(length);
  },

  /** 
   * @returns Calculates the dot product between two documents.
   * @param a First vector.
   * @param b Second vector.
   */
  dotProduct: (a: VectorizedDocument, b: VectorizedDocument) => {
    let dp = 0;
    Array.from(a.vector.entries()).forEach(
      (aNthDimension: [string, number]) => {
        const bNthDimension = b.vector.get(aNthDimension[0]);
        if (bNthDimension) {
          dp += aNthDimension[1] * bNthDimension;
        }
      }
    );
    return dp;
  },
};
