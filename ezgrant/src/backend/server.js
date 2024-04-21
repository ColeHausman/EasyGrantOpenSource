const express = require('express');
const path = require('path')
var bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const dbConnect = require('./services/database-services');
const qp = require('./services/query-parser');
require('dotenv').config({path : path.resolve(__dirname, '../../build-resource/wallet/.env')});
const { v4: uuidv4 } = require('uuid'); // for generating unique IDs
const oracledb = require('oracledb');
const dbConfig = require('dbconfig');
const { connect } = require('http2');

const columns = 'NAME, LOCATION, LINK, AMOUNT, ABOUT, FREE, ELIGIBILITY, DEADLINE'

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

const app = express();
const port = 4000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = app.listen(port, async () => {
  await dbConnect.close();  // avoid any pool cache issues
  console.log(`Listening on port ${port}`);
  await oracledb.createPool(dbConfig.ezgrantPool);
});

const credentials = {
  uname: "BucknellVoice",
  password: ""
}
const SALT_ROUNDS = 10;

bcrypt.hash(process.env.AUTH_PASSWORD, SALT_ROUNDS, function(err, hash) {
  credentials.password = hash;
});

app.post('/api/database', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    if(req.body.post === ''){
      const sql = `SELECT ${columns} FROM GRANTOPPORTUNITIES ORDER BY
      CASE
        WHEN DEADLINE IS NOT NULL AND TO_DATE(DEADLINE, 'Month DD, YYYY', 'NLS_DATE_LANGUAGE=ENGLISH') >= SYSDATE
          THEN TO_DATE(DEADLINE, 'Month DD, YYYY', 'NLS_DATE_LANGUAGE=ENGLISH') - SYSDATE
        ELSE TO_DATE('9999-12-31', 'YYYY-MM-DD') - SYSDATE
      END NULLS LAST,
      ABS(
        CASE
          WHEN DEADLINE IS NOT NULL THEN TO_DATE(DEADLINE, 'Month DD, YYYY', 'NLS_DATE_LANGUAGE=ENGLISH') - SYSDATE
          ELSE TO_DATE('9999-12-31', 'YYYY-MM-DD') - SYSDATE
        END
      ) NULLS LAST`;
      // Execute the SQL query
      const options = { outFormat: oracledb.OUT_FORMAT_OBJECT };
      const grants = await connection.execute(sql, [], options);
      // Log the result and send the response
      res.send({ express: grants.rows });
    }
    else{
      // Extract features, generate SQL, and get binds
      const features = await qp.extractFeatures(req.body.post);
      const sql = qp.generate_query(features);
      const binds = qp.get_binds(features);
      // Execute the SQL query
      const options = { outFormat: oracledb.OUT_FORMAT_OBJECT };
      const retval = await connection.execute(sql, binds, options);

      // Log the result and send the response
      res.send({ express: retval.rows });
      //await dbConnect.close();
    }
  } catch (err) {
    // Log and handle errors
    console.error(err);
    console.error(err.stack);
    res.status(500).send({ error: 'Internal Server Error' });
  } finally {
    if (connection) {
      try {
        // Release the connection back to the connection pool
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

app.post('/api/login', async (req, res) => {
  bcrypt.compare(req.body.post[1], credentials.password).then((result)=>{
    const attempt_results = {
      match_username: req.body.post[0] === credentials.uname,
      match_password: result
    }
    res.send({express: attempt_results});
  });
});

// Endpoint to add a grant to the queue
app.post('/api/addToGrantQueue', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const grant = req.body;
    grant.id = uuidv4();

    const eligibilityArray = grant.ELIGIBILITY ? grant.ELIGIBILITY.map(item => `'${item}'`).join(',') : '';
    const sql = `
      DECLARE
        eligibility_list ELIGIBLE_LIST := ELIGIBLE_LIST(${eligibilityArray});
      BEGIN
        INSERT INTO USERSUBMITTEDGRANTS (NAME, LOCATION, LINK, AMOUNT, ABOUT, FREE, ELIGIBILITY, DEADLINE, TIME, ID)
        VALUES (:name, :location, :link, :amount, :about, :free, eligibility_list, :deadline, :dateSubmitted, :id);
      EXCEPTION
        WHEN DUP_VAL_ON_INDEX THEN
          NULL; -- Ignore duplicate entry error
      END;
    `;

    // Bind the input values to the PL/SQL block
    const binds = {
      name: grant.NAME,
      location: grant.LOCATION,
      link: grant.LINK,
      amount: grant.AMOUNT,
      about: grant.ABOUT,
      free: grant.FREE,
      deadline: grant.DEADLINE,
      dateSubmitted: grant.DATESUBMITTED,
      id: grant.id
    };

    // Execute the SQL query
    const options = { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: true };
    const add = await connection.execute(sql, binds, options);
    res.status(200).send({ message: 'Grant added to queue' });
  } catch (err) {
    // Log and handle errors
    console.error(err);
    res.status(500).send({ error: 'Internal Server Error' });
  } finally {
    if (connection) {
      try {
        // Release the connection back to the connection pool
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

// Endpoint to add a grant to the main database
app.post('/api/addToDatabase', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const grant = req.body;

    const eligibilityArray = grant.ELIGIBILITY ? grant.ELIGIBILITY.map(item => `'${item}'`).join(',') : '';
    const sql = `
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
      name: grant.NAME,
      location: grant.LOCATION,
      link: grant.LINK,
      amount: grant.AMOUNT,
      about: grant.DESCRIPTION,
      free: grant.FREE,
      deadline: grant.DEADLINE,
      id: grant.ID
    };

    // Execute the SQL query
    const options = { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: true };
    const add = await connection.execute(sql, binds, options);
    res.status(200).send({ message: 'Grant added to main database' });
  } catch (err) {
    // Log and handle errors
    console.error(err);
    res.status(500).send({ error: 'Internal Server Error' });
  } finally {
    if (connection) {
      try {
        // Release the connection back to the connection pool
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

// Endpoint to get the grant queue
app.get('/api/getGrantQueue', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const sql = `SELECT * FROM USERSUBMITTEDGRANTS ORDER BY TO_TIMESTAMP_TZ(TIME, 'YYYY-MM-DD"T"HH24:MI:SS-TZH:TZM') ASC`;
    // Execute the SQL query
    const options = { outFormat: oracledb.OUT_FORMAT_OBJECT };
    const grants = await connection.execute(sql, [], options);
    // Log the result and send the response
    res.json(grants.rows);
    //await dbConnect.close();
  } catch (err) {
    // Log and handle errors
    console.error(err);
    res.status(500).send({ error: 'Internal Server Error' });
  } finally {
    if (connection) {
      try {
        // Release the connection back to the connection pool
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});


// endpoint to get the main database
app.get('/api/getMainGrantQueue', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const sql = `SELECT ${columns} FROM GRANTOPPORTUNITIES ORDER BY
    CASE
      WHEN DEADLINE IS NOT NULL AND TO_DATE(DEADLINE, 'Month DD, YYYY', 'NLS_DATE_LANGUAGE=ENGLISH') >= SYSDATE
        THEN TO_DATE(DEADLINE, 'Month DD, YYYY', 'NLS_DATE_LANGUAGE=ENGLISH') - SYSDATE
      ELSE TO_DATE('9999-12-31', 'YYYY-MM-DD') - SYSDATE
    END NULLS LAST,
    ABS(
      CASE
        WHEN DEADLINE IS NOT NULL THEN TO_DATE(DEADLINE, 'Month DD, YYYY', 'NLS_DATE_LANGUAGE=ENGLISH') - SYSDATE
        ELSE TO_DATE('9999-12-31', 'YYYY-MM-DD') - SYSDATE
      END
    ) NULLS LAST`;
    // Execute the SQL query
    const options = { outFormat: oracledb.OUT_FORMAT_OBJECT };
    const grants = await connection.execute(sql, [], options);
    // Log the result and send the response
    res.send({ express: grants.rows });
    //await dbConnect.close();
  } catch (err) {
    // Log and handle errors
    console.error(err);
    res.status(500).send({ error: 'Internal Server Error' });
  } finally {
    if (connection) {
      try {
        // Release the connection back to the connection pool
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

// endpoint to get the main database including IDs, only for admin
app.get('/api/getMainGrantQueueWithID', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const sql = `SELECT ${columns}, ID FROM GRANTOPPORTUNITIES ORDER BY
    CASE
      WHEN DEADLINE IS NOT NULL AND TO_DATE(DEADLINE, 'Month DD, YYYY', 'NLS_DATE_LANGUAGE=ENGLISH') >= SYSDATE
        THEN TO_DATE(DEADLINE, 'Month DD, YYYY', 'NLS_DATE_LANGUAGE=ENGLISH') - SYSDATE
      ELSE TO_DATE('9999-12-31', 'YYYY-MM-DD') - SYSDATE
    END NULLS LAST,
    ABS(
      CASE
        WHEN DEADLINE IS NOT NULL THEN TO_DATE(DEADLINE, 'Month DD, YYYY', 'NLS_DATE_LANGUAGE=ENGLISH') - SYSDATE
        ELSE TO_DATE('9999-12-31', 'YYYY-MM-DD') - SYSDATE
      END
    ) NULLS LAST`;
    // Execute the SQL query
    const options = { outFormat: oracledb.OUT_FORMAT_OBJECT };
    const grants = await connection.execute(sql, [], options);
    // Log the result and send the response
    res.send({ express: grants.rows });
    //await dbConnect.close();
  } catch (err) {
    // Log and handle errors
    console.error(err);
    res.status(500).send({ error: 'Internal Server Error' });
  } finally {
    if (connection) {
      try {
        // Release the connection back to the connection pool
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

app.post('/api/getGrantByID', async (req, res) => {
  let connection;
  try{
    connection = await oracledb.getConnection();
    const mode = req.body.post[0];
    const id = req.body.post[1];
    const binds = {
      id: id
    };
    const options = { outFormat: oracledb.OUT_FORMAT_OBJECT };
    const db = mode === 'userQueue' ? 'USERSUBMITTEDGRANTS' : 'GRANTOPPORTUNITIES';
    const grant = await connection.execute(`SELECT * FROM ${db} WHERE ID = :id FETCH FIRST 1 ROW ONLY`, binds, options);
    res.json(grant.rows[0]);
    
  }catch(e){
    console.log("Error while fetching: ", e);
  }finally {
    if (connection) {
      try {
        // Release the connection back to the connection pool
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
  
});

function formatDate(inputDate) {
  if(!inputDate){
    return '';
  }
  const dateObject = new Date(inputDate);
  const options = { month: 'long', day: 'numeric', year: 'numeric' };
  return dateObject.toLocaleDateString('en-US', options);
}

app.post('/api/modifyGrantByID', async (req, res) => {
  let connection;
  try{
    connection = await oracledb.getConnection();
    const mode = req.body.post[0];
    const grant = req.body.post[1];
    const db = mode === 'userQueue' ? 'USERSUBMITTEDGRANTS' : 'GRANTOPPORTUNITIES';

    const eligibilityArray = grant.ELIGIBILITY.map(item => `'${item}'`).join(',');
    grant.DEADLINE = formatDate(grant.DEADLINE);
    const sql = `
      UPDATE ${db}
      SET
        ABOUT = :about,
        AMOUNT = :amount,
        DEADLINE = :deadline,
        ELIGIBILITY = ELIGIBLE_LIST(${eligibilityArray}),
        FREE = :free,
        LINK = :link,
        LOCATION = :location,
        NAME = :name
      WHERE ID = :id
    `;

    const binds = {
      about: grant.ABOUT,
      amount: grant.AMOUNT,
      deadline: grant.DEADLINE,
      free: grant.FREE,
      link: grant.LINK,
      location: grant.LOCATION,
      name: grant.NAME,
      id: grant.ID,
    };
    const modOptions = { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: true }
    const options = { outFormat: oracledb.OUT_FORMAT_OBJECT };

    const result = await connection.execute(sql, binds, modOptions);

    console.log('Rows updated:', result.rowsAffected);

    const fetchSql = mode === 'userQueue' ? `SELECT * FROM ${db} ORDER BY TO_TIMESTAMP_TZ(TIME, 'YYYY-MM-DD"T"HH24:MI:SS-TZH:TZM') ASC` : `SELECT * FROM ${db} ORDER BY
    CASE
      WHEN DEADLINE IS NOT NULL AND TO_DATE(DEADLINE, 'Month DD, YYYY', 'NLS_DATE_LANGUAGE=ENGLISH') >= SYSDATE
        THEN TO_DATE(DEADLINE, 'Month DD, YYYY', 'NLS_DATE_LANGUAGE=ENGLISH') - SYSDATE
      ELSE TO_DATE('9999-12-31', 'YYYY-MM-DD') - SYSDATE
    END NULLS LAST,
    ABS(
      CASE
        WHEN DEADLINE IS NOT NULL THEN TO_DATE(DEADLINE, 'Month DD, YYYY', 'NLS_DATE_LANGUAGE=ENGLISH') - SYSDATE
        ELSE TO_DATE('9999-12-31', 'YYYY-MM-DD') - SYSDATE
      END
    ) NULLS LAST`;
    const grants = await connection.execute(fetchSql, [], options);
    res.json(grants.rows);
  } catch (error) {
    console.error('Error updating grant in database:', error);
  } finally {
    if (connection) {
      try {
        // Release the connection back to the connection pool
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});


// Endpoint to remove a grant from the queue by ID
app.post('/api/removeFromGrantQueue/', async (req, res) => {
  let connection;
  try{
    connection = await oracledb.getConnection();
    const mode = req.body.post[0];
    const id = req.body.post[1];
    const db = mode === 'userQueue' ? 'USERSUBMITTEDGRANTS' : 'GRANTOPPORTUNITIES';

    const sql = `DELETE FROM ${db} WHERE ID = :id`;

    const binds = {
      id: id
    };

    const options = { outFormat: oracledb.OUT_FORMAT_OBJECT };
    
    const del = await connection.execute(sql, binds, { autoCommit: true });

    const fetchSql = mode === 'userQueue' ? `SELECT * FROM ${db} ORDER BY TO_TIMESTAMP_TZ(TIME, 'YYYY-MM-DD"T"HH24:MI:SS-TZH:TZM') ASC` : `SELECT * FROM ${db} ORDER BY
    CASE
      WHEN DEADLINE IS NOT NULL AND TO_DATE(DEADLINE, 'Month DD, YYYY', 'NLS_DATE_LANGUAGE=ENGLISH') >= SYSDATE
        THEN TO_DATE(DEADLINE, 'Month DD, YYYY', 'NLS_DATE_LANGUAGE=ENGLISH') - SYSDATE
      ELSE TO_DATE('9999-12-31', 'YYYY-MM-DD') - SYSDATE
    END NULLS LAST,
    ABS(
      CASE
        WHEN DEADLINE IS NOT NULL THEN TO_DATE(DEADLINE, 'Month DD, YYYY', 'NLS_DATE_LANGUAGE=ENGLISH') - SYSDATE
        ELSE TO_DATE('9999-12-31', 'YYYY-MM-DD') - SYSDATE
      END
    ) NULLS LAST`;
    const grants = await connection.execute(fetchSql, [], options);
    res.json(grants.rows);
  } catch (error) {
    console.error('Error updating grant in database:', error);
  } finally {
    if (connection) {
      try {
        // Release the connection back to the connection pool
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});


process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)

function gracefulShutdown (signal) {
  if (signal) console.log(`\nReceived signal ${signal}`);
  console.log('Closing http server');

  try {
    server.close(function (err) {
      if (err) {
        console.error('There was an error', err.message)
        process.exit(1)
      } else {
        console.log('http server closed successfully. Exiting!')
        process.exit(0)
      }
    })
  } catch (err) {
    console.error('There was an error', err.message)
    setTimeout(() => process.exit(1), 500)
  }

}

function calculateScore(row, features) {
  let score = 0;

  // Preprocess location values
  const location = row.LOCATION ? row.LOCATION.toLowerCase() : '';
  const featuresLocation = features.location.toLowerCase();
  const stateMapping = stateMappings[features.location.toUpperCase()];

  if (location) {
    if (location === featuresLocation) {
      score += 2;
      return score;
    } else if (location.includes(featuresLocation) || location.includes(stateMapping)) {
      score += 1;
    }

    if (features.leftoverMatchers.some(tag => location.includes(tag.toUpperCase()))) {
      score += 1;
    }
  }

  if (!row.ELIGIBILITY) {
    return score;
  }

  // Check if eligibility exists before executing regex
  const eligibilityArray = [];
  const regex = /'([^']+)'|(\w+)/g;

  let match;
  while ((match = regex.exec(row.ELIGIBILITY)) !== null) {
    const value = (match[1] || match[2])?.toUpperCase();
    if (value) {
      eligibilityArray.push(value);
    }
  }

  // Use sets for faster lookup
  const tagsSet = new Set(features.tags);
  const leftoverMatchersSet = new Set(features.leftoverMatchers);

  // Increase score for matching tags with eligibility
  for (const eligibilityTag of eligibilityArray) {
    if (tagsSet.has(eligibilityTag)) {
      score += 1;
    }
    if (leftoverMatchersSet.has(eligibilityTag)) {
      score += 1;
    }
  }

  return score;
}

const stateMappings = {
  'ALABAMA': 'AL',
  'ALASKA': 'AK',
  'ARIZONA': 'AZ',
  'ARKANSAS': 'AR',
  'CALIFORNIA': 'CA',
  'COLORADO': 'CO',
  'CONNECTICUT': 'CT',
  'DELAWARE': 'DE',
  'FLORIDA': 'FL',
  'GEORGIA': 'GA',
  'HAWAII': 'HI',
  'IDAHO': 'ID',
  'ILLINOIS': 'IL',
  'INDIANA': 'IN',
  'IOWA': 'IA',
  'KANSAS': 'KS',
  'KENTUCKY': 'KY',
  'LOUISIANA': 'LA',
  'MAINE': 'ME',
  'MARYLAND': 'MD',
  'MASSACHUSETTS': 'MA',
  'MICHIGAN': 'MI',
  'MINNESOTA': 'MN',
  'MISSISSIPPI': 'MS',
  'MISSOURI': 'MO',
  'MONTANA': 'MT',
  'NEBRASKA': 'NE',
  'NEVADA': 'NV',
  'NEW HAMPSHIRE': 'NH',
  'NEW JERSEY': 'NJ',
  'NEW MEXICO': 'NM',
  'NEW YORK': 'NY',
  'NORTH CAROLINA': 'NC',
  'NORTH DAKOTA': 'ND',
  'OHIO': 'OH',
  'OKLAHOMA': 'OK',
  'OREGON': 'OR',
  'PENNSYLVANIA': 'PA',
  'RHODE ISLAND': 'RI',
  'SOUTH CAROLINA': 'SC',
  'SOUTH DAKOTA': 'SD',
  'TENNESSEE': 'TN',
  'TEXAS': 'TX',
  'UTAH': 'UT',
  'VERMONT': 'VT',
  'VIRGINIA': 'VA',
  'WASHINGTON': 'WA',
  'WEST VIRGINIA': 'WV',
  'WISCONSIN': 'WI',
  'WYOMING': 'WY'
};
