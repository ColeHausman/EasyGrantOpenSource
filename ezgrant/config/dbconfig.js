module.exports = {
  ezgrantPool: {
    user          : process.env.DB_USER,
    password      : process.env.DB_PASSWORD,
    connectString : process.env.CONNECT_STRING,
    externalAuth  : process.env.NODE_ORACLEDB_EXTERNALAUTH ? true : false,
  }
};