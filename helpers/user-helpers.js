var db = require("../config/connection");
var collections = require("../config/collections");
const bcrypt = require("bcrypt");
var objId = require("mongodb").ObjectId;
module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      userData.password = await bcrypt.hash(userData.password, 10);
      db.get()
        .collection(collections.USER_COLLECTION)
        .insertOne(userData)
        .then((data) => {
          resolve(data);
        });
    });
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let user = await db
        .get()
        .collection(collections.USER_COLLECTION)
        .findOne({ username: userData.username });
      if (user) {
        bcrypt.compare(userData.password, user.password).then((status) => {
          if (status) {
            console.log("Login Success");
            response.user = user;
            response.status = true;
            resolve(response);
          } else {
            console.log("Login Failed");
            resolve({ status: false });
          }
        });
      } else {
        console.log("Login failed");
        resolve({ status: false });
      }
    });
  },
  addToCart: (proId, userId) => {
    let proObj = {
      item: objId(proId),
      quantity:1
    };
    return new Promise(async (resolve, reject) => {
      let userCart = await db.get()
        .collection(collections.CART_COLLECTION)
        .findOne({ user: objId(userId) });
      if (userCart) {
        let proExist = userCart.products.findIndex(product=> product.item==proId)
        console.log(proExist);
        if(proExist!=-1){
          db.get()
            .collection(collections.CART_COLLECTION)
            .updateOne({user:objId(userId),'products.item':objId(proId)},
              {
                $inc:{'products.$.quantity':1}
              }
            ).then(()=>{
              resolve()
            })
        }else{

          db.get().collection(collections.CART_COLLECTION).updateOne({user:objId(userId)},
          {
            $push:{products:proObj}
          }).then((response)=>{
            resolve()
          })
        }
        } else {
        let cartObj = {
          user: objId(userId),
          products: [proObj],
        };
        db.get()
          .collection(collections.CART_COLLECTION)
          .insertOne(cartObj)
          .then((response) => {
            resolve();
          });
      }
    });
  },
  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objId(userId) },
          },
          {
            $unwind:'$products'
          },
          {
            $project:{
              item:'$products.item',
              quantity:'$products.quantity'
            }
          },
          {
            $lookup:{
              from:collections.PRODUCT_COLLECTION,
              localField:'item',
              foreignField:'_id',
              as:'product'
            }
          },
          {
            $project:{
              item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
            }
          }
        ])
        .toArray();
        // console.log(cartItems);
      resolve(cartItems);
    });
  },
  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .findOne({ user: objId(userId) });
      if (cart) {
        count = cart.products.length;
      }
      resolve(count);
    });
  },
  changeProductQuantity:(details)=>{
    details.count=parseInt(details.count)
    details.quantity=parseInt(details.quantity)
    return new Promise((resolve,reject)=>{
      if(details.count==-1 && details.quantity==1){
        db.get()
        .collection(collections.CART_COLLECTION).update({_id:objId(details.cart)},
        {
          $pull:{products:{item:objId(details.product)}}
        }).then((response)=>{
          resolve({removeProduct:true})
        })
          }else{
            db.get()
            .collection(collections.CART_COLLECTION)
            .update({_id:objId(details.cart),'products.item':objId(details.product)},
            {
              $inc:{'products.$.quantity':details.count}
            }
            ).then((response)=>{
              resolve(true)
            })
          }
    })
  },
  removeCartProduct:(cartId,userId)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collections.CART_COLLECTION).update({user:objId(userId)},{$pull:{products:{item:objId(cartId)}}}).then((response)=>{
        resolve(response)
    })
    })
  },
  getTotalAmount:(userId)=>{
    return new Promise(async(resolve, reject) => {
      let total=await db.get().collection(collections.CART_COLLECTION).aggregate([
          {
            $match: { user: objId(userId) },
          },
          {
            $unwind:'$products'
          },
          {
            $project:{
              item:'$products.item',
              quantity:'$products.quantity'
            }
          },
          {
            $lookup:{
              from:collections.PRODUCT_COLLECTION,
              localField:'item',
              foreignField:'_id',
              as:'product'
            }
          },
          {
            $project:{
              item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
            }
          },
          // let price=parseInt(product.price),
          {
            $group:{
              _id:null,
              total:{$sum:{$multiply:['$quantity','$product.price']}}
            }
          }
        ])
        .toArray();
        // console.log(total);
      resolve(total[0].total);
    });
  }
};