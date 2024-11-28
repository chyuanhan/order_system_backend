const MenuItem = require('../models/MenuItem');
const fs = require('fs').promises;
const path = require('path');
const Category = require('../models/Category');

// get all menu items
exports.getAllMenu = async (req, res) => {
  try {
    const menuItems = await MenuItem.find()
      .populate('category', 'name')  // fill category information
      .sort({ createdAt: -1 });

    res.json({
      items: menuItems,
      categories: await Category.find().select('name')
    });
  } catch (error) {
    console.error('Failed to get menu items:', error);
    res.status(500).json({ message: 'Failed to get menu items', error: error.message });
  }
};

// create new menu item
exports.createMenu = async (req, res) => {
  try {
    const { name, description, price, category } = req.body;

    // validate category exists
    const existingCategory = await Category.findById(category);
    if (!existingCategory) {
      return res.status(400).json({ message: 'category not found' });
    }

    const imagePath = req.file ?
      path.join('uploads/images', req.file.filename).replace(/\\/g, '/') : null;

    const newMenuItem = new MenuItem({
      name,
      description,
      price: parseFloat(price),
      category,
      image: imagePath
    });

    const savedMenuItem = await newMenuItem.save();

    // fill category information and return
    const populatedMenuItem = await MenuItem.findById(savedMenuItem._id)
      .populate('category', 'name');


    res.status(201).json(populatedMenuItem);
  } catch (error) {
    // if save failed and there is an uploaded file, delete the file
    if (req.file) {
      const filePath = path.join(__dirname, '..', 'uploads/images', req.file.filename);
      await fs.unlink(filePath).catch(console.error);
    }

    console.error('Failed to create menu item:', error);
    res.status(400).json({ message: 'Failed to create menu item', error: error.message });
  }
};

// get specific menu item details
exports.getMenuById = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id, 'id name description price category');
    if (!menuItem) {
      return res.status(404).json({ message: 'menu item not found' });
    }
    res.json(menuItem);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get menu item details', error: error.message });
  }
};

// update menu item information
exports.updateMenuById = async (req, res) => {
  try {
    const { name, description, price, category } = req.body;
    const updateData = { name, description, price, category };

    // if there is a new image uploaded
    if (req.file) {
      updateData.image = path.join('uploads/images', req.file.filename).replace(/\\/g, '/');

      // get old image path and delete
      const oldMenuItem = await MenuItem.findById(req.params.id);
      if (oldMenuItem && oldMenuItem.image) {
        const oldImagePath = path.join(__dirname, '..', oldMenuItem.image);
        await fs.unlink(oldImagePath).catch(error => {
          console.error('Failed to delete old image:', error);
        });
      }
    }

    const updatedMenuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedMenuItem) {
      return res.status(404).json({ message: 'menu item not found' });
    }


    res.json({
      ...updatedMenuItem.toObject(),
      image: updatedMenuItem.image
    });

  } catch (error) {
    // if update failed and there is an uploaded file, delete the file
    if (req.file) {
      const filePath = path.join(__dirname, '..', 'uploads/images', req.file.filename);
      await fs.unlink(filePath).catch(console.error);
    }

    console.error('Failed to update menu item:', error);
    res.status(400).json({ message: 'Failed to update menu item', error: error.message });
  }
};

// delete menu item
exports.deleteMenuById = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ message: 'menu item not found' });
    }

    // delete associated image file
    if (menuItem.imageUrl) {
      await fs.unlink(menuItem.imageUrl).catch(console.error);
    }

    await menuItem.deleteOne();
    res.json({ message: 'menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ message: 'Failed to delete menu item', error: error.message });
  }
};
