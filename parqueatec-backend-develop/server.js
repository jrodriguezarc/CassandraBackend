/******************************************************************************************
server.js
Authors: Albin Arias, Alexis Gamboa, Juan Rodríguez
-------------------------------------------------------------------------------------------

******************************************************************************************/

var CASSANDRA_C = require('./cassandra_c.js');

//SERVER DEFINITION
var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');
var app = express();
var _ = require('underscore');
var auth = require('http-auth');
var passwordHash = require('password-hash');
var SECRET = '7faa0adc-027d-4574-9420-81572cd1effa';
var expressJwt = require('express-jwt');
var jwt = require('jsonwebtoken');

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({
  extended: true
})); // for parsing application/x-www-form-urlencoded
app.use(multer()); // for parsing multipart/form-data
app.use(expressJwt({
  secret: SECRET
}).unless({
  path: ['/login', '/users']
}));
app.use(function(err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401);
    res.send(invalidTokenResponse());
  }
});

//---------------------------------------------AUTHTOKEN----------------------
//----------------------------------------------------------------------------

//Token request
app.post('/login', function(req, res) {
  if (req.body.username == null || req.body.password == null) {
    res.status(400);
    res.send(errorResponse("No username or pass specified"));
  } else {
    CASSANDRA_C.authentication({
      'username': req.body.username,
      'password': req.body.password
    }, function(success, code, result) {
      if (success) {
        res.json(result);
      } else {
        res.status(code);
        res.send(result);
      }
    });
  }
});

//Login by session
var basic = auth.basic({
  realm: "Web."
}, function(username, password, callback) { // Custom authentication method.
  CLIENT.execute(QUERIES.FIND_USER_BY_USERNAME, [username],
    function(err, res) {
      callback(username == res.rows[0].username && passwordHash.verify(password, res.rows[0].password));
    })
});

app.post('/users', function(req, res) {
  if (_.isEmpty(req.body)) {
    res.status(400);
    res.send(errorResponse("No body specified"));
  } else {
    if (req.body.contact_email == null || req.body.contact_phone == null || req.body.first_name == null || req.body.last_name == null || req.body.username == null || req.body.password == null || req.body.rol == null /* || req.body.org_id == null*/ ) {
      res.status(400);
      res.send(errorResponse("Required field missing"));
    } else {
      try {
        req.body.role = parseInt(req.body.role);
        CASSANDRA_C.postUser({
          'fields': req.body,
          'date': new Date()
        }, function(success, code, result) {
          if (success) {
            res.json(result);
          } else {
            res.status(code);
            res.send(result);
          }
        });
      } catch (e) {
        res.status(400);
        res.send(errorResponse("Required field missing"));
      }
    }
  }
});

//ORGANIZATIONS
app.get('/organizations/:id', function(req, res) {
  if (req.params.id == null) {
    res.status(400);
    res.send(errorResponse("No id specified"));
  } else {
    CASSANDRA_C.getOrganization({
      id: req.params.id,
      request: req
    }, function(success, code, result) {
      if (success) {
        res.json(result);
      } else {
        res.status(code);
        res.send(result);
      }
    })
  }
});

app.get('/organizations', function(req, res) {
  if (_.isEmpty(req.query)) {
    CASSANDRA_C.getAllOrganizations({
      request: req,
      date: new Date()
    }, function(success, code, result) {
      if (success) {
        res.json(result);
      } else {
        res.status(code);
        res.send(result);
      }
    });
  } else {
    var _fields;
    var _specifics;
    if (!_.isEmpty(req.query.fields)) {
      req.query.fields = req.query.fields.replace(/ /g, "");
      _fields = req.query.fields.split(",");
      delete req.query.fields;
    }
    if (!_.isEmpty(req.query)) {
      _specifics = req.query;
    }
    CASSANDRA_C.getOrganizations({
      request: req,
      fields: _fields,
      specifics: _specifics,
      date: new Date()
    }, function(success, code, result) {
      if (success) {
        res.json(result);
      } else {
        res.status(code);
        res.send(result);
      }
    });
  }
});

app.post('/organizations', function(req, res) {
  if (_.isEmpty(req.body)) {
    res.status(400);
    res.send(errorResponse("No data specified"));
  } else {
    if (req.body.name == null || req.body.bussiness_area == null || req.body.country == null || req.body.state_province == null || req.body.city == null) {
      res.status(400);
      res.send(errorResponse("There's a required field mising"));
    } else {
      CASSANDRA_C.postOrganization({
        fields: req.body,
        date: new Date(),
        request: req
      }, function(success, code, result) {
        if (success) {
          res.json(result);
        } else {
          res.status(code);
          res.send(result);
        }
      });
    }
  }
});

app.put('/organizations/:id', function(req, res) {
  if (req.params.id == null) {
    res.status(400);
    res.send(errorResponse("No id or name specified"));
  } else {
    if (req.body == null) {
      res.status(400);
      res.send(errorResponse("No data specified"));
    } else {
      CASSANDRA_C.putOrganization({
        id: req.params.id,
        fields: req.body,
        request: req,
        date: new Date()
      }, function(success, code, result) {
        if (success) {
          res.json(result);
        } else {
          res.status(code);
          res.send(result);
        }
      });
    }
  }
});

app.delete('/organizations/:id', function(req, res) {
  if (req.params.id == null) {
    res.status(400);
    res.send(errorResponse("No id specified"));
  } else {
    CASSANDRA_C.deleteOrganization({
      id: req.params.id,
      request: req,
      date: new Date()
    }, function(success, code, result) {
      if (success) {
        res.json(result);
      } else {
        res.status(code);
        res.send(result);
      }
    });
  }
});

//LOCATIONS
app.get('/locations/:id', function(req, res) {
  if (req.params.id == null) {
    res.status(400);
    res.send(errorResponse("No id specified"));
  } else {
    CASSANDRA_C.getLocation({
      id: req.params.id,
      request: req,
      date: new Date()
    }, function(success, code, result) {
      if (success) {
        res.json(result);
      } else {
        res.status(code);
        res.send(result);
      }
    })
  }
});

app.get('/organizations/:org_id/locations', function(req, res) {
  if (req.params.org_id == null) {
    res.status(400);
    res.send(errorResponse("No org_id specified"));
  } else {
    if (_.isEmpty(req.query)) {
      CASSANDRA_C.getOrganizationsLocations({
          org_id: req.params.org_id,
          request: req,
          date: new Date()
        },
        function(success, code, result) {
          if (success) {
            res.json(result);
          } else {
            res.status(code);
            res.send(result);
          }
        });
    } else {
      var _fields;
      var _specifics;
      if (!_.isEmpty(req.query.fields)) {
        req.query.fields = req.query.fields.replace(/ /g, "");
        _fields = req.query.fields.split(",");
        delete req.query.fields;
      }
      if (!_.isEmpty(req.query)) {
        _specifics = req.query;
      }
      CASSANDRA_C.getOrganizationsLocations({
        org_id: req.params.org_id,
        fields: _fields,
        specifics: _specifics,
        request: req,
        date: new Date()
      }, function(success, code, result) {
        if (success) {
          res.json(result);
        } else {
          res.status(code);
          res.send(result);
        }
      });
    }
  }
});

app.post('/organizations/:org_id/locations', function(req, res) {
  if (req.params.org_id == null) {
    res.status(400);
    res.send(errorResponse("No org_id specified"));
  } else {
    if (_.isEmpty(req.body)) {
      res.status(400);
      res.send(errorResponse("No body specified"));
    } else {
      if (req.body.name == null || req.body.country == null || req.body.state_province == null || req.body.city == null || req.body.address == null || req.body.headquarter == null || req.body.boundaries == null || req.body.contact_email == null || req.body.contact_phone == null) {
        res.status(400);
        res.send(errorResponse("There's a required field mising"));
      } else {
        var reg_ex = /\[(\[\d*\.\d*,\d*\.\d*\])+,?(\[\d*\.\d*,\d*\.\d*\])?\]/;
        var result = reg_ex.exec(req.body.boundaries);
        if (result) {
          CASSANDRA_C.postLocation({
            org_id: req.params.org_id,
            fields: req.body,
            request: req,
            date: new Date()
          }, function(success, code, result) {
            if (success) {
              res.json(result);
            } else {
              res.status(code);
              res.send(result);
            }
          });
        } else {
          res.status(400);
          res.send(errorResponse("Error in boundaries field. Doesn't match [[{lat},{long}],...]"));
        }
      }
    }
  }
});

app.put('/locations/:id', function(req, res) {
  if (req.params.id == null) {
    res.status(400);
    res.send(errorResponse("No id specified"));
  } else {
    if (_.isEmpty(req.body)) {
      res.status(400);
      res.send(errorResponse("No data specified"));
    } else {
      CASSANDRA_C.putLocation({
        id: req.params.id,
        fields: req.body,
        request: req,
        date: new Date()
      }, function(success, code, result) {
        if (success) {
          res.json(result);
        } else {
          res.status(code);
          res.send(result);
        }
      });
    }
  }
});

app.delete('/locations/:id', function(req, res) {
  if (req.params.id == null) {
    res.status(400);
    res.send(errorResponse("No id specified"));
  } else {
    CASSANDRA_C.deleteLocation({
      id: req.params.id,
      request: req,
      date: new Date()
    }, function(success, code, result) {
      if (success) {
        res.json(result);
      } else {
        res.status(code);
        res.send(result);
      }
    });
  }
});

//PARKINGLOTS
app.get('/parking_lots/:id', function(req, res) {
  if (req.params.id == null) {
    res.status(400);
    res.send(errorResponse("No id specified"));
  } else {
    CASSANDRA_C.getParking_Lot({
      id: req.params.id,
      request: req,
      date: new Date()
    }, function(success, code, result) {
      if (success) {
        res.json(result);
      } else {
        res.status(code);
        res.send(result);
      }
    })
  }
});

app.get('/locations/:loc_id/parking_lots', function(req, res) {
  if (req.params.loc_id == null) {
    res.status(400);
    res.send(errorResponse("No loc_id specified"));
  } else {
    if (_.isEmpty(req.query)) {
      CASSANDRA_C.getLocationsParking_Lots({
          loc_id: req.params.loc_id,
          request: req,
          date: new Date()
        },
        function(success, code, result) {
          if (success) {
            res.json(result);
          } else {
            res.status(code);
            res.send(result);
          }
        });
    } else {
      var _fields;
      var _specifics;
      if (!_.isEmpty(req.query.fields)) {
        req.query.fields = req.query.fields.replace(/ /g, "");
        _fields = req.query.fields.split(",");
        delete req.query.fields;
      }
      if (!_.isEmpty(req.query)) {
        _specifics = req.query;
      }
      CASSANDRA_C.getLocationsParking_Lots({
        loc_id: req.params.loc_id,
        fields: _fields,
        specifics: _specifics,
        request: req,
        date: new Date()
      }, function(success, code, result) {
        if (success) {
          res.json(result);
        } else {
          res.status(code);
          res.send(result);
        }
      });
    }
  }
});

app.post('/locations/:loc_id/parking_lots', function(req, res) {
  if (req.params.loc_id == null) {
    res.status(400);
    res.send(errorResponse("No loc_id specified"));
  } else {
    if (_.isEmpty(req.body)) {
      res.status(400);
      res.send(errorResponse("No body specified"));
    } else {
      if (req.body.name == null || req.body.boundaries == null) {
        res.status(400);
        res.send(errorResponse("There's a required field mising"));
      } else {
        var reg_ex = /\[(\[\d*\.\d*,\d*\.\d*\])+,?(\[\d*\.\d*,\d*\.\d*\])?\]/;
        var result = reg_ex.exec(req.body.boundaries);
        if (result) {
          CASSANDRA_C.postParking_Lot({
            loc_id: req.params.loc_id,
            fields: req.body,
            request: req,
            date: new Date()
          }, function(success, code, result) {
            if (success) {
              res.json(result);
            } else {
              res.status(code);
              res.send(result);
            }
          });
        } else {
          res.status(400);
          res.send(errorResponse("Error in boundaries field. Doesn't match [[{lat},{long}],...]"));
        }
      }
    }
  }
});

app.put('/parking_lots/:id', function(req, res) {
  if (req.params.id == null) {
    res.status(400);
    res.send(errorResponse("No id specified"));
  } else {
    if (_.isEmpty(req.body)) {
      res.status(400);
      res.send(errorResponse("No data specified"));
    } else {
      CASSANDRA_C.putParking_Lot({
        id: req.params.id,
        fields: req.body,
        request: req,
        date: new Date()
      }, function(success, code, result) {
        if (success) {
          res.json(result);
        } else {
          res.status(code);
          res.send(result);
        }
      });
    }
  }
});

app.delete('/parking_lots/:id', function(req, res) {
  if (req.params.id == null) {
    res.status(400);
    res.send(errorResponse("No id specified"));
  } else {
    CASSANDRA_C.deleteParking_Lot({
      id: req.params.id,
      request: req,
      date: new Date()
    }, function(success, code, result) {
      if (success) {
        res.json(result);
      } else {
        res.status(code);
        res.send(result);
      }
    });
  }
});

//SPOTS
app.get('/spots/:id', function(req, res) {
  if (req.params.id == null) {
    res.status(400);
    res.send(errorResponse("No id specified"));
  } else {
    CASSANDRA_C.getSpot({
      id: req.params.id,
      request: req,
      date: new Date()
    }, function(success, code, result) {
      if (success) {
        res.json(result);
      } else {
        res.status(code);
        res.send(result);
      }
    })
  }
});

app.get('/parking_lots/:par_id/spots', function(req, res) {
  if (req.params.par_id == null) {
    res.status(400);
    res.send(errorResponse("No par_id specified"));
  } else {
    if (_.isEmpty(req.query)) {
      CASSANDRA_C.getParking_LotsSpots({
          par_id: req.params.par_id,
          request: req,
          date: new Date()
        },
        function(success, code, result) {
          if (success) {
            res.json(result);
          } else {
            res.status(code);
            res.send(result);
          }
        });
    } else {
      var _fields;
      var _specifics;
      if (!_.isEmpty(req.query.fields)) {
        req.query.fields = req.query.fields.replace(/ /g, "");
        _fields = req.query.fields.split(",");
        delete req.query.fields;
      }
      if (!_.isEmpty(req.query)) {
        _specifics = req.query;
      }
      CASSANDRA_C.getParking_LotsSpots({
        par_id: req.params.par_id,
        fields: _fields,
        specifics: _specifics,
        request: req,
        date: new Date()
      }, function(success, code, result) {
        if (success) {
          res.json(result);
        } else {
          res.status(code);
          res.send(result);
        }
      });
    }
  }
});

app.post('/parking_lots/:par_id/spots', function(req, res) {
  if (req.params.par_id == null) {
    res.status(400);
    res.send(errorResponse("No par_id specified"));
  } else {
    if (_.isEmpty(req.body)) {
      res.status(400);
      res.send(errorResponse("No body specified"));
    } else {
      if (req.body.code == null || req.body.latitude == null || req.body.longitude == null) {
        res.status(400);
        res.send(errorResponse("There's a required field mising"));
      } else {
        CASSANDRA_C.postSpot({
          par_id: req.params.par_id,
          fields: req.body,
          request: req,
          date: new Date()
        }, function(success, code, result) {
          if (success) {
            res.json(result);
          } else {
            res.status(code);
            res.send(result);
          }
        });
      }
    }
  }
});

app.put('/spots/:id', function(req, res) {
  if (req.params.id == null) {
    res.status(400);
    res.send(errorResponse("No id specified"));
  } else {
    if (_.isEmpty(req.body)) {
      res.status(400);
      res.send(errorResponse("No data specified"));
    } else {
      CASSANDRA_C.putSpot({
        id: req.params.id,
        fields: req.body,
        request: req,
        date: new Date()
      }, function(success, code, result) {
        if (success) {
          res.json(result);
        } else {
          res.status(code);
          res.send(result);
        }
      });
    }
  }
});

app.delete('/spots/:id', function(req, res) {
  if (req.params.id == null) {
    res.status(400);
    res.send(errorResponse("No id specified"));
  } else {
    CASSANDRA_C.deleteSpot({
      id: req.params.id,
      fields: req.body,
      request: req,
      date: new Date()
    }, function(success, code, result) {
      if (success) {
        res.json(result);
      } else {
        res.status(code);
        res.send(result);
      }
    });
  }
});

//FAILURES
app.post('/failures', function(req, res) {
  if (req.body == null) {
    res.status(400);
    res.send(errorResponse("No data specified"));
  } else {
    if (req.body.dev_id == null || req.body.detail == null) {
      res.status(400);
      res.send("Required field missing");
    } else {
      CASSANDRA_C.postFailure({
        fields: req.body,
        request: req,
        date: new Date()
      }, function(success, code, result) {
        if (success) {
          res.json(result);
        } else {
          res.status(code);
          res.send(result);
        }
      });
    }
  }
})


//SERVER START AND PORT
app.listen(process.env.PORT || 4730);

function errorResponse(detail) {
  return {
    "status": false,
    "msg": detail,
    "time": new Date()
  }
}

function invalidTokenResponse() {
  return {
    "status": false,
    "msg": "Invalid token",
    "time": new Date()
  }
}