const reviewModel = require("../models/review-model")
const utilities = require("../utilities/")

const reviewController = {}

/* ***************************
 *  Build add review view
 * ************************** */
reviewController.buildAddReview = async function (req, res, next) {
  try {
    const inv_id = parseInt(req.params.inv_id)
    let nav = await utilities.getNav()
    
    // Check if user is logged in
    if (!res.locals.loggedin) {
      req.flash("notice", "Please log in to leave a review.")
      return res.redirect(`/inv/detail/${inv_id}`)
    }
    
    // Check if user has already reviewed this vehicle
    const hasReviewed = await reviewModel.hasUserReviewed(res.locals.accountData.account_id, inv_id)
    if (hasReviewed) {
      req.flash("notice", "You have already reviewed this vehicle.")
      return res.redirect(`/inv/detail/${inv_id}`)
    }
    
    res.render("reviews/add-review", {
      title: "Add Review",
      nav,
      errors: null,
      inv_id,
    })
  } catch (error) {
    next(error)
  }
}

/* ***************************
 *  Add new review
 * ************************** */
reviewController.addReview = async function (req, res, next) {
  try {
    const { review_text, review_rating, inv_id } = req.body
    const account_id = res.locals.accountData.account_id
    
    let nav = await utilities.getNav()
    
    // Validation
    if (!review_text || !review_rating || !inv_id) {
      req.flash("notice", "Please fill out all fields.")
      return res.render("reviews/add-review", {
        title: "Add Review",
        nav,
        errors: null,
        inv_id,
        review_text,
        review_rating,
      })
    }
    
    // Check if user has already reviewed
    const hasReviewed = await reviewModel.hasUserReviewed(account_id, inv_id)
    if (hasReviewed) {
      req.flash("notice", "You have already reviewed this vehicle.")
      return res.redirect(`/inv/detail/${inv_id}`)
    }
    
    const result = await reviewModel.addReview(review_text, parseInt(review_rating), account_id, parseInt(inv_id))
    
    if (result && result.rowCount > 0) {
      req.flash("notice", "Thank you for your review!")
      res.redirect(`/inv/detail/${inv_id}`)
    } else {
      req.flash("notice", "Sorry, there was an error adding your review.")
      res.render("reviews/add-review", {
        title: "Add Review",
        nav,
        errors: null,
        inv_id,
        review_text,
        review_rating,
      })
    }
  } catch (error) {
    next(error)
  }
}

/* ***************************
 *  Build edit review view
 * ************************** */
reviewController.buildEditReview = async function (req, res, next) {
  try {
    const review_id = parseInt(req.params.review_id)
    let nav = await utilities.getNav()
    
    const review = await reviewModel.getReviewById(review_id)
    
    if (!review) {
      req.flash("notice", "Review not found.")
      return res.redirect("/account/")
    }
    
    // Check if user owns this review
    if (review.account_id !== res.locals.accountData.account_id && res.locals.accountData.account_type !== 'Admin') {
      req.flash("notice", "You can only edit your own reviews.")
      return res.redirect("/account/")
    }
    
    res.render("reviews/edit-review", {
      title: "Edit Review",
      nav,
      errors: null,
      review_id: review.review_id,
      review_text: review.review_text,
      review_rating: review.review_rating,
      inv_make: review.inv_make,
      inv_model: review.inv_model,
      inv_id: review.inv_id,
    })
  } catch (error) {
    next(error)
  }
}

/* ***************************
 *  Update review
 * ************************** */
reviewController.updateReview = async function (req, res, next) {
  try {
    const { review_id, review_text, review_rating, inv_id } = req.body
    
    let nav = await utilities.getNav()
    
    const result = await reviewModel.updateReview(parseInt(review_id), review_text, parseInt(review_rating))
    
    if (result && result.rowCount > 0) {
      req.flash("notice", "Review updated successfully!")
      res.redirect(`/inv/detail/${inv_id}`)
    } else {
      req.flash("notice", "Sorry, there was an error updating your review.")
      const review = await reviewModel.getReviewById(parseInt(review_id))
      res.render("reviews/edit-review", {
        title: "Edit Review",
        nav,
        errors: null,
        review_id,
        review_text,
        review_rating,
        inv_make: review.inv_make,
        inv_model: review.inv_model,
        inv_id: review.inv_id,
      })
    }
  } catch (error) {
    next(error)
  }
}

/* ***************************
 *  Delete review
 * ************************** */
reviewController.deleteReview = async function (req, res, next) {
  try {
    const review_id = parseInt(req.params.review_id)
    
    const review = await reviewModel.getReviewById(review_id)
    
    if (!review) {
      req.flash("notice", "Review not found.")
      return res.redirect("/account/")
    }
    
    // Check if user owns this review or is admin
    if (review.account_id !== res.locals.accountData.account_id && res.locals.accountData.account_type !== 'Admin') {
      req.flash("notice", "You can only delete your own reviews.")
      return res.redirect("/account/")
    }
    
    const result = await reviewModel.deleteReview(review_id)
    
    if (result && result.rowCount > 0) {
      req.flash("notice", "Review deleted successfully.")
      res.redirect(`/inv/detail/${review.inv_id}`)
    } else {
      req.flash("notice", "Sorry, there was an error deleting the review.")
      res.redirect("/account/")
    }
  } catch (error) {
    next(error)
  }
}

module.exports = reviewController