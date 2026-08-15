const Category = require('../models/category');

module.exports = {

    getCreateBill: async (req, res) => {
        try {
            const allCategories = await Category.find().sort({ categoryName: 1 });
            res.render('admin/createBill', {
                allCategories: allCategories,
                layout: 'layouts/adminLayout',
                script: ''
            });
        } catch (err) {
            console.log(err);
            res.redirect('/admin');
        }
    },

    getCreateBarcode: async (req, res) => {
        try {
            const allCategories = await Category.find().sort({ categoryName: 1 });
            res.render('admin/createBarcode', {
                allCategories: allCategories,
                layout: 'layouts/adminLayout',
                script: ''
            });
        } catch (err) {
            console.log(err);
            res.redirect('/admin');
        }
    }
};
