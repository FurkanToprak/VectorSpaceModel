import lodash from 'lodash';
/**
 * Instead of representing a document as an arbitrarily ordered tuple of values (because dimensions can be arbitrarily ordered), 
 * Each document contains a field, vector, which is represented as a Map<string, number> 
 * where the key represents a term/dimension and number represents the tf-idf score.
 * @field vector represents the vector representation of the document.
 * @field meta allows for the user to attach any desired metadata to the document.
 * This is especially useful for indexing documents in relation to the rest of the collection.
 */
export class Document {
    private _content: string;
    private _meta: Map<string, any>;
    /** Constructs a Document from a RawDocument */
    public constructor(raw: RawDocument) {

        this._meta = new Map(this._meta);
    }
    public get content(): string {
        return this._content;
    }
    public get meta(): Map<string, any> {
        return this._meta;
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
    meta: Map<string, any>;
}

export type WeighingScheme = (term: string) => number;

/**
 * @description A class that turns a collection of documents as a vector space model.
 */
export class VectorSpaceModel {
    private _collection: Document[];
    public constructor(collection: RawDocument[], scheme: WeighingScheme) {
        // this._collection = collection.map((document: RawDocument) => {
        //     return {

        //     };
        // });
    }
}

/** Number of documents in the collection that contain a term t 
 *  Often represented in information retrieval as `df_t`
 *  @param term The specific term searched for.
 *  @param collection The collection of documents to search.
*/
function documentFrequency(term: string, collection: RawDocument[]): number {
    let freq = 0;
    collection.forEach((document: RawDocument) => {
        const docWords = ((document.content || "").match(/\w+/g) || []);
        freq += docWords.includes(term) ? 1 : 0;
    });
    return freq;
  };

/** The inverse document frequency of a a term in a collection.
 *  @param term The term to be queried among the documents.
 *  @param collection The collection of documents to be queried.
*/
export function inverseDocumentFrequency(term: string, collection: RawDocument[]): number {
    return Math.log(collection.length / documentFrequency(term, collection));
}

/** The frequency of a term in a document
 *  @param term The term to be counted for occurences.
 *  @param document The document to be searched
 */
export function termFrequency(term: string, document: RawDocument): number {
    return ((document.content || "").match(term) || []).length;
}

export function tfidf(collection: RawDocument[]): void {

}

export function vectorizeDocument