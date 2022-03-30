

const bookModel = require('../models/bookModel')
const userModel = require('../models/userModel')
const validate = require('../validator/validators')
const reviewModel = require('../models/reviewModel')
const { default: mongoose } = require('mongoose')



/////////       CREATE BOOK      //////////

const createBook = async (req, res) => {

    try {
        let bookData = req.body
        if (!validate.isValidRequestBody(bookData)) {
            return res.status(400).send({ status: false, message: "Invalid Parameters" })
        }
        
        let { title, excerpt, userId, ISBN, category, subcategory, reviews, releasedAt } = req.body

        if (userId.toString() !== req.loggedInUser) {
            return res.status(403).send({ satus: false, msg: `Unauthorized access! Owner info doesn't match` })
        }

        if (!validate.isValid(title)) {
            return res.status(400).send({ status: false, message: "title Is Required" })
        }

        const duplicateTitle = await bookModel.findOne({ title: req.body.title })
        
        if (duplicateTitle) {
            return res.status(400).send({ status: false, message: "title is already present" })
        }

        if (!validate.isValid(excerpt)) {
            return res.status(400).send({ status: false, message: "Excerpt Is Requird" })
        }

        if (!validate.isValid(userId)) {
            return res.status(400).send({ status: false, message: "User Id required!" })
        }

        if (!validate.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid User Id!" })
        }

        const ifUserExist = await userModel.findById(userId)
        if (!ifUserExist) {
            return res.status(404).send({ status: false, message: "User Not Found, Please Check User Id" })
        }

        if (!validate.isValidISBN(ISBN)) {
            return res.status(400).send({ status: false, message: "Invalid ISBN Enterd" })
        }

        const duplicateISBN = await bookModel.findOne({ ISBN: req.body.ISBN })
        if (duplicateISBN) {
            return res.status(400).send({ status: false, message: "ISBN is already present" })
        }
        if (!validate.isValid(category)) {
            return res.status(400).send({ status: false, message: "Category Is Required" })
        }

        if (!validate.isValid(subcategory)) {
            return res.status(400).send({ status: false, message: "Subcategory Is Required" })
        }

        if (reviews) {
            if (typeof reviews !== 'number') {
                return res.status(400).send({ status: false, message: " Reviews - Unexpected Input" })
            }
        }

        if (!validate.isValidReleasedAt(releasedAt)) {
            return res.status(400).send({ status: false, message: " Please enter date in YYYY-MM-DD" })
        }

        if (req.body.isDeleted === true) {
            return res.status(400).send({ status: false, message: "No Data Should Be Deleted At The Time Of Creation" })
        }

        const newBook = await bookModel.create(bookData)
        return res.status(201).send({ status: true, message: "Success", Data: newBook })

    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }

};

//===========================================================================================


////////////            GET BOOK DETAILS           /////////////////


const getBook = async function (req, res) {
    try {
        if (Object.keys(req.query).length == 0) {
            let result = await bookModel.find({ isDeleted: false }).select({ title: 1, excerpt: 1, userId: 1, category: 1, releasedAt: 1, review: 1 })
            if (result.length != 0) {
                result.sort(function (a, b) {
                    if (a.title < b.title) return -1
                    if (a.title > b.title) return 1
                    if (a.title = b.title) return 0
                })
                return res.status(200).send({ status: true, message: "Booklist", data: result })
            }
            return res.status(404).send({ status: false, msg: "No book found" })
        }

        let bookKeys = ["userId", "category", "subCategory"]
        for (let i = 0; i < Object.keys(req.query).length; i++) {
            let keyPresent = bookKeys.includes(Object.keys(req.query)[i])
            if (!keyPresent)
                return res.status(400).send({ status: false, msg: "Wrong Key present" })
        }

        let filterDetails = req.query;
        filterDetails.isDeleted = false;

        let result = await bookModel.find(filterDetails).select({ title: 1, excerpt: 1, userId: 1, category: 1, releasedAt: 1, review: 1 })
        if (result.length != 0) {
            result.sort(function (a, b) {
                if (a.title < b.title) return -1
                if (a.title > b.title) return 1
                if (a.title = b.title) return 0
            })
            return res.status(200).send({ status: true, message: "Booklist", data: result });
        }

        return res.status(404).send({ status: false, msg: " No book data found" })
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}


// ================================================================================================


/////////////        GET  BOOK DETAILS WITH REVIEW        ////////////////////



const getBookWithreview = async (req, res) => {

    try {
        if (!validate.isValidObjectId( req.params.bookId )) {
            return res.status(400).send({ status: false, msg: "bookId is not valid" })
        }
        let tempbook = await bookModel.findOne({ _id: req.params.bookId, isDeleted: false })
        if (tempbook) {
            let reviews = await reviewModel.find({ bookId: req.params.bookId, isDeleted: false }).select({ bookId: 1, reviewedBy: 1, reviewedAt: 1, rating: 1, review: 1 })
            let reviewCount = reviews.length
            if (reviewCount > 0) {
                tempbook.reviews = reviewCount
                return res.status(200).send({
                    status: true, message: 'Book list', data: { ...tempbook.toObject(), reviewData: reviews }
                })
            }
            return res.status(200).send({
                status: true, message: 'Book list', data: { ...tempbook.toObject(), reviewData: reviews }
            })
        }
        return res.status(404).send({ status: false, msg: "book not exist" })
    } catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}


// ================================================================================================

let updateBook = async function (req, res) {
    try {
        if (!validate.isValidObjectId(book_id)) {
            return res.status(400).send({ status: false, msg: "Please enter a valid book Id" })
        }
        if (Object.keys(req.body).length == 0) {
            return res.status(400).send({ status: false, msg: "Please enter data to update" })
        }
        let validBook = await bookModel.findOne({ _id: book_id, isDeleted: false })
        if (!validBook)
            return res.status(404).send({ status: false, msg: "No book found" })

        if (validBook.userId.toString() !== req.loggedInUser) { 
            return res.status(403).send({ satus: false, msg: `Unauthorized access! Owner info doesn't match` })
        }
        let bookKeys = ["title", "excerpt", "releasedAt", "ISBN"]
        for (let i = 0; i < Object.keys(req.body).length; i++) {
            let keyPresent = bookKeys.includes(Object.keys(req.body)[i])
            if (!keyPresent)
                return res.status(400).send({ status: false, msg: "Wrong Key present" })
        }
        if (Object.keys(req.body).includes('title')) {
            if (!validate.isValid(req.body.title)) {
                return res.status(400).send({ status: false, message: "title Is Required" })
            }
            const duplicateTitle = await bookModel.findOne({ title: req.body.title })
            if (duplicateTitle)
                return res.status(400).send({ status: false, message: "title is already present" })
        }
        if (Object.keys(req.body).includes('excerpt')) {
            if (!validate.isValid(req.body.excerpt)) {
                return res.status(400).send({ status: false, message: " excerpt is not valid" })
            }
        }
        if (Object.keys(req.body).includes('ISBN')) {
            if (!validate.isValid(req.body.ISBN)) {
                return res.status(400).send({ status: false, message: " ISBN Is Required" })
            }
            if (!validate.isValidISBN(req.body.ISBN)) {
                return res.status(400).send({ status: false, message: "Invalid ISBN Enterd" })
            }
            const duplicateISBN = await bookModel.findOne({ title: req.body.ISBN })
            if (duplicateISBN)
                return res.status(400).send({ status: false, message: "ISBN is already present" })
        }
        if (Object.keys(req.body).includes('releasedAt')) {
            if (!validate.isValidReleasedAt(req.body.releasedAt)) {
                return res.status(400).send({ status: false, message: " Please enter date in YYYY-MM-DD" })
            }
        }
        let updatedBook = await bookModel.findOneAndUpdate(
            { _id: book_id, isDeleted: false },
            { $set: req.body },
            { new: true });

        return res.status(200).send({ status: true, message: "success", data: updatedBook });
    } catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}



////////////   BOOK DELETED BY ID    //////////////////////


const deletedById = async function (req, res) {
    try {
        if (!validate.isValidObjectId(req.params.bookId)) {
            return res.status(400).send({ status: false, msg: "Book id is not valid" })
        }

        let filterDetails = {
            isDeleted: false,
            _id: req.params.bookId
        }

        const book = await bookModel.findOne(filterDetails)
        if (!book) {
            return res.status(404).send({ status: false, msg: 'Book not found' })
        }
        if (book.userId.toString() != req.loggedInUser) {
            return res.status(403).send({ satus: false, msg: `Unauthorized access! Owner info doesn't match` })

        }
        const deletedBook = await bookModel.findOneAndUpdate(filterDetails, { isDeleted: true, deletedAt: new Date() })

        if (deletedBook) {
            await reviewModel.updateMany({ bookId: req.params.bookId }, { isDeleted: true, deletedAt: new Date() })
            return res.status(200).send({ status: true, msg: 'Book is successfully deleted' })
        }

    } catch (err) {
        console.log(err)
        res.status(500).send({ satus: false, err: err.message })
    }
}


module.exports.createBook = createBook

module.exports.getBook = getBook

module.exports.getBookWithreview = getBookWithreview

module.exports.updateBook = updateBook

module.exports.deletedById = deletedById
