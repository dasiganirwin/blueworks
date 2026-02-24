const svc = require('../services/notifications.service');

const listNotifications = async (req, res, next) => { try { res.json(await svc.list(req.user.sub, req.query));               } catch (e) { next(e); } };
const markRead          = async (req, res, next) => { try { res.json(await svc.markRead(req.params.id, req.user.sub));        } catch (e) { next(e); } };
const markAllRead       = async (req, res, next) => { try { res.json(await svc.markAllRead(req.user.sub));                    } catch (e) { next(e); } };

module.exports = { listNotifications, markRead, markAllRead };
