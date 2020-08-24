# [vectorspacemodel](https://www.npmjs.com/package/vectorspacemodel)
* Install the [npm package](https://www.npmjs.com/package/vectorspacemodel)

A strongly-typed, light-weight library created in TypeScript that allows for an object-orientated, high-level, efficient approach to Vector Space Model computations.

## Installation
```
npm install vectorspacemodel --save
```
## Features
* `VectorOperations`, which contains useful vector calculation functions such as `dotProduct` and `euclideanLength`.
* `SimilaritySchemas`, which contains useful functions to compute relevance between two vectorized documents, such as `cosineSimilarity`.
* `WordMappings`, which contains commonly used word-equivalence functions such as `caseInsensitive` and `noPunctuation`.
* _Every_ mathematical function is completely customizable, and every function type is strongly typed, well documented, and has existing examples in the aforementioned libraries. This allows for a general-use, object-orientated approach to Vector Space Modeling.

## Usage
```
import { VectorSpaceModel, SimilaritySchemas, WeighingSchemas, WordMappings } from 'vectorspacemodel';
const vsm = new VectorSpaceModel(SimilaritySchemas.cosineSimilarity, WeighingSchemas.tfidf, WordMappings.caseInsensitive);
const docs = [
    {
        content: "This is test numero uno.",
        meta: /* Some map representing metadeta */,
    },
    {
        content: "This document will be the most relevant.",
        meta: /* Metadata is optional! */,
    },
    {
        content: "Ordered last in the results.",
        meta: /* metadata can be useful for important document-tracking purposes. */,
    },
    /** More documents... */
];
const queryResult = vsm.query(docs, "which document is the most relevant.", 3);
```

## Learn the Theory
Want to learn the theory behind vector space modeling, or information retrieval in general?
Sources for further reading:
* https://nlp.stanford.edu/IR-book/information-retrieval-book.html
* https://www.sciencedirect.com/topics/computer-science/vector-space-models
* https://blog.christianperone.com/2013/09/machine-learning-cosine-similarity-for-vector-space-models-part-iii/

## Contributions
Want to contribute to this project? Feel free to fork! I'm happy to make further additions.

## An Apology
_Yes_, the names of classes, interfaces, and functions are _very_ long at times, but often times, abbreviations cause for confusions, ambiguity, and difficulty reading code. I am always open to new suggestions for new naming schema, so please open an issue if you have concerns.

## TODO
* Add more general-functionality functions to the following libraries:
  * VectorOperations
  * SimilaritySchemas
  * WordMappings
* Find different representations of vectors than Map<string, number> in order to give the user more options.