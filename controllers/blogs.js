const router = require('express').Router();
const { Op } = require('sequelize');
const { sequelize } = require('../util/db');
const jwt = require('jsonwebtoken');
const { Blog, User } = require('../models');
const { SECRET } = require('../util/config');

router.get('/', async (req, res) => {
  const where = {};
  if (req.query.search) {
    where[Op.or] = [
      { title: { [Op.substring]: req.query.search } },
      { author: { [Op.substring]: req.query.search } },
    ];
  }
  const blogs = await Blog.findAll({
    order: [['likes', 'DESC']],
    attributes: { exclude: ['userId'] },
    include: {
      model: User,
      attributes: ['name'],
    },
    where,
  });
  res.json(blogs);
});

const tokenExtractor = (req, res, next) => {
  const authorization = req.get('authorization');
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    try {
      req.decodedToken = jwt.verify(authorization.substring(7), SECRET);
    } catch {
      return res.status(401).json({ error: 'token invalid' });
    }
  } else {
    return res.status(401).json({ error: 'token missing' });
  }
  next();
};

router.post('/', tokenExtractor, async (req, res) => {
  try {
    const user = await User.findByPk(req.decodedToken.id);
    const blog = await Blog.create({
      ...req.body,
      userId: user.id,
      date: new Date(),
    });
    res.json(blog);
  } catch (error) {
    return res.status(400).json({ error });
  }
});

const blogFinder = async (req, res, next) => {
  req.blog = await Blog.findByPk(req.params.id);
  next();
};

router.get('/:id', blogFinder, async (req, res, next) => {
  if (req.blog) {
    const user = User.findOne(req.user.name);
    if (req.blog.user.name === user) res.json(req.blog);
  } else {
    res.status(404).end();
  }
});

router.delete('/:id', tokenExtractor, blogFinder, async (req, res) => {
  if (!req.blog) {
    return res.status(404).json({ error: 'Blog not found' });
  }
  if (req.blog.userId !== req.decodedToken.id) {
    return res
      .status(403)
      .json({ error: 'You are not authorized to delete this blog' });
  }
  try {
    await req.blog.destroy();
    res.status(204).end();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete blog' });
  }
});

router.put('/:id', blogFinder, async (req, res) => {
  if (req.blog) {
    req.blog.likes = req.body.likes;
    await req.blog.save();
    res.json(req.blog);
  } else {
    res.status(404).end();
  }
});

module.exports = router;
