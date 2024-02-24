const express = require("express");
const router = express.Router();
const shopController = require("../controller/shopController");


/* GET users listing. */
router.get("/", shopController.getHome);


module.exports = router;