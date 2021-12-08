var db = require("../config/connection");
var collections = require("../config/collections");
const bcrypt = require("bcrypt");
var objId = require("mongodb").ObjectId;
const Razorpay=require('razorpay')
var instance = new Razorpay({
  key_id: 'rzp_test_jeSJDyjQXSi8Bg',
  key_secret: 'QN3cZuUF64FBUkL4tDkbOZLy',
});

module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      let data=
      {
        name:userData.name,
        username:userData.username,
        email:userData.email,
        password:userData.password = await bcrypt.hash(userData.password, 10),
        profile:false
      }
      db.get()
        .collection(collections.USER_COLLECTION)
        .insertOne(data)
        .then((data) => {
          resolve(data);
        });
    });
  },
  getSessionUser:(userId)=>{
    return new Promise(async(resolve,reject)=>{
      let user=await db.get().collection(collections.USER_COLLECTION).findOne({_id:objId(userId)})
        resolve(user);
      })
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
            response.user = user;
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
  addToCart: (proId, userId) => {
    let proObj = {
      item: objId(proId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .findOne({ user: objId(userId) });
      if (userCart) {
        let proExist = userCart.products.findIndex(
          (product) => product.item == proId
        );
        if (proExist != -1) {
          db.get()
            .collection(collections.CART_COLLECTION)
            .updateOne(
              { user: objId(userId), "products.item": objId(proId) },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then(() => {
              resolve();
            });
        } else {
          db.get()
            .collection(collections.CART_COLLECTION)
            .updateOne(
              { user: objId(userId) },
              {
                $push: { products: proObj },
              }
            )
            .then((response) => {
              resolve();
            });
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
  changeProductQuantity: (details) => {
    details.count = parseInt(details.count);
    details.quantity = parseInt(details.quantity);
    return new Promise((resolve, reject) => {
      if (details.count == -1 && details.quantity == 1) {
        db.get()
          .collection(collections.CART_COLLECTION)
          .update(
            { _id: objId(details.cart) },
            {
              $pull: { products: { item: objId(details.product) } },
            }
          )
          .then((response) => {
            resolve({ removeProduct: true });
          });
      } else {
        db.get()
          .collection(collections.CART_COLLECTION)
          .update(
            {
              _id: objId(details.cart),
              "products.item": objId(details.product),
            },
            {
              $inc: { "products.$.quantity": details.count },
            }
          )
          .then((response) => {
            resolve({ status: true });
          });
      }
    });
  },
  removeCartProduct: (cartId, userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.CART_COLLECTION)
        .update(
          { user: objId(userId) },
          { $pull: { products: { item: objId(cartId) } } }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objId(userId) },
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
          // let price=parseInt(product.price),
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ["$quantity", "$product.price"] } },
            },
          },
        ])
        .toArray();
      resolve(total[0].total);
    });
  },
  placeOrder: (order, products, total) => {
    return new Promise(async (resolve, reject) => {
      let status = order.paymentMethod === "cod" ? "placed" : "pending";
      let orderObj = {
        deliveryDetails: {
          mobile: order.mobile,
          address: order.address,
          pincode: order.pincode,
        },
        userId: objId(order.userId),
        paymentMethod: order.paymentMethod,
        products: products,
        total: total,
        status: status,
        date: new Date(),
      };
      db.get()
        .collection(collections.ORDER_COLLECTION)
        .insertOne(orderObj)
        .then((response) => {
          db.get()
            .collection(collections.CART_COLLECTION)
            .deleteOne({ user: objId(order.userId) });
          resolve(response.insertedId);
        });
    });
  },
  buyNow: (order) => {
    return new Promise(async (resolve, reject) => {
      order.total=parseInt(order.total)
      let status = order.paymentMethod === "cod" ? "placed" : "pending";
      let orderObj = {
        deliveryDetails: {
          mobile: order.mobile,
          address: order.address,
          pincode: order.pincode,
        },
        userId: objId(order.userId),
        paymentMethod: order.paymentMethod,
        products: [
          {
            item:objId(order.productId),
            quantity:1
          }
        ],
        total: order.total,
        status: status,
        date: new Date(),
      };
      db.get()
        .collection(collections.ORDER_COLLECTION)
        .insertOne(orderObj)
        .then((response) => {
          resolve(response.insertedId);
        });
    });
  },
  getCartProductList: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .findOne({ user: objId(userId) });
      resolve(cart.products);
    });
  },
  getAllOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collections.ORDER_COLLECTION)
        .find({ userId: objId(userId) })
        .toArray();
      resolve(orders);
    });
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
  editProfile:(userId,details)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collections.USER_COLLECTION).updateOne({_id:objId(userId)},{
        $set:{
          name:details.name,
          username:details.username,
          email:details.email
        }
      }).then(()=>{
        resolve()
      })
    })
  },
  deleteAccount:(account)=>{
    return new Promise(async(resolve,reject)=>{
     user=await db.get().collection(collections.USER_COLLECTION).findOne({username:account.username})
     if(user){
       bcrypt.compare(account.password,user.password).then((state)=>{
         if(state){
           db.get().collection(collections.USER_COLLECTION).deleteOne({username:account.username}).then((details)=>{
             resolve({status:true})
           })
         }else{
           resolve({status:false})
         }
       })
     }
    })
  },
  cancelOrder:(orderId,method)=>{
    return new Promise((resolve,reject)=>{
      if(method=='cod'){
        db.get().collection(collections.ORDER_COLLECTION).deleteOne({_id:objId(orderId)}).then(()=>{
          resolve()
        })
      }else{ 
        db.get().collection(collections.ORDER_COLLECTION).updateOne({_id:objId(orderId)},{$set:{status:"cancelled"}}).then(()=>{
          resolve()
        })
      }
    })
  },
  delivering:(orderId)=>{
    return new Promise(async(resolve,reject)=>{
      let order=await db.get().collection(collections.ORDER_COLLECTION).findOne({_id:objId(orderId)})
      let delivery={
        deliveryDetails:order.deliveryDetails,
        userId:objId(order.userId),
        paymentMethod:order.paymentMethod,
        products:order.products,
        total:order.total,
        status:"Delivered",
        orderData:order.date,
        deliveryDate:new Date()
      }
      db.get().collection(collections.DELIVERED_COLLECTION).insertOne(delivery).then(()=>{
        db.get().collection(collections.ORDER_COLLECTION).deleteOne({_id:objId(orderId)}).then(()=>{
          resolve()
        })
      })
    })
  },
  getDeliveries:(userId)=>{
    return new Promise(async(resolve,reject)=>{
      let delivery=await db.get().collection(collections.DELIVERED_COLLECTION).find({userId:objId(userId)}).toArray()
      resolve(delivery)
    })
  },
  yesIGotRefund:(orderId)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collections.ORDER_COLLECTION).deleteOne({_id:objId(orderId)}).then(()=>{
        resolve()
      })
    })
  },
  setProfilePicture:(userId)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collections.USER_COLLECTION).update({_id:objId(userId)},{$set:{profile:true}}).then(()=>{
        resolve()
      })
    })
  },
  removeProfilePicture:(userId)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collections.USER_COLLECTION).updateOne({_id:objId(userId)},{$set:{profile:false}}).then(()=>{
        resolve()
      })
    })
  },
  generateRazorpay:(orderId,total)=>{
    return new Promise((resolve,reject)=>{
      instance.orders.create({  amount: total*100,  currency: "INR",  receipt: ""+orderId,  notes: {    key1: "value3",    key2: "value2"  }},(err,order)=>{
        console.log(order);
        resolve(order)
      })
    })
  },
  verifyPayment:(details)=>{
    return new Promise((resolve,reject)=>{
      const crypto=require('crypto')
      let hmac = crypto.createHmac('sha256', 'QN3cZuUF64FBUkL4tDkbOZLy')
      hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
      hmac=hmac.digest('hex')
      if(hmac==details['payment[razorpay_signature]']){
        resolve()
      }else{
        reject()
      }
    })
  },
  changePaymentStatus:(orderId)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collections.ORDER_COLLECTION).updateOne({_id:objId(orderId)},{$set:{status:"placed"}}).then(()=>{
        resolve()
      })
    })
  }
};
