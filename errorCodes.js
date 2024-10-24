const errorCodes = {
  AUTH: {
    BASE_CODE: 10000,
    ERRORS: {
      USER_NOT_FOUND: 10001,
      //AUTH_FAILED: 10002,
      //PERMISSION_DENIED: 10003,
      MISSING_VERIFICATION_CODE: 10004,
      VERIFICATION_CODE_EXPIRED: 10005,
      VERIFICATION_CODE_OTHER_USER: 10006
    },
  },
  USER: {
    BASE_CODE: 10000,
    ERRORS: {
      USER_NOT_FOUND: 10001,
      AUTH_FAILED: 10002,
      PERMISSION_DENIED: 10003,
    },
  },
  PROJECT: {
    BASE_CODE: 11000,
    ERRORS: {
      PROJECT_NOT_FOUND: 11001,
      CREATE_FAILED: 11002,
      ACCESS_DENIED: 11003,
    },
  },
  // Aggiungi altre route
};

module.exports = errorCodes;