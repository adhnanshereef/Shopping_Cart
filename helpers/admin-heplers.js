var db=require('../config/connection')
var collections=require('../config/collections')
const bcrypt = require("bcrypt");
var objId=require('mongodb').ObjectId
module.exports={
    getAllOrders:()=>{
        return new Promise(async(resolve,reject)=>{
            let orders=await db.get().collection(collections.ORDER_COLLECTION).find().toArray()
            resolve(orders)
        })
    },
    postAOrderAsShipped:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.ORDER_COLLECTION).updateOne({_id:objId(orderId)},{$set:{status:'shipped'}},{multi:true}).then((response)=>{
                resolve()
            })
        })
    },
    cancelShipped:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.ORDER_COLLECTION).updateOne({_id:objId(orderId)},{$set:{status:'placed'}},{multi:true}).then((response)=>{
                resolve()
            })
        })
    },
    getAllUsers:()=>{
        return new Promise(async(resolve,reject)=>{
            let users=await db.get().collection(collections.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },
    doLogin: (adminData) => {
        return new Promise(async (resolve, reject) => {
          let response = {};
          let admin = await db
            .get()
            .collection(collections.ADMIN_COLLECTION)
            .findOne({ username: adminData.username });
          if (admin) {
            bcrypt.compare(adminData.password, admin.password).then((status) => {
              if (status) {
                response.admin = admin;
                response.status = true;
                resolve(response);
              } else {
                resolve({ status: false });
              }
            });
          } else {
            resolve({ status: false });
          }
        });
      }
}