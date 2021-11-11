var db=require('../config/connection')
var collections=require('../config/collections')
var objId=require('mongodb').ObjectId
module.exports={
    addProduct:(product,callback)=>{
        db.get().collection('product').insertOne(product).then(function(data){
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
    }
}