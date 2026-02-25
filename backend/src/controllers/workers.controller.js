const svc = require('../services/workers.service');

const getNearby          = async (req, res, next) => { try { res.json(await svc.getNearby(req.query));                                              } catch (e) { next(e); } };
const getWorkerById      = async (req, res, next) => { try { res.json(await svc.getWorkerById(req.params.id));                                       } catch (e) { next(e); } };
const getMe              = async (req, res, next) => { try { res.json(await svc.getWorkerById(req.user.sub));                                        } catch (e) { next(e); } };
const updateAvailability = async (req, res, next) => { try { res.json(await svc.updateAvailability(req.user.sub, req.body.status));                  } catch (e) { next(e); } };
const updateLocation     = async (req, res, next) => { try { res.json(await svc.updateLocation(req.user.sub, req.body.lat, req.body.lng));           } catch (e) { next(e); } };
const getEarnings        = async (req, res, next) => { try { res.json(await svc.getEarnings(req.user.sub, req.query));                               } catch (e) { next(e); } };
const updateProfile      = async (req, res, next) => { try { res.json(await svc.updateProfile(req.user.sub, req.body));                              } catch (e) { next(e); } };

module.exports = { getNearby, getWorkerById, getMe, updateAvailability, updateLocation, getEarnings, updateProfile };
