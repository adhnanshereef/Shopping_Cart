var db=require('../config/connection')
var collections=require('../config/collections')
var objId=require('mongodb').ObjectId
module.exports={
    addProduct:(product,callback)=>{
        product.price=parseInt(product.price)
        db.get().collection(collections.PRODUCT_COLLECTION).insertOne(product).then(function(data){
            callback(data.insertedId)
        })
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.PRODUCT_COLLECTION).deleteOne({_id:objId(proId)}).then((response)=>{
                resolve(response)
            })
        })
    },
    getProductsDetails:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.PRODUCT_COLLECTION).findOne({_id:objId(proId)}).then((product)=>{
                resolve(product)
            })
        })
    },
    updateProduct:(proId,proDetails)=>{
        proDetails.price=parseInt(proDetails.price)
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.PRODUCT_COLLECTION).updateOne({_id:objId(proId)},{
                $set:{
                    name:proDetails.name,
                    description:proDetails.description,
                    price:proDetails.price,
                    category:proDetails.category
                }
            }).then((response)=>{
                resolve()
            })
        })
    }
}