const mockDb = {
  prepare: (sql) => {
    console.log('Preparing SQL:', sql);
    return {
      get: (...args) => {
        console.log('Executing .get() with args:', args);
        if (sql.includes('UPDATE Users SET credits = credits +')) return { credits: 100 + args[0] };
        if (sql.includes('UPDATE Users SET credits = credits -')) return { credits: 100 - args[0] };
        return { credits: 100 };
      },
      run: (...args) => {
        console.log('Executing .run() with args:', args);
        return { changes: 1 };
      }
    };
  },
  transaction: (fn) => {
    return (...args) => {
      console.log('Starting transaction');
      return fn(...args);
    };
  }
};

// Mock the db module before requiring server
require.cache[require.resolve('./db')] = {
  exports: mockDb
};

const { updateSingleUserCreditsTx } = require('./server');

console.log('--- Testing updateSingleUserCreditsTx ---');
const result = updateSingleUserCreditsTx('testuser', 10);
console.log('Result:', result);

if (result && result.credits === 110) {
  console.log('SUCCESS: updateSingleUserCreditsTx returned correct balance');
} else {
  console.log('FAILURE: updateSingleUserCreditsTx failed');
  process.exit(1);
}
