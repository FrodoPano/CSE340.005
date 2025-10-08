const utilities = require(".")
const { body, validationResult } = require("express-validator")
const validate = {}

/* **********************************
 * Review Data Validation Rules
 * ********************************* */
validate.reviewRules = () => {
  return [
    body("review_text")
      .trim()
      .escape()
      .notEmpty()
      .isLength({ min: 10 })
      .withMessage("Review text must be at least 10 characters long."),

    body("review_rating")
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be between 1 and 5."),
  ]
}

/* ******************************
 * Check review data and return errors or continue
 * ***************************** */
validate.checkReviewData = async (req, res, next) => {
  const { review_text, review_rating, inv_id, review_id } = req.body
  let errors = []
  errors = validationResult(req)
  if (!errors.isEmpty()) {
    let nav = await utilities.getNav()
    
    if (review_id) {
      // Editing existing review
      const reviewModel = require("../models/review-model")
      const review = await reviewModel.getReviewById(parseInt(review_id))
      return res.render("reviews/edit-review", {
        errors,
        title: "Edit Review",
        nav,
        review_id,
        review_text,
        review_rating,
        inv_make: review.inv_make,
        inv_model: review.inv_model,
        inv_id: review.inv_id,
      })
    } else {
      // Adding new review
      return res.render("reviews/add-review", {
        errors,
        title: "Add Review",
        nav,
        inv_id,
        review_text,
        review_rating,
      })
    }
  }
  next()
}

module.exports = validate