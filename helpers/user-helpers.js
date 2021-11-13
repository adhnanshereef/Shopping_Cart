var db = require("../config/connection");
var collections = require("../config/collections");
const bcrypt = require("bcrypt");
var objId=require('mongodb').ObjectId
module.exports = {
  doSignup: (userData) => {
    return new Promise(async(resolve, reject) => {
      userData.password=await bcrypt.hash(userData.password, 10)
      db.get().collection(collections.USER_COLLECTION).insertOne(userData).then((data)=>{
        resolve(data)
      })
    });
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let response={}
      let user = await db
          .get()
          .collection(collections.USER_COLLECTION)
          .findOne({ username: userData.username })
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
    });
  },
  addToCart:(proId,userId)=>{
    return new Promise(async(resolve,reject)=>{
      let userCart=await db.get().collection(collections.CART_COLLECTION).findOne({user:objId(userId)})
      if(userCart){
        db.get().collection(collections.CART_COLLECTION).updateOne({user:objId(userId)},
        {
          $push:{products:objId(proId)}
        }).then((response)=>{
          resolve()
        })
      }else{
        let cartObj={
          user:objId(userId),
          products:[objId(proId)]
        }
        db.get().collection(collections.CART_COLLECTION).insertOne(cartObj).then((response)=>{
          resolve()
        })
      }
    })
  },
  getCartProducts:(userId)=>{
    return new Promise(async(resolve,reject)=>{
      let cartItems=await db.get().collection(collections.CART_COLLECTION).aggregate([
        {
          $match:{user:objId(userId)}
        },
        {
          $lookup:{
            from:collections.PRODUCT_COLLECTION,
            let:{prodList:'$products'},
            pipeline:[
              {
                $match:{
                  $expr:{
                    $in:['$_id','$$prodList']
                  }
                }
              }
            ],
            as:'cartItems'
          }
        }
      ]).toArray()
      resolve(cartItems[0].cartItems)
    })
  }
};
