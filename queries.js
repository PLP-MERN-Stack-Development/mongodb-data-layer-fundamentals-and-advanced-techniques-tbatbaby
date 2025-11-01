// queries.js - MongoDB queries for PLP Bookstore Assignment

const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb+srv://MERN-STACK:2XA6Sz7Pawsn33T5@cluster0.ehm7thj.mongodb.net/?appName=Cluster0';
const dbName = 'plp_bookstore';
const collectionName = 'books';

async function runQueries() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB server\n');
    
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // ===== TASK 2: Basic CRUD Operations =====
    console.log('=== TASK 2: Basic CRUD Operations ===\n');

    // 1. Find all books in a specific genre
    console.log('1. All Fiction books:');
    const fictionBooks = await collection.find({ genre: 'Fiction' }).toArray();
    fictionBooks.forEach(book => {
      console.log(`   - "${book.title}" by ${book.author}`);
    });

    // 2. Find books published after a certain year
    console.log('\n2. Books published after 1950:');
    const booksAfter1950 = await collection.find({ published_year: { $gt: 1950 } }).toArray();
    booksAfter1950.forEach(book => {
      console.log(`   - "${book.title}" (${book.published_year})`);
    });

    // 3. Find books by a specific author
    console.log('\n3. Books by George Orwell:');
    const orwellBooks = await collection.find({ author: 'George Orwell' }).toArray();
    orwellBooks.forEach(book => {
      console.log(`   - "${book.title}" (${book.published_year})`);
    });

    // 4. Update the price of a specific book
    console.log('\n4. Updating price of "The Great Gatsby"...');
    const updateResult = await collection.updateOne(
      { title: 'The Great Gatsby' },
      { $set: { price: 11.99 } }
    );
    console.log(`   Modified ${updateResult.modifiedCount} document(s)`);

    // Verify the update
    const updatedBook = await collection.findOne({ title: 'The Great Gatsby' });
    console.log(`   New price: $${updatedBook.price}`);

    // 5. Delete a book by its title
    console.log('\n5. Deleting "Moby Dick"...');
    const deleteResult = await collection.deleteOne({ title: 'Moby Dick' });
    console.log(`   Deleted ${deleteResult.deletedCount} document(s)`);

    // ===== TASK 3: Advanced Queries =====
    console.log('\n\n=== TASK 3: Advanced Queries ===\n');

    // 1. Find books that are both in stock and published after 2000
    console.log('1. Books in stock and published after 2000:');
    const inStockRecent = await collection.find({
      in_stock: true,
      published_year: { $gt: 2000 }
    }).toArray();
    inStockRecent.forEach(book => {
      console.log(`   - "${book.title}" by ${book.author} (${book.published_year})`);
    });

    // 2. Use projection to return only specific fields
    console.log('\n2. Books with projection (title, author, price only):');
    const projectedBooks = await collection.find(
      { genre: 'Fantasy' },
      { projection: { title: 1, author: 1, price: 1, _id: 0 } }
    ).toArray();
    console.log(projectedBooks);

    // 3. Implement sorting (ascending and descending)
    console.log('\n3. Books sorted by price (ascending):');
    const booksAscending = await collection.find({})
      .sort({ price: 1 })
      .limit(5)
      .toArray();
    booksAscending.forEach(book => {
      console.log(`   - "${book.title}": $${book.price}`);
    });

    console.log('\n4. Books sorted by price (descending):');
    const booksDescending = await collection.find({})
      .sort({ price: -1 })
      .limit(5)
      .toArray();
    booksDescending.forEach(book => {
      console.log(`   - "${book.title}": $${book.price}`);
    });

    // 4. Implement pagination (5 books per page)
    console.log('\n5. Pagination - Page 1 (books 1-5):');
    const page1 = await collection.find({})
      .sort({ title: 1 })
      .limit(5)
      .skip(0)
      .toArray();
    page1.forEach((book, index) => {
      console.log(`   ${index + 1}. "${book.title}"`);
    });

    console.log('\n6. Pagination - Page 2 (books 6-10):');
    const page2 = await collection.find({})
      .sort({ title: 1 })
      .limit(5)
      .skip(5)
      .toArray();
    page2.forEach((book, index) => {
      console.log(`   ${index + 1}. "${book.title}"`);
    });

    // ===== TASK 4: Aggregation Pipeline =====
    console.log('\n\n=== TASK 4: Aggregation Pipeline ===\n');

    // 1. Average price by genre
    console.log('1. Average price by genre:');
    const avgPriceByGenre = await collection.aggregate([
      {
        $group: {
          _id: '$genre',
          averagePrice: { $avg: '$price' },
          bookCount: { $sum: 1 }
        }
      },
      {
        $sort: { averagePrice: -1 }
      }
    ]).toArray();
    avgPriceByGenre.forEach(genre => {
      console.log(`   - ${genre._id}: $${genre.averagePrice.toFixed(2)} (${genre.bookCount} books)`);
    });

    // 2. Author with the most books
    console.log('\n2. Author with most books:');
    const authorMostBooks = await collection.aggregate([
      {
        $group: {
          _id: '$author',
          bookCount: { $sum: 1 },
          books: { $push: '$title' }
        }
      },
      {
        $sort: { bookCount: -1 }
      },
      {
        $limit: 3
      }
    ]).toArray();
    authorMostBooks.forEach(author => {
      console.log(`   - ${author._id}: ${author.bookCount} books`);
      console.log(`     Books: ${author.books.join(', ')}`);
    });

    // 3. Books grouped by publication decade
    console.log('\n3. Books by publication decade:');
    const booksByDecade = await collection.aggregate([
      {
        $project: {
          title: 1,
          published_year: 1,
          decade: {
            $subtract: [
              '$published_year',
              { $mod: ['$published_year', 10] }
            ]
          }
        }
      },
      {
        $group: {
          _id: '$decade',
          bookCount: { $sum: 1 },
          books: { $push: { title: '$title', year: '$published_year' } }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]).toArray();
    booksByDecade.forEach(decade => {
      console.log(`   - ${decade._id}s: ${decade.bookCount} books`);
    });

    // ===== TASK 5: Indexing =====
    console.log('\n\n=== TASK 5: Indexing ===\n');

    // 1. Create index on title field
    console.log('1. Creating index on title field...');
    await collection.createIndex({ title: 1 });
    console.log('   Index created on title field');

    // 2. Create compound index on author and published_year
    console.log('\n2. Creating compound index on author and published_year...');
    await collection.createIndex({ author: 1, published_year: -1 });
    console.log('   Compound index created on author and published_year');

    // 3. Demonstrate performance improvement with explain()
    console.log('\n3. Performance comparison with explain():');

    // Without index (simulated by hinting no index)
    console.log('\n   Query without index (title search):');
    const withoutIndex = await collection.find({ title: '1984' })
      .explain('executionStats');
    console.log(`   Documents examined: ${withoutIndex.executionStats.totalDocsExamined}`);
    console.log(`   Execution time: ${withoutIndex.executionStats.executionTimeMillis}ms`);

    // With index
    console.log('\n   Query with index (title search):');
    const withIndex = await collection.find({ title: '1984' })
      .hint({ title: 1 })
      .explain('executionStats');
    console.log(`   Documents examined: ${withIndex.executionStats.totalDocsExamined}`);
    console.log(`   Execution time: ${withIndex.executionStats.executionTimeMillis}ms`);

    // List all indexes
    console.log('\n4. Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach((index, i) => {
      console.log(`   ${i + 1}. ${JSON.stringify(index.key)}`);
    });

  } catch (err) {
    console.error('Error occurred:', err);
  } finally {
    await client.close();
    console.log('\nConnection closed');
  }
}

// Run all queries
runQueries().catch(console.error);;
const dbName = 'plp_bookstore';
const collectionName = 'books';

async function runQueries() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB server\n');
    
    const db = client.db(plp_bookstore);
    const collection = db.collection(books);

    // ===== TASK 2: Basic CRUD Operations =====
    console.log('=== TASK 2: Basic CRUD Operations ===\n');

    // 1. Find all books in a specific genre
    console.log('1. All Fiction books:');
    const fictionBooks = await collection.find({ genre: 'Fiction' }).toArray();
    fictionBooks.forEach(book => {
      console.log(`   - "${book.title}" by ${book.author}`);
    });

    // 2. Find books published after a certain year
    console.log('\n2. Books published after 1950:');
    const booksAfter1950 = await collection.find({ published_year: { $gt: 1950 } }).toArray();
    booksAfter1950.forEach(book => {
      console.log(`   - "${book.title}" (${book.published_year})`);
    });

    // 3. Find books by a specific author
    console.log('\n3. Books by George Orwell:');
    const orwellBooks = await collection.find({ author: 'George Orwell' }).toArray();
    orwellBooks.forEach(book => {
      console.log(`   - "${book.title}" (${book.published_year})`);
    });

    // 4. Update the price of a specific book
    console.log('\n4. Updating price of "The Great Gatsby"...');
    const updateResult = await collection.updateOne(
      { title: 'The Great Gatsby' },
      { $set: { price: 11.99 } }
    );
    console.log(`   Modified ${updateResult.modifiedCount} document(s)`);

    // Verify the update
    const updatedBook = await collection.findOne({ title: 'The Great Gatsby' });
    console.log(`   New price: $${updatedBook.price}`);

    // 5. Delete a book by its title
    console.log('\n5. Deleting "Moby Dick"...');
    const deleteResult = await collection.deleteOne({ title: 'Moby Dick' });
    console.log(`   Deleted ${deleteResult.deletedCount} document(s)`);

    // ===== TASK 3: Advanced Queries =====
    console.log('\n\n=== TASK 3: Advanced Queries ===\n');

    // 1. Find books that are both in stock and published after 2000
    console.log('1. Books in stock and published after 2000:');
    const inStockRecent = await collection.find({
      in_stock: true,
      published_year: { $gt: 2000 }
    }).toArray();
    inStockRecent.forEach(book => {
      console.log(`   - "${book.title}" by ${book.author} (${book.published_year})`);
    });

    // 2. Use projection to return only specific fields
    console.log('\n2. Books with projection (title, author, price only):');
    const projectedBooks = await collection.find(
      { genre: 'Fantasy' },
      { projection: { title: 1, author: 1, price: 1, _id: 0 } }
    ).toArray();
    console.log(projectedBooks);

    // 3. Implement sorting (ascending and descending)
    console.log('\n3. Books sorted by price (ascending):');
    const booksAscending = await collection.find({})
      .sort({ price: 1 })
      .limit(5)
      .toArray();
    booksAscending.forEach(book => {
      console.log(`   - "${book.title}": $${book.price}`);
    });

    console.log('\n4. Books sorted by price (descending):');
    const booksDescending = await collection.find({})
      .sort({ price: -1 })
      .limit(5)
      .toArray();
    booksDescending.forEach(book => {
      console.log(`   - "${book.title}": $${book.price}`);
    });

    // 4. Implement pagination (5 books per page)
    console.log('\n5. Pagination - Page 1 (books 1-5):');
    const page1 = await collection.find({})
      .sort({ title: 1 })
      .limit(5)
      .skip(0)
      .toArray();
    page1.forEach((book, index) => {
      console.log(`   ${index + 1}. "${book.title}"`);
    });

    console.log('\n6. Pagination - Page 2 (books 6-10):');
    const page2 = await collection.find({})
      .sort({ title: 1 })
      .limit(5)
      .skip(5)
      .toArray();
    page2.forEach((book, index) => {
      console.log(`   ${index + 1}. "${book.title}"`);
    });

    // ===== TASK 4: Aggregation Pipeline =====
    console.log('\n\n=== TASK 4: Aggregation Pipeline ===\n');

    // 1. Average price by genre
    console.log('1. Average price by genre:');
    const avgPriceByGenre = await collection.aggregate([
      {
        $group: {
          _id: '$genre',
          averagePrice: { $avg: '$price' },
          bookCount: { $sum: 1 }
        }
      },
      {
        $sort: { averagePrice: -1 }
      }
    ]).toArray();
    avgPriceByGenre.forEach(genre => {
      console.log(`   - ${genre._id}: $${genre.averagePrice.toFixed(2)} (${genre.bookCount} books)`);
    });

    // 2. Author with the most books
    console.log('\n2. Author with most books:');
    const authorMostBooks = await collection.aggregate([
      {
        $group: {
          _id: '$author',
          bookCount: { $sum: 1 },
          books: { $push: '$title' }
        }
      },
      {
        $sort: { bookCount: -1 }
      },
      {
        $limit: 3
      }
    ]).toArray();
    authorMostBooks.forEach(author => {
      console.log(`   - ${author._id}: ${author.bookCount} books`);
      console.log(`     Books: ${author.books.join(', ')}`);
    });

    // 3. Books grouped by publication decade
    console.log('\n3. Books by publication decade:');
    const booksByDecade = await collection.aggregate([
      {
        $project: {
          title: 1,
          published_year: 1,
          decade: {
            $subtract: [
              '$published_year',
              { $mod: ['$published_year', 10] }
            ]
          }
        }
      },
      {
        $group: {
          _id: '$decade',
          bookCount: { $sum: 1 },
          books: { $push: { title: '$title', year: '$published_year' } }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]).toArray();
    booksByDecade.forEach(decade => {
      console.log(`   - ${decade._id}s: ${decade.bookCount} books`);
    });

    // ===== TASK 5: Indexing =====
    console.log('\n\n=== TASK 5: Indexing ===\n');

    // 1. Create index on title field
    console.log('1. Creating index on title field...');
    await collection.createIndex({ title: 1 });
    console.log('   Index created on title field');

    // 2. Create compound index on author and published_year
    console.log('\n2. Creating compound index on author and published_year...');
    await collection.createIndex({ author: 1, published_year: -1 });
    console.log('   Compound index created on author and published_year');

    // 3. Demonstrate performance improvement with explain()
    console.log('\n3. Performance comparison with explain():');

    // Without index (simulated by hinting no index)
    console.log('\n   Query without index (title search):');
    const withoutIndex = await collection.find({ title: '1984' })
      .explain('executionStats');
    console.log(`   Documents examined: ${withoutIndex.executionStats.totalDocsExamined}`);
    console.log(`   Execution time: ${withoutIndex.executionStats.executionTimeMillis}ms`);

    // With index
    console.log('\n   Query with index (title search):');
    const withIndex = await collection.find({ title: '1984' })
      .hint({ title: 1 })
      .explain('executionStats');
    console.log(`   Documents examined: ${withIndex.executionStats.totalDocsExamined}`);
    console.log(`   Execution time: ${withIndex.executionStats.executionTimeMillis}ms`);

    // List all indexes
    console.log('\n4. Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach((index, i) => {
      console.log(`   ${i + 1}. ${JSON.stringify(index.key)}`);
    });

  } catch (err) {
    console.error('Error occurred:', err);
  } finally {
    await client.close();
    console.log('\nConnection closed');
  }
}

// Run all queries
runQueries().catch(console.error);;
const dbName = 'plp_bookstore';
const collectionName = 'books';

async function runQueries() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB server\n');
    
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // ===== TASK 2: Basic CRUD Operations =====
    console.log('=== TASK 2: Basic CRUD Operations ===\n');

    // 1. Find all books in a specific genre
    console.log('1. All Fiction books:');
    const fictionBooks = await collection.find({ genre: 'Fiction' }).toArray();
    fictionBooks.forEach(book => {
      console.log(`   - "${book.title}" by ${book.author}`);
    });

    // 2. Find books published after a certain year
    console.log('\n2. Books published after 1950:');
    const booksAfter1950 = await collection.find({ published_year: { $gt: 1950 } }).toArray();
    booksAfter1950.forEach(book => {
      console.log(`   - "${book.title}" (${book.published_year})`);
    });

    // 3. Find books by a specific author
    console.log('\n3. Books by George Orwell:');
    const orwellBooks = await collection.find({ author: 'George Orwell' }).toArray();
    orwellBooks.forEach(book => {
      console.log(`   - "${book.title}" (${book.published_year})`);
    });

    // 4. Update the price of a specific book
    console.log('\n4. Updating price of "The Great Gatsby"...');
    const updateResult = await collection.updateOne(
      { title: 'The Great Gatsby' },
      { $set: { price: 11.99 } }
    );
    console.log(`   Modified ${updateResult.modifiedCount} document(s)`);

    // Verify the update
    const updatedBook = await collection.findOne({ title: 'The Great Gatsby' });
    console.log(`   New price: $${updatedBook.price}`);

    // 5. Delete a book by its title
    console.log('\n5. Deleting "Moby Dick"...');
    const deleteResult = await collection.deleteOne({ title: 'Moby Dick' });
    console.log(`   Deleted ${deleteResult.deletedCount} document(s)`);

    // ===== TASK 3: Advanced Queries =====
    console.log('\n\n=== TASK 3: Advanced Queries ===\n');

    // 1. Find books that are both in stock and published after 2000
    console.log('1. Books in stock and published after 2000:');
    const inStockRecent = await collection.find({
      in_stock: true,
      published_year: { $gt: 2000 }
    }).toArray();
    inStockRecent.forEach(book => {
      console.log(`   - "${book.title}" by ${book.author} (${book.published_year})`);
    });

    // 2. Use projection to return only specific fields
    console.log('\n2. Books with projection (title, author, price only):');
    const projectedBooks = await collection.find(
      { genre: 'Fantasy' },
      { projection: { title: 1, author: 1, price: 1, _id: 0 } }
    ).toArray();
    console.log(projectedBooks);

    // 3. Implement sorting (ascending and descending)
    console.log('\n3. Books sorted by price (ascending):');
    const booksAscending = await collection.find({})
      .sort({ price: 1 })
      .limit(5)
      .toArray();
    booksAscending.forEach(book => {
      console.log(`   - "${book.title}": $${book.price}`);
    });

    console.log('\n4. Books sorted by price (descending):');
    const booksDescending = await collection.find({})
      .sort({ price: -1 })
      .limit(5)
      .toArray();
    booksDescending.forEach(book => {
      console.log(`   - "${book.title}": $${book.price}`);
    });

    // 4. Implement pagination (5 books per page)
    console.log('\n5. Pagination - Page 1 (books 1-5):');
    const page1 = await collection.find({})
      .sort({ title: 1 })
      .limit(5)
      .skip(0)
      .toArray();
    page1.forEach((book, index) => {
      console.log(`   ${index + 1}. "${book.title}"`);
    });

    console.log('\n6. Pagination - Page 2 (books 6-10):');
    const page2 = await collection.find({})
      .sort({ title: 1 })
      .limit(5)
      .skip(5)
      .toArray();
    page2.forEach((book, index) => {
      console.log(`   ${index + 1}. "${book.title}"`);
    });

    // ===== TASK 4: Aggregation Pipeline =====
    console.log('\n\n=== TASK 4: Aggregation Pipeline ===\n');

    // 1. Average price by genre
    console.log('1. Average price by genre:');
    const avgPriceByGenre = await collection.aggregate([
      {
        $group: {
          _id: '$genre',
          averagePrice: { $avg: '$price' },
          bookCount: { $sum: 1 }
        }
      },
      {
        $sort: { averagePrice: -1 }
      }
    ]).toArray();
    avgPriceByGenre.forEach(genre => {
      console.log(`   - ${genre._id}: $${genre.averagePrice.toFixed(2)} (${genre.bookCount} books)`);
    });

    // 2. Author with the most books
    console.log('\n2. Author with most books:');
    const authorMostBooks = await collection.aggregate([
      {
        $group: {
          _id: '$author',
          bookCount: { $sum: 1 },
          books: { $push: '$title' }
        }
      },
      {
        $sort: { bookCount: -1 }
      },
      {
        $limit: 3
      }
    ]).toArray();
    authorMostBooks.forEach(author => {
      console.log(`   - ${author._id}: ${author.bookCount} books`);
      console.log(`     Books: ${author.books.join(', ')}`);
    });

    // 3. Books grouped by publication decade
    console.log('\n3. Books by publication decade:');
    const booksByDecade = await collection.aggregate([
      {
        $project: {
          title: 1,
          published_year: 1,
          decade: {
            $subtract: [
              '$published_year',
              { $mod: ['$published_year', 10] }
            ]
          }
        }
      },
      {
        $group: {
          _id: '$decade',
          bookCount: { $sum: 1 },
          books: { $push: { title: '$title', year: '$published_year' } }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]).toArray();
    booksByDecade.forEach(decade => {
      console.log(`   - ${decade._id}s: ${decade.bookCount} books`);
    });

    // ===== TASK 5: Indexing =====
    console.log('\n\n=== TASK 5: Indexing ===\n');

    // 1. Create index on title field
    console.log('1. Creating index on title field...');
    await collection.createIndex({ title: 1 });
    console.log('   Index created on title field');

    // 2. Create compound index on author and published_year
    console.log('\n2. Creating compound index on author and published_year...');
    await collection.createIndex({ author: 1, published_year: -1 });
    console.log('   Compound index created on author and published_year');

    // 3. Demonstrate performance improvement with explain()
    console.log('\n3. Performance comparison with explain():');

    // Without index (simulated by hinting no index)
    console.log('\n   Query without index (title search):');
    const withoutIndex = await collection.find({ title: '1984' })
      .explain('executionStats');
    console.log(`   Documents examined: ${withoutIndex.executionStats.totalDocsExamined}`);
    console.log(`   Execution time: ${withoutIndex.executionStats.executionTimeMillis}ms`);

    // With index
    console.log('\n   Query with index (title search):');
    const withIndex = await collection.find({ title: '1984' })
      .hint({ title: 1 })
      .explain('executionStats');
    console.log(`   Documents examined: ${withIndex.executionStats.totalDocsExamined}`);
    console.log(`   Execution time: ${withIndex.executionStats.executionTimeMillis}ms`);

    // List all indexes
    console.log('\n4. Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach((index, i) => {
      console.log(`   ${i + 1}. ${JSON.stringify(index.key)}`);
    });

  } catch (err) {
    console.error('Error occurred:', err);
  } finally {
    await client.close();
    console.log('\nConnection closed');
  }
}

// Run all queries
runQueries().catch(console.error);