const oracledb = require('oracledb');
const natural = require('natural');
const nlp = require('compromise');
const datePlugin = require('compromise-dates');
nlp.plugin(datePlugin);

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

const numRows = 5;

const {
  moreThanExpressions, 
  lessThanExpressions, 
 } = require('./keywords');
const { delimiter } = require('path');

const SCHEMA = "POSTSVC"
const TABLE = "GRANTOPPORTUNITIES"

function generateSubstrings(inputString) {
  const substrings = [];
  const words = inputString.split(' ').filter(word => word.trim() !== ''); // Filter out empty words
  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j <= words.length; j++) {
      const substr = words.slice(i, j).join(' ');
      // Potential titles must have at least one Noun
      if(nlp(substr).has('#Noun')){
        substrings.push(substr)
      }
    }
  }
  return substrings;
}

function containsAnyWord(inputString, wordArray) {
  const regex = new RegExp(wordArray.join("|"), "i");
  return regex.test(inputString);
}

async function extractFeatures(input) {
  input = input.trim().toUpperCase();
  const features = {
    amount: null,
    location: null,
    deadline: null,
    secondaryDeadline: null, //used for feature conflicts
    tags: null,
    leftoverMatchers: null,
  }
  let doc_query = nlp(input);

  //Find all possible amount comparisons
  if(doc_query.has('not #Noun #Preposition #Value')){
    features.amount = `>= ${await doc_query.match('not #Noun #Preposition #Value').text().match(/\d+(\.\d+)?/)[0]}`;
    input = input.replace(doc_query.match('not #Noun #Preposition #Value').text(), "");
  }
  else if(doc_query.has('not #Adverb #Preposition #Value')){
    features.amount = `<= ${await doc_query.match('not #Adverb #Preposition #Value').text().match(/\d+(\.\d+)?/)[0]}`;
    input = input.replace(doc_query.match('not #Adverb #Preposition #Value').text(), "");
  }
  else if(doc_query.has('not #Adjective #Preposition #Value')){
    const feature = await doc_query.match('not #Adjective #Preposition #Value').text();
    if (containsAnyWord(feature, lessThanExpressions)) {
      features.amount = `>= ${feature.match(/\d+(\.\d+)?/)[0]}`;
    }else if (containsAnyWord(feature, moreThanExpressions)){
      features.amount = `<= ${feature.match(/\d+(\.\d+)?/)[0]}`;
    }
    input = input.replace(doc_query.match('not #Adjective #Preposition #Value').text(), "");
  }
  else if(doc_query.has('not #Adjective #Value')){
    const feature = await doc_query.match('not #Adjective #Value').text();
    if (containsAnyWord(feature, lessThanExpressions)) {
      features.amount = `>= ${feature.match(/\d+(\.\d+)?/)[0]}`;
    }else if (containsAnyWord(feature, moreThanExpressions)){
      features.amount = `<= ${feature.match(/\d+(\.\d+)?/)[0]}`;
    }
    input = input.replace(doc_query.match('not #Adjective #Value').text(), "");
  }
  else if(doc_query.has('not #Conjunction #Conjunction #Conjunction #Value')){
    const feature = await doc_query.match('not #Conjunction #Conjunction #Conjunction #Value').text();
    if (containsAnyWord(feature, lessThanExpressions)) {
      features.amount = `>= ${feature.match(/\d+(\.\d+)?/)[0]}`;
    }else if (containsAnyWord(feature, moreThanExpressions)){
      features.amount = `<= ${feature.match(/\d+(\.\d+)?/)[0]}`;
    }
    input = input.replace(doc_query.match('not #Conjunction #Conjunction #Conjunction #Value').text(), "");
  }
  else if(doc_query.has('#Conjunction #Conjunction #Conjunction #Value')){
    const feature = await doc_query.match('#Conjunction #Conjunction #Conjunction #Value').text();
    if (containsAnyWord(feature, lessThanExpressions)) {
      features.amount = `<= ${feature.match(/\d+(\.\d+)?/)[0]}`;
    }else if (containsAnyWord(feature, moreThanExpressions)){
      features.amount = `>= ${feature.match(/\d+(\.\d+)?/)[0]}`;
    }
    input = input.replace(doc_query.match('#Conjunction #Conjunction #Conjunction #Value').text(), "");
  }
  else if(doc_query.has('#Adjective #Value')){
    const feature = await doc_query.match('#Adjective #Value').text();
    if (containsAnyWord(feature, lessThanExpressions)) {
      features.amount = `<= ${feature.match(/\d+(\.\d+)?/)[0]}`;
    }else if (containsAnyWord(feature, moreThanExpressions)){
      features.amount = `>= ${feature.match(/\d+(\.\d+)?/)[0]}`;
    }
    input = input.replace(doc_query.match('#Adjective #Value').text(), "");
  }
  else if(doc_query.has('#Adjective #Preposition #Value')){
    const feature = await doc_query.match('#Adjective #Preposition #Value').text();
    if (containsAnyWord(feature, lessThanExpressions)) {
      features.amount = `<= ${feature.match(/\d+(\.\d+)?/)[0]}`;
    }else if (containsAnyWord(feature, moreThanExpressions)){
      features.amount = `>= ${feature.match(/\d+(\.\d+)?/)[0]}`;
    }
    input = input.replace(doc_query.match('#Adjective #Preposition #Value').text(), "");
  }
  else if(doc_query.has('#Adverb #Preposition #Value')){
    features.amount = `> ${await doc_query.match('#Adverb #Preposition #Value').text().match(/\d+(\.\d+)?/)[0]}`;
    input = input.replace(doc_query.match('#Adverb #Preposition #Value').text(), "");
  }
  else if(doc_query.has('#Noun #Preposition #Value')){
    features.amount = `< ${await doc_query.match('#Noun #Preposition #Value').text().match(/\d+(\.\d+)?/)[0]}`;
    input = input.replace(doc_query.match('#Noun #Preposition #Value').text(), "");
  }
  else if(doc_query.has('at least #Value')){
    features.amount = `>= ${await doc_query.match('at least #Value').text().match(/\d+(\.\d+)?/)[0]}`;
    input = input.replace(doc_query.match('at least #Value').text(), "");
  }
  else if(doc_query.has('#Value')){
    features.amount = `>= ${doc_query.match('#Value').text().match(/\d+(\.\d+)?/)[0]}`;
    //dont replace input as lone amount could be part of another field
  }

  doc_query = nlp(input);
  features.location = await doc_query.places().text(); // Find location

  if(doc_query.has('AFTER #Date')){
    const date = doc_query.dates().format('yyyy-mm-dd').text();
    features.deadline = ['>=', date.split(' to ').length > 1 ? date.split(' to ')[1] : date];
  }
  else if(doc_query.has('#Date')){
    const date = doc_query.dates().format('yyyy-mm-dd').text();
    features.deadline = ['<=', date.split(' to ').length > 1 ? date.split(' to ')[1] : date];
  }

  if(features.deadline && features.amount){ //amount can be ambiguous with year
    const date = doc_query.dates().format('yyyy-mm-dd').text();
    const inputDate = new Date(date[1]);
    const currentDate = new Date();
    if (inputDate.getMonth() < currentDate.getMonth() || 
        (inputDate.getMonth() === currentDate.getMonth() && inputDate.getDate() < currentDate.getDate())) {
      inputDate.setFullYear(currentDate.getFullYear() + 1);
    } else {
      // If the input month is yet to happen, keep the current year
      inputDate.setFullYear(currentDate.getFullYear());
    }
    
    // Format the updated date as 'yyyy-mm-dd'
    const updatedDateString = inputDate.toISOString().slice(0, 10);
    features.secondaryDeadline = updatedDateString;
  }

  //input = input.replace(features.location, "");
  input = input.replace(features.deadline, "");
  doc_query = nlp(input);

  // Extract potential tags like Dancer, doesnt matter if tags dont make sense, they dont all have to match
  features.tags = doc_query.match('#Adjective? #Noun? #Verb? or? and?').text().split(/\s+/).filter(function(word) {
    return word !== "and" && word !== "or" && !nlp(word).places().text() && !nlp(word).match('#Date').text();
  });
  features.leftoverMatchers = generateSubstrings(doc_query.text());
  return features;
}

module.exports.extractFeatures = extractFeatures

function extractStateAbbreviation(text) {
  const normalizedText = text.trim(); // Remove leading/trailing spaces
  for (const state in stateMappings) {
    if (normalizedText.includes(state)) {
      return stateMappings[state];
    }
  }
  return null; // Return null if no match is found
}

function get_binds(features){
    phrases = features.leftoverMatchers;
    const bind_array = phrases.map((value, idx) => {
      if(value.charAt(0) === '-'){
        value = value.substring(1);
      }
      let bind = {}
      bind[`keyword${idx}`] 
      = { dir: oracledb.BIND_IN, val: `%${value}%`, type: oracledb.STRING }
      return bind;
    });
    const binds = bind_array.reduce((accumulator, currentObject) => {
      // Extract the key from the current object
      const key = Object.keys(currentObject)[0];
      // Merge the current object into the accumulator with the extracted key
      accumulator[key] = currentObject[key];
      return accumulator;
    }, {});

    if(features.tags){
      features.tags.filter(tag => tag !== '').forEach((tag, idx) => {
        binds[`tag${idx}`] = { dir: oracledb.BIND_IN, val: `%${tag}%`, type: oracledb.STRING }
      });
    }
    

    if(features.amount){
      const regex = /([><=]+)\s*([\d.]+)/;
      const match = features.amount.match(regex);
      binds.amount = { dir: oracledb.BIND_IN, val: parseFloat(match[2]), type: oracledb.NUMBER };
    }
    if(features.location){
      binds.location = { dir: oracledb.BIND_IN, val: `%${features.location}%`, type: oracledb.STRING };
      if (extractStateAbbreviation(features.location)){
        binds.stateAbbrev = 
        { dir: oracledb.BIND_IN, val: `${extractStateAbbreviation(features.location)}`, type: oracledb.STRING };
      }
    }
    if(features.deadline){
      binds.deadline = { dir: oracledb.BIND_IN, val: `${features.deadline[1]}`, type: oracledb.STRING };
      if(features.deadline.length > 2){
        binds.start_deadline = { dir: oracledb.BIND_IN, val: `${features.deadline[2]}`, type: oracledb.STRING };
      }
    }
    if(features.secondaryDeadline){
      binds.secondaryDeadline = { dir: oracledb.BIND_IN, val: `${features.secondaryDeadline}`, type: oracledb.STRING };
    }
    return binds;
}

module.exports.get_binds = get_binds;


const conditional_and = () => { return ` AND `; }
const conditional_or = () => { return ` OR `; }
const variable_delimeter = (conditional) => { return ')' + conditional + '(' }
const inflectional = (column, value) => { return `UPPER(${column}) LIKE :keyword${value}` }
const negate_inflectional = (column, value) => { return `UPPER(${column}) NOT LIKE :keyword${value}` }
const convertSQLDate = () => {
  return `CASE
  WHEN REGEXP_SUBSTR(UPPER(DEADLINE), 'JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER', 1, 1, 'i') IS NOT NULL
  THEN TO_DATE(TO_CHAR(TO_DATE(DEADLINE, 'Month DD, YYYY', 'NLS_DATE_LANGUAGE=ENGLISH'), 'YYYY-MM-DD'), 'YYYY-MM-DD')
  ELSE NULL
END`;
};

/*
Generates an Oracle SQL query based on extraced features from user search
*/
function generate_query(features){
  let amountCase ='';
  let locationCase='';
  let tagCase='';
  let leftoverCase='';
  let restrictives = [];
  if(features.secondaryDeadline){ //then we have an amount and a deadline which can conflict
    const regex = /([><=]+)\s*([\d.]+)/;
    const match = features.amount.match(regex);
    restrictives.push(`((AMOUNT IS NOT NULL 
      AND TO_NUMBER(REGEXP_REPLACE(AMOUNT, '[^0-9]+', '')) ${match[1]} :amount AND 
      ${convertSQLDate()} ${features.deadline[0]} TO_DATE(:deadline, 'YYYY-MM-DD')) OR 
      ${convertSQLDate()} <= TO_DATE(:secondaryDeadline, 'YYYY-MM-DD'))`);
      amountCase = `CASE
      WHEN TO_NUMBER(REGEXP_REPLACE(AMOUNT, '[^0-9]+', '')) >= :amount THEN 1
      ELSE 0
    END +`
  }else{
    if (features.amount){
      const regex = /([><=]+)\s*([\d.]+)/;
      const match = features.amount.match(regex);
      restrictives.push(`AMOUNT IS NOT NULL 
      AND TO_NUMBER(REGEXP_REPLACE(AMOUNT, '[^0-9]+', '')) ${match[1]} :amount`);
      amountCase = `CASE
      WHEN TO_NUMBER(REGEXP_REPLACE(AMOUNT, '[^0-9]+', '')) >= :amount THEN 1
      ELSE 0
    END +`
    }

    if (features.deadline){
      if(features.deadline.length > 2){
        restrictives.push(`${convertSQLDate()} BETWEEN TO_DATE(:start_deadline, 'YYYY-MM-DD') AND TO_DATE(:deadline, 'YYYY-MM-DD')`)
      }else{
        restrictives.push(`${convertSQLDate()} ${features.deadline[0]} TO_DATE(:deadline, 'YYYY-MM-DD')`)
      }
    }
    
  }
  
  if(features.location && extractStateAbbreviation(features.location)){ // if a location has a state
      restrictives.push(`(UPPER(LOCATION) LIKE :location
      OR UPPER(LOCATION) LIKE :stateAbbrev || ' %'
      OR UPPER(LOCATION) LIKE '%, ' || :stateAbbrev || ' %'
      OR UPPER(LOCATION) LIKE '%, ' || :stateAbbrev
      OR UPPER(LOCATION) LIKE '%(' || :stateAbbrev || ')'
      OR UPPER(LOCATION) LIKE '% ' || :stateAbbrev || ')'
      OR UPPER(LOCATION) LIKE '% ' || :stateAbbrev || ',%'
      OR UPPER(LOCATION) = :stateAbbrev)`);
      locationCase = `CASE
      WHEN UPPER(LOCATION) LIKE :location THEN 1
      ELSE 0
    END +`
  }
  else if (features.location){
    restrictives.push(`UPPER(LOCATION) LIKE :location`);
    locationCase = `CASE
    WHEN UPPER(LOCATION) LIKE :location THEN 1
    ELSE 0
  END +`
  } 

  features.tags = features.tags.filter(tag => tag !== '');
  let eligibilitySQL = '';
  if(features.tags.length > 0){
    const tagSQL = features.tags
    .map((tag, index) => `
  UPPER(COLUMN_VALUE) LIKE :tag${index}
  `
  )
  .join(' OR ');
  
  eligibilitySQL = `
      EXISTS (
        SELECT 1
        FROM TABLE(CAST(ELIGIBILITY AS POSTSVC.ELIGIBLE_LIST)) el
        WHERE ${tagSQL}
      )
    `;
  
    tagCase = features.tags.filter(tag => tag !== '').map((tag, idx) => 
    `CASE
    WHEN EXISTS (SELECT 1 FROM TABLE(CAST(ELIGIBILITY AS POSTSVC.ELIGIBLE_LIST)) el WHERE UPPER(COLUMN_VALUE) LIKE :tag${idx}) THEN 2
    ELSE 0
    END +`
    ).join(' ');
}
  
  const preQuery = restrictives.length > 0 ? restrictives.join(' OR ') : '';
  const finalQuery = preQuery + (preQuery && eligibilitySQL ? ' OR ' : '') + eligibilitySQL;

  const columnsToCheck = ['name', 'about'];
  
  const sqlConditions = features.leftoverMatchers.length > 0 ? features.leftoverMatchers.map((keyword, idx) => {
    const delimeter = idx === 0 ? `(` : keyword === "OR"
    ? variable_delimeter(conditional_or())
    : variable_delimeter(conditional_and());
    if(keyword.charAt(0) === '-'){ // handle exclusion
      return delimeter + columnsToCheck.map(column => {
        leftoverCase += `CASE
      WHEN (UPPER(name) LIKE :keyword0 OR UPPER(about) LIKE :keyword${idx}) THEN 1
      ELSE 0
        END + `
        return negate_inflectional(column, idx);
      }).join(conditional_and());
    }
    return delimeter + columnsToCheck.map(column => {
      leftoverCase += `CASE
      WHEN (UPPER(name) LIKE :keyword0 OR UPPER(about) LIKE :keyword${idx}) THEN 1
      ELSE 0
        END + `
      return inflectional(column, idx);
    }).join(conditional_or());
  }).join('') + ')' : '';

  const sortCondition = `
ORDER BY
MATCHED_COLUMNS_COUNT DESC,
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
  
  let matchedColumnsCount = '';
  if (amountCase) {
    matchedColumnsCount += amountCase + ' ';
  }
  
  if (locationCase) {
    matchedColumnsCount += locationCase + ' ';
  }
  
  if (tagCase) {
    matchedColumnsCount += tagCase + ' ';
  }
  
  if (leftoverCase) {
    matchedColumnsCount += leftoverCase + '';
  }

  matchedColumnsCount = matchedColumnsCount.slice(0, -2);
  
  if(finalQuery && !sqlConditions){
    const sqlStatement = `SELECT t.*, ${matchedColumnsCount} AS "MATCHED_COLUMNS_COUNT" FROM ${TABLE} t WHERE ${finalQuery} ${sortCondition}`;
    return sqlStatement;
  }
  if(!finalQuery && sqlConditions){
    const sqlStatement = `SELECT t.*, ${matchedColumnsCount} AS "MATCHED_COLUMNS_COUNT" FROM ${TABLE} t WHERE ${sqlConditions} ${sortCondition}`;
    return sqlStatement;
  }
  if(!finalQuery && !sqlConditions){
    const sqlStatement = `SELECT 1 FROM DUAL WHERE 1 = 0`;
    return sqlStatement;
  }
  
  const sqlStatement = `SELECT t.*, ${matchedColumnsCount} AS "MATCHED_COLUMNS_COUNT" FROM ${TABLE} t WHERE ${finalQuery} OR ${sqlConditions} ${sortCondition}`;
  return sqlStatement;
}

module.exports.generate_query = generate_query;