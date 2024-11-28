const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');

// 创建新类别
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const newCategory = new Category({ name, description });
    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    console.error('Create Category Error:', error);
    res.status(400).json({ message: 'Create Category Error', error: error.message });
  }
};

// 获取所有类别
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true });
    res.json(categories);
  } catch (error) {
    console.error('Get All Categories Error:', error);
    res.status(500).json({ message: 'Get All Categories Error', error: error.message });
  }
};

// 更新类别
exports.updateCategory = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description, isActive },
      { new: true }
    );
    if (!updatedCategory) {
      return res.status(404).json({ message: 'Category Not Found' });
    }
    res.json(updatedCategory);
  } catch (error) {
    console.error('Update Category Error:', error);
    res.status(400).json({ message: 'Update Category Error', error: error.message });
  }
};

// 删除类别
exports.deleteCategory = async (req, res) => {
  try {
    // 检查是否有菜品使用此类别
    const menuItemsCount = await MenuItem.countDocuments({ category: req.params.id });
    if (menuItemsCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete this category, as there are dishes using it',
        menuItemsCount
      });
    }

    const deletedCategory = await Category.findByIdAndDelete(req.params.id);
    if (!deletedCategory) {
      return res.status(404).json({ message: 'Category Not Found' });
    }
    res.json({ message: 'Category Deleted Successfully' });
  } catch (error) {
    console.error('Delete Category Error:', error);
    res.status(500).json({ message: 'Delete Category Error', error: error.message });
  }
}; 