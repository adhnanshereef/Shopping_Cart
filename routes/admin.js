var express = require("express");
const {render}=require('../app')
var router = express.Router();
var productHelpers=require('../helpers/product-helpers')
// const { productHelpers } = require('../helpers/product-helpers');

/* GET users listing. */
router.get("/", function (req, res, next) {

  productHelpers.getAllProducts().then((products)=>{

    res.render("admin/view-products", {
      admin: true,
      products,
      title: "Admin Panel",
    });
  })
});
router.get("/add-products", function (req, res) {
  res.render("admin/add-products",{title:"Add Products"});
});
router.post("/add-products", (req, res) => {
  console.log(req.body);
  console.log(req.files.image);
  productHelpers.addProduct(req.body,(id)=>{
    console.log(id);
    let image=req.files.image
    image.mv('./public/images/'+id+'.jpg',(err,done)=>{
      if(!err){
        res.render('./admin/add-products', {title:"Add Product"})
      }else{
      }
    })
  })
});
module.exports = router;
