var _ = require('underscore');

exports.ALL_ORGANIZATIONS = "SELECT * FROM Organizations";

//GET QUERIES
exports.GET_LOCATIONS_BY_ORG =
  "SELECT * FROM Locations WHERE org_id = ? ALLOW FILTERING";
exports.GET_PARKING_LOTS_BY_LOC = "SELECT * FROM Parking_Lots WHERE loc_id = ?";
exports.GET_SPOTS_BY_PAR = "SELECT * FROM Spots WHERE par_id = ?";

//FIND QUERIES
exports.FIND_ORGANIZATION_BY_ID = "SELECT * FROM Organizations WHERE id = ?";
exports.FIND_DEVICE_BY_ID = "SELECT * FROM Devices WHERE id = ?";
exports.FIND_ORGANIZATION_BY_NAME =
  "SELECT * FROM Organizations WHERE name = ?";
exports.FIND_LOCATION_BY_ID = "SELECT * FROM Locations WHERE id = ?";
exports.FIND_LOCATION_BY_NAME_ORG_ID =
  "SELECT * FROM Locations WHERE org_id = ? AND name = ? ALLOW FILTERING";
exports.FIND_PARKING_LOT_BY_ID = "SELECT * FROM Parking_Lots WHERE id = ?";
exports.FIND_PARKING_LOT_BY_NAME_LOC_ID =
  "SELECT * FROM Parking_Lots WHERE loc_id = ? AND name = ? ALLOW FILTERING";
exports.FIND_SPOT_BY_ID = "SELECT * FROM Spots WHERE id = ?";
exports.FIND_SPOT_BY_CODE_PAR_ID =
  "SELECT * FROM Spots WHERE par_id = ? AND code = ? ALLOW FILTERING";
exports.FIND_DEVICE_BY_ID = "SELECT * FROM Devices WHERE id = ?";

//CREATE QUERIES
exports.CREATE_ORGANIZATION =
  "INSERT INTO Organizations(id, name, bussiness_area, country, state_province, city, creation_date, enabled) VALUES (?, ?, ?, ?, ?, ?, ?, true)";
exports.CREATE_LOCATION =
  "INSERT INTO Locations(id, name, org_id, enabled) VALUES(?, ?, ?, 1)";
exports.CREATE_PARKING_LOT =
  "INSERT INTO Parking_Lots(id, name, org_id, loc_id, enabled) VALUES(?, ?, ?, ?, 1)";
exports.CREATE_SPOT =
  "INSERT INTO Spots(id, code, latitude, longitude, org_id, loc_id, par_id, enabled) VALUES(?, ?, ?, ?, ?, ?, ?, 1)";
exports.CREATE_DEVICE = "INSERT INTO Devices(id, status, working, failures, reset_times) VALUES(?, false, false, 0, 0);"
exports.CREATE_LOG = "INSERT INTO Log(id, request, action, source_ip, username, org_id, org, date) VALUES(?,?,?,?,?,?,?,?)"
exports.CREATE_FAILURE = "INSERT INTO Failures(id, dev_id, detail, username, date) VALUES(?,?,?,?,?)"

//UPDATE QUERIES
exports.UPDATE_ORGANIZATION = "UPDATE Organizations SET name = ? WHERE id = ?";
exports.UPDATE_LOCATION =
  "UPDATE Locations SET name = ? WHERE id = ?";
exports.UPDATE_PARKING_LOT =
  "UPDATE Parking_Lots SET name = ? WHERE id = ?";
exports.UPDATE_SPOT_CODE =
  "UPDATE Spots SET code = ? WHERE id = ?";
exports.UPDATE_SPOT_LATITUDE =
  "UPDATE Spots SET latitude = ? WHERE id = ?";
exports.UPDATE_SPOT_LONGITUDE =
  "UPDATE Spots SET longitude = ? WHERE id = ?";
exports.UPDATE_SPOT_STATUS =
  "UPDATE Spots SET status = ? WHERE id = ?";

//DELETE QUERIES
exports.DELETE_ORGANIZATION_BY_ID =
  "UPDATE Organizations SET enabled = false WHERE id = ?";
exports.DELETE_LOCATION_BY_ID = "UPDATE Locations SET enabled = false WHERE id = ?";
exports.DELETE_SPOT_BY_ID = "UPDATE Spots SET enabled = false WHERE id = ?";
exports.DELETE_PARKING_LOT_BY_ID =
  "UPDATE Parking_Lots SET enabled = false WHERE id = ?";

//LOCATION QUERIES
exports.LOCATIONS_IDS_BY_ORG = "SELECT id FROM Locations WHERE org_id = ?";

//PARKINGLOT QUERIES
exports.PARKING_LOTS_IDS_BY_ORG = "SELECT id FROM Parking_Lots WHERE org_id = ?";
exports.PARKING_LOTS_IDS_BY_LOC = "SELECT id FROM Parking_Lots WHERE loc_id = ?";

//SPOT QUERIES
exports.SPOTS_IDS_BY_ORG = "SELECT id FROM Spots WHERE org_id = ?";
exports.SPOTS_IDS_BY_LOC = "SELECT id FROM Spots WHERE loc_id = ?";
exports.SPOTS_IDS_BY_PAR = "SELECT id FROM Spots WHERE par_id = ?";

//USERS QUERIES
exports.CREATE_USER =
  "INSERT INTO Users(id, contact_email, contact_phone, first_name, last_name, username, password, rol, creation_date, enabled) VALUES (?,?,?,?,?,?,?,?,?,true)";
exports.FIND_USER_BY_USERNAME = "SELECT * FROM Users WHERE username = ?";

exports.buildGetOrganizations = function(data) {
  var fields = "";
  var specifics = [];
  if (data.fields != null) {
    for (var i = 0; i < data.fields.length - 1; i++) {
      fields += data.fields[i] + ",";
    }
    fields += data.fields[data.fields.length - 1];
  } else {
    fields = "*";
  }
  if (data.specifics != null) {
    if (!_.isEmpty(data.specifics.name)) {
      specifics.push("name = '" + data.specifics.name + "'");
    }
    if (!_.isEmpty(data.specifics.bussiness_area)) {
      specifics.push("bussiness_area = '" + data.specifics.bussiness_area + "'");
    }
    if (!_.isEmpty(data.specifics.country)) {
      specifics.push("country = '" + data.specifics.country + "'");
    }
    if (!_.isEmpty(data.specifics.state_province)) {
      specifics.push("state_province = '" + data.specifics.state_province + "'");
    }
    if (!_.isEmpty(data.specifics.city)) {
      specifics.push("city = '" + data.specifics.city + "'");
    }
    if (!_.isEmpty(data.specifics.enabled)) {
      specifics.push("enabled = '" + data.specifics.enabled + "'");
    }
    var _specifics = "WHERE ";
    for (var i = 0; i < specifics.length - 1; i++) {
      _specifics += specifics[i] + " AND ";
    }
    _specifics += specifics[specifics.length - 1];
    return "SELECT " + fields + " FROM Organizations " + _specifics;
  } else {
    return "SELECT " + fields + " FROM Organizations";
  }
}

exports.buildPutOrganization = function(data) {
  var _fields = [];
  if (!_.isEmpty(data.fields.name)) {
    _fields.push("name = '" + data.fields.name + "'");
  }
  if (!_.isEmpty(data.fields.country)) {
    _fields.push("country = '" + data.fields.country + "'");
  }
  if (!_.isEmpty(data.fields.state_province)) {
    _fields.push("state_province = '" + data.fields.state_province + "'");
  }
  if (!_.isEmpty(data.fields.city)) {
    _fields.push("city = '" + data.fields.city + "'");
  }
  if (!_.isEmpty(data.fields.photos)) {
    _fields.push("photos = " + photos);
  }
  if (!_.isEmpty(data.fields.logo)) {
    _fields.push("photos = " + logo);
  }
  if (!_.isEmpty(data.fields.bussiness_area)) {
    _fields.push("bussiness_area = '" + data.fields.bussiness_area + "'");
  }
  var fields = "";
  for (var i = 0; i < _fields.length - 1; i++) {
    fields += _fields[i] + ", ";
  }
  fields += _fields[_fields.length - 1];
  return "UPDATE Organizations SET " + _fields + " WHERE id = " + data.id;
}

exports.buildGetOrganizationsLocations = function(data) {
  var fields = "";
  var specifics = [];
  if (data.fields != null) {
    for (var i = 0; i < data.fields.length - 1; i++) {
      fields += data.fields[i] + ",";
    }
    fields += data.fields[data.fields.length - 1];
  } else {
    fields = "*";
  }
  if (data.specifics != null) {
    if (!_.isEmpty(data.specifics.name)) {
      specifics.push("name = '" + data.specifics.name + "'");
    }
    if (!_.isEmpty(data.specifics.headquarter)) {
      specifics.push("headquarter = " + data.specifics.headquarter);
    }
    if (!_.isEmpty(data.specifics.country)) {
      specifics.push("country = '" + data.specifics.country + "'");
    }
    if (!_.isEmpty(data.specifics.state_province)) {
      specifics.push("state_province = '" + data.specifics.state_province + "'");
    }
    if (!_.isEmpty(data.specifics.city)) {
      specifics.push("city = '" + data.specifics.city + "'");
    }
    if (!_.isEmpty(data.specifics.address)) {
      specifics.push("address = '" + data.specifics.address + "'");
    }
    if (!_.isEmpty(data.specifics.enabled)) {
      specifics.push("enabled = '" + data.specifics.enabled + "'");
    }
    var _specifics = "";
    if (specifics.length != 0) {
      for (var i = 0; i < specifics.length - 1; i++) {
        _specifics += specifics[i] + " AND ";
      }
      _specifics += specifics[specifics.length - 1] + " AND org_id = " + data.org_id;
      return "SELECT " + fields + " FROM Locations WHERE " + _specifics + " ALLOW FILTERING";
    } else {
      return "SELECT " + fields + " FROM Locations ALLOW FILTERING";
    }
  } else {
    return "SELECT " + fields + " FROM Locations WHERE org_id = " + data.org_id + " ALLOW FILTERING";
  }
}

exports.buildPostLocation = function(id, data) {
  var _fields = ["id", "enabled", "creation_date"];
  var _values = [id, true, data.date.getTime()];
  if (!_.isEmpty(data.fields.address)) {
    _values.push("'" + data.fields.address + "'");
    _fields.push("address");
  }
  if (!_.isEmpty(data.fields.boundaries)) {
    _values.push("'" + data.fields.boundaries + "'");
    _fields.push("boundaries");
  }
  if (!_.isEmpty(data.fields.city)) {
    _values.push("'" + data.fields.city + "'");
    _fields.push("city");
  }
  if (!_.isEmpty(data.fields.contact_name)) {
    _values.push("'" + data.fields.contact_name + "'");
    _fields.push("contact_name");
  }
  if (!_.isEmpty(data.fields.contact_phone)) {
    _values.push("'" + data.fields.contact_phone + "'");
    _fields.push("contact_phone");
  }
  if (!_.isEmpty(data.fields.contact_email)) {
    _values.push("'" + data.fields.contact_email + "'");
    _fields.push("contact_email");
  }
  if (!_.isEmpty(data.fields.country)) {
    _values.push("'" + data.fields.country + "'");
    _fields.push("country");
  }
  if (!_.isEmpty(data.fields.creation_date)) {
    _values.push("'" + data.date + "'");
    _fields.push("creation_date");
  }
  if (!_.isEmpty(data.fields.enabled)) {
    _values.push("true");
    _fields.push("enabled");
  }
  if (!_.isEmpty(data.fields.headquarter)) {
    _values.push(data.fields.headquarter);
    _fields.push("headquarter");
  }
  if (!_.isEmpty(data.fields.name)) {
    _values.push("'" + data.fields.name + "'");
    _fields.push("name");
  }
  if (!_.isEmpty(data.org_id)) {
    _values.push(data.org_id);
    _fields.push("org_id");
  }
  if (!_.isEmpty(data.fields.state_province)) {
    _values.push("'" + data.fields.state_province + "'");
    _fields.push("state_province");
  }
  var values = "";
  var fields = "";
  for (var i = 0; i < _values.length - 1; i++) {
    values += _values[i] + ",";
    fields += _fields[i] + ",";
  }
  values += _values[_values.length - 1];
  fields += _fields[_fields.length - 1];
  return "INSERT INTO Locations(" + fields + ") VALUES(" + values + ")";
}

exports.buildPutLocation = function(data) {
  var _fields = [];
  if (!_.isEmpty(data.fields.name)) {
    _fields.push("name = '" + data.fields.name + "'");
  }
  if (!_.isEmpty(data.fields.headquarter)) {
    _fields.push("headquarter = " + data.fields.headquarter);
  }
  if (!_.isEmpty(data.fields.contact_name)) {
    _fields.push("contact_name = '" + data.fields.contact_name + "'");
  }
  if (!_.isEmpty(data.fields.contact_phone)) {
    _fields.push("contact_phone = '" + data.fields.contact_phone + "'");
  }
  if (!_.isEmpty(data.fields.contact_email)) {
    _fields.push("contact_email = '" + data.fields.contact_email + "'");
  }
  if (!_.isEmpty(data.fields.boundaries)) {
    _fields.push("boundaries = '" + data.fields.boundaries + "'");
  }
  if (!_.isEmpty(data.fields.country)) {
    _fields.push("country = '" + data.fields.country + "'");
  }
  if (!_.isEmpty(data.fields.state_province)) {
    _fields.push("state_province = '" + data.fields.state_province + "'");
  }
  if (!_.isEmpty(data.fields.city)) {
    _fields.push("city = '" + data.fields.city + "'");
  }
  if (!_.isEmpty(data.fields.address)) {
    _fields.push("address = '" + data.fields.address + "'");
  }
  if (!_.isEmpty(data.fields.devices_off)) {
    _fields.push("devices_off =" + data.fields.devices_off);
  }
  if (!_.isEmpty(data.fields.devices_stored)) {
    _fields.push("devices_stored =" + data.fields.devices_stored);
  }
  var fields = "";
  for (var i = 0; i < _fields.length - 1; i++) {
    fields += _fields[i] + ", ";
  }
  fields += _fields[_fields.length - 1];
  return "UPDATE Locations SET " + _fields + " WHERE id = " + data.id;
}

exports.buildGetLocationsParking_Lots = function(data) {
  var fields = "";
  var specifics = [];
  if (data.fields != null) {
    for (var i = 0; i < data.fields.length - 1; i++) {
      fields += data.fields[i] + ",";
    }
    fields += data.fields[data.fields.length - 1];
  } else {
    fields = "*";
  }
  if (data.specifics != null) {
    if (!_.isEmpty(data.specifics.name)) {
      specifics.push("name = '" + data.specifics.name + "'");
    }
    if (!_.isEmpty(data.specifics.enabled)) {
      specifics.push("enabled =" + data.specifics.enabled);
    }
    var _specifics = "";
    if (specifics.length != 0) {
      for (var i = 0; i < specifics.length - 1; i++) {
        _specifics += specifics[i] + " AND ";
      }
      _specifics += specifics[specifics.length - 1] + " AND loc_id = " + data.loc_id;
      return "SELECT " + fields + " FROM Parking_Lots WHERE " + _specifics + " ALLOW FILTERING";
    } else {
      return "SELECT " + fields + " FROM Parking_Lots ALLOW FILTERING";
    }
  } else {
    return "SELECT " + fields + " FROM Parking_Lots WHERE loc_id = " + data.loc_id + " ALLOW FILTERING";
  }
}

exports.buildPostParking_Lot = function(id, data) {
  var _fields = ["id", "enabled", "creation_date"];
  var _values = [id, true, data.date.getTime()];
  if (!_.isEmpty(data.fields.name)) {
    _values.push("'" + data.fields.name + "'");
    _fields.push("name");
  }
  if (!_.isEmpty(data.fields.boundaries)) {
    _values.push("'" + data.fields.boundaries + "'");
    _fields.push("boundaries");
  }
  if (!_.isEmpty(data.org_id)) {
    _values.push(data.org_id);
    _fields.push("org_id");
  }
  if (!_.isEmpty(data.loc_id)) {
    _values.push(data.loc_id);
    _fields.push("loc_id");
  }
  var values = "";
  var fields = "";
  for (var i = 0; i < _values.length - 1; i++) {
    values += _values[i] + ",";
    fields += _fields[i] + ",";
  }
  values += _values[_values.length - 1];
  fields += _fields[_fields.length - 1];
  return "INSERT INTO Parking_Lots(" + fields + ") VALUES(" + values + ")";
}

exports.buildPutParking_Lot = function(data) {
  var _fields = [];
  if (!_.isEmpty(data.fields.name)) {
    _fields.push("name = '" + data.fields.name + "'");
  }
  if (!_.isEmpty(data.fields.boundaries)) {
    _fields.push("boundaries = '" + data.fields.boundaries + "'");
  }
  var fields = "";
  for (var i = 0; i < _fields.length - 1; i++) {
    fields += _fields[i] + ", ";
  }
  fields += _fields[_fields.length - 1];
  return "UPDATE Parking_Lots SET " + _fields + " WHERE id = " + data.id;
}

exports.buildGetParking_LotsSpots = function(data) {
  var fields = "";
  var specifics = [];
  if (data.fields != null) {
    for (var i = 0; i < data.fields.length - 1; i++) {
      fields += data.fields[i] + ",";
    }
    fields += data.fields[data.fields.length - 1];
  } else {
    fields = "*";
  }
  if (data.specifics != null) {
    if (!_.isEmpty(data.specifics.name)) {
      specifics.push("code = '" + data.specifics.code + "'");
    }
    if (!_.isEmpty(data.specifics.enabled)) {
      specifics.push("enabled =" + data.specifics.enabled);
    }
    if (!_.isEmpty(data.specifics.status)) {
      specifics.push("status =" + data.specifics.status);
    }
    if (!_.isEmpty(data.specifics.dev_working)) {
      specifics.push("dev_working =" + data.specifics.dev_working);
    }
    var _specifics = "";
    if (specifics.length != 0) {
      for (var i = 0; i < specifics.length - 1; i++) {
        _specifics += specifics[i] + " AND ";
      }
      _specifics += specifics[specifics.length - 1] + " AND par_id = " + data.par_id;
      return "SELECT " + fields + " FROM Spots WHERE " + _specifics + " ALLOW FILTERING";
    } else {
      return "SELECT " + fields + " FROM Spots ALLOW FILTERING";
    }
  } else {
    return "SELECT " + fields + " FROM Spots WHERE par_id = " + data.par_id + " ALLOW FILTERING";
  }
}

exports.buildPostSpot = function(id, data) {
  var _fields = ["id", "enabled", "creation_date", "status", "par_id", "loc_id", "org_id"];
  var _values = [id, true, data.date.getTime(), false, data.par_id, data.loc_id, data.org_id];
  if (!_.isEmpty(data.fields.code)) {
    _values.push("'" + data.fields.code + "'");
    _fields.push("code");
  }
  if (!_.isEmpty(data.fields.latitude)) {
    _values.push("'" + data.fields.latitude + "'");
    _fields.push("latitude");
  }
  if (!_.isEmpty(data.fields.longitude)) {
    _values.push("'" + data.fields.longitude + "'");
    _fields.push("longitude");
  }
  var values = "";
  var fields = "";
  for (var i = 0; i < _values.length - 1; i++) {
    values += _values[i] + ",";
    fields += _fields[i] + ",";
  }
  values += _values[_values.length - 1];
  fields += _fields[_fields.length - 1];
  return "INSERT INTO Spots(" + fields + ") VALUES(" + values + ")";
}

exports.buildPutSpot = function(data) {
  var _fields = [];
  if (!_.isEmpty(data.fields.code)) {
    _fields.push("code = '" + data.fields.code + "'");
  }
  if (!_.isEmpty(data.fields.latitude)) {
    _fields.push("latitude = '" + data.fields.latitude + "'");
  }
  if (!_.isEmpty(data.fields.longitude)) {
    _fields.push("longitude = '" + data.fields.longitude + "'");
  }
  var fields = "";
  for (var i = 0; i < _fields.length - 1; i++) {
    fields += _fields[i] + ", ";
  }
  fields += _fields[_fields.length - 1];
  return "UPDATE Spots SET " + _fields + " WHERE id = " + data.id;
}