# vectorspacemodel
A strongly-typed, light-weight library created in TypeScript that allows for an object-orientated, high-level, efficient approach to Vector Space Model computations.

## Features
* `VectorOperations`, which contains useful vector calculation functions such as `dotProduct` and `euclideanLength`.
* `SimilaritySchemas`, which contains useful functions to compute relevance between two vectorized documents, such as `cosineSimilarity`.
* `WordMappings`, which contains commonly used word-equivalence functions such as `caseInsensitive` and `noPunctuation`.
* _Every_ mathematical function is completely customizable, and every function type is strongly typed, well documented, and has existing examples in the aforementioned libraries. This allows for a general-use, object-orientated approach to Vector Space Modeling.

## Usage
```
import { VectorSpaceModel, SimilaritySchemas, WeighingSchemas, WordMappings } from 'vectorspacemodel';
const vsm = new VectorSpaceModel(SimilaritySchemas.cosineSimilarity, WeighingSchemas.tfidf, WordMappings.caseInsensitive);
const docs = ["This is a tester", "The second document should be the most relevant.", ""]
const queryResult = vsm.query(docs, "which document is the most relevant.", 2);
```

## An Apology
_Yes_, the names of classes, interfaces, and functions are _very_ long at times, but often times, abbreviations cause for confusions, ambiguity, and difficulty reading code. I am always open to new suggestions for new naming schema, so please open an issue if you have concerns.
