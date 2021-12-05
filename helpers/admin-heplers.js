var db=require('../config/connection')
var collections=require('../config/collections')
const bcrypt = require("bcrypt");
var objId=require('mongodb').ObjectId;
const { Collection } = require('mongodb');
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
   refunded:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.ORDER_COLLECTION).updateOne({_id:objId(orderId)},{$set:{status:'refunded'}},{multi:true}).then((response)=>{
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
      },
      getUser:(userId)=>{
        return new Promise(async(resolve,reject)=>{
          let user=await db.get().collection(collections.USER_COLLECTION).findOne({_id:objId(userId)})
          resolve(user)
        })
      },
      getOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
          let orderItems = await db
            .get()
            .collection(collections.ORDER_COLLECTION)
            .aggregate([
              {
                $match: { _id: objId(orderId) },
              },
              {
                $unwind: "$products",
              },
              {
                $project: {
                  item: "$products.item",
                  quantity: "$products.quantity",
                },
              },
              {
                $lookup: {
                  from: collections.PRODUCT_COLLECTION,
                  localField: "item",
                  foreignField: "_id",
                  as: "product",
                },
              },
              {
                $project: {
                  item: 1,
                  quantity: 1,
                  product: { $arrayElemAt: ["$product", 0] },
                },
              },
            ])
            .toArray();
          resolve(orderItems);
        });
      },
      getAllDeliveries:()=>{
        return new Promise(async(resolve,reject)=>{
          let deliveries=await db.get().collection(collections.DELIVERED_COLLECTION).find().toArray()
          resolve(deliveries)
        })
      }
}