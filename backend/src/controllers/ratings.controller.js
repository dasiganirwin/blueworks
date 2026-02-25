const svc = require('../services/ratings.service');

const submitRating = async (req, res, next) => {
  try {
    const data = await svc.submitRating(req.params.id, req.user.sub, req.user.role, req.body);
    res.status(201).json(data);
  } catch (e) { next(e); }
};

const getMyRating = async (req, res, next) => {
  try {
    const data = await svc.getMyRating(req.params.id, req.user.sub);
    res.json(data);
  } catch (e) { next(e); }
};

module.exports = { submitRating, getMyRating };
