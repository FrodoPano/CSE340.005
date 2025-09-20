const utilities = require("../utilities/")
const baseController = {}

baseController.buildHome = async function(req, res){
  const nav = await utilities.getNav()


// Test flash message - remove this after testing
  req.flash("notice", "This is a test flash message.")

  res.render("index", {title: "Home", nav})
}

module.exports = baseController