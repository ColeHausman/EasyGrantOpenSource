Error.stackTraceLimit = 50;
const path = require('path')
require('dotenv').config({path : path.resolve(__dirname, '../../../build-resource/wallet/.env')});
const oracledb = require('oracledb');
const dbConfig = require('dbconfig');

async function initialize() {
  console.log("Connecting as user: " + dbConfig.ezgrantPool.user);
  try {
    await oracledb.createPool(dbConfig.ezgrantPool);
  }catch(e){
    console.log(e);
  }
  
}

module.exports.initialize = initialize;

async function close() {
  try{
    await oracledb.getPool().close(0);
  }catch(e){
    //do nothing
  }
  
}

module.exports.close = close;