var db = require("../config/connection");
var collections = require("../config/collections");
const bcrypt = require("bcrypt");
module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      userData.password = await bcrypt.hash(userData.password, 10).then(hash);
      db.get().collection(collections.USER_COLLECTION).insertOne(userData);
    });
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let response={}
      let user;
      if (
        (user = await db
          .get()
          .collection(collections.USER_COLLECTION)
          .findOne({ username: userData.username }))
      ) {
        if (user) {
          bcrypt.compare(userData.password, user.password).then((status) => {
            if (status) {
              console.log("Login Success");
              response.user=user;
              response.status=true;
              resolve(response);
            } else {
              console.log("Login Failed");
              resolve({status:false});
            }
          });
        } else {
          console.log("Login failed");
          resolve({status:false});
        }
      } else if (
        (user = await db
          .get()
          .collection(collections.USER_COLLECTION)
          .findOne({ email: userData.email }))
      ) {
        if (user) {
          bcrypt.compare(userData.password, user.password).then((status) => {
            if (status) {
              console.log("Login Success");
              response.user=user;
              response.status=true;
              resolve(response);
            } else {
              console.log("Login Failed");
              resolve({status:false});
            }
          });
        } else {
          console.log("Login failed");
          resolve({status:false});
        }
      }
    });
  },
};
