const oracledb = require('oracledb');
const path = require('path')
require('dotenv').config({path : path.resolve(__dirname, '../build-resource/wallet/.env')});

if (process.env.NODE_ORACLEDB_DRIVER_MODE === 'thick') {
    //Thick mode is apparently req here to utilize a TNS connection (including both OS's for group)
    let clientOpts = {};
    if (process.platform === 'win32') {                                   // Windows
      clientOpts = { libDir: 'C:\\oracle\\instantclient_19_17' };
      oracledb.initOracleClient(clientOpts);  // enable node-oracledb Thick mode
    } else if (process.platform === 'darwin' && process.arch === 'x64') { // macOS Intel
      clientOpts = { libDir: process.env.HOME + '/Downloads/instantclient_19_8' };
      oracledb.initOracleClient(clientOpts);  // enable node-oracledb Thick mode
    } else {
      oracledb.initOracleClient();
    }
    
}

const ezgrantPool = {
    user          : process.env.DB_USER,
    password      : process.env.DB_PASSWORD,
    connectString : process.env.CONNECT_STRING,
    externalAuth  : process.env.NODE_ORACLEDB_EXTERNALAUTH ? true : false,
}

async function initialize() {
    console.log("Connecting as user: " + ezgrantPool.user);
    try {
      await oracledb.createPool(ezgrantPool);
    }catch(e){
      console.log(e);
    }
    
}
  
module.exports.initialize = initialize;

async function insertGrantOpportunity(newEntry) {
    if(newEntry.link === null){ //must have a link field
        return;
    }

    let connection;
  
    try {
      // Create a connection to the Oracle database
      connection = await oracledb.getConnection();
  
      // Convert the ELIGIBILITY list to a PL/SQL VARRAY declaration
      const eligibilityArray = newEntry.eligibility.map(item => `'${item}'`).join(',');
  
      // PL/SQL anonymous block to insert values into the ELIGIBILITY VARRAY
      const plsqlBlock = `
        DECLARE
          eligibility_list ELIGIBLE_LIST := ELIGIBLE_LIST(${eligibilityArray});
        BEGIN
          INSERT INTO GRANTOPPORTUNITIES (NAME, LOCATION, LINK, AMOUNT, ABOUT, FREE, ELIGIBILITY, DEADLINE, ID)
          VALUES (:name, :location, :link, :amount, :about, :free, eligibility_list, :deadline, :id);
        EXCEPTION
          WHEN DUP_VAL_ON_INDEX THEN
            NULL; -- Ignore duplicate entry error
        END;
      `;
  
      // Bind the input values to the PL/SQL block
      const binds = {
        name: newEntry.name,
        location: newEntry.location,
        link: newEntry.link,
        amount: newEntry.amount,
        about: newEntry.about,
        free: newEntry.free,
        deadline: newEntry.deadline,
        id: newEntry.id
      };
  
      // Execute the PL/SQL block
      const result = await connection.execute(plsqlBlock, binds, { autoCommit: true });
  
    } catch (error) {
      // Check if the error is due to a duplicate entry
      if (error.errorNum === 1 && error.sqlState === '23000') {
        console.log('Duplicate entry: ignoring error.');
      } else {
        console.error('Error inserting into GRANTOPPORTUNITIES table:', error);
      }
    } finally {
      // Release the Oracle database connection
      if (connection) {
        try {
          await connection.close();
        } catch (error) {
          console.error('Error closing connection:', error);
        }
      }
    }
}

// Example usage:
const newGrantOpportunity = {
  name: 'New Opportunity',
  location: 'Some Location',
  link: 'https://example.com',
  amount: '10000',
  about: 'Description of the opportunity',
  free: 'Y',
  eligibility: ['Criteria1', 'Criteria2', 'Criteria3'],
  deadline: '2023-12-31'
};

module.exports.insertGrantOpportunity = insertGrantOpportunity;