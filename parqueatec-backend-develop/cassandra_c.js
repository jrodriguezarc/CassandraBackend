/******************************************************************************************
cassandra_c.js
Authors: Albin Arias, Alexis Gamboa, Juan Rodríguez
-------------------------------------------------------------------------------------------

******************************************************************************************/

//CASSANDRA CONNECTION

var QUERIES = require('./queries.js');
var ASYNC = require('async');
var ERROR_DETAILS = require('./error_details.js');
var GEOLIB = require('geolib');
var CASSANDRA = require('cassandra-driver');
var JSONB = require('json-buffer');
var EVE = require('./events.js');
var BigDecimal = CASSANDRA.types.BigDecimal;
var _ = require('underscore');
var CLIENT = new CASSANDRA.Client({
  contactPoints: ['localhost'],
  keyspace: 'parqueatec'
});

var expressJwt = require('express-jwt');
var jwt = require('jsonwebtoken');
var passwordHash = require('password-hash');
var SECRET = '7faa0adc-027d-4574-9420-81572cd1effa';

var NOT_ORG_INTEREST = false;
var ORG_INTEREST = true;

exports.authentication = function(params, callback) {
  // Custom authentication method.
  CLIENT.execute(QUERIES.FIND_USER_BY_USERNAME, [params.username],
    function(err, result) {
      if (err || result.rows.length == 0) {
        callback(false, 500, errorResponse("Wrong user"));
      } else {
        if (!(params.username == result.rows[0].username && passwordHash.verify(params.password, result.rows[0].password))) {
          callback(false, 500, errorResponse('Wrong username or password'));
          return;
        }
        var profile = { //hay que corregir
          username: result.rows[0].username,
          id: result.rows[0].id.toString()
        };
        // Sending the profile inside the token
        var token = jwt.sign(profile, SECRET, {
          expiresInMinutes: 60 * 5
        });
        //res.json({ token: token });
        callback(true, null, successToken(token, "Token successfully created"));
      }
    })
}

//POST
//THIS CREATES A NEW USER
exports.postUser = function(params, callback) {
  var newUserID = CASSANDRA.types.uuid();
  userExistsByUsername(params.username, function(exists, result) {
    if (!exists) {
      CLIENT.execute(QUERIES.CREATE_USER, [newUserID, params.fields.contact_email, params.fields.contact_phone, params.fields.first_name, params.fields.last_name, params.fields.username, passwordHash.generate(params.fields.password), params.fields.rol, params.date],
        function(err, result) {
          if (err) {
            callback(false, 500, errorResponse(ERROR_DETAILS.DATABASE_CONNECTIONS));
          } else {
            callback(true, null, successNew(newUserID,
              "User successfully created"));
          }
        });
    } else {
      callback(false, 400, errorResponse("User already exists"));
    }
  });
}

////////////////////////////////////////////////////////////////////////////////
//ORGANIZATIONS ENDPOINT////////////////////////////////////////////////////////

//GET
//THIS RETURN A SPECIFIED ORGANIZATION
exports.getOrganization = function(params, callback) {
  CLIENT.execute(QUERIES.FIND_ORGANIZATION_BY_ID, [params.id], function(err, result) {
    if (err) {
      callback(false, 500, errorResponse(err.message));
    } else {
      registerInLog(params.request, params.id, EVE.GET_SPECIFIC_ORGANIZATION, NOT_ORG_INTEREST, params.date);
      callback(true, null, successGet(result.rows));
    }
  });
}

//THIS RETURNS ALL ORGANIZATIONS
exports.getAllOrganizations = function(params, callback) {
  CLIENT.execute(QUERIES.ALL_ORGANIZATIONS, [], function(err, result) {
    if (err) {
      callback(false, 500, errorResponse(
        ERROR_DETAILS.DATABASE_CONNECTIONS));
    } else {
      for (var i = 0; i < result.rows.length; result.rows[i].id = result.rows[
          i++].id.toString());
      registerInLog(params.request, params.id, EVE.GET_ALL_ORGANIZATIONS, NOT_ORG_INTEREST, params.date);
      callback(true, null, successGet(result.rows));
    }
  });
};

//THIS RETURNS ORGANIZATIONS WIHIN PARAMETERS
exports.getOrganizations = function(params, callback) {
  CLIENT.execute(QUERIES.buildGetOrganizations(params), [], function(err, result) {
    if (err) {
      callback(false, 500, errorResponse(err.message));
    } else {
      for (var i = 0; i < result.rows.length; result.rows[i].id = result.rows[i++].id.toString());
      registerInLog(params.request, params.id, EVE.GET_SPECIFIC_ORGANIZATIONS, NOT_ORG_INTEREST, params.date);
      callback(true, null, successGet(result.rows));
    }
  });
}

//UPDATE (POST)
//THIS UPDATES AN ORGANIZATION
exports.putOrganization = function(params, callback) {
  organizationExistsByID(params.id, function(exists, result) {
    if (exists) {
      organizationExistsByName(params.name, function(exists, result) {
        if (!exists) {
          CLIENT.execute(QUERIES.buildPutOrganization(params), [], function(err, result) {
            if (err) {
              callback(false, 500, errorResponse(ERROR_DETAILS.DATABASE_CONNECTIONS));
            } else {
              registerInLog(params.request, params.id, EVE.PUT_ORGANIZATION, ORG_INTEREST, params.date);
              callback(true, null, successUpdate("Organization successfully updated"));
            }
          });
        } else {
          callback(false, 400, errorResponse("There's an organization with that name"));
        }
      });
    } else {
      callback(false, 400, errorResponse("No organization found"));
    }
  });
}

//POST
//THIS CREATES A NEW ORGANIZATION
exports.postOrganization = function(params, callback) {
  var newOrganizationID = CASSANDRA.types.uuid();
  organizationExistsByName(params.fields.name, function(exists, result) {
    if (!exists) {
      CLIENT.execute(QUERIES.CREATE_ORGANIZATION, [newOrganizationID, params.fields.name, params.fields.bussiness_area, params.fields.country, params.fields.state_province, params.fields.city, params.date],
        function(err, result) {
          if (err) {
            callback(false, 500, errorResponse(ERROR_DETAILS.DATABASE_CONNECTIONS));
          } else {
            registerInLog(params.request, params.id, EVE.POST_ORGANIZATION, ORG_INTEREST, params.date);
            callback(true, null, successNew(newOrganizationID, "Organization successfully created"));
          }
        });
    } else {
      callback(false, 400, errorResponse("Organization already exists"));
    }
  });
}

//DELETE
//THIS DELETES AN ORGANIZATION
exports.deleteOrganization = function(params, callback) {
  organizationExistsByID(params.id, function(exists, result) {
    if (exists) {
      var loc_ids = [];
      var park_ids = [];
      var spot_ids = [];
      ASYNC.series([
        CLIENT.execute(QUERIES.DELETE_ORGANIZATION_BY_ID, [
          params.id
        ], function(err, res) {}),
        CLIENT.execute(QUERIES.LOCATIONS_IDS_BY_ORG, [params.id],
          function(err, res) {
            if (res) {
              loc_ids = getIDs(res.rows);
              for (var i = 0; i < loc_ids.length; i++) {
                CLIENT.execute(QUERIES.DELETE_LOCATION_BY_ID, [loc_ids[
                    i].toString()],
                  function(err, res) {});
              }
            }
          }),
        CLIENT.execute(QUERIES.PARKING_LOTS_IDS_BY_ORG, [params.id],
          function(err, res) {
            if (res) {
              park_ids = getIDs(res.rows);
              for (var i = 0; i < park_ids.length; i++) {
                CLIENT.execute(QUERIES.DELETE_PARKING_LOT_BY_ID, [
                    park_ids[i].toString()
                  ],
                  function(err, res) {});
              }
            }
          }),
        CLIENT.execute(QUERIES.SPOTS_IDS_BY_ORG, [params.id],
          function(err, res) {
            if (res) {
              spot_ids = getIDs(res.rows);
              for (var i = 0; i < spot_ids.length; i++) {
                CLIENT.execute(QUERIES.DELETE_SPOT_BY_ID, [spot_ids[i].toString()],
                  function(err, res) {});
              }
            }
          }),
        registerInLog(params.request, params.id, EVE.DELETE_ORGANIZATION, ORG_INTEREST, params.date),
        callback(true, null, successDelete(params.id, "Organization successfully disabled"))
      ]);
    } else {
      callback(false, 400, errorResponse("Organization doesn't exists"));
    }
  });
}

////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
//LOCATIONS ENDPOINT////////////////////////////////////////////////////////////

//GET
//THIS RETURN A SPECIFIED LOCATION
exports.getLocation = function(params, callback) {
  CLIENT.execute(QUERIES.FIND_LOCATION_BY_ID, [params.id], function(err,
    result) {
    if (err) {
      callback(false, 500, errorResponse(ERROR_DETAILS.DATABASE_CONNECTIONS));
    } else {
      registerInLog(params.request, params.id, EVE.GET_SPECIFIC_LOCATION, NOT_ORG_INTEREST, params.date);
      callback(true, null, successGet(result.rows));
    }
  });
}

//THIS RETURNS LOCATIONS WIHIN PARAMETERS
exports.getOrganizationsLocations = function(params, callback) {
  CLIENT.execute(QUERIES.buildGetOrganizationsLocations(params), [], function(err, result) {
    if (err) {
      callback(false, 500, errorResponse(err.message));
    } else {
      try {
        for (var i = 0; i < result.rows.length; result.rows[i].id = result.rows[i++].id.toString());
        registerInLog(params.request, params.id, EVE.GET_SPECIFIC_LOCATIONS, NOT_ORG_INTEREST, params.date);
        callback(true, null, successGet(result.rows));
      } catch (e) {
        registerInLog(params.request, params.id, EVE.GET_SPECIFIC_LOCATIONS, NOT_ORG_INTEREST, params.date);
        callback(true, null, successGet(result.rows));
      }
    }
  });
}

//UPDATE (PUT)
//THIS UPDATES A LOCATION
exports.putLocation = function(params, callback) {
  locationExistsByID(params.id, function(exists, loc_data) {
    if (exists) {
      locationExistsByName(params.fields.name, params.org_id,
        function(exists, result) {
          if (!exists) {
            CLIENT.execute(QUERIES.buildPutLocation(params), [],
              function(err, result) {
                if (err) {
                  callback(false, 500, errorResponse(ERROR_DETAILS.DATABASE_CONNECTIONS));
                } else {
                  registerInLog(params.request, params.id, EVE.PUT_LOCATION, ORG_INTEREST, params.date);
                  callback(true, null, successUpdate("Location successfully updated"));
                }
              });
          } else {
            callback(false, 400, errorResponse("There's another location with that name"));
          }
        })
    } else {
      callback(false, 400, errorResponse("No location found"));
    }
  });
}

//POST
//THIS CREATES A NEW LOCATION
exports.postLocation = function(params, callback) {
  var newLocationID = CASSANDRA.types.uuid();
  locationExistsByName(params.fields.name, params.org_id,
    function(exists, result) {
      if (!exists) {
        CLIENT.execute(QUERIES.buildPostLocation(newLocationID, params), [],
          function(err, result) {
            if (err) {
              callback(false, 500, errorResponse(ERROR_DETAILS.DATABASE_CONNECTIONS));
            } else {
              registerInLog(params.request, params.id, EVE.POST_LOCATION, ORG_INTEREST, params.date);
              callback(true, null, successNew(newLocationID, "Location successfully created"));
            }
          });
      } else {
        callback(false, 400, errorResponse("Location already exists in the organization"));
      }
    });
}

//DELETE
//THIS DELETES A LOCATION
exports.deleteLocation = function(params, callback) {
    locationExistsByID(params.id,
      function(exists, result) {
        if (exists) {
          var park_ids = [];
          var spot_ids = [];
          ASYNC.series([
            CLIENT.execute(QUERIES.DELETE_LOCATION_BY_ID, [
              params.id
            ], function(err, res) {}),
            CLIENT.execute(QUERIES.PARKING_LOTS_IDS_BY_LOC, [params.id],
              function(err, res) {
                if (res) {
                  park_ids = getIDs(res.rows);
                  for (var i = 0; i < park_ids.length; i++) {
                    CLIENT.execute(QUERIES.DELETE_PARKING_LOT_BY_ID, [
                        park_ids[i].toString()
                      ],
                      function(err, res) {});
                  }
                }
              }),
            CLIENT.execute(QUERIES.SPOTS_IDS_BY_LOC, [params.id],
              function(err, res) {
                if (res) {
                  spot_ids = getIDs(res.rows);
                  for (var i = 0; i < spot_ids.length; i++) {
                    CLIENT.execute(QUERIES.DELETE_SPOT_BY_ID, [spot_ids[i].toString()],
                      function(err, res) {});
                  }
                }
              }),
            registerInLog(params.request, params.id, EVE.DELETE_LOCATION, ORG_INTEREST, params.date),
            callback(true, null, successDelete(params.id, "Location successfully disabled"))
          ]);
        } else {
          callback(false, 400, errorResponse("Location doesn't exists"));
        }
      });
  }
  ////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
//PARKING LOTS ENDPOINT////////////////////////////////////////////////////////////

//GET
//THIS RETURN A SPECIFIED PARKING LOT
exports.getParking_Lot = function(params, callback) {
  CLIENT.execute(QUERIES.FIND_PARKING_LOT_BY_ID, [params.id], function(err,
    result) {
    if (err) {
      callback(false, 500, errorResponse(ERROR_DETAILS.DATABASE_CONNECTIONS));
    } else {
      registerInLog(params.request, params.id, EVE.GET_SPECIFIC_PARKING_LOT, NOT_ORG_INTEREST, params.date);
      callback(true, null, successGet(result.rows));
    }
  });
}

//THIS RETURNS ALL LOCATIONS'S PARKING LOTS
exports.getLocationsParking_Lots = function(params, callback) {
  CLIENT.execute(QUERIES.buildGetLocationsParking_Lots(params), [], function(err, result) {
    if (err) {
      callback(false, 500, errorResponse(err.message));
    } else {
      try {
        for (var i = 0; i < result.rows.length; result.rows[i].id = result.rows[i++].id.toString());
        registerInLog(params.request, params.id, EVE.GET_SPECIFIC_PARKING_LOTS, NOT_ORG_INTEREST, params.date);
        callback(true, null, successGet(result.rows));
      } catch (e) {
        callback(true, null, successGet(result.rows));
      }
    }
  });
}

//UPDATE (POST)
//THIS UPDATES A PARKING LOT
exports.putParking_Lot = function(params, callback) {
  parking_lotExistsByID(params.id, function(exists, loc_data) {
    if (exists) {
      parking_lotExistsByName(params.fields.name, loc_data.loc_id,
        function(exists, result) {
          if (!exists) {
            CLIENT.execute(QUERIES.buildPutParking_Lot(params), [],
              function(err, result) {
                if (err) {
                  callback(false, 500, errorResponse(ERROR_DETAILS.DATABASE_CONNECTIONS));
                } else {
                  registerInLog(params.request, params.id, EVE.PUT_PARKING_LOT, ORG_INTEREST, params.date);
                  callback(true, null, successUpdate("`Parking lot successfully updated"));
                }
              });
          } else {
            callback(false, 400, errorResponse("There's another parking lot with that name"));
          }
        })
    } else {
      callback(false, 400, errorResponse("No parking lot found"));
    }
  });
}

//POST
//THIS CREATES A NEW PARKING LOT
exports.postParking_Lot = function(params, callback) {
  var newParkinglotID = CASSANDRA.types.uuid();
  parking_lotExistsByName(params.fields.name, params.loc_id,
    function(exists, loc_data) {
      if (!exists) {
        CLIENT.execute(QUERIES.buildPostParking_Lot(newParkinglotID, {
            loc_id: params.loc_id,
            org_id: loc_data.org_id,
            fields: params.fields,
            date: params.date
          }), [],
          function(err, result) {
            if (err) {
              callback(false, 500, errorResponse(ERROR_DETAILS.DATABASE_CONNECTIONS));
            } else {
              registerInLog(params.request, params.id, EVE.POST_PARKING_LOT, ORG_INTEREST, params.date);
              callback(true, null, successNew(newParkinglotID, "Parking lot successfully created"));
            }
          });
      } else {
        callback(false, 400, errorResponse("Parking lot already exists in the location"));
      }
    });
}

//DELETE
//THIS DELETES A PARKING LOT
exports.deleteParking_Lot = function(params, callback) {
  parking_lotExistsByID(params.id,
    function(exists, result) {
      if (exists) {
        var spot_ids = [];
        ASYNC.series([
          CLIENT.execute(QUERIES.DELETE_PARKING_LOT_BY_ID, [
            params.id
          ], function(err, res) {}),
          CLIENT.execute(QUERIES.SPOTS_IDS_BY_PAR, [params.id],
            function(err, res) {
              if (res) {
                spot_ids = getIDs(res.rows);
                for (var i = 0; i < spot_ids.length; i++) {
                  CLIENT.execute(QUERIES.DELETE_SPOT_BY_ID, [spot_ids[i].toString()],
                    function(err, res) {});
                }
              }
            }),
          registerInLog(params.request, params.id, EVE.DELETE_PARKING_LOT, ORG_INTEREST, params.date),
          callback(true, null, successDelete(params.id, "Parking lot successfully disabled"))
        ]);
      } else {
        callback(false, 400, errorResponse("Parking lot doesn't exists"));
      }
    });
}

////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
//SPOTS ENDPOINT////////////////////////////////////////////////////////////

//GET
//THIS RETURN A SPECIFIED SPOT
exports.getSpot = function(params, callback) {
  CLIENT.execute(QUERIES.FIND_SPOT_BY_ID, [params.id], function(err,
    result) {
    if (err) {
      callback(false, 500, errorResponse(ERROR_DETAILS.DATABASE_CONNECTIONS));
    } else {
      registerInLog(params.request, params.id, EVE.GET_SPECIFIC_SPOT, NOT_ORG_INTEREST, params.date);
      callback(true, null, successGet(result.rows));
    }
  });
}

//THIS RETURNS ALL PARKING LOT'S SPOTS
exports.getParking_LotsSpots = function(params, callback) {
  CLIENT.execute(QUERIES.buildGetParking_LotsSpots(params), [], function(err, result) {
    if (err) {
      callback(false, 500, errorResponse(err.message));
    } else {
      try {
        for (var i = 0; i < result.rows.length; result.rows[i].id = result.rows[i++].id.toString());
        registerInLog(params.request, params.id, EVE.GET_SPECIFIC_SPOTS, NOT_ORG_INTEREST, params.date);
        callback(true, null, successGet(result.rows));
      } catch (e) {
        registerInLog(params.request, params.id, EVE.GET_SPECIFIC_SPOTS, NOT_ORG_INTEREST, params.date);
        callback(true, null, successGet(result.rows));
      }
    }
  });
}

//UPDATE (POST)
//THIS UPDATES A SPOT
exports.putSpot = function(params, callback) {
  spotExistsByID(params.id, function(exists, spot_data) {
    if (exists) {
      spotExistsByCode(params.fields.code, spot_data.par_id,
        function(exists, result) {
          if (!exists) {
            CLIENT.execute(QUERIES.buildPutSpot(params), [],
              function(err, result) {
                if (err) {
                  callback(false, 500, errorResponse(ERROR_DETAILS.DATABASE_CONNECTIONS));
                } else {
                  registerInLog(params.request, params.id, EVE.PUT_SPOT, ORG_INTEREST, params.date);
                  callback(true, null, successUpdate("Spot successfully updated"));
                }
              });
          } else {
            callback(false, 400, errorResponse("There's another spot with that name"));
          }
        })
    } else {
      callback(false, 400, errorResponse("No spot found"));
    }
  });
}

//POST
//THIS CREATES A NEW SPOT
exports.postSpot = function(params, callback) {
  var newSpotID = CASSANDRA.types.uuid();
  spotExistsByCode(params.fields.code, params.par_id, function(exists, loc_data) {
    if (!exists) {
      CLIENT.execute(QUERIES.buildPostSpot(newSpotID, {
          par_id: params.par_id,
          loc_id: loc_data.loc_id,
          org_id: loc_data.org_id,
          fields: params.fields,
          date: params.date
        }), [],
        function(err, result) {
          if (err) {
            callback(false, 500, errorResponse(ERROR_DETAILS.DATABASE_CONNECTIONS));
          } else {
            registerInLog(params.request, params.id, EVE.POST_SPOT, NOT_ORG_INTEREST, params.date);
            callback(true, null, successNew(newSpotID, "Spot successfully created"));
          }
        });
    } else {
      callback(false, 400, errorResponse("Spot already exists in the parking lot"));
    }
  });
}

//DELETE
//THIS DELETES A SPOT
exports.deleteSpot = function(params, callback) {
  spotExistsByID(params.id, function(exists, result) {
    if (exists) {
      CLIENT.execute(QUERIES.DELETE_SPOT_BY_ID, [params.id],
        function(err, res) {
          if (err) {
            callback(false, 500, errorResponse(ERROR_DETAILS.DATABASE_CONNECTIONS));
          } else {
            registerInLog(params.request, params.id, EVE.DELETE_SPOT, NOT_ORG_INTEREST, params.date);
            callback(true, null, successDelete("Spot successfully deleted"));
          }
        });
    } else {
      callback(false, 400, errorResponse("Spot doesn't exists"));
    }
  });
}

////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
//FAILRES ENDPOINT//////////////////////////////////////////////////////////////

exports.postFailure = function(params, callback) {
  var newFailure = CASSANDRA.types.uuid();
  CLIENT.execute(QUERIES.CREATE_FAILURE, [newFailure, params.fields.dev_id, params.fields.detail, params.request.user.username, params.date],
    function(err, result) {
      console.log(err);
      if (err) {
        callback(false, 500, errorResponse(ERROR_DETAILS.DATABASE_CONNECTIONS));
      } else {
        //registerInLog(params.request, params.id, EVE.POST_SPOT, NOT_ORG_INTEREST, params.date);
        callback(true, null, successNew(newFailure, "Failure successfully created"));
      }
    });
}


////////////////////////////////////////////////////////////////////////////////
//This method returns a JSON for a successful get response
function successGet(data) {
  for (var i = 0; i < data.length; i++) {
    if (data[i].id) {
      data[i].id = data[i].id.toString();
    }
    if (data[i].org_id) {
      data[i].org_id = data[i].org_id.toString();
    }
    if (data[i].loc_id) {
      data[i].loc_id = data[i].loc_id.toString();
    }
    if (data[i].par_id) {
      data[i].par_id = data[i].par_id.toString();
    }
  }
  return {
    "status": true,
    "time": new Date(),
    "size": data.length,
    "data": data
  };
}

//This method returns a JSON for a successful new call
function successNew(id, msg) {
  return {
    "status": true,
    "time": new Date(),
    "msg": msg,
    "id": id
  };
}

//This method returns a JSON for a successful update call
function successUpdate(msg) {
  return {
    "status": true,
    "time": new Date(),
    "msg": msg
  }
}

//This method returns the id for a successfull delete
function successDelete(id, msg) {
  return {
    "status": true,
    "time": new Date(),
    "msg": msg,
    "id": id
  }
}

function successToken(id, msg) {
  return {
    "status": true,
    "time": new Date(),
    "msg": msg,
    "token": id
  };
}

function organizationExistsByID(id, callback) {
  CLIENT.execute(QUERIES.FIND_ORGANIZATION_BY_ID, [id],
    function(err, result) {
      if (err) {
        callback(false, null);
      } else {
        if (result.rows.length == 1) {
          callback(true, result.rows[0]);
        } else {
          callback(false, null);
        }
      }
    });
}

function organizationExistsByName(name, callback) {
  CLIENT.execute(QUERIES.FIND_ORGANIZATION_BY_NAME, [name],
    function(err, result) {
      if (err) {
        callback(false, null);
      } else {
        if (result.rows.length == 1) {
          callback(true, result.rows[0]);
        } else {
          callback(false, null);
        }
      }
    });
}

function locationExistsByID(id, callback) {
  CLIENT.execute(QUERIES.FIND_LOCATION_BY_ID, [id],
    function(err, result) {
      if (err) {
        callback(false, null);
      } else {
        if (result.rows.length == 1) {
          callback(true, result.rows[0]);
        } else {
          callback(false, null);
        }
      }
    });
}

function locationExistsByName(name, org_id, callback) {
  CLIENT.execute(QUERIES.FIND_LOCATION_BY_NAME_ORG_ID, [org_id, name],
    function(err, result) {
      if (err) {
        callback(false, null);
      } else {
        if (result.rows.length == 1) {
          callback(true, result.rows[0]);
        } else {
          callback(false, null);
        }
      }
    });
}

function parking_lotExistsByID(id, callback) {
  CLIENT.execute(QUERIES.FIND_PARKING_LOT_BY_ID, [id],
    function(err, result) {
      if (err) {
        callback(false, null);
      } else {
        if (result.rows.length == 1) {
          callback(true, result.rows[0]);
        } else {
          callback(false, null);
        }
      }
    });
}

function parking_lotExistsByName(name, loc_id, callback) {
  CLIENT.execute(QUERIES.FIND_PARKING_LOT_BY_NAME_LOC_ID, [loc_id, name],
    function(err, result) {
      if (err) {
        locationExistsByID(loc_id,
          function(exist, loc_data) {
            if (exist) {
              callback(false, loc_data);
            }
          });
      } else {
        if (result.rows.length == 1) {
          callback(true, result.rows[0]);
        } else {
          locationExistsByID(loc_id,
            function(exist, loc_data) {
              if (exist) {
                callback(false, loc_data);
              }
            });
        }
      }
    })
};

function spotExistsByID(id, callback) {
  CLIENT.execute(QUERIES.FIND_SPOT_BY_ID, [id],
    function(err, result) {
      if (err) {
        callback(false, null);
      } else {
        if (result.rows.length == 1) {
          callback(true, result.rows[0]);
        } else {
          callback(false, null);
        }
      }
    });
}

function spotExistsByCode(code, par_id, callback) {
  CLIENT.execute(QUERIES.FIND_SPOT_BY_CODE_PAR_ID, [par_id, code], {
      prepare: true
    },
    function(err, result) {
      if (err) {
        parking_lotExistsByID(par_id,
          function(exist, par_data) {
            if (exist) {
              callback(false, par_data);
            }
          });
      } else {
        if (result.rows.length == 1) {
          callback(true, result.rows[0]);
        } else {
          parking_lotExistsByID(par_id,
            function(exist, par_data) {
              if (exist) {
                callback(false, par_data);
              }
            });
        }
      }
    });
}

function userExistsByUsername(username, callback) {
  CLIENT.execute(QUERIES.FIND_USER_BY_USERNAME, [username],
    function(err, result) {
      if (err) {
        callback(false, null);
      } else {
        if (result.rows.length == 1) {
          callback(true, result.rows[0]);
        } else {
          callback(false, null);
        }
      }
    });
}

function deviceExistsByID(id, callback) {
  CLIENT.execute(QUERIES.FIND_DEVICE_BY_ID, [id], function(err, result) {
    if (err) {
      callback(false, null);
    } else {
      if (result.rows.length == 1) {
        callback(true, result.rows[0]);
      } else {
        callback(false, null);
      }
    }
  })
}

function getIDs(result) {
  var res = [];
  for (var i = 0; i < result.length; res.push(result[i++].id));
  return res;
}

function flatIDs(arr) {
  if (arr.length == 0) {
    return null;
  } else {
    var res = "";
    while (arr.length > 1) {
      res += arr[0] + ", ";
      arr.pop();
    }
    res += arr[0];
    return res;
  }
}

function registerInLog(request, org_id, action, org, date) {
  var newLog = CASSANDRA.types.uuid();
  var _request = {
    route: request.route.path,
    methods: request.route.methods,
    body: request.body,
    params: request.params
  };
  CLIENT.execute(QUERIES.FIND_USER_BY_USERNAME, [request.user.username], function(err, res) {
    if (!err) {
      CLIENT.execute(QUERIES.CREATE_LOG, [newLog, _request.toString(), action, request.connection.remoteAddress, request.user.username, res.rows[0].org_id, org, date], function(err, result) {
        if (!err) {}
      })
    }
  });
}

function errorResponse(detail) {
  return {
    "status": false,
    "msg": detail,
    "time": new Date()
  }
}