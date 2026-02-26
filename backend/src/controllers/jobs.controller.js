const svc = require('../services/jobs.service');

const createJob     = async (req, res, next) => { try { res.status(201).json(await svc.createJob(req.user.sub, req.body));                                          } catch (e) { next(e); } };
const listJobs      = async (req, res, next) => { try { res.json(await svc.listJobs(req.user.sub, req.user.role, req.query));                                        } catch (e) { next(e); } };
const getNearbyJobs = async (req, res, next) => { try { res.json(await svc.getNearbyJobs(req.user.sub, req.query));                                                  } catch (e) { next(e); } };
const getJob        = async (req, res, next) => { try { res.json(await svc.getJob(req.params.id, req.user.sub, req.user.role));                                      } catch (e) { next(e); } };
const updateStatus  = async (req, res, next) => { try { res.json(await svc.updateStatus(req.params.id, req.user.sub, req.user.role, req.body.status));               } catch (e) { next(e); } };
const uploadPhotos  = async (req, res, next) => { try { res.json(await svc.uploadPhotos(req.params.id, req.user.sub, req.files));                                    } catch (e) { next(e); } };
const deleteJob     = async (req, res, next) => { try { await svc.deleteJob(req.params.id); res.sendStatus(204);                                                     } catch (e) { next(e); } };
const getMessages   = async (req, res, next) => { try { res.json(await svc.getMessages(req.params.id, req.user.sub, req.user.role, req.query));                      } catch (e) { next(e); } };
const sendMessage   = async (req, res, next) => { try { res.status(201).json(await svc.sendMessage(req.params.id, req.user.sub, req.user.role, req.body.content));   } catch (e) { next(e); } };
const rejectJob     = async (req, res, next) => { try { await svc.rejectJob(req.params.id, req.user.sub); res.sendStatus(204);                                        } catch (e) { next(e); } };
const counterOffer  = async (req, res, next) => { try { res.status(201).json(await svc.counterOffer(req.params.id, req.user.sub, req.body.price));                   } catch (e) { next(e); } };
const confirmPrice  = async (req, res, next) => { try { res.json(await svc.confirmPrice(req.params.id, req.user.sub, req.body.confirmed));                           } catch (e) { next(e); } };

module.exports = { createJob, listJobs, getNearbyJobs, getJob, updateStatus, uploadPhotos, deleteJob, getMessages, sendMessage, rejectJob, counterOffer, confirmPrice };
